import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Search, DollarSign, Sparkles, MapPin, Users, Calendar, Timer, MessageSquare } from 'lucide-react';
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

    const nextActiveChat = preferredChatId && buddyChats.some((chat: any) => chat.id === preferredChatId)
      ? preferredChatId
      : activeChat && buddyChats.some((chat: any) => chat.id === activeChat)
        ? activeChat
        : buddyChats[0]?.id || null;

    setActiveChat(nextActiveChat);
    if (nextActiveChat) {
      const active = buddyChats.find((chat: any) => chat.id === nextActiveChat);
      setMessages(active?.messages || []);
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    setLocalChats(chats);
    if (!activeChat && chats[0]?.id) {
      setActiveChat(chats[0].id);
    }
  }, [chats, activeChat]);

  useEffect(() => {
    loadChats(activeChat);
    return messageService.subscribe(() => loadChats(activeChat), setSocketConnected);
  }, [user?.id, activeChat]);

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
    <div className="bg-white rounded-[32px] h-[calc(100vh-210px)] min-h-[680px] shadow-premium border border-gray-100 overflow-hidden flex">
      {/* Chat List */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-secondary tracking-tight">Sales Center</h3>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${socketConnected ? 'text-green-500' : 'text-amber-500'}`}>
                {socketConnected ? 'WebSocket live' : 'Reconnecting'}
              </p>
            </div>
            <button className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-secondary/20 hover:text-primary transition-all border-none">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" />
            <input type="text" placeholder="Search conversations..." className="w-full bg-surface border border-gray-100 rounded-xl py-3 pl-11 pr-4 text-[10px] font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {localChats.length === 0 && (
            <div className="px-8 py-16 text-center space-y-3">
              <MessageSquare size={34} className="mx-auto text-primary/20" />
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary/30">No conversations yet</p>
            </div>
          )}
          {localChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full px-8 py-6 text-left transition-all border-none bg-transparent relative ${activeChat === chat.id ? "bg-primary/5" : "hover:bg-surface/50"}`}
            >
              {activeChat === chat.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-r-full"></div>}
              <div className="flex justify-between items-start mb-1">
                <p className={`text-xs font-black uppercase tracking-tighter ${activeChat === chat.id ? "text-primary" : "text-secondary font-black"}`}>{chat.name}</p>
                <span className="text-[9px] font-bold text-secondary/20">{chat.time}</span>
              </div>
              <p className="text-[10px] font-bold text-secondary/40 truncate leading-none">{chat.lastMsg}</p>
              {chat.unread && <div className="absolute right-8 bottom-6 w-2 h-2 bg-primary rounded-full border-2 border-white"></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col relative bg-surface/10">
        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-dark overflow-hidden ring-4 ring-primary/5">
              <img
                src={activeConversation?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation?.name || 'Traveler')}&background=FF7E4B&color=fff`}
                alt={activeConversation?.name || 'Traveler'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-secondary uppercase tracking-widest">{activeConversation?.name || 'Select a traveler'}</h4>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                <p className={`text-[9px] font-bold uppercase tracking-widest ${socketConnected ? 'text-green-500/70' : 'text-amber-500/70'}`}>
                  {socketConnected ? 'Active now' : 'Waiting for socket'}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            className="bg-primary text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-primary-glow border-none flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Sparkles size={14} />
            Create Offer
          </Button>
        </div>

        {/* Message List */}
        <div ref={messageListRef} className="flex-1 p-8 space-y-6 overflow-y-auto no-scrollbar scroll-smooth bg-[#F8F9FB]">
          {loadingMessages && (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-secondary/30">Loading messages...</p>
          )}
          {!loadingMessages && messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center">
              <div className="space-y-3">
                <MessageSquare size={42} className="mx-auto text-primary/25" />
                <p className="text-sm font-black uppercase tracking-widest text-secondary/35">Choose a traveler or wait for a new message</p>
              </div>
            </div>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${isOwnMessage(m) ? 'justify-end' : 'justify-start'}`}>
              {m.isOffer ? (
                <div className="max-w-xs w-full bg-secondary rounded-[32px] overflow-hidden shadow-2xl transform hover:-translate-y-1 transition-all border border-white/10">
                  <div className="bg-primary p-6 flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">{m.activity || 'Custom Trip'} Offer</p>
                      <h5 className="text-lg font-black text-white tracking-tight leading-tight">{m.text}</h5>
                    </div>
                  </div>
                  <div className="p-6 bg-secondary space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Timer size={8} /> Duration</p>
                        <p className="text-xs font-black text-white">{m.duration || (m.hours + ' Hours')}</p>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={8} /> Guests</p>
                        <p className="text-xs font-black text-white">{m.guests || 1} People</p>
                      </div>
                      {m.date && (
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={8} /> Trip Date</p>
                          <p className="text-xs font-black text-white">{m.date} at {m.offerTime || m.time}</p>
                        </div>
                      )}
                      {m.location && (
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={8} /> Meetup</p>
                          <p className="text-xs font-black text-white truncate">{m.location}</p>
                        </div>
                      )}
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/10 col-span-2 text-center">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Pay</p>
                        <p className="text-xl font-black text-primary">${m.price}</p>
                      </div>
                    </div>
                    <p className="text-[9px] font-bold text-white/40 text-center uppercase tracking-widest">
                      {m.bookingId ? `Booking created: ${String(m.bookingId).slice(0, 8)}` : 'Awaiting Traveler Payment'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`max-w-[80%] p-6 rounded-3xl text-xs font-bold leading-relaxed shadow-sm ${isOwnMessage(m) ? 'bg-primary text-white rounded-tr-none shadow-primary-glow' : 'bg-white text-secondary rounded-tl-none border border-gray-50'}`}>
                  {m.text}
                  <p className={`text-[8px] mt-2 font-black uppercase tracking-tighter ${isOwnMessage(m) ? 'text-white/40' : 'text-secondary/20'}`}>{m.time}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Experience Request Modal */}
        <ExperienceRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSend={handleSendOffer}
          buddyName="Linh Nguyen"
          buddyAvatar="/assets/img/Linh.jpg"
          hourlyRate={buddyHourlyRate}
        />

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-100 flex items-center gap-4">
          <button className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-secondary/20 hover:text-primary transition-all border-none">
            <Plus size={24} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message ${activeConversation?.name?.split(' ')[0] || 'Traveler'}...`}
              disabled={!activeChat}
              className="w-full bg-surface border border-gray-100 rounded-[24px] py-5 pl-7 pr-20 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(messageInput);
                }
              }}
            />
            <button
              disabled={!activeChat || !messageInput.trim() || sending}
              onClick={() => handleSendMessage(messageInput)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-primary disabled:bg-secondary/20 rounded-2xl flex items-center justify-center text-white shadow-primary-glow border-none hover:scale-105 transition-transform"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesTab;
