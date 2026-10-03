import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ArrowLeft, MapPin, Briefcase, GraduationCap, Heart, UserPlus, 
  UserCheck, MessageSquare, Share2, CheckCircle2, 
  ExternalLink, Users, Eye, Sparkles, Image as ImageIcon,
  Newspaper, ThumbsUp
} from 'lucide-react';
import { PublicUserProfile, Post, Friend, UserProfile } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface PublicProfileModalProps {
  userProfile: PublicUserProfile | null;
  onClose: () => void;
  currentUserProfile: UserProfile;
  friends: Friend[];
  posts: Post[];
  handleFriendAction: (friendId: string, action: 'accept' | 'decline' | 'add' | 'remove') => void;
  onStartMessage: (userName: string, userAvatar?: string, friendId?: string) => void;
  onViewProfile: (name: string, avatar?: string, id?: string) => void;
  onNavigateToMyProfile?: () => void;
  likePost?: (postId: string) => void;
  addComment?: (postId: string, text: string) => void;
}

export default function PublicProfileModal({
  userProfile,
  onClose,
  currentUserProfile,
  friends,
  posts,
  handleFriendAction,
  onStartMessage,
  onViewProfile,
  onNavigateToMyProfile,
  likePost,
  addComment
}: PublicProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'photos' | 'friends'>('posts');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [poppingLikeIds, setPoppingLikeIds] = useState<Record<string, boolean>>({});
  const [confirmUnfriendOpen, setConfirmUnfriendOpen] = useState(false);

  const handleLikeClick = (postId: string) => {
    setPoppingLikeIds((prev) => ({ ...prev, [postId]: true }));
    likePost?.(postId);
    setTimeout(() => {
      setPoppingLikeIds((prev) => ({ ...prev, [postId]: false }));
    }, 450);
  };

  if (!userProfile) return null;

  const myUserId = currentUserProfile.id || 'user_me';
  const isSelf =
    (userProfile.id && userProfile.id === myUserId) ||
    userProfile.name === currentUserProfile.name ||
    userProfile.avatar === currentUserProfile.avatar;

  // Real-time friend status check from friends list (match by ID first, then name)
  const currentFriendRecord = friends.find(
    f => (userProfile.id && f.id === userProfile.id) || f.name.toLowerCase() === userProfile.name.toLowerCase()
  );
  const effectiveStatus = currentFriendRecord ? currentFriendRecord.status : (userProfile.status || 'none');
  const friendId = currentFriendRecord?.id || userProfile.id || `friend-${userProfile.name.toLowerCase().replace(/\s+/g, '-')}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(window.location.href);
      showToast(`Profile link copied for ${userProfile.name}!`);
    } catch {
      showToast('Failed to copy profile link');
    }
  };

  // User posts: match by authorId or authorName, hide unpublished scheduled posts, and hide Private posts if not self
  const userPosts = posts.filter((p) => {
    const belongsToUser =
      (userProfile.id && p.authorId === userProfile.id) ||
      p.authorName.toLowerCase() === userProfile.name.toLowerCase();
    if (!belongsToUser) return false;
    if (p.isScheduled) return false;
    if (!isSelf && p.postType === 'Private') return false;
    return true;
  });

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
        id="public-profile-modal-backdrop"
      >
        {/* TOAST ALERT */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className="fixed top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2 rounded-full shadow-2xl z-70 border border-gray-700 flex items-center gap-2 font-medium"
            >
              <Sparkles className="w-4 h-4 text-[#E3EF26]" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHOTO LIGHTBOX PREVIEW */}
        {previewPhoto && (
          <div 
            onClick={() => setPreviewPhoto(null)}
            className="fixed inset-0 bg-black/90 z-70 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <div className="relative max-w-3xl max-h-[90vh]">
              <img 
                src={previewPhoto} 
                alt="Full preview" 
                className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" 
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setPreviewPhoto(null)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 p-1.5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* MODAL CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[100vh] sm:max-h-[92vh] border border-gray-200"
          id="public-profile-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          {/* STICKY TOP APP BAR */}
          <div className="bg-[#076653] text-white px-3.5 py-2.5 flex justify-between items-center z-20 shrink-0 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Back"
                id="public-profile-back-btn"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex flex-col">
                <span className="font-bold text-xs leading-tight truncate max-w-[200px] sm:max-w-xs">
                  {userProfile.name}
                </span>
                <span className="text-[10px] text-emerald-200">Bissho Barta Profile</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Share Profile"
                id="public-profile-share-header-btn"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                title="Close"
                id="public-profile-close-header-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* SCROLLABLE PROFILE CONTENT */}
          <div className="flex-1 overflow-y-auto bg-gray-50/70" id="public-profile-scroll-area">
            {/* 1. COVER PHOTO */}
            <div className="relative h-44 sm:h-56 w-full bg-gray-300 overflow-hidden group">
              <img
                src={userProfile.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-300"
                onClick={() => setPreviewPhoto(userProfile.coverPhoto)}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
              
              <button
                onClick={() => setPreviewPhoto(userProfile.coverPhoto)}
                className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-[10px] px-2.5 py-1.5 rounded-lg backdrop-blur-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Cover</span>
              </button>
            </div>

            {/* 2. PROFILE AVATAR & HEADER INFO */}
            <div className="px-4 sm:px-6 relative pb-4 bg-white border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-3">
                {/* Avatar with Ring */}
                <div className="relative self-start sm:self-auto group">
                  <div 
                    onClick={() => setPreviewPhoto(userProfile.avatar)}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 cursor-pointer relative"
                  >
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye className="w-6 h-6 drop-shadow-md" />
                    </div>
                  </div>

                  {userProfile.isOnline && (
                    <span 
                      className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-3 border-white rounded-full shadow-sm"
                      title="Active now" 
                    />
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap pt-1 sm:pt-0">
                  {isSelf ? (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToMyProfile?.();
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-[#076653] hover:bg-[#0C342C] text-[#E3EF26] font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      id="view-self-profile-btn"
                    >
                      <span>Edit Profile in Settings</span>
                    </button>
                  ) : (
                    <>
                      {/* Add / Confirm / Friend Status Button */}
                      {effectiveStatus === 'friend' && (
                        <button
                          onClick={() => setConfirmUnfriendOpen(true)}
                          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-gray-200"
                          id="public-profile-friend-btn"
                        >
                          <UserCheck className="w-4 h-4 text-[#076653]" />
                          <span>Friends ✓</span>
                        </button>
                      )}

                      {effectiveStatus === 'pending_incoming' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              handleFriendAction(friendId, 'accept');
                              showToast(`Accepted ${userProfile.name}'s friend request!`);
                            }}
                            className="px-3.5 py-2 bg-[#076653] hover:bg-[#0C342C] text-[#E3EF26] font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                            id="public-profile-confirm-request-btn"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => {
                              handleFriendAction(friendId, 'decline');
                              showToast(`Declined ${userProfile.name}'s friend request`);
                            }}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-gray-200"
                            id="public-profile-decline-request-btn"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {effectiveStatus === 'pending_outgoing' && (
                        <button
                          onClick={() => {
                            handleFriendAction(friendId, 'remove');
                            showToast(`Cancelled friend request to ${userProfile.name}`);
                          }}
                          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                          id="public-profile-request-sent-btn"
                        >
                          <span>Request Sent (Cancel)</span>
                        </button>
                      )}

                      {effectiveStatus === 'none' && (
                        <button
                          onClick={() => {
                            handleFriendAction(friendId, 'add');
                            showToast(`Sent friend request to ${userProfile.name}!`);
                          }}
                          className="px-3.5 py-2 bg-[#076653] hover:bg-[#0C342C] text-[#E3EF26] font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          id="public-profile-add-friend-btn"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Add Friend</span>
                        </button>
                      )}

                      {/* Direct Message Button */}
                      <button
                        onClick={() => {
                          onStartMessage(userProfile.name, userProfile.avatar, friendId);
                        }}
                        className="px-3.5 py-2 bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-[#076653]/30 shadow-2xs"
                        id="public-profile-send-msg-btn"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Message</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Name & Handle */}
              <div className="mt-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                    {userProfile.name}
                  </h1>
                  {userProfile.verified && (
                    <span 
                      className="inline-flex items-center gap-0.5 bg-[#076653] text-[#E3EF26] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs"
                      title="Verified Identity"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{userProfile.badge || 'Verified'}</span>
                    </span>
                  )}
                  {userProfile.isOnline && (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active Now
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  @{userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '')} • {userProfile.joinedDate || 'Member since 2023'}
                </p>

                {/* Mutual friends info */}
                {userProfile.mutualFriends !== undefined && userProfile.mutualFriends > 0 && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-gray-800">{userProfile.mutualFriends} mutual friends</span>
                    <span className="text-gray-400">including Tanvir Ahmed, Nusrat Jahan</span>
                  </p>
                )}

                {/* Bio */}
                {userProfile.bio && (
                  <p className="text-xs sm:text-sm text-gray-800 mt-2.5 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-200/80 italic">
                    "{userProfile.bio}"
                  </p>
                )}
              </div>

              {/* STATS BAR */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center">
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-150">
                  <div className="text-sm sm:text-base font-extrabold text-gray-900">
                    {userProfile.friendsCount || 420}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Friends</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-150">
                  <div className="text-sm sm:text-base font-extrabold text-gray-900">
                    {userProfile.followersCount || 1250}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Followers</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-150">
                  <div className="text-sm sm:text-base font-extrabold text-gray-900">
                    {userProfile.followingCount || 280}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Following</div>
                </div>
              </div>
            </div>

            {/* 3. PROFILE SUB-NAVIGATION TABS */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 flex gap-2 z-10 shadow-2xs">
              {[
                { id: 'posts', label: 'Posts' },
                { id: 'about', label: 'Public Details' },
                { id: 'photos', label: 'Photos' },
                { id: 'friends', label: 'Friends' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'border-[#076653] text-[#076653]' 
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                    id={`profile-tab-btn-${tab.id}`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 4. TAB PANELS */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* TAB 1: POSTS */}
              {activeTab === 'posts' && (
                <div className="space-y-4" id="public-profile-posts-list">
                  {/* Public Details Card Summary */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
                      About {userProfile.name}
                    </h3>
                    
                    <div className="space-y-2 text-xs text-gray-700">
                      {userProfile.work && (
                        <div>
                          Works at <span className="font-semibold text-gray-900">{userProfile.work}</span>
                        </div>
                      )}
                      {userProfile.education && (
                        <div>
                          Studied at <span className="font-semibold text-gray-900">{userProfile.education}</span>
                        </div>
                      )}
                      {userProfile.location && (
                        <div>
                          Lives in <span className="font-semibold text-gray-900">{userProfile.location}</span>
                        </div>
                      )}
                      {userProfile.relationship && (
                        <div>
                          Relationship: <span className="font-semibold text-gray-900">{userProfile.relationship}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveTab('about')}
                      className="w-full mt-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      See All Public Details →
                    </button>
                  </div>

                  {/* List of user posts */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Posts by {userProfile.name}
                    </h3>

                    {userPosts.length === 0 ? (
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center space-y-2 shadow-2xs">
                        <div className="w-12 h-12 bg-[#EBF7F2] text-[#076653] rounded-full mx-auto flex items-center justify-center">
                          <Newspaper className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-800">No recent public posts</h4>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                          {userProfile.name} hasn't posted anything recently. Check back later or send a message to say hello!
                        </p>
                      </div>
                    ) : (
                      userPosts.map((post) => (
                        <div
                          key={post.id}
                          className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col"
                          id={`public-profile-post-${post.id}`}
                        >
                          {/* Post Header */}
                          <div className="p-3.5 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={post.authorAvatar}
                                alt={post.authorName}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                                  {post.authorName}
                                </h4>
                                <span className="text-[10px] text-gray-400">
                                  {post.timestamp}
                                  {(post.postType === 'Subscriber' || post.postType === 'Private') ? ` • ${post.postType}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Post Content */}
                          <div className="p-3.5 space-y-2.5">
                            <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                              {post.content}
                            </p>

                            {post.image && (
                              <img
                                src={post.image}
                                alt="Post visual"
                                onClick={() => setPreviewPhoto(post.image!)}
                                className="w-full max-h-80 object-cover rounded-xl border border-gray-200 cursor-zoom-in"
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>

                          {/* Interaction bar */}
                          <div className="px-3.5 py-2 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-xs">
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleLikeClick(post.id)}
                              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 font-bold cursor-pointer select-none ${
                                post.likedByMe 
                                  ? 'text-[#076653] bg-[#EBF7F2] ring-1 ring-[#076653]/30 shadow-2xs' 
                                  : 'text-gray-600 hover:bg-[#EBF7F2]/60 hover:text-[#076653]'
                              } ${poppingLikeIds[post.id] ? 'animate-like-btn-pop bg-[#d4f4e7]' : ''}`}
                            >
                              <span className="relative inline-flex items-center justify-center">
                                {poppingLikeIds[post.id] && (
                                  <span className="absolute inset-0 rounded-full border-2 border-[#076653] animate-like-ring pointer-events-none" />
                                )}
                                <ThumbsUp
                                  className={`w-4 h-4 transition-all duration-200 ${
                                    post.likedByMe
                                      ? 'fill-[#076653] text-[#076653] scale-110 animate-like-pop'
                                      : ''
                                  } ${poppingLikeIds[post.id] ? 'animate-like-pop text-[#076653]' : ''}`}
                                />
                              </span>
                              <span>{post.likes || 0} Likes</span>
                            </motion.button>

                            <div className="text-gray-500 font-medium">
                              {post.comments?.length || 0} comments • {post.shares || 0} shares
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ABOUT / FULL PUBLIC DETAILS */}
              {activeTab === 'about' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-5 space-y-5" id="public-profile-about-panel">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Work & Education
                    </h3>
                    <div className="space-y-3">
                      <div className="flex gap-3 items-start">
                        <div className="p-2 bg-[#EBF7F2] text-[#076653] rounded-xl shrink-0">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">
                            {userProfile.work || 'Independent Creator'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Primary Occupation & Workplace</p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="p-2 bg-[#EBF7F2] text-[#076653] rounded-xl shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">
                            {userProfile.education || 'University Degree'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">College & Education History</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Places Lived
                    </h3>
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-[#EBF7F2] text-[#076653] rounded-xl shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">
                          Lives in {userProfile.location || 'Dhaka, Bangladesh'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Current City & Public Residence</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Relationship & Family
                    </h3>
                    <div className="flex gap-3 items-start">
                      <div className="p-2 bg-[#EBF7F2] text-[#076653] rounded-xl shrink-0">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">
                          {userProfile.relationship || 'Single'}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Relationship Status</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Basic Info & Web
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-500">Gender</span>
                        <span className="font-semibold text-gray-900">Specified in profile</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-500">Languages</span>
                        <span className="font-semibold text-gray-900">English, Bengali</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-50">
                        <span className="text-gray-500">Bissho Barta ID</span>
                        <span className="font-mono text-gray-700">@{userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
                      </div>
                      {userProfile.website && (
                        <div className="flex justify-between py-1.5">
                          <span className="text-gray-500">Website</span>
                          <a 
                            href={userProfile.website} 
                            target="_blank" 
                            rel="noreferrer"
                            className="font-semibold text-[#076653] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{userProfile.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PHOTOS */}
              {activeTab === 'photos' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-5 space-y-4" id="public-profile-photos-panel">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#076653]" />
                      <span>Photos ({userProfile.photos?.length || 0})</span>
                    </h3>
                    <span className="text-[10px] text-gray-400">Click any photo to expand</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(userProfile.photos || [userProfile.coverPhoto, userProfile.avatar]).map((photoUrl, idx) => (
                      <div
                        key={`profile-photo-${photoUrl.slice(-24)}-${idx}`}
                        onClick={() => setPreviewPhoto(photoUrl)}
                        className="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in group relative border border-gray-200 shadow-2xs"
                      >
                        <img
                          src={photoUrl}
                          alt={`Uploaded photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: FRIENDS */}
              {activeTab === 'friends' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-4 sm:p-5 space-y-4" id="public-profile-friends-panel">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#076653]" />
                      <span>Mutual & Connected Friends</span>
                    </h3>
                    <span className="text-[10px] bg-[#EBF7F2] text-[#076653] font-bold px-2 py-0.5 rounded-full">
                      {friends.filter(f => f.status === 'friend').length} Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => {
                          onViewProfile(friend.name, friend.avatar, friend.id);
                        }}
                        className="p-2.5 rounded-xl border border-gray-200 hover:border-[#076653]/40 hover:bg-[#F2FAF6] transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 group-hover:ring-2 group-hover:ring-[#076653] transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#076653] truncate transition-colors">
                              {friend.name}
                            </h4>
                            <p className="text-[10px] text-gray-500 truncate">
                              {friend.mutualFriends} mutual friends
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-[#076653] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          View →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <ConfirmModal
          isOpen={confirmUnfriendOpen}
          title="Remove Friend"
          message={`Are you sure you want to remove ${userProfile.name} as a friend?`}
          confirmLabel="Remove Friend"
          onConfirm={() => {
            handleFriendAction(friendId, 'remove');
            setConfirmUnfriendOpen(false);
            showToast(`Removed ${userProfile.name} from friends`);
          }}
          onCancel={() => setConfirmUnfriendOpen(false)}
        />
      </div>
    </AnimatePresence>
  );
}
