import { Friend, Post, UserProfile } from '../types';
import { generateRecommendedFeed } from '../services/recommendation/scoringEngine';
export { recordInteraction, getUserInterestProfile, extractPostTopics } from '../services/recommendation/userInterestProfile';
export { generateRecommendedFeed, RECOMMENDED_WEIGHTS, CONNECTIONS_WEIGHTS } from '../services/recommendation/scoringEngine';
export type { FeedMode, ExtractedFeatures, RankingWeights, ScoredPost } from '../services/recommendation/types';

export type FeedPreferenceMode = 'For you' | 'Following' | 'Recommended' | 'Connections';
export type FollowingSubFilter = 'all' | 'following' | 'followers' | 'friends' | 'pages';

export interface FollowPersonItem {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isFollowing: boolean;
}

export const DEFAULT_FOLLOWING_LIST: FollowPersonItem[] = [
  {
    id: 'fl-1',
    name: 'Nusrat Jahan',
    role: 'UX Designer • Dhaka',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: true,
  },
  {
    id: 'fl-2',
    name: 'Tanvir Ahmed',
    role: 'Full Stack Developer • Dhaka',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: true,
  },
  {
    id: 'fl-3',
    name: 'Farhana Rahman',
    role: 'Product Manager • Sylhet',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: true,
  },
  {
    id: 'fl-4',
    name: 'Mahmudul Haque',
    role: 'DevOps Engineer • Chattogram',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: true,
  },
  {
    id: 'fl-5',
    name: 'Sadia Islam',
    role: 'Data Researcher • Rajshahi',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: true,
  },
];

export const DEFAULT_FOLLOWERS_LIST: FollowPersonItem[] = [
  {
    id: 'f-1',
    name: 'Kamrul Hasan',
    role: 'Software Developer • Dhaka',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: false,
  },
  {
    id: 'f-2',
    name: 'Tasnim Akter',
    role: 'Digital Marketer • Dhaka',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: true,
  },
  {
    id: 'f-3',
    name: 'Rafiqul Islam',
    role: 'Content Creator • Khulna',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: false,
  },
  {
    id: 'f-4',
    name: 'Sumaiya Khan',
    role: 'Visual Artist • Sylhet',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
    isFollowing: true,
  },
];

