import React, { useRef, useState, ChangeEvent, useMemo } from 'react';
import { UserProfile, Post, Attachment, PageItem } from '../types';
import { 
  MapPin, Briefcase, GraduationCap, Heart, Edit2, Check, X, Camera, Save, Plus, Film, 
  Image as ImageIcon, UserCheck, Users, Flag, Trash2, Building, ExternalLink, Search, 
  Settings, Shield, Key, Bell, Lock, Eye, Smartphone, Monitor, CheckCircle2, Sliders, 
  Volume2, Wifi, Globe, User, MessageCircle, Share2, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { applySensitiveContentAlgorithm } from '../utils/sensitiveContent';

interface ProfileTabProps {
  profile: UserProfile;
  posts: Post[];
  updateUserProfile: (profile: UserProfile) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, commentText: string) => void;
  deletePost: (postId: string) => void;
  addPost: (content: string, image?: string, attachment?: Attachment) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
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
  addPost,
  onViewProfile
}: ProfileTabProps) {
  // File refs for avatar and cover attachment
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Editing states
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState(profile.bio);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedWork, setEditedWork] = useState(profile.work);
  const [editedEdu, setEditedEdu] = useState(profile.education);
  const [editedLoc, setEditedLoc] = useState(profile.location);
  const [editedRel, setEditedRel] = useState(profile.relationship);
  const [editedAvatar, setEditedAvatar] = useState(profile.avatar);
  const [editedCover, setEditedCover] = useState(profile.coverPhoto);

  // Bissho Barta Settings Tabs & Sub-states
  const [settingsTab, setSettingsTab] = useState<'account' | 'privacy' | 'security' | 'notifications' | 'media'>('account');
  const [postPrivacy, setPostPrivacy] = useState<'Public' | 'Friends' | 'Only Me'>('Public');
  const [profileDetailsPrivacy, setProfileDetailsPrivacy] = useState<'Public' | 'Friends' | 'Only Me'>('Friends');
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [searchIndexing, setSearchIndexing] = useState(true);

  // Security & Password Settings
  const [accountEmail, setAccountEmail] = useState('mirxbd@gmail.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [activeSessions, setActiveSessions] = useState([
    { id: 'sess-1', device: 'Windows PC • Chrome Browser', location: 'Dhaka, Bangladesh', time: 'Active now (This device)', current: true },
    { id: 'sess-2', device: 'Samsung Galaxy S23 • Bissho Barta App', location: 'Dhaka, Bangladesh', time: '2 hours ago', current: false },
    { id: 'sess-3', device: 'iPad Air • Safari Browser', location: 'Chittagong, Bangladesh', time: 'Yesterday', current: false },
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

  // Toast feedback
  const [settingsToast, setSettingsToast] = useState<string | null>(null);

  // Quick post from profile
  const [quickPostContent, setQuickPostContent] = useState('');
  const [inlineComments, setInlineComments] = useState<{ [postId: string]: string }>({});

  const handleProfileCommentSubmit = (postId: string) => {
    const text = inlineComments[postId];
    if (!text || !text.trim()) return;
    addComment(postId, text);
    setInlineComments({ ...inlineComments, [postId]: '' });
  };

  // 3 Functions State: Following, Followers, Pages
  const followingCount = profile.followingCount ?? 184;
  const followersCount = profile.followersCount ?? 1250;
  const userPages: PageItem[] = profile.pages ?? [
    {
      id: "page-1",
      name: "Tech Trends & Code",
      category: "Science & Technology",
      avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
      followersCount: 3420,
      createdAt: "2024",
      bio: "Official page for latest Tech Trends, web dev tips, and AI code breakdowns."
    }
  ];

  // Modals visibility
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showPagesModal, setShowPagesModal] = useState(false);

  // Search inside following modal
  const [followingSearch, setFollowingSearch] = useState('');
  const [followingList, setFollowingList] = useState([
    { id: 'fl-1', name: 'Sarah Jenkins', role: 'UX Designer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: true },
    { id: 'fl-2', name: 'David Chen', role: 'Full Stack Developer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: true },
    { id: 'fl-3', name: 'Emily Rodriguez', role: 'Product Manager', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: true },
    { id: 'fl-4', name: 'Michael Chang', role: 'DevOps Engineer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: true },
    { id: 'fl-5', name: 'Jessica Taylor', role: 'AI Researcher', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: true },
  ]);

  const [followersList, setFollowersList] = useState([
    { id: 'f-1', name: 'Marcus Aurelius', role: 'Founder & Author', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: false },
    { id: 'f-2', name: 'Anna Peterson', role: 'Digital Marketer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: true },
    { id: 'f-3', name: 'Robert Downey', role: 'Content Creator', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: false },
    { id: 'f-4', name: 'Sophia Martinez', role: 'Graphic Artist', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80', isFollowing: true },
  ]);

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

    setFollowingList(prev => prev.map(f => f.id === id ? { ...f, isFollowing: nextState } : f));
    updateUserProfile({ ...profile, followingCount: newCount });
  };

  const handleToggleFollowerBack = (id: string) => {
    const item = followersList.find(f => f.id === id);
    if (!item) return;
    const nextState = !item.isFollowing;
    const diff = nextState ? 1 : -1;
    const newCount = Math.max(0, followingCount + diff);

    setFollowersList(prev => prev.map(f => f.id === id ? { ...f, isFollowing: nextState } : f));
    updateUserProfile({ ...profile, followingCount: newCount });
  };

  const handleRemoveFollower = (id: string) => {
    setFollowersList(prev => prev.filter(f => f.id !== id));
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
        alert('Only image files can be uploaded for profile photo.');
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
        alert('Please select an image or video file (MP4 480p supported) for cover attachment.');
        e.target.value = '';
        return;
      }

      // Max file size 50MB
      const maxSizeBytes = 50 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        alert('File size exceeds 50 MB limit. Please choose a smaller video/image file.');
        e.target.value = '';
        return;
      }

      if (isVideo) {
        // Enforce max 2 minutes (120 seconds) video length limit
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        const blobUrl = URL.createObjectURL(file);

        tempVideo.onloadedmetadata = () => {
          URL.revokeObjectURL(blobUrl);
          const duration = tempVideo.duration;

          if (duration > 120) {
            const mins = Math.floor(duration / 60);
            const secs = Math.round(duration % 60);
            alert(`Selected video length is ${mins}m ${secs}s. Maximum allowed cover video length is 2 minutes (120 seconds). Please upload a video under 2 minutes.`);
            return;
          }

          // Duration is <= 120s, process file as Data URL
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
          alert('Could not parse video metadata. Please ensure the file is a supported MP4 or video format.');
        };

        tempVideo.src = blobUrl;
      } else {
        // Image file
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

  const handleSaveBio = () => {
    updateUserProfile({ ...profile, bio: editedBio });
    setIsEditingBio(false);
  };

  const handleSaveSettings = () => {
    updateUserProfile({
      name: editedName,
      avatar: editedAvatar,
      coverPhoto: editedCover,
      bio: profile.bio,
      work: editedWork,
      education: editedEdu,
      location: editedLoc,
      relationship: editedRel
    });
    setIsEditingDetails(false);
    setSettingsToast("Bissho Barta settings saved successfully!");
    setTimeout(() => setSettingsToast(null), 3500);
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordStatusMsg("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatusMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg("New passwords do not match.");
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStatusMsg("Password changed successfully!");
    setTimeout(() => setPasswordStatusMsg(''), 4000);
  };

  const handleLogoutOtherSessions = () => {
    setActiveSessions(prev => prev.filter(s => s.current));
    setSettingsToast("Logged out of all other active sessions.");
    setTimeout(() => setSettingsToast(null), 3500);
  };

  const handleCreateProfilePost = () => {
    if (!quickPostContent.trim()) return;
    addPost(quickPostContent);
    setQuickPostContent('');
  };

  // Filter posts to show only the user's posts (memoized)
  const myPosts = useMemo(() => {
    return posts.filter(
      (post) => post.authorName === profile.name || post.authorName === "Alex Rivera"
    );
  }, [posts, profile.name]);

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

      {/* Settings Saved Floating Toast Notification */}
      <AnimatePresence>
        {settingsToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-60 bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 border border-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{settingsToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. COVER PHOTO & AVATAR BLOCK */}
      <div className="bg-white pb-3.5 border-b border-gray-200 shadow-sm relative">
        {/* Cover Photo / Video Container */}
        <div className="h-48 w-full bg-slate-900 overflow-hidden relative group">
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
                onError={(e) => {
                  console.error("Cover video playback error:", e);
                }}
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

          {/* Cover attachment upload button */}
          <button 
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-2.5 right-2.5 bg-black/75 hover:bg-black/90 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-md backdrop-blur-xs transition-all cursor-pointer z-10 border border-white/20"
            title="Upload cover photo or video"
            id="upload-cover-attachment-btn"
          >
            <Camera className="w-4 h-4 text-[#E3EF26]" />
            <span>Edit Cover</span>
          </button>
        </div>

        {/* Avatar overlapping */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-150 relative group">
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              onClick={() => onViewProfile?.(profile.name, profile.avatar)}
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              title="Click to view your public profile"
              referrerPolicy="no-referrer"
            />
            {/* Click avatar photo icon */}
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer"
              title="Click to upload profile photo"
              id="upload-avatar-hover-btn"
            >
              <Camera className="w-5 h-5 mb-0.5 text-[#E3EF26]" />
              <span>Edit Photo</span>
            </button>
            <button 
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-white hover:bg-[#EBF7F2] border border-gray-300 text-gray-700 p-1.5 rounded-full shadow-md cursor-pointer group-hover:hidden"
              title="Edit profile photo"
              id="upload-avatar-icon-btn"
            >
              <Camera className="w-3.5 h-3.5 text-[#076653]" />
            </button>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mt-14 text-center px-4">
          <h2 
            onClick={() => onViewProfile?.(profile.name, profile.avatar)}
            className="text-base font-bold text-gray-900 leading-tight cursor-pointer hover:text-[#076653] hover:underline inline-block"
            title="Click to view public profile details"
          >
            {profile.name}
          </h2>
          
          {/* 3 FUNCTIONS RIGHT AFTER PROFILE NAME: FOLLOWING, FOLLOWERS, PAGES */}
          <div className="flex items-center justify-center gap-2 mt-2.5 mb-2 flex-wrap" id="profile-three-functions-bar">
            {/* 1. FOLLOWING NUMBER */}
            <button
              onClick={() => setShowFollowingModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#EBF7F2] hover:bg-[#d8efe5] border border-[#076653]/30 rounded-full text-xs font-semibold text-[#076653] transition-all shadow-xs cursor-pointer active:scale-95"
              id="profile-following-btn"
              title="Click to view total users followed"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#076653]" />
              <span><strong className="font-extrabold">{followingCount}</strong> Following</span>
            </button>

            {/* 2. FOLLOWERS NUMBER */}
            <button
              onClick={() => setShowFollowersModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full text-xs font-semibold text-purple-700 transition-all shadow-xs cursor-pointer active:scale-95"
              id="profile-followers-btn"
              title="Click to view total followers"
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span><strong className="font-extrabold">{followersCount >= 1000 ? (followersCount/1000).toFixed(1) + 'K' : followersCount}</strong> Followers</span>
            </button>

            {/* 3. PAGES (SHOW IF USER CREATED A PAGE OR NOT) */}
            <button
              onClick={() => setShowPagesModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95 ${
                userPages.length > 0
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
              }`}
              id="profile-pages-btn"
              title="Click to view or create Bissho Barta Pages"
            >
              <Flag className={`w-3.5 h-3.5 ${userPages.length > 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                {userPages.length > 0 ? (
                  <><strong>{userPages.length}</strong> {userPages.length === 1 ? 'Page Created' : 'Pages Created'}</>
                ) : (
                  <>No Pages Created</>
                )}
              </span>
            </button>
          </div>
          
          {/* Bio display or editing */}
          <div className="mt-2 text-xs text-gray-600 max-w-sm mx-auto">
            {!isEditingBio ? (
              <div className="flex flex-col items-center gap-1.5">
                <p className="italic leading-relaxed">"{profile.bio}"</p>
                <button
                  onClick={() => {
                    setEditedBio(profile.bio);
                    setIsEditingBio(true);
                  }}
                  className="text-[10px] text-[#076653] font-semibold hover:underline flex items-center gap-1"
                  id="edit-bio-btn"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Bio</span>
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-2.5 rounded flex flex-col gap-2 mt-1.5">
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="w-full text-xs text-gray-850 p-1.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#076653] resize-none"
                  rows={2}
                  maxLength={150}
                  id="bio-textarea-field"
                />
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="px-2.5 py-1 text-[10px] font-bold text-gray-500 bg-white border border-gray-200 rounded"
                    id="cancel-bio-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBio}
                    className="px-2.5 py-1 text-[10px] font-bold text-[#E3EF26] bg-[#076653] hover:bg-[#065042] rounded flex items-center gap-1"
                    id="save-bio-btn"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PROFILE DETAILS / ABOUT LIST */}
      <div className="bg-white p-3.5 border-y border-gray-200 mt-2.5 shadow-sm" id="profile-about-panel">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">About Me</h3>
        </div>

        <div className="flex flex-col gap-2.5 text-xs text-gray-700">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Works as <span className="font-semibold">{profile.work}</span></span>
          </div>
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Studied at <span className="font-semibold">{profile.education}</span></span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Lives in <span className="font-semibold">{profile.location}</span></span>
          </div>
          <div className="flex items-center gap-2.5">
            <Heart className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="font-medium">{profile.relationship}</span>
          </div>
        </div>
      </div>


      {/* 4. MY TIMELINE POSTS */}
      <div className="mt-2.5 flex flex-col gap-2.5" id="profile-posts-list">
        <div className="bg-white p-3 border-b border-gray-200 shadow-sm flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">My Posts ({myPosts.length})</span>
        </div>

        {myPosts.length === 0 ? (
          <div className="bg-white py-12 px-4 text-center border-y border-gray-200 shadow-sm">
            <p className="text-gray-500 text-xs">You haven't posted anything yet. Share your first update!</p>
          </div>
        ) : (
          myPosts.map((post) => (
            <article key={post.id} className="bg-white border-y border-gray-200 shadow-sm flex flex-col" id={`my-post-${post.id}`}>
              {/* Post Header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <img 
                    src={profile.avatar} 
                    alt="" 
                    onClick={() => onViewProfile?.(profile.name, profile.avatar)}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                    title={`View ${profile.name}'s profile`}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 
                      onClick={() => onViewProfile?.(profile.name, profile.avatar)}
                      className="text-xs font-bold text-gray-900 leading-tight cursor-pointer hover:text-[#076653] hover:underline"
                      title={`View ${profile.name}'s profile`}
                    >
                      {profile.name}
                    </h3>
                    <span className="text-[10px] text-gray-500">{post.timestamp}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Delete this post permanently?")) {
                      deletePost(post.id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-50"
                  id={`delete-my-post-${post.id}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-3 pb-2 text-xs text-gray-800 leading-normal">
                {applySensitiveContentAlgorithm(post.content)}
              </div>

              {/* Post Media Rendering (Handles single or multiple attachments) */}
              {(() => {
                const postAttachments = post.attachments && post.attachments.length > 0 
                  ? post.attachments 
                  : post.attachment 
                    ? [post.attachment] 
                    : post.image 
                      ? [{ name: 'image.jpg', size: '', type: 'image', url: post.image }] 
                      : [];

                if (postAttachments.length === 0) return null;

                const images = postAttachments.filter(a => a.type === 'image');
                const videos = postAttachments.filter(a => a.type === 'video');
                const files = postAttachments.filter(a => a.type === 'file');

                return (
                  <div className="border-y border-gray-100 bg-gray-50 flex flex-col divide-y divide-gray-100">
                    {/* 1. Videos */}
                    {videos.map((vid, vIdx) => (
                      <div key={vIdx} className="relative group/video bg-black flex flex-col">
                        <video 
                          src={vid.url} 
                          className="w-full max-h-[300px] object-contain bg-black" 
                          controls 
                          playsInline
                        />
                        {/* Write Comment Box on Video */}
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
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const curr = inlineComments[post.id] || '';
                                setInlineComments({ ...inlineComments, [post.id]: curr + "🔥" });
                              }}
                              className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                              title="Fire"
                            >
                              🔥
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = inlineComments[post.id] || '';
                                setInlineComments({ ...inlineComments, [post.id]: curr + "❤️" });
                              }}
                              className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                              title="Love"
                            >
                              ❤️
                            </button>
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
                      </div>
                    ))}

                    {/* 2. Images Grid */}
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
                          <div key={iIdx} className="relative overflow-hidden bg-black flex items-center justify-center group/img aspect-4/3 sm:aspect-auto">
                            <img 
                              src={img.url} 
                              alt="" 
                              className="w-full h-full object-cover hover:scale-102 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Files */}
                    {files.map((fl, fIdx) => (
                      <div key={fIdx} className="p-3 w-full flex items-center justify-between gap-3 bg-white border-y border-gray-100 py-3 px-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-[#EBF7F2] border border-[#076653]/30 text-[#076653] rounded flex items-center justify-center font-bold text-base">
                            📄
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-800 truncate">{fl.name}</span>
                            <span className="text-[10px] text-gray-500">{fl.size}</span>
                          </div>
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

              {/* Controls Row */}
              <div className="flex justify-around items-center py-1 text-gray-600 font-semibold text-xs border-b border-gray-50">
                <button
                  onClick={() => likePost(post.id)}
                  className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-[#EBF7F2]/50 rounded ${
                    post.likedByMe ? 'text-[#076653]' : ''
                  }`}
                  id={`like-my-post-btn-${post.id}`}
                >
                  <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-[#076653]' : ''}`} />
                  <span>Like</span>
                  <span className="text-[11px] font-bold text-gray-500">({post.likes || 0})</span>
                </button>
                <div className="w-[1px] h-4 bg-gray-200"></div>
                <button
                  onClick={() => alert("Please open comments from the Home Feed tab to reply.")}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-gray-100 rounded"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Comment</span>
                  <span className="text-[11px] font-bold text-gray-500">({post.comments?.length || 0})</span>
                </button>
                <div className="w-[1px] h-4 bg-gray-200"></div>
                <button
                  onClick={() => alert("Post shared!")}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-gray-100 rounded"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                  <span className="text-[11px] font-bold text-gray-500">({post.shares || 0})</span>
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* 5. FACEBOOK SETTINGS & PRIVACY OVERLAY DIALOG */}
      <AnimatePresence>
        {isEditingDetails && (
          <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-3 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]"
              id="bissho-barta-settings-modal"
            >
              {/* Modal Header */}
              <div className="bg-[#076653] text-[#E3EF26] px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/15 rounded-lg text-[#E3EF26]">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-tight">Settings & Privacy</h3>
                    <p className="text-[10px] text-emerald-100">Manage account, privacy, security, and app preferences</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingDetails(false)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  id="close-settings-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Settings Navigation Tabs */}
              <div className="bg-slate-50 border-b border-gray-200 p-1.5 flex gap-1 overflow-x-auto scrollbar-none text-xs font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setSettingsTab('account')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    settingsTab === 'account'
                      ? 'bg-white text-[#076653] font-bold shadow-2xs border border-gray-200'
                      : 'hover:bg-gray-200/60 text-gray-600'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#076653]" />
                  <span>Account & Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('privacy')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    settingsTab === 'privacy'
                      ? 'bg-white text-emerald-700 font-bold shadow-2xs border border-gray-200'
                      : 'hover:bg-gray-200/60 text-gray-600'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Privacy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('security')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    settingsTab === 'security'
                      ? 'bg-white text-[#076653] font-bold shadow-2xs border border-gray-200'
                      : 'hover:bg-gray-200/60 text-gray-600'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-[#076653]" />
                  <span>Security & Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('notifications')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    settingsTab === 'notifications'
                      ? 'bg-white text-amber-700 font-bold shadow-2xs border border-gray-200'
                      : 'hover:bg-gray-200/60 text-gray-600'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-600" />
                  <span>Notifications</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('media')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    settingsTab === 'media'
                      ? 'bg-white text-purple-700 font-bold shadow-2xs border border-gray-200'
                      : 'hover:bg-gray-200/60 text-gray-600'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span>Preferences</span>
                </button>
              </div>

              {/* Tab Content Container */}
              <div className="p-4 overflow-y-auto space-y-4 flex-1">

                {/* TAB 1: ACCOUNT & PROFILE */}
                {settingsTab === 'account' && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                      <User className="w-4 h-4 text-[#076653]" />
                      <span>Account Information & Public Profile</span>
                    </h4>

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

                    {/* Profile Photo */}
                    <div className="bg-[#EBF7F2]/60 p-3 rounded-lg border border-[#076653]/30 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-extrabold text-gray-800 uppercase tracking-wide">
                          Profile Photo <span className="text-[#076653] font-semibold">(PNG / JPG)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-2.5 py-1 bg-white border border-[#076653]/40 text-[#076653] hover:bg-[#EBF7F2] rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          id="modal-upload-avatar-btn"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Choose Device File</span>
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
                          className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          id="modal-upload-cover-btn"
                        >
                          <Film className="w-3.5 h-3.5 text-purple-600" />
                          <span>Choose Device File</span>
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
                        <option value="It's complicated">It's complicated</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRIVACY */}
                {settingsTab === 'privacy' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span>Privacy & Audience Controls</span>
                    </h4>

                    {/* Default Post Privacy */}
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
                        <option value="Public">🌐 Public</option>
                        <option value="Friends">👥 Friends</option>
                        <option value="Only Me">🔒 Only Me</option>
                      </select>
                    </div>

                    {/* Profile Details Audience */}
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
                        <option value="Public">🌐 Public</option>
                        <option value="Friends">👥 Friends Only</option>
                        <option value="Only Me">🔒 Only Me</option>
                      </select>
                    </div>

                    {/* Profile Locking */}
                    <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-emerald-950 block">Profile Locking</span>
                          <span className="text-[10px] text-emerald-800">Only friends can see full cover photos, posts, and stories on your profile.</span>
                        </div>
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

                    {/* Search Engine Indexing */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Globe className="w-4 h-4 text-[#076653] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">External Search Engine Indexing</span>
                          <span className="text-[10px] text-gray-500">Allow Google and other search engines to link to your profile.</span>
                        </div>
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

                {/* TAB 3: SECURITY & LOGIN */}
                {settingsTab === 'security' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                      <Shield className="w-4 h-4 text-[#076653]" />
                      <span>Security, Password & Active Logins</span>
                    </h4>

                    {/* Account Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">Account Email Address</label>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        className="w-full text-xs text-gray-900 p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                      />
                    </div>

                    {/* Password Change Form */}
                    <form onSubmit={handlePasswordChangeSubmit} className="bg-[#EBF7F2]/60 p-3.5 rounded-lg border border-[#076653]/30 space-y-2.5">
                      <span className="text-xs font-bold text-[#076653] flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#076653]" />
                        <span>Change Password</span>
                      </span>

                      {passwordStatusMsg && (
                        <div className={`p-2 rounded text-[11px] font-bold ${passwordStatusMsg.includes('successfully') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
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
                          placeholder="New Password (min 6 chars)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        />
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#076653]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#076653] hover:bg-[#065042] text-[#E3EF26] text-xs font-bold rounded shadow-2xs cursor-pointer"
                      >
                        Update Password
                      </button>
                    </form>

                    {/* 2FA Toggle */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Smartphone className="w-4 h-4 text-[#076653] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">Two-Factor Authentication (2FA)</span>
                          <span className="text-[10px] text-gray-500">Require an authenticator app code on unrecognized logins.</span>
                        </div>
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
                        {activeSessions.length > 1 && (
                          <button
                            type="button"
                            onClick={handleLogoutOtherSessions}
                            className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                          >
                            Log Out All Other Sessions
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {activeSessions.map((sess) => (
                          <div key={sess.id} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <Monitor className="w-4 h-4 text-gray-500 shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{sess.device}</span>
                                <span className="text-[10px] text-gray-500">{sess.location} • {sess.time}</span>
                              </div>
                            </div>
                            {sess.current ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">This Device</span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Active</span>
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
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                      <Bell className="w-4 h-4 text-amber-600" />
                      <span>Notification Preferences</span>
                    </h4>

                    {/* Comments & Reactions */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Comments & Reactions Alerts</span>
                        <span className="text-[10px] text-gray-500">Get notified when someone reacts or replies to your post</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifyComments(!notifyComments)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          notifyComments ? 'bg-amber-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    {/* Tagging Alerts */}
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

                    {/* Friend Requests */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Friend Requests Alerts</span>
                        <span className="text-[10px] text-gray-500">Notify me on new incoming friend requests</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifyFriendRequests(!notifyFriendRequests)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          notifyFriendRequests ? 'bg-amber-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    {/* Page & Group Updates */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Pages & Groups Activity</span>
                        <span className="text-[10px] text-gray-500">Alerts from Bissho Barta Pages and Groups you created/joined</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotifyPageGroups(!notifyPageGroups)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          notifyPageGroups ? 'bg-amber-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: PREFERENCES & MEDIA */}
                {settingsTab === 'media' && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-gray-150 pb-1.5">
                      <Sliders className="w-4 h-4 text-purple-600" />
                      <span>App Preferences & Media Playback</span>
                    </h4>

                    {/* Video Autoplay */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <Wifi className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">Video Autoplay Mode</span>
                          <span className="text-[10px] text-gray-500">Choose when feed videos start playing automatically</span>
                        </div>
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

                    {/* In-App Sound Effects */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div className="flex items-start gap-2.5">
                        <Volume2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">In-App Sound Effects</span>
                          <span className="text-[10px] text-gray-500">Play sounds when liking posts or sending messages</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInAppSounds(!inAppSounds)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          inAppSounds ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>

                    {/* Data Saver Mode */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">Data Saver Mode</span>
                        <span className="text-[10px] text-gray-500">Reduces image sizes and prevents background video preload</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDataSaver(!dataSaver)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                          dataSaver ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer / Action Bar */}
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
                  className="px-5 py-1.5 text-xs font-bold rounded-lg text-[#076653] bg-[#E3EF26] hover:bg-[#d5e022] shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  id="edit-profile-save"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
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
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#EBF7F2] text-[#076653] rounded-full">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Following ({followingCount})</h3>
                    <p className="text-[10px] text-gray-500">People and accounts you follow</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFollowingModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 bg-white border-b border-gray-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={followingSearch}
                    onChange={(e) => setFollowingSearch(e.target.value)}
                    placeholder="Search following..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#076653]"
                  />
                </div>
              </div>

              {/* Following List */}
              <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-gray-100">
                {followingList
                  .filter(item => item.name.toLowerCase().includes(followingSearch.toLowerCase()) || item.role.toLowerCase().includes(followingSearch.toLowerCase()))
                  .map(item => (
                    <div key={item.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-bold text-gray-900 truncate">{item.name}</span>
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
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-full">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Followers ({followersCount})</h3>
                    <p className="text-[10px] text-gray-500">People following your updates</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFollowersModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Followers List */}
              <div className="p-3 overflow-y-auto space-y-2.5 flex-1 divide-y divide-gray-100">
                {followersList.map(item => (
                  <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-bold text-gray-900 truncate">{item.name}</span>
                        <span className="text-[10px] text-gray-500 truncate">{item.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleFollowerBack(item.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          item.isFollowing
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
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
                  className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 cursor-pointer"
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
              {/* Header */}
              <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                    <Flag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Bissho Barta Pages</h3>
                    <p className="text-[10px] text-gray-500">Manage pages you created or build a new one</p>
                  </div>
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
                {/* Status Indicator Banner */}
                {userPages.length > 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <p className="font-bold">You have created {userPages.length} Bissho Barta {userPages.length === 1 ? 'Page' : 'Pages'}!</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Your page is active and visible to followers.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5">
                    <Flag className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <p className="font-bold">No Pages Created Yet</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">You haven't created any Bissho Barta Pages. Create a Page to grow your brand, project, or business!</p>
                    </div>
                  </div>
                )}

                {/* Created Pages List */}
                {userPages.length > 0 && !isCreatingPage && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Your Pages</h4>
                    <div className="space-y-2">
                      {userPages.map(page => (
                        <div key={page.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between gap-3 hover:bg-gray-100/80 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={page.avatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150&q=80"} alt={page.name} className="w-11 h-11 rounded-lg object-cover border border-gray-200 shadow-xs" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-gray-900 truncate">{page.name}</span>
                              <span className="text-[10px] text-emerald-700 font-semibold">{page.category} • {page.followersCount} Followers</span>
                              {page.bio && <span className="text-[10px] text-gray-500 truncate mt-0.5">{page.bio}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Page"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create New Page Button / Toggle */}
                {!isCreatingPage ? (
                  <button
                    onClick={() => setIsCreatingPage(true)}
                    className="w-full py-2.5 border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Create a New Bissho Barta Page</span>
                  </button>
                ) : (
                  /* Create Page Form */
                  <form onSubmit={handleCreatePageSubmit} className="bg-gray-50 p-3.5 border border-emerald-200 rounded-lg space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-emerald-600" />
                        <span>Create Bissho Barta Page</span>
                      </span>
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
                        placeholder="e.g. My Digital Studio or Tech Hub"
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
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs"
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
                  className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
