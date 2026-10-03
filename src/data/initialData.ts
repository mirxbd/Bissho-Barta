import { Post, Story, Friend, Conversation, Notification, UserProfile } from '../types';

export const defaultUserProfile: UserProfile = {
  id: "user_me",
  name: "Arif Rahman",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
  coverPhoto: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=300&q=80",
  bio: "Building fast web applications and sharing local updates.",
  location: "Dhaka, Bangladesh",
  work: "Software Engineer at Dhaka Tech Lab",
  education: "University of Dhaka",
  relationship: "Single",
  followingCount: 184,
  followersCount: 1250,
  pages: [
    {
      id: "page-1",
      name: "Dhaka Tech & Code",
      category: "Science & Technology",
      avatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
      followersCount: 3420,
      createdAt: "2024",
      bio: "Official page for Bangladesh tech news, web dev tips, and software engineering."
    }
  ]
};

export const initialFriends: Friend[] = [
  {
    id: "1",
    name: "Nusrat Jahan",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 12,
    status: "friend",
    isOnline: true
  },
  {
    id: "2",
    name: "Kamrul Hasan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 5,
    status: "friend",
    isOnline: true
  },
  {
    id: "3",
    name: "Sadia Islam",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 8,
    status: "pending_incoming",
    isOnline: false
  },
  {
    id: "4",
    name: "Mahmudul Haque",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 15,
    status: "pending_incoming",
    isOnline: true
  },
  {
    id: "5",
    name: "Farhana Yasmin",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 3,
    status: "none",
    isOnline: false
  },
  {
    id: "6",
    name: "Rafiqul Islam",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    mutualFriends: 1,
    status: "none",
    isOnline: false
  }
];

export const initialStories: Story[] = [
  {
    id: "s1",
    userId: "1",
    userName: "Nusrat Jahan",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    storyImage: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=300&h=500&q=80",
    isUnread: true
  },
  {
    id: "s2",
    userId: "2",
    userName: "Kamrul Hasan",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    storyImage: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&h=500&q=80",
    isUnread: true
  },
  {
    id: "s3",
    userId: "4",
    userName: "Mahmudul Haque",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    storyImage: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=300&h=500&q=80",
    isUnread: false
  }
];

export const initialPosts: Post[] = [
  {
    id: "p1",
    authorId: "1",
    authorName: "Nusrat Jahan",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "2 hours ago",
    content: "Morning walk through the green tea gardens in Sylhet today! Nature always has a way of resetting your perspective. If anyone is looking for travel recommendations around Sylhet, let me know!",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 42,
    likedByMe: false,
    shares: 3,
    postType: "Public",
    comments: [
      {
        id: "c1",
        authorId: "2",
        authorName: "Kamrul Hasan",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "This looks peaceful, Nusrat! Which estate is this?",
        timestamp: "1 hour ago"
      },
      {
        id: "c2",
        authorId: "1",
        authorName: "Nusrat Jahan",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "@Kamrul Hasan It's near Sreemangal. Go early in the morning for the mist!",
        timestamp: "45 mins ago"
      }
    ]
  },
  {
    id: "p2",
    authorId: "2",
    authorName: "Kamrul Hasan",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "4 hours ago",
    content: "Just launched my first indie puzzle project! It's a retro-style pixel puzzle solver built over the weekend in Dhaka. Would love some feedback from everyone.",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 88,
    likedByMe: true,
    shares: 14,
    postType: "Public",
    comments: [
      {
        id: "c3",
        authorId: "1",
        authorName: "Nusrat Jahan",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Congratulations Kamrul! The design looks great, trying it right now.",
        timestamp: "3 hours ago"
      }
    ]
  },
  {
    id: "p3",
    authorName: "Tech News Daily",
    authorAvatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Today at 1:30 PM",
    content: "Researchers introduce new high-efficiency lightweight models that run locally on mobile devices with low bandwidth. A great step forward for lightweight applications and regional accessibility! #TechNews #MobileDev",
    likes: 645,
    likedByMe: false,
    shares: 145,
    comments: [
      {
        id: "c4",
        authorName: "Rafiqul Islam",
        authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
        content: "This is the way forward. Local execution preserves user privacy and respects resource limits.",
        timestamp: "2 hours ago"
      }
    ]
  },
  {
    id: "p4",
    authorName: "Food Explorers BD",
    authorAvatar: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Today at 11:20 AM",
    content: "Evening snacks and wood-fired flatbread fresh from the oven in Dhanmondi! Tag a friend you'd share this with. #DhakaFood #StreetBites",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 980,
    likedByMe: false,
    shares: 260,
    comments: [
      {
        id: "c5",
        authorName: "Farhana Yasmin",
        authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Looks delicious! Which road in Dhanmondi is this place located?",
        timestamp: "3 hours ago"
      }
    ]
  },
  {
    id: "p7",
    authorName: "Dhaka Traffic & Metro Live",
    authorAvatar: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "1 hour ago",
    content: "Viral update: Dhaka Metro Rail experimental evening schedule starts this weekend! Commute times drop by 60% across major commercial hubs. #DhakaMetro #Bangladesh #Trending",
    image: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1420,
    likedByMe: false,
    shares: 380,
    comments: [
      {
        id: "c11",
        authorName: "Tahmid Chowdhury",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Huge relief for everyday office commuters in Motijheel and Mirpur!",
        timestamp: "45 mins ago"
      }
    ]
  },
  {
    id: "p8",
    authorName: "World Tech Radar",
    authorAvatar: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Yesterday at 3:00 PM",
    content: "Open-source developer toolkits reach 50,000 active community contributors this month. A global milestone for decentralized software innovation. #OpenSource #DevCommunity",
    likes: 430,
    likedByMe: false,
    shares: 90,
    comments: []
  },
  {
    id: "p5",
    authorName: "Dhaka Tech & Code",
    authorAvatar: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "30 mins ago",
    content: "5 Quick Tips to optimize your React application rendering speed: 1. Split heavy components, 2. Keep state localized, 3. Avoid layout shifts, 4. Debounce scroll listeners, 5. Cache API queries. What is your go-to optimization habit?",
    likes: 96,
    likedByMe: true,
    shares: 18,
    comments: [
      {
        id: "c6",
        authorName: "Kamrul Hasan",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Memoizing heavy calculations made a huge difference on our low-end device tests!",
        timestamp: "15 mins ago"
      },
      {
        id: "c7",
        authorName: "Nusrat Jahan",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Helpful tips! Saving this to read later.",
        timestamp: "5 mins ago"
      }
    ]
  },
  {
    id: "p6",
    authorName: "Bangladesh Developers Hub",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "6 hours ago",
    content: "Question of the day: Do you prefer working remotely, hybrid, or on-site in Dhaka? Developers across the community have shared their thoughts on productivity vs. team collaboration.",
    likes: 380,
    likedByMe: false,
    shares: 64,
    comments: [
      {
        id: "c8",
        authorName: "Mahmudul Haque",
        authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Hybrid 2 days in office saves so much Dhaka traffic time!",
        timestamp: "5 hours ago"
      },
      {
        id: "c9",
        authorName: "Nusrat Jahan",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Remote lets me focus without the daily commute.",
        timestamp: "4 hours ago"
      },
      {
        id: "c10",
        authorName: "Kamrul Hasan",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Same here, asynchronous communication works great.",
        timestamp: "2 hours ago"
      }
    ]
  }
];

