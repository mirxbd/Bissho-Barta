import { useState, useEffect, useRef, ComponentType, RefObject } from 'react';
import { Post, UserProfile, Comment } from '../types';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Send, 
  X, 
  Flame, 
  ChevronRight, 
  ChevronLeft,
  Tv,
  Eye,
  MessageSquare,
  ThumbsUp,
  Maximize2,
  SlidersHorizontal,
  Check,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStoredVideoResolution, setStoredVideoResolution, VideoResolutionSetting } from '../utils/mediaOptimizer';

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
  
  // High fidelity default content creators
  const defaults = [
    { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "David Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Emily Rodriguez", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Michael Chang", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" },
    { name: "Beach Wanderer", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80" },
    { name: "Zen Yoga Life", avatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=100&h=100&q=80" },
    { name: "Amazing Switzerland", avatar: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=100&h=100&q=80" },
    { name: "Developer ASMR", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80" },
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
  // Video volume and active playing video states
  const [muted, setMuted] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState<Post | null>(null);
  const [inlineComments, setInlineComments] = useState<{ [postId: string]: string }>({});

  // Active video detail modal (YouTube Theater Style)
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [videoCommentText, setVideoCommentText] = useState("");

  // Video playback & upload regulation setting (480p vs 720p max)
  const [videoResolution, setVideoResolution] = useState<VideoResolutionSetting>(() => getStoredVideoResolution());

  const handleSetResolution = (res: VideoResolutionSetting) => {
    setVideoResolution(res);
    setStoredVideoResolution(res);
  };
  
  // Reels interactive local state
  const [reels, setReels] = useState<Reel[]>([
    {
      id: "reel_1",
      authorName: "Amazing Switzerland",
      authorAvatar: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Chasing pristine glacial streams in the high Swiss Alps! 🇨🇭🌲 Absolutely surreal water clarity. #nature #travel #reels #switzerland",
      likes: 1240,
      likedByMe: false,
      shares: 340,
      views: "1.2M",
      comments: [
        { id: "rc1_1", authorName: "Sarah Jenkins", authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", content: "Oh my god, this looks surreal! 😍 Adding this to my hiking list.", timestamp: "2h ago" },
        { id: "rc1_2", authorName: "David Chen", authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", content: "Is this near Lauterbrunnen? The water looks freezing!", timestamp: "1h ago" }
      ]
    },
    {
      id: "reel_2",
      authorName: "Barista Pro",
      authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-coffee-maker-machine-brewing-coffee-32242-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Perfecting the morning espresso grind. Fresh roast coffee profile extraction ☕🌿 #coffee #espresso #satisfying #barista",
      likes: 852,
      likedByMe: false,
      shares: 98,
      views: "410K",
      comments: [
        { id: "rc2_1", authorName: "Emily Rodriguez", authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80", content: "The crema on that shot is flawless! What beans are you using?", timestamp: "4h ago" }
      ]
    },
    {
      id: "reel_3",
      authorName: "Developer ASMR",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-40546-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Mid-night typing sessions with lubed linear switches. Pure therapeutic ASMR 🎧💻 #customkeyboard #mechanicalkeyboard #coding #desksetup",
      likes: 3105,
      likedByMe: false,
      shares: 615,
      views: "2.5M",
      comments: [
        { id: "rc3_1", authorName: "Michael Chang", authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80", content: "Sounds like rain hitting a tin roof. Heavenly!", timestamp: "1d ago" }
      ]
    },
    {
      id: "reel_4",
      authorName: "Patisserie Chef",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-melted-chocolate-on-a-croissant-34444-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Warm oven-baked golden croissant meeting melted dark chocolate sauce! Baker's dream 🥐🍫 #pastry #baking #chocolate #satisfying",
      likes: 1940,
      likedByMe: false,
      shares: 405,
      views: "950K",
      comments: [
        { id: "rc4_1", authorName: "Sarah Jenkins", authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80", content: "And there goes my diet. Absolutely mouth-watering!", timestamp: "3h ago" }
      ]
    },
    {
      id: "reel_5",
      authorName: "Beach Wanderer",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-top-aerial-view-of-waves-crashing-on-sandy-beach-43105-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Chasing sunsets from above 🌊 drone perspectives on pink sand beaches. Perfect peace. #travel #drone #beachvibes #satisfying",
      likes: 2150,
      likedByMe: false,
      shares: 540,
      views: "1.8M",
      comments: [
        { id: "rc5_1", authorName: "David Chen", authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", content: "This is some insane drone resolution. What's the model?", timestamp: "1h ago" }
      ]
    },
    {
      id: "reel_6",
      authorName: "Zen Yoga Life",
      authorAvatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-practicing-yoga-on-the-beach-at-sunset-1902-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Sunset Vinyasa Flow 🧘‍♀️ Find your balance, breathe, and let go of all worries. #yoga #mindfulness #wellness #beachsunset",
      likes: 1320,
      likedByMe: false,
      shares: 180,
      views: "620K",
      comments: [
        { id: "rc6_1", authorName: "Emily Rodriguez", authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80", content: "So incredibly peaceful. Doing this tomorrow morning!", timestamp: "5h ago" }
      ]
    },
    {
      id: "reel_7",
      authorName: "Lofi Beats & Chill",
      authorAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-dj-hand-mixing-music-33157-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Late-night vinyl scratch and synth transitions. Vibe check! 🎧🌌 #lofi #dj #mixing #turntable #beats",
      likes: 3450,
      likedByMe: false,
      shares: 920,
      views: "2.1M",
      comments: [
        { id: "rc7_1", authorName: "Michael Chang", authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80", content: "This drop goes so hard! Keep uploading please.", timestamp: "2d ago" }
      ]
    },
    {
      id: "reel_8",
      authorName: "Retro Arcade Club",
      authorAvatar: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=100&h=100&q=80",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-retro-arcade-game-machine-42417-large.mp4",
      videoThumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&h=600&q=80",
      title: "Blinking neon glow of classical CRT cabinets. 1983 arcade aesthetic is unmatched 👾🕹️ #retro #arcade #80s #synthwave #neon",
      likes: 4560,
      likedByMe: false,
      shares: 1120,
      views: "3.7M",
      comments: [
        { id: "rc8_1", authorName: "David Chen", authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80", content: "Pure nostalgia. Takes me back to Pac-Man days!", timestamp: "4d ago" }
      ]
    }
  ]);

  // Autoplay video state
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

  // Immersive Reel Modal viewer state
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [reelCommentsOpen, setReelCommentsOpen] = useState(false);
  const [reelCommentText, setReelCommentText] = useState("");

  // Replying options states
  const [replyingToVideoComment, setReplyingToVideoComment] = useState<{ id: string; authorName: string } | null>(null);
  const [replyingToReelComment, setReplyingToReelComment] = useState<{ id: string; authorName: string } | null>(null);

  // Input elements refs for focus triggering
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const reelInputRef = useRef<HTMLInputElement | null>(null);

  const reelsContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
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

  const handleInlineCommentSubmit = (postId: string) => {
    const text = inlineComments[postId];
    if (!text || !text.trim()) return;

    addComment(postId, text, true);
    setInlineComments({ ...inlineComments, [postId]: '' });

    if (activeCommentsPost && activeCommentsPost.id === postId) {
      const updatedPost = watchPosts.find(p => p.id === postId);
      if (updatedPost) {
        const updatedWithComment = {
          ...activeCommentsPost,
          comments: [...activeCommentsPost.comments, {
            id: `temp_${Date.now()}`,
            authorName: profile.name,
            authorAvatar: profile.avatar,
            content: text,
            timestamp: "Just now"
          }]
        };
        setActiveCommentsPost(updatedWithComment);
      }
    }
  };

  const handleModalCommentSubmit = (postId: string) => {
    if (!videoCommentText || !videoCommentText.trim()) return;

    addComment(postId, videoCommentText, true);
    
    // Instantly append comment in modal view
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

  // Reels interactions
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

  // YouTube format helper maps
  const ytVideoData = watchPosts.map(post => {
    let title = post.title || post.content.split('.')[0] || "Amazing Clip";
    let duration = post.duration || "4:32";
    let views = post.views || "840K views";

    if (post.id === 'w1') {
      title = "Exploring Switzerland's Secret Glacial Waterfalls (Full 4K Tour)";
      duration = "5:18";
      views = "2.4M views";
    } else if (post.id === 'w2') {
      title = "Perfect 5-Step Chocolate Lava Cake Masterclass at Home";
      duration = "8:24";
      views = "1.1M views";
    } else if (post.id === 'w3') {
      title = "Oddly Satisfying Automated Mechanical Keyboard Assembly Line";
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
      
      {/* SECTION 1: SIDE-BY-SIDE REELS WITH SINGLE FRAME (4 VISIBLE) & REGULATION SETTINGS */}
      <div className="bg-white border-b border-gray-200 py-3.5 flex flex-col shadow-xs relative group/section" id="reels-main-section">

        {/* Reels Section Header & Video Regulation Settings Toggle */}
        <div className="px-4 pb-2.5 flex items-center justify-between border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#076653]" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Reels & Shorts</h2>
          </div>

          {/* Regulation settings for Reels & Videos: 480p vs 720p max */}
          <div className="flex items-center gap-1.5 bg-gray-100/90 p-1 rounded-lg border border-gray-200">
            <SlidersHorizontal className="w-3 h-3 text-[#076653] ml-1 shrink-0" />
            <span className="text-[10px] text-gray-500 font-semibold hidden sm:inline mr-1">Quality:</span>
            <button
              type="button"
              onClick={() => handleSetResolution('480p')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                videoResolution === '480p'
                  ? 'bg-white text-[#076653] shadow-xs border border-gray-200/80 font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="480p Standard Definition (Lower data / smaller size)"
            >
              480p SD
            </button>
            <button
              type="button"
              onClick={() => handleSetResolution('720p')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                videoResolution === '720p'
                  ? 'bg-[#076653] text-[#E3EF26] shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="720p High Definition Max (Default Bissho Barta standard)"
            >
              <span>720p Max</span>
              {videoResolution === '720p' && <Check className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>

        {/* Reels single-frame container with side click overlays */}
        <div className="relative w-full px-4 flex items-stretch">
          {/* Left Navigation Arrow */}
          <button 
            onClick={() => scrollReels('left')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 text-gray-800 border border-gray-200 shadow-md flex items-center justify-center cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity duration-200 active:scale-90 hover:bg-zinc-50"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-700" />
          </button>

          {/* Horizontally scrollable container with customized snapping */}
          <div 
            ref={reelsContainerRef}
            className="flex w-full overflow-x-auto gap-3.5 pb-2 snap-x snap-mandatory scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            id="reels-horizontal-gallery"
          >
            {reels.map((reel, index) => {
              return (
                <div
                  key={reel.id}
                  onClick={() => {
                    setActiveReelIndex(index);
                    setReelCommentsOpen(false);
                  }}
                  className="relative flex-none w-[calc(25%-10.5px)] aspect-[9/16] rounded-2xl overflow-hidden snap-start cursor-pointer group shadow-sm bg-zinc-950 border border-gray-100/10 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95"
                >
                  {/* Cover Thumbnail */}
                  <img
                    src={reel.videoThumbnail}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />

                  {/* Dark Vignette Layer */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/85 z-10" />

                  {/* Top Corner Creator Views Label */}
                  <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
                    <div className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md text-[8.5px] font-bold text-white tracking-wide border border-white/10">
                      {reel.views}
                    </div>
                  </div>

                  {/* Hover Play marker */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-black/20">
                    <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform duration-300 shadow-md">
                      <Play className="w-5 h-5 fill-current ml-0.5 text-white" />
                    </div>
                  </div>

                  {/* Full Details Overlay on Bottom */}
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
              );
            })}

          </div>

          {/* Right Navigation Arrow */}
          <button 
            onClick={() => scrollReels('right')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/95 text-gray-800 border border-gray-200 shadow-md flex items-center justify-center cursor-pointer opacity-0 group-hover/section:opacity-100 transition-opacity duration-200 active:scale-90 hover:bg-zinc-50"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 text-zinc-700" />
          </button>
        </div>
      </div>

      {/* SECTION 2: 3-COLUMN YOUTUBE STYLE VIDEOS GRID (2ND ROW ONWARDS) */}
      <div className="bg-white border-t border-gray-200 pt-3 mt-2" id="grid-videos-section">

        {/* Section 2 Header with Video Regulation Indicator */}
        <div className="px-3 sm:px-4 pb-2.5 flex items-center justify-between border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-[#076653]" />
            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Featured Videos</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-medium hidden md:inline">Playback Regulation:</span>
            <div className="bg-zinc-100 px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1 text-[10px] font-bold text-gray-800">
              <span className={`w-1.5 h-1.5 rounded-full ${videoResolution === '720p' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{videoResolution === '720p' ? '720p HD Max' : '480p SD'}</span>
            </div>
          </div>
        </div>

        {/* 3 Video Grid Row layout */}
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
              {/* 1. Thumbnail Container */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-gray-250/50 shadow-xs">
                <img
                  src={video.videoThumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Dark Vignette Layer */}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/25 transition-colors duration-200" />

                {/* Top Corner Resolution Badge */}
                <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-[#E3EF26] font-mono text-[7px] sm:text-[8px] px-1 py-0.5 rounded font-bold leading-none border border-white/10">
                  {videoResolution === '720p' ? '720p Max' : '480p'}
                </div>

                {/* Duration Badge in Corner */}
                <div className="absolute bottom-1 right-1 bg-black/85 text-white font-mono text-[8px] sm:text-[9px] px-1 py-0.5 rounded font-bold leading-none">
                  {video.duration}
                </div>

                {/* Hover Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="bg-red-600 text-white p-2 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform duration-200">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </span>
                </div>
              </div>

              {/* 2. Text Details */}
              <div className="mt-1.5 px-0.5 flex flex-col">
                <h3 className="text-[10px] sm:text-xs font-bold text-gray-950 line-clamp-2 leading-tight tracking-tight group-hover:text-red-600 transition-colors">
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

      {/* MODAL 1: HIGH-FIDELITY IMMERSIVE VIDEO THEATER & COMMENTS PLAYER */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 bg-black/85 z-55 flex items-center justify-center p-0 md:p-4 overflow-hidden select-none">
            {/* Click backdrop to exit */}
            <div className="absolute inset-0 hidden md:block" onClick={() => setSelectedVideo(null)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[950px] h-full md:h-[90vh] md:max-h-[750px] bg-white md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
              id="theatre-video-player-modal"
            >
              {/* Left Side: Immersive HTML5 video frame (16:9) */}
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

                {/* Floating Top Bar with Resolution Switcher and Mute Button */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  {/* Resolution selector in Theater Mode */}
                  <div className="flex items-center gap-1 bg-black/80 backdrop-blur-xs p-0.5 rounded-lg border border-white/20 text-[9px] font-bold text-white shadow-lg">
                    <button
                      type="button"
                      onClick={() => handleSetResolution('480p')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        videoResolution === '480p' ? 'bg-white/20 text-[#E3EF26] font-extrabold' : 'text-zinc-400 hover:text-white'
                      }`}
                      title="480p SD Quality"
                    >
                      480p
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetResolution('720p')}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        videoResolution === '720p' ? 'bg-[#076653] text-[#E3EF26] font-extrabold' : 'text-zinc-400 hover:text-white'
                      }`}
                      title="720p HD Max Quality"
                    >
                      720p Max
                    </button>
                  </div>

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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setVideoCommentText(prev => prev + "🔥")}
                      className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                      title="Fire"
                    >
                      🔥
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoCommentText(prev => prev + "👏")}
                      className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                      title="Clap"
                    >
                      👏
                    </button>
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
              </div>

              {/* Right Side: Video Meta Details, Likes, Comments list */}
              <div className="w-full md:w-[380px] bg-white shrink-0 h-full flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200">
                {/* Header detail */}
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
                      <span className="text-[10px] text-gray-400 mt-1 leading-none">{selectedVideo.views} views • {selectedVideo.timestamp}</span>
                    </div>
                  </div>

                  {/* Likes and actions */}
                  <div className="flex gap-2.5 mt-2.5 border-t border-gray-100 pt-2.5">
                    <button
                      onClick={() => {
                        likePost(selectedVideo.id, true);
                        setSelectedVideo({
                          ...selectedVideo,
                          likedByMe: !selectedVideo.likedByMe,
                          likes: selectedVideo.likedByMe ? selectedVideo.likes - 1 : selectedVideo.likes + 1
                        });
                      }}
                      className={`flex-1 flex justify-center items-center gap-1.5 py-1.5 hover:bg-gray-100 active:scale-95 rounded-full transition-all text-[10px] sm:text-xs font-bold border border-gray-100 cursor-pointer ${
                        selectedVideo.likedByMe ? 'text-[#076653] bg-[#EBF7F2] border-[#076653]/30' : 'text-gray-600'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${selectedVideo.likedByMe ? 'fill-[#076653] text-[#076653]' : ''}`} />
                      <span>{selectedVideo.likes} Likes</span>
                    </button>

                    <button
                      onClick={() => alert("Video share link copied to clipboard!")}
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
                    <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-1.5">
                      <MessageSquare className="w-6 h-6 text-gray-250" />
                      <span>Be the first to comment on this video</span>
                    </div>
                  ) : (
                    selectedVideo.comments.filter((c: any) => !c.replyToId).map((parent: any) => {
                      const replies = selectedVideo.comments.filter((c: any) => c.replyToId === parent.id);
                      return (
                        <div key={parent.id} className="flex flex-col gap-2 border-b border-gray-50 pb-2.5 last:border-0" id={`comment-thread-${parent.id}`}>
                          {/* Parent Comment */}
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
                              <div className="bg-gray-100 border border-gray-150 rounded-xl px-2.5 py-1.5">
                                <div className="flex justify-between items-center mb-0.5">
                                  <span 
                                    onClick={() => onViewProfile?.(parent.authorName, parent.authorAvatar)}
                                    className="font-bold text-[9px] text-gray-900 leading-none cursor-pointer hover:text-[#076653] hover:underline"
                                    title={`View ${parent.authorName}'s profile`}
                                  >
                                    {parent.authorName}
                                  </span>
                                  <span className="text-[7.5px] text-gray-400 font-medium leading-none">{parent.timestamp}</span>
                                </div>
                                <p className="text-[10px] text-gray-700 leading-relaxed font-normal whitespace-pre-wrap">
                                  {parent.content.includes('@') ? (
                                    parent.content.split(' ').map((word: string, i: number) => {
                                      if (word.startsWith('@')) {
                                        const cleanName = word.replace(/[@,.:!?]/g, '').trim();
                                        return (
                                          <span 
                                            key={i} 
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
                              {/* Action buttons: Reply */}
                              <div className="flex items-center gap-3 px-1 mt-1">
                                <button
                                  onClick={() => {
                                    setReplyingToVideoComment({ id: parent.id, authorName: parent.authorName });
                                    // Prepopulate input with mention
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

                          {/* Nested Replies */}
                          {replies.length > 0 && (
                            <div className="ml-7 flex flex-col gap-2 border-l border-gray-200 pl-3 pt-1">
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
                                    <div className="bg-zinc-50 border border-gray-150 rounded-xl px-2.5 py-1.5">
                                      <div className="flex justify-between items-center mb-0.5">
                                        <span 
                                          onClick={() => onViewProfile?.(reply.authorName, reply.authorAvatar)}
                                          className="font-bold text-[9px] text-gray-900 leading-none cursor-pointer hover:text-[#076653] hover:underline"
                                          title={`View ${reply.authorName}'s profile`}
                                        >
                                          {reply.authorName}
                                        </span>
                                        <span className="text-[7.5px] text-gray-400 font-medium leading-none">{reply.timestamp}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-700 leading-relaxed font-normal whitespace-pre-wrap">
                                        {reply.content.includes('@') ? (
                                          reply.content.split(' ').map((word: string, i: number) => {
                                            if (word.startsWith('@')) {
                                              const cleanName = word.replace(/[@,.:!?]/g, '').trim();
                                              return (
                                                <span 
                                                  key={i} 
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

                {/* Replying banner indicator */}
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

                {/* Comment Typing field & mentions lookup container */}
                <div className="relative">
                  {/* Mentions dropdown relative to typing wrapper */}
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

      {/* MODAL 2: INSTAGRAM/FACEBOOK STYLE HIGH-FIDELITY IMMERSIVE REELS PLAYER */}
      <AnimatePresence>
        {activeReelIndex !== null && (
          <div className="fixed inset-0 bg-black/95 z-55 flex items-center justify-center p-0 md:p-4 overflow-hidden select-none">
            
            {/* Desktop backdrop click to close */}
            <div className="absolute inset-0 hidden md:block" onClick={() => setActiveReelIndex(null)} />

            {/* Immersive Reel Player Frame Container */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[950px] h-full md:h-[90vh] md:max-h-[750px] bg-zinc-950 md:rounded-2xl shadow-2xl flex overflow-hidden border border-zinc-800/50"
            >
              {/* Left Column (or full modal in mobile): The Portrait Video Player */}
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

                {/* Vertical gradient cover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Top Overlay: Resolution Regulation Selector on Reel */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/15 text-[9px] font-bold text-white shadow-md">
                    <span className="text-zinc-400 font-medium">Reel:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetResolution(videoResolution === '720p' ? '480p' : '720p');
                      }}
                      className="text-[#E3EF26] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                      title="Toggle between 480p and 720p max"
                    >
                      {videoResolution === '720p' ? '720p HD Max' : '480p SD'}
                    </button>
                  </div>
                </div>

                {/* Reel Close Button (Mobile float) */}
                <button
                  onClick={() => setActiveReelIndex(null)}
                  className="absolute top-4 left-4 bg-black/45 hover:bg-black/60 text-white p-2 rounded-full cursor-pointer md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Floating controls on the bottom/right overlay of the video */}
                <div className="absolute right-3.5 bottom-20 flex flex-col items-center gap-4 text-white z-10">
                  {/* Like Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleLikeReel(reels[activeReelIndex].id)}
                      className={`p-2.5 rounded-full transition-transform active:scale-75 cursor-pointer shadow-md ${
                        reels[activeReelIndex].likedByMe 
                          ? 'bg-red-500 text-white' 
                          : 'bg-black/45 hover:bg-black/60 hover:scale-105 text-white'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${reels[activeReelIndex].likedByMe ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-[10px] font-bold mt-1 drop-shadow-sm">{reels[activeReelIndex].likes}</span>
                  </div>

                  {/* Comment Toggle Button */}
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

                  {/* Mute Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setMuted(!muted)}
                      className="p-2.5 rounded-full bg-black/45 hover:bg-black/60 hover:scale-105 active:scale-75 cursor-pointer shadow-md text-white"
                    >
                      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Share button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => alert("Reel link copied to your clipboard!")}
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
                    <button className="ml-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-[10px] font-bold rounded-md leading-none border border-white/25">
                      Follow
                    </button>
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReelCommentText(prev => prev + "🔥")}
                        className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                        title="Fire"
                      >
                        🔥
                      </button>
                      <button
                        type="button"
                        onClick={() => setReelCommentText(prev => prev + "❤️")}
                        className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer"
                        title="Love"
                      >
                        ❤️
                      </button>
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
                </div>

                {/* Swipe Next / Previous desktop arrow keys */}
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

              {/* Right Column / Panel (Desktop side panel OR Mobile slide-up bottom drawer) */}
              <div 
                className={`w-full md:w-[360px] shrink-0 h-full bg-white flex flex-col justify-between border-l border-zinc-200/80 transition-all duration-300 z-30 absolute md:static inset-y-0 right-0 ${
                  reelCommentsOpen 
                    ? 'translate-y-0 md:translate-y-0' 
                    : 'translate-y-full md:translate-y-0 hidden md:flex'
                }`}
              >
                {/* Panel Header */}
                <div className="bg-gray-50 border-b border-gray-150 px-4 py-3.5 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-pink-500" />
                      <span>Reel Comments</span>
                    </h3>
                    <span className="text-[9px] text-gray-400 font-bold">{reels[activeReelIndex].comments.length} replies</span>
                  </div>
                  
                  {/* Close drawer buttons */}
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

                {/* Scrolling replies area */}
                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3.5 max-h-[calc(100vh-140px)] md:max-h-none">
                  {reels[activeReelIndex].comments.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                      <MessageSquare className="w-7 h-7 text-gray-200" />
                      <span>No comments yet. Start the conversation!</span>
                    </div>
                  ) : (
                    reels[activeReelIndex].comments.filter((c: any) => !c.replyToId).map((parent: any) => {
                      const replies = reels[activeReelIndex].comments.filter((c: any) => c.replyToId === parent.id);
                      return (
                        <div key={parent.id} className="flex flex-col gap-2 border-b border-gray-100/50 pb-3 last:border-0" id={`reel-comment-thread-${parent.id}`}>
                          {/* Parent Comment */}
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
                                            key={i} 
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
                              {/* Reply Action */}
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

                          {/* Nested Replies */}
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
                                                  key={i} 
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

                {/* Replying banner indicator */}
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

                {/* Comments Submission typing overlay & mentions lookup container */}
                <div className="relative">
                  {/* Mentions dropdown relative to typing wrapper */}
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
