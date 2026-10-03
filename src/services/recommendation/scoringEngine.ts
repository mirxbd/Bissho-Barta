import { Friend, Post, UserProfile } from '../../types';
import {
  ExtractedFeatures,
  FeedMixerConfig,
  FeedMode,
  FreshnessCategory,
  RankingWeights,
  ScoredPost,
  UserInterestProfile,
} from './types';
import {
  extractPostTopics,
  getPostContentFormat,
  getUserInterestProfile,
} from './userInterestProfile';
import {
  getPostAgeInDays,
  getPostRelativeMinutes,
  isPostFromFriend,
  isPostFromFollowing,
  isPostFromPage,
} from '../../utils/contentPreference';
import {
  getControlPanelSettings,
  isUserMuted,
  isUserBlocked,
} from '../../utils/controlPanelStorage';

// Configurable weights for Recommended (For You) mode
export const RECOMMENDED_WEIGHTS: RankingWeights = {
  topicMatch: 0.28,
  creatorAffinity: 0.12,
  relationshipStrength: 0.0, // discovery mode focuses outside personal circle
  freshness: 0.20,
  predictedEngagement: 0.16,
  trendingMomentum: 0.22,
  contentQuality: 0.14,
  socialSignals: 0.08,
  locationRelevance: 0.10,
  newCreatorExploration: 0.15,
  formatPreference: 0.05,
};

// Configurable weights for Connections (Following) mode
export const CONNECTIONS_WEIGHTS: RankingWeights = {
  topicMatch: 0.10,
  creatorAffinity: 0.22,
  relationshipStrength: 0.35,
  freshness: 0.45, // high freshness priority for in-network feed
  predictedEngagement: 0.12,
  trendingMomentum: 0.05,
  contentQuality: 0.10,
  socialSignals: 0.15,
  locationRelevance: 0.05,
  newCreatorExploration: 0.0, // connections only shows followed creators
  formatPreference: 0.05,
};

// Half-lives in hours for exponential decay
export const FRESHNESS_HALF_LIVES: Record<FreshnessCategory, number> = {
  breaking_news: 4,
  trending_discussion: 12,
  normal: 36,
  evergreen: 168,
};

export const DEFAULT_MIXER_CONFIG: FeedMixerConfig = {
  maxSameCreatorPerWindow: 2,
  maxSameTopicPerWindow: 3,
  explorationSlotInterval: 6,
  seenPostDecayFactor: 0.2,
};

/**
 * Categorizes post into a freshness decay category.
 */
function getPostFreshnessCategory(post: Post): FreshnessCategory {
  const content = (post.content || '').toLowerCase();
  if (content.includes('breaking') || content.includes('just announced') || content.includes('update:')) {
    return 'breaking_news';
  }
  if (content.includes('trending') || content.includes('question of the day') || content.includes('thoughts on')) {
    return 'trending_discussion';
  }
  if (content.includes('tips to optimize') || content.includes('recommendations') || content.includes('guide')) {
    return 'evergreen';
  }
  return 'normal';
}

/**
 * Calculates exponential freshness decay based on half-life.
 */
function calculateFreshnessScore(post: Post): number {
  const minutes = getPostRelativeMinutes(post.timestamp);
  const hours = minutes / 60;
  const category = getPostFreshnessCategory(post);
  const halfLife = FRESHNESS_HALF_LIVES[category];

  // Decay formula: e^(-ln(2) * (t / t_half))
  const decay = Math.exp(-Math.LN2 * (hours / halfLife));
  return Math.min(1.0, Math.max(0.01, decay));
}

/**
 * Extracts and normalizes features for scoring.
 */