export function getStoredFollowingList(): FollowPersonItem[] {
  try {
    const raw = localStorage.getItem('bissho_following_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_FOLLOWING_LIST;
}

export function setStoredFollowingList(list: FollowPersonItem[]) {
  try {
    localStorage.setItem('bissho_following_list', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('feed-preference-changed'));
  } catch {
    // ignore
  }
}

export function getStoredFollowersList(): FollowPersonItem[] {
  try {
    const raw = localStorage.getItem('bissho_followers_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_FOLLOWERS_LIST;
}

export function setStoredFollowersList(list: FollowPersonItem[]) {
  try {
    localStorage.setItem('bissho_followers_list', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('feed-preference-changed'));
  } catch {
    // ignore
  }
}

export function getStoredFeedPreference(): FeedPreferenceMode {
  const val = localStorage.getItem('home_feed_preference');
  if (val === 'Following' || val === 'Feeds') {
    return 'Following';
  }
  return 'For you';
}

export function updateFeedPreferenceState(mode: FeedPreferenceMode | 'Feeds') {
  const normalized: FeedPreferenceMode =
    mode === 'Following' || mode === 'Feeds' ? 'Following' : 'For you';
  localStorage.setItem('home_feed_preference', normalized);
  window.dispatchEvent(
    new CustomEvent('feed-preference-changed', {
      detail: normalized,
    })
  );
}

const KNOWN_PAGE_NAMES = [
  'dhaka tech & code',
  'bangladesh developers hub',
  'dhaka tech community',
  'sylhet travel club',
  'bangladesh cricket & sports',
];

export function isPostFromPage(post: Post, profile: UserProfile): boolean {
  const authorLower = post.authorName.trim().toLowerCase();
  if (profile.pages?.some((p) => p.name.trim().toLowerCase() === authorLower)) {
    return true;
  }
  if (post.authorId?.startsWith('page')) {
    return true;
  }
  return KNOWN_PAGE_NAMES.includes(authorLower);
}

export function isPostFromFriend(
  post: Post,
  friends: Friend[] = []
): boolean {
  const authorLower = post.authorName.trim().toLowerCase();
  return friends.some(
    (f) =>
      ((post.authorId && f.id === post.authorId) ||
        f.name.trim().toLowerCase() === authorLower) &&
      f.status === 'friend'
  );
}

export function isPostFromFollowing(
  post: Post,
  friends: Friend[] = []
): boolean {
  const authorLower = post.authorName.trim().toLowerCase();
  const followingList = getStoredFollowingList();
  const inFollowingList = followingList.some(
    (item) =>
      item.isFollowing && item.name.trim().toLowerCase() === authorLower
  );
  if (inFollowingList) return true;

  const followersList = getStoredFollowersList();
  const followedBack = followersList.some(
    (item) =>
      item.isFollowing && item.name.trim().toLowerCase() === authorLower
  );
  if (followedBack) return true;

  return friends.some(
    (f) =>
      ((post.authorId && f.id === post.authorId) ||
        f.name.trim().toLowerCase() === authorLower) &&
      f.status === 'pending_outgoing'
  );
}

export function isPostFromFollower(
  post: Post,
  friends: Friend[] = []
): boolean {
  const authorLower = post.authorName.trim().toLowerCase();
  const followersList = getStoredFollowersList();
  const inFollowersList = followersList.some(
    (item) => item.name.trim().toLowerCase() === authorLower
  );
  if (inFollowersList) return true;

  return friends.some(
    (f) =>
      ((post.authorId && f.id === post.authorId) ||
        f.name.trim().toLowerCase() === authorLower) &&
      f.status === 'pending_incoming'
  );
}

/**
 * Calculates how many days old a post is based on its timestamp string.
 */
export function getPostAgeInDays(timestamp: string): number {
  if (!timestamp) return 0;
  const lower = timestamp.toLowerCase().trim();
  if (
    lower.includes('just now') ||
    lower.includes('min') ||
    lower.includes('sec') ||
    lower.includes('hour')
  ) {
    return 0;
  }
  if (lower.startsWith('today')) {
    return 0;
  }
  if (lower.startsWith('yesterday')) {
    return 1;
  }
  const daysMatch = lower.match(/(\d+)\s*day/);
  if (daysMatch) {
    return parseInt(daysMatch[1], 10);
  }
  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 7;
  }
  const monthMatch = lower.match(/(\d+)\s*month/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10) * 30;
  }
  try {
    const parsed = Date.parse(timestamp.replace(' at ', ' '));
    if (!isNaN(parsed)) {
      const diffMs = Date.now() - parsed;
      return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    }
  } catch {
    // fallback
  }
  return 999;
}

/**
 * Converts post timestamp into approximate minutes ago for chronological sorting.
 * Smallest number = most recent.
 */
export function getPostRelativeMinutes(timestamp: string): number {
  if (!timestamp) return 0;
  const lower = timestamp.toLowerCase().trim();
  if (lower.includes('just now') || lower.includes('sec')) return 0;

  const minMatch = lower.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10);

  const hourMatch = lower.match(/(\d+)\s*hour/);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;

  if (lower.startsWith('today')) return 180;
  if (lower.startsWith('yesterday')) return 1440;

  const daysMatch = lower.match(/(\d+)\s*day/);
  if (daysMatch) return parseInt(daysMatch[1], 10) * 1440;

  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) return parseInt(weekMatch[1], 10) * 1440 * 7;

  try {
    const parsed = Date.parse(timestamp.replace(' at ', ' '));
    if (!isNaN(parsed)) {
      const diffMs = Date.now() - parsed;
      return Math.max(0, diffMs / (1000 * 60));
    }
  } catch {
    // fallback
  }
  return 999999;
}

/**
 * FOR YOU ALGORITHM:
 * - All trends and viral posts
 * - NO follower, friends, or followed pages (pure public discovery)
 * - Last 3 days old max (getPostAgeInDays <= 3)
 * - Shows today's trends most of the time (boosted by virality score + today recency)
 */
export function filterForYouPosts(
  posts: Post[],
  profile: UserProfile,
  friends: Friend[] = []
): Post[] {
  const scored = generateRecommendedFeed(posts, 'Recommended', profile, friends);
  return scored.map((s) => s.post);
}

/**
 * FOLLOWING ALGORITHM:
 * - Content shows on feed ONLY from followed pages, friends, and followed accounts (+ own posts)
 * - Whether it's viral or trending or not
 * - Strictly serialized in chronological order via latest post
 */
export function filterFollowingPosts(
  posts: Post[],
  profile: UserProfile,
  friends: Friend[] = []
): Post[] {
  const scored = generateRecommendedFeed(posts, 'Connections', profile, friends);
  return scored.map((s) => s.post);
}
