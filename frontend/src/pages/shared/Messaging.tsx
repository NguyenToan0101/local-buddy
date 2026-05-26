import React, { useState, useEffect, useRef } from 'react';
import { Search, Paperclip, Image as ImageIcon, Send, Plus, MessageCircle, CheckCheck, DollarSign, Timer, Users, Calendar, MapPin } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { messageService, buddyService } from '../../services/api';
import Button from '../../components/ui/Button';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Messaging: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [allBuddies, setAllBuddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const [searchParams] = useSearchParams();
  const buddyIdFromQuery = searchParams.get('buddyId');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convs, buddies] = await Promise.all([
          messageService.getConversations(),
          buddyService.getAll()
        ]);
        setConversations(convs);
        setAllBuddies(buddies);
        
        if (convs.length > 0) {
          const targetConv = buddyIdFromQuery 
            ? convs.find((c: any) => c.buddyId === buddyIdFromQuery)
            : convs[0];
            
          if (targetConv) {
            setActiveChatId(targetConv.id);
            setActiveMessages(targetConv.messages || []);
          } else {
            setActiveChatId(convs[0].id);
            setActiveMessages(convs[0].messages || []);
          }
        }
      } catch (error) {
        console.error("Error fetching messaging data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [buddyIdFromQuery]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeMessages]);

  const getFullChatInfo = (conv: any) => {
    const buddyInfo = allBuddies.find(b => b.id === conv.buddyId);
    return { 
      ...conv, 
      name: buddyInfo?.name || "User", 
      avatar: buddyInfo?.image || `https://i.pravatar.cc/100?u=${conv.id}`,
      role: buddyInfo?.role || "Traveler"
    };
  };

  const activeConv = conversations.find(c => c.id === activeChatId);
  const activeChatInfo = activeConv ? getFullChatInfo(activeConv) : null;

  const handleSelectChat = (conv: any) => {
    setActiveChatId(conv.id);
    setActiveMessages(conv.messages || []);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      type: "sent",
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setActiveMessages([...activeMessages, newMessage]);
    setMessageInput("");
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
      <Navbar />
      
      {/* Fit chat into one viewport (under fixed navbar) */}
      <main className="pt-28 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto w-full flex flex-col overflow-hidden h-[calc(100vh-96px)]">
        <div className="bg-white rounded-[48px] shadow-premium overflow-hidden flex flex-1 border border-gray-50 min-h-0">
          {/* Conversation List Sidebar */}
          <aside className="w-[380px] bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm overflow-hidden">
             <div className="p-8 pb-4 space-y-6">
                <div className="flex justify-between items-center">
                   <h1 className="text-2xl font-black text-secondary tracking-tighter">Inbox</h1>
                   <button className="w-10 h-10 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all flex items-center justify-center text-primary">
                      <Plus size={20} />
                   </button>
                </div>
                <div className="relative group">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search..." 
                     className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/10 focus:bg-white rounded-2xl py-4 pl-12 pr-4 transition-all outline-none text-sm font-bold text-secondary placeholder:text-secondary/20 shadow-inner"
                   />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide py-2">
                {loading ? (
                   <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="w-8 h-8 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-[9px] font-black text-secondary/20 uppercase tracking-[0.3em]">Loading...</p>
                   </div>
                ) : conversations.length > 0 ? conversations.map(conv => {
                   const fullInfo = getFullChatInfo(conv);
                   const isActive = activeChatId === conv.id;
                   return (
                      <div 
                        key={conv.id}
                        onClick={() => handleSelectChat(conv)}
                        className={`p-4 rounded-[32px] cursor-pointer transition-all duration-300 flex items-center gap-4 border-2 ${isActive ? 'bg-white border-primary/20 shadow-xl shadow-primary/5 translate-x-1' : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
                      >
                        <div className="relative shrink-0">
                           <img src={fullInfo.avatar} alt={fullInfo.name} className={`w-14 h-14 rounded-2xl object-cover shadow-md transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                           {conv.status === 'online' && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-white rounded-full"></div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-0.5">
                              <h3 className={`font-black tracking-tight truncate ${isActive ? 'text-secondary text-base' : 'text-secondary/80 text-sm'}`}>{fullInfo.name}</h3>
                              <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-primary' : 'text-secondary/20'}`}>{conv.time}</span>
                           </div>
                           <p className={`text-[12px] font-medium truncate ${isActive ? 'text-secondary/60' : 'text-secondary/30'}`}>{conv.lastMsg}</p>
                        </div>
                     </div>
                   );
                }) : (
                  <div className="text-center py-10">
                    <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">No chats</p>
                  </div>
                )}
             </div>

             <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                <button className="w-full py-4 bg-white border-2 border-dashed border-secondary/10 rounded-2xl text-secondary/30 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:border-primary/30 hover:text-primary transition-all">
                   <Plus size={14} /> New Buddy Chat
                </button>
             </div>
          </aside>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
             {activeChatId && activeChatInfo ? (
                <>
                   {/* Chat Header */}
                   <header className="h-24 px-8 border-b border-gray-50 flex items-center justify-between z-10">
                      <div className="flex items-center gap-4">
                         <div className="relative group cursor-pointer">
                            <img src={activeChatInfo.avatar} alt="Buddy" className="w-12 h-12 rounded-2xl object-cover ring-4 ring-primary/5" />
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <h2 className="text-lg font-black text-secondary tracking-tight">{activeChatInfo.name}</h2>
                               <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded">{activeChatInfo.role}</span>
                            </div>
                            <p className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                            </p>
                         </div>
                      </div>
                   </header>

                   {/* Messages Container */}
                   <div 
                     ref={scrollRef}
                     className="flex-1 overflow-y-auto p-10 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
                   >
                      {activeMessages.map((msg: any) => {
                         const isSent = msg.type === 'sent';
                         return (
                            <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                               <div className={`max-w-[70%] space-y-2 flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
                                  <div className={`shadow-md ${
                                     isSent 
                                        ? 'bg-primary text-white rounded-[24px] rounded-tr-none px-6 py-4 text-[14px] font-bold leading-relaxed' 
                                        : msg.isOffer
                                           ? 'bg-secondary rounded-[32px] overflow-hidden' 
                                           : 'bg-white border border-gray-100 text-secondary rounded-[24px] rounded-tl-none px-6 py-4 text-[14px] font-bold leading-relaxed'
                                  }`}>
                                     {msg.isOffer ? (
                                       <div className="max-w-xs w-full bg-secondary overflow-hidden">
                                          <div className="bg-primary p-6 flex flex-col items-center text-center space-y-4">
                                             <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur">
                                                <DollarSign size={24} />
                                             </div>
                                             <div>
                                                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">{msg.activity || 'Custom Trip'} Offer</p>
                                                <h5 className="text-lg font-black text-white tracking-tight leading-tight">{msg.text}</h5>
                                             </div>
                                          </div>
                                          <div className="p-6 bg-secondary space-y-4">
                                             <div className="grid grid-cols-2 gap-3 text-left">
                                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Timer size={8}/> Duration</p>
                                                   <p className="text-xs font-black text-white">{msg.duration || (msg.hours + ' Hours')}</p>
                                                </div>
                                                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Users size={8}/> Guests</p>
                                                   <p className="text-xs font-black text-white">{msg.guests || 1} People</p>
                                                </div>
                                                {msg.date && (
                                                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2">
                                                     <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={8}/> Trip Date</p>
                                                     <p className="text-xs font-black text-white">{msg.date} at {msg.time}</p>
                                                  </div>
                                                )}
                                                {msg.location && (
                                                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 col-span-2">
                                                     <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={8}/> Meetup</p>
                                                     <p className="text-xs font-black text-white truncate">{msg.location}</p>
                                                  </div>
                                                )}
                                                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 col-span-2 text-center">
                                                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Pay</p>
                                                   <p className="text-xl font-black text-primary">${msg.price}</p>
                                                </div>
                                             </div>
                                             <Button className="w-full bg-primary text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-primary-glow border-none">
                                               Book & Pay Now
                                             </Button>
                                          </div>
                                       </div>
                                     ) : (
                                       msg.text || msg.content
                                     )}
                                  </div>
                                  <div className="flex items-center gap-1.5 px-2">
                                     <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest">{msg.time}</span>
                                     {isSent && <CheckCheck size={12} className="text-primary/40" />}
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                   </div>

                   {/* Input Footer */}
                   <footer className="px-8 py-6 border-t border-gray-50">
                      <div className="relative flex items-center gap-3">
                         <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-[28px] px-2 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all border border-transparent focus-within:border-primary/5 shadow-inner">
                            <button className="w-10 h-10 rounded-full text-secondary/30 hover:text-primary transition-all flex items-center justify-center shrink-0"><ImageIcon size={20} /></button>
                            <input 
                              type="text" 
                              value={messageInput}
                              onChange={(e) => setMessageInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Type a message..." 
                              className="flex-1 bg-transparent border-none outline-none font-bold text-secondary text-sm placeholder:text-secondary/20"
                            />
                            <button 
                              onClick={handleSendMessage}
                              className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
                            >
                               <Send size={18} />
                            </button>
                         </div>

                      </div>
                   </footer>
                </>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/20 p-10 text-center">
                   <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                      <MessageCircle size={32} className="text-primary/20" />
                   </div>
                   <h2 className="text-2xl font-black text-secondary tracking-tighter mb-2">Select a Buddy</h2>
                   <p className="text-secondary/30 text-xs font-bold font-medium max-w-[200px] leading-relaxed uppercase tracking-widest">Start planning your next amazing adventure today.</p>
                </div>
             )}
          </main>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Messaging;
