import { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import { Post, Friend, Conversation, UserProfile, SearchSource, WebSearchResult } from '../types';
import { 
  Search, 
  X, 
  MessageSquare, 
  RotateCw, 
  ThumbsUp, 
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';

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
  onStartMessage?: (userName: string, userAvatar?: string, friendId?: string) => void;
  likePost?: (postId: string, isWatchPost?: boolean) => void;
  addComment?: (postId: string, text: string, isWatchPost?: boolean) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

export default function SearchTab({
  posts,
  watchPosts = [],
  friends,
  conversations,
  searchQuery,
  setSearchQuery,
  searchSource = 'fb',
  setSearchSource,
  setActiveTab,
  setChattingFriendId,
  onStartMessage,
  likePost,
  onViewProfile
}: SearchTabProps) {
  const [fbCategory, setFbCategory] = useState<'all' | 'posts' | 'people' | 'videos' | 'messages'>('all');
  const [poppingLikeIds, setPoppingLikeIds] = useState<Record<string, boolean>>({});

  const handleLikeClick = (postId: string, isWatch?: boolean) => {
    setPoppingLikeIds((prev) => ({ ...prev, [postId]: true }));
    likePost?.(postId, isWatch);
    setTimeout(() => {
      setPoppingLikeIds((prev) => ({ ...prev, [postId]: false }));
    }, 450);
  };

  // Web search state
  const [webResult, setWebResult] = useState<WebSearchResult | null>(null);
  const [isLoadingWeb, setIsLoadingWeb] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [, startTransition] = useTransition();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Combine feed posts and watch posts for Bissho Barta public search
  const allPublicPosts: Array<Post & { isWatch?: boolean }> = useMemo(() => [
    ...posts.filter(p => !p.isScheduled).map(p => ({ ...p, isWatch: false })),
    ...watchPosts.map(p => ({ ...p, isWatch: true }))
  ], [posts, watchPosts]);

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
      setWebError(null);
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Search is unavailable right now');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      startTransition(() => {
        setWebResult(data);
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setWebResult(null);
      setWebError(err.message || 'Search is unavailable right now');
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
      setWebError(null);
    }
  }, [searchQuery, searchSource]);

  // Suggested searches for Bissho Barta (Bangladesh-based)
  const fbSuggestedSearches = [
    { label: 'Nusrat Jahan', type: 'friend' },
    { label: 'Tanvir Ahmed', type: 'friend' },
    { label: 'Dhaka Metro', type: 'post' },
    { label: 'Bangladesh Cricket', type: 'post' },
    { label: 'Sundarbans', type: 'post' },
    { label: '#bangladesh', type: 'tag' }
  ];

  // Suggested searches for Web
  const webSuggestedSearches = [
    { label: 'Bangladesh Economy 2026', category: 'Finance' },
    { label: 'Padma Bridge Rail Link', category: 'News' },
    { label: 'Dhaka Weather Forecast', category: 'Live' },
    { label: 'Bengali Literature Classics', category: 'Culture' }
  ];

  return (
    <div className="bg-[#F0F2F5] lg:bg-transparent min-h-[calc(100vh-112px)] lg:min-h-0 pb-12 lg:pb-8 select-none font-sans p-3 sm:p-4 max-w-4xl mx-auto" id="search-tab-container">
      
      {/* TOP SEARCH CONTROLLER CARD */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-4" id="search-tab-bar-card">
        
        {/* BISSHO BARTA | WEB SOURCE TOGGLE */}
        <div className="mb-3">
          <div className="grid grid-cols-2 p-1 bg-[#EBF7F2] rounded-xl border border-[#076653]/20 gap-1" id="search-mode-segmented-toggle">
            <button
              type="button"
              onClick={() => setSearchSource?.('fb')}
              className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchSource === 'fb'
                  ? 'bg-[#076653] text-[#E3EF26] shadow-sm'
                  : 'text-[#076653] hover:bg-white/60 hover:text-[#065042]'
              }`}
              id="search-toggle-fb-btn"
            >
              Bissho Barta
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchSource?.('web');
                if (searchQuery.trim()) {
                  performWebSearch(searchQuery);
                }
              }}
              className={`flex items-center justify-center py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchSource === 'web'
                  ? 'bg-[#076653] text-[#E3EF26] shadow-sm'
                  : 'text-[#076653] hover:bg-white/60 hover:text-[#065042]'
              }`}
              id="search-toggle-web-btn"
            >
              Web
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
                ? "Search public posts, people, videos, messages..."
                : "Search the web..."
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
                  setWebError(null);
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
                {isLoadingWeb ? <RotateCw className="w-3 h-3 animate-spin" /> : null}
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
              { id: 'posts', label: `Posts (${filteredPosts.length})` },
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
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
              {searchSource === 'fb' ? 'Suggested Searches' : 'Suggested Web Topics'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {searchSource === 'fb'
                ? fbSuggestedSearches.map((qs) => (
                    <button
                      key={qs.label}
                      type="button"
                      onClick={() => setSearchQuery(qs.label)}
                      className="px-3 py-1.5 bg-[#F2FAF6] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-full border border-[#076653]/20 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                    >
                      {qs.label}
                    </button>
                  ))
                : webSuggestedSearches.map((qs) => (
                    <button
                      key={qs.label}
                      type="button"
                      onClick={() => {
                        setSearchQuery(qs.label);
                        performWebSearch(qs.label);
                      }}
                      className="px-3 py-1.5 bg-[#F2FAF6] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-full border border-[#076653]/20 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                    >
                      {qs.label}
                    </button>
                  ))}
            </div>
          </div>
        )}
      </div>

      {/* 1. FB MODE SEARCH RESULTS */}
      {searchSource === 'fb' && (
        <>
          {searchQuery.trim() ? (
            <div className="flex flex-col gap-4" id="search-results-fb-list">
              {hasFbResults ? (
                <>
                  {/* Category: People / Profiles */}
                  {(fbCategory === 'all' || fbCategory === 'people') && filteredFriends.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm" id="search-results-friends">
                      <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">
                        People ({filteredFriends.length})
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
                                  {friend.status === 'friend' ? 'Friend' : friend.status === 'pending_outgoing' ? 'Request Sent' : `${friend.mutualFriends} mutual friends`}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (onStartMessage) {
                                  onStartMessage(friend.name, friend.avatar, friend.id);
                                } else {
                                  setChattingFriendId(friend.id);
                                  setActiveTab(2);
                                }
                              }}
                              className="px-3 py-1.5 bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Posts */}
                  {(fbCategory === 'all' || fbCategory === 'posts' || fbCategory === 'videos') && (fbCategory === 'videos' ? filteredVideos : filteredPosts).length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm" id="search-results-posts">
                      <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">
                        {fbCategory === 'videos' ? `Videos (${filteredVideos.length})` : `Posts (${filteredPosts.length})`}
                      </h3>
                      <div className="flex flex-col gap-3">
                        {(fbCategory === 'videos' ? filteredVideos : filteredPosts).map((post) => (
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
                                  onClick={() => onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200 cursor-pointer hover:ring-2 hover:ring-[#076653] transition-all"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span 
                                      onClick={() => onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)}
                                      className="text-xs font-bold text-gray-900 cursor-pointer hover:text-[#076653] hover:underline"
                                    >
                                      {post.authorName}
                                    </span>
                                    {(post.postType === 'Private' || post.postType === 'Subscriber') && (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                        {post.postType}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400">{post.timestamp}</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                              {post.content}
                            </p>

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
                              </div>
                            )}

                            {/* Interaction Row */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200/80">
                              <div className="flex items-center gap-3">
                                <motion.button
                                  whileTap={{ scale: 0.92 }}
                                  type="button"
                                  onClick={() => handleLikeClick(post.id, post.isWatch)}
                                  className={`relative text-[11px] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer select-none ${
                                    post.likedByMe
                                      ? 'bg-[#EBF7F2] text-[#076653] ring-1 ring-[#076653]/30 shadow-2xs'
                                      : 'text-gray-500 hover:bg-[#EBF7F2]/60 hover:text-[#076653]'
                                  } ${poppingLikeIds[post.id] ? 'animate-like-btn-pop bg-[#d4f4e7]' : ''}`}
                                >
                                  <ThumbsUp
                                    className={`w-3.5 h-3.5 transition-all duration-200 ${
                                      post.likedByMe ? 'fill-[#076653] text-[#076653] scale-110 animate-like-pop' : ''
                                    }`}
                                    fill={post.likedByMe ? "currentColor" : "none"}
                                  />
                                  <span>{post.likes}</span>
                                </motion.button>
                                <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>{post.comments?.length || 0}</span>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveTab(post.isWatch ? 3 : 0)}
                                className="text-[11px] text-[#076653] font-bold hover:text-[#065042] cursor-pointer"
                              >
                                {post.isWatch ? 'Watch Video' : 'View on Feed'}
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
                      <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">
                        Conversations ({filteredMessages.length})
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
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0 flex-1">
                                  <h4 
                                    onClick={() => onViewProfile?.(conv.friend.name, conv.friend.avatar, conv.friend.id)}
                                    className="text-sm font-bold text-gray-900 leading-tight cursor-pointer hover:text-[#076653] hover:underline"
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
                                  setActiveTab(2);
                                }}
                                className="px-3 py-1.5 bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
                              >
                                Open Chat
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center flex flex-col items-center justify-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">No Social Posts Found</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      No posts or people matched <span className="font-semibold text-gray-700">"{searchQuery}"</span>.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchSource?.('web');
                        performWebSearch(searchQuery);
                      }}
                      className="px-4 py-2 bg-[#076653] text-[#E3EF26] hover:bg-[#065042] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Search on Web
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
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center" id="search-tab-empty-fb-state">
              <h3 className="text-sm font-bold text-gray-900">Search Bissho Barta</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Search across public posts, people, videos, and messages.
              </p>
            </div>
          )}
        </>
      )}

      {/* 2. WEB MODE SEARCH RESULTS */}
      {searchSource === 'web' && (
        <div className="flex flex-col gap-4" id="search-results-web-list">
          {isLoadingWeb ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-48"></div>
              <div className="space-y-2">
                <div className="h-3.5 bg-gray-200 rounded w-full"></div>
                <div className="h-3.5 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="text-center text-xs text-[#076653] font-semibold flex items-center justify-center gap-1.5 pt-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Searching the web...</span>
              </div>
            </div>
          ) : webError ? (
            /* Honest Error View with Retry Button */
            <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm text-center flex flex-col items-center justify-center gap-3" id="web-search-error-card">
              <h3 className="text-sm font-bold text-gray-900">{webError}</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                We could not complete your web search request right now. Please try again.
              </p>
              <button
                type="button"
                onClick={() => performWebSearch(searchQuery || lastSearchedQuery)}
                className="px-4 py-2 bg-[#076653] text-[#E3EF26] hover:bg-[#065042] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                id="web-search-retry-btn"
              >
                Retry
              </button>
            </div>
          ) : webResult ? (
            <>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm" id="web-search-knowledge-card">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <h3 className="text-xs font-bold text-gray-900 leading-tight">Web Search Overview</h3>
                </div>

                <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80">
                  {webResult.summary}
                </div>

                {webResult.searchQueries && webResult.searchQueries.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-gray-100">
                    <h5 className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      Related Searches
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {webResult.searchQueries.map((rq) => (
                        <button
                          key={rq}
                          type="button"
                          onClick={() => {
                            setSearchQuery(rq);
                            performWebSearch(rq);
                          }}
                          className="text-[11px] bg-[#EBF7F2] hover:bg-[#076653] hover:text-[#E3EF26] text-[#076653] px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer"
                        >
                          {rq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {webResult.sources && webResult.sources.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm" id="web-search-sources-card">
                  <h3 className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider border-b border-gray-100 pb-2">
                    Web Sources ({webResult.sources.length})
                  </h3>

                  <div className="flex flex-col gap-2.5">
                    {webResult.sources.map((source) => {
                      let domain = "web";
                      try {
                        domain = new URL(source.uri).hostname.replace('www.', '');
                      } catch {
                        domain = "web";
                      }

                      return (
                        <a
                          key={source.uri}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-gray-50 hover:bg-[#EBF7F2] border border-gray-200 hover:border-[#076653]/30 rounded-xl transition-all flex items-start justify-between gap-3 group text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-gray-500 font-semibold block mb-0.5">
                              {domain}
                            </span>
                            <h4 className="text-xs font-bold text-[#076653] group-hover:text-[#065042] leading-snug group-hover:underline">
                              {source.title}
                            </h4>
                            {source.snippet && (
                              <p className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {source.snippet}
                              </p>
                            )}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm text-center" id="search-tab-empty-web-state">
              <h3 className="text-sm font-bold text-gray-900">Web Search</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Enter a query above to search live web results.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
