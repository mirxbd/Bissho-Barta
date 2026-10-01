import { Post, Story, Friend, Conversation, Notification, UserProfile } from '../types';

export const defaultUserProfile: UserProfile = {
  name: "Alex Rivera",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
  coverPhoto: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=300&q=80",
  bio: "Simplicity is the ultimate sophistication. Building fast web applications. 💻✨",
  location: "San Francisco, CA",
  work: "Software Engineer at TechCorp",
  education: "Stanford University",
  relationship: "In a relationship",
  followingCount: 184,
  followersCount: 1250,
  pages: [
    {
      id: "page-1",
      name: "Tech Trends & Code",
      category: "Science & Technology",
      avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
      followersCount: 3420,
      createdAt: "2024",
      bio: "Official page for latest Tech Trends, web dev tips, and AI code breakdowns."
    }
  ]
};

export const initialFriends: Friend[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 12,
    status: "friend",
    isOnline: true
  },
  {
    id: "2",
    name: "David Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 5,
    status: "friend",
    isOnline: true
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 8,
    status: "pending_incoming",
    isOnline: false
  },
  {
    id: "4",
    name: "Michael Chang",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 15,
    status: "pending_incoming",
    isOnline: true
  },
  {
    id: "5",
    name: "Jessica Taylor",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 3,
    status: "none",
    isOnline: false
  },
  {
    id: "6",
    name: "Marcus Aurelius",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 1,
    status: "none",
    isOnline: false
  }
];

export const initialStories: Story[] = [
  {
    id: "s1",
    userName: "Sarah Jenkins",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    storyImage: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=300&h=500&q=80",
    isUnread: true
  },
  {
    id: "s2",
    userName: "David Chen",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    storyImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&h=500&q=80",
    isUnread: true
  },
  {
    id: "s3",
    userName: "Michael Chang",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    storyImage: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&h=500&q=80",
    isUnread: false
  }
];

export const initialPosts: Post[] = [
  {
    id: "p1",
    authorName: "Sarah Jenkins",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "2 hours ago",
    content: "Hiking through the beautiful redwoods today! Nature always has a way of resetting your perspective. 🌲✨ If anyone is looking for trail recommendations around the Bay Area, let me know!",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 42,
    likedByMe: false,
    shares: 3,
    comments: [
      {
        id: "c1",
        authorName: "David Chen",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "This looks absolutely breathtaking, Sarah! Which trail is this?",
        timestamp: "1 hour ago"
      },
      {
        id: "c2",
        authorName: "Sarah Jenkins",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "@David Chen It's the Redwood Creek Trail in Muir Woods. Go early to avoid the crowds!",
        timestamp: "45 mins ago"
      }
    ]
  },
  {
    id: "p2",
    authorName: "David Chen",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "4 hours ago",
    content: "Just launched my first small indie game project! It's a retro-style pixel puzzle solver. Would love some feedback from everyone. Check it out! 🎮👾",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 88,
    likedByMe: true,
    shares: 14,
    comments: [
      {
        id: "c3",
        authorName: "Sarah Jenkins",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "OMG! Congratulations David! The graphics look amazing, playing it right now!",
        timestamp: "3 hours ago"
      }
    ]
  },
  {
    id: "p3",
    authorName: "Tech News Daily",
    authorAvatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Yesterday at 3:15 PM",
    content: "Breaking: Researchers introduce new, high-efficiency lightweight models that can run locally on mobile devices without needing internet connectivity. A massive win for lightweight applications and remote accessibility! 📱🚀 #TechNews #MobileDev #AI",
    likes: 245,
    likedByMe: false,
    shares: 45,
    comments: [
      {
        id: "c4",
        authorName: "Marcus Aurelius",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
        content: "This is the way forward. Local execution preserves user privacy and respects resource limits.",
        timestamp: "Yesterday at 4:30 PM"
      }
    ]
  },
  {
    id: "p4",
    authorName: "Food Explorers",
    authorAvatar: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "July 18 at 11:24 AM",
    content: "Who is up for some authentic wood-fired artisanal pizza? Look at this perfect crust and bubbling fresh mozzarella! 🍕🤤 Tag a friend you'd share this with!",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 512,
    likedByMe: false,
    shares: 120,
    comments: [
      {
        id: "c5",
        authorName: "Jessica Taylor",
        authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
        content: "That cheese pull is unreal! Where is this place located?",
        timestamp: "July 18 at 12:10 PM"
      }
    ]
  },
  {
    id: "p5",
    authorName: "Tech Trends & Code",
    authorAvatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "30 mins ago",
    content: "🚀 5 Quick Tips to optimize your React application rendering speed in 2026! 1. Split heavy components, 2. Keep state localized, 3. Use CSS-based layout shifts, 4. Debounce scroll listeners, 5. Cache API queries. What is your go-to optimization habit?",
    likes: 96,
    likedByMe: true,
    shares: 18,
    comments: [
      {
        id: "c6",
        authorName: "David Chen",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Memoizing heavy calculations made a huge difference on our low-end device tests!",
        timestamp: "15 mins ago"
      },
      {
        id: "c7",
        authorName: "Sarah Jenkins",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Awesome tips! Saving this to read later.",
        timestamp: "5 mins ago"
      }
    ]
  },
  {
    id: "p6",
    authorName: "Global Tech Discussions",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "6 hours ago",
    content: "💬 Question of the day: Do you prefer working fully remote, hybrid, or on-site in 2026? Over 1,200 developers have chimed in with their thoughts on productivity vs. team bonding.",
    likes: 380,
    likedByMe: false,
    shares: 64,
    comments: [
      {
        id: "c8",
        authorName: "Michael Chang",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Hybrid 2 days in office gives the perfect balance for me.",
        timestamp: "5 hours ago"
      },
      {
        id: "c9",
        authorName: "Sarah Jenkins",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Fully remote lets me hike after morning standups!",
        timestamp: "4 hours ago"
      },
      {
        id: "c10",
        authorName: "David Chen",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Same here, asynchronous communication is king.",
        timestamp: "2 hours ago"
      }
    ]
  }
];

