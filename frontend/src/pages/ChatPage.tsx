import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  listConversations, listMessages, sendMessageApi, markConversationRead,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Conversation, Message } from '../types';
import {
  Send, Search, User as UserIcon, ArrowLeft, Loader2, Check, CheckCheck, MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

/** Poll intervals: fast while a thread is open, slow for the inbox list. */
const MESSAGES_POLL_MS = 4000;
const INBOX_POLL_MS = 15000;

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value === 'string') return new Date(value);
  if (typeof value.toDate === 'function') return value.toDate();
  return null;
}
function fmt(value: any, pattern: string): string {
  const d = toDate(value);
  return d && !isNaN(d.getTime()) ? format(d, pattern) : '';
}

export const ChatPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(searchParams.get('c'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(searchParams.get('c') ? 'chat' : 'list');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const refreshInbox = useCallback(async () => {
    if (!userProfile) return;
    try {
      setConversations(await listConversations(userProfile.uid));
    } catch (err) {
      console.error('Could not load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  // Inbox: fetch on mount, then poll slowly.
  useEffect(() => {
    refreshInbox();
    const t = setInterval(refreshInbox, INBOX_POLL_MS);
    return () => clearInterval(t);
  }, [refreshInbox]);

  // Active thread: fetch + poll fast; mark read when new messages arrive.
  useEffect(() => {
    if (!activeConversationId || !userProfile) {
      setMessages([]);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const rows = await listMessages(activeConversationId);
        if (!active) return;
        setMessages(rows);
        if (rows.length !== lastCount.current) {
          lastCount.current = rows.length;
          markConversationRead(activeConversationId, userProfile.uid).catch(() => {});
        }
      } catch (err) {
        console.error('Could not load messages:', err);
      }
    };
    load();
    const t = setInterval(load, MESSAGES_POLL_MS);
    return () => { active = false; clearInterval(t); };
  }, [activeConversationId, userProfile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !activeConversationId || !userProfile || sending) return;

    setNewMessage('');
    setSending(true);
    try {
      const saved = await sendMessageApi({
        conversationId: activeConversationId,
        senderId: userProfile.uid,
        senderName: userProfile.displayName,
        text,
      });
      setMessages((prev) => [...prev, saved]);
      refreshInbox();
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (id: string) => {
    lastCount.current = 0;
    setActiveConversationId(id);
    setMobileView('chat');
    setSearchParams({ c: id }, { replace: true });
  };

  const backToList = () => {
    setMobileView('list');
    if (searchParams.get('c')) {
      searchParams.delete('c');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const filteredConversations = useMemo(() => {
    if (!userProfile) return [];
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((conv) => {
      const otherId = conv.participants.find((p) => p !== userProfile.uid);
      const name = (otherId && conv.participantNames?.[otherId]) || '';
      return name.toLowerCase().includes(q) || (conv.lastMessage || '').toLowerCase().includes(q);
    });
  }, [conversations, search, userProfile]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const otherId = activeConversation && userProfile
    ? activeConversation.participants.find((p) => p !== userProfile.uid)
    : undefined;
  const otherName = (otherId && activeConversation?.participantNames?.[otherId]) || 'Conversation';
  const otherAvatar = otherId ? activeConversation?.participantAvatars?.[otherId] : undefined;

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
          <MessageSquare size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Your Messages</h2>
        <p className="text-slate-500 max-w-sm mb-6">Set up a quick profile to message dealers and buyers.</p>
        <Link to="/login?next=/messages" className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20">
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Conversation list */}
      <div className={cn(
        'w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30',
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      )}>
        <div className="p-4 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">
                {conversations.length === 0 ? 'No conversations yet.' : 'No matches.'}
              </p>
              {conversations.length === 0 && (
                <Link to="/vendors" className="inline-block mt-3 text-xs font-bold text-primary">Find a dealer to message</Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredConversations.map((conv) => {
                const oId = conv.participants.find((p) => p !== userProfile.uid);
                const name = (oId && conv.participantNames?.[oId]) || 'User';
                const avatar = oId ? conv.participantAvatars?.[oId] : undefined;
                const isActive = activeConversationId === conv.id;
                const unread = conv.unreadCount?.[userProfile.uid] || 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      'w-full p-4 flex items-start gap-3 transition-colors text-left',
                      isActive ? 'bg-primary/5' : 'hover:bg-gray-50'
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      {avatar ? (
                        <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <UserIcon className="w-6 h-6" />
                        </div>
                      )}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={cn('font-semibold truncate text-sm', unread > 0 ? 'text-gray-900' : 'text-gray-700')}>{name}</h3>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{fmt(conv.lastUpdatedAt, 'HH:mm')}</span>
                      </div>
                      <p className={cn('text-xs truncate', unread > 0 ? 'text-gray-900 font-medium' : 'text-gray-500')}>
                        {conv.lastSenderId === userProfile.uid && 'You: '}{conv.lastMessage || 'Start a conversation'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={cn('flex-1 flex flex-col bg-white', mobileView === 'list' ? 'hidden md:flex' : 'flex')}>
        {activeConversationId ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button onClick={backToList} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative">
                {otherAvatar ? (
                  <img src={otherAvatar} alt={otherName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">{otherName}</h2>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">GemBook Chat</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {messages.length === 0 && (
                <div className="text-center text-xs text-gray-400 py-8">
                  Say hello 👋 — this is the start of your conversation.
                </div>
              )}
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  const isMe = msg.senderId === userProfile.uid;
                  const prev = messages[index - 1];
                  const showDate = index === 0 || fmt(msg.createdAt, 'yyyy-MM-dd') !== fmt(prev?.createdAt, 'yyyy-MM-dd');
                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && fmt(msg.createdAt, 'MMMM d, yyyy') && (
                        <div className="flex justify-center my-6">
                          <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] text-gray-400 font-medium shadow-sm uppercase tracking-widest">
                            {fmt(msg.createdAt, 'MMMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                      >
                        <div className={cn(
                          'max-w-[75%] rounded-2xl p-3 shadow-sm',
                          isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        )}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                          <div className={cn('flex items-center gap-1 mt-1 justify-end', isMe ? 'text-white/70' : 'text-gray-400')}>
                            <span className="text-[10px]">{fmt(msg.createdAt, 'HH:mm') || '···'}</span>
                            {isMe && ((msg.readBy?.length || 0) > 1 ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary/40 mb-6">
              <Send className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h2>
            <p className="text-gray-500 max-w-sm">
              Select a conversation to start chatting with gemstone dealers and buyers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
