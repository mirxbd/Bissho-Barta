export interface Comment {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  replyToId?: string;
  replyToName?: string;
}

export interface Attachment {
  name: string;
  size: string;
  type: string; // 'image' | 'video' | 'file'
  url: string;
  mediaId?: string;
  resolutionLabel?: string;
  dimensions?: { width: number; height: number };
  aspectRatio?: string;
}

export interface SharedPostEmbed {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  videoUrl?: string;
  timestamp: string;
}

export interface Post {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  image?: string;
  imageMediaId?: string;
  likes: number;
  likedByMe: boolean;
  likeCount?: number;
  isLiked?: boolean;
  shares: number;
  shareCount?: number;
  repostCount?: number;
  isReposted?: boolean;
  saveCount?: number;
  isSaved?: boolean;
  originalPostId?: string;
  repostedBy?: {
    userId?: string;
    name: string;
    avatar: string;
    timestamp: string;
  };
  quoteContent?: string;
  isQuoteRepost?: boolean;
  comments: Comment[];
  commentCount?: number;
  isPinned?: boolean;
  videoUrl?: string; // For watch tab posts
  videoMediaId?: string;
  videoThumbnail?: string;
  title?: string;
  duration?: string;
  views?: string;
  attachment?: Attachment;
  attachments?: Attachment[];
  postType?: 'Public' | 'Subscriber' | 'Private';
  taggedPeople?: string[];
  scheduledFor?: string;
  isScheduled?: boolean;
  sharedFromPostId?: string;
  sharedPost?: SharedPostEmbed;
}

export interface Story {
  id: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  storyImage: string;
  storyMediaId?: string;
  isUnread: boolean;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
  status: 'friend' | 'pending_incoming' | 'pending_outgoing' | 'none';
  isOnline?: boolean;
}

export interface Message {
  id: string;
  senderId: string; // 'me' or friend's id
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  friend: Friend;
  unread: boolean;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'friend_request' | 'friend_accept' | 'post';
  actorId?: string;
  actorName: string;
  actorAvatar: string;
  targetId?: string; // e.g. post ID
  timestamp: string;
  read: boolean;
  summaryText: string;
}

export interface PageItem {
  id: string;
  name: string;
  category: string;
  avatar?: string;
  followersCount: number;
  createdAt: string;
  bio?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  location: string;
  work: string;
  education: string;
  relationship: string;
  followingCount?: number;
  followersCount?: number;
  pages?: PageItem[];
}

export interface PublicUserProfile {
  id?: string;
  name: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  location: string;
  work: string;
  education: string;
  relationship: string;
  mutualFriends?: number;
  friendsCount?: number;
  followersCount?: number;
  followingCount?: number;
  joinedDate?: string;
  isOnline?: boolean;
  status?: 'friend' | 'pending_incoming' | 'pending_outgoing' | 'none';
  photos?: string[];
  verified?: boolean;
  badge?: string;
  email?: string;
  website?: string;
}

export type SearchSource = 'fb' | 'web';

export interface WebSearchSourceItem {
  title: string;
  uri: string;
  snippet?: string;
}

export interface WebSearchResult {
  query: string;
  summary: string;
  sources: WebSearchSourceItem[];
  searchQueries?: string[];
  grounded?: boolean;
}
