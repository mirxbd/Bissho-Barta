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

export function useAppState() {
  // Load or initialize state
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('fb_lite_profile');
      return saved ? JSON.parse(saved) : defaultUserProfile;
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
      // Deduplicate loaded notifications by unique ID
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
    } catch {}
  }, [searchSource]);

  // Debounced non-blocking localStorage saver
  const saveTimeoutsRef = useRef<{ [key: string]: any }>({});

  const debouncedSafeSave = useCallback((key: string, data: any, delay: number = 300) => {
    if (saveTimeoutsRef.current[key]) {
      clearTimeout(saveTimeoutsRef.current[key]);
    }
    saveTimeoutsRef.current[key] = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            try {
              localStorage.setItem(key, JSON.stringify(data));
            } catch (err) {
              console.warn(`[useAppState] Failed to persist ${key} to localStorage:`, err);
            }
          });
        } else {
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (err) {
        console.warn(`[useAppState] Failed to persist ${key} to localStorage:`, err);
      }
    }, delay);
  }, []);

  // Persist state to localStorage on changes (debounced)
  useEffect(() => {
    debouncedSafeSave('fb_lite_profile', profile, 200);
  }, [profile, debouncedSafeSave]);

  useEffect(() => {
    debouncedSafeSave('fb_lite_posts', posts, 500);
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
    if (options?.scheduledFor) {
      try {
        const dateObj = new Date(options.scheduledFor);
        if (!isNaN(dateObj.getTime())) {
          formattedTimestamp = `Scheduled for ${dateObj.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          })} at ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
          formattedTimestamp = `Scheduled for ${options.scheduledFor}`;
        }
      } catch (e) {
        formattedTimestamp = `Scheduled for ${options.scheduledFor}`;
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
      scheduledFor: options?.scheduledFor
    };
    setPosts(prev => [newPost, ...prev]);
  }, [profile.name, profile.avatar]);

  const likePost = useCallback((postId: string, isWatchPost = false) => {
    const updateFn = (prevPosts: Post[]) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const likedByMe = !post.likedByMe;
          return {
            ...post,
            likedByMe,
            likes: likedByMe ? post.likes + 1 : Math.max(0, post.likes - 1)
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

  const addComment = useCallback((postId: string, commentText: string, isWatchPost = false, replyToId?: string, replyToName?: string) => {
    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
  }, [profile.name, profile.avatar]);

  const deletePost = useCallback((postId: string, isWatchPost = false) => {
    if (isWatchPost) {
      setWatchPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  }, []);

  const handleFriendAction = useCallback((friendId: string, action: 'accept' | 'decline' | 'add' | 'remove') => {
    let targetFriend: Friend | undefined;

    setFriends((prevFriends) => {
      targetFriend = prevFriends.find(f => f.id === friendId);
      return prevFriends.map((f) => {
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
      });
    });

    if (action === 'accept' || action === 'decline') {
      setNotifications((prev) => {
        const filtered = prev.filter(n => !(n.type === 'friend_request' && targetFriend && n.actorName === targetFriend.name));

        if (action === 'accept' && targetFriend) {
          const now = Date.now();
          const newNotification: Notification = {
            id: `notif_${now}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'friend_accept',
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
      setConversations((prev) => {
        if (prev.some(c => c.friend.id === friendId)) return prev;
        const friendObj = targetFriend || {
          id: friendId,
          name: 'Friend',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
          mutualFriends: 1,
          status: 'friend' as const,
          isOnline: true
        };
        return [
          {
            id: `c_${now}_${randomSuffix}`,
            friend: { ...friendObj, status: 'friend' },
            unread: false,
            messages: [
              { id: `m_${now}_${randomSuffix}`, senderId: friendId, text: `Hey there! We are friends now! 👋`, timestamp: "Just now" }
            ]
          },
          ...prev
        ];
      });
    }
  }, []);

  // Track timeouts to avoid memory leaks
  const activeTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const timers = activeTimersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: 'me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations((prevConvs) =>
      prevConvs.map((conv) => {
        if (conv.id === conversationId) {
          // Trigger a simulated reply after a delay
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
    setProfile(prevProfile => {
      const oldName = prevProfile.name;
      const newName = updatedProfile.name;
      const newAvatar = updatedProfile.avatar;

      // Helper to check if a name belongs to the current user or initial Alex Rivera
      const isUser = (name: string) =>
        name === oldName || name === newName || name === "Alex Rivera";

      // 1. Update main feed posts and all comments made by the user
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          const isUserPost = isUser(p.authorName);
          const updatedComments = (p.comments || []).map((c) => {
            if (isUser(c.authorName)) {
              return {
                ...c,
                authorName: newName,
                authorAvatar: newAvatar
              };
            }
            return c;
          });

          return {
            ...p,
            ...(isUserPost ? { authorName: newName, authorAvatar: newAvatar } : {}),
            comments: updatedComments
          };
        })
      );

      // 2. Update watch posts and watch post comments
      setWatchPosts((prevWatch) =>
        prevWatch.map((p) => {
          const isUserPost = isUser(p.authorName);
          const updatedComments = (p.comments || []).map((c) => {
            if (isUser(c.authorName)) {
              return {
                ...c,
                authorName: newName,
                authorAvatar: newAvatar
              };
            }
            return c;
          });

          return {
            ...p,
            ...(isUserPost ? { authorName: newName, authorAvatar: newAvatar } : {}),
            comments: updatedComments
          };
        })
      );

      // 3. Update stories created by the user
      setStories((prevStories) =>
        prevStories.map((s) => {
          if (isUser(s.userName)) {
            return {
              ...s,
              userName: newName,
              userAvatar: newAvatar
            };
          }
          return s;
        })
      );

      // 4. Update friends list if user/Alex Rivera exists in friends
      setFriends((prevFriends) =>
        prevFriends.map((f) => {
          if (isUser(f.name)) {
            return {
              ...f,
              name: newName,
              avatar: newAvatar
            };
          }
          return f;
        })
      );

      // 5. Update notifications where actor is user
      setNotifications((prevNotifs) =>
        prevNotifs.map((n) => {
          if (isUser(n.actorName)) {
            return {
              ...n,
              actorName: newName,
              actorAvatar: newAvatar
            };
          }
          return n;
        })
      );

      // 6. Update conversations if friend matches user name
      setConversations((prevConvs) =>
        prevConvs.map((c) => {
          if (isUser(c.friend.name)) {
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

      return updatedProfile;
    });
  }, []);

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
    addPost,
    likePost,
    addComment,
    deletePost,
    handleFriendAction,
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