export const initialConversations: Conversation[] = [
  {
    id: "c_1",
    friend: initialFriends[0], // Nusrat Jahan
    unread: true,
    messages: [
      { id: "m1", senderId: "1", text: "Hey! Are we still meeting for lunch tomorrow?", timestamp: "12:30 PM" },
      { id: "m2", senderId: "me", text: "Yes, definitely! Same place in Banani?", timestamp: "12:32 PM" },
      { id: "m3", senderId: "1", text: "Perfect! Let's do 1:00 PM. See you there!", timestamp: "12:35 PM" }
    ]
  },
  {
    id: "c_2",
    friend: initialFriends[1], // Kamrul Hasan
    unread: false,
    messages: [
      { id: "m4", senderId: "me", text: "Hey Kamrul, the new project looks super crisp!", timestamp: "Yesterday" },
      { id: "m5", senderId: "2", text: "Thanks Arif! Really appreciate you testing it out. Let me know if you run into any bugs!", timestamp: "Yesterday" }
    ]
  },
  {
    id: "c_3",
    friend: initialFriends[3], // Mahmudul Haque
    unread: false,
    messages: [
      { id: "m6", senderId: "4", text: "Hi Arif! Saw your profile in the Dhaka developers group. Nice to connect!", timestamp: "2 days ago" },
      { id: "m7", senderId: "me", text: "Hey Mahmudul, nice to connect with you too! What are you working on currently?", timestamp: "2 days ago" }
    ]
  }
];

export const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "friend_request",
    actorId: "3",
    actorName: "Sadia Islam",
    actorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "10 mins ago",
    read: false,
    summaryText: "sent you a friend request."
  },
  {
    id: "n2",
    type: "like",
    actorId: "2",
    actorName: "Kamrul Hasan",
    actorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
    targetId: "p2",
    timestamp: "1 hour ago",
    read: false,
    summaryText: "liked your post."
  },
  {
    id: "n3",
    type: "comment",
    actorId: "1",
    actorName: "Nusrat Jahan",
    actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
    targetId: "p2",
    timestamp: "3 hours ago",
    read: true,
    summaryText: "commented on your post: 'Congratulations Kamrul! The design looks great...'"
  },
  {
    id: "n4",
    type: "friend_accept",
    actorId: "4",
    actorName: "Mahmudul Haque",
    actorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Yesterday",
    read: true,
    summaryText: "accepted your friend request."
  }
];

