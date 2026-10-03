import { useState, useEffect, useRef, RefObject } from 'react';
import { Post, UserProfile, Comment } from '../types';
import {
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Send,
  X,
  ChevronRight,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastBanner, ToastNotice } from './ConfirmModal';

interface WatchTabProps {
  watchPosts: Post[];
  profile: UserProfile;
  likePost: (postId: string, isWatchPost: boolean) => void;
  addComment: (postId: string, commentText: string, isWatchPost: boolean) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

interface Reel {
  id: string;
  authorName: string;
  authorAvatar: string;
  videoUrl: string;
  videoThumbnail: string;
  title: string;
  likes: number;
  likedByMe: boolean;
  shares: number;
  views: string;
  comments: Comment[];
}

// Helpers for Username Mentions autocomplete and comments formatting
const getMentionQuery = (text: string): string | null => {
  const match = text.match(/@(\w*)$/);
  return match ? match[1] : null;
};

const getMentionableUsers = (currentComments: Comment[], reelAuthorName?: string, userAvatar?: string) => {
  const usersMap = new Map<string, { name: string; avatar: string }>();

  const defaults = [
    { name: "Nusrat Jahan", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Tanvir Ahmed", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Farhana Rahman", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Mahmudul Hasan", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Sylhet Trails", avatar: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=100&h=100&q=80" },
    { name: "Cox's Bazar Waves", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80" },
  ];

  defaults.forEach(u => usersMap.set(u.name, u));

  if (reelAuthorName) {
    usersMap.set(reelAuthorName, {
      name: reelAuthorName,
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
  setInputText: (val: string) => void,
  inputRef: RefObject<HTMLInputElement | null>
) => {
  const newText = inputText.replace(/@\w*$/, `@${username} `);
  setInputText(newText);
  setTimeout(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
    }
  }, 50);
};

export default function WatchTab({
  watchPosts,
  profile,
  likePost,
  addComment,
  onViewProfile
}: WatchTabProps) {
  const [muted, setMuted] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [videoCommentText, setVideoCommentText] = useState("");

  // Reels interactive local state with Bangladesh-focused creators
  const [reels, setReels] = useState<Reel[]>([
    {
      id: "reel_1",
      authorName: "Sylhet Trails",
      authorAvatar: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Clear mountain streams in Jaflong & Bichnakandi, Sylhet! Crystal water clarity. #bangladesh #sylhet #nature #reels",
      likes: 1240,
      likedByMe: false,
      shares: 340,
      views: "1.2M",
      comments: [
        { id: "rc1_1", authorName: "Nusrat Jahan", authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", content: "This looks amazing! Planning a trip next month.", timestamp: "2h ago" },
        { id: "rc1_2", authorName: "Tanvir Ahmed", authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", content: "Monsoon in Sylhet is unmatched!", timestamp: "1h ago" }
      ]
    },
    {
      id: "reel_2",
      authorName: "Dhaka Roasters",
      authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-coffee-maker-machine-brewing-coffee-32242-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Morning espresso brew at Dhanmondi café ☕🌿 #dhaka #coffee #barista",
      likes: 852,
      likedByMe: false,
      shares: 98,
      views: "410K",
      comments: [
        { id: "rc2_1", authorName: "Farhana Rahman", authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80", content: "Best coffee spot in Dhaka!", timestamp: "4h ago" }
      ]
    },
    {
      id: "reel_3",
      authorName: "Dhaka Code Lab",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-40546-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Late-night coding session with mechanical switches 💻 #coding #bangladeshtech #desksetup",
      likes: 3105,
      likedByMe: false,
      shares: 615,
      views: "2.5M",
      comments: [
        { id: "rc3_1", authorName: "Mahmudul Hasan", authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80", content: "Clean setup!", timestamp: "1d ago" }
      ]
    },
    {
      id: "reel_4",
      authorName: "Bakehouse Banani",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-melted-chocolate-on-a-croissant-34444-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Warm oven-baked croissant with dark chocolate drizzle 🥐🍫 #dhakafood #baking #chocolate",
      likes: 1940,
      likedByMe: false,
      shares: 405,
      views: "950K",
      comments: [
        { id: "rc4_1", authorName: "Nusrat Jahan", authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", content: "Looks delicious!", timestamp: "3h ago" }
      ]
    },
    {
      id: "reel_5",
      authorName: "Cox's Bazar Waves",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-top-aerial-view-of-waves-crashing-on-sandy-beach-43105-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Aerial view of waves along Marine Drive, Cox's Bazar 🌊 #coxsbazar #bangladesh #beach",
      likes: 2150,
      likedByMe: false,
      shares: 540,
      views: "1.8M",
      comments: [
        { id: "rc5_1", authorName: "Tanvir Ahmed", authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", content: "Great drone perspective!", timestamp: "1h ago" }
      ]
    }
  ]);

  const [autoplayVideos, setAutoplayVideos] = useState<boolean>(() => {
    return localStorage.getItem('autoplayVideos') !== 'false';
  });

  useEffect(() => {
    const handleAutoplayChange = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setAutoplayVideos(e.detail);
      } else {
        setAutoplayVideos(localStorage.getItem('autoplayVideos') !== 'false');
      }
    };
    window.addEventListener('autoplay-setting-changed', handleAutoplayChange);
    return () => window.removeEventListener('autoplay-setting-changed', handleAutoplayChange);
  }, []);

  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [reelCommentsOpen, setReelCommentsOpen] = useState(false);
  const [reelCommentText, setReelCommentText] = useState("");

  const [replyingToVideoComment, setReplyingToVideoComment] = useState<{ id: string; authorName: string } | null>(null);
  const [replyingToReelComment, setReplyingToReelComment] = useState<{ id: string; authorName: string } | null>(null);
  const [poppingLikeIds, setPoppingLikeIds] = useState<Record<string, boolean>>({});
  const [watchToast, setWatchToast] = useState<ToastNotice | null>(null);

  const showWatchToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setWatchToast({ id: `wt-${Date.now()}`, message, type });
    setTimeout(() => {
      setWatchToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  };

  const handleCopyShareLink = async (link: string, label: string, reelId?: string) => {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(link);
      if (reelId) {
        setReels((prev) =>
          prev.map((r) => (r.id === reelId ? { ...r, shares: r.shares + 1 } : r))
        );
      }
      showWatchToast(`${label} link copied to clipboard!`, 'success');
    } catch {
      showWatchToast(`Failed to copy ${label.toLowerCase()} link to clipboard.`, 'error');
    }
  };

  const triggerLikePop = (id: string) => {
    setPoppingLikeIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setPoppingLikeIds((prev) => ({ ...prev, [id]: false }));
    }, 450);
  };

  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const reelInputRef = useRef<HTMLInputElement | null>(null);
  const reelsContainerRef = useRef<HTMLDivElement | null>(null);
  const reelVideoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const scrollReels = (direction: 'left' | 'right') => {
    const container = reelsContainerRef.current;
    if (!container) return;
    const scrollAmount = 260;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleModalCommentSubmit = (postId: string) => {
    if (!videoCommentText || !videoCommentText.trim()) return;

    addComment(postId, videoCommentText, true);

    if (selectedVideo) {
      const newComment: Comment = {
        id: `m_c_${Date.now()}`,
        authorName: profile.name,
        authorAvatar: profile.avatar,
        content: videoCommentText,
        timestamp: "Just now",
        replyToId: replyingToVideoComment?.id,
        replyToName: replyingToVideoComment?.authorName
      };
      setSelectedVideo({
        ...selectedVideo,
        comments: [...selectedVideo.comments, newComment]
      });
    }

    setVideoCommentText("");
    setReplyingToVideoComment(null);
  };

  const handleLikeReel = (reelId: string) => {
    setReels(prev => prev.map(r => {
      if (r.id === reelId) {
        const liked = !r.likedByMe;
        return {
          ...r,
          likedByMe: liked,
          likes: liked ? r.likes + 1 : r.likes - 1
        };
      }
      return r;
    }));
  };

  const handleAddReelComment = (reelId: string) => {
    if (!reelCommentText.trim()) return;
    const newComment: Comment = {
      id: `rc_${Date.now()}`,
      authorName: profile.name,
      authorAvatar: profile.avatar,
      content: reelCommentText,
      timestamp: "Just now",
      replyToId: replyingToReelComment?.id,
      replyToName: replyingToReelComment?.authorName
    };

    setReels(prev => prev.map(r => {
      if (r.id === reelId) {
        return {
          ...r,
          comments: [...r.comments, newComment]
        };
      }
      return r;
    }));
    setReelCommentText("");
    setReplyingToReelComment(null);
  };

  const ytVideoData = watchPosts.map(post => {
    let title = post.title || post.content.split('.')[0] || "Featured Video";
    let duration = post.duration || "4:32";
    let views = post.views || "840K views";

    if (post.id === 'w1') {
      title = "Exploring Sylhet's Tea Gardens & Waterfalls (Full Tour)";
      duration = "5:18";
      views = "2.4M views";
    } else if (post.id === 'w2') {
      title = "Traditional Bengali Kacchi Biryani & Dessert Masterclass";
      duration = "8:24";
      views = "1.1M views";
    } else if (post.id === 'w3') {
      title = "Inside Dhaka's Growing Hardware & Robotics Lab";
      duration = "12:15";
      views = "4.5M views";
    }

    return {
      ...post,
      title,
      duration,
      views
    };
  });

  return (
    <div className="bg-[#F0F2F5] lg:bg-transparent min-h-[calc(100vh-56px)] pb-4 lg:pb-4 select-none font-sans" id="watch-tab-container">
      <ToastBanner toast={watchToast} onDismiss={() => setWatchToast(null)} />

      {/* SECTION 1: REELS & SHORTS */}
      <div className="bg-white border-b border-gray-200 py-3.5 flex flex-col shadow-xs relative group/section" id="reels-main-section">
        <div className="px-4 pb-2.5 flex items-center justify-between border-b border-gray-100 mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900">Reels & Shorts</h2>
        </div>

        <div className="relative w-full px-4 flex items-stretch">
          <button
            onClick={() => scrollReels('left')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 text-gray-800 border border-gray-200 shadow-md flex items-center justify-center cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity duration-200 active:scale-90 hover:bg-zinc-50"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-700" />
          </button>

          <div
            ref={reelsContainerRef}
            className="flex w-full overflow-x-auto gap-3.5 pb-2 snap-x snap-mandatory scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            id="reels-horizontal-gallery"
          >
            {reels.map((reel, index) => (
              <div
                key={reel.id}
                onClick={() => {
                  setActiveReelIndex(index);
                  setReelCommentsOpen(false);
                }}
                className="relative flex-none w-[calc(25%-10.5px)] aspect-[9/16] rounded-2xl overflow-hidden snap-start cursor-pointer group shadow-sm bg-zinc-950 border border-gray-100/10 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95"
              >
                <img
                  src={reel.videoThumbnail}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/85 z-10" />

                <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
                  <div className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md text-[8.5px] font-bold text-white tracking-wide border border-white/10">
                    {reel.views}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-black/20">
                  <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-300 shadow-md">
                    <Play className="w-5 h-5 fill-current ml-0.5 text-white" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1 text-white z-20">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile?.(reel.authorName, reel.authorAvatar);
                    }}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-95 group/author"
                    title={`View ${reel.authorName}'s profile`}
                  >
                    <img
                      src={reel.authorAvatar}
                      alt=""
                      className="w-5.5 h-5.5 rounded-full object-cover border-2 border-white/80 shrink-0 shadow-sm group-hover/author:ring-2 group-hover/author:ring-[#E3EF26] transition-all"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9.5px] font-bold truncate drop-shadow-sm leading-none group-hover/author:underline group-hover/author:text-[#E3EF26] transition-colors">{reel.authorName}</span>
                      <span className="text-[8px] text-zinc-300 leading-none mt-0.5 truncate">{reel.title.split('#')[0].trim()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => scrollReels('right')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 text-gray-800 border border-gray-200 shadow-md flex items-center justify-center cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity duration-200 active:scale-90 hover:bg-zinc-50"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 text-zinc-700" />
          </button>
        </div>
      </div>

      {/* SECTION 2: FEATURED VIDEOS GRID */}
      <div className="bg-white border-t border-gray-200 pt-3 mt-2" id="grid-videos-section">
        <div className="px-3 sm:px-4 pb-2.5 flex items-center justify-between border-b border-gray-100 mb-3">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900">Featured Videos</h2>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 px-3 pb-4 sm:pb-4" id="watch-videos-grid">
          {ytVideoData.map((video) => (
            <div
              key={video.id}
              onClick={() => {
                setSelectedVideo(video);
                setMuted(false);
              }}
              className="flex flex-col cursor-pointer group select-none transition-all duration-200 active:scale-95"
            >
              {/* Thumbnail Container (no resolution labels) */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-gray-250/50 shadow-xs">
                <img
                  src={video.videoThumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/25 transition-colors duration-200" />

                {/* Duration Badge in Corner */}
                <div className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-bold leading-none">
                  {video.duration}
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="bg-red-600 text-white p-2 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform duration-200">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </span>
                </div>
              </div>

              <div className="mt-1.5 px-0.5 flex flex-col">
                <h3 className="text-[10px] sm:text-xs font-bold text-gray-950 line-clamp-2 leading-tight tracking-tight group-hover:text-[#076653] transition-colors">
                  {video.title}
                </h3>
                <div className="flex flex-col text-[8px] sm:text-[9px] text-gray-500 font-medium mt-0.5 leading-tight">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile?.(video.authorName, video.authorAvatar);
                    }}
                    className="truncate hover:text-[#076653] hover:underline cursor-pointer font-semibold"
                    title={`View ${video.authorName}'s profile`}
                  >
                    {video.authorName}
                  </span>
                  <span className="text-[7.5px] text-gray-400 mt-0.5">{video.views} • {video.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: VIDEO THEATER & COMMENTS PLAYER */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/85 z-55 flex items-center justify-center p-0 md:p-4 overflow-hidden select-none">
            <div className="absolute inset-0 hidden md:block" onClick={() => setSelectedVideo(null)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[950px] h-full md:h-[90vh] md:max-h-[750px] bg-white md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
              id="theatre-video-player-modal"
            >
              {/* Left Side: HTML5 video frame */}
              <div className="relative bg-zinc-950 flex-1 flex items-center justify-center min-h-[220px] sm:min-h-[350px] md:h-full">
                <video
                  ref={modalVideoRef}
                  src={selectedVideo.videoUrl}
                  poster={selectedVideo.videoThumbnail}
                  className="w-full h-full object-contain max-h-[70vh] md:max-h-full"
                  controls
                  autoPlay={autoplayVideos}
                  playsInline
                  muted={muted}
                />

                {/* Top Right Mute Button */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  <button
                    onClick={() => setMuted(!muted)}
                    className="bg-black/75 hover:bg-zinc-900 text-white p-2.5 rounded-full backdrop-blur-xs transition-colors cursor-pointer border border-white/10"
                    title={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Close Button Float for Mobile */}
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-4 left-4 bg-black/75 hover:bg-zinc-900 text-white p-2.5 rounded-full cursor-pointer md:hidden border border-white/10"
                  title="Close Video"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Direct Write Comment Box Overlay on Video */}
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-20 pointer-events-auto bg-black/70 hover:bg-black/85 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-xl transition-all focus-within:border-[#E3EF26] focus-within:bg-black/90" id="video-overlay-comment-box">
                  <img
                    src={profile.avatar}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-white/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <input
                    type="text"
                    value={videoCommentText}
                    onChange={(e) => setVideoCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleModalCommentSubmit(selectedVideo.id);
                    }}
                    placeholder="Write a comment on this video..."
                    className="bg-transparent text-white placeholder-zinc-300 text-xs flex-1 focus:outline-none min-w-0"
                    id="overlay-video-comment-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleModalCommentSubmit(selectedVideo.id)}
                    className="p-1 text-[#E3EF26] hover:text-white transition-colors cursor-pointer"
                    title="Send comment"
                    id="overlay-video-comment-send"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Side: Video Meta Details, Likes, Comments list */}
              <div className="w-full md:w-[380px] bg-white shrink-0 h-full flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200">
                <div className="p-4 border-b border-gray-150 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-950 leading-snug pr-4">
                      {selectedVideo.title}
                    </h3>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 cursor-pointer hidden md:block"
                      title="Close Player"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div
                    onClick={() => onViewProfile?.(selectedVideo.authorName, selectedVideo.authorAvatar)}
                    className="flex items-center gap-2 mt-1.5 cursor-pointer group/creator"
                    title={`View ${selectedVideo.authorName}'s profile`}
                  >
                    <img
                      src={selectedVideo.authorAvatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-gray-100 group-hover/creator:ring-2 group-hover/creator:ring-[#076653] transition-all"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-900 leading-none group-hover/creator:text-[#076653] group-hover/creator:underline transition-colors">{selectedVideo.authorName}</span>
                      <span className="text-[10px] text-gray-400 mt-1 leading-none">{selectedVideo.views} • {selectedVideo.timestamp}</span>
                    </div>
                  </div>

                  {/* Likes and actions */}
                  <div className="flex gap-2.5 mt-2.5 border-t border-gray-100 pt-2.5">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        triggerLikePop(selectedVideo.id);
                        likePost(selectedVideo.id, true);
                        setSelectedVideo({
                          ...selectedVideo,
                          likedByMe: !selectedVideo.likedByMe,
                          likes: selectedVideo.likedByMe ? selectedVideo.likes - 1 : selectedVideo.likes + 1
                        });
                      }}
                      className={`relative flex-1 flex justify-center items-center gap-1.5 py-1.5 rounded-full transition-all duration-200 text-[10px] sm:text-xs font-bold border cursor-pointer select-none ${
                        selectedVideo.likedByMe
                          ? 'text-[#076653] bg-[#EBF7F2] border-[#076653]/30 ring-1 ring-[#076653]/25 shadow-2xs'
                          : 'text-gray-600 border-gray-100 hover:bg-[#EBF7F2]/60 hover:text-[#076653]'
                      } ${poppingLikeIds[selectedVideo.id] ? 'animate-like-btn-pop bg-[#d4f4e7]' : ''}`}
                    >
                      <span className="relative inline-flex items-center justify-center">
                        {poppingLikeIds[selectedVideo.id] && (
                          <span className="absolute inset-0 rounded-full border-2 border-[#076653] animate-like-ring pointer-events-none" />
                        )}
                        <Heart
                          className={`w-3.5 h-3.5 transition-all duration-200 ${
                            selectedVideo.likedByMe
                              ? 'fill-[#076653] text-[#076653] scale-110 animate-like-pop'
                              : ''
                          } ${poppingLikeIds[selectedVideo.id] ? 'animate-like-pop text-[#076653]' : ''}`}
                        />
                      </span>
                      <span>{selectedVideo.likes} Likes</span>
                    </motion.button>

                    <button
                      onClick={() =>
                        handleCopyShareLink(
                          selectedVideo.videoUrl || `${window.location.origin}/?video=${selectedVideo.id}`,
                          'Video'
                        )
                      }
                      className="flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-gray-100 active:scale-95 rounded-full transition-all text-[10px] sm:text-xs font-bold border border-gray-100 text-gray-600 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Comments Scrolling Area */}
                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3.5 max-h-[220px] md:max-h-none">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Comments ({selectedVideo.comments.length})
                  </span>

                  {selectedVideo.comments.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      Be the first to comment on this video
                    </div>
                  ) : (
                    selectedVideo.comments.filter((c: any) => !c.replyToId).map((parent: any) => {
                      const replies = selectedVideo.comments.filter((c: any) => c.replyToId === parent.id);
                      return (
                        <div key={parent.id} className="flex flex-col gap-2 border-b border-gray-50 pb-2.5 last:border-0" id={`comment-thread-${parent.id}`}>
                          <div className="flex gap-2 text-xs items-start">
                            <img
                              src={parent.authorAvatar}
                              alt=""
                              onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                              className="w-6 h-6 rounded-full object-cover border border-gray-200 mt-0.5 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                              title={`View ${parent.authorName}'s profile`}
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-100 border border-gray-200/50 rounded-xl px-3 py-1.5">
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
                                <p className="text-[11px] text-gray-800 leading-normal whitespace-pre-wrap">
                                  {parent.content.includes('@') ? (
                                    parent.content.split(' ').map((word: string, i: number) => {
                                      if (word.startsWith('@')) {
                                        const cleanName = word.replace(/[@,.:!?]/g, '').trim();
                                        return (
                                          <span
                                            key={`vid-parent-${parent.id}-${cleanName}-${i}`}
                                            onClick={() => cleanName && onViewProfile?.(cleanName)}
                                            className="text-[#076653] font-semibold hover:underline cursor-pointer"
                                            title={`View ${cleanName}'s profile`}
                                          >
                                            {word}{' '}
                                          </span>
                                        );
                                      }
                                      return word + ' ';
                                    })
                                  ) : (
                                    parent.content
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 px-1 mt-1">
                                <button
                                  onClick={() => {
                                    setReplyingToVideoComment({ id: parent.id, authorName: parent.authorName });
                                    if (!videoCommentText.includes(`@${parent.authorName}`)) {
                                      setVideoCommentText(prev => `@${parent.authorName} ` + prev);
                                    }
                                    setTimeout(() => {
                                      const input = (videoInputRef.current || document.getElementById("video-comment-input-field")) as HTMLInputElement;
                                      if (input) {
                                        input.focus();
                                        input.setSelectionRange(input.value.length, input.value.length);
                                      }
                                    }, 50);
                                  }}
                                  className="text-[8.5px] text-gray-500 hover:text-[#076653] font-bold cursor-pointer hover:underline uppercase tracking-wider"
                                  id={`reply-btn-${parent.id}`}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>

                          {replies.length > 0 && (
                            <div className="ml-7 flex flex-col gap-2 border-l-2 border-gray-100 pl-2.5 pt-0.5">
                              {replies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-2 text-xs items-start" id={`reply-item-${reply.id}`}>
                                  <img
                                    src={reply.authorAvatar}
                                    alt=""
                                    onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                    className="w-5 h-5 rounded-full object-cover border border-gray-200 mt-0.5 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
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
                                      <p className="text-[10px] text-gray-800 leading-normal whitespace-pre-wrap">
                                        {reply.content.includes('@') ? (
                                          reply.content.split(' ').map((word: string, i: number) => {
                                            if (word.startsWith('@')) {
                                              const cleanName = word.replace(/[@,.:!?]/g, '').trim();
                                              return (
                                                <span
                                                  key={`vid-reply-${reply.id}-${cleanName}-${i}`}
                                                  onClick={() => cleanName && onViewProfile?.(cleanName)}
                                                  className="text-[#076653] font-semibold hover:underline cursor-pointer"
                                                  title={`View ${cleanName}'s profile`}
                                                >
                                                  {word}{' '}
                                                </span>
                                              );
                                            }
                                            return word + ' ';
                                          })
                                        ) : (
                                          reply.content
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 px-1 mt-1">
                                      <button
                                        onClick={() => {
                                          setReplyingToVideoComment({ id: parent.id, authorName: reply.authorName });
                                          if (!videoCommentText.includes(`@${reply.authorName}`)) {
                                            setVideoCommentText(prev => `@${reply.authorName} ` + prev);
                                          }
                                          setTimeout(() => {
                                            const input = (videoInputRef.current || document.getElementById("video-comment-input-field")) as HTMLInputElement;
                                            if (input) {
                                              input.focus();
                                              input.setSelectionRange(input.value.length, input.value.length);
                                            }
                                          }, 50);
                                        }}
                                        className="text-[8px] text-gray-500 hover:text-[#076653] font-bold cursor-pointer hover:underline uppercase tracking-wider"
                                        id={`reply-to-reply-btn-${reply.id}`}
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
                    })
                  )}
                </div>

                {replyingToVideoComment && (
                  <div className="bg-[#EBF7F2] border-t border-b border-[#076653]/20 px-4 py-1.5 flex items-center justify-between text-[10px] text-[#076653] font-bold transition-all" id="replying-to-video-banner">
                    <span className="truncate">Replying to @{replyingToVideoComment.authorName}</span>
                    <button
                      onClick={() => setReplyingToVideoComment(null)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
                      title="Cancel reply"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative">
                  {(() => {
                    const videoMentionQuery = getMentionQuery(videoCommentText);
                    const matchedUsers = videoMentionQuery !== null
                      ? getMentionableUsers(selectedVideo.comments, selectedVideo.authorName, profile.avatar).filter(u => u.name.toLowerCase().includes(videoMentionQuery.toLowerCase()))
                      : [];
                    if (videoMentionQuery !== null && matchedUsers.length > 0) {
                      return (
                        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-40 overflow-y-auto z-40 flex flex-col divide-y divide-gray-100 border-b border-gray-150" id="video-mentions-popover">
                          <div className="px-3 py-1 bg-gray-50 text-[8px] font-bold text-gray-400 tracking-wider uppercase">
                            Mention Someone
                          </div>
                          {matchedUsers.map((user) => (
                            <button
                              key={user.name}
                              onClick={() => {
                                handleSelectMention(user.name, videoCommentText, setVideoCommentText, videoInputRef);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left cursor-pointer w-full transition-colors"
                              id={`mention-user-${user.name.replace(/\s+/g, '-')}`}
                            >
                              <img
                                src={user.avatar}
                                alt=""
                                className="w-5.5 h-5.5 rounded-full object-cover border border-gray-100"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-bold text-gray-900">{user.name}</span>
                            </button>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="p-3 bg-white border-t border-gray-200 flex gap-2 items-center" id="video-typing-field">
                    <img
                      src={profile.avatar}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 relative flex items-center">
                      <input
                        ref={videoInputRef}
                        type="text"
                        value={videoCommentText}
                        onChange={(e) => setVideoCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleModalCommentSubmit(selectedVideo.id);
                        }}
                        placeholder="Comment publicly (use @ to mention)..."
                        className="w-full bg-gray-100 border border-gray-200 rounded-full px-3.5 py-1.5 pr-8 text-xs focus:outline-none focus:bg-white focus:border-[#076653]"
                        id="video-comment-input-field"
                      />
                      <button
                        onClick={() => handleModalCommentSubmit(selectedVideo.id)}
                        className="absolute right-1.5 text-gray-400 hover:text-[#076653] p-1.5 transition-colors cursor-pointer"
                        id="video-comment-send-btn"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: IMMERSIVE REELS PLAYER */}
      <AnimatePresence>
        {activeReelIndex !== null && (
          <div className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-0 md:p-4 overflow-hidden select-none">
            <div className="absolute inset-0 hidden md:block" onClick={() => setActiveReelIndex(null)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[950px] h-full md:h-[90vh] md:max-h-[750px] bg-zinc-950 md:rounded-2xl shadow-2xl flex overflow-hidden border border-zinc-800/50"
            >
              {/* Left Column: Portrait Video Player */}
              <div className="relative flex-1 bg-black flex items-center justify-center h-full aspect-[9/16]">
                <video
                  ref={(el) => {
                    const currentReelId = reels[activeReelIndex]?.id;
                    if (currentReelId) reelVideoRefs.current[currentReelId] = el;
                  }}
                  src={reels[activeReelIndex].videoUrl}
                  className="w-full h-full object-cover"
                  loop
                  autoPlay={autoplayVideos}
                  playsInline
                  muted={muted}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Reel Close Button (Mobile float) */}
                <button
                  onClick={() => setActiveReelIndex(null)}
                  className="absolute top-4 left-4 bg-black/45 hover:bg-black/60 text-white p-2 rounded-full cursor-pointer md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Floating controls on right of the video */}
                <div className="absolute right-3.5 bottom-20 flex flex-col items-center gap-4 text-white z-10">
                  <div className="flex flex-col items-center">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        triggerLikePop(reels[activeReelIndex].id);
                        handleLikeReel(reels[activeReelIndex].id);
                      }}
                      className={`relative p-2.5 rounded-full transition-all duration-200 cursor-pointer shadow-md ${
                        reels[activeReelIndex].likedByMe
                          ? 'bg-red-500 text-white ring-2 ring-red-300/60'
                          : 'bg-black/45 hover:bg-black/60 hover:scale-105 text-white'
                      } ${poppingLikeIds[reels[activeReelIndex].id] ? 'animate-like-btn-pop' : ''}`}
                    >
                      <Heart className={`w-5 h-5 transition-all duration-200 ${reels[activeReelIndex].likedByMe ? 'fill-current animate-like-pop scale-110' : ''} ${poppingLikeIds[reels[activeReelIndex].id] ? 'animate-like-pop' : ''}`} />
                    </motion.button>
                    <span className="text-[10px] font-bold mt-1 drop-shadow-sm">{reels[activeReelIndex].likes}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setReelCommentsOpen(!reelCommentsOpen)}
                      className={`p-2.5 rounded-full transition-transform hover:scale-105 active:scale-75 cursor-pointer shadow-md ${
                        reelCommentsOpen ? 'bg-[#076653] text-[#E3EF26]' : 'bg-black/45 hover:bg-black/60 text-white'
                      }`}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold mt-1 drop-shadow-sm">{reels[activeReelIndex].comments.length}</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setMuted(!muted)}
                      className="p-2.5 rounded-full bg-black/45 hover:bg-black/60 hover:scale-105 active:scale-75 cursor-pointer shadow-md text-white"
                    >
                      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <button
                      onClick={() =>
                        handleCopyShareLink(
                          reels[activeReelIndex].videoUrl || `${window.location.origin}/?reel=${reels[activeReelIndex].id}`,
                          'Reel',
                          reels[activeReelIndex].id
                        )
                      }
                      className="p-2.5 rounded-full bg-black/45 hover:bg-black/60 hover:scale-105 active:scale-75 cursor-pointer shadow-md text-white"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-bold mt-1 drop-shadow-sm">{reels[activeReelIndex].shares}</span>
                  </div>
                </div>

                {/* Reel description on bottom-left overlay */}
                <div className="absolute left-4 bottom-4 right-16 text-white flex flex-col gap-2 pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <div
                      onClick={() => onViewProfile?.(reels[activeReelIndex].authorName, reels[activeReelIndex].authorAvatar)}
                      className="flex items-center gap-2 cursor-pointer group/creator"
                      title={`View ${reels[activeReelIndex].authorName}'s profile`}
                    >
                      <img
                        src={reels[activeReelIndex].authorAvatar}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border-2 border-white group-hover/creator:ring-2 group-hover/creator:ring-[#E3EF26] transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold leading-none group-hover/creator:underline group-hover/creator:text-[#E3EF26] transition-colors">{reels[activeReelIndex].authorName}</span>
                        <span className="text-[8px] text-zinc-300 font-semibold mt-0.5 leading-none">{reels[activeReelIndex].views} views</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed line-clamp-2 hover:line-clamp-none font-normal text-zinc-100 transition-all cursor-pointer">
                    {reels[activeReelIndex].title}
                  </p>

                  {/* Direct Write Comment Box on Reel Video Overlay */}
                  <div className="mt-1 flex items-center gap-1.5 bg-black/60 hover:bg-black/75 backdrop-blur-md rounded-full border border-white/25 px-3 py-1.5 focus-within:border-[#E3EF26] focus-within:bg-black/85 transition-all shadow-xl max-w-[340px]" id="reel-overlay-comment-box">
                    <img
                      src={profile.avatar}
                      alt=""
                      onClick={() => onViewProfile?.(profile.name, profile.avatar)}
                      className="w-5 h-5 rounded-full object-cover border border-white/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#E3EF26] transition-all"
                      title="View your profile"
                      referrerPolicy="no-referrer"
                    />
                    <input
                      type="text"
                      value={reelCommentText}
                      onChange={(e) => setReelCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddReelComment(reels[activeReelIndex].id);
                      }}
                      placeholder="Write a comment on this video..."
                      className="bg-transparent text-white placeholder-zinc-300 text-xs flex-1 focus:outline-none min-w-0"
                      id="reel-overlay-comment-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddReelComment(reels[activeReelIndex].id)}
                      className="p-1 text-[#E3EF26] hover:text-white transition-colors cursor-pointer"
                      title="Send comment"
                      id="reel-overlay-comment-send"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeReelIndex > 0 && (
                  <button
                    onClick={() => setActiveReelIndex(activeReelIndex - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 hover:scale-110 active:scale-95 text-white transition-all cursor-pointer hidden md:flex"
                    title="Previous Reel"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                {activeReelIndex < reels.length - 1 && (
                  <button
                    onClick={() => setActiveReelIndex(activeReelIndex + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 hover:scale-110 active:scale-95 text-white transition-all cursor-pointer hidden md:flex"
                    title="Next Reel"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Right Column: Reel Comments Panel */}
              <div
                className={`w-full md:w-[360px] shrink-0 h-full bg-white flex flex-col justify-between border-l border-zinc-200/80 transition-all duration-300 z-30 absolute md:static inset-y-0 right-0 ${
                  reelCommentsOpen
                    ? 'translate-y-0 md:translate-y-0'
                    : 'translate-y-full md:translate-y-0 hidden md:flex'
                }`}
              >
                <div className="bg-gray-50 border-b border-gray-150 px-4 py-3.5 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Reel Comments
                    </h3>
                    <span className="text-[9px] text-gray-400 font-bold">{reels[activeReelIndex].comments.length} replies</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setReelCommentsOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-200 cursor-pointer md:hidden"
                      title="Hide comments"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveReelIndex(null)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-200 cursor-pointer hidden md:block"
                      title="Close Reel Player"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3.5 max-h-[calc(100vh-140px)] md:max-h-none">
                  {reels[activeReelIndex].comments.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-xs">
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    reels[activeReelIndex].comments.filter((c: any) => !c.replyToId).map((parent: any) => {
                      const replies = reels[activeReelIndex].comments.filter((c: any) => c.replyToId === parent.id);
                      return (
                        <div key={parent.id} className="flex flex-col gap-2 border-b border-gray-100/50 pb-3 last:border-0" id={`reel-comment-thread-${parent.id}`}>
                          <div className="flex gap-2.5 text-xs items-start">
                            <img
                              src={parent.authorAvatar}
                              alt=""
                              onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                              className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                              title={`View ${parent.authorName}'s profile`}
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-100 border border-gray-200/50 rounded-xl px-3 py-2">
                                <div className="flex justify-between items-center mb-0.5">
                                  <span
                                    onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                                    className="font-bold text-[10px] text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                    title={`View ${parent.authorName}'s profile`}
                                  >
                                    {parent.authorName}
                                  </span>
                                  <span className="text-[8px] text-gray-400 font-medium">{parent.timestamp}</span>
                                </div>
                                <p className="text-[11px] text-gray-800 leading-relaxed font-normal whitespace-pre-wrap">
                                  {parent.content.includes('@') ? (
                                    parent.content.split(' ').map((word: string, i: number) => {
                                      if (word.startsWith('@')) {
                                        const cleanName = word.replace(/[@,.:!?]/g, '').trim();
                                        return (
                                          <span
                                            key={`reel-parent-${parent.id}-${cleanName}-${i}`}
                                            onClick={() => cleanName && onViewProfile?.(cleanName)}
                                            className="text-[#076653] font-semibold hover:underline cursor-pointer"
                                            title={`View ${cleanName}'s profile`}
                                          >
                                            {word}{' '}
                                          </span>
                                        );
                                      }
                                      return word + ' ';
                                    })
                                  ) : (
                                    parent.content
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 px-1 mt-1">
                                <button
                                  onClick={() => {
                                    setReplyingToReelComment({ id: parent.id, authorName: parent.authorName });
                                    if (!reelCommentText.includes(`@${parent.authorName}`)) {
                                      setReelCommentText(prev => `@${parent.authorName} ` + prev);
                                    }
                                    setTimeout(() => {
                                      const input = (reelInputRef.current || document.getElementById("reel-comment-input-field")) as HTMLInputElement;
                                      if (input) {
                                        input.focus();
                                        input.setSelectionRange(input.value.length, input.value.length);
                                      }
                                    }, 50);
                                  }}
                                  className="text-[8.5px] text-[#076653] hover:underline font-bold cursor-pointer uppercase tracking-wider"
                                  id={`reel-reply-btn-${parent.id}`}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>

                          {replies.length > 0 && (
                            <div className="ml-8 flex flex-col gap-2 border-l border-zinc-150 pl-3 pt-1">
                              {replies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-2 text-xs items-start" id={`reel-reply-item-${reply.id}`}>
                                  <img
                                    src={reply.authorAvatar}
                                    alt=""
                                    onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                    className="w-5.5 h-5.5 rounded-full object-cover border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                    title={`View ${reply.authorName}'s profile`}
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-zinc-50 border border-zinc-150 rounded-xl px-2.5 py-1.5">
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span
                                          onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                          className="font-bold text-[9px] text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                          title={`View ${reply.authorName}'s profile`}
                                        >
                                          {reply.authorName}
                                        </span>
                                        <span className="text-[8px] text-gray-400 font-medium">{reply.timestamp}</span>
                                      </div>
                                      <p className="text-[10px] text-zinc-700 leading-relaxed font-normal whitespace-pre-wrap">
                                        {reply.content.includes('@') ? (
                                          reply.content.split(' ').map((word: string, i: number) => {
                                            if (word.startsWith('@')) {
                                              const cleanName = word.replace(/[@,.:!?]/g, '').trim();
                                              return (
                                                <span
                                                  key={`reel-reply-${reply.id}-${cleanName}-${i}`}
                                                  onClick={() => cleanName && onViewProfile?.(cleanName)}
                                                  className="text-[#076653] font-semibold hover:underline cursor-pointer"
                                                  title={`View ${cleanName}'s profile`}
                                                >
                                                  {word}{' '}
                                                </span>
                                              );
                                            }
                                            return word + ' ';
                                          })
                                        ) : (
                                          reply.content
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 px-1 mt-1">
                                      <button
                                        onClick={() => {
                                          setReplyingToReelComment({ id: parent.id, authorName: reply.authorName });
                                          if (!reelCommentText.includes(`@${reply.authorName}`)) {
                                            setReelCommentText(prev => `@${reply.authorName} ` + prev);
                                          }
                                          setTimeout(() => {
                                            const input = (reelInputRef.current || document.getElementById("reel-comment-input-field")) as HTMLInputElement;
                                            if (input) {
                                              input.focus();
                                              input.setSelectionRange(input.value.length, input.value.length);
                                            }
                                          }, 50);
                                        }}
                                        className="text-[8px] text-[#076653] hover:underline font-bold cursor-pointer uppercase tracking-wider"
                                        id={`reel-reply-to-reply-btn-${reply.id}`}
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
                    })
                  )}
                </div>

                {replyingToReelComment && (
                  <div className="bg-[#EBF7F2] border-t border-b border-[#076653]/20 px-4 py-1.5 flex items-center justify-between text-[10px] text-[#076653] font-bold transition-all" id="replying-to-reel-banner">
                    <span className="truncate">Replying to @{replyingToReelComment.authorName}</span>
                    <button
                      onClick={() => setReplyingToReelComment(null)}
                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
                      title="Cancel reply"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="relative">
                  {(() => {
                    const reelMentionQuery = getMentionQuery(reelCommentText);
                    const matchedUsers = reelMentionQuery !== null
                      ? getMentionableUsers(reels[activeReelIndex].comments, reels[activeReelIndex].authorName, profile.avatar).filter(u => u.name.toLowerCase().includes(reelMentionQuery.toLowerCase()))
                      : [];
                    if (reelMentionQuery !== null && matchedUsers.length > 0) {
                      return (
                        <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg max-h-40 overflow-y-auto z-40 flex flex-col divide-y divide-gray-100 border-b border-gray-150" id="reel-mentions-popover">
                          <div className="px-3 py-1 bg-gray-50 text-[8px] font-bold text-zinc-400 tracking-wider uppercase">
                            Mention Someone
                          </div>
                          {matchedUsers.map((user) => (
                            <button
                              key={user.name}
                              onClick={() => {
                                handleSelectMention(user.name, reelCommentText, setReelCommentText, reelInputRef);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-left cursor-pointer w-full transition-colors"
                              id={`reel-mention-user-${user.name.replace(/\s+/g, '-')}`}
                            >
                              <img
                                src={user.avatar}
                                alt=""
                                className="w-5.5 h-5.5 rounded-full object-cover border border-gray-100"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-bold text-zinc-950">{user.name}</span>
                            </button>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="p-3 bg-white border-t border-gray-150 flex gap-2.5 items-center" id="reel-typing-field">
                    <img
                      src={profile.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 relative flex items-center">
                      <input
                        ref={reelInputRef}
                        type="text"
                        value={reelCommentText}
                        onChange={(e) => setReelCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddReelComment(reels[activeReelIndex].id);
                        }}
                        placeholder="Reply to this reel (use @ to mention)..."
                        className="w-full bg-gray-100 border border-gray-200 rounded-full px-4 py-2 pr-9 text-xs focus:outline-none focus:bg-white focus:border-[#076653]"
                        id="reel-comment-input-field"
                      />
                      <button
                        onClick={() => handleAddReelComment(reels[activeReelIndex].id)}
                        className="absolute right-2 text-gray-400 hover:text-[#076653] p-1.5 transition-colors cursor-pointer"
                        id="reel-comment-send-btn"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