export function extractPostFeatures(
  post: Post,
  userProfile: UserInterestProfile,
  friends: Friend[],
  currentUser: UserProfile,
  mode: FeedMode
): ExtractedFeatures {
  const topics = extractPostTopics(post);
  const format = getPostContentFormat(post);
  const authorKey = (post.authorName || '').trim().toLowerCase();

  // 1. Topic Match Score
  let topicSum = 0;
  let negativePenalty = 0;
  topics.forEach((t) => {
    const affinity = userProfile.topicAffinities[t.toLowerCase()] || 10;
    topicSum += affinity;
    if (userProfile.negativeTopics[t.toLowerCase()]) {
      negativePenalty += (userProfile.negativeTopics[t.toLowerCase()] / 100) * 0.4;
    }
  });
  const topicMatchScore = Math.min(1.0, (topicSum / Math.max(1, topics.length)) / 50);

  // 2. Creator Affinity Score
  const rawCreatorAffinity = userProfile.creatorAffinities[authorKey] || 0;
  const creatorAffinityScore = Math.min(1.0, rawCreatorAffinity / 50);
  if (userProfile.negativeCreators[authorKey]) {
    negativePenalty += (userProfile.negativeCreators[authorKey] / 100) * 0.5;
  }

  // 3. Relationship Strength (for connections)
  let relationshipStrength = 0;
  const isDirectFriend = isPostFromFriend(post, friends);
  const isFollowing = isPostFromFollowing(post, friends);
  const isPage = isPostFromPage(post, currentUser);
  if (isDirectFriend) relationshipStrength += 0.6;
  if (isFollowing) relationshipStrength += 0.3;
  if (isPage) relationshipStrength += 0.4;
  relationshipStrength = Math.min(1.0, relationshipStrength);

  // 4. Freshness
  const freshnessScore = calculateFreshnessScore(post);

  // 5. Predicted Engagement (Wilson score / CTR expectation)
  const totalEngagement = (post.likes || 0) + (post.shares || 0) * 2 + (post.comments?.length || 0) * 3;
  const predictedEngagement = Math.min(1.0, totalEngagement / 400);

  // 6. Trending Momentum (recent engagement velocity)
  const ageHours = Math.max(0.5, getPostRelativeMinutes(post.timestamp) / 60);
  const velocity = totalEngagement / ageHours;
  const trendingMomentum = Math.min(1.0, velocity / 60);

  // 7. Content Quality Score
  let quality = 0.5;
  if (post.content && post.content.length > 80) quality += 0.2;
  if (post.image || (post.attachments && post.attachments.length > 0)) quality += 0.2;
  if (post.content && (post.content.includes('#') || post.content.includes('?'))) quality += 0.1;
  const contentQualityScore = Math.min(1.0, quality);

  // 8. Social Signals
  const socialSignalsScore = Math.min(1.0, (post.shares || 0) / 30);

  // 9. Location Relevance (Bangladesh / Dhaka context)
  const lower = (post.content || '').toLowerCase();
  const isLocal =
    lower.includes('dhaka') ||
    lower.includes('bangladesh') ||
    lower.includes('sylhet') ||
    lower.includes('chattogram');
  const locationRelevance = isLocal ? 0.9 : 0.4;

  // 10. New Creator Exploration Bonus (boosts accounts with few posts to test distribution)
  const isEstablished = isDirectFriend || isPage || (post.likes > 300);
  const newCreatorExplorationBonus = !isEstablished && mode === 'Recommended' ? 0.75 : 0.0;

  // 11. Format preference
  const formatPreferenceScore = userProfile.formatPreferences[format] ? Math.min(1.0, userProfile.formatPreferences[format] / 1.5) : 0.5;

  return {
    postId: post.id,
    topicMatchScore,
    creatorAffinityScore,
    relationshipStrength,
    freshnessScore,
    predictedEngagement,
    trendingMomentum,
    contentQualityScore,
    socialSignalsScore,
    locationRelevance,
    newCreatorExplorationBonus,
    formatPreferenceScore,
    negativePenalty: Math.min(0.9, negativePenalty),
  };
}

/**
 * Computes final weighted ranking score.
 */
function computeWeightedScore(features: ExtractedFeatures, weights: RankingWeights): number {
  const rawScore =
    features.topicMatchScore * weights.topicMatch +
    features.creatorAffinityScore * weights.creatorAffinity +
    features.relationshipStrength * weights.relationshipStrength +
    features.freshnessScore * weights.freshness +
    features.predictedEngagement * weights.predictedEngagement +
    features.trendingMomentum * weights.trendingMomentum +
    features.contentQualityScore * weights.contentQuality +
    features.socialSignalsScore * weights.socialSignals +
    features.locationRelevance * weights.locationRelevance +
    features.newCreatorExplorationBonus * weights.newCreatorExploration +
    features.formatPreferenceScore * weights.formatPreference;

  // Apply negative feedback penalty
  const penalizedScore = rawScore * (1.0 - features.negativePenalty);
  return Math.max(0, penalizedScore);
}

/**
 * Filter stage: filters spam, duplicates, blocked, muted, reported, and low-quality items.
 */
