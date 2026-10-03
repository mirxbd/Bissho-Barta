import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Bookmark,
  Edit3,
  Undo2,
  Send,
  Share,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post } from '../types';

interface PostActionBarProps {
  post: Post;
  currentUserId?: string;
  isLiked?: boolean;
  likeCount?: number;
  isPoppingLike?: boolean;
  onLikeClick: () => void;
  onCommentClick: () => void;
  onInstantRepost: () => void;
  onUndoRepost: () => void;
  onOpenQuoteRepostModal: () => void;
  onOpenShareHub: (initialSection?: 'none' | 'connections' | 'app') => void;
  onToggleSave: () => void;
  onShowToast?: (message: string) => void;
}

export default function PostActionBar({
  post,
  currentUserId = 'user_me',
  isLiked = false,
  likeCount = 0,
  isPoppingLike = false,
  onLikeClick,
  onCommentClick,
  onInstantRepost,
  onUndoRepost,
  onOpenQuoteRepostModal,
  onOpenShareHub,
  onToggleSave,
  onShowToast,
}: PostActionBarProps) {
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const repostMenuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  const isReposted = !!post.isReposted;
  const repostCount = post.repostCount || 0;
  const isSaved = !!post.isSaved;
  const saveCount = post.saveCount || 0;
  const shareCount = post.shareCount !== undefined ? post.shareCount : (post.shares || 0);
  const commentCount = post.comments?.length || post.commentCount || 0;

  const isPrivate = post.postType === 'Private' || post.postType === 'Subscriber';

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (repostMenuRef.current && !repostMenuRef.current.contains(event.target as Node)) {
        setShowRepostMenu(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }
    if (showRepostMenu || showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRepostMenu, showShareMenu]);

  const handleRepostButtonClick = () => {
    if (isPrivate) {
      onShowToast?.('🔒 Private posts cannot be reposted to protect creator privacy.');
      return;
    }
    setShowShareMenu(false);
    setShowRepostMenu((prev) => !prev);
  };

  const handleInstantRepostAction = () => {
    setShowRepostMenu(false);
    if (isReposted) {
      onUndoRepost();
      onShowToast?.('Repost removed from your feed.');
    } else {
      onInstantRepost();
      onShowToast?.('Reposted to your feed!');
    }
  };

  const handleQuoteAction = () => {
    setShowRepostMenu(false);
    onOpenQuoteRepostModal();
  };

  const handleShareButtonClick = () => {
    setShowRepostMenu(false);
    setShowShareMenu((prev) => !prev);
  };

  const handleCopyLinkAction = async () => {
    setShowShareMenu(false);
    const postUrl = `${window.location.origin}/#post-${post.id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const input = document.createElement('input');
        input.value = postUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      onShowToast?.('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onShowToast?.('Could not copy link');
    }
  };

  const handleNativeShareAction = async () => {
    setShowShareMenu(false);
    const postUrl = `${window.location.origin}/#post-${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.content.slice(0, 100),
          url: postUrl,
        });
        onShowToast?.('Shared to app!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onOpenShareHub('app');
        }
      }
    } else {
      onOpenShareHub('app');
    }
  };

  const handleSaveClick = () => {
    onToggleSave();
    if (!isSaved) {
      onShowToast?.('Post saved privately to your collection.');
    } else {
      onShowToast?.('Post removed from Saved.');
    }
  };

  return (
    <div className="flex flex-col select-none" id={`post-action-bar-container-${post.id}`}>
      {/* Social engagement stats bar: ONLY ICONS + Numbers (No text words) */}
      {(likeCount > 0 || commentCount > 0 || repostCount > 0 || shareCount > 0) && (
        <div className="flex items-center justify-between px-3 py-1 text-xs text-gray-500 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-1.5">
            {likeCount > 0 && (
              <span className="flex items-center gap-1 font-semibold text-gray-700 text-[10px]">
                <Heart className="w-3 h-3 fill-[#076653] text-[#076653]" />
                <span>{likeCount}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-gray-400" />
                <span>{commentCount}</span>
              </span>
            )}
            {repostCount > 0 && (
              <span className="flex items-center gap-1">
                <Repeat2 className="w-3 h-3 text-gray-400" />
                <span>{repostCount}</span>
              </span>
            )}
            {shareCount > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="w-3 h-3 text-gray-400" />
                <span>{shareCount}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 5-Item Post Action Bar: ONLY ICONS - MORE SMALL ICONS */}
      <div
        className="relative flex justify-around items-center py-1 px-1 text-gray-600 border-b border-gray-100 bg-gray-50/40"
        id={`post-action-bar-${post.id}`}
      >
        {/* 1. ❤️ LIKE - Only Icon, More Small */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={onLikeClick}
          className={`relative flex-1 flex justify-center items-center py-1 rounded-md transition-all duration-200 cursor-pointer ${
            isLiked
              ? 'bg-[#EBF7F2] text-[#076653] ring-1 ring-[#076653]/30 shadow-2xs'
              : 'text-gray-500 hover:bg-[#EBF7F2]/60 hover:text-[#076653]'
          } ${isPoppingLike ? 'animate-like-btn-pop bg-[#d4f4e7]' : ''}`}
          id={`like-btn-${post.id}`}
          title={isLiked ? 'Unlike' : 'Like'}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <span className="relative inline-flex items-center justify-center">
            {isPoppingLike && (
              <span className="absolute inset-0 rounded-full border border-[#076653] animate-like-ring pointer-events-none" />
            )}
            <Heart
              className={`w-3.5 h-3.5 transition-all duration-200 ${
                isLiked
                  ? 'fill-[#076653] text-[#076653] scale-105 drop-shadow-[0_1px_2px_rgba(7,102,83,0.3)]'
                  : ''
              } ${isPoppingLike ? 'animate-like-pop text-[#076653]' : ''}`}
            />
          </span>
        </motion.button>

        {/* 2. 💬 COMMENT - Only Icon, More Small */}
        <button
          type="button"
          onClick={onCommentClick}
          className="flex-1 flex justify-center items-center py-1 hover:bg-gray-100/80 rounded-md transition-colors cursor-pointer text-gray-500 hover:text-[#076653]"
          id={`comment-trigger-btn-${post.id}`}
          title="Comment"
          aria-label="Comment"
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>

        {/* 3. 🔄 REPOST - Only Icon, More Small + Repost Popover */}
        <div className="relative flex-1 flex justify-center" ref={repostMenuRef}>
          <button
            type="button"
            onClick={handleRepostButtonClick}
            className={`w-full flex justify-center items-center py-1 rounded-md transition-colors cursor-pointer ${
              isReposted
                ? 'bg-[#EBF7F2] text-[#076653] ring-1 ring-[#076653]/30'
                : 'hover:bg-gray-100/80 text-gray-500 hover:text-[#076653]'
            }`}
            id={`repost-btn-${post.id}`}
            title={isReposted ? 'Undo repost or quote' : 'Repost'}
            aria-label={isReposted ? 'Undo repost' : 'Repost'}
          >
            <Repeat2 className={`w-3.5 h-3.5 transition-transform ${isReposted ? 'text-[#076653] scale-105' : ''}`} />
          </button>

          {/* Repost Options Popover Menu */}
          <AnimatePresence>
            {showRepostMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-40 text-xs"
              >
                {/* Instant Repost / Undo */}
                <button
                  type="button"
                  onClick={handleInstantRepostAction}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {isReposted ? (
                    <>
                      <Undo2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <div>
                        <p className="font-bold text-red-600 text-[11px]">Undo Repost</p>
                        <p className="text-[9px] text-gray-400">Remove from feed</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Repeat2 className="w-3.5 h-3.5 text-[#076653] shrink-0" />
                      <div>
                        <p className="font-bold text-gray-800 text-[11px]">Repost</p>
                        <p className="text-[9px] text-gray-400">Share to your feed</p>
                      </div>
                    </>
                  )}
                </button>

                {/* Repost with thoughts */}
                <button
                  type="button"
                  onClick={handleQuoteAction}
                  className="w-full px-2.5 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer border-t border-gray-100"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#076653] shrink-0" />
                  <div>
                    <p className="font-bold text-gray-800 text-[11px]">Repost with thoughts</p>
                    <p className="text-[9px] text-gray-400">Add commentary</p>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. ↗ SHARE - Only Icon, More Small + Under Share Dropdown Menu */}
        <div className="relative flex-1 flex justify-center" ref={shareMenuRef}>
          <button
            type="button"
            onClick={handleShareButtonClick}
            className={`w-full flex justify-center items-center py-1 rounded-md transition-colors cursor-pointer ${
              showShareMenu
                ? 'bg-[#EBF7F2] text-[#076653] ring-1 ring-[#076653]/30'
                : 'hover:bg-gray-100/80 text-gray-500 hover:text-gray-900'
            }`}
            id={`share-btn-${post.id}`}
            title="Share"
            aria-label="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* UNDER SHARE: SMALL TEXT LISTED */}
          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full mb-1.5 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-40 text-xs divide-y divide-gray-100"
                id={`under-share-menu-${post.id}`}
              >
                {/* 1. SEND TO CONNECTION */}
                <button
                  type="button"
                  onClick={() => {
                    setShowShareMenu(false);
                    onOpenShareHub('connections');
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <Send className="w-3.5 h-3.5 text-[#076653] shrink-0" />
                  <span className="font-semibold text-gray-800 text-[11px]">Send to Connection</span>
                </button>

                {/* 2. SHARE TO APP */}
                <button
                  type="button"
                  onClick={handleNativeShareAction}
                  className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <Share className="w-3.5 h-3.5 text-gray-700 shrink-0" />
                  <span className="font-semibold text-gray-800 text-[11px]">Share to App</span>
                </button>

                {/* 3. COPY LINK */}
                <button
                  type="button"
                  onClick={handleCopyLinkAction}
                  className="w-full px-3 py-1.5 text-left hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  )}
                  <span className={`font-semibold text-[11px] ${copiedLink ? 'text-green-700' : 'text-gray-800'}`}>
                    {copiedLink ? 'Link Copied!' : 'Copy Link'}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 5. 🔖 SAVE - Only Icon, More Small */}
        <button
          type="button"
          onClick={handleSaveClick}
          className={`flex-1 flex justify-center items-center py-1 rounded-md transition-colors cursor-pointer ${
            isSaved
              ? 'bg-[#EBF7F2] text-[#076653] ring-1 ring-[#076653]/30'
              : 'hover:bg-gray-100/80 text-gray-500 hover:text-[#076653]'
          }`}
          id={`save-btn-${post.id}`}
          title={isSaved ? 'Remove from Saved' : 'Save post privately'}
          aria-label={isSaved ? 'Saved' : 'Save'}
        >
          <Bookmark
            className={`w-3.5 h-3.5 transition-all ${
              isSaved ? 'fill-[#076653] text-[#076653] scale-105' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}
