import React, { useState, useEffect, useRef, RefObject } from 'react';
import { Post, UserProfile, Attachment, Comment, Friend } from '../types';
import { Image, Send, Heart, MessageCircle, Share2, MoreHorizontal, Plus, X, HeartHandshake, Upload, CornerDownRight, Globe, Star, Lock, UserPlus, Calendar, Clock, ChevronDown, Tag, Users, Flame, Sparkles, Video, AlertCircle, FileText, Settings, SlidersHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { applySensitiveContentAlgorithm } from '../utils/sensitiveContent';
import { optimizeImageFile, processVideoFile, getStoredVideoResolution, setStoredVideoResolution, VideoResolutionSetting } from '../utils/mediaOptimizer';

// Helpers for Username Mentions autocomplete and comments formatting
const getMentionQuery = (text: string): string | null => {
  const match = text.match(/@(\w*)$/);
  return match ? match[1] : null;
};

const getMentionableUsers = (currentComments: Comment[], postAuthorName?: string, userAvatar?: string) => {
  const usersMap = new Map<string, { name: string; avatar: string }>();
  
  const defaults = [
    { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "David Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Emily Rodriguez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Michael Chang", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" }
  ];

  defaults.forEach(u => usersMap.set(u.name, u));

  if (postAuthorName) {
    usersMap.set(postAuthorName, {
      name: postAuthorName,
      avatar: userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"
    });
  }

  currentComments.forEach(c => {
    usersMap.set(c.authorName, { name: c.authorName, avatar: c.authorAvatar });
  });

  return Array.from(usersMap.values());
};

const handleSelectMention = (
  username: string, 
  inputText: string, 
  onUpdateText: (val: string) => void,
  inputRefOrId?: RefObject<HTMLInputElement | null> | string
) => {
  const newText = inputText.replace(/@\w*$/, `@${username} `);
  onUpdateText(newText);
  setTimeout(() => {
    let elem: HTMLInputElement | null = null;
    if (typeof inputRefOrId === 'string') {
      elem = document.getElementById(inputRefOrId) as HTMLInputElement;
    } else if (inputRefOrId && inputRefOrId.current) {
      elem = inputRefOrId.current;
    }
    if (elem) {
      elem.focus();
      elem.setSelectionRange(elem.value.length, elem.value.length);
    }
  }, 50);
};

const renderCommentContent = (
  content: string, 
  replyToName?: string, 
  reducedSensitive: boolean = true,
  onViewProfile?: (name: string) => void
) => {
  const sanitized = applySensitiveContentAlgorithm(content, reducedSensitive);
  return (
    <span className="leading-relaxed">
      {replyToName && (
        <span 
          onClick={(e) => {
            if (onViewProfile) {
              e.stopPropagation();
              onViewProfile(replyToName);
            }
          }}
          className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#076653] bg-[#EBF7F2] px-1.5 py-0.5 rounded border border-[#076653]/30 mr-1.5 align-middle cursor-pointer hover:underline"
          title={`View ${replyToName}'s profile`}
        >
          Replying to @{replyToName}
        </span>
      )}
      {sanitized.split(' ').map((word, i) => {
        if (word.startsWith('@')) {
          const cleanName = word.replace(/[@,.:!?]/g, '').trim();
          return (
            <span 
              key={i} 
              onClick={(e) => {
                if (onViewProfile && cleanName) {
                  e.stopPropagation();
                  onViewProfile(cleanName);
                }
              }}
              className="text-[#076653] font-semibold hover:underline cursor-pointer"
              title={`View ${cleanName}'s profile`}
            >
              {word}{' '}
            </span>
          );
        }
        return word + ' ';
      })}
    </span>
  );
};

interface FeedTabProps {
  posts: Post[];
  profile: UserProfile;
  friends?: Friend[];
  searchQuery: string;
  addPost: (
    content: string, 
    image?: string, 
    attachment?: Attachment,
    options?: {
      postType?: 'Public' | 'Subscriber' | 'Private';
      taggedPeople?: string[];
      scheduledFor?: string;
      attachments?: Attachment[];
    }
  ) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, commentText: string, isWatchPost?: boolean, replyToId?: string, replyToName?: string) => void;
  deletePost: (postId: string) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

export default function FeedTab({
  posts,
  profile,
  friends,
  searchQuery,
  addPost,
  likePost,
  addComment,
  deletePost,
  onViewProfile
}: FeedTabProps) {
  // Modal states
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeCommentsPost, setActiveCommentsPost] = useState<Post | null>(null);
  
  // Reply and mention state
  const [replyingTo, setReplyingTo] = useState<{ postId: string; commentId: string; authorName: string } | null>(null);
  const modalInputRef = useRef<HTMLInputElement | null>(null);

  // Create post form states
  const [postContent, setPostContent] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);

  // New Post Options states
  const [postType, setPostType] = useState<'Public' | 'Subscriber' | 'Private'>('Public');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Content Preference state (For you / Feeds) synced across app
  const [feedPreference, setFeedPreference] = useState<'For you' | 'Feeds'>(() => {
    return (localStorage.getItem('home_feed_preference') as 'For you' | 'Feeds') || 'For you';
  });

  // Autoplay video state
  const [autoplayVideos, setAutoplayVideos] = useState<boolean>(() => {
    return localStorage.getItem('autoplayVideos') !== 'false';
  });

  // Reduce sensitive content state listener
  const [reducedSensitive, setReducedSensitive] = useState<boolean>(() => {
    return localStorage.getItem('reducedSensitiveContent') !== 'false';
  });

  useEffect(() => {
    const handleSensitiveChange = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setReducedSensitive(e.detail);
      } else {
        setReducedSensitive(localStorage.getItem('reducedSensitiveContent') !== 'false');
      }
    };
    const handleAutoplayChange = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setAutoplayVideos(e.detail);
      } else {
        setAutoplayVideos(localStorage.getItem('autoplayVideos') !== 'false');
      }
    };
    const handleFeedPrefChange = (e: any) => {
      if (e.detail && (e.detail === 'For you' || e.detail === 'Feeds')) {
        setFeedPreference(e.detail);
      } else {
        setFeedPreference((localStorage.getItem('home_feed_preference') as 'For you' | 'Feeds') || 'For you');
      }
    };

    window.addEventListener('sensitive-content-changed', handleSensitiveChange);
    window.addEventListener('autoplay-setting-changed', handleAutoplayChange);
    window.addEventListener('feed-preference-changed', handleFeedPrefChange);

    return () => {
      window.removeEventListener('sensitive-content-changed', handleSensitiveChange);
      window.removeEventListener('autoplay-setting-changed', handleAutoplayChange);
      window.removeEventListener('feed-preference-changed', handleFeedPrefChange);
    };
  }, []);

  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  const [showTagSection, setShowTagSection] = useState(false);
  const [tagSearchInput, setTagSearchInput] = useState('');

  const [scheduledFor, setScheduledFor] = useState('');
  const [showScheduleSection, setShowScheduleSection] = useState(false);

  // Available users for tagging
  const availableUsersForTagging = [
    { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "David Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Emily Rodriguez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Michael Chang", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Jessica Taylor", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80" }
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeAttachment = (indexToRemove: number) => {
    setUploadedAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setAttachmentError(null);
  };

  // Pre-check limits before opening file dialog
  const checkLimitBeforePick = (expectedType: 'image' | 'video' | 'any') => {
    const currentVideos = uploadedAttachments.filter(a => a.type === 'video').length;
    const currentPhotos = uploadedAttachments.filter(a => a.type === 'image').length;

    if (expectedType === 'video') {
      if (currentVideos >= 3) {
        setAttachmentError("Max video upload limit reached");
        return false;
      }
      if (currentPhotos > 0 && (currentVideos + currentPhotos >= 4 || currentVideos >= 2)) {
        setAttachmentError("Max upload limit reached (max 4 items with video)");
        return false;
      }
    } else if (expectedType === 'image') {
      if (currentVideos === 0 && currentPhotos >= 6) {
        setAttachmentError("Max photo upload limit reached");
        return false;
      }
      if (currentVideos > 0 && currentVideos + currentPhotos >= 4) {
        setAttachmentError("Max upload limit reached (max 4 items with video)");
        return false;
      }
    } else {
      if (currentVideos === 0 && currentPhotos >= 6) {
        setAttachmentError("Max photo upload limit reached");
        return false;
      }
      if (currentPhotos === 0 && currentVideos >= 3) {
        setAttachmentError("Max video upload limit reached");
        return false;
      }
      if (currentVideos > 0 && currentPhotos > 0 && currentVideos + currentPhotos >= 4) {
        setAttachmentError("Max upload limit reached (max 4 items with video)");
        return false;
      }
    }
    return true;
  };

  const handleFilesSelected = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    const filesArray = Array.from(files);

    const currentVideos = uploadedAttachments.filter(a => a.type === 'video').length;
    const currentPhotos = uploadedAttachments.filter(a => a.type === 'image').length;
    const currentOther = uploadedAttachments.filter(a => a.type === 'file').length;

    let incomingVideos = 0;
    let incomingPhotos = 0;
    let incomingOther = 0;

    for (const f of filesArray) {
      if (f.type.startsWith('video/')) {
        incomingVideos++;
      } else if (f.type.startsWith('image/')) {
        incomingPhotos++;
      } else {
        incomingOther++;
      }
    }

    const projectedVideos = currentVideos + incomingVideos;
    const projectedPhotos = currentPhotos + incomingPhotos;
    const projectedTotal = projectedVideos + projectedPhotos + currentOther + incomingOther;

    // RULE 1: Pure video upload (projectedPhotos === 0)
    // Max video upload limit is 3
    if (projectedPhotos === 0 && (currentOther + incomingOther === 0)) {
      if (projectedVideos > 3) {
        setAttachmentError("Max video upload limit reached");
        return;
      }
    }

    // RULE 2: Pure photo upload (projectedVideos === 0)
    // Max photo upload limit is 6
    if (projectedVideos === 0 && (currentOther + incomingOther === 0)) {
      if (projectedPhotos > 6) {
        setAttachmentError("Max photo upload limit reached");
        return;
      }
    }

    // RULE 3: Mixed upload (1 or 2 video with image - max limit 4 items)
    if (projectedVideos > 0 && projectedPhotos > 0) {
      if (projectedVideos > 2) {
        setAttachmentError("Max video upload limit reached");
        return;
      }
      if (projectedTotal > 4) {
        setAttachmentError("Max upload limit reached (max 4 items with video)");
        return;
      }
    }

    // Strict boundary checks
    if (projectedVideos > 3) {
      setAttachmentError("Max video upload limit reached");
      return;
    }
    if (projectedPhotos > 6) {
      setAttachmentError("Max photo upload limit reached");
      return;
    }

    // 50 MB check per file
    const maxSize = 50 * 1024 * 1024;
    for (const f of filesArray) {
      if (f.size > maxSize) {
        setAttachmentError(`File "${f.name}" exceeds 50 MB (${formatFileSize(f.size)}). Please choose a smaller file.`);
        return;
      }
    }

    setIsAttachmentLoading(true);
    let loadedCount = 0;
    const newItems: Attachment[] = [];

    filesArray.forEach(async (file) => {
      try {
        if (file.type.startsWith('image/')) {
          // Optimize photo to 1080p 3:4 aspect ratio (1200×1600 px), JPEG format, under 1200 KB max
          const optimized = await optimizeImageFile(file);
          newItems.push({
            name: optimized.name,
            size: optimized.size,
            type: 'image',
            url: optimized.url,
            dimensions: optimized.dimensions,
            aspectRatio: '3:4',
            resolutionLabel: optimized.resolutionLabel || '1080p (3:4 JPG)'
          });
        } else if (file.type.startsWith('video/')) {
          // Enforce 720p maximum resolution regulation for video
          const vidRes = await processVideoFile(file);
          newItems.push({
            name: vidRes.name,
            size: vidRes.size,
            type: 'video',
            url: vidRes.url,
            dimensions: vidRes.dimensions,
            resolutionLabel: vidRes.resolutionLabel || '720p HD Max'
          });
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            newItems.push({
              name: file.name,
              size: formatFileSize(file.size),
              type: 'file',
              url: reader.result as string
            });
            loadedCount++;
            if (loadedCount === filesArray.length) {
              setUploadedAttachments(prev => [...prev, ...newItems]);
              setIsAttachmentLoading(false);
            }
          };
          reader.onerror = () => {
            setAttachmentError('Error reading file. Please try again.');
            setIsAttachmentLoading(false);
          };
          reader.readAsDataURL(file);
          return;
        }
      } catch (err) {
        console.error('Error optimizing media:', err);
        newItems.push({
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: URL.createObjectURL(file)
        });
      }

      loadedCount++;
      if (loadedCount === filesArray.length) {
        setUploadedAttachments(prev => [...prev, ...newItems]);
        setIsAttachmentLoading(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files);
    e.target.value = '';
  };

  const handleCreatePostSubmit = () => {
    if (!postContent.trim() && uploadedAttachments.length === 0 && !customImageUrl) return;
    
    let allAttachments = [...uploadedAttachments];
    if (customImageUrl && allAttachments.length === 0) {
      allAttachments.push({
        name: 'image.jpg',
        size: '',
        type: 'image',
        url: customImageUrl
      });
    }

    const firstAttachment = allAttachments[0];
    const firstImage = firstAttachment?.type === 'image' ? firstAttachment.url : (customImageUrl || undefined);

    addPost(postContent, firstImage, firstAttachment, {
      postType,
      taggedPeople: taggedPeople.length > 0 ? taggedPeople : undefined,
      scheduledFor: scheduledFor.trim() ? scheduledFor : undefined,
      attachments: allAttachments.length > 0 ? allAttachments : undefined
    });
    
    // Reset fields
    setPostContent('');
    setCustomImageUrl('');
    setUploadedAttachments([]);
    setAttachmentError(null);
    setPostType('Public');
    setIsTypeDropdownOpen(false);
    setTaggedPeople([]);
    setShowTagSection(false);
    setTagSearchInput('');
    setScheduledFor('');
    setShowScheduleSection(false);
    setIsCreatePostOpen(false);
  };

  // Shared posts notification toast
  const [shareToast, setShareToast] = useState<string | null>(null);
  const handleShareClick = (postId: string) => {
    setShareToast("Shared post successfully to your timeline!");
    setTimeout(() => setShareToast(null), 3000);
  };

  // Simple comment input states per-post (inline)
  const [inlineComments, setInlineComments] = useState<{ [postId: string]: string }>({});

  const handleInlineCommentSubmit = (postId: string) => {
    const text = inlineComments[postId];
    if (!text || !text.trim()) return;
    
    const replyId = replyingTo?.postId === postId ? replyingTo.commentId : undefined;
    const replyName = replyingTo?.postId === postId ? replyingTo.authorName : undefined;

    addComment(postId, text, false, replyId, replyName);
    setInlineComments({ ...inlineComments, [postId]: '' });
    setReplyingTo(null);

    // Update open modal if looking at it
    if (activeCommentsPost && activeCommentsPost.id === postId) {
      const updatedWithComment = {
        ...activeCommentsPost,
        comments: [...activeCommentsPost.comments, {
          id: `temp_${Date.now()}`,
          authorName: profile.name,
          authorAvatar: profile.avatar,
          content: text,
          timestamp: "Just now",
          replyToId: replyId,
          replyToName: replyName
        }]
      };
      setActiveCommentsPost(updatedWithComment);
    }
  };

  // Helper to determine if an author is in followed friends / pages / user themselves
  const isFriendOrFollowed = (authorName: string) => {
    if (authorName === profile.name) return true;
    if (profile.pages?.some(p => p.name.toLowerCase() === authorName.toLowerCase())) return true;
    if (friends && friends.length > 0) {
      return friends.some(f => f.name.toLowerCase() === authorName.toLowerCase() && (f.status === 'friend' || f.status === 'pending_outgoing'));
    }
    // Default recognized friends / followed entities
    const defaultFriendNames = ["Sarah Jenkins", "David Chen", "Emily Rodriguez", "Michael Chang", "Jessica Taylor", "Marcus Aurelius", "Tech Trends & Code"];
    return defaultFriendNames.some(n => n.toLowerCase() === authorName.toLowerCase());
  };

  // Filter & rank posts based on search query and Social Media Algorithm for For you vs Feeds
  const filteredPosts = React.useMemo(() => {
    let list = [...posts];

    // 1. Search query match
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.authorName.toLowerCase().includes(query)
      );
    }

    // 2. Content preference algorithm
    if (feedPreference === 'For you') {
      // Social Media Algorithm for "For you":
      // Shows posts from anyone, followers, pages, groups (even if not followed).
      // Ranks by: Trending score (likes + shares), Most Talked About (comments count), and Following & Friends.
      return list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        const isFriendA = isFriendOrFollowed(a.authorName);
        const isFriendB = isFriendOrFollowed(b.authorName);

        // Engagement ranking score
        const scoreA = (a.likes * 2) + (a.shares * 3) + (a.comments.length * 5) + (isFriendA ? 50 : 0);
        const scoreB = (b.likes * 2) + (b.shares * 3) + (b.comments.length * 5) + (isFriendB ? 50 : 0);

        return scoreB - scoreA;
      });
    } else {
      // "Feeds" (Following only):
      // Shows ONLY latest posts from followed pages, groups, and friends.
      return list.filter(post => isFriendOrFollowed(post.authorName));
    }
  }, [posts, searchQuery, feedPreference, friends, profile]);

  return (
    <div className="bg-[#F0F2F5] lg:bg-transparent min-h-[calc(100vh-112px)] lg:min-h-0 pb-4 lg:pb-4 select-none font-sans" id="feed-tab-container">
      {/* Share Toast Notification */}
      <AnimatePresence>
        {shareToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 border border-gray-700"
          >
            <HeartHandshake className="w-4 h-4 text-[#E3EF26]" />
            <span>{shareToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Bar */}
      <div className="bg-white mt-2.5 p-3.5 border-y border-gray-200 flex flex-col gap-3" id="create-post-bar">
        <div className="flex gap-2.5 items-center">
          <img 
            src={profile.avatar} 
            alt="" 
            onClick={() => onViewProfile?.(profile.name, profile.avatar)}
            className="w-9 h-9 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
            title="View your profile"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="flex-1 bg-gray-100 border border-gray-200 text-gray-500 hover:bg-gray-150 rounded-full px-4 py-2.5 text-xs text-left cursor-pointer transition-colors"
            id="open-create-post-modal-btn"
          >
            What's on your mind, {profile.name.split(' ')[0]}?
          </button>
        </div>
      </div>

      {/* Feed Posts List */}
      <div className="mt-2.5 flex flex-col gap-2.5" id="feed-posts-list">
        {filteredPosts.length === 0 ? (
          <div className="bg-white py-12 px-4 text-center border-y border-gray-200">
            <p className="text-gray-500 text-sm">No posts found.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isMyPost = post.authorName === profile.name;
            const hasLiked = post.likedByMe;
            const isFriend = isFriendOrFollowed(post.authorName);

            return (
              <article key={post.id} className="bg-white border-y border-gray-200 shadow-sm flex flex-col" id={`feed-post-${post.id}`}>
                {/* Post Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <img 
                      src={post.authorAvatar} 
                      alt="" 
                      onClick={() => onViewProfile?.(post.authorName, post.authorAvatar)}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                      title={`View ${post.authorName}'s profile`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 leading-tight flex items-center flex-wrap gap-1">
                        <span 
                          onClick={() => onViewProfile?.(post.authorName, post.authorAvatar)}
                          className="cursor-pointer hover:text-[#076653] hover:underline"
                          title={`View ${post.authorName}'s profile`}
                        >
                          {post.authorName}
                        </span>
                        {post.taggedPeople && post.taggedPeople.length > 0 && (
                          <span className="text-gray-500 font-normal">
                            is with{' '}
                            {post.taggedPeople.map((name, idx) => (
                              <span 
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewProfile?.(name);
                                }}
                                className="font-semibold text-gray-800 hover:text-[#076653] hover:underline cursor-pointer"
                                title={`View ${name}'s profile`}
                              >
                                {name}{idx < post.taggedPeople!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </span>
                        )}
                        {post.isPinned && (
                          <span className="text-[10px] bg-[#EBF7F2] text-[#076653] px-1 rounded font-normal border border-[#076653]/30">Pinned</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                        <span>{post.timestamp}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 bg-gray-100 px-1.5 py-0.2 rounded text-[9.5px] font-medium text-gray-600 border border-gray-200">
                          {post.postType === 'Subscriber' ? (
                            <>⭐ Subscriber</>
                          ) : post.postType === 'Private' ? (
                            <>🔒 Private</>
                          ) : (
                            <>🌐 Public</>
                          )}
                        </span>
                        
                        {/* Algorithmic Badges in "For you" mode */}
                        {feedPreference === 'For you' && (
                          <>
                            {post.comments && post.comments.length >= 2 ? (
                              <span className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded text-[9.5px] font-bold border border-purple-200">
                                💬 Most Talked
                              </span>
                            ) : (post.likes >= 150 || post.shares >= 25) ? (
                              <span className="inline-flex items-center gap-0.5 bg-rose-50 text-rose-600 px-1.5 py-0.2 rounded text-[9.5px] font-bold border border-rose-200">
                                🔥 Trending
                              </span>
                            ) : !isFriend && !isMyPost ? (
                              <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded text-[9.5px] font-bold border border-amber-200">
                                ✨ Suggested
                              </span>
                            ) : null}
                          </>
                        )}

                        {post.scheduledFor && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded text-[9.5px] font-medium border border-amber-200">
                            <Clock className="w-2.5 h-2.5 text-amber-600" /> Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isMyPost && (
                    <button
                      onClick={() => {
                        if (confirm("Delete this post permanently?")) {
                          deletePost(post.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-50"
                      title="Delete post"
                      id={`delete-post-btn-${post.id}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Body */}
                <div className="px-3 pb-2 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {/* Color tags blue & apply sensitive filter algorithm silently */}
                  {applySensitiveContentAlgorithm(post.content, reducedSensitive).split(/(\s+)/).map((word, i) => {
                    if (word.startsWith('#')) {
                      return <span key={i} className="text-[#076653] font-semibold">{word}</span>;
                    }
                    return word;
                  })}
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
                      {/* 1. Videos (with 720p max regulation badge, player and comment bar) */}
                      {videos.map((vid, vIdx) => (
                        <div key={vIdx} className="relative group/video bg-black flex flex-col">
                          {/* 720p Video Regulation Badge */}
                          <div className="absolute top-2.5 right-2.5 z-10 bg-black/70 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md border border-white/15 flex items-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className="text-[#E3EF26]">{vid.resolutionLabel || '720p HD Max'}</span>
                          </div>

                          <video 
                            src={vid.url} 
                            className="w-full max-h-[350px] object-contain bg-black" 
                            controls 
                            preload="metadata"
                            autoPlay={autoplayVideos}
                            muted={autoplayVideos}
                            playsInline
                          />
                          {/* Write Comment Box Directly on/under Video */}
                          <div className="bg-zinc-900/95 border-t border-zinc-800/80 px-3 py-1.5 flex items-center gap-2 text-white" id={`feed-video-comment-bar-${post.id}-${vIdx}`}>
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
                                if (e.key === 'Enter') handleInlineCommentSubmit(post.id);
                              }}
                              placeholder="Write a comment on this video..."
                              className="bg-zinc-800/90 border border-zinc-700/60 rounded-full px-3 py-1 text-xs text-white placeholder-zinc-400 flex-1 focus:outline-none focus:border-[#E3EF26] focus:bg-zinc-800"
                              id={`video-comment-input-${post.id}-${vIdx}`}
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
                                onClick={() => handleInlineCommentSubmit(post.id)}
                                className="p-1 text-[#E3EF26] hover:text-white transition-colors cursor-pointer"
                                title="Post comment"
                                id={`video-comment-submit-${post.id}-${vIdx}`}
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 2. Photo Gallery Grid - 1080p 3:4 Standard (1200x1600 px) */}
                      {images.length > 0 && (
                        <div className="overflow-hidden bg-black">
                          {images.length === 1 ? (
                            /* Single Photo: Default 3:4 Aspect Ratio (1200x1600 standard) */
                            <div className="flex justify-center bg-black w-full">
                              <div className="relative w-full max-w-[480px] aspect-[3/4] max-h-[580px] flex items-center justify-center overflow-hidden group/singleimg">
                                <img 
                                  src={images[0].url} 
                                  alt="" 
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/singleimg:scale-102"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  decoding="async"
                                />
                                {/* 1080p 3:4 Regulation Badge */}
                                <div className="absolute top-2.5 right-2.5 z-10 bg-black/70 backdrop-blur-xs text-white text-[9.5px] font-bold px-2 py-0.5 rounded-md border border-white/15 flex items-center gap-1 shadow-sm pointer-events-none">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26]"></span>
                                  <span className="text-[#E3EF26]">1080p</span>
                                  <span className="text-zinc-300">• 3:4</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Multiple Photos: 3:4 Portrait Grid */
                            <div className={`grid gap-0.5 ${
                              images.length === 2 
                                ? 'grid-cols-2 max-h-[420px]' 
                                : images.length === 3 
                                  ? 'grid-cols-3 max-h-[320px]' 
                                  : 'grid-cols-2 sm:grid-cols-3 max-h-[440px]'
                            }`}>
                              {images.map((img, iIdx) => (
                                <div key={iIdx} className="relative overflow-hidden bg-zinc-950 flex items-center justify-center group/img aspect-[3/4]">
                                  <img 
                                    src={img.url} 
                                    alt="" 
                                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-200"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                  {/* Corner 1080p Badge */}
                                  <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-white/10 opacity-70 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                                    1080p
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. Document Files */}
                      {files.map((fl, fIdx) => (
                        <div key={fIdx} className="p-3 w-full flex items-center justify-between gap-3 bg-white py-3.5 px-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-[#EBF7F2] border border-[#076653]/30 text-[#076653] rounded-lg flex items-center justify-center shadow-xs shrink-0 text-xl font-bold">
                              📄
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-gray-800 truncate">{fl.name}</span>
                              <span className="text-[10px] text-gray-500 font-medium">{fl.size}</span>
                            </div>
                          </div>
                          <a 
                            href={fl.url} 
                            download={fl.name}
                            className="px-3.5 py-1.5 bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-lg text-[10px] font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-xs border border-[#076653]/20"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Interactions Row */}
                <div className="flex justify-around items-center py-1 text-gray-600 border-b border-gray-100 font-semibold text-xs bg-gray-50/50">
                  <button
                    onClick={() => likePost(post.id)}
                    className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-[#EBF7F2]/50 rounded transition-colors ${
                      hasLiked ? 'text-[#076653]' : ''
                    }`}
                    id={`like-btn-${post.id}`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? 'fill-[#076653]' : ''}`} />
                    <span>Like</span>
                    <span className="text-[11px] font-bold text-gray-500">({post.likes || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveCommentsPost(post)}
                    className="flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-gray-100 rounded transition-colors"
                    id={`comment-trigger-btn-${post.id}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comment</span>
                    <span className="text-[11px] font-bold text-gray-500">({post.comments?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => handleShareClick(post.id)}
                    className="flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-gray-100 rounded transition-colors"
                    id={`share-btn-${post.id}`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                    <span className="text-[11px] font-bold text-gray-500">({post.shares || 0})</span>
                  </button>
                </div>

                {/* Inline comments quick view (first 3 with reply support) */}
                {post.comments.length > 0 && (
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex flex-col gap-2">
                    {(() => {
                      const parents = post.comments.filter(c => !c.replyToId || !post.comments.some(p => p.id === c.replyToId));
                      return parents.slice(0, 2).map((parent) => {
                        const replies = post.comments.filter(c => c.replyToId === parent.id);
                        return (
                          <div key={parent.id} className="flex flex-col gap-1.5" id={`inline-comment-${parent.id}`}>
                            <div className="flex gap-2 text-xs items-start">
                              <img 
                                src={parent.authorAvatar} 
                                alt="" 
                                onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                                className="w-6 h-6 rounded-full object-cover mt-0.5 border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                title={`View ${parent.authorName}'s profile`}
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="bg-white border border-gray-200/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
                                  <div className="flex justify-between items-center mb-0.5">
                                    <span 
                                      onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                                      className="font-bold text-[10px] text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                      title={`View ${parent.authorName}'s profile`}
                                    >
                                      {parent.authorName}
                                    </span>
                                    <span className="text-[8px] text-gray-400">{parent.timestamp}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-800 leading-normal">
                                    {renderCommentContent(parent.content, parent.replyToName, reducedSensitive, onViewProfile)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 px-1 mt-0.5">
                                  <button
                                    onClick={() => {
                                      setReplyingTo({ postId: post.id, commentId: parent.id, authorName: parent.authorName });
                                      const currentVal = inlineComments[post.id] || '';
                                      if (!currentVal.includes(`@${parent.authorName}`)) {
                                        setInlineComments({ ...inlineComments, [post.id]: `@${parent.authorName} ` + currentVal });
                                      }
                                      setTimeout(() => {
                                        const input = document.getElementById(`inline-comment-input-${post.id}`) as HTMLInputElement;
                                        if (input) {
                                          input.focus();
                                          input.setSelectionRange(input.value.length, input.value.length);
                                        }
                                      }, 50);
                                    }}
                                    className="text-[8.5px] text-gray-500 hover:text-[#076653] font-bold cursor-pointer hover:underline uppercase tracking-wider"
                                    id={`inline-reply-btn-${parent.id}`}
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Nested Replies inline */}
                            {replies.length > 0 && (
                              <div className="ml-7 flex flex-col gap-1.5 border-l-2 border-gray-200/80 pl-2.5">
                                {replies.map((reply) => (
                                  <div key={reply.id} className="flex gap-1.5 text-xs items-start" id={`inline-reply-${reply.id}`}>
                                    <img 
                                      src={reply.authorAvatar} 
                                      alt="" 
                                      onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                      className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0 mt-0.5 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                      title={`View ${reply.authorName}'s profile`}
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="bg-gray-100/90 border border-gray-200/60 rounded-lg px-2 py-1">
                                        <div className="flex justify-between items-center mb-0.5">
                                          <span 
                                            onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                            className="font-bold text-[9px] text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                            title={`View ${reply.authorName}'s profile`}
                                          >
                                            {reply.authorName}
                                          </span>
                                          <span className="text-[7.5px] text-gray-400">{reply.timestamp}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-800 leading-normal">
                                          {renderCommentContent(reply.content, reply.replyToName, true, onViewProfile)}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 px-1 mt-0.5">
                                        <button
                                          onClick={() => {
                                            setReplyingTo({ postId: post.id, commentId: parent.id, authorName: reply.authorName });
                                            const currentVal = inlineComments[post.id] || '';
                                            if (!currentVal.includes(`@${reply.authorName}`)) {
                                              setInlineComments({ ...inlineComments, [post.id]: `@${reply.authorName} ` + currentVal });
                                            }
                                            setTimeout(() => {
                                              const input = document.getElementById(`inline-comment-input-${post.id}`) as HTMLInputElement;
                                              if (input) {
                                                input.focus();
                                                input.setSelectionRange(input.value.length, input.value.length);
                                              }
                                            }, 50);
                                          }}
                                          className="text-[8px] text-gray-500 hover:text-[#076653] font-bold cursor-pointer hover:underline uppercase tracking-wider"
                                          id={`inline-reply-to-reply-btn-${reply.id}`}
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                    {post.comments.length > 2 && (
                      <button
                        onClick={() => setActiveCommentsPost(post)}
                        className="text-[10px] font-bold text-[#076653] hover:underline text-left mt-0.5"
                      >
                        View all {post.comments.length} comments
                      </button>
                    )}
                  </div>
                )}

                {/* Inline Comment Input Container with Replying Banner & Mentions Popover */}
                <div className="p-2 bg-white flex flex-col gap-1 border-t border-gray-100">
                  {/* Replying banner indicator */}
                  {replyingTo && replyingTo.postId === post.id && (
                    <div className="flex items-center justify-between px-2.5 py-1 bg-[#EBF7F2] border border-[#076653]/20 rounded-lg text-[10px] text-[#076653] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <CornerDownRight className="w-3 h-3 text-[#076653]" />
                        <span>Replying to <strong>@{replyingTo.authorName}</strong></span>
                      </div>
                      <button 
                        onClick={() => setReplyingTo(null)}
                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
                        type="button"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-center relative">
                    <img 
                      src={profile.avatar} 
                      alt="" 
                      className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 relative flex items-center">
                      {/* Mentions popup autocomplete dropdown */}
                      {(() => {
                        const currentText = inlineComments[post.id] || '';
                        const query = getMentionQuery(currentText);
                        if (query !== null) {
                          const matches = getMentionableUsers(post.comments, post.authorName, profile.avatar).filter(u =>
                            u.name.toLowerCase().includes(query.toLowerCase())
                          );
                          if (matches.length > 0) {
                            return (
                              <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-36 overflow-y-auto z-40 mb-1 flex flex-col divide-y divide-gray-100" id={`inline-mentions-popover-${post.id}`}>
                                <div className="px-3 py-1 bg-gray-50 text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                                  Mention Someone
                                </div>
                                {matches.map((user) => (
                                  <button
                                    key={user.name}
                                    type="button"
                                    onClick={() => {
                                      handleSelectMention(
                                        user.name,
                                        currentText,
                                        (newVal) => setInlineComments({ ...inlineComments, [post.id]: newVal })
                                      );
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#EBF7F2] text-left cursor-pointer w-full transition-colors"
                                    id={`inline-mention-user-${user.name.replace(/\s+/g, '-')}`}
                                  >
                                    <img src={user.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                                    <span className="text-[10px] font-bold text-gray-800">{user.name}</span>
                                  </button>
                                ))}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}

                      <input
                        type="text"
                        value={inlineComments[post.id] || ''}
                        onChange={(e) => setInlineComments({ ...inlineComments, [post.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInlineCommentSubmit(post.id);
                        }}
                        placeholder="Write a comment..."
                        className="w-full bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 pr-8 text-[11px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#076653]"
                        id={`inline-comment-input-${post.id}`}
                      />
                      <button
                        onClick={() => handleInlineCommentSubmit(post.id)}
                        className="absolute right-2 text-gray-400 hover:text-[#076653] p-0.5"
                        id={`inline-comment-submit-${post.id}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* CREATE POST MODAL DIALOG */}
      <AnimatePresence>
        {isCreatePostOpen && (
          <div className="fixed inset-0 bg-black/60 z-55 flex items-center justify-center p-3">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
              id="create-post-modal"
            >
              {/* Modal Title Bar */}
              <div className="bg-[#076653] text-[#E3EF26] px-4 py-3 flex justify-between items-center shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider">Create Post</h3>
                <button 
                  onClick={() => setIsCreatePostOpen(false)}
                  className="text-white/80 hover:text-white p-0.5 rounded-full hover:bg-white/10"
                  id="create-post-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
                {/* User & Post Type Selector Header */}
                <div className="flex gap-2.5 items-center relative">
                  <img 
                    src={profile.avatar} 
                    alt="" 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">{profile.name}</h4>
                    
                    {/* Post Type Selector Dropdown Button */}
                    <div className="relative mt-1">
                      <button
                        type="button"
                        onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                        className="flex items-center gap-1.5 text-[10.5px] bg-gray-100 hover:bg-gray-200 text-gray-800 px-2.5 py-1 rounded-md font-bold border border-gray-200 transition-colors cursor-pointer"
                        id="post-type-selector-btn"
                      >
                        {postType === 'Public' && (
                          <><Globe className="w-3.5 h-3.5 text-[#076653]" /> <span>Public</span></>
                        )}
                        {postType === 'Subscriber' && (
                          <><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> <span>Subscriber</span></>
                        )}
                        {postType === 'Private' && (
                          <><Lock className="w-3.5 h-3.5 text-gray-600" /> <span>Private</span></>
                        )}
                        <ChevronDown className="w-3 h-3 text-gray-500 ml-0.5" />
                      </button>

                      {/* Post Type Dropdown Menu */}
                      {isTypeDropdownOpen && (
                        <div 
                          className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 w-52 overflow-hidden flex flex-col divide-y divide-gray-100"
                          id="post-type-dropdown-menu"
                        >
                          <div className="px-3 py-1.5 bg-gray-50 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                            Select Post Type
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPostType('Public');
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`flex items-start gap-2.5 px-3 py-2 text-left hover:bg-[#EBF7F2] transition-colors cursor-pointer ${
                              postType === 'Public' ? 'bg-[#EBF7F2]/80 text-[#076653]' : ''
                            }`}
                            id="post-type-option-public"
                          >
                            <Globe className="w-4 h-4 text-[#076653] mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Public (Default)</div>
                              <div className="text-[9.5px] text-gray-500">Anyone on or off the app</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPostType('Subscriber');
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`flex items-start gap-2.5 px-3 py-2 text-left hover:bg-amber-50 transition-colors cursor-pointer ${
                              postType === 'Subscriber' ? 'bg-amber-50/70' : ''
                            }`}
                            id="post-type-option-subscriber"
                          >
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Subscriber</div>
                              <div className="text-[9.5px] text-gray-500">Only your paid subscribers</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPostType('Private');
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`flex items-start gap-2.5 px-3 py-2 text-left hover:bg-gray-100 transition-colors cursor-pointer ${
                              postType === 'Private' ? 'bg-gray-100/70' : ''
                            }`}
                            id="post-type-option-private"
                          >
                            <Lock className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-xs font-bold text-gray-900">Private</div>
                              <div className="text-[9.5px] text-gray-500">Only visible to you</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Textarea Field */}
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={`What's on your mind, ${profile.name.split(' ')[0]}?`}
                  rows={4}
                  className="w-full text-xs text-gray-800 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#076653] resize-none"
                  autoFocus
                  id="post-textarea-field"
                />

                {/* Tagged People Active Pills */}
                {taggedPeople.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#EBF7F2] border border-[#076653]/30 rounded-xl">
                    <span className="text-[10px] font-bold text-[#076653] uppercase tracking-wider flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> Tagged:
                    </span>
                    {taggedPeople.map((person) => (
                      <span 
                        key={person} 
                        className="inline-flex items-center gap-1 bg-white border border-[#076653]/30 px-2 py-0.5 rounded-full text-[10.5px] font-bold text-[#076653] shadow-2xs"
                      >
                        @{person}
                        <button 
                          type="button" 
                          onClick={() => setTaggedPeople(taggedPeople.filter(p => p !== person))}
                          className="hover:text-red-500 cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Scheduled Time Active Indicator */}
                {scheduledFor && (
                  <div className="flex items-center justify-between p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">Scheduled Post</span>
                        <span className="text-[11px] font-bold">{new Date(scheduledFor).toLocaleString()}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setScheduledFor('')} 
                      className="text-amber-700 hover:text-amber-900 p-1 hover:bg-amber-100 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* RED ERROR BANNER WHEN LIMIT REACHED */}
                {attachmentError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-xs"
                    id="attachment-error-banner"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span className="truncate">{attachmentError}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAttachmentError(null)} 
                      className="text-red-500 hover:text-red-700 p-0.5 rounded cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {/* Attachments & Files Preview */}
                {isAttachmentLoading && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden h-24 bg-gray-50 flex flex-col items-center justify-center gap-2 animate-pulse">
                    <div className="w-5 h-5 border-2 border-[#076653] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-gray-500 font-semibold">Processing files...</span>
                  </div>
                )}

                {!isAttachmentLoading && uploadedAttachments.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {/* Media Optimization Info Pill */}
                    <div className="bg-[#EBF7F2] border border-[#076653]/30 px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] text-[#076653]">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold">Bissho Barta Standard:</span>
                        <span>1080p 3:4 JPG (&lt;1200KB) • 720p Video Max</span>
                      </div>
                      <span className="text-[10px] font-bold bg-[#076653] text-[#E3EF26] px-1.5 py-0.5 rounded">
                        Optimized
                      </span>
                    </div>

                    <div className={`grid gap-2 ${
                      uploadedAttachments.length === 1 
                        ? 'grid-cols-1' 
                        : uploadedAttachments.length === 2 
                          ? 'grid-cols-2' 
                          : uploadedAttachments.length === 3 
                            ? 'grid-cols-3' 
                            : 'grid-cols-2 sm:grid-cols-3'
                    }`}>
                      {uploadedAttachments.map((att, idx) => (
                        <div 
                          key={idx} 
                          className={`relative rounded-xl border border-gray-200 overflow-hidden bg-gray-900 group flex items-center justify-center ${
                            uploadedAttachments.length === 1 && att.type === 'image' 
                              ? 'aspect-[3/4] max-h-[340px] max-w-[255px] mx-auto w-full' 
                              : 'aspect-video sm:aspect-[3/4]'
                          }`}
                        >
                          {att.type === 'image' && (
                            <img 
                              src={att.url} 
                              alt={att.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {att.type === 'video' && (
                            <video 
                              src={att.url} 
                              className="w-full h-full object-cover" 
                              controls 
                              preload="metadata"
                            />
                          )}
                          {att.type === 'file' && (
                            <div className="p-3 w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-800 text-center">
                              <span className="text-2xl mb-1">📄</span>
                              <span className="text-[11px] font-bold truncate max-w-[120px]">{att.name}</span>
                              <span className="text-[9px] text-gray-500">{att.size}</span>
                            </div>
                          )}

                          {/* Badge with Resolution and Size */}
                          <div className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1 border border-white/10">
                            {att.type === 'video' && <Video className="w-2.5 h-2.5 text-[#E3EF26]" />}
                            {att.type === 'image' && <Image className="w-2.5 h-2.5 text-[#E3EF26]" />}
                            <span>{att.resolutionLabel || (att.type === 'image' ? '1080p (3:4 JPG)' : att.type)}</span>
                            {att.size && <span className="text-[#E3EF26] font-mono lowercase font-normal ml-0.5">({att.size})</span>}
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-red-600 text-white p-1 rounded-full transition-colors cursor-pointer shadow-md z-10"
                            title="Remove item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isAttachmentLoading && uploadedAttachments.length === 0 && customImageUrl && (
                  <div className="relative rounded-xl border border-gray-200 overflow-hidden h-32 bg-gray-50 flex items-center justify-center">
                    <img 
                      src={customImageUrl} 
                      alt="Preview" 
                      className="h-full object-cover w-full"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => setCustomImageUrl('')}
                      className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full text-white hover:bg-black/90 transition-colors cursor-pointer"
                      type="button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ADD TO YOUR POST TOOLBAR */}
                <div className="border border-gray-200 rounded-xl p-2.5 bg-gray-50/60 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xs font-bold text-gray-700">Add to your post:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Add Photo Button */}
                    <label 
                      htmlFor="post-photo-upload-input"
                      onClick={(e) => {
                        if (!checkLimitBeforePick('image')) {
                          e.preventDefault();
                        }
                      }}
                      className="p-2 bg-white border border-gray-200 hover:border-[#076653]/40 hover:bg-[#EBF7F2] rounded-lg cursor-pointer transition-colors text-gray-700 flex items-center gap-1 shadow-2xs"
                      title="Add photos (max 6)"
                      id="toolbar-photo-btn"
                    >
                      <Image className="w-4 h-4 text-[#076653]" />
                      <span className="text-[11px] font-bold text-gray-700">Photo</span>
                    </label>
                    <input 
                      type="file" 
                      id="post-photo-upload-input" 
                      accept="image/*"
                      multiple
                      className="hidden" 
                      onChange={handleFileUpload}
                    />

                    {/* Add Video Button */}
                    <label 
                      htmlFor="post-video-upload-input"
                      onClick={(e) => {
                        if (!checkLimitBeforePick('video')) {
                          e.preventDefault();
                        }
                      }}
                      className="p-2 bg-white border border-gray-200 hover:border-[#076653]/40 hover:bg-[#EBF7F2] rounded-lg cursor-pointer transition-colors text-gray-700 flex items-center gap-1 shadow-2xs"
                      title="Add videos (max 3)"
                      id="toolbar-video-btn"
                    >
                      <Video className="w-4 h-4 text-[#076653]" />
                      <span className="text-[11px] font-bold text-gray-700">Video</span>
                    </label>
                    <input 
                      type="file" 
                      id="post-video-upload-input" 
                      accept="video/*"
                      multiple
                      className="hidden" 
                      onChange={handleFileUpload}
                    />

                    {/* Upload General File Button */}
                    <label 
                      htmlFor="post-file-upload-input"
                      onClick={(e) => {
                        if (!checkLimitBeforePick('any')) {
                          e.preventDefault();
                        }
                      }}
                      className="p-2 bg-white border border-gray-200 hover:border-[#076653]/40 hover:bg-[#EBF7F2] rounded-lg cursor-pointer transition-colors text-gray-700 flex items-center gap-1 shadow-2xs"
                      title="Add attachment"
                      id="toolbar-attachment-btn"
                    >
                      <Upload className="w-4 h-4 text-[#076653]" />
                      <span className="text-[11px] font-bold text-gray-700">File</span>
                    </label>
                    <input 
                      type="file" 
                      id="post-file-upload-input" 
                      multiple
                      className="hidden" 
                      onChange={handleFileUpload}
                    />

                    {/* Tag People Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowTagSection(!showTagSection);
                        setShowScheduleSection(false);
                      }}
                      className={`p-2 border rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs ${
                        showTagSection || taggedPeople.length > 0
                          ? 'bg-[#EBF7F2] border-[#076653]/40 text-[#076653]'
                          : 'bg-white border-gray-200 hover:border-[#076653]/40 hover:bg-[#EBF7F2] text-gray-700'
                      }`}
                      title="Tag people"
                      id="toolbar-tag-people-btn"
                    >
                      <UserPlus className="w-4 h-4 text-[#076653]" />
                      <span className="text-[11px] font-bold">Tag</span>
                    </button>

                    {/* Schedule Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowScheduleSection(!showScheduleSection);
                        setShowTagSection(false);
                      }}
                      className={`p-2 border rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs ${
                        showScheduleSection || scheduledFor
                          ? 'bg-amber-100/80 border-amber-300 text-amber-800'
                          : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-700'
                      }`}
                      title="Schedule post"
                      id="toolbar-schedule-btn"
                    >
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span className="text-[11px] font-bold">Schedule</span>
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE TAG PEOPLE SECTION */}
                {showTagSection && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-[#076653]" /> Tag Friends
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowTagSection(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={tagSearchInput}
                      onChange={(e) => setTagSearchInput(e.target.value)}
                      placeholder="Search friends to tag..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#076653]"
                      id="tag-people-search-input"
                    />

                    <div className="max-h-36 overflow-y-auto divide-y divide-gray-100">
                      {availableUsersForTagging
                        .filter(u => u.name.toLowerCase().includes(tagSearchInput.toLowerCase()))
                        .map((friend) => {
                          const isTagged = taggedPeople.includes(friend.name);
                          return (
                            <div
                              key={friend.name}
                              onClick={() => {
                                if (isTagged) {
                                  setTaggedPeople(taggedPeople.filter(p => p !== friend.name));
                                } else {
                                  setTaggedPeople([...taggedPeople, friend.name]);
                                }
                              }}
                              className={`flex items-center justify-between p-2 hover:bg-[#EBF7F2] rounded-lg cursor-pointer transition-colors ${
                                isTagged ? 'bg-[#EBF7F2] font-bold' : ''
                              }`}
                              id={`tag-friend-item-${friend.name.replace(/\s+/g, '-')}`}
                            >
                              <div className="flex items-center gap-2">
                                <img src={friend.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                <span className="text-xs text-gray-800">{friend.name}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                isTagged 
                                  ? 'bg-[#076653] text-[#E3EF26] border-[#076653]' 
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}>
                                {isTagged ? 'Tagged ✓' : 'Tag'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* EXPANDABLE SCHEDULE SECTION */}
                {showScheduleSection && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Schedule Publication
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowScheduleSection(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Date & Time</label>
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-800"
                        id="schedule-datetime-input"
                      />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow9am = new Date();
                          tomorrow9am.setDate(tomorrow9am.getDate() + 1);
                          tomorrow9am.setHours(9, 0, 0, 0);
                          setScheduledFor(tomorrow9am.toISOString().slice(0, 16));
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-bold shrink-0 cursor-pointer"
                      >
                        Tomorrow at 9:00 AM
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow6pm = new Date();
                          tomorrow6pm.setDate(tomorrow6pm.getDate() + 1);
                          tomorrow6pm.setHours(18, 0, 0, 0);
                          setScheduledFor(tomorrow6pm.toISOString().slice(0, 16));
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-bold shrink-0 cursor-pointer"
                      >
                        Tomorrow at 6:00 PM
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const in3Days = new Date();
                          in3Days.setDate(in3Days.getDate() + 3);
                          in3Days.setHours(10, 0, 0, 0);
                          setScheduledFor(in3Days.toISOString().slice(0, 16));
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 font-bold shrink-0 cursor-pointer"
                      >
                        In 3 Days
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="bg-gray-50 p-3 border-t border-gray-100 flex gap-2 justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreatePostOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  id="create-post-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!postContent.trim() && uploadedAttachments.length === 0 && !customImageUrl}
                  onClick={handleCreatePostSubmit}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    postContent.trim() || uploadedAttachments.length > 0 || customImageUrl
                      ? scheduledFor
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-[#076653] hover:bg-[#065042] text-[#E3EF26]'
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                  }`}
                  id="create-post-publish"
                >
                  {scheduledFor ? (
                    <><Clock className="w-3.5 h-3.5" /> Schedule Post</>
                  ) : (
                    'Publish Post'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED COMMENTS DIALOG/PANEL */}
      <AnimatePresence>
        {activeCommentsPost && (
          <div className="fixed inset-0 bg-black/60 z-55 flex items-end sm:items-center justify-center p-0 sm:p-3">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full sm:max-w-md rounded-t-xl sm:rounded-lg overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]"
              id="comments-dialog-box"
            >
              <div className="bg-[#076653] text-[#E3EF26] px-4 py-3 flex justify-between items-center sticky top-0">
                <h3 className="text-xs font-bold uppercase tracking-wider">Comments ({(posts.find(p => p.id === activeCommentsPost.id)?.comments || activeCommentsPost.comments).length})</h3>
                <button 
                  onClick={() => {
                    setActiveCommentsPost(null);
                    setReplyingTo(null);
                  }}
                  className="text-white/80 hover:text-white p-0.5 rounded-full hover:bg-white/10"
                  id="comments-dialog-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments list scrolling area */}
              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[250px]">
                {(() => {
                  const currentPostComments = posts.find(p => p.id === activeCommentsPost.id)?.comments || activeCommentsPost.comments;
                  if (currentPostComments.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-400 text-xs">
                        No comments yet. Be the first to comment!
                      </div>
                    );
                  }

                  const parents = currentPostComments.filter(c => !c.replyToId || !currentPostComments.some(p => p.id === c.replyToId));

                  return parents.map((parent) => {
                    const replies = currentPostComments.filter(c => c.replyToId === parent.id);
                    return (
                      <div key={parent.id} className="flex flex-col gap-2 animate-fade-in" id={`modal-comment-${parent.id}`}>
                        <div className="flex gap-2 text-xs items-start">
                          <img 
                            src={parent.authorAvatar} 
                            alt="" 
                            onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                            className="w-8 h-8 rounded-full object-cover mt-0.5 border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                            title={`View ${parent.authorName}'s profile`}
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-100 border border-gray-200/50 rounded-xl px-3 py-2 shadow-xs">
                              <div className="flex justify-between items-center mb-0.5">
                                <span 
                                  onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                                  className="font-bold text-[10px] text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                  title={`View ${parent.authorName}'s profile`}
                                >
                                  {parent.authorName}
                                </span>
                                <span className="text-[8px] text-gray-400">{parent.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-gray-800 leading-normal">
                                {renderCommentContent(parent.content, parent.replyToName, reducedSensitive, onViewProfile)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 px-1 mt-1">
                              <button
                                onClick={() => {
                                  setReplyingTo({ postId: activeCommentsPost.id, commentId: parent.id, authorName: parent.authorName });
                                  const currentVal = inlineComments[activeCommentsPost.id] || '';
                                  if (!currentVal.includes(`@${parent.authorName}`)) {
                                    setInlineComments({ ...inlineComments, [activeCommentsPost.id]: `@${parent.authorName} ` + currentVal });
                                  }
                                  setTimeout(() => {
                                    const input = (modalInputRef.current || document.getElementById("comments-dialog-input-field")) as HTMLInputElement;
                                    if (input) {
                                      input.focus();
                                      input.setSelectionRange(input.value.length, input.value.length);
                                    }
                                  }, 50);
                                }}
                                className="text-[8.5px] text-gray-500 hover:text-[#076653] font-bold cursor-pointer hover:underline uppercase tracking-wider"
                                id={`modal-reply-btn-${parent.id}`}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Nested Replies in Modal */}
                        {replies.length > 0 && (
                          <div className="ml-8 flex flex-col gap-2 border-l-2 border-gray-200 pl-3 pt-0.5">
                            {replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2 text-xs items-start" id={`modal-reply-${reply.id}`}>
                                <img 
                                  src={reply.authorAvatar} 
                                  alt="" 
                                  onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                  className="w-6 h-6 rounded-full object-cover border border-gray-200 shrink-0 mt-0.5 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                  title={`View ${reply.authorName}'s profile`}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="bg-gray-50 border border-gray-200/60 rounded-xl px-2.5 py-1.5">
                                    <div className="flex justify-between items-center mb-0.5">
                                      <span 
                                        onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                        className="font-bold text-[9px] text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                        title={`View ${reply.authorName}'s profile`}
                                      >
                                        {reply.authorName}
                                      </span>
                                      <span className="text-[7.5px] text-gray-400">{reply.timestamp}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-800 leading-normal">
                                      {renderCommentContent(reply.content, reply.replyToName, true, onViewProfile)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 px-1 mt-0.5">
                                    <button
                                      onClick={() => {
                                        setReplyingTo({ postId: activeCommentsPost.id, commentId: parent.id, authorName: reply.authorName });
                                        const currentVal = inlineComments[activeCommentsPost.id] || '';
                                        if (!currentVal.includes(`@${reply.authorName}`)) {
                                          setInlineComments({ ...inlineComments, [activeCommentsPost.id]: `@${reply.authorName} ` + currentVal });
                                        }
                                        setTimeout(() => {
                                          const input = (modalInputRef.current || document.getElementById("comments-dialog-input-field")) as HTMLInputElement;
                                          if (input) {
                                            input.focus();
                                            input.setSelectionRange(input.value.length, input.value.length);
                                          }
                                        }, 50);
                                      }}
                                      className="text-[8px] text-gray-500 hover:text-[#076653] font-bold cursor-pointer hover:underline uppercase tracking-wider"
                                      id={`modal-reply-to-reply-btn-${reply.id}`}
                                    >
                                      Reply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Comment Input Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col gap-1.5">
                {/* Replying banner indicator in modal */}
                {replyingTo && replyingTo.postId === activeCommentsPost.id && (
                  <div className="flex items-center justify-between px-3 py-1 bg-[#EBF7F2] border border-[#076653]/20 rounded-lg text-[10px] text-[#076653] font-semibold">
                    <div className="flex items-center gap-1.5">
                      <CornerDownRight className="w-3 h-3 text-[#076653]" />
                      <span>Replying to <strong>@{replyingTo.authorName}</strong></span>
                    </div>
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
                      type="button"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2 items-center relative">
                  <img 
                    src={profile.avatar} 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 relative flex items-center">
                    {/* Mentions popup dropdown in modal */}
                    {(() => {
                      const currentText = inlineComments[activeCommentsPost.id] || '';
                      const query = getMentionQuery(currentText);
                      if (query !== null) {
                        const currentPostComments = posts.find(p => p.id === activeCommentsPost.id)?.comments || activeCommentsPost.comments;
                        const matches = getMentionableUsers(currentPostComments, activeCommentsPost.authorName, profile.avatar).filter(u =>
                          u.name.toLowerCase().includes(query.toLowerCase())
                        );
                        if (matches.length > 0) {
                          return (
                            <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto z-40 mb-1 flex flex-col divide-y divide-gray-100" id="modal-mentions-popover">
                              <div className="px-3 py-1 bg-gray-50 text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                                Mention Someone
                              </div>
                              {matches.map((user) => (
                                <button
                                  key={user.name}
                                  type="button"
                                  onClick={() => {
                                    handleSelectMention(
                                      user.name,
                                      currentText,
                                      (newVal) => setInlineComments({ ...inlineComments, [activeCommentsPost.id]: newVal }),
                                      modalInputRef
                                    );
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#EBF7F2] text-left cursor-pointer w-full transition-colors"
                                  id={`modal-mention-user-${user.name.replace(/\s+/g, '-')}`}
                                >
                                  <img src={user.avatar} alt="" className="w-5.5 h-5.5 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                                  <span className="text-[10px] font-bold text-gray-800">{user.name}</span>
                                </button>
                              ))}
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}

                    <input
                      ref={modalInputRef}
                      type="text"
                      value={inlineComments[activeCommentsPost.id] || ''}
                      onChange={(e) => setInlineComments({ ...inlineComments, [activeCommentsPost.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineCommentSubmit(activeCommentsPost.id);
                      }}
                      placeholder="Write a comment..."
                      className="w-full bg-white border border-gray-300 rounded-full px-3.5 py-2 pr-9 text-xs focus:outline-none focus:ring-1 focus:ring-[#076653]"
                      id="comments-dialog-input-field"
                      autoFocus
                    />
                    <button
                      onClick={() => handleInlineCommentSubmit(activeCommentsPost.id)}
                      className="absolute right-2.5 text-gray-400 hover:text-[#076653] p-1"
                      id="comments-dialog-submit"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
