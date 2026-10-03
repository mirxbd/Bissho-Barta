import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Post, Story, Friend, Conversation, Notification, UserProfile, Comment, Message, Attachment } from '../types';
import {
  initialPosts,
  initialStories,
  initialFriends,
  initialConversations,
  initialNotifications,
  defaultUserProfile,
  watchPosts as initialWatchPosts
} from '../data/initialData';
import {
  persistPostsWithIndexedDB,
  hydratePostsFromIndexedDB,
  persistStoriesWithIndexedDB,
  hydrateStoriesFromIndexedDB,
  persistProfileWithIndexedDB,
  hydrateProfileFromIndexedDB,
  deletePostMediaFromIndexedDB
} from '../utils/mediaStorage';
import { isPostSaved, savePostItem, unsavePostItem } from '../utils/savedPostsStorage';
import { isPostRepostedByMe, recordUserRepost, removeUserRepost } from '../utils/repostStorage';

export function useAppState() {
  const [storageError, setStorageError] = useState<string | null>(null);

  const triggerStorageError = useCallback((msg: string) => {
    setStorageError(msg);
    setTimeout(() => {
      setStorageError((prev) => (prev === msg ? null : prev));
    }, 5000);
  }, []);

  // Load or initialize state
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated: UserProfile = {
          ...defaultUserProfile,
          ...parsed,
          id: parsed.id || defaultUserProfile.id || 'user_me',
        };
        if (migrated.name === 'Alex Rivera') migrated.name = defaultUserProfile.name;
        if (migrated.location === 'San Francisco, CA') migrated.location = defaultUserProfile.location;
        if (migrated.work === 'Software Engineer at TechCorp') migrated.work = defaultUserProfile.work;
        if (migrated.education === 'Stanford University') migrated.education = defaultUserProfile.education;
        return migrated;
      }
      return defaultUserProfile;
    } catch {
      return defaultUserProfile;
    }
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_posts');
      return saved ? JSON.parse(saved) : initialPosts;
    } catch {
      return initialPosts;
    }
  });

  const [watchPosts, setWatchPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_watch_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 6) {
          return parsed;
        }
      }
    } catch {}
    return initialWatchPosts;
  });

  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_stories');
      return saved ? JSON.parse(saved) : initialStories;
    } catch {
      return initialStories;
    }
  });

  const [friends, setFriends] = useState<Friend[]>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_friends');
      return saved ? JSON.parse(saved) : initialFriends;
    } catch {
      return initialFriends;
    }
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_conversations');
      return saved ? JSON.parse(saved) : initialConversations;
    } catch {
      return initialConversations;
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_notifications');
      const loaded: Notification[] = saved ? JSON.parse(saved) : initialNotifications;
      const seen = new Set<string>();
      return loaded.filter(n => {
        if (!n || !n.id || seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });
    } catch {
      return initialNotifications;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState<'fb' | 'web'>(() => {
    try {
      return (localStorage.getItem('fb_lite_search_source') as 'fb' | 'web') || 'fb';
    } catch {
      return 'fb';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fb_lite_search_source', searchSource);
    } catch (err) {
      triggerStorageError('Failed to save search preference to local storage.');
    }
  }, [searchSource, triggerStorageError]);

  // Hydrate media references from IndexedDB on initial mount
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    hydrateProfileFromIndexedDB(profile)
      .then((hydratedProfile) => {
        setProfile((prev) => ({
          ...prev,
          avatar: hydratedProfile.avatar,
          coverPhoto: hydratedProfile.coverPhoto,
        }));
      })
      .catch(() => {});

    hydratePostsFromIndexedDB(posts)
      .then((hydratedPosts) => {
        setPosts(hydratedPosts);
      })
      .catch(() => {});

    hydratePostsFromIndexedDB(watchPosts)
      .then((hydratedWatch) => {
        setWatchPosts(hydratedWatch);
      })
      .catch(() => {});

    hydrateStoriesFromIndexedDB(stories)
      .then((hydratedStories) => {
        setStories(hydratedStories);
      })
      .catch(() => {});
  }, []);

  // Automatically publish scheduled posts when their scheduled time arrives
  useEffect(() => {
    const checkScheduledPosts = () => {
      const now = Date.now();
      setPosts((prevPosts) => {
        let changed = false;
        const nextPosts = prevPosts.map((post) => {
          if (post.scheduledFor) {
            const scheduledTime = new Date(post.scheduledFor).getTime();
            if (!isNaN(scheduledTime) && scheduledTime <= now && post.isScheduled) {
              changed = true;
              return {
                ...post,
                isScheduled: false,
                scheduledFor: undefined,
                timestamp: 'Just now',
              };
            }
          }
          return post;
        });
        return changed ? nextPosts : prevPosts;
      });
    };

    checkScheduledPosts();
    const intervalId = window.setInterval(checkScheduledPosts, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Debounced non-blocking localStorage + IndexedDB saver with visible error toast on failure
  const saveTimeoutsRef = useRef<{ [key: string]: any }>({});

  const debouncedSafeSave = useCallback((key: string, data: any, delay: number = 300) => {
    if (saveTimeoutsRef.current[key]) {
      clearTimeout(saveTimeoutsRef.current[key]);
    }
    saveTimeoutsRef.current[key] = setTimeout(async () => {
      try {
        let payloadToStore = data;
        if (key === 'fb_lite_posts' || key === 'fb_lite_watch_posts') {
          payloadToStore = await persistPostsWithIndexedDB(data as Post[]);
        } else if (key === 'fb_lite_stories') {
          payloadToStore = await persistStoriesWithIndexedDB(data as Story[]);
        } else if (key === 'fb_lite_profile') {
          payloadToStore = await persistProfileWithIndexedDB(data as UserProfile);
        }

        localStorage.setItem(key, JSON.stringify(payloadToStore));
      } catch (err) {
        triggerStorageError(`Storage limit or write error while saving data (${key}).`);
      }
    }, delay);
  }, [triggerStorageError]);

  // Persist state to localStorage + IndexedDB on changes (debounced)
  useEffect(() => {
    debouncedSafeSave('fb_lite_profile', profile, 200);
  }, [profile, debouncedSafeSave]);

  useEffect(() => {
    debouncedSafeSave('fb_lite_posts', posts, 400);
  }, [posts, debouncedSafeSave]);

  useEffect(() => {
    debouncedSafeSave('fb_lite_watch_posts', watchPosts, 500);
  }, [watchPosts, debouncedSafeSave]);

  useEffect(() => {
    debouncedSafeSave('fb_lite_stories', stories, 400);
  }, [stories, debouncedSafeSave]);

  useEffect(() => {
    debouncedSafeSave('fb_lite_friends', friends, 400);
  }, [friends, debouncedSafeSave]);

  useEffect(() => {
    debouncedSafeSave('fb_lite_conversations', conversations, 400);
  }, [conversations, debouncedSafeSave]);

  useEffect(() => {
    debouncedSafeSave('fb_lite_notifications', notifications, 400);
  }, [notifications, debouncedSafeSave]);

  const currentUserId = profile.id || 'user_me';

  // Operations
  const addPost = useCallback((
    content: string, 
    image?: string, 
    attachment?: Attachment,
    options?: {
      postType?: 'Public' | 'Subscriber' | 'Private';
      taggedPeople?: string[];
      scheduledFor?: string;
      attachments?: Attachment[];
    }
  ) => {
    let formattedTimestamp = "Just now";
    let isFutureScheduled = false;

    if (options?.scheduledFor) {
      try {
        const dateObj = new Date(options.scheduledFor);
        if (!isNaN(dateObj.getTime())) {
          isFutureScheduled = dateObj.getTime() > Date.now();
          formattedTimestamp = isFutureScheduled
            ? `Scheduled for ${dateObj.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })} at ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "Just now";
        } else {
          formattedTimestamp = `Scheduled for ${options.scheduledFor}`;
          isFutureScheduled = true;
        }
      } catch {
        formattedTimestamp = `Scheduled for ${options.scheduledFor}`;
        isFutureScheduled = true;
      }
    }

    const effectiveAttachments = options?.attachments && options.attachments.length > 0
      ? options.attachments
      : attachment
        ? [attachment]
        : (image ? [{ name: 'image.jpg', size: '', type: 'image', url: image }] : undefined);

    const firstAttachment = effectiveAttachments && effectiveAttachments.length > 0 ? effectiveAttachments[0] : attachment;
    const firstImage = image || (firstAttachment?.type === 'image' ? firstAttachment.url : undefined);

    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUserId,
      authorName: profile.name,
      authorAvatar: profile.avatar,
      timestamp: formattedTimestamp,
      content,
      image: firstImage,
      likes: 0,
      likedByMe: false,
      shares: 0,
      comments: [],
      attachment: firstAttachment,
      attachments: effectiveAttachments,
      postType: options?.postType || 'Public',
      taggedPeople: options?.taggedPeople,
      scheduledFor: isFutureScheduled ? options?.scheduledFor : undefined,
      isScheduled: isFutureScheduled
    };
    setPosts(prev => [newPost, ...prev]);
  }, [currentUserId, profile.name, profile.avatar]);

  const publishScheduledPost = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isScheduled: false, scheduledFor: undefined, timestamp: 'Just now' }
          : p
      )
    );
  }, []);

  const addSharedPost = useCallback((postId: string) => {
    const originalPost =
      posts.find((p) => p.id === postId) || watchPosts.find((p) => p.id === postId);
    if (!originalPost) return;

    // 1. Increase the original post's shares count
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p))
    );
    setWatchPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p))
    );

    // 2. Create a shared post on the timeline using the postId
    const sharedTimelinePost: Post = {
      id: `post_share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUserId,
      authorName: profile.name,
      authorAvatar: profile.avatar,
      timestamp: 'Just now',
      content: `Shared ${originalPost.authorName}'s post`,
      likes: 0,
      likedByMe: false,
      shares: 0,
      comments: [],
      postType: 'Public',
      sharedFromPostId: originalPost.id,
      sharedPost: {
        id: originalPost.id,
        authorId: originalPost.authorId,
        authorName: originalPost.authorName,
        authorAvatar: originalPost.authorAvatar,
        content: originalPost.content,
        image: originalPost.image || (originalPost.attachment?.type === 'image' ? originalPost.attachment.url : undefined),
        videoUrl: originalPost.videoUrl || (originalPost.attachment?.type === 'video' ? originalPost.attachment.url : undefined),
        timestamp: originalPost.timestamp,
      },
    };

    setPosts((prev) => [sharedTimelinePost, ...prev]);
  }, [posts, watchPosts, currentUserId, profile.name, profile.avatar]);

  const likePost = useCallback((postId: string, isWatchPost = false) => {
    const updateFn = (prevPosts: Post[]) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const likedByMe = !post.likedByMe;
          const nextLikes = likedByMe ? post.likes + 1 : Math.max(0, post.likes - 1);
          return {
            ...post,
            likedByMe,
            isLiked: likedByMe,
            likes: nextLikes,
            likeCount: nextLikes,
          };
        }
        return post;
      });

    if (isWatchPost) {
      setWatchPosts(updateFn);
    } else {
      setPosts(updateFn);
    }
  }, []);

  const repostPost = useCallback((postId: string, quoteContent?: string) => {
    const originalPost =
      posts.find((p) => p.id === postId) || watchPosts.find((p) => p.id === postId);
    if (!originalPost) return false;

    // Audience protection: Never repost private / subscriber content to public feed
    if (originalPost.postType === 'Private' || originalPost.postType === 'Subscriber') {
      return false;
    }

    // Prevent duplicate reposts by the same user
    if (isPostRepostedByMe(originalPost.id, currentUserId)) {
      return false;
    }

    const repostPostId = `post_repost_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const isQuote = !!quoteContent && quoteContent.trim().length > 0;

    const newRepostPost: Post = {
      id: repostPostId,
      authorId: currentUserId,
      authorName: profile.name,
      authorAvatar: profile.avatar,
      timestamp: 'Just now',
      content: isQuote ? quoteContent! : originalPost.content,
      image: isQuote ? undefined : originalPost.image,
      attachment: isQuote ? undefined : originalPost.attachment,
      attachments: isQuote ? undefined : originalPost.attachments,
      likes: 0,
      likedByMe: false,
      likeCount: 0,
      isLiked: false,
      shares: 0,
      shareCount: 0,
      repostCount: 0,
      isReposted: false,
      saveCount: 0,
      isSaved: false,
      comments: [],
      commentCount: 0,
      postType: 'Public',
      originalPostId: originalPost.id,
      repostedBy: {
        userId: currentUserId,
        name: profile.name,
        avatar: profile.avatar,
        timestamp: 'Just now',
      },
      quoteContent: isQuote ? quoteContent : undefined,
      isQuoteRepost: isQuote,
      sharedFromPostId: originalPost.id,
      sharedPost: {
        id: originalPost.id,
        authorId: originalPost.authorId,
        authorName: originalPost.authorName,
        authorAvatar: originalPost.authorAvatar,
        content: originalPost.content,
        image: originalPost.image,
        videoUrl: originalPost.videoUrl,
        timestamp: originalPost.timestamp,
      },
    };

    recordUserRepost(originalPost.id, repostPostId, quoteContent, currentUserId);

    setPosts((prev) => {
      const updated = prev.map((p) =>
        p.id === originalPost.id
          ? {
              ...p,
              repostCount: (p.repostCount || 0) + 1,
              isReposted: true,
            }
          : p
      );
      return [newRepostPost, ...updated];
    });

    setWatchPosts((prev) =>
      prev.map((p) =>
        p.id === originalPost.id
          ? {
              ...p,
              repostCount: (p.repostCount || 0) + 1,
              isReposted: true,
            }
          : p
      )
    );

    return true;
  }, [posts, watchPosts, currentUserId, profile.name, profile.avatar]);

  const undoRepost = useCallback((postId: string) => {
    const associatedRepostPostId = removeUserRepost(postId, currentUserId);

    setPosts((prev) => {
      const withoutRepost = associatedRepostPostId
        ? prev.filter((p) => p.id !== associatedRepostPostId)
        : prev;
      return withoutRepost.map((p) =>
        p.id === postId
          ? {
              ...p,
              repostCount: Math.max(0, (p.repostCount || 0) - 1),
              isReposted: false,
            }
          : p
      );
    });

    setWatchPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              repostCount: Math.max(0, (p.repostCount || 0) - 1),
              isReposted: false,
            }
          : p
      )
    );
  }, [currentUserId]);

  const toggleSavePost = useCallback((postId: string, folder = 'All Saved') => {
    const currentlySaved = isPostSaved(postId, currentUserId);
    if (currentlySaved) {
      unsavePostItem(postId, currentUserId);
      const updateFn = (prev: Post[]) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isSaved: false,
                saveCount: Math.max(0, (p.saveCount || 0) - 1),
              }
            : p
        );
      setPosts(updateFn);
      setWatchPosts(updateFn);
      return false;
    } else {
      savePostItem(postId, folder, currentUserId);
      const updateFn = (prev: Post[]) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isSaved: true,
                saveCount: (p.saveCount || 0) + 1,
              }
            : p
        );
      setPosts(updateFn);
      setWatchPosts(updateFn);
      return true;
    }
  }, [currentUserId]);

  const sharePost = useCallback((postId: string, method = 'share') => {
    const updateFn = (prev: Post[]) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextShares = (p.shares || 0) + 1;
          return {
            ...p,
            shares: nextShares,
            shareCount: nextShares,
          };
        }
        return p;
      });
    setPosts(updateFn);
    setWatchPosts(updateFn);
  }, []);

  const addComment = useCallback((postId: string, commentText: string, isWatchPost = false, replyToId?: string, replyToName?: string) => {
    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      authorId: currentUserId,
      authorName: profile.name,
      authorAvatar: profile.avatar,
      content: commentText,
      timestamp: "Just now",
      replyToId,
      replyToName
    };

    const updateFn = (prevPosts: Post[]) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      });

    if (isWatchPost) {
      setWatchPosts(updateFn);
    } else {
      setPosts(updateFn);
    }
  }, [currentUserId, profile.name, profile.avatar]);

  const deletePost = useCallback((postId: string, isWatchPost = false) => {
    const targetPost = isWatchPost
      ? watchPosts.find((p) => p.id === postId)
      : posts.find((p) => p.id === postId);

    if (targetPost) {
      deletePostMediaFromIndexedDB(targetPost).catch(() => {
        triggerStorageError('Failed to clean up stored media for deleted post.');
      });
    }

    if (isWatchPost) {
      setWatchPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  }, [posts, watchPosts, triggerStorageError]);

  const handleFriendAction = useCallback((friendId: string, action: 'accept' | 'decline' | 'add' | 'remove') => {
    // Read the friend from current state instead of assigning inside setFriends updater
    const targetFriend = friends.find(f => f.id === friendId);

    setFriends((prevFriends) =>
      prevFriends.map((f) => {
        if (f.id === friendId) {
          if (action === 'accept') {
            return { ...f, status: 'friend' };
          }
          if (action === 'decline' || action === 'remove') {
            return { ...f, status: 'none' };
          }
          if (action === 'add') {
            return { ...f, status: 'pending_outgoing' };
          }
        }
        return f;
      })
    );

    if (action === 'accept' || action === 'decline') {
      setNotifications((prev) => {
        const filtered = prev.filter(
          n => !(n.type === 'friend_request' && targetFriend && (n.actorId === targetFriend.id || n.actorName === targetFriend.name))
        );

        if (action === 'accept' && targetFriend) {
          const now = Date.now();
          const newNotification: Notification = {
            id: `notif_${now}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'friend_accept',
            actorId: targetFriend.id,
            actorName: targetFriend.name,
            actorAvatar: targetFriend.avatar,
            timestamp: 'Just now',
            read: false,
            summaryText: `and you are now friends.`
          };

          if (filtered.some(n => n.id === newNotification.id)) {
            return filtered;
          }
          return [newNotification, ...filtered];
        }

        return filtered;
      });
    }

    if (action === 'accept') {
      const now = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 9);
      const friendObj: Friend = targetFriend
        ? { ...targetFriend, status: 'friend' }
        : {
            id: friendId,
            name: 'Friend',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
            mutualFriends: 1,
            status: 'friend',
            isOnline: true
          };

      setConversations((prev) => {
        if (prev.some(c => c.friend.id === friendId)) return prev;
        return [
          {
            id: `c_${now}_${randomSuffix}`,
            friend: friendObj,
            unread: false,
            messages: [
              { id: `m_${now}_${randomSuffix}`, senderId: friendId, text: `Hey there! We are friends now! 👋`, timestamp: "Just now" }
            ]
          },
          ...prev
        ];
      });
    }
  }, [friends]);

  // Track timeouts to avoid memory leaks
  const activeTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = activeTimersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  const ensureConversation = useCallback((userName: string, userAvatar?: string, friendId?: string): string => {
    const normalizedName = userName.trim().toLowerCase();
    const existingConv = conversations.find(
      (c) =>
        (friendId && c.friend.id === friendId) ||
        c.friend.name.trim().toLowerCase() === normalizedName
    );
    if (existingConv) {
      return existingConv.friend.id;
    }

    const existingFriend = friends.find(
      (f) =>
        (friendId && f.id === friendId) ||
        f.name.trim().toLowerCase() === normalizedName
    );

    const resolvedFriendId =
      existingFriend?.id ||
      friendId ||
      `user_${normalizedName.replace(/[^a-z0-9]+/g, '_')}`;

    const friendParticipant: Friend = existingFriend || {
      id: resolvedFriendId,
      name: userName,
      avatar:
        userAvatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      mutualFriends: 1,
      status: 'none',
      isOnline: true
    };

    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      friend: friendParticipant,
      unread: false,
      messages: []
    };

    setConversations((prev) => {
      const alreadyExists = prev.some(
        (c) =>
          c.friend.id === resolvedFriendId ||
          c.friend.name.trim().toLowerCase() === normalizedName
      );
      if (alreadyExists) return prev;
      return [newConv, ...prev];
    });

    return resolvedFriendId;
  }, [conversations, friends]);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      senderId: 'me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations((prevConvs) =>
      prevConvs.map((conv) => {
        if (conv.id === conversationId) {
          const timerId = window.setTimeout(() => {
            const replies = [
              "Nice! Let me think about that.",
              "That makes complete sense, thanks for sharing!",
              "Awesome! I'll catch you later.",
              "Haha, that's awesome! 😂",
              "Can we talk about this tomorrow? A bit busy right now!",
              "Oh cool! I didn't know that.",
              "Perfect, let's keep in touch!"
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const replyMsg: Message = {
              id: `msg_reply_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              senderId: conv.friend.id,
              text: randomReply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setConversations((currentConvs) =>
              currentConvs.map((c) => {
                if (c.id === conversationId) {
                  return {
                    ...c,
                    unread: true,
                    messages: [...c.messages, replyMsg]
                  };
                }
                return c;
              })
            );
          }, 1500);

          activeTimersRef.current.push(timerId);

          return {
            ...conv,
            messages: [...conv.messages, newMessage]
          };
        }
        return conv;
      })
    );
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter((n) => n.id !== notificationId));
  }, []);

  const updateUserProfile = useCallback((updatedProfile: UserProfile) => {
    // Compute the new values first, then call each setState separately (no nested setState inside setProfile)
    const userId = profile.id || updatedProfile.id || 'user_me';
    const nextProfile: UserProfile = {
      ...profile,
      ...updatedProfile,
      id: userId,
    };
    const newName = nextProfile.name;
    const newAvatar = nextProfile.avatar;

    // Match user records by id (falling back to previous profile.name only if legacy record lacks authorId)
    const isCurrentUserRecord = (recordId?: string, recordName?: string) => {
      if (recordId) return recordId === userId;
      return recordName === profile.name;
    };

    setProfile(nextProfile);

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        const isUserPost = isCurrentUserRecord(p.authorId, p.authorName);
        const updatedComments = (p.comments || []).map((c) => {
          if (isCurrentUserRecord(c.authorId, c.authorName)) {
            return {
              ...c,
              authorId: userId,
              authorName: newName,
              authorAvatar: newAvatar
            };
          }
          return c;
        });

        return {
          ...p,
          ...(isUserPost ? { authorId: userId, authorName: newName, authorAvatar: newAvatar } : {}),
          comments: updatedComments
        };
      })
    );

    setWatchPosts((prevWatch) =>
      prevWatch.map((p) => {
        const isUserPost = isCurrentUserRecord(p.authorId, p.authorName);
        const updatedComments = (p.comments || []).map((c) => {
          if (isCurrentUserRecord(c.authorId, c.authorName)) {
            return {
              ...c,
              authorId: userId,
              authorName: newName,
              authorAvatar: newAvatar
            };
          }
          return c;
        });

        return {
          ...p,
          ...(isUserPost ? { authorId: userId, authorName: newName, authorAvatar: newAvatar } : {}),
          comments: updatedComments
        };
      })
    );

    setStories((prevStories) =>
      prevStories.map((s) => {
        if (isCurrentUserRecord(s.userId, s.userName)) {
          return {
            ...s,
            userId,
            userName: newName,
            userAvatar: newAvatar
          };
        }
        return s;
      })
    );

    setFriends((prevFriends) =>
      prevFriends.map((f) => {
        if (f.id === userId) {
          return {
            ...f,
            name: newName,
            avatar: newAvatar
          };
        }
        return f;
      })
    );

    setNotifications((prevNotifs) =>
      prevNotifs.map((n) => {
        if (isCurrentUserRecord(n.actorId, n.actorName)) {
          return {
            ...n,
            actorId: userId,
            actorName: newName,
            actorAvatar: newAvatar
          };
        }
        return n;
      })
    );

    setConversations((prevConvs) =>
      prevConvs.map((c) => {
        if (c.friend.id === userId) {
          return {
            ...c,
            friend: {
              ...c.friend,
              name: newName,
              avatar: newAvatar
            }
          };
        }
        return c;
      })
    );
  }, [profile]);

  const viewStory = useCallback((storyId: string) => {
    setStories(prev =>
      prev.map((s) => (s.id === storyId ? { ...s, isUnread: false } : s))
    );
  }, []);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const unreadMessagesCount = useMemo(() => {
    return conversations.filter((c) => c.unread).length;
  }, [conversations]);

  return {
    profile,
    posts,
    watchPosts,
    stories,
    friends,
    conversations,
    notifications,
    searchQuery,
    setSearchQuery,
    searchSource,
    setSearchSource,
    storageError,
    setStorageError,
    clearStorageError: () => setStorageError(null),
    addPost,
    addSharedPost,
    repostPost,
    undoRepost,
    toggleSavePost,
    sharePost,
    publishScheduledPost,
    likePost,
    addComment,
    deletePost,
    handleFriendAction,
    ensureConversation,
    sendMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotification,
    updateUserProfile,
    viewStory,
    unreadNotificationsCount,
    unreadMessagesCount
  };
}
