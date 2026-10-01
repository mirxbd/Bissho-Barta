import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Conversation, Friend } from '../types';
import { ArrowLeft, Send, Phone, Video, Info, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessagesTabProps {
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string) => void;
  searchQuery: string;
  chattingFriendId: string | null;
  setChattingFriendId: (id: string | null) => void;
  onViewProfile?: (name: string, avatar?: string, id?: string) => void;
}

export default function MessagesTab({
  conversations,
  sendMessage,
  searchQuery,
  chattingFriendId,
  setChattingFriendId,
  onViewProfile
}: MessagesTabProps) {
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [callingType, setCallingType] = useState<'voice' | 'video' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Derived active conversation from ID
  const activeConv = useMemo(() => {
    if (!activeConvId) return null;
    return conversations.find(c => c.id === activeConvId) || null;
  }, [conversations, activeConvId]);

  // If a friend is selected externally (e.g. from Friends list), set it active
  useEffect(() => {
    if (chattingFriendId) {
      const conv = conversations.find(c => c.friend.id === chattingFriendId);
      if (conv) {
        setActiveConvId(conv.id);
      }
    }
  }, [chattingFriendId, conversations]);

  // Keep scroll position updated and clear typing indicator
  useEffect(() => {
    if (activeConv) {
      scrollToBottom();
      setIsTyping(false);
    }
  }, [activeConv?.messages.length, activeConv?.id, scrollToBottom]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  // Trigger typing simulation when a message is sent
  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    
    const convId = activeConv.id;
    sendMessage(convId, inputText);
    setInputText('');
    
    // Simulate typing feedback
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      setIsTyping(true);
    }, 400);

    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(true), 50);
  };

  // Filter conversations by search query
  const filteredConvs = useMemo(() => {
    if (!searchQuery) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(conv => 
      conv.friend.name.toLowerCase().includes(query) ||
      conv.messages.some(m => m.text.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  return (
    <div className="bg-white lg:bg-transparent min-h-[calc(100vh-112px)] lg:min-h-0 pb-4 lg:pb-0 flex flex-col relative font-sans" id="messenger-tab-container">
      <AnimatePresence mode="wait">
        {!activeConv ? (
          /* CONVERSATIONS LIST MODE */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
            id="conversations-list-pane"
          >
            {/* Bissho Barta Chat Header Label */}
            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Chats</span>
              <span className="text-[10px] text-[#076653] bg-[#EBF7F2] border border-[#076653]/20 px-2 py-0.5 rounded-full font-bold">Bissho Barta Chat</span>
            </div>

            {filteredConvs.length === 0 ? (
              <div className="py-20 text-center text-gray-400 text-xs">
                {searchQuery ? 'No chats match your search.' : 'No conversations active. Add friends to start chatting!'}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filteredConvs.map((conv) => {
                  const lastMsg = conv.messages[conv.messages.length - 1];
                  const hasUnread = conv.unread;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConvId(conv.id);
                        setChattingFriendId(conv.friend.id);
                        conv.unread = false; // Soft mark-as-read
                      }}
                      className={`w-full text-left p-3.5 flex gap-3.5 items-center hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                        hasUnread ? 'bg-[#EBF7F2]/60' : ''
                      }`}
                      id={`conv-row-${conv.id}`}
                    >
                      {/* Avatar with active bubble */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile?.(conv.friend.name, conv.friend.avatar, conv.friend.id);
                        }}
                        className="relative flex-shrink-0 cursor-pointer group/msgavatar"
                        title={`View ${conv.friend.name}'s profile`}
                      >
                        <img
                          src={conv.friend.avatar}
                          alt={conv.friend.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover/msgavatar:ring-2 group-hover/msgavatar:ring-[#076653] transition-all"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                        {conv.friend.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                      </div>

                      {/* Content column */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className={`text-xs ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'} truncate`}>
                            {conv.friend.name}
                          </h3>
                          <span className="text-[9px] text-gray-400">{lastMsg ? lastMsg.timestamp : ''}</span>
                        </div>
                        <p className={`text-[11px] ${hasUnread ? 'font-bold text-gray-950' : 'text-gray-500'} truncate mt-0.5`}>
                          {lastMsg ? (lastMsg.senderId === 'me' ? 'You: ' : '') + lastMsg.text : 'Start a chat...'}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {hasUnread && (
                        <div className="w-2.5 h-2.5 bg-[#076653] rounded-full flex-shrink-0"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* ACTIVE CHAT DIALOGUE MODE */
          <motion.div
            key="chat"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2 }}
            className="absolute inset-0 bg-white flex flex-col z-30"
            id="chat-pane"
          >
            {/* Header toolbar */}
            <div className="bg-white border-b border-gray-200 text-gray-800 p-3 flex items-center justify-between shadow-xs h-14 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveConvId(null);
                    setChattingFriendId(null);
                  }}
                  className="p-1.5 hover:bg-[#EBF7F2] text-[#076653] rounded-full cursor-pointer transition-colors"
                  id="chat-back-btn"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div 
                  onClick={() => onViewProfile?.(activeConv.friend.name, activeConv.friend.avatar, activeConv.friend.id)}
                  className="flex items-center gap-2.5 cursor-pointer group/headerfriend"
                  title={`View ${activeConv.friend.name}'s profile`}
                >
                  <div className="relative">
                    <img
                      src={activeConv.friend.avatar}
                      alt={activeConv.friend.name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-150 group-hover/headerfriend:ring-2 group-hover/headerfriend:ring-[#076653] transition-all"
                      referrerPolicy="no-referrer"
                    />
                    {activeConv.friend.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#076653] border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold leading-tight text-gray-900 group-hover/headerfriend:text-[#076653] group-hover/headerfriend:underline transition-colors">{activeConv.friend.name}</h3>
                    <span className="text-[9px] text-gray-500 font-medium">
                      {activeConv.friend.isOnline ? 'Active now' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mock Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setCallingType('video')} 
                  className="p-2 hover:bg-[#EBF7F2] text-[#076653] rounded-full cursor-pointer transition-colors"
                  id="chat-video-btn"
                  title="Simulate Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCallingType('voice')} 
                  className="p-2 hover:bg-[#EBF7F2] text-[#076653] rounded-full cursor-pointer transition-colors"
                  id="chat-voice-btn"
                  title="Simulate Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
              {activeConv.messages.map((msg) => {
                const isMe = msg.senderId === 'me';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div
                      className={`px-3 py-2 rounded-2xl text-xs leading-normal break-words shadow-xs ${
                        isMe 
                          ? 'bg-[#076653] text-white rounded-br-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex flex-col max-w-[70%] self-start items-start animate-pulse">
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-none bg-white border border-gray-100 text-gray-500 flex items-center gap-1.5 shadow-sm">
                    <Circle className="w-1.5 h-1.5 fill-[#076653] text-transparent animate-bounce" />
                    <Circle className="w-1.5 h-1.5 fill-[#076653] text-transparent animate-bounce delay-150" />
                    <Circle className="w-1.5 h-1.5 fill-[#076653] text-transparent animate-bounce delay-300" />
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1 pl-1">
                    {activeConv.friend.name.split(' ')[0]} is typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom text form */}
            <div className="p-2 border-t border-gray-200 bg-white flex gap-2 items-center sticky bottom-0 z-10">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#076653]"
                id="message-input-field"
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                  inputText.trim() 
                    ? 'bg-[#076653] text-[#E3EF26] hover:bg-[#0C342C]' 
                    : 'bg-gray-100 text-gray-400'
                }`}
                id="send-message-btn"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* FULL-SCREEN INTERACTIVE MOCK CALL OVERLAY */}
            <AnimatePresence>
              {callingType && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-gray-900 text-white flex flex-col items-center justify-center z-50 p-6 text-center select-none"
                  id="calling-simulation-overlay"
                >
                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-[#076653]/40 animate-ping duration-1000"></div>
                      <img
                        src={activeConv.friend.avatar}
                        alt=""
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#E3EF26] relative z-10"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">{activeConv.friend.name}</h2>
                      <p className="text-xs text-[#E3EF26] mt-2 font-medium">
                        {callingType === 'video' ? '📞 Connecting video chat...' : '📞 Ringing via Bissho Barta Chat...'}
                      </p>
                    </div>
                  </div>
                  <div className="pb-12 shrink-0 flex flex-col items-center gap-2">
                    <button
                      onClick={() => setCallingType(null)}
                      className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors cursor-pointer text-white shadow-lg active:scale-95 duration-100"
                      title="End Call"
                    >
                      <Phone className="w-6 h-6 rotate-135" />
                    </button>
                    <span className="text-[11px] text-gray-400 block font-medium">End Call</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
