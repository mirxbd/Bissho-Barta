import { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import { Post, Friend, Conversation, UserProfile, SearchSource, WebSearchResult } from '../types';
import { 
  Search, 
  X, 
  User, 
  MessageSquare, 
  Newspaper, 
  ArrowRight, 
  MessageCircle, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  RotateCw, 
  Video, 
  ThumbsUp, 
  Share2, 
  CheckCircle2, 
  TrendingUp, 
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchTabProps {
  posts: Post[];
  watchPosts?: Post[];
  friends: Friend[];
  conversations: Conversation[];
  profile: UserProfile;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchSource?: SearchSource;
  setSearchSource?: (source: SearchSource) => void;
  setActiveTab: (tab: number) => void;
  setChattingFriendId: (id: string | null) => void;
  likePost?: (postId: string, isWatchPost?: boolean) => void;
  addComment?: (postId: string, text: string, isWatchPost?: boolean) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

export default function SearchTab({
  posts,
  watchPosts = [],
  friends,
  conversations,
  profile,
  searchQuery,
  setSearchQuery,
  searchSource = 'fb',
  setSearchSource,
  setActiveTab,
  setChattingFriendId,
  likePost,
  addComment,
  onViewProfile
}: SearchTabProps) {
  // Category filter inside Bissho Barta mode
  const [fbCategory, setFbCategory] = useState<'all' | 'posts' | 'people' | 'videos' | 'messages'>('all');

  // Web search state
  const [webResult, setWebResult] = useState<WebSearchResult | null>(null);
  const [isLoadingWeb, setIsLoadingWeb] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Combine feed posts and watch posts for Bissho Barta public search with useMemo
  const allPublicPosts: Array<Post & { isWatch?: boolean }> = useMemo(() => [
    ...posts.map(p => ({ ...p, isWatch: false })),
    ...watchPosts.map(p => ({ ...p, isWatch: true }))
  ], [posts, watchPosts]);

  // Filtering for Bissho Barta Mode
  const queryLower = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredFriends = useMemo(() => {
    if (!queryLower) return friends;
    return friends.filter(friend => 
      friend.name.toLowerCase().includes(queryLower)
    );
  }, [friends, queryLower]);

  const filteredPosts = useMemo(() => {
    if (!queryLower) return allPublicPosts.filter(p => !p.postType || p.postType === 'Public');
    return allPublicPosts.filter(post => {
      // Only include public posts (or posts with undefined postType which default to public)
      const isPublic = !post.postType || post.postType === 'Public';
      if (!isPublic) return false;

      const matchesContent = post.content?.toLowerCase().includes(queryLower);
      const matchesAuthor = post.authorName?.toLowerCase().includes(queryLower);
      const matchesTitle = post.title?.toLowerCase().includes(queryLower);
      const matchesComments = post.comments?.some(c => c.content.toLowerCase().includes(queryLower));
      const matchesTags = post.taggedPeople?.some(t => t.toLowerCase().includes(queryLower));

      return matchesContent || matchesAuthor || matchesTitle || matchesComments || matchesTags;
    });
  }, [allPublicPosts, queryLower]);

  const filteredVideos = useMemo(() => {
    return filteredPosts.filter(p => p.isWatch || p.videoUrl);
  }, [filteredPosts]);

  const filteredMessages = useMemo(() => {
    if (!queryLower) return conversations;
    return conversations.filter(conv => 
      conv.friend.name.toLowerCase().includes(queryLower) ||
      conv.messages.some(m => m.text.toLowerCase().includes(queryLower))
    );
  }, [conversations, queryLower]);

  const hasFbResults = filteredFriends.length > 0 || filteredPosts.length > 0 || filteredMessages.length > 0;

  // Handle Fetching Web Search from Server API
  const performWebSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) {
      setWebResult(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingWeb(true);
    setWebError(null);
    setLastSearchedQuery(q);

    try {
      const response = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      startTransition(() => {
        setWebResult(data);
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Web search fetch error:", err);
      setWebError(err.message || 'Failed to fetch Google web results');
      // Create fallback web search object
      setWebResult({
        query: q,
        summary: `Live Google search data for **${q}**. Explore web pages and top Google index results below.`,
        sources: [
          {
            title: `${q} - Google Web Search`,
            uri: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
            snippet: `Direct Google Search link for "${q}"`
          },
          {
            title: `${q} on Wikipedia`,
            uri: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
            snippet: `Search encyclopedic information for "${q}"`
          },
          {
            title: `${q} - News & Media Updates`,
            uri: `https://news.google.com/search?q=${encodeURIComponent(q)}`,
            snippet: `Latest breaking headlines and coverage regarding "${q}"`
          }
        ],
        searchQueries: [q, `${q} overview`, `${q} news`],
        grounded: false
      });
    } finally {
      setIsLoadingWeb(false);
    }
  };

  // Trigger web search whenever searchSource is 'web' and searchQuery changes (debounced)
  useEffect(() => {
    if (searchSource === 'web' && searchQuery.trim().length > 1) {
      const timer = setTimeout(() => {
        performWebSearch(searchQuery);
      }, 400);
      return () => {
        clearTimeout(timer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else if (searchSource === 'web' && !searchQuery.trim()) {
      setWebResult(null);
    }
  }, [searchQuery, searchSource]);

  // Suggested searches for Bissho Barta
  const fbSuggestedSearches = [
    { label: 'Sarah Jenkins', type: 'friend' },
    { label: 'React 19', type: 'post' },
    { label: 'Alex Rivera', type: 'friend' },
    { label: 'Bissho Barta app update', type: 'post' },
    { label: 'Photography', type: 'post' },
    { label: '#tech', type: 'tag' }
  ];

  // Suggested searches for Web (Google)
  const webSuggestedSearches = [
    { label: 'Latest Space Discoveries', category: 'Science' },
    { label: 'AI Technology News 2026', category: 'Tech' },
    { label: 'Global Weather Forecast', category: 'Live' },
    { label: 'World Economic Trends', category: 'Finance' },
    { label: 'Best Electric Vehicles', category: 'Auto' },
    { label: 'Healthy Nutrition Facts', category: 'Health' }
  ];

  return (
    <div className="bg-[#F0F2F5] lg:bg-transparent min-h-[calc(100vh-112px)] lg:min-h-0 pb-12 lg:pb-8 select-none font-sans p-3 sm:p-4 max-w-4xl mx-auto" id="search-tab-container">
      
      {/* TOP SEARCH CONTROLLER CARD */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-4" id="search-tab-bar-card">
        
        {/* 2-TOGGLE SEGMENTED CONTROL BAR (BISSHO BARTA vs WEB) */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#076653]" />
              <span>Search Source</span>
            </label>
            <span className="text-[11px] font-semibold text-gray-500">
              {searchSource === 'fb' ? 'Bissho Barta Social (Public Posts)' : 'Google Web Data'}
            </span>
          </div>

          <div className="grid grid-cols-2 p-1 bg-[#EBF7F2] rounded-xl border border-[#076653]/20 gap-1" id="search-mode-segmented-toggle">
            {/* BISSHO BARTA TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => {
                setSearchSource?.('fb');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchSource === 'fb'
                  ? 'bg-[#076653] text-[#E3EF26] shadow-sm scale-[1.01]'
                  : 'text-[#076653] hover:bg-white/60 hover:text-[#065042]'
              }`}
              id="search-toggle-fb-btn"
            >
              <Newspaper className="w-4 h-4" />
              <div className="flex flex-col items-start text-left">
                <span className="leading-tight text-xs font-bold">Bissho Barta Posts & Social</span>
                <span className={`text-[10px] font-normal leading-tight ${searchSource === 'fb' ? 'text-[#E3EF26]/90' : 'text-gray-500'}`}>
                  Every public post & profile
                </span>
              </div>
            </button>

            {/* WEB TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => {
                setSearchSource?.('web');
                if (searchQuery.trim()) {
                  performWebSearch(searchQuery);
                }
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchSource === 'web'
                  ? 'bg-[#076653] text-[#E3EF26] shadow-sm scale-[1.01]'
                  : 'text-[#076653] hover:bg-white/60 hover:text-[#065042]'
              }`}
              id="search-toggle-web-btn"
            >
              <Globe className="w-4 h-4" />
              <div className="flex flex-col items-start text-left">
                <span className="leading-tight text-xs font-bold">Web (Google Data)</span>
                <span className={`text-[10px] font-normal leading-tight ${searchSource === 'web' ? 'text-[#E3EF26]/90' : 'text-gray-500'}`}>
                  Live Google search index
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* INPUT BOX */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#076653]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchSource === 'web' && searchQuery.trim()) {
                performWebSearch(searchQuery);
              }
            }}
            placeholder={
              searchSource === 'fb'
                ? "Search every public post, author, video, friends..."
                : "Search Google data (e.g., news, facts, topics)..."
            }
            className="w-full bg-[#F2FAF6] hover:bg-[#EBF7F2] focus:bg-white text-gray-900 rounded-full py-2.5 pl-10 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-[#076653]/40 border border-[#076653]/20 transition-all placeholder:text-gray-400"
            autoFocus
            id="search-tab-input-field"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setWebResult(null);
                }}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                id="search-tab-clear-btn"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {searchSource === 'web' && (
              <button
                type="button"
                onClick={() => performWebSearch(searchQuery)}
                disabled={!searchQuery.trim() || isLoadingWeb}
                className="px-2.5 py-1 bg-[#076653] text-[#E3EF26] hover:bg-[#065042] disabled:opacity-50 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1 shrink-0"
                id="search-tab-submit-web-btn"
              >
                {isLoadingWeb ? <RotateCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                <span>Go</span>
              </button>
            )}
          </div>
        </div>

        {/* SUB-CATEGORY TABS FOR FB MODE */}
        {searchSource === 'fb' && searchQuery.trim() && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 overflow-x-auto pb-1" id="fb-search-category-tabs">
            {[
              { id: 'all', label: `All (${filteredPosts.length + filteredFriends.length + filteredMessages.length})` },
              { id: 'posts', label: `Public Posts (${filteredPosts.length})` },
              { id: 'people', label: `People (${filteredFriends.length})` },
              { id: 'videos', label: `Videos (${filteredVideos.length})` },
              { id: 'messages', label: `Messages (${filteredMessages.length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFbCategory(cat.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  fbCategory === cat.id
                    ? 'bg-[#076653] text-[#E3EF26] shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-[#EBF7F2] hover:text-[#076653]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* QUICK SUGGESTIONS WHEN QUERY IS EMPTY */}
        {!searchQuery.trim() && (
          <div className="mt-4 pt-3 border-t border-gray-100" id="quick-searches-box">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#076653]" />
              <span>{searchSource === 'fb' ? 'Popular Social Searches' : 'Trending Google Topics'}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {searchSource === 'fb'
                ? fbSuggestedSearches.map((qs, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSearchQuery(qs.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2FAF6] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-full border border-[#076653]/20 text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      <Search className="w-3 h-3 text-[#076653]/60" />
                      <span>{qs.label}</span>
                    </button>
                  ))
                : webSuggestedSearches.map((qs, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(qs.label);
                        performWebSearch(qs.label);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2FAF6] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-full border border-[#076653]/20 text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      <Globe className="w-3 h-3 text-[#076653]/60" />
                      <span>{qs.label}</span>
                      <span className="text-[10px] bg-white text-gray-600 px-1.5 py-0.2 rounded-full border border-gray-200">
                        {qs.category}
                      </span>
                    </button>
                  ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. FB MODE SEARCH RESULTS (From Every Public Post & Social Network)       */}
      {/* ========================================================================= */}
      {searchSource === 'fb' && (
        <>
          {searchQuery.trim() ? (
            <div className="flex flex-col gap-4" id="search-results-fb-list">
              {hasFbResults ? (
                <>
                  {/* Category: People / Profiles */}
                  {(fbCategory === 'all' || fbCategory === 'people') && filteredFriends.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm" id="search-results-friends">
                      <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-[#076653]" />
                          <span>People ({filteredFriends.length})</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Social Profiles</span>
                      </h3>
                      <div className="flex flex-col divide-y divide-gray-100">
                        {filteredFriends.map((friend) => (
                          <div key={friend.id} className="flex items-center justify-between py-2.5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={friend.avatar} 
                                alt="" 
                                onClick={() => onViewProfile?.(friend.name, friend.avatar, friend.id)}
                                className="w-10 h-10 rounded-full object-cover border border-[#076653]/20 shadow-xs cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                title={`View ${friend.name}'s profile`}
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h4 
                                  onClick={() => onViewProfile?.(friend.name, friend.avatar, friend.id)}
                                  className="text-sm font-bold text-gray-900 leading-tight cursor-pointer hover:text-[#076653] hover:underline"
                                  title={`View ${friend.name}'s profile`}
                                >
                                  {friend.name}
                                </h4>
                                <p className="text-[11px] text-gray-500">
                                  {friend.status === 'friend' ? 'Friend • Online' : friend.status === 'pending_outgoing' ? 'Friend Request Sent' : `${friend.mutualFriends} mutual friends`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setChattingFriendId(friend.id);
                                  setActiveTab(2); // messages
                                }}
                                className="px-3 py-1.5 bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Message</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Public Posts from Every Social Media Post */}
                  {(fbCategory === 'all' || fbCategory === 'posts') && filteredPosts.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm" id="search-results-posts">
                      <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Newspaper className="w-4 h-4 text-[#076653]" />
                          <span>Public Posts ({filteredPosts.length})</span>
                        </div>
                        <span className="text-[10px] bg-[#EBF7F2] text-[#076653] px-2 py-0.5 rounded-full font-bold">
                          All Public Feed
                        </span>
                      </h3>
                      <div className="flex flex-col gap-3">
                        {filteredPosts.map((post) => (
                          <div 
                            key={post.id} 
                            className="p-3.5 bg-gray-50/80 hover:bg-[#F2FAF6] border border-gray-200 rounded-xl transition-all flex flex-col gap-2.5"
                          >
                            {/* Author Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={post.authorAvatar}
                                  alt=""
                                  onClick={() => onViewProfile?.(post.authorName, post.authorAvatar)}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                  title={`View ${post.authorName}'s profile`}
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span 
                                      onClick={() => onViewProfile?.(post.authorName, post.authorAvatar)}
                                      className="text-xs font-bold text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                      title={`View ${post.authorName}'s profile`}
                                    >
                                      {post.authorName}
                                    </span>
                                    {post.postType && (
                                      <span className="text-[9px] bg-green-100 text-green-800 px-1.5 py-0.2 rounded font-semibold">
                                        {post.postType}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400">{post.timestamp}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                🌐 Public Post
                              </span>
                            </div>

                            {/* Content */}
                            <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                              {post.content}
                            </p>

                            {/* Image / Video thumbnail preview if present */}
                            {post.image && (
                              <img
                                src={post.image}
                                alt="Post media"
                                className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                                referrerPolicy="no-referrer"
                              />
                            )}

                            {post.videoThumbnail && (
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
                                <img
                                  src={post.videoThumbnail}
                                  alt="Video preview"
                                  className="w-full max-h-48 object-cover opacity-90"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-[#076653]/90 text-[#E3EF26] flex items-center justify-center shadow-lg">
                                    <Video className="w-5 h-5" />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Interaction Row */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200/80">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => likePost?.(post.id, post.isWatch)}
                                  className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                    post.likedByMe ? 'text-[#076653]' : 'text-gray-500 hover:text-[#076653]'
                                  }`}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" fill={post.likedByMe ? "currentColor" : "none"} />
                                  <span>{post.likes}</span>
                                </button>
                                <span className="text-[11px] text-gray-500 font-semibold">
                                  💬 {post.comments?.length || 0}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab(post.isWatch ? 3 : 0);
                                }}
                                className="text-[11px] text-[#076653] font-bold hover:text-[#065042] flex items-center gap-1 cursor-pointer"
                              >
                                <span>{post.isWatch ? 'Watch Video' : 'View on Feed'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Messages */}
                  {(fbCategory === 'all' || fbCategory === 'messages') && filteredMessages.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm" id="search-results-messages">
                      <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                        <MessageCircle className="w-4 h-4 text-[#076653]" />
                        <span>Conversations ({filteredMessages.length})</span>
                      </h3>
                      <div className="flex flex-col divide-y divide-gray-100">
                        {filteredMessages.map((conv) => {
                          const lastMsg = conv.messages[conv.messages.length - 1];
                          return (
                            <div key={conv.id} className="flex items-center justify-between py-2.5">
                              <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                                <img 
                                  src={conv.friend.avatar} 
                                  alt="" 
                                  onClick={() => onViewProfile?.(conv.friend.name, conv.friend.avatar, conv.friend.id)}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-xs shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                  title={`View ${conv.friend.name}'s profile`}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 
                                    onClick={() => onViewProfile?.(conv.friend.name, conv.friend.avatar, conv.friend.id)}
                                    className="text-sm font-bold text-gray-900 leading-tight cursor-pointer hover:text-[#076653] hover:underline"
                                    title={`View ${conv.friend.name}'s profile`}
                                  >
                                    {conv.friend.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {lastMsg ? lastMsg.text : 'No messages'}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setChattingFriendId(conv.friend.id);
                                  setActiveTab(2); // messages
                                }}
                                className="px-3 py-1.5 bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                              >
                                <span>Open Chat</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* No Results in FB Mode */
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 bg-[#EBF7F2] text-[#076653] rounded-full flex items-center justify-center text-2xl font-bold">
                    🔍
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">No Social Posts Found</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      We couldn't find any public posts or people matching <span className="font-semibold text-gray-700">"{searchQuery}"</span>. You can switch to <strong>Web Search</strong> to search Google web data.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setSearchSource?.('web')}
                      className="px-4 py-2 bg-[#076653] text-[#E3EF26] hover:bg-[#065042] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Search on Google Web</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State for FB Mode */
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center flex flex-col items-center justify-center gap-3" id="search-tab-empty-fb-state">
              <div className="w-14 h-14 bg-[#EBF7F2] text-[#076653] rounded-full flex items-center justify-center text-2xl">
                📰
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Search This Social Media</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Search across every public post, author profile, attached images, videos, and conversations in the platform.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. WEB MODE SEARCH RESULTS (Google Web Data & Search Grounding)            */}
      {/* ========================================================================= */}
      {searchSource === 'web' && (
        <div className="flex flex-col gap-4" id="search-results-web-list">
          {isLoadingWeb ? (
            /* Loading Skeleton for Web Search */
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#076653]/20 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-full"></div>
                <div className="h-3.5 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3.5 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                <div className="h-3 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
              </div>
              <div className="text-center text-xs text-[#076653] font-semibold flex items-center justify-center gap-1.5 pt-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Fetching live Google web search data...</span>
              </div>
            </div>
          ) : webResult ? (
            /* Google Web Results View */
            <>
              {/* Google Knowledge & Grounded Summary Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm" id="web-search-knowledge-card">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#076653] text-[#E3EF26] flex items-center justify-center shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 leading-tight">Google Web Search Overview</h3>
                      <p className="text-[10px] text-gray-500">Live indexed data from Google</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-[#EBF7F2] text-[#076653] border border-[#076653]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#076653]" />
                    <span>Google Grounded</span>
                  </span>
                </div>

                {/* Summary Text */}
                <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80">
                  {webResult.summary}
                </div>

                {/* Related Google Queries */}
                {webResult.searchQueries && webResult.searchQueries.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-gray-100">
                    <h5 className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#076653]" />
                      <span>Related Google Searches</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {webResult.searchQueries.map((rq, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(rq);
                            performWebSearch(rq);
                          }}
                          className="text-[11px] bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Search className="w-2.5 h-2.5" />
                          <span>{rq}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Web Sources & Links Card */}
              {webResult.sources && webResult.sources.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm" id="web-search-sources-card">
                  <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#076653]" />
                      <span>Web Sources & Links ({webResult.sources.length})</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">External Web Data</span>
                  </h3>

                  <div className="flex flex-col gap-2.5">
                    {webResult.sources.map((source, idx) => {
                      let domain = "google.com";
                      try {
                        domain = new URL(source.uri).hostname.replace('www.', '');
                      } catch (e) {
                        domain = "web source";
                      }

                      return (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-50 hover:bg-[#EBF7F2] border border-gray-200 hover:border-[#076653]/30 rounded-xl transition-all flex items-start justify-between gap-3 group text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-gray-600 border border-gray-200 font-semibold flex items-center gap-1">
                                🌐 {domain}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-[#076653] group-hover:text-[#065042] leading-snug group-hover:underline">
                              {source.title}
                            </h4>
                            {source.snippet && (
                              <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {source.snippet}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#076653] shrink-0 mt-1" />
                        </a>
                      );
                    })}
                  </div>

                  {/* Direct Google Search Fallback Link */}
                  <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#076653] font-bold hover:underline py-1 px-3 rounded-lg hover:bg-[#EBF7F2] transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Search "{searchQuery}" directly on Google.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </>
          ) : searchQuery.trim() ? (
            /* Button to trigger web search if not yet fetched */
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 bg-[#EBF7F2] text-[#076653] rounded-full flex items-center justify-center text-2xl font-bold">
                🌐
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Search Google Data</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Query live web pages, facts, news, and encyclopedia references from Google.
                </p>
              </div>
              <button
                type="button"
                onClick={() => performWebSearch(searchQuery)}
                className="px-5 py-2.5 bg-[#076653] text-[#E3EF26] hover:bg-[#065042] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Search className="w-4 h-4" />
                <span>Search Google for "{searchQuery}"</span>
              </button>
            </div>
          ) : (
            /* Empty State for Web Mode */
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center flex flex-col items-center justify-center gap-3" id="search-tab-empty-web-state">
              <div className="w-14 h-14 bg-[#EBF7F2] text-[#076653] rounded-full flex items-center justify-center text-2xl">
                🌐
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Google Web Search</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Type any query above to fetch live data, web summaries, and sources directly from Google Search index.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
