import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Paperclip, Send, MessageCircle, CheckCheck,
  DollarSign, Timer, Users, Calendar, ChevronLeft,
  X, Smile
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { messageService, buddyService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (t: string) => t || '';

// ─── Conversation row in sidebar ─────────────────────────────────────────────
const ConvRow: React.FC<{
  conv: any;
  fullInfo: any;
  isActive: boolean;
  onClick: () => void;
}> = ({ conv, fullInfo, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left cursor-pointer border ${
      isActive
        ? 'bg-primary/5 border-primary/15 shadow-sm'
        : 'bg-transparent border-transparent hover:bg-slate-50'
    }`}
  >
    {/* Avatar */}
    <div className="relative shrink-0">
      <img
        src={fullInfo.avatar}
        alt={fullInfo.name}
        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
      />
      {conv.status === 'online' && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
      )}
    </div>

    {/* Text info */}
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline gap-1 mb-0.5">
        <h3 className={`text-sm font-black truncate ${isActive ? 'text-primary' : 'text-secondary'}`}>
          {fullInfo.name}
        </h3>
        <span className="text-[9px] font-bold text-secondary/30 shrink-0">{conv.time}</span>
      </div>
      <p className="text-xs text-secondary/40 font-medium truncate leading-snug">
        {conv.lastMsg || 'Start the conversation…'}
      </p>
    </div>

    {/* Unread dot */}
    {conv.unread > 0 && (
      <span className="shrink-0 w-5 h-5 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center">
        {conv.unread}
      </span>
    )}
  </button>
);

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble: React.FC<{
  msg: any;
  isSent: boolean;
  canPay: boolean;
  offerLabel: string;
}> = ({ msg, isSent, canPay, offerLabel }) => (
  <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
    <div className={`max-w-[78%] flex flex-col gap-1 ${isSent ? 'items-end' : 'items-start'}`}>

      {msg.isOffer ? (
        /* ── Offer card ── */
        <div className="w-72 bg-[#1a2436] rounded-2xl overflow-hidden shadow-lg border border-white/5">
          {/* Header */}
          <div className="bg-[#0f1929] px-4 py-3 flex items-center gap-3 border-b border-white/5">
            <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign size={15} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">
                {msg.activity || 'Custom'} Offer
              </p>
              <h5 className="text-xs font-black text-white truncate mt-0.5">{msg.text}</h5>
            </div>
          </div>
          {/* Details */}
          <div className="px-4 py-3 space-y-3">
            {msg.meetingPoint && (
              <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Meeting Point</p>
                <p className="mt-1 text-[10px] font-black text-white/80">{msg.meetingPoint}</p>
              </div>
            )}
            {Array.isArray(msg.routeStops) && msg.routeStops.length > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/5 p-3 space-y-2">
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Route</p>
                <div className="space-y-1.5">
                  {msg.routeStops.map((stop: string, index: number) => (
                    <div key={`${stop}-${index}`} className="flex items-start gap-2 text-[10px] font-bold text-white/70">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[8px] text-primary">
                        {index + 1}
                      </span>
                      <span>{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Timer, value: msg.duration || `${msg.hours} hrs` },
                { icon: Users, value: `${msg.guests || 1} pax` },
                ...(msg.date ? [{ icon: Calendar, value: msg.date }] : []),
              ].map(({ icon: Icon, value }, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-white/50 uppercase tracking-wide">
                  <Icon size={10} className="text-primary/70" />
                  {value}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Total</p>
                <p className="text-base font-black text-primary">${msg.price}</p>
              </div>
              {canPay ? (
                <Link to="/traveller/checkout" state={{ bookingId: msg.bookingId }}>
                  <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-[9px] font-black uppercase tracking-wider border-none cursor-pointer transition-all shadow">
                    {offerLabel}
                  </button>
                </Link>
              ) : (
                <button disabled className="px-4 py-2 bg-white/10 text-white/30 rounded-xl text-[9px] font-black uppercase tracking-wider border-none">
                  {offerLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Text bubble ── */
        <div className={`px-4 py-2.5 shadow-sm ${
          isSent
            ? 'bg-primary text-white rounded-2xl rounded-tr-md'
            : 'bg-white border border-slate-100 text-secondary rounded-2xl rounded-tl-md'
        }`}>
          <p className="text-sm font-medium leading-relaxed">
            {msg.text || msg.content}
          </p>
        </div>
      )}

      {/* Timestamp + read receipt */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-[9px] font-bold text-secondary/25">{formatTime(msg.time)}</span>
        {isSent && <CheckCheck size={11} className="text-primary/40" />}
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Messaging: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [allBuddies, setAllBuddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams] = useSearchParams();
  const buddyIdFromQuery = searchParams.get('buddyId');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileView('chat');
    else if (!activeChatId) setMobileView('list');
  }, [isMobile, activeChatId]);

  useEffect(() => {
    const fetchData = async (preferredChatId?: string | null) => {
      try {
        let [convs, buddies] = await Promise.all([
          messageService.getConversations(),
          buddyService.getAll(),
        ]);

        if (buddyIdFromQuery) {
          const conversation = await messageService.getOrCreateConversationByBuddyId(buddyIdFromQuery);
          convs = await messageService.getConversations();
          preferredChatId = conversation.id;
        }

        setConversations(convs);
        setAllBuddies(buddies);

        if (convs.length > 0) {
          const targetConv = preferredChatId
            ? convs.find((c: any) => String(c.id) === String(preferredChatId))
            : convs[0];
          const chosen = targetConv || convs[0];
          setActiveChatId(chosen.id);
          setActiveMessages(chosen.messages || []);
        }
      } catch (err) {
        console.error('Messaging fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData(activeChatIdRef.current);
    return messageService.subscribe(() => fetchData(activeChatIdRef.current), setSocketConnected);
  }, [buddyIdFromQuery, user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const getFullChatInfo = (conv: any) => {
    const b = allBuddies.find(b => b.id === conv.buddyId);
    return {
      ...conv,
      name: b?.name || conv.buddyName || 'User',
      avatar: b?.image || conv.buddyAvatar || `https://i.pravatar.cc/100?u=${conv.id}`,
      role: b?.role || 'Local Buddy',
    };
  };

  const activeConv = conversations.find(c => c.id === activeChatId);
  const activeChatInfo = activeConv ? getFullChatInfo(activeConv) : null;
  const showListPanel = !isMobile || mobileView === 'list';
  const showChatPanel = !isMobile || mobileView === 'chat';

  const handleSelectChat = (conv: any) => {
    setActiveChatId(conv.id);
    setActiveMessages(conv.messages || []);
    if (isMobile) setMobileView('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isOwnMessage = (msg: any) =>
    msg.senderRole ? msg.senderRole === 'TRAVELER' : msg.type === 'sent';

  const canPayBooking = (msg: any) => msg.bookingId && msg.bookingStatus === 'PENDING';

  const getOfferButtonLabel = (msg: any) => {
    if (!msg.bookingId) return 'Pending';
    if (msg.bookingStatus === 'PENDING') return 'Pay Now';
    if (['CONFIRMED', 'UPCOMING', 'COMPLETED'].includes(msg.bookingStatus)) return 'Paid ✓';
    return msg.bookingStatus ? `${msg.bookingStatus}` : 'Unavailable';
  };

  const handleSend = async () => {
    if (!activeChatId || !messageInput.trim() || sending) return;
    setSending(true);
    const newMessage = {
      type: 'sent',
      senderRole: 'TRAVELER',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    try {
      const updated = await messageService.sendMessage(activeChatId, newMessage);
      setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
      setActiveMessages(updated.messages || []);
      setMessageInput('');
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = conversations.filter(conv => {
    if (!searchQuery) return true;
    const info = getFullChatInfo(conv);
    return info.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ─── Height calculation ──────────────────────────────────────────────────
  // On mobile: full viewport minus bottom nav (64px)
  // On desktop: full viewport minus the Navbar (96px = h-24)
  const containerHeight = 'h-[calc(100dvh-4rem)] md:h-[calc(100vh-10rem)]';

  return (
    <div className="w-full bg-[#FBFBFC] md:py-6 md:px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className={`flex overflow-hidden bg-white md:rounded-[36px] md:shadow-premium md:border md:border-slate-100/80 w-full ${containerHeight}`}>

      {/* ══════════ LEFT: CONVERSATION LIST ══════════ */}
      {showListPanel && (
        <aside className="flex flex-col w-full md:w-[320px] lg:w-[360px] shrink-0 bg-white border-r border-slate-100 overflow-hidden">

          {/* Header */}
          <div className="px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-black text-secondary tracking-tight">Messages</h1>
                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                  socketConnected ? 'text-emerald-500' : 'text-amber-500'
                }`}>
                  {socketConnected ? '● Live' : '● Connecting...'}
                </p>
              </div>
              <div className="w-9 h-9 bg-primary/8 rounded-2xl flex items-center justify-center text-primary/60">
                <MessageCircle size={18} />
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/25 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary/30 focus:bg-white rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold text-secondary outline-none placeholder:text-secondary/25 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-secondary cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5 scrollbar-hide">
            {loading ? (
              <div className="space-y-2 pt-2">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3 p-4 animate-pulse">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvs.length > 0 ? (
              filteredConvs.map(conv => (
                <ConvRow
                  key={conv.id}
                  conv={conv}
                  fullInfo={getFullChatInfo(conv)}
                  isActive={activeChatId === conv.id}
                  onClick={() => handleSelectChat(conv)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center mb-3">
                  <MessageCircle size={22} className="text-secondary/20" />
                </div>
                <p className="text-xs font-black text-secondary/30 uppercase tracking-widest">
                  {searchQuery ? 'No results' : 'No conversations yet'}
                </p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ══════════ CENTER: CHAT PANEL ══════════ */}
      {showChatPanel && (
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#F7F8FA]">
          {activeChatId && activeChatInfo ? (
            <>
              {/* Chat header */}
              <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
                {/* Back button — mobile */}
                {isMobile && (
                  <button
                    onClick={() => setMobileView('list')}
                    className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-secondary/60 hover:text-primary transition-all cursor-pointer shrink-0"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}

                {/* Avatar + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={activeChatInfo.avatar}
                      alt={activeChatInfo.name}
                      className="w-10 h-10 rounded-2xl object-cover border border-white shadow-sm"
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${socketConnected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-secondary truncate">{activeChatInfo.name}</h2>
                    <p className="text-[9px] font-bold text-secondary/30 uppercase tracking-widest">
                      {socketConnected ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>


              </header>

              {/* Messages area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 scrollbar-hide"
              >
                {activeMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center">
                      <MessageCircle size={24} className="text-primary/30" />
                    </div>
                    <p className="text-xs font-black text-secondary/30 uppercase tracking-widest">
                      Say hello!
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg: any) => {
                    const isSent = isOwnMessage(msg);
                    return (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isSent={isSent}
                        canPay={canPayBooking(msg)}
                        offerLabel={getOfferButtonLabel(msg)}
                      />
                    );
                  })
                )}
              </div>

              {/* Input bar */}
              <footer
                className="bg-white border-t border-slate-100 px-4 py-3 shrink-0"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
              >
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 focus-within:border-primary/30 focus-within:bg-white rounded-2xl px-3 py-2 transition-all">
                  {/* Attach */}
                  <button className="text-secondary/30 hover:text-primary transition-all cursor-pointer shrink-0 p-1">
                    <Paperclip size={17} />
                  </button>

                  {/* Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message…"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-secondary placeholder:text-secondary/25"
                  />

                  {/* Emoji placeholder */}
                  <button className="text-secondary/30 hover:text-primary transition-all cursor-pointer shrink-0 p-1">
                    <Smile size={17} />
                  </button>

                  {/* Send */}
                  <button
                    onClick={handleSend}
                    disabled={sending || !messageInput.trim()}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border-none cursor-pointer transition-all ${
                      messageInput.trim()
                        ? 'bg-primary hover:bg-primary-dark text-white shadow-sm hover:scale-105 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            /* Desktop empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
              <div className="w-20 h-20 bg-white rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-center">
                <MessageCircle size={32} className="text-primary/25" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-secondary/40 tracking-tight">Your messages</h3>
                <p className="text-sm text-secondary/25 font-medium max-w-xs mx-auto">
                  Pick a conversation from the left to start chatting with a buddy.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Messaging;
