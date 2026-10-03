import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Folder,
  FolderPlus,
  Trash2,
  Search,
  ExternalLink,
  MessageCircle,
  Heart,
  Repeat2,
  Share2,
  Tag,
  Check,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Post, UserProfile } from '../types';
import {
  getSavedItems,
  getSavedFolders,
  createSavedFolder,
  unsavePostItem,
  savePostItem,
  SavedItem,
} from '../utils/savedPostsStorage';

interface SavedPostsScreenProps {
  posts: Post[];
  profile: UserProfile;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
  onClose?: () => void;
  onShowToast?: (message: string) => void;
}

export default function SavedPostsScreen({
  posts,
  profile,
  onViewProfile,
  onClose,
  onShowToast,
}: SavedPostsScreenProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => getSavedItems());
  const [folders, setFolders] = useState<string[]>(() => getSavedFolders());
  const [activeFolder, setActiveFolder] = useState<string>('All Saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingPostFolderId, setEditingPostFolderId] = useState<string | null>(null);

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
    const success = createSavedFolder(newFolderName.trim());
    if (success) {
      setFolders(getSavedFolders());
      setActiveFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
      onShowToast?.(`Folder "${newFolderName.trim()}" created`);
    } else {
      onShowToast?.('Folder name already exists or invalid');
    }
  };

  const handleUnsave = (postId: string) => {
    unsavePostItem(postId);
    setSavedItems(getSavedItems());
    onShowToast?.('Post removed from Saved');
  };

  const handleChangePostFolder = (postId: string, newFolder: string) => {
    savePostItem(postId, newFolder);
    setSavedItems(getSavedItems());
    setEditingPostFolderId(null);
    onShowToast?.(`Moved to ${newFolder}`);
  };

  // Find posts matching the saved items
  const savedPostMap = new Map<string, SavedItem>();
  savedItems.forEach((item) => {
    savedPostMap.set(item.postId, item);
  });

  const savedPostsWithMeta = posts
    .filter((p) => savedPostMap.has(p.id))
    .map((p) => ({
      post: p,
      meta: savedPostMap.get(p.id)!,
    }));

  const filteredPosts = savedPostsWithMeta.filter(({ post, meta }) => {
    const matchesFolder = activeFolder === 'All Saved' || meta.folder === activeFolder;
    const matchesSearch =
      !searchQuery.trim() ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#F3F4F6] min-h-screen" id="saved-posts-screen">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-[#EBF7F2] text-[#076653] flex items-center justify-center font-bold">
              <Bookmark className="w-4 h-4 fill-[#076653]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">Saved Posts</h2>
              <p className="text-[11px] text-gray-500">
                {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'} saved privately
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingFolder((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF7F2] text-[#076653] hover:bg-[#076653] hover:text-[#E3EF26] text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#076653]/20"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>
        </div>

        {/* Create Folder Form Dropdown */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
            <input
              type="text"
              placeholder="Folder name (e.g. Recipes, Tech)..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#076653]"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newFolderName.trim()}
              className="px-3 py-1.5 bg-[#076653] text-[#E3EF26] font-bold text-xs rounded-lg hover:bg-[#065042] transition-colors cursor-pointer disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Search within saved */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search saved posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#076653] focus:bg-white"
          />
        </div>

        {/* Folder Filter Tabs */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#076653] text-[#E3EF26] shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{folder}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Post List */}
      <div className="p-4 space-y-3 max-w-3xl mx-auto w-full">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">
              {searchQuery ? 'No matching saved posts found' : `No posts saved in "${activeFolder}"`}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              When you see a post you want to revisit, tap the 🔖 <span className="font-semibold">Save</span> button on the action bar to store it here privately.
            </p>
          </div>
        ) : (
          filteredPosts.map(({ post, meta }) => {
            const isEditingFolder = editingPostFolderId === post.id;
            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-sm transition-shadow"
              >
                {/* Saved Item Header with Folder Badge and Actions */}
                <div className="px-4 py-2.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF7F2] text-[#076653]">
                      <Folder className="w-2.5 h-2.5" /> {meta.folder}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPostFolderId(isEditingFolder ? null : post.id)
                      }
                      className="text-[10px] font-semibold text-gray-500 hover:text-gray-900 hover:underline cursor-pointer"
                    >
                      Change folder
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnsave(post.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Unsave</span>
                  </button>
                </div>

                {/* Change Folder Dropdown */}
                {isEditingFolder && (
                  <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] font-bold text-blue-900">Move to:</span>
                    {folders.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => handleChangePostFolder(post.id, f)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          meta.folder === f
                            ? 'bg-[#076653] text-[#E3EF26]'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}

                {/* Post Creator */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      onClick={() =>
                        onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)
                      }
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#076653]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4
                        onClick={() =>
                          onViewProfile?.(post.authorName, post.authorAvatar, post.authorId)
                        }
                        className="text-xs font-bold text-gray-900 cursor-pointer hover:underline hover:text-[#076653]"
                      >
                        {post.authorName}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {post.timestamp} · Saved {new Date(meta.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <p className="text-xs text-gray-800 leading-relaxed mb-3">
                    {post.content}
                  </p>

                  {/* Post Media if any */}
                  {post.image && (
                    <div className="rounded-xl overflow-hidden max-h-60 bg-zinc-950 mb-3 flex items-center justify-center">
                      <img
                        src={post.image}
                        alt=""
                        className="w-full h-full object-cover max-h-60"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Stats summary */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-[11px] text-gray-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-[#076653]" /> {post.likes || 0} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-gray-500" /> {post.comments?.length || 0} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="w-3.5 h-3.5 text-gray-500" /> {post.repostCount || 0} reposts
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-gray-500" /> {post.shares || 0} shares
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
