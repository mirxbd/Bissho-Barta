import { useState, useEffect, useMemo } from 'react';
import { Notification } from '../types';
import { Heart, MessageCircle, UserPlus, Check, Trash2, BellOff, ArrowRight, Pin, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationsTabProps {
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
  setActiveTab: (tab: number) => void;
  unreadMessagesCount?: number;
  pendingRequestsCount: number;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

export default function NotificationsTab({
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  setActiveTab,
  unreadMessagesCount,
  pendingRequestsCount,
  onViewProfile
}: NotificationsTabProps) {
  const [pinnedNotifIds, setPinnedNotifIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('adda_pinned_notifs') || localStorage.getItem('fb_lite_pinned_notifs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('adda_pinned_notifs', JSON.stringify(pinnedNotifIds));
  }, [pinnedNotifIds]);

  const togglePin = (id: string) => {
    setPinnedNotifIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const handleNotifClick = (notif: Notification) => {
    markNotificationAsRead(notif.id);
    
    // Custom routing based on notification type
    if (notif.type === 'friend_request' || notif.type === 'friend_accept') {
      setActiveTab(1); // Friends Tab
    } else if (notif.type === 'like' || notif.type === 'comment') {
      setActiveTab(0); // Go to Home Feed to check posts
    }
  };

  const getNotifIconBadge = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <span className="absolute bottom-0 right-0 bg-[#E02424] text-white p-0.5 rounded-full border border-white">
            <Heart className="w-2.5 h-2.5 fill-current" />
          </span>
        );
      case 'comment':
        return (
          <span className="absolute bottom-0 right-0 bg-green-500 text-white p-0.5 rounded-full border border-white">
            <MessageCircle className="w-2.5 h-2.5 fill-current" />
          </span>
        );
      case 'friend_request':
      case 'friend_accept':
        return (
          <span className="absolute bottom-0 right-0 bg-[#076653] text-[#E3EF26] p-0.5 rounded-full border border-white">
            <UserPlus className="w-2.5 h-2.5" />
          </span>
        );
      default:
        return null;
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const { pinnedNotifications, unreadNotifications, earlierNotifications } = useMemo(() => {
    const pinnedSet = new Set(pinnedNotifIds);
    return {
      pinnedNotifications: notifications.filter(notif => pinnedSet.has(notif.id)),
      unreadNotifications: notifications.filter(notif => !notif.read && !pinnedSet.has(notif.id)),
      earlierNotifications: notifications.filter(notif => notif.read && !pinnedSet.has(notif.id)),
    };
  }, [notifications, pinnedNotifIds]);

  const renderNotifRow = (notif: Notification) => {
    const isPinned = pinnedNotifIds.includes(notif.id);
    const isUnread = !notif.read;
    
    let rowBgStyle = "bg-white";
    if (isPinned) {
      rowBgStyle = "bg-amber-50/20 border-l-4 border-amber-400";
    } else if (isUnread) {
      rowBgStyle = "bg-[#EBF7F2]/40 border-l-4 border-[#076653]";
    }

    return (
      <div
        key={notif.id}
        className={`flex gap-3 p-3.5 items-start justify-between transition-colors relative hover:bg-gray-50 active:bg-gray-100 ${rowBgStyle} ${isUnread ? 'font-semibold' : ''}`}
        id={`notif-row-${notif.id}`}
      >
        {/* Clickable Area for Notification Details */}
        <div
          onClick={() => handleNotifClick(notif)}
          className="flex gap-3 flex-1 cursor-pointer min-w-0"
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile?.(notif.actorName, notif.actorAvatar);
            }}
            className="relative flex-shrink-0 cursor-pointer group/notifactor"
            title={`View ${notif.actorName}'s profile`}
          >
            <img
              src={notif.actorAvatar}
              alt={notif.actorName}
              className="w-11 h-11 rounded-full object-cover border border-gray-150 group-hover/notifactor:ring-2 group-hover/notifactor:ring-[#076653] transition-all"
              referrerPolicy="no-referrer"
            />
            {getNotifIconBadge(notif.type)}
          </div>

          <div className="flex-1 min-w-0 pr-1 text-left">
            <p className="text-[11px] text-gray-800 leading-normal">
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile?.(notif.actorName, notif.actorAvatar);
                }}
                className="font-bold text-gray-950 mr-1 hover:text-[#076653] hover:underline cursor-pointer"
                title={`View ${notif.actorName}'s profile`}
              >
                {notif.actorName}
              </span>
              {notif.summaryText}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] text-gray-400 font-normal">{notif.timestamp}</span>
              {isPinned && (
                <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Pin className="w-2.5 h-2.5 fill-current" />
                  <span>Pinned</span>
                </span>
              )}
              {isUnread && (
                <span className="text-[9px] text-[#076653] bg-[#EBF7F2] border border-[#076653]/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#076653]" />
                  <span>New</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inline Action Toolbar */}
        <div className="flex items-center gap-1 flex-shrink-0 self-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePin(notif.id);
            }}
            className={`p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ${isPinned ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
            title={isPinned ? "Unpin notification" : "Pin to top"}
            id={`pin-btn-${notif.id}`}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
          </button>
          {isUnread && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markNotificationAsRead(notif.id);
              }}
              className="p-1.5 hover:bg-[#EBF7F2] text-[#076653] rounded-full cursor-pointer"
              title="Mark as read"
              id={`mark-read-btn-${notif.id}`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearNotification(notif.id);
            }}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-red-500 rounded-full cursor-pointer"
            title="Delete notification"
            id={`delete-notif-btn-${notif.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Direct Arrow indicator */}
        <div className="absolute right-1 top-1.5 opacity-0 hover:opacity-100 transition-opacity">
          <ArrowRight className="w-3 h-3 text-gray-300" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#F0F2F5] lg:bg-transparent min-h-[calc(100vh-112px)] lg:min-h-0 pb-4 lg:pb-4 select-none font-sans" id="notifications-tab-container">
      {/* Tab Header Toolbar */}
      <div className="bg-white p-3 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-[#076653] text-[#E3EF26] font-bold text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="text-[10px] font-bold text-[#076653] hover:underline flex items-center gap-1 cursor-pointer"
            id="mark-all-read-btn"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Shortcut row for Friends & Requests */}
      <div className="flex flex-col mt-2 bg-white border-y border-gray-200" id="notification-shortcuts-container">
        {/* Friends Row */}
        <div 
          onClick={() => setActiveTab(1)}
          className="flex items-center justify-between p-3.5 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
          id="notif-shortcut-friends-row"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#EBF7F2] text-[#076653] flex items-center justify-center shrink-0 border border-[#076653]/20">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <h3 className="text-xs font-bold text-gray-900 leading-tight">Friends & Requests</h3>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">Manage friends list, sent, and pending requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold h-5 px-1.5 min-w-[20px] flex items-center justify-center rounded-full">
                {pendingRequestsCount}
              </span>
            )}
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex flex-col mt-2 bg-white border-y border-gray-200">
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
            <BellOff className="w-8 h-8 text-gray-300" />
            <span>You have no notifications yet.</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Pinned Section */}
            {pinnedNotifications.length > 0 && (
              <div className="flex flex-col border-b border-gray-200" id="pinned-notifs-section">
                <div className="bg-amber-50/30 px-3.5 py-1.5 text-[9px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1 border-b border-gray-100">
                  <Pin className="w-3 h-3 fill-current text-amber-500" />
                  <span>Pinned Notifications</span>
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  {pinnedNotifications.map(notif => renderNotifRow(notif))}
                </div>
              </div>
            )}

            {/* Unread Section */}
            {unreadNotifications.length > 0 && (
              <div className="flex flex-col border-b border-gray-200" id="unread-notifs-section">
                <div className="bg-[#EBF7F2]/40 px-3.5 py-1.5 text-[9px] font-bold text-[#076653] uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#076653]"></span>
                  <span>New Notifications</span>
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  {unreadNotifications.map(notif => renderNotifRow(notif))}
                </div>
              </div>
            )}

            {/* Earlier / Read Section */}
            {earlierNotifications.length > 0 && (
              <div className="flex flex-col" id="earlier-notifs-section">
                {(pinnedNotifications.length > 0 || unreadNotifications.length > 0) && (
                  <div className="bg-gray-50/40 px-3.5 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 border-b border-gray-100">
                    <span>Earlier</span>
                  </div>
                )}
                <div className="flex flex-col divide-y divide-gray-100">
                  {earlierNotifications.map(notif => renderNotifRow(notif))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