export function filterCandidates(
  candidates: Post[],
  mode: FeedMode,
  currentUser: UserProfile,
  friends: Friend[],
  userInterest: UserInterestProfile
): Post[] {
  const myUserId = currentUser.id || 'user_me';
  const seenHashes = new Set<string>();

  return candidates.filter((post) => {
    // 1. Scheduled posts not yet published
    if (post.isScheduled) return false;

    // 2. Privacy check
    const isOwn =
      (post.authorId && post.authorId === myUserId) ||
      post.authorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
    if (post.postType === 'Private' && !isOwn) return false;

    // 3. Spam & Low Quality Filter (too short, all caps, or duplicate text)
    const content = (post.content || '').trim();
    if (content.length < 5) return false;
    const textHash = content.slice(0, 40).toLowerCase();
    if (seenHashes.has(textHash)) return false; // duplicate prevention
    seenHashes.add(textHash);

    // 4. Blocked / Muted / Reported Author filter
    if (isUserMuted(post.authorName) || (post.authorId && isUserMuted(post.authorId))) {
      return false;
    }
    if (isUserBlocked(post.authorName) || (post.authorId && isUserBlocked(post.authorId))) {
      return false;
    }
    const authorKey = post.authorName.toLowerCase();
    if ((userInterest.negativeCreators[authorKey] || 0) >= 30) {
      return false; // Muted/reported author
    }

    // 4b. Control Panel Content Filters: Adult/Romance filter & Safe Content policy
    const cpSettings = getControlPanelSettings();
    const contentLower = (post.content || '').toLowerCase();

    // Check custom hidden keywords
    if (cpSettings.content.hiddenKeywords?.some((kw) => contentLower.includes(kw.toLowerCase()))) {
      return false;
    }

    // Adult / NSFW explicit filter
    if (cpSettings.content.filterAdultRomance) {
      const explicitWords = ['porn', 'pron', 'nude', 'nsfw', 'romance xxx'];
      if (explicitWords.some((w) => contentLower.includes(w))) {
        return false;
      }
    }

    // 5. Mode-specific candidate generation requirements
    if (mode === 'Recommended') {
      // Recommended: Exclude in-network personal circle (friends, following, followed pages, own posts)
      if (isOwn) return false;
      if (isPostFromFriend(post, friends)) return false;
      if (isPostFromFollowing(post, friends)) return false;
      if (isPostFromPage(post, currentUser)) return false;

      // Recommended: Max 3 days old
      if (getPostAgeInDays(post.timestamp) > 3) return false;
    } else {
      // Connections: ONLY in-network (followed pages, friends, accounts followed, own posts)
      const inNetwork =
        isOwn ||
        isPostFromFriend(post, friends) ||
        isPostFromFollowing(post, friends) ||
        isPostFromPage(post, currentUser);
      if (!inNetwork) return false;
    }

    return true;
  });
}

/**
 * Diversity & Quality Reranker (Final Feed Mixer).
 * Enforces creator frequency caps, topic caps, format diversity, and exploration interleaving.
 */
export function rerankWithDiversity(
  scoredPosts: ScoredPost[],
  config: FeedMixerConfig = DEFAULT_MIXER_CONFIG
): ScoredPost[] {
  const result: ScoredPost[] = [];
  const pool = [...scoredPosts];
  const creatorRecentCounts: Record<string, number> = {};
  const topicRecentCounts: Record<string, number> = {};

  let slotIndex = 0;

  while (pool.length > 0) {
    let bestIndex = -1;
    const isExplorationSlot = slotIndex > 0 && slotIndex % config.explorationSlotInterval === 0;

    for (let i = 0; i < pool.length; i++) {
      const item = pool[i];
      const author = item.post.authorName.toLowerCase();
      const primaryTopic = (extractPostTopics(item.post)[0] || 'general').toLowerCase();

      // Check frequency caps in current sliding window
      const creatorCount = creatorRecentCounts[author] || 0;
      const topicCount = topicRecentCounts[primaryTopic] || 0;

      if (creatorCount >= config.maxSameCreatorPerWindow && pool.length > 3) {
        continue;
      }
      if (topicCount >= config.maxSameTopicPerWindow && pool.length > 3) {
        continue;
      }

      if (isExplorationSlot) {
        // Look for item with exploration bonus or less-exposed creator
        if (item.features.newCreatorExplorationBonus > 0 || !creatorRecentCounts[author]) {
          bestIndex = i;
          item.isExplorationItem = true;
          break;
        }
      }

      bestIndex = i;
      break;
    }

    // Fallback if caps constrained all remaining
    if (bestIndex === -1) {
      bestIndex = 0;
    }

    const [selected] = pool.splice(bestIndex, 1);
    result.push(selected);

    // Update window counts
    const author = selected.post.authorName.toLowerCase();
    const primaryTopic = (extractPostTopics(selected.post)[0] || 'general').toLowerCase();
    creatorRecentCounts[author] = (creatorRecentCounts[author] || 0) + 1;
    topicRecentCounts[primaryTopic] = (topicRecentCounts[primaryTopic] || 0) + 1;

    // Decay window history after 6 items
    if (result.length % 6 === 0) {
      Object.keys(creatorRecentCounts).forEach((k) => (creatorRecentCounts[k] = Math.max(0, creatorRecentCounts[k] - 1)));
      Object.keys(topicRecentCounts).forEach((k) => (topicRecentCounts[k] = Math.max(0, topicRecentCounts[k] - 1)));
    }

    slotIndex++;
  }

  return result;
}

