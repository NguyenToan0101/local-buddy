import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Plus, Search, DollarSign, Sparkles, MapPin, 
  Users, Calendar, Timer, MessageSquare, ChevronLeft, 
  X, Check, Smile, Paperclip, Clock, ShieldAlert, Award,
  Info, ExternalLink, ChevronDown, CheckCircle
} from 'lucide-react';
import Button from '../ui/Button';
import { buddyService, messageService } from '../../services/api';
import ExperienceRequestModal from './ExperienceRequestModal';
import { useAuth } from '../../context/AuthContext';

interface MessagesTabProps {
  chats: any[];
}

const MessagesTab: React.FC<MessagesTabProps> = ({ chats }) => {
  const { user } = useAuth();
  const [localChats, setLocalChats] = useState<any[]>(chats);
  const [activeChat, setActiveChat] = useState<string | null>(chats[0]?.id || null);
  const activeChatRef = useRef<string | null>(chats[0]?.id || null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [buddyHourlyRate, setBuddyHourlyRate] = useState(0);
  const messageListRef = useRef<HTMLDivElement>(null);

  const getBuddyId = () => {
    const buddyId = user?.id || '1';
    return buddyId === 'buddy-1' ? '1' : buddyId;
  };

  const loadChats = async (preferredChatId?: string | null) => {
    const allConversations = await messageService.getConversations();
    const buddyChats = allConversations.filter((c: any) => String(c.buddyId) === String(getBuddyId()));
    setLocalChats(buddyChats);

    const nextActiveChat = preferredChatId && buddyChats.some((chat: any) => String(chat.id) === String(preferredChatId))
      ? preferredChatId
      : activeChat && buddyChats.some((chat: any) => String(chat.id) === String(activeChat))
        ? activeChat
        : buddyChats[0]?.id || null;

    if (window.innerWidth < 1024 && !preferredChatId) {
      setActiveChat(null);
    } else {
      setActiveChat(nextActiveChat);
    }

    if (nextActiveChat) {
      const active = buddyChats.find((chat: any) => String(chat.id) === String(nextActiveChat));
      setMessages(active?.messages || []);
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setActiveChat(null);
    }
  }, []);

  useEffect(() => {
    setLocalChats(chats);
    if (!activeChat && chats[0]?.id && window.innerWidth >= 1024) {
      setActiveChat(chats[0].id);
    }
  }, [chats]);

  useEffect(() => {
    loadChats(activeChatRef.current);
    return messageService.subscribe(() => loadChats(activeChatRef.current), setSocketConnected);
  }, [user?.id]);

  useEffect(() => {
    const loadBuddyRate = async () => {
      try {
        const profile = await buddyService.getById(getBuddyId());
        setBuddyHourlyRate(Number(profile.price || 0));
      } catch (error) {
        console.error("Failed to load buddy hourly rate:", error);
      }
    };
    loadBuddyRate();
  }, [user?.id]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      const loadMessages = async () => {
        setLoadingMessages(true);
        try {
          const msgs = await messageService.getMessagesByConvId(activeChat);
          setMessages(msgs);
        } catch (error) {
          console.error("Failed to load messages:", error);
        } finally {
          setLoadingMessages(false);
        }
      };
      loadMessages();
    }
  }, [activeChat]);

  const handleSendOffer = async (data: any) => {
    if (!activeChat) return;
    const offerMsg = {
      ...data,
      type: 'sent',
      senderRole: 'BUDDY',
      isOffer: true,
      offerTime: data.time,
      hours: data.hours,
      text: `Custom Offer: ${data.duration} of ${data.activity}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const updated = await messageService.sendMessage(activeChat, offerMsg);
      setMessages(updated.messages || []);
      setLocalChats(prev => prev.map(chat => chat.id === updated.id ? updated : chat));
      setShowRequestModal(false);
    } catch (error) {
      console.error("Failed to send offer:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChat || !text.trim() || sending) return;
    setSending(true);
    const msg = {
      type: 'sent',
      senderRole: 'BUDDY',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const updated = await messageService.sendMessage(activeChat, msg);
      setMessages(updated.messages || []);
      setLocalChats(prev => prev.map(chat => chat.id === updated.id ? updated : chat));
      setMessageInput('');
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const isOwnMessage = (message: any) => {
    if (message.senderRole) return message.senderRole === 'BUDDY';
    return message.type === 'sent';
  };

  const activeConversation = localChats.find(c => c.id === activeChat);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex overflow-hidden h-[calc(100vh-165px)] lg:h-[calc(100vh-190px)] relative w-full max-w-full min-w-0">
      
      {/* 1. LEFT PANEL: Inbox list */}
      <div 
        className={`w-full lg:w-80 border-r border-gray-100 flex flex-col bg-white shrink-0 transition-all duration-300 ${
          activeChat ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-secondary tracking-tight">Messages</h3>
              <p className="text-[8px] font-bold text-secondary/30 uppercase tracking-widest mt-0.5">
                {localChats.length} active conversations
              </p>
            </div>
            <button className="w-9 h-9 bg-surface hover:bg-gray-100 text-secondary/50 hover:text-primary rounded-xl flex items-center justify-center transition-colors border-none cursor-pointer">
              <Plus size={16} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/35" />
            <input 
              type="text" 
              placeholder="Search by traveler name..." 
              className="w-full bg-[#F3F4F6]/60 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/15 focus:bg-white focus:border-transparent transition-all" 
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50/50">
          {localChats.length === 0 ? (
            <div className="px-6 py-20 text-center space-y-3">
              <MessageSquare size={28} className="mx-auto text-secondary/15" />
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary/30">No conversations</p>
            </div>
          ) : (
            localChats.map((chat) => {
              const isSelected = activeChat === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full px-5 py-4 text-left transition-all border-none bg-transparent relative flex items-center gap-3 cursor-pointer ${
                    isSelected ? "bg-primary/5" : "hover:bg-gray-50/40"
                  }`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>}
                  
                  <div className="w-10 h-10 rounded-xl bg-surface-dark overflow-hidden shrink-0 ring-2 ring-primary/5 relative">
                    <img 
                      src={chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'Traveler')}&background=FF7E4B&color=fff`} 
                      alt={chat.name} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-[11px] font-black uppercase tracking-wider truncate ${isSelected ? "text-primary" : "text-secondary"}`}>
                        {chat.name}
                      </p>
                      <span className="text-[8px] font-bold text-secondary/30 shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-[10px] font-medium text-secondary/40 truncate leading-none">{chat.lastMsg}</p>
                  </div>
                  {chat.unread && (
                    <div className="px-1.5 py-0.5 bg-primary text-white text-[7px] font-black rounded-full shrink-0 animate-pulse">
                      New
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER PANEL: Message Feed */}
      <div 
        className={`flex-1 flex flex-col relative bg-[#F8F9FB] border-r border-gray-100 min-w-0 w-full max-w-full ${
          !activeChat ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {activeChat ? (
          <>
            {/* Header */}
            <div className="px-5 py-5 bg-white border-b border-gray-100 flex items-center justify-between z-10 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => setActiveChat(null)} 
                  className="lg:hidden w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-secondary/60 hover:text-primary border-none cursor-pointer"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                
                <div className="w-10 h-10 rounded-xl bg-surface-dark overflow-hidden shrink-0 ring-2 ring-primary/5">
                  <img
                    src={activeConversation?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation?.name || 'Traveler')}&background=FF7E4B&color=fff`}
                    alt={activeConversation?.name || 'Traveler'}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-[11px] font-black text-secondary uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
                      {activeConversation?.name || 'Traveler'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest leading-none">
                      Escrow Secure Thread
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-primary hover:bg-primary-dark text-white px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-primary-glow border-none flex items-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-95"
                  title="Create Proposal"
                >
                  <Sparkles size={12} />
                  <span className="hidden lg:inline">Create Proposal</span>
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div 
              ref={messageListRef} 
              className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar scroll-smooth bg-[#FBFBFC]"
            >
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  {/* Day Separator */}
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="h-px bg-gray-100 flex-1"></div>
                    <span className="text-[8px] font-black text-secondary/35 uppercase tracking-widest">Today</span>
                    <div className="h-px bg-gray-100 flex-1"></div>
                  </div>

                  {messages.map((m: any) => {
                    const own = isOwnMessage(m);
                    return (
                      <div key={m.id} className={`flex w-full ${own ? 'justify-end' : 'justify-start'}`}>
                        {m.isOffer ? (
                          /* High-fidelity custom offer card */
                          <div className="w-full max-w-full sm:max-w-[360px] bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white rounded-2xl overflow-hidden shadow-premium border border-white/5 hover:border-white/10 hover:shadow-2xl transition-all duration-300">
                            {/* Card Header Banner */}
                            <div className="bg-primary px-5 py-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
                                  <DollarSign size={14} />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                  <p className="text-[7px] font-black text-white/50 uppercase tracking-widest">Custom Proposal</p>
                                  <h5 className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[100px] sm:max-w-[160px]">{m.activity || 'Experience Session'}</h5>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider ${
                                m.bookingId ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                              }`}>
                                {m.bookingId ? 'Confirmed' : 'Awaiting'}
                              </span>
                            </div>

                            {/* Details Specifications */}
                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04] space-y-0.5">
                                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1">
                                    <Timer size={8} className="text-primary" /> Duration
                                  </p>
                                  <p className="text-[10px] font-black text-white/90">{m.duration || (m.hours + ' Hours')}</p>
                                </div>
                                <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04] space-y-0.5">
                                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1">
                                    <Users size={8} className="text-primary" /> Travelers
                                  </p>
                                  <p className="text-[10px] font-black text-white/90">{m.guests || 1} Person</p>
                                </div>
                                {m.date && (
                                  <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04] col-span-2 space-y-0.5">
                                    <p className="text-[7px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1">
                                      <Calendar size={8} className="text-primary" /> Proposed Meetup
                                    </p>
                                    <p className="text-[10px] font-black text-white/90 truncate">{m.date} at {m.offerTime || m.time}</p>
                                  </div>
                                )}
                              </div>

                              {/* Price display */}
                              <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
                                <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">Escrow Total Payout</span>
                                <span className="text-base font-black text-primary italic">${m.price}</span>
                              </div>

                              {/* Action details status */}
                              <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-white/30">
                                {m.bookingId ? (
                                  <>
                                    <CheckCircle size={10} className="text-green-500" /> Traveler payment secure
                                  </>
                                ) : (
                                  <>
                                    <Clock size={10} className="text-amber-500 animate-pulse" /> Awaiting checkout confirmation
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Chat Message bubble with tail style corners */
                          <div 
                            className={`max-w-[85%] sm:max-w-[70%] w-fit break-words px-4 py-2.5 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm relative ${
                              own 
                              ? 'bg-primary text-white rounded-tr-sm shadow-primary-glow' 
                              : 'bg-white text-secondary rounded-tl-sm border border-gray-100'
                            }`}
                          >
                            <p className="whitespace-pre-line tracking-wide">{m.text}</p>
                            <p className={`text-[7px] mt-2 font-black uppercase text-right leading-none ${
                              own ? 'text-white/40' : 'text-secondary/20'
                            }`}>
                              {m.time}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Input details footer */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
              <button className="w-10 h-10 bg-[#F3F4F6]/50 hover:bg-gray-100 rounded-xl flex items-center justify-center text-secondary/35 hover:text-primary transition-all border-none cursor-pointer shrink-0">
                <Paperclip size={16} />
              </button>
              
              <div className="flex-1 relative w-full flex items-center">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${activeConversation?.name?.split(' ')[0] || 'Traveler'}...`}
                  className="w-full bg-[#F3F4F6]/60 border border-transparent rounded-xl py-3 pl-4 pr-20 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-transparent transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage(messageInput);
                    }
                  }}
                />
                
                <button className="absolute right-12 w-8 h-8 flex items-center justify-center text-secondary/30 hover:text-primary border-none bg-transparent cursor-pointer">
                  <Smile size={16} />
                </button>

                <button
                  disabled={!messageInput.trim() || sending}
                  onClick={() => handleSendMessage(messageInput)}
                  className="absolute right-1.5 w-9 h-9 bg-primary disabled:bg-secondary/20 rounded-xl flex items-center justify-center text-white border-none cursor-pointer shadow-sm hover:scale-105 transition-transform"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/10">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-secondary/15 mx-auto mb-4">
              <MessageSquare size={28} />
            </div>
            <h4 className="text-xs font-black text-secondary uppercase tracking-widest">No conversation active</h4>
            <p className="text-[9px] text-secondary/35 font-bold max-w-xs mx-auto mt-1 uppercase tracking-widest leading-relaxed">
              Select a traveler from the sidebar logs to manage negotiations.
            </p>
          </div>
        )}
      </div>

      {/* Experience Request Modal */}
      <ExperienceRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSend={handleSendOffer}
        buddyName={user?.name || "Buddy"}
        buddyAvatar={user?.avatar || ""}
        hourlyRate={buddyHourlyRate}
      />
    </div>
  );
};

export default MessagesTab;
