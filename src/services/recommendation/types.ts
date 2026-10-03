import { Post, Friend, UserProfile } from '../../types';

export type FeedMode = 'Recommended' | 'Connections';

export type InteractionType =
  | 'like'
  | 'unlike'
  | 'comment'
  | 'share'
  | 'save'
  | 'unsave'
  | 'follow'
  | 'unfollow'
  | 'profile_visit'
  | 'dwell_time' // viewing/reading post > threshold
  | 'video_completion' // watched > 80%
  | 'video_replay'
  | 'skip' // fast scroll past item
  | 'hide'
  | 'not_interested'
  | 'mute'
  | 'report';

export type FreshnessCategory =
  | 'breaking_news'
  | 'trending_discussion'
  | 'normal'
  | 'evergreen';

export type ContentFormat = 'text' | 'image' | 'video' | 'mixed';

export interface UserInterestProfile {
  userId: string;
  topicAffinities: Record<string, number>; // topic -> affinity score [0, 100]
  creatorAffinities: Record<string, number>; // creatorId/creatorName -> score [0, 100]
  negativeTopics: Record<string, number>; // topic -> negative penalty [0, 100]
  negativeCreators: Record<string, number>; // creator -> negative penalty [0, 100]
  formatPreferences: Record<ContentFormat, number>; // format -> multiplier [0.5, 2.0]
  totalInteractions: number;
  lastActive: number;
  explorationTolerance: number; // [0.1, 0.5], controls epsilon for discovery
}

export interface ExtractedFeatures {
  postId: string;
  topicMatchScore: number; // 0 to 1
  creatorAffinityScore: number; // 0 to 1
  relationshipStrength: number; // 0 to 1 (in-network interaction density)
  freshnessScore: number; // 0 to 1 (based on half-life decay)
  predictedEngagement: number; // 0 to 1 (estimated probability of action)
  trendingMomentum: number; // 0 to 1 (velocity of recent likes/shares)
  contentQualityScore: number; // 0 to 1 (depth, formatting, absence of clickbait)
  socialSignalsScore: number; // 0 to 1 (liked by friends, mutual friends interacting)
  locationRelevance: number; // 0 to 1 (regional matching, e.g. Bangladesh/Dhaka)
  newCreatorExplorationBonus: number; // 0 to 1 (cold-start distribution boost)
  formatPreferenceScore: number; // 0 to 1
  negativePenalty: number; // 0 to 1 (reduces score if topic/creator has negative signals)
}

export interface RankingWeights {
  topicMatch: number;
  creatorAffinity: number;
  relationshipStrength: number;
  freshness: number;
  predictedEngagement: number;
  trendingMomentum: number;
  contentQuality: number;
  socialSignals: number;
  locationRelevance: number;
  newCreatorExploration: number;
  formatPreference: number;
}

export interface ScoredPost {
  post: Post;
  score: number;
  features: ExtractedFeatures;
  mode: FeedMode;
  explanation: string;
  isExplorationItem?: boolean;
}

export interface FeedMixerConfig {
  maxSameCreatorPerWindow: number; // e.g. 2 per 8 posts
  maxSameTopicPerWindow: number; // e.g. 3 per 8 posts
  explorationSlotInterval: number; // e.g. 1 exploration post every 6 items
  seenPostDecayFactor: number; // multiplier for already seen posts
}

export interface InteractionEvent {
  id: string;
  userId: string;
  postId: string;
  creatorId?: string;
  creatorName?: string;
  topics?: string[];
  type: InteractionType;
  dwellDurationSeconds?: number;
  videoWatchPercentage?: number;
  timestamp: number;
}
