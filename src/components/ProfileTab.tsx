import React, { useRef, useState, ChangeEvent, useMemo } from 'react';
import { UserProfile, Post, Attachment, PageItem, Friend } from '../types';
import { Heart, X, MessageCircle, Share2, Send, ArrowLeft, Repeat2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { applySensitiveContentAlgorithm } from '../utils/sensitiveContent';
import { ConfirmModal } from './ConfirmModal';
import PostActionBar from './PostActionBar';
import ShareHubModal from './ShareHubModal';
import QuoteRepostModal from './QuoteRepostModal';
import { getStoredVideoResolution, setStoredVideoResolution, VideoResolutionSetting } from '../utils/mediaOptimizer';
import {
  getStoredFollowingList,
  setStoredFollowingList,
  getStoredFollowersList,
  setStoredFollowersList,
  getStoredFeedPreference,
  updateFeedPreferenceState,
} from '../utils/contentPreference';

interface ProfileTabProps {
  profile: UserProfile;
  posts: Post[];
  updateUserProfile: (profile: UserProfile) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, commentText: string, isWatchPost?: boolean, replyToId?: string, replyToName?: string) => void;
  deletePost: (postId: string) => void;
  addPost: (content: string, image?: string, attachment?: Attachment) => void;
  addSharedPost?: (postId: string) => boolean;
  publishScheduledPost?: (postId: string) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
  repostPost?: (postId: string, quoteContent?: string) => boolean;
  undoRepost?: (postId: string) => void;
  toggleSavePost?: (postId: string, folder?: string) => boolean;
  sharePost?: (postId: string, method?: string) => void;
  friends?: Friend[];
}

const isMediaVideo = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.startsWith('data:video') ||
    lower.includes('.mp4') ||
    lower.includes('.webm') ||
    lower.includes('.mov') ||
    lower.includes('/video/') ||
    lower.includes('video')
  );
};