/**
 * End-to-end recommendation pipeline:
 * Candidate Generation -> Filtering -> Feature Extraction -> Scoring -> Diversity & Mixing
 */
export function generateRecommendedFeed(
  allPosts: Post[],
  mode: FeedMode,
  currentUser: UserProfile,
  friends: Friend[],
  weightsOverride?: Partial<RankingWeights>
): ScoredPost[] {
  const userInterest = getUserInterestProfile();
  const weights: RankingWeights = {
    ...(mode === 'Recommended' ? RECOMMENDED_WEIGHTS : CONNECTIONS_WEIGHTS),
    ...(weightsOverride || {}),
  };

  // 1. Candidate Generation & Filtering
  const cpSettings = getControlPanelSettings();
  let filtered: Post[] = [];

  if (mode === 'Recommended') {
    const connRatio = cpSettings.content.recommendationsRatio; // 0 to 100
    if (connRatio === 0) {
      filtered = filterCandidates(allPosts, 'Recommended', currentUser, friends, userInterest);
    } else if (connRatio === 100) {
      filtered = filterCandidates(allPosts, 'Connections', currentUser, friends, userInterest);
    } else {
      // Blended ratio: e.g. 50% Connections, 50% Discovery
      const discoveryCandidates = filterCandidates(allPosts, 'Recommended', currentUser, friends, userInterest);
      const connectionCandidates = filterCandidates(allPosts, 'Connections', currentUser, friends, userInterest);

      const targetTotal = Math.max(10, discoveryCandidates.length + connectionCandidates.length);
      const connCount = Math.round((targetTotal * connRatio) / 100);
      const discCount = targetTotal - connCount;

      const takenConn = connectionCandidates.slice(0, connCount);
      const takenDisc = discoveryCandidates.slice(0, discCount);

      // Interleave according to ratio
      const blended: Post[] = [];
      let cIdx = 0;
      let dIdx = 0;
      while (cIdx < takenConn.length || dIdx < takenDisc.length) {
        if (dIdx < takenDisc.length) blended.push(takenDisc[dIdx++]);
        if (cIdx < takenConn.length) blended.push(takenConn[cIdx++]);
      }
      filtered = blended;
    }
  } else {
    filtered = filterCandidates(allPosts, mode, currentUser, friends, userInterest);
  }

  // 2. Feature Extraction & Scoring
  const scored: ScoredPost[] = filtered.map((post) => {
    const features = extractPostFeatures(post, userInterest, friends, currentUser, mode);
    let score = computeWeightedScore(features, weights);

    // In Connections mode: ensure strict chronological freshness ordering
    if (mode === 'Connections') {
      const relMinutes = getPostRelativeMinutes(post.timestamp);
      // Tie-break with freshness dominant
      score += Math.max(0, 1000 - relMinutes);
    }

    // Generate explainability label
    let explanation = 'Personalized for you';
    if (mode === 'Connections') {
      explanation = 'From your connections';
    } else if (features.trendingMomentum > 0.6) {
      explanation = 'Trending viral topic';
    } else if (features.newCreatorExplorationBonus > 0) {
      explanation = 'Discover new creator';
    } else if (features.locationRelevance > 0.8) {
      explanation = 'Popular locally in Dhaka';
    }

    return {
      post,
      score,
      features,
      mode,
      explanation,
    };
  });

  // 3. Sort by score
  scored.sort((a, b) => {
    if (a.post.isPinned && !b.post.isPinned) return -1;
    if (!a.post.isPinned && b.post.isPinned) return 1;
    return b.score - a.score;
  });

  // 4. Diversity, Quality Reranking & Final Mixing
  return rerankWithDiversity(scored);
}