export const watchPosts: Post[] = [
  {
    id: "w1",
    authorName: "Beautiful Bangladesh",
    authorAvatar: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "2 hours ago",
    content: "Take a deep breath and explore the lush green hills and waterfalls of Bandarban and Sylhet.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-waterfall-in-forest-2213-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1250,
    likedByMe: false,
    shares: 340,
    title: "Exploring Lush Waterfalls and Green Hills of Bangladesh",
    duration: "5:18",
    views: "2.4M views",
    comments: [
      {
        id: "wc1",
        authorName: "Nusrat Jahan",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
        content: "Adding this to the top of my travel list! Stunning view.",
        timestamp: "2 hours ago"
      }
    ]
  },
  {
    id: "w2",
    authorName: "Dhaka Kitchen",
    authorAvatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "3 hours ago",
    content: "Learn how to make the perfect chocolate lava cake at home in 5 simple steps!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-pouring-melted-chocolate-on-a-croissant-34444-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 850,
    likedByMe: false,
    shares: 215,
    title: "5-Step Chocolate Lava Cake Recipe at Home",
    duration: "8:24",
    views: "1.1M views",
    comments: []
  },
  {
    id: "w3",
    authorName: "Tech Insider BD",
    authorAvatar: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "Yesterday",
    content: "Check out this automated keyboard assembly line! The precision of modern hardware engineering is impressive.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-programmer-typing-on-a-keyboard-40546-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 2310,
    likedByMe: true,
    shares: 490,
    title: "Mechanical Keyboard Setup & Coding Workflow",
    duration: "12:15",
    views: "4.5M views",
    comments: [
      {
        id: "wc2",
        authorName: "Kamrul Hasan",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
        content: "As a programmer, I find this very satisfying to watch.",
        timestamp: "Yesterday"
      }
    ]
  },
  {
    id: "w4",
    authorName: "Beatwave Studio",
    authorAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "4 hours ago",
    content: "Chill sunset session featuring lo-fi beats and ambient mixing. Great for studying or coding.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-a-dj-hand-mixing-music-33157-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1950,
    likedByMe: false,
    shares: 310,
    title: "Lo-Fi Beats: Live Sunset Studio Session",
    duration: "15:40",
    views: "820K views",
    comments: []
  },
  {
    id: "w5",
    authorName: "Bay of Bengal Travel",
    authorAvatar: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "2 days ago",
    content: "Aerial drone footage capturing ocean waves along Cox's Bazar and Saint Martin's Island.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-top-aerial-view-of-waves-crashing-on-sandy-beach-43105-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 4100,
    likedByMe: false,
    shares: 830,
    title: "Aerial Coastline: Ocean Waves at Cox's Bazar",
    duration: "6:12",
    views: "3.1M views",
    comments: []
  },
  {
    id: "w6",
    authorName: "Daily Wellness",
    authorAvatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "3 days ago",
    content: "Beginner-friendly sunset stretching and breathing routine to unwind after a busy workday.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-practicing-yoga-on-the-beach-at-sunset-1902-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1120,
    likedByMe: false,
    shares: 195,
    title: "15-Min Sunset Stretching & Deep Breathing Flow",
    duration: "15:00",
    views: "510K views",
    comments: []
  },
  {
    id: "w7",
    authorName: "Spice & Wok BD",
    authorAvatar: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "4 days ago",
    content: "High-heat stir fry with fresh ginger, spring onions, and spices for a quick homemade dinner.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-frying-diced-chicken-with-vegetables-in-a-wok-34455-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 1640,
    likedByMe: false,
    shares: 350,
    title: "Sizzling Chilli Chicken Stir-Fry Recipe",
    duration: "9:45",
    views: "720K views",
    comments: []
  },
  {
    id: "w8",
    authorName: "Home Bakery BD",
    authorAvatar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "5 days ago",
    content: "Freshly baked artisan bread from scratch using flour, water, and salt.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-chef-kneading-dough-on-a-floured-surface-34436-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 2890,
    likedByMe: false,
    shares: 570,
    title: "Traditional Artisan Bread from Scratch",
    duration: "11:20",
    views: "1.4M views",
    comments: []
  },
  {
    id: "w9",
    authorName: "Retro Hardware",
    authorAvatar: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=150&h=150&q=80",
    timestamp: "1 week ago",
    content: "Restoring a classic 1980s CRT arcade cabinet and fixing the power supply and microswitches.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-neon-light-from-a-retro-arcade-game-machine-42417-large.mp4",
    videoThumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&h=500&q=80",
    likes: 3450,
    likedByMe: false,
    shares: 610,
    title: "Classic Arcade Machine Restoration Project",
    duration: "18:05",
    views: "920K views",
    comments: []
  }
];
