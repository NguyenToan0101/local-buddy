import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Globe, Clock, CheckCircle2, Heart, Share2, 
  ChevronLeft, Shield, Award, Languages, Calendar, MessageSquare, ArrowRight
} from 'lucide-react';
import { buddyService, experienceService } from '../../services/api';
import type { Buddy, Review, Experience } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const BuddyPreview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [loading, setLoading] = useState(true);
  const [buddyStories, setBuddyStories] = useState<Experience[]>([]);
  const [freeSlots, setFreeSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Mock reviews for evaluations
  const mockReviews: Review[] = [
    {
      id: 1,
      author: "James Wilson",
      date: "March 2024",
      content: "An incredible guide with deep knowledge of local history. The best part was the hidden cafes we visited and the authentic stories shared.",
      rating: 5,
      avatar: "https://i.pravatar.cc/150?u=james"
    },
    {
      id: 2,
      author: "Emma Thompson",
      date: "February 2024",
      content: "Very professional and friendly. Made me feel safe and welcome throughout the entire journey. Highly recommend for any first-time visitors!",
      rating: 4.8,
      avatar: "https://i.pravatar.cc/150?u=emma"
    }
  ];

  useEffect(() => {
    const fetchBuddyData = async () => {
      // Use logged in user ID or default to 1 for demo
      let buddyId = user?.id || "1";
      
      // Normalize ID if it's the default traveler u1
      if (buddyId === "u1") buddyId = "1";
      
      try {
        const [buddyData, experiencesData] = await Promise.all([
          buddyService.getById(buddyId),
          experienceService.getByBuddyId(buddyId)
        ]);
        setBuddy(buddyData);
        setBuddyStories(experiencesData || []);

        // Load free slots for this buddy
        try {
          const savedSlots = localStorage.getItem(`freeSlots_buddy_${buddyId}`);
          if (savedSlots) setFreeSlots(JSON.parse(savedSlots));
        } catch (e) { console.error("Could not load free slots", e); }
        
      } catch (error) {
        console.error("Error fetching preview data:", error);
        // Fallback to demo buddy if current ID fails
        if (buddyId !== "1") {
           try {
             const [buddyData, experiencesData] = await Promise.all([
               buddyService.getById("1"),
               experienceService.getByBuddyId("1")
             ]);
             setBuddy(buddyData);
             setBuddyStories(experiencesData || []);
           } catch (e) {
             console.error("Double fallback failed:", e);
           }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBuddyData();
    window.scrollTo(0, 0);
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-secondary/40 font-black uppercase tracking-widest text-[10px]">Generating Preview...</p>
      </div>
    </div>
  );

  if (!buddy) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFC] relative">
      {/* Floating Exit Button */}
      <div className="fixed top-8 left-8 z-[100]">
         <button 
           onClick={() => navigate('/buddy/dashboard')}
           className="flex items-center gap-3 bg-secondary text-white px-8 py-4 rounded-2xl shadow-2xl hover:bg-primary transition-all duration-500 font-black text-[10px] uppercase tracking-widest border-none group"
         >
           <ChevronLeft size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
           Exit Preview
         </button>
      </div>

      {/* Preview Badge Overlay */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary z-[101]"></div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2 rounded-full shadow-2xl pointer-events-none">
         <p className="text-[9px] font-black text-white mix-blend-difference uppercase tracking-[0.4em]">Live Profile Preview Mode</p>
      </div>

      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={buddy.image} 
            alt={buddy.name} 
            className="w-full h-full object-cover animate-ken-burns scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFC] via-black/10 to-transparent"></div>
        </div>

        {/* Floating Profile Info */}
        <div className="absolute bottom-12 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
           <div className="flex flex-col md:flex-row items-end gap-8">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-[48px] border-8 border-white shadow-premium overflow-hidden shrink-0 translate-y-24 hidden md:block">
                 <img src={buddy.image} alt={buddy.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 pb-4">
                 <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 bg-primary/20 backdrop-blur-md text-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
                       Verified Expert
                    </span>
                    <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                       <Star size={14} className="fill-primary text-primary" />
                       <span className="text-xs font-black text-secondary">{buddy.rating} Rating</span>
                    </div>
                 </div>
                 <h1 className="text-5xl md:text-8xl font-black text-secondary tracking-tighter [text-shadow:_0_4px_12px_rgb(0_0_0_/_10%)]">
                    {buddy.name}
                 </h1>
                 <div className="flex items-center gap-3 text-secondary/60 font-bold text-lg md:text-xl italic">
                    <MapPin size={24} className="text-primary" />
                    <span>{buddy.location}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          <div className="flex-1 space-y-20 md:space-y-24">
            {/* About Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <h2 className="text-3xl font-black text-secondary tracking-tight">About <span className="text-primary italic">Buddy</span></h2>
              </div>
              <div className="bg-white rounded-[48px] p-8 md:p-12 shadow-premium border border-gray-50 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl transition-colors"></div>
                <p className="text-secondary/70 text-xl md:text-2xl leading-[1.8] font-medium italic relative z-10">
                   <span className="text-5xl md:text-6xl text-primary/20 font-serif leading-none absolute -left-6 -top-2">"</span>
                   {buddy.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-10 mt-12 border-t border-gray-50">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest">Age</p>
                      <p className="text-lg md:text-xl font-black text-secondary">{buddy.age} Years</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest">Experience</p>
                      <p className="text-lg md:text-xl font-black text-secondary">{buddy.reviewCount}+ Trips</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest">Response</p>
                      <p className="text-lg md:text-xl font-black text-secondary">~1 Hour</p>
                   </div>
                </div>
              </div>
            </section>

            {/* Availability */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <h2 className="text-3xl font-black text-secondary tracking-tight">Availability <span className="text-primary italic">Slots</span></h2>
              </div>
              <div className="bg-white rounded-[48px] p-8 md:p-12 shadow-premium border border-gray-50 space-y-10">
                 <div className="grid grid-cols-7 gap-3 sm:gap-4 text-center">
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => {
                       const today = new Date();
                       const dayOfWeek = today.getDay() || 7; // Sunday is 7, Monday is 1
                       const monday = new Date(today);
                       monday.setDate(today.getDate() - dayOfWeek + 1);
                       
                       const currentDay = new Date(monday);
                       currentDay.setDate(monday.getDate() + i);
                       
                       const dateStr = currentDay.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                       const hasSlots = freeSlots.some(s => s.date === dateStr);
                       const isSelected = selectedDate === dateStr;
                       
                       return (
                         <div 
                           key={day} 
                           className={`space-y-4 group/day ${hasSlots ? 'cursor-pointer' : 'opacity-50'}`}
                           onClick={() => hasSlots && setSelectedDate(isSelected ? null : dateStr)}
                         >
                            <span className={`text-[9px] font-black tracking-[0.2em] block uppercase ${hasSlots ? 'text-primary' : 'text-secondary/20'} ${isSelected ? 'text-primary font-bold' : ''}`}>{day}</span>
                            <div className={`relative aspect-square rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all ${isSelected ? 'bg-primary text-white shadow-primary-glow scale-110 ring-4 ring-primary/20' : hasSlots ? 'bg-primary text-white shadow-primary-glow scale-105 hover:scale-110' : 'bg-surface-dark text-secondary/30'}`}>
                               <span className="font-black text-lg md:text-xl leading-none">{currentDay.getDate()}</span>
                               {hasSlots && (
                                  <span className="absolute bottom-1 sm:bottom-2 text-[7px] font-bold text-white/80 uppercase tracking-widest leading-none">
                                    {freeSlots.filter(s => s.date === dateStr).length} Slots
                                  </span>
                               )}
                            </div>
                         </div>
                       );
                    })}
                 </div>

                 {/* Specific Time Slots Display */}
                 {selectedDate && (
                    <div className="pt-8 border-t border-gray-50 flex flex-col items-center w-full animate-in fade-in slide-in-from-top-4 duration-300">
                       <p className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-4">
                          Available Times on {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                       </p>
                       <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl mx-auto">
                          {freeSlots
                             .filter(s => s.date === selectedDate)
                             .sort((a, b) => {
                                // Simple sort assuming "HH:MM AM/PM" format
                                const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
                                const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
                                return timeA - timeB;
                             })
                             .map(slot => (
                                <div key={slot.id} className="px-5 py-3 rounded-xl border-2 border-primary/20 bg-primary/5 text-primary text-sm font-black tracking-wider transition-all hover:bg-primary hover:text-white cursor-default">
                                   {slot.time}
                                </div>
                             ))
                          }
                       </div>
                    </div>
                 )}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="space-y-12">
               <h2 className="text-3xl font-black text-secondary tracking-tight">Traveler <span className="text-primary italic">Reviews</span></h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {mockReviews.map((review, idx) => (
                    <div key={idx} className="bg-white rounded-[48px] p-10 shadow-premium border border-gray-50 space-y-6">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                             <img src={review.avatar} alt={review.author} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-primary/5" />
                             <div>
                                <h4 className="font-black text-secondary text-lg tracking-tight">{review.author}</h4>
                                <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest mt-0.5">{review.date}</p>
                             </div>
                          </div>
                          <div className="flex gap-1 pt-1.5">
                             {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className={`${s <= review.rating ? 'fill-primary text-primary' : 'text-gray-200'}`} />)}
                          </div>
                       </div>
                       <p className="text-secondary/60 leading-[1.8] font-medium italic text-base">"{review.content}"</p>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[400px]">
             <div className="sticky top-12 space-y-8">
                <div className="bg-white rounded-[48px] p-10 md:p-12 shadow-premium border border-gray-50 flex flex-col gap-10 relative overflow-hidden">
                   <div className="space-y-4">
                     <p className="text-[9px] font-black text-secondary/20 uppercase tracking-[0.2em]">Investment to Explore</p>
                     <div className="flex items-end gap-2">
                        <span className="text-7xl font-black text-secondary tracking-tighter">${buddy.price}</span>
                        <span className="text-xs font-black text-secondary/20 uppercase tracking-widest mb-4">/ Hour</span>
                     </div>
                   </div>
                   <Button className="w-full py-7 text-xs font-black tracking-[0.2em] shadow-primary-glow uppercase rounded-2xl flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                      <MessageSquare size={18} /> Send Message (Disabled)
                   </Button>
                   <div className="p-6 bg-surface-dark rounded-3xl border border-gray-100 flex items-center gap-4">
                      <Shield className="text-primary/40 shrink-0" size={20} />
                      <p className="text-[9px] font-black text-secondary/40 leading-relaxed uppercase tracking-widest">This is a preview of your public profile.</p>
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-ken-burns {
          animation: ken-burns 20s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default BuddyPreview;
