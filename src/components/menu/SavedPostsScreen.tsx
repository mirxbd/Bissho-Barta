import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  FolderPlus,
  Trash2,
  Folder,
  ArrowLeft,
  X,
  ExternalLink,
  Plus,
  Check,
  Search,
} from 'lucide-react';
import { Post, UserProfile, Friend } from '../../types';
import {
  getSavedItems,
  getSavedFolders,
  createSavedFolder,
  unsavePostItem,
  savePostItem,
  SavedItem,
} from '../../utils/savedPostsStorage';
import PostActionBar from '../PostActionBar';
import { isPostRepostedByMe } from '../../utils/repostStorage';

interface SavedPostsScreenProps {
  posts: Post[];
  profile: UserProfile;
  friends?: Friend[];
  onBack: () => void;
  onLike: (postId: string) => void;
  onCommentClick: (post: Post) => void;
  onInstantRepost: (postId: string) => void;
  onUndoRepost: (postId: string) => void;
  onQuoteRepostClick: (post: Post) => void;
  onShareClick: (post: Post) => void;
  onShowToast?: (msg: string) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

export default function SavedPostsScreen({
  posts,
  profile,
  friends = [],
  onBack,
  onLike,
  onCommentClick,
  onInstantRepost,
  onUndoRepost,
  onQuoteRepostClick,
  onShareClick,
  onShowToast,
  onViewProfile,
}: SavedPostsScreenProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(getSavedItems);
  const [folders, setFolders] = useState<string[]>(getSavedFolders);
  const [activeFolder, setActiveFolder] = useState<string>('All Saved');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state when custom events fire
  useEffect(() => {
    const handleSavedChange = () => {
      setSavedItems(getSavedItems());
    };
    const handleFoldersChange = () => {
      setFolders(getSavedFolders());
    };
    window.addEventListener('saved-posts-changed', handleSavedChange);
    window.addEventListener('saved-folders-changed', handleFoldersChange);
    return () => {
      window.removeEventListener('saved-posts-changed', handleSavedChange);
      window.removeEventListener('saved-folders-changed', handleFoldersChange);
    };
  }, []);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const ok = createSavedFolder(newFolderName.trim());
    if (ok) {
      setFolders(getSavedFolders());
      setActiveFolder(newFolderName.trim());
      onShowToast?.(`Folder "${newFolderName.trim()}" created!`);
      setNewFolderName('');
      setShowNewFolderModal(false);
    } else {
      onShowToast?.('Folder name already exists or invalid.');
    }
  };

  const handleRemoveSaved = (postId: string) => {
    unsavePostItem(postId);
    onShowToast?.('Post removed from Saved.');
  };

  const handleMoveFolder = (postId: string, nextFolder: string) => {
    savePostItem(postId, nextFolder);
    onShowToast?.(`Moved to "${nextFolder}"`);
  };

  // Filter items by folder and search
  const filteredItems = savedItems.filter((item) => {
    if (activeFolder !== 'All Saved' && item.folder !== activeFolder) {
      return false;
    }
    return true;
  });

  // Resolve target posts
  const resolvedPosts = filteredItems
    .map((item) => {
      const found = posts.find((p) => p.id === item.postId);
      return {
        item,
        post: found,
      };
    })
    .filter(({ post, item }) => {
      if (!searchQuery.trim()) return true;
      if (!post) return false;
      const q = searchQuery.toLowerCase();
      return (
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-4 space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Menu</span>
        </button>

        <button
          type="button"
          onClick={() => setShowNewFolderModal(true)}
          className="text-xs font-semibold text-[#076653] hover:underline cursor-pointer flex items-center gap-1 bg-[#EBF7F2] px-2.5 py-1 rounded-lg border border-[#076653]/30"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>New Folder</span>
        </button>
      </div>

      {/* Title & Description */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#076653] flex items-center justify-center">
            <Bookmark className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Saved Posts</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Your private saved posts library. Only you can see what you have saved.
        </p>
      </div>

      {/* Folders Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {folders.map((folder) => {
          const count =
            folder === 'All Saved'
              ? savedItems.length
              : savedItems.filter((i) => i.folder === folder).length;
          const isActive = activeFolder === folder;

          return (
            <button
              key={folder}
              type="button"
              onClick={() => setActiveFolder(folder)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#076653] text-white shadow-xs'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Folder className="w-3 h-3" />
              <span>{folder}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search within saved */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder={`Search in ${activeFolder}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#076653]"
        />
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {resolvedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#076653] flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">No Saved Posts in "{activeFolder}"</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Tap the bookmark icon on any post in your feed to save it privately for later viewing.
              </p>
            </div>
          </div>
        ) : (
          resolvedPosts.map(({ item, post }) => {
            if (!post) {
              return (
                <div
                  key={`deleted-saved-${item.postId}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between text-xs text-gray-500 shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-gray-700">Original post unavailable</span>
                    <p className="text-[11px] text-gray-400">
                      The original author has deleted this post.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSaved(item.postId)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Remove from Saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            const isReposted = isPostRepostedByMe(post.id);

            return (
              <div
                key={`saved-post-card-${post.id}`}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs space-y-3"
              >
                {/* Saved Header with Folder Switcher */}
                <div className="px-4 pt-3 flex items-center justify-between text-xs border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <Bookmark className="w-3.5 h-3.5 text-[#076653] fill-current" />
                    <span>Saved in</span>
                    <select
                      value={item.folder}
                      onChange={(e) => handleMoveFolder(post.id, e.target.value)}
                      className="text-[11px] font-bold text-[#076653] bg-transparent border-0 focus:outline-none cursor-pointer hover:underline"
                    >
                      {folders.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSaved(post.id)}
                    className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Unsave
                  </button>
                </div>

                {/* Post Author Info */}
                <div className="px-4 flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt=""
                    onClick={() => onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <div
                      onClick={() => onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)}
                      className="text-xs font-bold text-gray-900 cursor-pointer hover:underline truncate"
                    >
                      {post.authorName}
                    </div>
                    <div className="text-[10px] text-gray-400">{post.timestamp}</div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-4">
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Post Media */}
                {post.image && (
                  <img
                    src={post.image}
                    alt=""
                    className="w-full max-h-72 object-cover border-y border-gray-100"
                  />
                )}

                {/* Action Bar */}
                <PostActionBar
                  post={post}
                  isLiked={post.likedByMe}
                  likeCount={post.likes || post.likeCount || 0}
                  onLikeClick={() => onLike(post.id)}
                  onCommentClick={() => onCommentClick(post)}
                  onInstantRepost={() => onInstantRepost(post.id)}
                  onUndoRepost={() => onUndoRepost(post.id)}
                  onOpenQuoteRepostModal={() => onQuoteRepostClick(post)}
                  onOpenShareHub={() => onShareClick(post)}
                  onToggleSave={() => handleRemoveSaved(post.id)}
                  onShowToast={onShowToast}
                />
              </div>
            );
          })
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Create Saved Folder</h3>
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Travel, Tech, Recipes"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#076653] text-gray-900"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-1.5 bg-[#076653] hover:bg-[#0C342C] disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
