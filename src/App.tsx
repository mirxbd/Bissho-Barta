import { useState, useEffect } from 'react';
import Header from './components/Header';
import FeedTab from './components/FeedTab';
import FriendsTab from './components/FriendsTab';
import MessagesTab from './components/MessagesTab';
import WatchTab from './components/WatchTab';
import NotificationsTab from './components/NotificationsTab';
import ProfileTab from './components/ProfileTab';
import SearchTab from './components/SearchTab';
import ToolsMenuDrawer from './components/ToolsMenuDrawer';
import PublicProfileModal from './components/PublicProfileModal';
import AppLogo from './components/AppLogo';
import { useAppState } from './hooks/useAppState';
import { PublicUserProfile } from './types';
import { Home, Users, MessageSquare, Play, Bell, User, Flame, Coffee, Compass, Settings, AlertCircle, Sparkles, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const {
    profile,
    posts,
    watchPosts,
    stories,
    friends,
    conversations,
    notifications,
    searchQuery,
    setSearchQuery,
    searchSource,
    setSearchSource,
    addPost,
    likePost,
    addComment,
    deletePost,
    handleFriendAction,
    sendMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    updateUserProfile,
    viewStory,
    unreadNotificationsCount,
    unreadMessagesCount
  } = useAppState();

  const [activeTab, setActiveTab] = useState(0);
  const [chattingFriendId, setChattingFriendId] = useState<string | null>(null);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('nightMode') === 'true') {
      document.documentElement.classList.add('dark');
    }
    const handleNightModeChange = (e: any) => {
      if (e.detail) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    window.addEventListener('nightmode-setting-changed', handleNightModeChange);
    return () => window.removeEventListener('nightmode-setting-changed', handleNightModeChange);
  }, []);

  const [viewingPublicProfile, setViewingPublicProfile] = useState<PublicUserProfile | null>(null);

  // Open public profile details modal for any user
  const handleViewProfile = (name: string, avatar?: string, id?: string) => {
    // If viewing current user's profile
    if (name.toLowerCase() === profile.name.toLowerCase()) {
      setViewingPublicProfile({
        id: 'my-profile',
        name: profile.name,
        avatar: profile.avatar,
        coverPhoto: profile.coverPhoto,
        bio: profile.bio,
        location: profile.location,
        work: profile.work,
        education: profile.education,
        relationship: profile.relationship,
        friendsCount: friends.filter(f => f.status === 'friend').length,
        followersCount: profile.followersCount || 1420,
        followingCount: profile.followingCount || 230,
        isOnline: true,
        status: 'none',
        joinedDate: 'Joined Bissho Barta in 2023',
        verified: true,
        photos: [
          profile.avatar,
          profile.coverPhoto,
          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80",
          "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80"
        ]
      });
      return;
    }

    // Check if user exists in friends list
    const friend = friends.find(
      f => (id && f.id === id) || f.name.toLowerCase() === name.toLowerCase()
    );

    const fallbackCover = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80";

    const publicProfile: PublicUserProfile = {
      id: friend?.id || id || `user-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name: name,
      avatar: avatar || friend?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
      coverPhoto: fallbackCover,
      bio: friend 
        ? `Connected on Bissho Barta. Sharing thoughts, moments, and public updates with friends.` 
        : `Active member on Bissho Barta. Connecting worldwide.`,
      location: "Dhaka, Bangladesh",
      work: "Community Contributor at Bissho Barta",
      education: "University of Dhaka",
      relationship: "Single",
      mutualFriends: friend?.mutualFriends || 5,
      friendsCount: 218,
      followersCount: 540,
      followingCount: 180,
      isOnline: friend?.isOnline ?? true,
      status: friend ? friend.status : 'none',
      joinedDate: 'Joined Bissho Barta in 2024',
      photos: [
        avatar || friend?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
        fallbackCover,
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80"
      ]
    };

    setViewingPublicProfile(publicProfile);
  };

  // Start chat with user from public profile
  const handleStartMessage = (userName: string, userAvatar?: string, friendId?: string) => {
    setViewingPublicProfile(null);
    const targetId = friendId || friends.find(f => f.name.toLowerCase() === userName.toLowerCase())?.id;
    if (targetId) {
      setChattingFriendId(targetId);
      setActiveTab(2); // Messages tab
    } else {
      setActiveTab(2);
    }
  };

  // Helper to jump to Profile tab
  const handleProfileClick = () => {
    setActiveTab(5); // Index 5 is Profile tab
  };

  // Trigger quick interactive shortcuts
  const handleShortcutClick = (name: string) => {
    setShortcutToast(`Shortcut "${name}" clicked! Showing relevant content.`);
    setTimeout(() => setShortcutToast(null), 3000);
  };

  // Calculate numbers
  const pendingRequestsCount = friends.filter(f => f.status === 'pending_incoming').length;

  return (
    <div className="bg-[#F0F2F5] min-h-screen flex flex-col font-sans text-gray-800 selection:bg-[#EBF7F2] select-none" id="app-viewport-wrapper">
      
      {/* GLOBAL TOAST */}
      <AnimatePresence>
        {shortcutToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-18 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 border border-gray-700 font-semibold"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>{shortcutToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOOLS & MENU DRAWER */}
      <ToolsMenuDrawer
        isOpen={isToolsDrawerOpen}
        onClose={() => setIsToolsDrawerOpen(false)}
        profile={profile}
        updateUserProfile={updateUserProfile}
        activeTab={activeTab}
        onNavigateTab={(tabId) => {
          setActiveTab(tabId);
          if (tabId !== 2) setChattingFriendId(null);
        }}
        onShowToast={(msg) => {
          setShortcutToast(msg);
          setTimeout(() => setShortcutToast(null), 3000);
        }}
      />

      {/* Header is full-width across both Mobile and Desktop */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 2) setChattingFriendId(null);
          setIsToolsDrawerOpen(false);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onProfileClick={() => {
          handleProfileClick();
          setIsToolsDrawerOpen(false);
        }}
        userAvatar={profile.avatar}
        onOpenToolsDrawer={() => setIsToolsDrawerOpen(prev => !prev)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchSource={searchSource}
        setSearchSource={setSearchSource}
      />

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="w-full max-w-7xl mx-auto px-0 md:px-4 lg:py-6 flex-1 lg:grid lg:grid-cols-12 lg:gap-6 items-start" id="responsive-app-body">
        
        {/* Left Navigation Bento Card - Desktop only */}
        <nav className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl p-4 border border-gray-200 flex-col gap-2 shadow-xs sticky top-20 h-fit" id="desktop-left-navigation">
          
          {/* Bissho Barta Brand Header & Logo */}
          <div
            onClick={() => setActiveTab(0)}
            className="p-3 mb-1 bg-linear-to-r from-[#0C342C] to-[#076653] rounded-xl flex items-center justify-between cursor-pointer hover:opacity-95 transition-all shadow-xs"
            id="desktop-sidebar-brand-header"
            title="Bissho Barta Home"
          >
            <div className="flex items-center gap-2.5">
              <AppLogo size="sm" showText={false} />
              <div className="flex flex-col">
                <span className="font-black text-sm text-white tracking-tight leading-tight">
                  Bissho <span className="text-[#E3EF26]">Barta</span>
                </span>
                <span className="text-[9px] text-emerald-200/80 font-medium">World News & Social</span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-[#E3EF26]/20 text-[#E3EF26] px-1.5 py-0.5 rounded-full border border-[#E3EF26]/30">Live</span>
          </div>

          {/* User Profile item */}
          <div 
            onClick={() => setActiveTab(5)} 
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 ${
              activeTab === 5 
                ? 'bg-[#EBF7F2] text-[#076653] font-semibold border-l-4 border-[#076653]' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            id="desktop-left-profile-link"
          >
            <img 
              src={profile.avatar} 
              className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-xs shrink-0" 
              alt="" 
              referrerPolicy="no-referrer"
            />
            <span className="text-sm truncate font-semibold">{profile.name}</span>
          </div>

          {/* Quick ||| Menu & Tools Drawer Trigger */}
          <button
            onClick={() => setIsToolsDrawerOpen(prev => !prev)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#EBF7F2] text-[#0C342C] font-bold transition-all cursor-pointer border border-gray-200 shadow-2xs group"
            id="desktop-left-tools-menu-btn"
          >
            <span className="font-mono font-black text-[#0C342C] group-hover:text-[#076653] text-base leading-none group-hover:scale-105 transition-transform">|||</span>
            <span className="text-xs">Menu & Platform Tools</span>
          </button>

          {/* Navigation links mapped directly to tabs */}
          {[
            { id: 0, label: 'Home Feed', icon: Home, badge: 0 },
            { id: 6, label: 'Search', icon: Search, badge: 0 },
            { id: 3, label: 'Videos & Watch', icon: Play, badge: 0 },
            { id: 4, label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
            { id: 2, label: 'Bissho Barta Chat', icon: MessageSquare, badge: unreadMessagesCount },
            { id: 1, label: 'Friends Requests', icon: Users, badge: pendingRequestsCount }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 2) setChattingFriendId(null);
                }}
                className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-150 text-left cursor-pointer ${
                  isActive 
                    ? 'bg-[#EBF7F2] text-[#076653] font-bold border-l-4 border-[#076653]' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
                id={`desktop-left-tab-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-[#0C342C] text-[#E3EF26] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#E3EF26]/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Shortcuts separator */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Your Shortcuts</h3>
            
            <div 
              onClick={() => handleShortcutClick('Daily Coffee Lovers')}
              className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
              id="shortcut-coffee-btn"
            >
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shadow-xs shrink-0 text-base">☕</div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800">Daily Coffee Lovers</span>
                <span className="text-[10px] text-gray-400 truncate">12.4k members · 3 new posts</span>
              </div>
            </div>

            <div 
              onClick={() => handleShortcutClick('Hikers of Oregon')}
              className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
              id="shortcut-hikers-btn"
            >
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shadow-xs shrink-0 text-base">⛺</div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800">Hikers of Oregon</span>
                <span className="text-[10px] text-gray-400 truncate">Active now · 42 members online</span>
              </div>
            </div>

            <div 
              onClick={() => handleShortcutClick('Esports Hub')}
              className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
              id="shortcut-esports-btn"
            >
              <div className="w-8 h-8 bg-[#EBF7F2] rounded-lg flex items-center justify-center text-[#076653] shadow-xs shrink-0 text-base">🎮</div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800">Esports Hub</span>
                <span className="text-[10px] text-gray-400 truncate">New event posted today!</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Central Active Feed Section - adaptive max width for desktop, standard frame size for mobile */}
        <div className="col-span-12 lg:col-span-6 w-full max-w-md lg:max-w-none mx-auto bg-white lg:rounded-2xl border-x lg:border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-56px)] lg:min-h-[750px]" id="bissho-barta-app-frame">

          {/* Desktop Header subtitle banner (Hidden on Mobile) */}
          <div className="hidden lg:flex p-4 border-b border-gray-100 bg-gray-50/50 justify-between items-center shrink-0">
            <h2 className="font-bold text-gray-900 text-sm tracking-tight">
              {activeTab === 0 && 'News Feed'}
              {activeTab === 1 && 'Friends & Requests'}
              {activeTab === 2 && 'Bissho Barta Chat'}
              {activeTab === 3 && 'Videos & Watch'}
              {activeTab === 4 && 'Notifications'}
              {activeTab === 5 && 'Your Profile'}
              {activeTab === 6 && (searchSource === 'web' ? 'Web Search (Google Data)' : 'Search Bissho Barta (Public Posts & Social)')}
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-[#076653] bg-[#EBF7F2] border border-[#076653]/20 px-2 py-1 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Bissho Barta Connected</span>
            </div>
          </div>

          {/* Active Tab viewport */}
          <main className="flex-1 flex flex-col overflow-y-auto max-h-[calc(100vh-112px)] lg:max-h-[calc(100vh-160px)]" id="main-content-viewport">
            {activeTab === 0 && (
              <FeedTab
                posts={posts}
                profile={profile}
                friends={friends}
                searchQuery={searchQuery}
                addPost={addPost}
                likePost={likePost}
                addComment={addComment}
                deletePost={deletePost}
                onViewProfile={handleViewProfile}
              />
            )}

            {activeTab === 1 && (
              <FriendsTab
                friends={friends}
                searchQuery={searchQuery}
                handleFriendAction={handleFriendAction}
                setActiveTab={setActiveTab}
                setChattingFriendId={setChattingFriendId}
                onViewProfile={handleViewProfile}
              />
            )}

            {activeTab === 2 && (
              <MessagesTab
                conversations={conversations}
                sendMessage={sendMessage}
                searchQuery={searchQuery}
                chattingFriendId={chattingFriendId}
                setChattingFriendId={setChattingFriendId}
                onViewProfile={handleViewProfile}
              />
            )}

            {activeTab === 3 && (
              <WatchTab
                watchPosts={watchPosts}
                profile={profile}
                likePost={likePost}
                addComment={addComment}
                onViewProfile={handleViewProfile}
              />
            )}

            {activeTab === 4 && (
              <NotificationsTab
                notifications={notifications}
                markNotificationAsRead={markNotificationAsRead}
                markAllNotificationsAsRead={markAllNotificationsAsRead}
                clearNotification={clearNotification}
                setActiveTab={setActiveTab}
                unreadMessagesCount={unreadMessagesCount}
                pendingRequestsCount={pendingRequestsCount}
                onViewProfile={handleViewProfile}
              />
            )}

            {activeTab === 5 && (
              <ProfileTab
                profile={profile}
                posts={posts}
                updateUserProfile={updateUserProfile}
                likePost={likePost}
                addComment={addComment}
                deletePost={deletePost}
                addPost={addPost}
                onViewProfile={handleViewProfile}
              />
            )}

            {activeTab === 6 && (
              <SearchTab
                posts={posts}
                watchPosts={watchPosts}
                friends={friends}
                conversations={conversations}
                profile={profile}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchSource={searchSource}
                setSearchSource={setSearchSource}
                setActiveTab={setActiveTab}
                setChattingFriendId={setChattingFriendId}
                likePost={likePost}
                addComment={addComment}
                onViewProfile={handleViewProfile}
              />
            )}
          </main>
        </div>

        {/* Right Contacts Sidebar - Desktop only */}
        <aside className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl p-4 border border-gray-200 flex flex-col gap-4 shadow-xs sticky top-20 h-fit" id="desktop-right-contacts">
          {/* Contacts list Header */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Contacts</h3>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              {friends.filter(f => f.status === 'friend').length} Active
            </span>
          </div>

          {/* Contacts list items */}
          <div className="flex flex-col gap-1 max-h-[350px] overflow-y-auto pr-1" id="desktop-contacts-list">
            {friends.filter(f => f.status === 'friend').length === 0 ? (
              <span className="text-xs text-gray-400 p-2 text-center block">No active friends yet. Accept requests in Friends tab!</span>
            ) : (
              friends.filter(f => f.status === 'friend').map((friend) => (
                <div 
                  key={friend.id} 
                  onClick={() => {
                    setChattingFriendId(friend.id);
                    setActiveTab(2); // open messages tab
                  }}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group"
                  id={`desktop-contact-${friend.id}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={friend.avatar} 
                        alt="" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(friend.name, friend.avatar, friend.id);
                        }}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-xs cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all" 
                        title={`View ${friend.name}'s profile`}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProfile(friend.name, friend.avatar, friend.id);
                      }}
                      className="text-xs font-semibold text-gray-700 truncate cursor-pointer hover:text-[#076653] hover:underline"
                      title={`View ${friend.name}'s profile`}
                    >
                      {friend.name}
                    </span>
                  </div>
                  <div className="w-7 h-7 bg-[#EBF7F2] text-[#076653] rounded-full flex items-center justify-center hover:bg-[#076653] hover:text-[#E3EF26] transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Friend Request box at the bottom */}
          {friends.some(f => f.status === 'pending_incoming') && (
            <div className="mt-2 p-3.5 bg-[#F2FAF6] rounded-xl border border-[#076653]/20 shadow-xs animate-fade-in" id="desktop-right-friend-request-box">
              <p className="text-xs text-[#076653] font-bold mb-1.5 flex items-center gap-1">
                <span>New Friend Request</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26] border border-[#076653] animate-ping"></span>
              </p>
              {(() => {
                const req = friends.find(f => f.status === 'pending_incoming');
                if (!req) return null;
                return (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <img 
                        src={req.avatar} 
                        alt=""
                        onClick={() => handleViewProfile(req.name, req.avatar, req.id)}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all" 
                        title={`View ${req.name}'s profile`}
                        referrerPolicy="no-referrer" 
                      />
                      <div className="flex flex-col min-w-0">
                        <span 
                          onClick={() => handleViewProfile(req.name, req.avatar, req.id)}
                          className="text-xs font-semibold text-gray-800 truncate cursor-pointer hover:text-[#076653] hover:underline"
                          title={`View ${req.name}'s profile`}
                        >
                          {req.name}
                        </span>
                        <span className="text-[9px] text-gray-400">Wants to be friends</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleFriendAction(req.id, 'accept')}
                        className="flex-1 bg-[#076653] hover:bg-[#0C342C] text-[#E3EF26] text-[10px] font-bold py-1.5 rounded transition-colors shadow-xs cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => handleFriendAction(req.id, 'decline')}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold py-1.5 rounded transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </aside>

      </div>

      {/* PUBLIC PROFILE MODAL POPUP */}
      {viewingPublicProfile && (
        <PublicProfileModal
          userProfile={viewingPublicProfile}
          onClose={() => setViewingPublicProfile(null)}
          currentUserProfile={profile}
          friends={friends}
          posts={posts}
          handleFriendAction={handleFriendAction}
          onStartMessage={handleStartMessage}
          onViewProfile={handleViewProfile}
          onNavigateToMyProfile={() => {
            setViewingPublicProfile(null);
            setActiveTab(5);
          }}
          likePost={likePost}
          addComment={addComment}
        />
      )}
    </div>
  );
}