export const initialConversations: Conversation[] = [
  {
    id: "c_1",
    friend: initialFriends[0], // Sarah Jenkins
    unread: true,
    messages: [
      { id: "m1", senderId: "1", text: "Hey! Are we still on for lunch tomorrow?", timestamp: "12:30 PM" },
      { id: "m2", senderId: "me", text: "Yes, definitely! Same place as last time?", timestamp: "12:32 PM" },
      { id: "m3", senderId: "1", text: "Perfect! Let's do 1:00 PM. See you there!", timestamp: "12:35 PM" }
    ]
  },
  {
    id: "c_2",
    friend: initialFriends[1], // David Chen
    unread: false,
    messages: [
      { id: "m4", senderId: "me", text: "Hey David, the new game looks super crisp!", timestamp: "Yesterday" },
      { id: "m5", senderId: "2", text: "Thanks Alex! Really appreciate you testing it out. Let me know if you run into any bugs!", timestamp: "Yesterday" }
    ]
  },
  {
    id: "c_3",
    friend: initialFriends[3], // Michael Chang (pending friend, but lets pretend we chatted or let's make it a normal friend chat)
    unread: false,
    messages: [
      { id: "m6", senderId: "4", text: "Hi Alex! Saw your profile in the tech developers group. Nice to connect!", timestamp: "2 days ago" },
      { id: "m7", senderId: "me", text: "Hey Michael, nice to connect with you too! What are you working on currently?", timestamp: "2 days ago" }
    ]
  }
];

export const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "friend_request",
    actorName: "Emily Rodriguez",
    actorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "10 mins ago",
    read: false,
    summaryText: "sent you a friend request."
  },
  {
    id: "n2",
    type: "like",
    actorName: "David Chen",
    actorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    targetId: "p2",
    timestamp: "1 hour ago",
    read: false,
    summaryText: "liked your post."
  },
  {
    id: "n3",
    type: "comment",
    actorName: "Sarah Jenkins",
    actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    targetId: "p2",
    timestamp: "3 hours ago",
    read: true,
    summaryText: "commented on your post: 'OMG! Congratulations David! The graphics...'"
  },
  {
    id: "n4",
    type: "friend_accept",
    actorName: "Michael Chang",
    actorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Yesterday",
    read: true,
    summaryText: "accepted your friend request."
  }
];

