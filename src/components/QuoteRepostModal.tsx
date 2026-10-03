import React, { useState } from 'react';
import { X, Repeat2, Lock, Globe } from 'lucide-react';
import { Post, UserProfile } from '../types';

interface QuoteRepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  profile: UserProfile;
  onSubmitQuoteRepost: (postId: string, thoughts: string) => void;
  onShowToast?: (message: string) => void;
}

export default function QuoteRepostModal({
  isOpen,
  onClose,
  post,
  profile,
  onSubmitQuoteRepost,
  onShowToast,
}: QuoteRepostModalProps) {
  const [thoughts, setThoughts] = useState('');
  const [audience, setAudience] = useState<'Public' | 'Connections'>('Public');

  if (!isOpen || !post) return null;

  const isPrivate = post.postType === 'Private' || post.postType === 'Subscriber';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughts.trim()) {
      onShowToast?.('Please write your thoughts before reposting.');
      return;
    }

    if (isPrivate) {
      onShowToast?.('Cannot repost private or restricted content.');
      return;
    }

    onSubmitQuoteRepost(post.id, thoughts.trim());
    setThoughts('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#EBF7F2] text-[#076653] flex items-center justify-center font-bold">
              <Repeat2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Repost with your thoughts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {/* User author header */}
          <div className="flex items-center gap-2.5">
            <img
              src={profile.avatar}
              alt=""
              className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-xs font-bold text-gray-900 block">{profile.name}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as any)}
                  className="text-[10px] font-semibold text-gray-600 bg-gray-100 rounded-md px-1.5 py-0.5 border border-gray-200 focus:outline-none"
                >
                  <option value="Public">🌍 Public</option>
                  <option value="Connections">👥 Connections only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Thoughts Textarea */}
          <textarea
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            rows={3}
            placeholder="Add your thoughts or commentary..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#076653] focus:bg-white resize-none"
            autoFocus
          />

          {/* Embedded Original Post Card */}
          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={post.authorAvatar}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-gray-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-gray-900">{post.authorName}</span>
                <span className="text-[10px] text-gray-400">· {post.timestamp}</span>
              </div>
              {post.postType === 'Private' ? (
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Private
                </span>
              ) : (
                <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                  <Globe className="w-2.5 h-2.5" /> Public
                </span>
              )}
            </div>

            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
              {post.content}
            </p>

            {post.image && (
              <div className="relative rounded-lg overflow-hidden max-h-40 bg-zinc-900">
                <img
                  src={post.image}
                  alt=""
                  className="w-full h-full object-cover max-h-40"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!thoughts.trim()}
              className="px-5 py-2 bg-[#076653] text-[#E3EF26] text-xs font-bold rounded-xl hover:bg-[#065042] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Repeat2 className="w-4 h-4" /> Repost
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
