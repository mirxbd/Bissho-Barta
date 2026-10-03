import { useMemo, useState } from 'react';
import { Friend } from '../types';
import { UserCheck, UserPlus, UserX, MessageSquare, Search } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface FriendsTabProps {
  friends: Friend[];
  searchQuery: string;
  handleFriendAction: (friendId: string, action: 'accept' | 'decline' | 'add' | 'remove') => void;
  setActiveTab: (tab: number) => void;
  setChattingFriendId: (id: string | null) => void;
  onStartMessage?: (userName: string, userAvatar?: string, friendId?: string) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

export default function FriendsTab({
  friends,
  searchQuery,
  handleFriendAction,
  setActiveTab,
  setChattingFriendId,
  onStartMessage,
  onViewProfile
}: FriendsTabProps) {
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  // Separate and filter friends using memoization
  const { filteredPending, filteredSent, filteredSuggestions, filteredActive, pendingIncomingCount, sentOutgoingCount, activeFriendsCount } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const matches = (f: Friend) => !q || f.name.toLowerCase().includes(q);

    const pendingIncoming = friends.filter(f => f.status === 'pending_incoming');
    const sentOutgoing = friends.filter(f => f.status === 'pending_outgoing');
    const suggestions = friends.filter(f => f.status === 'none');
    const activeFriends = friends.filter(f => f.status === 'friend');

    return {
      filteredPending: pendingIncoming.filter(matches),
      filteredSent: sentOutgoing.filter(matches),
      filteredSuggestions: suggestions.filter(matches),
      filteredActive: activeFriends.filter(matches),
      pendingIncomingCount: pendingIncoming.length,
      sentOutgoingCount: sentOutgoing.length,
      activeFriendsCount: activeFriends.length
    };
  }, [friends, searchQuery]);

  const startChatting = (friend: Friend) => {
    if (onStartMessage) {
      onStartMessage(friend.name, friend.avatar, friend.id);
    } else {
      setChattingFriendId(friend.id);
      setActiveTab(2);
    }
  };

  return (
    <div className="bg-[#F0F2F5] lg:bg-transparent min-h-[calc(100vh-112px)] lg:min-h-0 pb-4 lg:pb-4 select-none font-sans" id="friends-tab-container">
      {/* Search status summary if searching */}
      {searchQuery && (
        <div className="bg-[#EBF7F2] border-b border-[#076653]/20 p-2.5 text-xs text-[#076653] font-medium">
          Showing search results for "{searchQuery}"
        </div>
      )}

      {/* FRIEND REQUESTS SECTION */}
      {filteredPending.length > 0 && (
        <div className="bg-white p-3 border-b border-gray-200 mt-2" id="friend-requests-section">
          <div className="flex justify-between items-center mb-2.5">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Friend Requests ({pendingIncomingCount})
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {filteredPending.map((request) => (
              <div key={request.id} className="flex gap-3 items-center" id={`friend-request-row-${request.id}`}>
                <img 
                  src={request.avatar} 
                  alt={request.name} 
                  onClick={() => onViewProfile?.(request.name, request.avatar, request.id)}
                  className="w-14 h-14 rounded-md object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                  title={`View ${request.name}'s profile`}
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 
                    onClick={() => onViewProfile?.(request.name, request.avatar, request.id)}
                    className="text-xs font-bold text-gray-900 truncate cursor-pointer hover:text-[#076653] hover:underline"
                    title={`View ${request.name}'s profile`}
                  >
                    {request.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 leading-normal mt-0.5">{request.mutualFriends} mutual friends</p>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => handleFriendAction(request.id, 'accept')}
                      className="bg-[#076653] hover:bg-[#0C342C] text-[#E3EF26] text-[10px] font-bold px-4 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
                      id={`accept-request-btn-${request.id}`}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleFriendAction(request.id, 'decline')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold px-4 py-1.5 rounded border border-gray-200 cursor-pointer"
                      id={`decline-request-btn-${request.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SENT FRIEND REQUESTS SECTION */}
      {filteredSent.length > 0 && (
        <div className="bg-white p-3 border-b border-gray-200 mt-2" id="sent-requests-section">
          <div className="flex justify-between items-center mb-2.5">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Sent Requests ({sentOutgoingCount})
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {filteredSent.map((request) => (
              <div key={request.id} className="flex gap-3 items-center" id={`sent-request-row-${request.id}`}>
                <img 
                  src={request.avatar} 
                  alt={request.name} 
                  onClick={() => onViewProfile?.(request.name, request.avatar, request.id)}
                  className="w-12 h-12 rounded-md object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                  title={`View ${request.name}'s profile`}
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 
                    onClick={() => onViewProfile?.(request.name, request.avatar, request.id)}
                    className="text-xs font-bold text-gray-900 truncate cursor-pointer hover:text-[#076653] hover:underline"
                    title={`View ${request.name}'s profile`}
                  >
                    {request.name}
                  </h3>
                  <p className="text-[10px] text-gray-500">Request pending approval</p>
                </div>
                <div>
                  <button
                    onClick={() => handleFriendAction(request.id, 'remove')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-semibold px-3 py-1.5 rounded border border-gray-200 flex items-center gap-1.5 cursor-pointer"
                    id={`cancel-sent-request-btn-${request.id}`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PEOPLE YOU MAY KNOW / SUGGESTIONS SECTION */}
      {filteredSuggestions.length > 0 && (
        <div className="bg-white p-3 border-y border-gray-200 mt-2" id="friend-suggestions-section">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2.5">
            People You May Know
          </h2>
          <div className="flex flex-col gap-3">
            {filteredSuggestions.map((suggestion) => {
              return (
                <div key={suggestion.id} className="flex gap-3 items-center" id={`friend-suggestion-row-${suggestion.id}`}>
                  <img 
                    src={suggestion.avatar} 
                    alt={suggestion.name} 
                    onClick={() => onViewProfile?.(suggestion.name, suggestion.avatar, suggestion.id)}
                    className="w-12 h-12 rounded-md object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                    title={`View ${suggestion.name}'s profile`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 
                      onClick={() => onViewProfile?.(suggestion.name, suggestion.avatar, suggestion.id)}
                      className="text-xs font-bold text-gray-900 truncate cursor-pointer hover:text-[#076653] hover:underline"
                      title={`View ${suggestion.name}'s profile`}
                    >
                      {suggestion.name}
                    </h3>
                    <p className="text-[10px] text-gray-500">{suggestion.mutualFriends} mutual friends</p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleFriendAction(suggestion.id, 'add')}
                      className="bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] text-[10px] font-bold px-3 py-1.5 rounded border border-[#076653]/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                      id={`add-friend-btn-${suggestion.id}`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL FRIENDS LIST */}
      <div className="bg-white p-3 border-y border-gray-200 mt-2" id="all-friends-list-section">
        <div className="flex justify-between items-center mb-2.5">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            Your Friends ({activeFriendsCount})
          </h2>
        </div>

        {filteredActive.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs">
            {searchQuery ? 'No matching friends found.' : 'Your friend list is empty.'}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {filteredActive.map((friend) => (
              <div key={friend.id} className="flex gap-3 py-3 items-center justify-between first:pt-0 last:pb-0" id={`active-friend-row-${friend.id}`}>
                <div className="flex gap-3 items-center min-w-0">
                  <div className="relative">
                    <img 
                      src={friend.avatar} 
                      alt={friend.name} 
                      onClick={() => onViewProfile?.(friend.name, friend.avatar, friend.id)}
                      className="w-11 h-11 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                      title={`View ${friend.name}'s profile`}
                      referrerPolicy="no-referrer"
                    />
                    {friend.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#076653] border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 
                      onClick={() => onViewProfile?.(friend.name, friend.avatar, friend.id)}
                      className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5 cursor-pointer hover:text-[#076653] hover:underline"
                      title={`View ${friend.name}'s profile`}
                    >
                      {friend.name}
                    </h3>
                    <p className="text-[9px] text-gray-400">{friend.isOnline ? 'Active Now' : 'Offline'}</p>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => startChatting(friend)}
                    className="p-1.5 text-[#076653] hover:bg-[#EBF7F2] rounded border border-gray-200 transition-colors"
                    title="Send Message"
                    id={`chat-friend-btn-${friend.id}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFriendToRemove(friend)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded border border-gray-200 cursor-pointer"
                    title="Remove Friend"
                    id={`remove-friend-btn-${friend.id}`}
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(friendToRemove)}
        title="Unfriend User"
        message={friendToRemove ? `Are you sure you want to unfriend ${friendToRemove.name}?` : ''}
        confirmLabel="Unfriend"
        onConfirm={() => {
          if (friendToRemove) {
            handleFriendAction(friendToRemove.id, 'remove');
            setFriendToRemove(null);
          }
        }}
        onCancel={() => setFriendToRemove(null)}
      />
    </div>
  );
}
