import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Globe, Clock, CheckCircle2, MessageCircle, Heart, Share2, 
  MoreHorizontal, ChevronLeft, Play, Shield, Award, Languages, Calendar, X, MessageSquare
} from 'lucide-react';
import { buddyService, experienceService } from '../../services/api';
import type { Buddy, Review, Experience } from '../../services/api';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

const BuddyProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [buddyStories, setBuddyStories] = useState<Experience[]>([]);
  const [freeSlots, setFreeSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { user } = useAuth();


  useEffect(() => {
    const fetchBuddy = async () => {
      if (!id) return;
      try {
        console.log("DEBUG: Fetching data for ID:", id);
        const [buddyData, experiencesData] = await Promise.all([
          buddyService.getById(id),
          experienceService.getByBuddyId(id)
        ]);
        console.log("DEBUG: Buddy:", buddyData);
        console.log("DEBUG: Stories:", experiencesData);
        setBuddy(buddyData);
        const sortedStories = (experiencesData || []).sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
        setBuddyStories(sortedStories);

        // Load free slots
        try {
          const savedSlots = localStorage.getItem(`freeSlots_buddy_${id}`);
          if (savedSlots && JSON.parse(savedSlots).length > 0) {
            setFreeSlots(JSON.parse(savedSlots));
          } else {
            // Fallback mock data for demo if localStorage is empty (e.g., when a Traveller logs in)
            const today = new Date();
            const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
            const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
            
            const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            
            const mockSlots = [
              { id: 'm1', date: formatDate(tomorrow), time: '09:00 AM', status: 'FREE' },
              { id: 'm2', date: formatDate(tomorrow), time: '11:00 AM', status: 'FREE' },
              { id: 'm3', date: formatDate(dayAfter), time: '02:00 PM', status: 'FREE' },
              { id: 'm4', date: formatDate(dayAfter), time: '04:00 PM', status: 'FREE' }
            ];
            setFreeSlots(mockSlots);
          }
        } catch (e) {
          console.error("Could not load free slots", e);
        }
        
      } catch (error) {
        console.error("DEBUG: Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuddy();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-secondary/40 font-black uppercase tracking-widest text-[10px]">Discovering Buddy...</p>
      </div>
    </div>
  );

  if (!buddy) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
      <div className="text-center space-y-6">
        <h2 className="text-4xl font-black text-secondary tracking-tight">Buddy not found</h2>
        <Link to="/traveller/home">
          <Button className="rounded-2xl px-8 py-4 uppercase tracking-widest font-black text-[10px]">Back to Home</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <Navbar />

      {/* Hero Section - Full Height Header */}
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        {/* Background Image with Ken Burns */}
        <div className="absolute inset-0">
          <img 
            src={buddy.image} 
            alt={buddy.name} 
            className="w-full h-full object-cover animate-ken-burns scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FBFBFC] via-black/10 to-transparent"></div>
        </div>

        {/* Action Bar */}
        <div className="absolute top-32 left-4 sm:px-6 lg:px-16 right-4 sm:right-6 lg:right-16 z-20 flex justify-between items-center w-full max-w-7xl mx-auto left-0 right-0">
          <Link to="/traveller/home" className="group flex items-center gap-3 bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-premium border border-white/20 hover:bg-primary hover:text-white transition-all duration-500 font-black text-[10px] uppercase tracking-widest">
            <ChevronLeft size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex gap-3">
            <button className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-premium border border-white/20 flex items-center justify-center text-secondary/40 hover:text-primary transition-all">
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-premium border border-white/20 flex items-center justify-center transition-all ${isLiked ? 'text-red-500' : 'text-secondary/40 hover:text-red-500'}`}
            >
              <Heart size={20} className={isLiked ? 'fill-current' : ''} />
            </button>
          </div>
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
          
          {/* Left Column: Narrative Content */}
          <div className="flex-1 space-y-20 md:space-y-24">
            
            {/* About Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                 <h2 className="text-3xl font-black text-secondary tracking-tight">About <span className="text-primary italic">Buddy</span></h2>
              </div>
              <div className="bg-white rounded-[48px] p-8 md:p-12 shadow-premium border border-gray-50 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                <p className="text-secondary/70 text-xl md:text-2xl leading-[1.8] font-medium italic relative z-10">
                   <span className="text-5xl md:text-6xl text-primary/20 font-serif leading-none absolute -left-6 -top-2">"</span>
                   {buddy.description}
                   <span className="text-5xl md:text-6xl text-primary/20 font-serif leading-none absolute -bottom-10 inline-block translate-y-4">"</span>
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

            {/* Expertise & Languages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <section className="space-y-8">
                 <div className="flex items-center gap-4">
                    <Award size={20} className="text-primary" />
                    <h3 className="text-xl font-black text-secondary tracking-tight uppercase">Interests</h3>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {buddy.tags?.map((tag) => (
                     <span key={tag} className="px-2.5 py-1 bg-surface-dark text-secondary/50 text-[8px] font-black rounded-lg uppercase tracking-wider border border-gray-100 transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary">
                       {tag}
                     </span>
                   ))}
                 </div>
               </section>

               <section className="space-y-8">
                 <div className="flex items-center gap-4">
                    <Languages size={20} className="text-primary" />
                    <h3 className="text-xl font-black text-secondary tracking-tight uppercase">Languages</h3>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {buddy.languages.map((lang) => (
                     <span key={lang} className="px-5 py-2.5 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                       {lang}
                     </span>
                   ))}
                 </div>
               </section>
            </div>

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
                             <span className={`text-[9px] font-black tracking-[0.2em] block uppercase transition-colors ${hasSlots ? 'text-primary' : 'text-secondary/20 block'} ${isSelected ? 'text-primary font-bold' : ''}`}>{day}</span>
                             <div className={`relative aspect-square rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center transition-all duration-500 ${isSelected ? 'bg-primary text-white shadow-primary-glow scale-110 ring-4 ring-primary/20' : hasSlots ? 'bg-primary text-white shadow-primary-glow scale-105 hover:scale-110' : 'bg-surface-dark text-secondary/10'}`}>
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
                 <div className="p-6 bg-surface-dark rounded-3xl border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary">
                       <Calendar size={20} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Typical Schedule</p>
                       <p className="text-sm font-bold text-secondary tracking-tight">{buddy.availability || "Flexible - Usually available on weekdays & weekend afternoons"}</p>
                    </div>
                 </div>
              </div>
            </section>

            {/* Reviews Section */}
            <section className="space-y-12">
               <div className="flex justify-between items-end flex-wrap gap-4">
                   <div className="space-y-2">
                      <h2 className="text-3xl font-black text-secondary tracking-tight">Traveler <span className="text-primary italic">Reviews</span></h2>
                      <p className="text-secondary/40 font-bold text-sm tracking-tight">Authentic evaluations from the community.</p>
                   </div>
                   <Link 
                     to="/traveller/experiences"
                     className="text-[10px] font-black uppercase tracking-widest text-primary p-0 h-auto self-end hover:text-primary-dark transition-colors"
                   >
                     View all stories
                   </Link>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Show actual reviews for evaluations */}
                  {(buddy.reviews || []).map((review, idx) => (
                    <div key={idx} className="bg-white rounded-[48px] p-10 shadow-premium border border-gray-50 space-y-6 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-700">
                       <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                             <img 
                               src={review.avatar} 
                               alt={review.author} 
                               className="w-14 h-14 rounded-2xl object-cover ring-4 ring-primary/5" 
                             />
                             <div>
                                <h4 className="font-black text-secondary text-lg tracking-tight">{review.author}</h4>
                                <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest mt-0.5">{review.date}</p>
                             </div>
                          </div>
                          <div className="flex gap-1 pt-1.5">
                             {[1, 2, 3, 4, 5].map(s => (
                               <Star key={s} size={10} className={`${s <= review.rating ? 'fill-primary text-primary' : 'text-gray-200'}`} />
                             ))}
                          </div>
                       </div>
                       <p className="text-secondary/60 leading-[1.8] font-medium italic text-base">"{review.content}"</p>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:w-[400px]">
            <div className="sticky top-32 space-y-8">
               {/* Booking Card */}
               <div className="bg-white rounded-[48px] p-10 md:p-12 shadow-premium border border-gray-50 flex flex-col gap-10 relative overflow-hidden">
                  {/* Premium Badge */}
                  <div className="absolute top-0 right-0 py-2 px-10 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.3em] rotate-45 translate-x-12 translate-y-4 w-40 text-center">
                     Popular
                  </div>

                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-secondary/20 uppercase tracking-[0.2em]">Investment to Explore</p>
                    <div className="flex items-end gap-2">
                       <span className="text-7xl font-black text-secondary tracking-tighter">${buddy.price}</span>
                       <span className="text-xs font-black text-secondary/20 uppercase tracking-widest mb-4">/ Hour</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <Button 
                        onClick={() => {
                          if (user?.role === 'TRAVELER' && user?.verificationStatus !== 'verified') {
                            navigate('/traveller/profile');
                          } else {
                            navigate(`/traveller/messages?buddyId=${buddy.id}`);
                          }
                        }}
                        className="w-full py-7 text-xs font-black tracking-[0.2em] shadow-primary-glow uppercase rounded-2xl flex items-center justify-center gap-2"
                     >
                        <MessageSquare size={18} /> Send Message
                     </Button>
                  </div>

                  <div className="space-y-8 pt-12 border-t border-gray-50">
                    <div className="flex items-center gap-5 group cursor-pointer">
                       <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all duration-500 shadow-inner">
                          <CheckCircle2 size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-black text-secondary uppercase tracking-tight">Identity Verified</p>
                          <p className="text-[9px] font-bold text-secondary/20 uppercase tracking-widest leading-none">Vetted by Local Buddy</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-5 group cursor-pointer">
                       <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                          <Clock size={24} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-black text-secondary uppercase tracking-tight">Active Explorer</p>
                          <p className="text-[9px] font-bold text-secondary/20 uppercase tracking-widest leading-none">Replies in minutes</p>
                       </div>
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div className="bg-surface-dark rounded-3xl p-6 border border-gray-100 flex items-center gap-4">
                     <Shield className="text-primary/40 shrink-0" size={20} />
                     <p className="text-[9px] font-black text-secondary/40 leading-relaxed uppercase tracking-widest">Secure payments & verified buddies for your peace of mind.</p>
                  </div>
               </div>

               {/* Experience Preview */}
               <div className="bg-secondary rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl group cursor-pointer transition-transform hover:-translate-y-1 duration-500">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                  <div className="space-y-8 relative z-10">
                     <Award className="text-primary" size={32} />
                     <div className="space-y-2">
                        <div className="flex items-center gap-2">
                           <h4 className="text-2xl font-black tracking-tight leading-tight uppercase">
                              {buddyStories.find((s: any) => s.pinned) ? "Featured Traveler Story" : "Recent Traveler Story"}
                           </h4>
                           {buddyStories.some((s: any) => s.pinned) && (
                              <div className="bg-primary px-2 py-0.5 rounded-lg">
                                 <Star size={10} className="fill-white text-white" />
                              </div>
                           )}
                        </div>
                        <p className="text-white/60 font-medium text-base tracking-tight italic leading-relaxed">
                           {buddyStories.length > 0 
                              ? (buddyStories.find((s: any) => s.pinned) || buddyStories[0]).storyContent.substring(0, 120) + "..."
                              : "Join authentic journeys from fellow travelers."}
                        </p>
                     </div>
                     <Link to={buddyStories.length > 0 ? `/traveller/experience/${(buddyStories.find((s: any) => s.pinned) || buddyStories[0]).id}` : "/traveller/experiences"} className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest hover:gap-4 transition-all group-hover:translate-x-2">
                        Explore Full Story <ArrowRight size={14} strokeWidth={4} />
                     </Link>
                  </div>
               </div>
            </div>
          </aside>

        </div>
      </main>

      <Footer />


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

// Internal utility for ArrowRight if not imported
const ArrowRight = ({ size, className, strokeWidth }: { size?: number, className?: string, strokeWidth?: number }) => (
  <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default BuddyProfile;
