import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Share,
  Copy,
  Check,
  Search,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Post, Friend } from '../types';

interface ShareHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  friends: Friend[];
  initialSection?: 'none' | 'connections' | 'app';
  onShareComplete: (postId: string, method: string) => void;
  onShowToast?: (message: string) => void;
}

export default function ShareHubModal({
  isOpen,
  onClose,
  post,
  friends,
  initialSection = 'none',
  onShareComplete,
  onShowToast,
}: ShareHubModalProps) {
  // Expanded inline sections in the listed view
  const [expandedSection, setExpandedSection] = useState<'none' | 'connections' | 'app'>(initialSection);

  useEffect(() => {
    if (isOpen) {
      setExpandedSection(initialSection);
    }
  }, [isOpen, initialSection]);

  const [connectionSearch, setConnectionSearch] = useState('');
  const [sentConnections, setSentConnections] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !post) return null;

  const isPrivate = post.postType === 'Private';
  const postUrl = `${window.location.origin}/#post-${post.id}`;

  const toggleSection = (section: 'connections' | 'app') => {
    setExpandedSection((prev) => (prev === section ? 'none' : section));
  };

  const handleCopyLink = async () => {
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
      onShareComplete(post.id, 'copy_link');
      onShowToast?.('Link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onShowToast?.('Could not copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.content.slice(0, 100),
          url: postUrl,
        });
        onShareComplete(post.id, 'native_share');
        onShowToast?.('Shared to app successfully!');
        onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleExternalFallback('whatsapp');
        }
      }
    } else {
      toggleSection('app');
    }
  };

  const handleExternalFallback = (service: 'whatsapp' | 'twitter' | 'telegram' | 'email') => {
    const text = encodeURIComponent(`Post by ${post.authorName}: "${post.content.slice(0, 80)}"`);
    const encodedUrl = encodeURIComponent(postUrl);

    let targetUrl = '';
    if (service === 'whatsapp') {
      targetUrl = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
    } else if (service === 'twitter') {
      targetUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
    } else if (service === 'telegram') {
      targetUrl = `https://t.me/share/url?url=${encodedUrl}&text=${text}`;
    } else if (service === 'email') {
      targetUrl = `mailto:?subject=${encodeURIComponent(`Post by ${post.authorName}`)}&body=${text}%0A%0A${encodedUrl}`;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      onShareComplete(post.id, `external_${service}`);
      onClose();
    }
  };

  const handleSendToConnection = (friendId: string, friendName: string) => {
    setSentConnections((prev) => ({ ...prev, [friendId]: true }));
    onShareComplete(post.id, 'send_connection');
    onShowToast?.(`Sent to ${friendName}`);
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(connectionSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-2xs">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
        id="share-hub-modal"
      >
        {/* Header - Small text and small close icon */}
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 bg-gray-50/70">
          <span className="font-bold text-gray-900 text-xs tracking-tight">Share</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compact Post Preview */}
        <div className="px-3.5 py-1.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2 text-xs">
          <img
            src={post.authorAvatar}
            alt=""
            className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1 truncate">
            <span className="font-bold text-gray-900 text-[10px] mr-1.5">{post.authorName}:</span>
            <span className="text-[10px] text-gray-600 italic truncate">
              {post.content ? `"${post.content.slice(0, 50)}..."` : 'Photo/Video'}
            </span>
          </div>
          {isPrivate && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded shrink-0">
              <Lock className="w-2.5 h-2.5" /> Private
            </span>
          )}
        </div>

        {/* ALL SMALL TEXT LISTED SHARE MENU */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 text-xs" id="share-options-list">
          {/* 1. Send to Connection */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => toggleSection('connections')}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[#076653] shrink-0" />
                <span className="font-semibold text-gray-800 text-[11px]">Send to Connection</span>
              </div>
              {expandedSection === 'connections' ? (
                <ChevronUp className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              )}
            </button>

            {/* Inline Connections List */}
            {expandedSection === 'connections' && (
              <div className="px-3 pb-2 pt-1 space-y-1.5 bg-gray-50/70 border-t border-gray-100">
                <div className="relative">
                  <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search connection..."
                    value={connectionSearch}
                    onChange={(e) => setConnectionSearch(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-800 focus:outline-none focus:border-[#076653]"
                  />
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 bg-white border border-gray-200 rounded-lg">
                  {filteredFriends.length === 0 ? (
                    <p className="text-[10px] text-gray-400 py-2 text-center">No connection found</p>
                  ) : (
                    filteredFriends.map((f) => {
                      const isSent = !!sentConnections[f.id];
                      return (
                        <div key={f.id} className="p-1.5 px-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={f.avatar}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover border border-gray-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[10px] font-semibold text-gray-800 truncate">{f.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendToConnection(f.id, f.name)}
                            disabled={isSent}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                              isSent ? 'bg-green-100 text-green-800' : 'bg-[#076653] text-[#E3EF26] hover:bg-[#065042]'
                            }`}
                          >
                            {isSent ? 'Sent ✓' : 'Send'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Share to App */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Share className="w-3.5 h-3.5 text-gray-700 shrink-0" />
                <span className="font-semibold text-gray-800 text-[11px]">Share to App</span>
              </div>
              <span className="text-[9px] text-gray-400 font-medium">Apps</span>
            </button>

            {/* Inline External Fallback buttons */}
            {expandedSection === 'app' && (
              <div className="px-3 pb-2 pt-1 flex items-center gap-1.5 bg-gray-50/70 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleExternalFallback('whatsapp')}
                  className="flex-1 py-1 px-1.5 rounded bg-white hover:bg-green-50 border border-gray-200 text-[9px] font-bold text-green-700 text-center cursor-pointer"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleExternalFallback('twitter')}
                  className="flex-1 py-1 px-1.5 rounded bg-white hover:bg-gray-100 border border-gray-200 text-[9px] font-bold text-gray-900 text-center cursor-pointer"
                >
                  X (Twitter)
                </button>
                <button
                  type="button"
                  onClick={() => handleExternalFallback('telegram')}
                  className="flex-1 py-1 px-1.5 rounded bg-white hover:bg-blue-50 border border-gray-200 text-[9px] font-bold text-[#229ED9] text-center cursor-pointer"
                >
                  Telegram
                </button>
                <button
                  type="button"
                  onClick={() => handleExternalFallback('email')}
                  className="flex-1 py-1 px-1.5 rounded bg-white hover:bg-gray-100 border border-gray-200 text-[9px] font-bold text-gray-700 text-center cursor-pointer"
                >
                  Email
                </button>
              </div>
            )}
          </div>

          {/* 3. Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-between py-2 px-3 hover:bg-gray-50 text-left transition-colors cursor-pointer group"
            id="share-option-copylink"
          >
            <div className="flex items-center gap-2">
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-600 shrink-0" />
              )}
              <span className={`font-semibold text-[11px] ${copiedLink ? 'text-green-700 font-bold' : 'text-gray-800'}`}>
                {copiedLink ? 'Link Copied!' : 'Copy Link'}
              </span>
            </div>
            {copiedLink && (
              <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1 py-0.2 rounded border border-green-200">
                Copied
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
