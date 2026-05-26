import React, { useState, useEffect } from 'react';
import { Send, Plus, Search, DollarSign, Sparkles, X, MapPin, Users, Calendar, Clock, Timer } from 'lucide-react';
import Button from '../ui/Button';
import { messageService } from '../../services/api';
import ExperienceRequestModal from './ExperienceRequestModal';

interface MessagesTabProps {
  chats: any[];
}

const MessagesTab: React.FC<MessagesTabProps> = ({ chats }) => {
  const [activeChat, setActiveChat] = useState<string | null>(chats[0]?.id || null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

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
      isOffer: true,
      text: `Custom Offer: ${data.duration} of ${data.activity}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    try {
      await messageService.sendMessage(activeChat, offerMsg);
      setMessages([...messages, { ...offerMsg, id: Date.now() }]);
      setShowRequestModal(false);
    } catch (error) {
      console.error("Failed to send offer:", error);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChat || !text.trim()) return;
    const msg = {
      type: 'sent',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await messageService.sendMessage(activeChat, msg);
      setMessages([...messages, { ...msg, id: Date.now() }]);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="bg-white rounded-[48px] h-[800px] shadow-premium border border-gray-50 overflow-hidden flex">
      {/* Chat List */}
      <div className="w-80 border-r border-gray-50 flex flex-col">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-secondary tracking-tight">Sales Center</h3>
            <button className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-secondary/20 hover:text-primary transition-all border-none">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
             <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" />
             <input type="text" placeholder="Search conversations..." className="w-full bg-surface border-none rounded-xl py-3 pl-11 pr-4 text-[10px] font-bold text-secondary outline-none focus:ring-0" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {chats.map((chat) => (
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
        <div className="p-8 bg-white border-b border-gray-50 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-surface-dark overflow-hidden ring-4 ring-primary/5">
                <img src={`https://i.pravatar.cc/100?u=${activeChat}`} alt="User" />
             </div>
             <div>
                <h4 className="text-sm font-black text-secondary uppercase tracking-widest">{chats.find(c => c.id === activeChat)?.name}</h4>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                   <p className="text-[9px] font-bold text-green-500/60 uppercase tracking-widest">Active Now</p>
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
        <div className="flex-1 p-10 space-y-8 overflow-y-auto no-scrollbar scroll-smooth">
           {messages.map((m: any) => (
             <div key={m.id} className={`flex ${m.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
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
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Timer size={8}/> Duration</p>
                              <p className="text-xs font-black text-white">{m.duration || (m.hours + ' Hours')}</p>
                           </div>
                           <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={8}/> Guests</p>
                              <p className="text-xs font-black text-white">{m.guests || 1} People</p>
                           </div>
                           {m.date && (
                             <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={8}/> Trip Date</p>
                                <p className="text-xs font-black text-white">{m.date} at {m.time}</p>
                             </div>
                           )}
                           {m.location && (
                             <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={8}/> Meetup</p>
                                <p className="text-xs font-black text-white truncate">{m.location}</p>
                             </div>
                           )}
                           <div className="bg-white/5 p-3 rounded-2xl border border-white/10 col-span-2 text-center">
                              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Pay</p>
                              <p className="text-xl font-black text-primary">${m.price}</p>
                           </div>
                        </div>
                        <p className="text-[9px] font-bold text-white/40 text-center uppercase tracking-widest">Awaiting Traveler Payment</p>
                     </div>
                  </div>
                ) : (
                  <div className={`max-w-[80%] p-6 rounded-3xl text-xs font-bold leading-relaxed shadow-sm ${m.type === 'sent' ? 'bg-primary text-white rounded-tr-none shadow-primary-glow' : 'bg-white text-secondary rounded-tl-none border border-gray-50'}`}>
                    {m.text}
                    <p className={`text-[8px] mt-2 font-black uppercase tracking-tighter ${m.type === 'sent' ? 'text-white/40' : 'text-secondary/20'}`}>{m.time}</p>
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
        />

        {/* Input Area */}
        <div className="p-8 bg-white border-t border-gray-50 flex items-center gap-6">
          <button className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center text-secondary/20 hover:text-primary transition-all border-none">
             <Plus size={24} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder={`Message ${chats.find(c => c.id === activeChat)?.name?.split(' ')[0] || 'Traveler'}...`} 
              className="w-full bg-surface border-none rounded-[28px] py-6 pl-8 pr-20 text-xs font-bold text-secondary outline-none focus:ring-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }}
            />
            <button 
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement);
                handleSendMessage(input.value);
                input.value = '';
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-primary-glow border-none hover:scale-105 transition-transform"
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