export const watchPosts: Post[] = [
  {
    id: "w1",
    authorName: "Amazing Destinations",
    authorAvatar: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Sponsored",
    content: "Take a deep breath and escape to the gorgeous waterfalls of Switzerland. Nature at its absolute finest! 🏔️🌊 Would you travel here?",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1250,
    likedByMe: false,
    shares: 340,
    title: "Exploring Switzerland's Secret Glacial Waterfalls (Full 4K Tour)",
    duration: "5:18",
    views: "2.4M views",
    comments: [
      {
        id: "wc1",
        authorName: "Sarah Jenkins",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Adding this to the absolute top of my bucket list! Absolutely stunning.",
        timestamp: "2 hours ago"
      }
    ]
  },
  {
    id: "w2",
    authorName: "Chef's Kitchen",
    authorAvatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "3 hours ago",
    content: "Learn how to make the perfect chocolate lava cake at home in just 5 simple steps! Trust us, it's easier than you think. 🍫🧁✨",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-melted-chocolate-on-a-croissant-34444-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 850,
    likedByMe: false,
    shares: 215,
    title: "Perfect 5-Step Chocolate Lava Cake Masterclass at Home",
    duration: "8:24",
    views: "1.1M views",
    comments: []
  },
  {
    id: "w3",
    authorName: "Tech Insider",
    authorAvatar: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Yesterday",
    content: "Check out this incredibly satisfying automated keyboard assembly line! The precision of modern robotics is truly mindblowing. 🤖⌨️",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-40546-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 2310,
    likedByMe: true,
    shares: 490,
    title: "Oddly Satisfying Automated Mechanical Keyboard Assembly Line",
    duration: "12:15",
    views: "4.5M views",
    comments: [
      {
        id: "wc2",
        authorName: "David Chen",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "As a programmer, I find this extremely satisfying to watch.",
        timestamp: "Yesterday"
      }
    ]
  },
  {
    id: "w4",
    authorName: "Beatwave Records",
    authorAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "4 hours ago",
    content: "Vibe with us through this chill sunset session featuring pure lo-fi beats, warm vinyl crackles, and expert ambient mixing. Perfect for studying or relaxing! 🎧🌅",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-dj-hand-mixing-music-33157-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1950,
    likedByMe: false,
    shares: 310,
    title: "Lo-Fi Beats & DJ Scratching: Live Sunset Session",
    duration: "15:40",
    views: "820K views",
    comments: []
  },
  {
    id: "w5",
    authorName: "Earth Drone Travel",
    authorAvatar: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "2 days ago",
    content: "Stunning cinematic drone footage capturing the absolute raw power and beauty of massive turquoise ocean swells breaking onto isolated beaches. 🌊🚁",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-top-aerial-view-of-waves-crashing-on-sandy-beach-43105-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 4100,
    likedByMe: false,
    shares: 830,
    title: "4K Aerial Coastline: Ocean Waves Crashing on Pink Sands",
    duration: "6:12",
    views: "3.1M views",
    comments: []
  },
  {
    id: "w6",
    authorName: "Serenity Yoga",
    authorAvatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "3 days ago",
    content: "Align your mind and body with this beginner-friendly sunset vinyasa flow. Breathe in the salty ocean air and release all daily tension and stress. 🧘‍♀️🌅",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-practicing-yoga-on-the-beach-at-sunset-1902-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1120,
    likedByMe: false,
    shares: 195,
    title: "15-Min Sunset Beach Yoga & Deep Breathing Flow",
    duration: "15:00",
    views: "510K views",
    comments: []
  },
  {
    id: "w7",
    authorName: "Wok Star",
    authorAvatar: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "4 days ago",
    content: "Learn the secret behind the perfect wok-toss! Super high-heat searing, fresh ginger, spring onions, and dry Szechuan peppercorns for that ultimate flavor. 🔥🥢",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-frying-diced-chicken-with-vegetables-in-a-wok-34455-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1640,
    likedByMe: false,
    shares: 350,
    title: "Sizzling Szechuan Chilli Chicken Wok Masterclass",
    duration: "9:45",
    views: "720K views",
    comments: []
  },
  {
    id: "w8",
    authorName: "Artisanal Baker",
    authorAvatar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "5 days ago",
    content: "No commercial yeast, no shortcuts. Just organic flour, active wild starter, water, salt, and hours of dedicated love. See the satisfying dough kneading process! 🍞🌾",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-chef-kneading-dough-on-a-floured-surface-34436-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 2890,
    likedByMe: false,
    shares: 570,
    title: "Traditional Sourdough Bread from Scratch: Flour, Water, Salt",
    duration: "11:20",
    views: "1.4M views",
    comments: []
  },
  {
    id: "w9",
    authorName: "Resto Tech",
    authorAvatar: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "1 week ago",
    content: "Restoring an authentic 1983 coin-op CRT arcade cabinet. Fixing the power supplies, wiring up the joystick microswitches, and polishing the bright neon header lighting! 👾🕹️",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-retro-arcade-game-machine-42417-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 3450,
    likedByMe: false,
    shares: 610,
    title: "Retro Neon Arcade Machine restoration project",
    duration: "18:05",
    views: "920K views",
    comments: []
  }
];