export default function ProfileTab({
  profile,
  posts,
  updateUserProfile,
  likePost,
  addComment,
  deletePost,
  addSharedPost,
  publishScheduledPost,
  onViewProfile,
  repostPost,
  undoRepost,
  toggleSavePost,
  sharePost,
  friends = []
}: ProfileTabProps) {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [shareHubTarget, setShareHubTarget] = useState<Post | null>(null);
  const [shareHubSection, setShareHubSection] = useState<'none' | 'connections' | 'app'>('none');
  const [quoteRepostTarget, setQuoteRepostTarget] = useState<Post | null>(null);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedBio, setEditedBio] = useState(profile.bio);
  const [editedWork, setEditedWork] = useState(profile.work);
  const [editedEdu, setEditedEdu] = useState(profile.education);
  const [editedLoc, setEditedLoc] = useState(profile.location);
  const [editedRel, setEditedRel] = useState(profile.relationship);
  const [editedAvatar, setEditedAvatar] = useState(profile.avatar);
  const [editedCover, setEditedCover] = useState(profile.coverPhoto);

  // Settings Tabs & Sub-states
  const [settingsTab, setSettingsTab] = useState<'account' | 'privacy' | 'security' | 'notifications' | 'media'>('account');
  const [postPrivacy, setPostPrivacy] = useState<'Public' | 'Friends' | 'Only Me'>('Public');
  const [profileDetailsPrivacy, setProfileDetailsPrivacy] = useState<'Public' | 'Friends' | 'Only Me'>('Friends');
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [searchIndexing, setSearchIndexing] = useState(true);

  // Security & Password Settings (Demo labeled)
  const [accountEmail, setAccountEmail] = useState('tariqul.islam@example.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [activeSessions] = useState([
    { id: 'sess-1', device: 'Windows PC • Chrome Browser', location: 'Dhaka, Bangladesh', time: 'Active now (This device)', current: true },
    { id: 'sess-2', device: 'Android Phone • Bissho Barta App', location: 'Dhaka, Bangladesh', time: '2 hours ago', current: false },
    { id: 'sess-3', device: 'Tablet • Browser', location: 'Chattogram, Bangladesh', time: 'Yesterday', current: false },
  ]);

  // Notifications Settings
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyTagging, setNotifyTagging] = useState<'Anyone' | 'Friends of Friends' | 'Friends Only'>('Friends Only');
  const [notifyFriendRequests, setNotifyFriendRequests] = useState(true);
  const [notifyPageGroups, setNotifyPageGroups] = useState(true);

  // Media & Preferences
  const [videoAutoplay, setVideoAutoplay] = useState<'Wi-Fi Only' | 'Cellular & Wi-Fi' | 'Never'>('Wi-Fi Only');
  const [inAppSounds, setInAppSounds] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [videoResolution, setVideoResolution] = useState<VideoResolutionSetting>(() => getStoredVideoResolution());
  const [feedPreference, setFeedPreference] = useState<'For you' | 'Feeds'>(() =>
    getStoredFeedPreference()
  );

  // Toast & Confirm Modal feedback
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [postToDeleteId, setPostToDeleteId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSettingsToast(msg);
    setTimeout(() => setSettingsToast(null), 3500);
  };

  // Inline comment & reply states on profile posts
  const [inlineComments, setInlineComments] = useState<{ [postId: string]: string }>({});
  const [openCommentsPostIds, setOpenCommentsPostIds] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; authorName: string } | null>(null);
  const [poppingLikeIds, setPoppingLikeIds] = useState<Record<string, boolean>>({});

  const handleLikeClick = (postId: string) => {
    setPoppingLikeIds((prev) => ({ ...prev, [postId]: true }));
    likePost(postId);
    setTimeout(() => {
      setPoppingLikeIds((prev) => ({ ...prev, [postId]: false }));
    }, 450);
  };

  const handleProfileCommentSubmit = (postId: string) => {
    const text = inlineComments[postId];
    if (!text || !text.trim()) return;
    const replyId = replyingTo?.postId === postId ? replyingTo.commentId : undefined;
    const replyName = replyingTo?.postId === postId ? replyingTo.authorName : undefined;
    addComment(postId, text, false, replyId, replyName);
    setInlineComments({ ...inlineComments, [postId]: '' });
    setReplyingTo(null);
    setOpenCommentsPostIds((prev) => ({ ...prev, [postId]: true }));
  };

  const handleProfileSharePost = (postId: string, section: 'none' | 'connections' | 'app' = 'none') => {
    const target = posts.find((p) => p.id === postId);
    if (target) {
      setShareHubTarget(target);
      setShareHubSection(section);
    }
  };

  const handleInstantRepost = (postId: string) => {
    if (repostPost) {
      const ok = repostPost(postId);
      showToast(ok ? 'Reposted to your feed!' : 'Could not repost this post.');
    }
  };

  const handleUndoRepost = (postId: string) => {
    if (undoRepost) {
      undoRepost(postId);
      showToast('Undo repost: Removed from your feed.');
    }
  };

  const handleToggleSave = (postId: string) => {
    if (toggleSavePost) {
      const saved = toggleSavePost(postId);
      showToast(saved ? 'Post saved to your private collection!' : 'Post removed from Saved.');
    }
  };

  const handleCompleteShare = (postId: string, method: string) => {
    if (sharePost) {
      sharePost(postId, method);
    }
  };

  const handleQuoteRepostSubmit = (postId: string, thoughts: string) => {
    if (repostPost) {
      repostPost(postId, thoughts);
      showToast('Reposted with your thoughts!');
    }
  };

  // Following, Followers, Pages state
  const followingCount = profile.followingCount ?? 184;
  const followersCount = profile.followersCount ?? 1250;
  const userPages: PageItem[] = profile.pages ?? [
    {
      id: "page-1",
      name: "Dhaka Tech & Code",
      category: "Science & Technology",
      avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
      followersCount: 3420,
      createdAt: "2024",
      bio: "Official page for Bangladesh software engineering, web dev tips, and community tech updates."
    }
  ];

  // Modals visibility
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showPagesModal, setShowPagesModal] = useState(false);

  const [followingSearch, setFollowingSearch] = useState('');
  const [followingList, setFollowingList] = useState(() => getStoredFollowingList());

  const [followersList, setFollowersList] = useState(() => getStoredFollowersList());

  // Create Page Form state
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageCategory, setNewPageCategory] = useState('Business & Brand');
  const [newPageBio, setNewPageBio] = useState('');

  const handleToggleFollowUser = (id: string) => {
    const item = followingList.find(f => f.id === id);
    if (!item) return;
    const nextState = !item.isFollowing;
    const diff = nextState ? 1 : -1;
    const newCount = Math.max(0, followingCount + diff);

    setFollowingList(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, isFollowing: nextState } : f);
      setStoredFollowingList(updated);
      return updated;
    });
    updateUserProfile({ ...profile, followingCount: newCount });
  };

  const handleToggleFollowerBack = (id: string) => {
    const item = followersList.find(f => f.id === id);
    if (!item) return;
    const nextState = !item.isFollowing;
    const diff = nextState ? 1 : -1;
    const newCount = Math.max(0, followingCount + diff);

    setFollowersList(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, isFollowing: nextState } : f);
      setStoredFollowersList(updated);
      return updated;
    });
    updateUserProfile({ ...profile, followingCount: newCount });
  };

  const handleRemoveFollower = (id: string) => {
    setFollowersList(prev => {
      const updated = prev.filter(f => f.id !== id);
      setStoredFollowersList(updated);
      return updated;
    });
    const newFollowersCount = Math.max(0, followersCount - 1);
    updateUserProfile({ ...profile, followersCount: newFollowersCount });
  };

  const handleCreatePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageName.trim()) return;

    const newPage: PageItem = {
      id: `page-${Date.now()}`,
      name: newPageName.trim(),
      category: newPageCategory,
      followersCount: 1,
      createdAt: new Date().getFullYear().toString(),
      bio: newPageBio.trim() || 'Official Bissho Barta Page',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80'
    };

    const updatedPages = [...userPages, newPage];
    updateUserProfile({
      ...profile,
      pages: updatedPages
    });

    setNewPageName('');
    setNewPageBio('');
    setIsCreatingPage(false);
  };

  const handleDeletePage = (pageId: string) => {
    const updatedPages = userPages.filter(p => p.id !== pageId);
    updateUserProfile({
      ...profile,
      pages: updatedPages
    });
  };

  const handleAvatarFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Only image files can be uploaded for profile photo.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditedAvatar(result);
        updateUserProfile({
          ...profile,
          avatar: result
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCoverFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        showToast('Please select an image or video file for cover photo.');
        e.target.value = '';
        return;
      }

      const maxSizeBytes = 50 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        showToast('File size exceeds 50 MB limit. Please choose a smaller file.');
        e.target.value = '';
        return;
      }

      if (isVideo) {
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        const blobUrl = URL.createObjectURL(file);

        tempVideo.onloadedmetadata = () => {
          URL.revokeObjectURL(blobUrl);
          const duration = tempVideo.duration;

          if (duration > 120) {
            const mins = Math.floor(duration / 60);
            const secs = Math.round(duration % 60);
            showToast(`Video length is ${mins}m ${secs}s. Maximum cover video length is 2 minutes.`);
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            setEditedCover(result);
            updateUserProfile({
              ...profile,
              coverPhoto: result
            });
          };
          reader.readAsDataURL(file);
        };

        tempVideo.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          showToast('Could not parse video metadata. Please use a supported MP4 format.');
        };

        tempVideo.src = blobUrl;
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setEditedCover(result);
          updateUserProfile({
            ...profile,
            coverPhoto: result
          });
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleOpenEditProfile = () => {
    setEditedName(profile.name);
    setEditedBio(profile.bio);
    setEditedWork(profile.work);
    setEditedEdu(profile.education);
    setEditedLoc(profile.location);
    setEditedRel(profile.relationship);
    setEditedAvatar(profile.avatar);
    setEditedCover(profile.coverPhoto);
    setSettingsTab('account');
    setIsEditingDetails(true);
  };

  const handleSaveSettings = () => {
    updateUserProfile({
      ...profile,
      name: editedName,
      avatar: editedAvatar,
      coverPhoto: editedCover,
      bio: editedBio,
      work: editedWork,
      education: editedEdu,
      location: editedLoc,
      relationship: editedRel
    });
    setIsEditingDetails(false);
    showToast("Profile & settings saved!");
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatusMsg("Demo (not connected): Password management requires a connected backend account.");
  };

  const handleLogoutOtherSessions = () => {
    showToast("Demo (not connected): Session management is simulated in demo mode.");
  };

  const myUserId = profile.id || 'user_me';

  // Separate user's scheduled posts vs published timeline posts (match by authorId or authorName, no hardcoded Alex Rivera)
  const { myPosts, myScheduledPosts } = useMemo(() => {
    const userOwned = posts.filter(
      (post) => (post.authorId && post.authorId === myUserId) || post.authorName === profile.name
    );
    return {
      myPosts: userOwned.filter((p) => !p.isScheduled),
      myScheduledPosts: userOwned.filter((p) => Boolean(p.isScheduled))
    };
  }, [posts, profile.name, myUserId]);

  const formattedFollowers = followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}K` : `${followersCount}`;

  return (
    <div className="bg-[#F0F2F5] lg:bg-transparent min-h-[calc(100vh-112px)] lg:min-h-0 pb-4 lg:pb-4 select-none font-sans" id="profile-tab-container">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileSelect}
        id="avatar-photo-file-input"
      />
      <input
        type="file"
        ref={coverInputRef}
        accept="image/*,video/*,video/mp4"
        className="hidden"
        onChange={handleCoverFileSelect}
        id="cover-attachment-file-input"
      />

      {/* Confirm Delete Post Modal */}
      <ConfirmModal
        isOpen={Boolean(postToDeleteId)}
        title="Delete Post"
        message="Are you sure you want to permanently delete this post?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (postToDeleteId) {
            deletePost(postToDeleteId);
            setPostToDeleteId(null);
          }
        }}
        onCancel={() => setPostToDeleteId(null)}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {settingsToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-60 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 border border-gray-700"
          >
            <span>{settingsToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. COVER PHOTO & AVATAR BLOCK */}
      <div className="bg-white pb-4 border-b border-gray-200 shadow-sm relative">
        {/* Cover Photo / Video Container */}
        <div className="h-48 w-full bg-slate-900 overflow-hidden relative">
          {isMediaVideo(profile.coverPhoto) ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <video
                key={profile.coverPhoto.slice(0, 80)}
                src={profile.coverPhoto}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover bg-black"
              />
            </div>
          ) : (
            <img
              src={profile.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=300&q=80";
              }}
            />
          )}
        </div>

        {/* Avatar overlapping (no camera icons) */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-150 relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              onClick={() => onViewProfile?.(profile.name, profile.avatar, profile.id)}
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              title="Click to view your public profile"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Name, Combined Plain Text Stats Line, Bio, and Single Edit Profile Button */}
        <div className="mt-14 text-center px-4">
          <h2
            onClick={() => onViewProfile?.(profile.name, profile.avatar, profile.id)}
            className="text-base font-bold text-gray-900 leading-tight cursor-pointer hover:text-[#076653] hover:underline inline-block"
            title="Click to view public profile details"
          >
            {profile.name}
          </h2>

          {/* Combined plain text line for Following / Followers / Pages */}
          <p className="text-xs text-gray-600 mt-1" id="profile-stats-plain-line">
            <button
              type="button"
              onClick={() => setShowFollowingModal(true)}
              className="hover:text-[#076653] hover:underline cursor-pointer font-medium"
              id="profile-following-btn"
            >
              {followingCount} Following
            </button>
            <span className="mx-1.5 text-gray-400">·</span>
            <button
              type="button"
              onClick={() => setShowFollowersModal(true)}
              className="hover:text-[#076653] hover:underline cursor-pointer font-medium"
              id="profile-followers-btn"
            >
              {formattedFollowers} Followers
            </button>
            {userPages.length > 0 && (
              <>
                <span className="mx-1.5 text-gray-400">·</span>
                <button
                  type="button"
                  onClick={() => setShowPagesModal(true)}
                  className="hover:text-[#076653] hover:underline cursor-pointer font-medium"
                  id="profile-pages-btn"
                >
                  {userPages.length} {userPages.length === 1 ? 'Page' : 'Pages'}
                </button>
              </>
            )}
          </p>

          {/* Bio display */}
          {profile.bio && (
            <p className="mt-2 text-xs text-gray-600 max-w-sm mx-auto italic leading-relaxed">
              "{profile.bio}"
            </p>
          )}

          {/* Single Edit Profile Button */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              id="edit-profile-single-btn"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* 2. PROFILE DETAILS / ABOUT LIST */}
      <div className="bg-white p-3.5 border-y border-gray-200 mt-2.5 shadow-sm" id="profile-about-panel">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">About Me</h3>
        </div>

        <div className="flex flex-col gap-2 text-xs text-gray-700">
          <div>
            Works as <span className="font-semibold text-gray-900">{profile.work}</span>
          </div>
          <div>
            Studied at <span className="font-semibold text-gray-900">{profile.education}</span>
          </div>
          <div>
            Lives in <span className="font-semibold text-gray-900">{profile.location}</span>
          </div>
          <div>
            Status: <span className="font-semibold text-gray-900">{profile.relationship}</span>
          </div>
        </div>
      </div>

      {/* 3. SCHEDULED POSTS SECTION (Shown when scheduled posts exist) */}
      {myScheduledPosts.length > 0 && (
        <div className="mt-2.5 bg-amber-50/70 border-y border-amber-200 p-3.5 shadow-xs space-y-2.5" id="profile-scheduled-posts-section">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Scheduled Posts ({myScheduledPosts.length})
            </span>
            <span className="text-[10px] text-amber-700 font-medium">
              Auto-publishes when scheduled time arrives
            </span>
          </div>

          <div className="space-y-2">
            {myScheduledPosts.map((sPost) => (
              <div
                key={sPost.id}
                className="bg-white border border-amber-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xs"
                id={`scheduled-post-card-${sPost.id}`}
              >
                <div className="flex items-center justify-between text-[10px] text-amber-800 font-semibold">
                  <span>
                    Scheduled for: {sPost.scheduledFor ? new Date(sPost.scheduledFor).toLocaleString() : 'Upcoming'}
                  </span>
                  {(sPost.postType === 'Private' || sPost.postType === 'Subscriber') && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
                      {sPost.postType}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-800 whitespace-pre-wrap">{sPost.content}</p>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                  {publishScheduledPost && (
                    <button
                      type="button"
                      onClick={() => {
                        publishScheduledPost(sPost.id);
                        showToast("Scheduled post published now!");
                      }}
                      className="px-2.5 py-1 bg-[#076653] hover:bg-[#065042] text-[#E3EF26] rounded text-[10px] font-bold cursor-pointer"
                    >
                      Publish Now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPostToDeleteId(sPost.id)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MY TIMELINE POSTS (Hidden when 0 posts exist per requirement 6) */}
      {myPosts.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-2.5" id="profile-posts-list">
          <div className="bg-white p-3 border-b border-gray-200 shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">My Posts ({myPosts.length})</span>
          </div>

          {myPosts.map((post) => {
            const originalPost = post.originalPostId ? posts.find(p => p.id === post.originalPostId) : null;
            const isOriginalDeleted = !!post.originalPostId && !originalPost;

            return (
            <article key={post.id} className="bg-white border-y border-gray-200 shadow-sm flex flex-col" id={`my-post-${post.id}`}>
              {/* Repost Header Attribution */}
              {post.repostedBy && (
                <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 text-xs text-gray-500 font-semibold border-b border-gray-100 bg-gray-50/70">
                  <Repeat2 className="w-3.5 h-3.5 text-[#076653]" />
                  <span className="text-gray-900 font-bold">
                    {post.repostedBy.userId === profile.id || post.repostedBy.name === profile.name ? 'You' : post.repostedBy.name}
                  </span>
                  <span>reposted</span>
                  <span className="text-[10px] text-gray-400">• {post.repostedBy.timestamp}</span>
                </div>
              )}

              {/* Post Header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <img
                    src={post.repostedBy ? (originalPost?.authorAvatar || post.authorAvatar) : profile.avatar}
                    alt=""
                    onClick={() => onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                    title={`View ${post.authorName}'s profile`}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3
                      onClick={() => onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)}
                      className="text-xs font-bold text-gray-900 leading-tight cursor-pointer hover:text-[#076653] hover:underline"
                      title={`View ${post.authorName}'s profile`}
                    >
                      {post.authorName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                      <span>{post.timestamp}</span>
                      {(post.postType === 'Subscriber' || post.postType === 'Private') && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center bg-gray-100 px-1.5 py-0.2 rounded text-[9.5px] font-semibold text-gray-700 border border-gray-200">
                            {post.postType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPostToDeleteId(post.id)}
                  className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-50 cursor-pointer"
                  id={`delete-my-post-${post.id}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content & Deleted check */}
              {isOriginalDeleted ? (
                <div className="mx-3 my-3 p-3.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 italic flex items-center gap-2">
                  <span>This post is no longer available because the original post was deleted.</span>
                </div>
              ) : (
                <>
                  <div className="px-3 pb-2 text-xs text-gray-800 leading-normal whitespace-pre-wrap">
                    {applySensitiveContentAlgorithm(post.content)}
                  </div>

                  {/* Embedded Quote Card if Quote Repost */}
                  {post.isQuoteRepost && (originalPost || post.sharedPost) && (
                    <div className="mx-3 mb-3 border border-gray-200 rounded-xl p-3 bg-gray-50/70 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={originalPost?.authorAvatar || post.sharedPost?.authorAvatar || ''}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-bold text-gray-900">
                          {originalPost?.authorName || post.sharedPost?.authorName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          · {originalPost?.timestamp || post.sharedPost?.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                        {originalPost?.content || post.sharedPost?.content}
                      </p>
                      {(originalPost?.image || post.sharedPost?.image) && (
                        <div className="rounded-lg overflow-hidden max-h-48 bg-zinc-900">
                          <img
                            src={originalPost?.image || post.sharedPost?.image}
                            alt=""
                            className="w-full h-full object-cover max-h-48"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Post Media Rendering */}
              {(() => {
                const postAttachments = post.attachments && post.attachments.length > 0
                  ? post.attachments
                  : post.attachment
                    ? [post.attachment]
                    : post.image
                      ? [{ name: 'image.jpg', size: '', type: 'image' as const, url: post.image }]
                      : [];

                if (postAttachments.length === 0) return null;

                const images = postAttachments.filter(a => a.type === 'image');
                const videos = postAttachments.filter(a => a.type === 'video');
                const files = postAttachments.filter(a => a.type === 'file');

                return (
                  <div className="border-y border-gray-100 bg-gray-50 flex flex-col divide-y divide-gray-100">
                    {videos.map((vid, vIdx) => (
                      <div key={`prof-vid-${post.id}-${vid.name || vIdx}`} className="relative group/video bg-black flex flex-col">
                        <video
                          src={vid.url}
                          className="w-full max-h-[300px] object-contain bg-black"
                          controls
                          playsInline
                        />
                        <div className="bg-zinc-900/95 border-t border-zinc-800/80 px-3 py-1.5 flex items-center gap-2 text-white" id={`profile-video-comment-bar-${post.id}-${vIdx}`}>
                          <img
                            src={profile.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <input
                            type="text"
                            value={inlineComments[post.id] || ''}
                            onChange={(e) => setInlineComments({ ...inlineComments, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleProfileCommentSubmit(post.id);
                            }}
                            placeholder="Write a comment on this video..."
                            className="bg-zinc-800/90 border border-zinc-700/60 rounded-full px-3 py-1 text-xs text-white placeholder-zinc-400 flex-1 focus:outline-none focus:border-[#E3EF26] focus:bg-zinc-800"
                            id={`profile-video-comment-input-${post.id}-${vIdx}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleProfileCommentSubmit(post.id)}
                            className="p-1 text-[#E3EF26] hover:text-white transition-colors cursor-pointer"
                            title="Post comment"
                            id={`profile-video-comment-submit-${post.id}-${vIdx}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {images.length > 0 && (
                      <div className={`overflow-hidden bg-gray-900 ${
                        images.length === 1
                          ? 'flex justify-center max-h-[300px]'
                          : images.length === 2
                            ? 'grid grid-cols-2 gap-0.5 max-h-[280px]'
                            : images.length === 3
                              ? 'grid grid-cols-3 gap-0.5 max-h-[240px]'
                              : 'grid grid-cols-2 sm:grid-cols-3 gap-0.5 max-h-[320px]'
                      }`}>
                        {images.map((img, iIdx) => (
                          <div key={`prof-img-${post.id}-${img.name || iIdx}`} className="relative overflow-hidden bg-black flex items-center justify-center aspect-4/3 sm:aspect-auto">
                            <img
                              src={img.url}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {files.map((fl, fIdx) => (
                      <div key={`prof-file-${post.id}-${fl.name || fIdx}`} className="p-3 w-full flex items-center justify-between gap-3 bg-white border-y border-gray-100 py-3 px-4">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-gray-800 truncate">{fl.name}</span>
                          <span className="text-[10px] text-gray-500">{fl.size}</span>
                        </div>
                        <a
                          href={fl.url}
                          download={fl.name}
                          className="px-3 py-1 bg-[#EBF7F2] hover:bg-[#d8efe5] text-[#076653] rounded text-[10px] font-bold border border-[#076653]/30"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 5-Item Post Action Bar: ❤️ Like · 💬 Comment · 🔄 Repost · ↗ Share · 🔖 Save */}
              <PostActionBar
                post={post}
                currentUserId={profile.id || 'user_me'}
                isLiked={post.likedByMe}
                likeCount={post.likes || post.likeCount || 0}
                isPoppingLike={!!poppingLikeIds[post.id]}
                onLikeClick={() => handleLikeClick(post.id)}
                onCommentClick={() => {
                  setOpenCommentsPostIds((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                  setTimeout(() => {
                    const el = document.getElementById(`profile-comment-input-${post.id}`) as HTMLInputElement | null;
                    el?.focus();
                  }, 50);
                }}
                onInstantRepost={() => handleInstantRepost(post.id)}
                onUndoRepost={() => handleUndoRepost(post.id)}
                onOpenQuoteRepostModal={() => setQuoteRepostTarget(post)}
                onOpenShareHub={(sec) => handleProfileSharePost(post.id, sec)}
                onToggleSave={() => handleToggleSave(post.id)}
                onShowToast={showToast}
              />

              {/* Real Inline Comments & Reply Section on Profile */}
              {(post.comments.length > 0 || openCommentsPostIds[post.id]) && (
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex flex-col gap-2">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 text-xs items-start">
                      <img
                        src={comment.authorAvatar}
                        alt=""
                        onClick={() => onViewProfile?.(comment.authorName, comment.authorAvatar, comment.authorId)}
                        className="w-6 h-6 rounded-full object-cover mt-0.5 border border-gray-200 shrink-0 cursor-pointer"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-white border border-gray-200/80 rounded-xl px-2.5 py-1.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span
                              onClick={() => onViewProfile?.(comment.authorName, comment.authorAvatar, comment.authorId)}
                              className="font-bold text-[10px] text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                            >
                              {comment.authorName}
                            </span>
                            <span className="text-[8px] text-gray-400">{comment.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-gray-800 leading-normal">
                            {comment.replyToName && (
                              <span className="text-[9px] font-bold text-[#076653] bg-[#EBF7F2] px-1.5 py-0.5 rounded mr-1">
                                @{comment.replyToName}
                              </span>
                            )}
                            {applySensitiveContentAlgorithm(comment.content)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo({ postId: post.id, commentId: comment.id, authorName: comment.authorName });
                            setOpenCommentsPostIds((prev) => ({ ...prev, [post.id]: true }));
                            setTimeout(() => {
                              const input = document.getElementById(`profile-comment-input-${post.id}`) as HTMLInputElement | null;
                              input?.focus();
                            }, 50);
                          }}
                          className="text-[9px] text-gray-500 hover:text-[#076653] font-bold mt-0.5 ml-1 cursor-pointer hover:underline"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Inline reply input */}
                  <div className="pt-1 flex flex-col gap-1">
                    {replyingTo && replyingTo.postId === post.id && (
                      <div className="flex items-center justify-between px-2.5 py-1 bg-[#EBF7F2] border border-[#076653]/20 rounded-lg text-[10px] text-[#076653] font-semibold">
                        <span>Replying to @{replyingTo.authorName}</span>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 items-center">
                      <img
                        src={profile.avatar}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover border border-gray-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 relative flex items-center">
                        <input
                          id={`profile-comment-input-${post.id}`}
                          type="text"
                          value={inlineComments[post.id] || ''}
                          onChange={(e) => setInlineComments({ ...inlineComments, [post.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleProfileCommentSubmit(post.id);
                          }}
                          placeholder="Write a reply..."
                          className="w-full bg-white border border-gray-200 rounded-full px-3 py-1.5 pr-8 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        />
                        <button
                          type="button"
                          onClick={() => handleProfileCommentSubmit(post.id)}
                          className="absolute right-2 text-gray-400 hover:text-[#076653] p-0.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
            );
          })}
        </div>
      )}

      {/* 5. EDIT PROFILE & SETTINGS MODAL */}
      <AnimatePresence>
        {isEditingDetails && (
          <div className="fixed inset-0 bg-black/60 z-[75] flex items-center justify-center p-3 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]"
              id="bissho-barta-settings-modal"
            >
              {/* Modal Header */}
              <div className="bg-[#076653] text-[#E3EF26] px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(false)}
                    aria-label="Back to Profile"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                    <span>Back</span>
                  </button>
                  <h3 className="text-sm font-bold leading-tight">Edit Profile & Settings</h3>
                </div>
                <button
                  onClick={() => setIsEditingDetails(false)}
                  aria-label="Close settings"
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  id="close-settings-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Settings Navigation Tabs */}
              <div className="bg-slate-50 border-b border-gray-200 p-1.5 flex gap-1 overflow-x-auto scrollbar-none text-xs font-semibold text-gray-600">
                {[
                  { id: 'account', label: 'Profile' },
                  { id: 'privacy', label: 'Privacy' },
                  { id: 'security', label: 'Security (Demo)' },
                  { id: 'notifications', label: 'Notifications' },
                  { id: 'media', label: 'Preferences' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                      settingsTab === tab.id
                        ? 'bg-white text-[#076653] font-bold shadow-2xs border border-gray-200'
                        : 'hover:bg-gray-200/60 text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Container */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {/* TAB 1: ACCOUNT & PROFILE */}
                {settingsTab === 'account' && (
                  <div className="space-y-3.5">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        id="edit-profile-name"
                      />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Bio</label>
                      <textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        rows={2}
                        maxLength={150}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#076653] resize-none"
                        id="bio-textarea-field"
                      />
                    </div>

                    {/* Profile Photo */}
                    <div className="bg-[#EBF7F2]/60 p-3 rounded-lg border border-[#076653]/30 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-extrabold text-gray-800 uppercase tracking-wide">
                          Profile Photo
                        </label>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white border border-[#076653]/40 text-[#076653] hover:bg-[#EBF7F2] rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                          id="modal-upload-avatar-btn"
                        >
                          Choose Device File
                        </button>
                      </div>
                      <input
                        type="url"
                        value={editedAvatar}
                        onChange={(e) => setEditedAvatar(e.target.value)}
                        placeholder="Image URL or upload from device"
                        className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        id="edit-profile-avatar"
                      />
                    </div>

                    {/* Cover Attachment */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-extrabold text-gray-800 uppercase tracking-wide">
                          Cover Photo / Video
                        </label>
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                          id="modal-upload-cover-btn"
                        >
                          Choose Device File
                        </button>
                      </div>
                      <input
                        type="url"
                        value={editedCover}
                        onChange={(e) => setEditedCover(e.target.value)}
                        placeholder="Image/Video URL or upload from device"
                        className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        id="edit-profile-cover"
                      />
                    </div>

                    {/* Workplace */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Workplace / Occupation</label>
                      <input
                        type="text"
                        value={editedWork}
                        onChange={(e) => setEditedWork(e.target.value)}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        id="edit-profile-work"
                      />
                    </div>

                    {/* Education */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Education / University</label>
                      <input
                        type="text"
                        value={editedEdu}
                        onChange={(e) => setEditedEdu(e.target.value)}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        id="edit-profile-education"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">City / Location</label>
                      <input
                        type="text"
                        value={editedLoc}
                        onChange={(e) => setEditedLoc(e.target.value)}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        id="edit-profile-location"
                      />
                    </div>

                    {/* Relationship Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Relationship Status</label>
                      <select
                        value={editedRel}
                        onChange={(e) => setEditedRel(e.target.value)}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#076653] bg-white"
                        id="edit-profile-relationship"
                      >
                        <option value="Single">Single</option>
                        <option value="In a relationship">In a relationship</option>
                        <option value="Married">Married</option>
                        <option value="Engaged">Engaged</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRIVACY */}
                {settingsTab === 'privacy' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Default Post Audience</span>
                        <span className="text-[10px] text-gray-500">Who can see your future posts by default</span>
                      </div>
                      <select
                        value={postPrivacy}
                        onChange={(e) => setPostPrivacy(e.target.value as any)}
                        className="text-xs font-bold p-1.5 border border-gray-300 rounded bg-white text-gray-800"
                      >
                        <option value="Public">Public</option>
                        <option value="Friends">Friends</option>
                        <option value="Only Me">Only Me</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Profile Details Visibility</span>
                        <span className="text-[10px] text-gray-500">Who can view your workplace, education and city</span>
                      </div>
                      <select
                        value={profileDetailsPrivacy}
                        onChange={(e) => setProfileDetailsPrivacy(e.target.value as any)}
                        className="text-xs font-bold p-1.5 border border-gray-300 rounded bg-white text-gray-800"
                      >
                        <option value="Public">Public</option>
                        <option value="Friends">Friends Only</option>
                        <option value="Only Me">Only Me</option>
                      </select>
                    </div>

                    <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">Profile Locking</span>
                        <span className="text-[10px] text-emerald-800">Only friends can see full cover photos and posts on your profile.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProfileLocked(!isProfileLocked)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          isProfileLocked ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">External Search Engine Indexing</span>
                        <span className="text-[10px] text-gray-500">Allow search engines to link to your profile.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSearchIndexing(!searchIndexing)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          searchIndexing ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: SECURITY & LOGIN (Clearly labeled Demo (not connected)) */}
                {settingsTab === 'security' && (
                  <div className="space-y-4">
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
                      Account authentication is running in local preview mode. Password and session controls below are labeled <strong>Demo (not connected)</strong>.
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Account Email Address</label>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                      />
                    </div>

                    {/* Password Change Form - Demo (not connected) */}
                    <form onSubmit={handlePasswordChangeSubmit} className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">Change Password</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Demo (not connected)
                        </span>
                      </div>

                      {passwordStatusMsg && (
                        <div className="p-2 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {passwordStatusMsg}
                        </div>
                      )}

                      <input
                        type="password"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="password"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        />
                        <input
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded cursor-pointer"
                      >
                        Change Password — Demo (not connected)
                      </button>
                    </form>

                    {/* 2FA Toggle */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Two-Factor Authentication (2FA)</span>
                        <span className="text-[10px] text-gray-500">Demo setting</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          twoFactorEnabled ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    {/* Active Logged-In Sessions */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Where You're Logged In</span>
                        <button
                          type="button"
                          onClick={handleLogoutOtherSessions}
                          className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-200 cursor-pointer"
                        >
                          Log Out All Other Sessions — Demo (not connected)
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {activeSessions.map((sess) => (
                          <div key={sess.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{sess.device}</span>
                              <span className="text-[10px] text-gray-500">{sess.location} • {sess.time}</span>
                            </div>
                            {sess.current ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">This Device</span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Sample Session</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: NOTIFICATIONS */}
                {settingsTab === 'notifications' && (
                  <div className="space-y-3.5">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Comments & Reactions Alerts</span>
                        <span className="text-[10px] text-gray-500">Get notified when someone reacts or replies to your post</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifyComments(!notifyComments)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          notifyComments ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Tagging & Mentions</span>
                        <span className="text-[10px] text-gray-500">Who can trigger a notification by tagging you</span>
                      </div>
                      <select
                        value={notifyTagging}
                        onChange={(e) => setNotifyTagging(e.target.value as any)}
                        className="text-xs font-bold p-1.5 border border-gray-300 rounded bg-white text-gray-800"
                      >
                        <option value="Anyone">Anyone</option>
                        <option value="Friends of Friends">Friends of Friends</option>
                        <option value="Friends Only">Friends Only</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Friend Requests Alerts</span>
                        <span className="text-[10px] text-gray-500">Notify me on new incoming friend requests</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifyFriendRequests(!notifyFriendRequests)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          notifyFriendRequests ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Pages & Groups Activity</span>
                        <span className="text-[10px] text-gray-500">Alerts from Bissho Barta Pages and Groups</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifyPageGroups(!notifyPageGroups)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          notifyPageGroups ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: PREFERENCES & MEDIA (Includes Feed Content Preference & Video Resolution) */}
                {settingsTab === 'media' && (
                  <div className="space-y-3.5">
                    {/* Home Feed Content Preference */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Home Feed Preference</span>
                        <span className="text-[10px] text-gray-500">Choose between algorithmic For you or Following Feeds</span>
                      </div>
                      <select
                        value={feedPreference}
                        onChange={(e) => {
                          const next = e.target.value as 'For you' | 'Following';
                          setFeedPreference(next);
                          updateFeedPreferenceState(next);
                        }}
                        className="text-xs font-bold p-1.5 border border-gray-300 rounded bg-white text-gray-800"
                      >
                        <option value="For you">For You</option>
                        <option value="Following">Following</option>
                      </select>
                    </div>

                    {/* Video Quality Resolution Setting (Kept inside Settings only) */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Video Resolution</span>
                        <span className="text-[10px] text-gray-500">Default playback and upload quality</span>
                      </div>
                      <select
                        value={videoResolution}
                        onChange={(e) => {
                          const next = e.target.value as VideoResolutionSetting;
                          setVideoResolution(next);
                          setStoredVideoResolution(next);
                        }}
                        className="text-xs font-bold p-1.5 border border-gray-300 rounded bg-white text-gray-800"
                      >
                        <option value="720p">720p</option>
                        <option value="480p">480p</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Video Autoplay Mode</span>
                        <span className="text-[10px] text-gray-500">Choose when feed videos start playing automatically</span>
                      </div>
                      <select
                        value={videoAutoplay}
                        onChange={(e) => setVideoAutoplay(e.target.value as any)}
                        className="text-xs font-bold p-1.5 border border-gray-300 rounded bg-white text-gray-800"
                      >
                        <option value="Cellular & Wi-Fi">Cellular & Wi-Fi</option>
                        <option value="Wi-Fi Only">Wi-Fi Only</option>
                        <option value="Never">Never Autoplay</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">In-App Sound Effects</span>
                        <span className="text-[10px] text-gray-500">Play sounds when liking posts or sending messages</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInAppSounds(!inAppSounds)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          inAppSounds ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Data Saver Mode</span>
                        <span className="text-[10px] text-gray-500">Reduces image sizes and prevents background video preload</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDataSaver(!dataSaver)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          dataSaver ? 'bg-[#076653] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 p-3.5 border-t border-gray-200 flex gap-2 justify-end sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-200/70 rounded-lg cursor-pointer"
                  id="edit-profile-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-1.5 text-xs font-bold rounded-lg text-[#076653] bg-[#E3EF26] hover:bg-[#d5e022] shadow-xs cursor-pointer active:scale-95 transition-all"
                  id="edit-profile-save"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* FOLLOWING MODAL */}
        {showFollowingModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] border border-gray-200"
            >
              <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Following ({followingCount})</h3>
                  <p className="text-[10px] text-gray-500">People and accounts you follow</p>
                </div>
                <button
                  onClick={() => setShowFollowingModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-white border-b border-gray-100">
                <input
                  type="text"
                  value={followingSearch}
                  onChange={(e) => setFollowingSearch(e.target.value)}
                  placeholder="Search following..."
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#076653]"
                />
              </div>

              <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-gray-100">
                {followingList
                  .filter(item => item.name.toLowerCase().includes(followingSearch.toLowerCase()) || item.role.toLowerCase().includes(followingSearch.toLowerCase()))
                  .map(item => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div
                        onClick={() => {
                          setShowFollowingModal(false);
                          onViewProfile?.(item.name, item.avatar, item.id);
                        }}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                      >
                        <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-[#076653] transition-all" />
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-bold text-gray-900 group-hover:text-[#076653] group-hover:underline truncate">{item.name}</span>
                          <span className="text-[10px] text-gray-500 truncate">{item.role}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleFollowUser(item.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          item.isFollowing
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                            : 'bg-[#076653] hover:bg-[#065042] text-[#E3EF26] shadow-xs'
                        }`}
                      >
                        {item.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowFollowingModal(false)}
                  className="px-4 py-1.5 bg-[#076653] text-[#E3EF26] text-xs font-bold rounded-lg hover:bg-[#065042] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* FOLLOWERS MODAL */}
        {showFollowersModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] border border-gray-200"
            >
              <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Followers ({followersCount})</h3>
                  <p className="text-[10px] text-gray-500">People following your updates</p>
                </div>
                <button
                  onClick={() => setShowFollowersModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 overflow-y-auto space-y-2.5 flex-1 divide-y divide-gray-100">
                {followersList.map(item => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                    <div
                      onClick={() => {
                        setShowFollowersModal(false);
                        onViewProfile?.(item.name, item.avatar, item.id);
                      }}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                    >
                      <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-[#076653] transition-all" />
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-bold text-gray-900 group-hover:text-[#076653] group-hover:underline truncate">{item.name}</span>
                        <span className="text-[10px] text-gray-500 truncate">{item.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleFollowerBack(item.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          item.isFollowing
                            ? 'bg-[#EBF7F2] text-[#076653] border border-[#076653]/30'
                            : 'bg-[#076653] hover:bg-[#065042] text-[#E3EF26] shadow-xs'
                        }`}
                      >
                        {item.isFollowing ? 'Friends' : 'Follow Back'}
                      </button>
                      <button
                        onClick={() => handleRemoveFollower(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="Remove follower"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowFollowersModal(false)}
                  className="px-4 py-1.5 bg-[#076653] text-[#E3EF26] text-xs font-bold rounded-lg hover:bg-[#065042] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* PAGES MODAL */}
        {showPagesModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 backdrop-blur-2xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[88vh] border border-gray-200"
            >
              <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Bissho Barta Pages</h3>
                  <p className="text-[10px] text-gray-500">Manage pages you created or build a new one</p>
                </div>
                <button
                  onClick={() => {
                    setShowPagesModal(false);
                    setIsCreatingPage(false);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 flex-1">
                {userPages.length > 0 && !isCreatingPage && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Your Pages</h4>
                    <div className="space-y-2">
                      {userPages.map(page => (
                        <div key={page.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-3">
                          <div
                            onClick={() => {
                              setShowPagesModal(false);
                              setIsCreatingPage(false);
                              onViewProfile?.(
                                page.name,
                                page.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80",
                                page.id
                              );
                            }}
                            className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                          >
                            <img src={page.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80"} alt={page.name} className="w-11 h-11 rounded-lg object-cover border border-gray-200 shadow-xs group-hover:ring-2 group-hover:ring-[#076653] transition-all" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-gray-900 group-hover:text-[#076653] group-hover:underline truncate">{page.name}</span>
                              <span className="text-[10px] text-emerald-700 font-semibold">{page.category} • {page.followersCount} Followers</span>
                              {page.bio && <span className="text-[10px] text-gray-500 truncate mt-0.5">{page.bio}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-xs font-bold"
                            title="Delete Page"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isCreatingPage ? (
                  <button
                    onClick={() => setIsCreatingPage(true)}
                    className="w-full py-2.5 border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>+ Create a New Bissho Barta Page</span>
                  </button>
                ) : (
                  <form onSubmit={handleCreatePageSubmit} className="bg-gray-50 p-3.5 border border-emerald-200 rounded-lg space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-xs font-bold text-gray-900">Create Bissho Barta Page</span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingPage(false)}
                        className="text-[10px] text-gray-500 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Page Name *</label>
                      <input
                        type="text"
                        required
                        value={newPageName}
                        onChange={(e) => setNewPageName(e.target.value)}
                        placeholder="e.g. Dhaka Digital Studio"
                        className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Category</label>
                      <select
                        value={newPageCategory}
                        onChange={(e) => setNewPageCategory(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="Business & Brand">Business & Brand</option>
                        <option value="Science & Technology">Science & Technology</option>
                        <option value="Community & Fanpage">Community & Fanpage</option>
                        <option value="Creator & Public Figure">Creator & Public Figure</option>
                        <option value="Gaming & Entertainment">Gaming & Entertainment</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 uppercase">Page Bio / Description</label>
                      <textarea
                        rows={2}
                        value={newPageBio}
                        onChange={(e) => setNewPageBio(e.target.value)}
                        placeholder="Short description of what your page is about..."
                        className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingPage(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs cursor-pointer"
                      >
                        Create Page
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowPagesModal(false);
                    setIsCreatingPage(false);
                  }}
                  className="px-4 py-1.5 bg-[#076653] text-[#E3EF26] text-xs font-bold rounded-lg hover:bg-[#065042] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Hub Modal */}
      <ShareHubModal
        isOpen={!!shareHubTarget}
        onClose={() => setShareHubTarget(null)}
        post={shareHubTarget}
        friends={friends}
        initialSection={shareHubSection}
        onShareComplete={handleCompleteShare}
        onShowToast={showToast}
      />

      {/* Quote Repost Modal */}
      <QuoteRepostModal
        isOpen={!!quoteRepostTarget}
        onClose={() => setQuoteRepostTarget(null)}
        post={quoteRepostTarget}
        profile={profile}
        onSubmitQuoteRepost={handleQuoteRepostSubmit}
        onShowToast={showToast}
      />
    </div>
  );
}
