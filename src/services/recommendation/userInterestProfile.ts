import { ContentFormat, InteractionEvent, InteractionType, UserInterestProfile } from './types';
import { Post } from '../../types';

const STORAGE_KEY = 'bissho_user_interest_profile';

// Configurable interaction weights for machine learning optimization
export const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  like: 3.0,
  unlike: -2.0,
  comment: 5.5,
  share: 7.5,
  save: 6.0,
  unsave: -3.0,
  follow: 10.0,
  unfollow: -12.0,
  profile_visit: 2.5,
  dwell_time: 2.0, // base for meaningful dwell (> 8 seconds)
  video_completion: 5.0, // watched >= 80%
  video_replay: 4.0,
  skip: -1.5,
  hide: -5.0,
  not_interested: -8.5,
  mute: -15.0,
  report: -30.0,
};

const DEFAULT_PROFILE: UserInterestProfile = {
  userId: 'user_me',
  topicAffinities: {
    technology: 25,
    dhaka: 20,
    travel: 18,
    science: 15,
    food: 14,
    sports: 12,
    general: 10,
  },
  creatorAffinities: {},
  negativeTopics: {},
  negativeCreators: {},
  formatPreferences: {
    text: 1.0,
    image: 1.15,
    video: 1.1,
    mixed: 1.05,
  },
  totalInteractions: 0,
  lastActive: Date.now(),
  explorationTolerance: 0.25, // 25% exploration balance
};

/**
 * Extracts semantic topic tags from post content.
 */
export function extractPostTopics(post: Post): string[] {
  const content = (post.content || '').toLowerCase();
  const topics = new Set<string>();

  const topicKeywords: Record<string, string[]> = {
    technology: ['tech', 'react', 'code', 'software', 'developer', 'model', 'mobile', 'frontend', 'app', 'web', 'ai'],
    dhaka: ['dhaka', 'motijheel', 'dhanmondi', 'uttara', 'mirpur', 'banani', 'gulshan', 'metro'],
    travel: ['sylhet', 'tea', 'travel', 'garden', 'nature', 'tour', 'sreemangal', 'trip', 'visit'],
    food: ['food', 'snack', 'flatbread', 'oven', 'bites', 'restaurant', 'coffee', 'meal', 'delicious'],
    sports: ['cricket', 'match', 'sports', 'stadium', 'tournament', 'game'],
    news: ['news', 'announced', 'researchers', 'update', 'breaking', 'viral', 'headline'],
    science: ['science', 'efficiency', 'research', 'engineers', 'innovation', 'physics', 'tech'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => content.includes(kw))) {
      topics.add(topic);
    }
  }

  if (topics.size === 0) {
    topics.add('general');
  }

  return Array.from(topics);
}

/**
 * Determines content format of a post.
 */
export function getPostContentFormat(post: Post): ContentFormat {
  if (post.attachments && post.attachments.length > 0) {
    const hasVideo = post.attachments.some((a) => a.type === 'video');
    const hasImage = post.attachments.some((a) => a.type === 'image');
    if (hasVideo && hasImage) return 'mixed';
    if (hasVideo) return 'video';
    if (hasImage) return 'image';
  }
  if (post.image) return 'image';
  return 'text';
}

/**
 * Loads current user interest profile from persistent storage.
 */
export function getUserInterestProfile(): UserInterestProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        topicAffinities: { ...DEFAULT_PROFILE.topicAffinities, ...(parsed.topicAffinities || {}) },
        formatPreferences: { ...DEFAULT_PROFILE.formatPreferences, ...(parsed.formatPreferences || {}) },
      };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_PROFILE };
}

/**
 * Persists updated user interest profile and dispatches change event.
 */
export function saveUserInterestProfile(profile: UserInterestProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('user-interest-profile-updated', { detail: profile }));
  } catch {
    // storage error handling
  }
}

/**
 * Updates user interest profile dynamically based on user interaction events.
 * Implements continuous learning loop.
 */
export function recordInteraction(event: Omit<InteractionEvent, 'id' | 'timestamp'>): UserInterestProfile {
  const profile = getUserInterestProfile();
  const weight = INTERACTION_WEIGHTS[event.type] || 1.0;
  const isNegative = weight < 0;
  const topics = event.topics || [];
  const creatorKey = (event.creatorName || event.creatorId || '').trim().toLowerCase();

  // Apply to topics
  topics.forEach((topic) => {
    const normalizedTopic = topic.toLowerCase();
    if (!isNegative) {
      const current = profile.topicAffinities[normalizedTopic] || 10;
      profile.topicAffinities[normalizedTopic] = Math.min(100, Math.max(0, current + weight));
      // Dampen negative if present
      if (profile.negativeTopics[normalizedTopic]) {
        profile.negativeTopics[normalizedTopic] = Math.max(0, profile.negativeTopics[normalizedTopic] - weight);
      }
    } else {
      const current = profile.topicAffinities[normalizedTopic] || 10;
      profile.topicAffinities[normalizedTopic] = Math.max(0, current + weight);
      profile.negativeTopics[normalizedTopic] = Math.min(100, (profile.negativeTopics[normalizedTopic] || 0) + Math.abs(weight));
    }
  });

  // Apply to creator affinity
  if (creatorKey) {
    if (!isNegative) {
      const current = profile.creatorAffinities[creatorKey] || 0;
      profile.creatorAffinities[creatorKey] = Math.min(100, Math.max(0, current + weight));
      if (profile.negativeCreators[creatorKey]) {
        profile.negativeCreators[creatorKey] = Math.max(0, profile.negativeCreators[creatorKey] - weight);
      }
    } else {
      const current = profile.creatorAffinities[creatorKey] || 0;
      profile.creatorAffinities[creatorKey] = Math.max(0, current + weight);
      profile.negativeCreators[creatorKey] = Math.min(100, (profile.negativeCreators[creatorKey] || 0) + Math.abs(weight));
    }
  }

  // Dwell time modeling
  if (event.type === 'dwell_time' && event.dwellDurationSeconds) {
    const seconds = event.dwellDurationSeconds;
    const dwellBoost = seconds >= 30 ? 4.0 : seconds >= 15 ? 2.5 : 1.0;
    topics.forEach((t) => {
      const normalized = t.toLowerCase();
      profile.topicAffinities[normalized] = Math.min(100, (profile.topicAffinities[normalized] || 10) + dwellBoost);
    });
  }

  profile.totalInteractions += 1;
  profile.lastActive = Date.now();

  saveUserInterestProfile(profile);
  return profile;
}
