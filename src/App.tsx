import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import { useAppState } from './hooks/useAppState';
import { PublicUserProfile } from './types';
import { MessageSquare, Bookmark } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Lazy-loaded tab and modal components to reduce initial bundle size
const FeedTab = lazy(() => import('./components/FeedTab'));
const FriendsTab = lazy(() => import('./components/FriendsTab'));
const MessagesTab = lazy(() => import('./components/MessagesTab'));
const WatchTab = lazy(() => import('./components/WatchTab'));
const NotificationsTab = lazy(() => import('./components/NotificationsTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));
const SearchTab = lazy(() => import('./components/SearchTab'));
const ToolsMenuDrawer = lazy(() => import('./components/ToolsMenuDrawer'));
const PublicProfileModal = lazy(() => import('./components/PublicProfileModal'));
const LockdownOverlay = lazy(() => import('./components/LockdownOverlay'));
const SavedPostsScreen = lazy(() => import('./components/SavedPostsScreen'));

export default function App() {
  const {
    profile,
    posts,
    watchPosts,
    friends,
    conversations,
    notifications,
    searchQuery,
    setSearchQuery,
    searchSource,
    setSearchSource,
    storageError,
    clearStorageError,
    addPost,
    addSharedPost,
    repostPost,
    undoRepost,
    toggleSavePost,
    sharePost,
    publishScheduledPost,
    likePost,
    addComment,
    deletePost,
    handleFriendAction,
    ensureConversation,
    sendMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    updateUserProfile,
    unreadNotificationsCount,
    unreadMessagesCount
  } = useAppState();

  const [activeTab, setActiveTab] = useState(0);
  const [chattingFriendId, setChattingFriendId] = useState<string | null>(null);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [isSavedPostsOpen, setIsSavedPostsOpen] = useState(false);

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

  // Open public profile details modal for any user (matching by ID first, then name)
  const handleViewProfile = (name: string, avatar?: string, id?: string) => {
    const myUserId = profile.id || 'user_me';
    if ((id && id === myUserId) || name.toLowerCase() === profile.name.toLowerCase()) {
      setViewingPublicProfile({
        id: myUserId,
        name: profile.name,
        avatar: profile.avatar,
        coverPhoto: profile.coverPhoto,
        bio: profile.bio,
        location: profile.location,
        work: profile.work,
        education: profile.education,
        relationship: profile.relationship,
        friendsCount: friends.filter(f => f.status === 'friend').length,
        followersCount: profile.followersCount || 1250,
        followingCount: profile.followingCount || 184,
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
        : `Active member on Bissho Barta.`,
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

  const handleStartMessage = (userName: string, userAvatar?: string, friendId?: string) => {
    const resolvedFriendId = ensureConversation(userName, userAvatar, friendId);
    setViewingPublicProfile(null);
    setChattingFriendId(resolvedFriendId);
    setActiveTab(2);
  };

  const handleProfileClick = () => {
    setActiveTab(5);
  };

  const handleShortcutClick = (name: string) => {
    handleViewProfile(
      name,
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
      `page_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`
    );
  };

  const pendingRequestsCount = friends.filter(f => f.status === 'pending_incoming').length;

  return (
    <div className="bg-[#F0F2F5] min-h-screen flex flex-col font-sans text-gray-800 selection:bg-[#EBF7F2] select-none" id="app-viewport-wrapper">

      {/* VISIBLE STORAGE ERROR TOAST */}
      <AnimatePresence>
        {storageError && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-16 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-60 flex items-center gap-2.5 border border-red-400 font-semibold max-w-md"
            role="alert"
          >
            <span>{storageError}</span>
            <button
              type="button"
              onClick={clearStorageError}
              className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL TOAST */}
      <AnimatePresence>
        {shortcutToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-18 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 border border-gray-700 font-semibold"
          >
            <span>{shortcutToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOCKDOWN MODE OVERLAY */}
      <Suspense fallback={null}>
        <LockdownOverlay
          userEmail="mirxbd@gmail.com"
          onShowToast={(msg) => {
            setShortcutToast(msg);
            setTimeout(() => setShortcutToast(null), 3000);
          }}
        />
      </Suspense>

      {/* TOOLS & MENU DRAWER */}
      <Suspense fallback={null}>
        <ToolsMenuDrawer
          isOpen={isToolsDrawerOpen}
          onClose={() => setIsToolsDrawerOpen(false)}
          profile={profile}
          posts={posts}
          friends={friends}
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
      </Suspense>

      {/* SAVED POSTS MODAL / OVERLAY */}
      <AnimatePresence>
        {isSavedPostsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
          >
            <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-[#F3F4F6] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom duration-200">
              <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500 font-semibold">Loading saved posts...</div>}>
                <SavedPostsScreen
                  posts={posts}
                  profile={profile}
                  onViewProfile={(name, avatar, id) => {
                    setIsSavedPostsOpen(false);
                    handleViewProfile(name, avatar, id);
                  }}
                  onClose={() => setIsSavedPostsOpen(false)}
                  onShowToast={(msg) => {
                    setShortcutToast(msg);
                    setTimeout(() => setShortcutToast(null), 3000);
                  }}
                />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* Left Sidebar Card - Desktop only (Duplicate tab buttons removed since main tab bar covers them) */}
        <aside className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl p-4 border border-gray-200 flex-col gap-2 shadow-xs sticky top-20 h-fit" id="desktop-left-navigation">

          {/* Bissho Barta Brand Header & Logo */}
          <div
            onClick={() => setActiveTab(0)}
            className="p-3 mb-1 bg-linear-to-r from-[#0C342C] to-[#076653] rounded-xl flex items-center justify-between cursor-pointer hover:opacity-95 transition-all shadow-xs"
            id="desktop-sidebar-brand-header"
            title="Bissho Barta Home"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E3EF26] text-[#0C342C] font-black flex items-center justify-center text-xs shadow-xs shrink-0 select-none">
                BB
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-white tracking-tight leading-tight">
                  Bissho <span className="text-[#E3EF26]">Barta</span>
                </span>
                <span className="text-[9px] text-emerald-200/80 font-medium">World News & Social</span>
              </div>
            </div>
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

          {/* Quick Menu & Tools Drawer Trigger */}
          <button
            onClick={() => setIsToolsDrawerOpen(prev => !prev)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#EBF7F2] text-[#0C342C] font-bold transition-all cursor-pointer border border-gray-200 shadow-2xs group"
            id="desktop-left-tools-menu-btn"
          >
            <span className="font-mono font-black text-[#0C342C] group-hover:text-[#076653] text-base leading-none">|||</span>
            <span className="text-xs">Menu & Platform Tools</span>
          </button>

          {/* Saved Posts shortcut */}
          <button
            type="button"
            onClick={() => setIsSavedPostsOpen(true)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-[#EBF7F2] text-[#0C342C] font-semibold transition-all cursor-pointer border border-gray-200 shadow-2xs group"
            id="desktop-left-saved-posts-btn"
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-[#076653] fill-[#076653]/20 group-hover:fill-[#076653]" />
              <span className="text-xs font-bold text-gray-800">Saved Posts</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF7F2] text-[#076653]">
              Private
            </span>
          </button>

          {/* Community Shortcuts (Bangladesh-based) */}
          <div className="mt-2 pt-3 border-t border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Your Shortcuts</h3>

            <div
              onClick={() => handleShortcutClick('Dhaka Tech Community')}
              className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
              id="shortcut-tech-btn"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800">Dhaka Tech Community</span>
                <span className="text-[10px] text-gray-400 truncate">14.2k members · 5 new posts</span>
              </div>
            </div>

            <div
              onClick={() => handleShortcutClick('Sylhet Travel Club')}
              className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
              id="shortcut-travel-btn"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800">Sylhet Travel Club</span>
                <span className="text-[10px] text-gray-400 truncate">Active now · 38 members online</span>
              </div>
            </div>

            <div
              onClick={() => handleShortcutClick('Bangladesh Cricket & Sports')}
              className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
              id="shortcut-sports-btn"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-800">Bangladesh Cricket & Sports</span>
                <span className="text-[10px] text-gray-400 truncate">Match discussion today</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Central Active Feed Section */}
        <div className="col-span-12 lg:col-span-6 w-full max-w-md lg:max-w-none mx-auto bg-white lg:rounded-2xl border-x lg:border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[calc(100vh-56px)] lg:min-h-[750px]" id="bissho-barta-app-frame">

          {/* Desktop Header subtitle banner */}
          <div className="hidden lg:flex p-4 border-b border-gray-100 bg-gray-50/50 justify-between items-center shrink-0">
            <h2 className="font-bold text-gray-900 text-sm tracking-tight">
              {activeTab === 0 && 'News Feed'}
              {activeTab === 1 && 'Friends & Requests'}
              {activeTab === 2 && 'Chats'}
              {activeTab === 3 && 'Videos & Watch'}
              {activeTab === 4 && 'Notifications'}
              {activeTab === 5 && 'Your Profile'}
              {activeTab === 6 && (searchSource === 'web' ? 'Web Search' : 'Search Bissho Barta')}
            </h2>
          </div>

          {/* Active Tab viewport */}
          <main className="flex-1 flex flex-col overflow-y-auto max-h-[calc(100vh-112px)] lg:max-h-[calc(100vh-160px)]" id="main-content-viewport">
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center py-16 text-xs text-gray-500 font-semibold">
                  Loading...
                </div>
              }
            >
              {activeTab === 0 && (
                <FeedTab
                  posts={posts}
                  profile={profile}
                  friends={friends}
                  searchQuery={searchQuery}
                  addPost={addPost}
                  addSharedPost={addSharedPost}
                  likePost={likePost}
                  addComment={addComment}
                  deletePost={deletePost}
                  onViewProfile={handleViewProfile}
                  repostPost={repostPost}
                  undoRepost={undoRepost}
                  toggleSavePost={toggleSavePost}
                  sharePost={sharePost}
                />
              )}

              {activeTab === 1 && (
                <FriendsTab
                  friends={friends}
                  searchQuery={searchQuery}
                  handleFriendAction={handleFriendAction}
                  setActiveTab={setActiveTab}
                  setChattingFriendId={setChattingFriendId}
                  onStartMessage={handleStartMessage}
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
                  friends={friends}
                  updateUserProfile={updateUserProfile}
                  likePost={likePost}
                  addComment={addComment}
                  deletePost={deletePost}
                  addPost={addPost}
                  addSharedPost={addSharedPost}
                  publishScheduledPost={publishScheduledPost}
                  onViewProfile={handleViewProfile}
                  repostPost={repostPost}
                  undoRepost={undoRepost}
                  toggleSavePost={toggleSavePost}
                  sharePost={sharePost}
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
                  onStartMessage={handleStartMessage}
                  likePost={likePost}
                  addComment={addComment}
                  onViewProfile={handleViewProfile}
                />
              )}
            </Suspense>
          </main>
        </div>

        {/* Right Contacts Sidebar - Desktop only */}
        <aside className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl p-4 border border-gray-200 flex flex-col gap-4 shadow-xs sticky top-20 h-fit" id="desktop-right-contacts">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Contacts</h3>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
              {friends.filter(f => f.status === 'friend').length} Active
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-[350px] overflow-y-auto pr-1" id="desktop-contacts-list">
            {friends.filter(f => f.status === 'friend').length === 0 ? (
              <span className="text-xs text-gray-400 p-2 text-center block">No active friends yet. Accept requests in Friends tab!</span>
            ) : (
              friends.filter(f => f.status === 'friend').map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => {
                    handleStartMessage(friend.name, friend.avatar, friend.id);
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

          {friends.some(f => f.status === 'pending_incoming') && (
            <div className="mt-2 p-3.5 bg-[#F2FAF6] rounded-xl border border-[#076653]/20 shadow-xs animate-fade-in" id="desktop-right-friend-request-box">
              <p className="text-xs text-[#076653] font-bold mb-1.5 flex items-center gap-1">
                <span>New Friend Request</span>
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
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
}
