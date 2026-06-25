import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Globe, Clock, CheckCircle2, Heart, Share2, 
  ChevronLeft, Shield, Award, Languages, Calendar, MessageSquare
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
  const [activeTab, setActiveTab] = useState<'about' | 'slots' | 'reviews'>('about');

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
      let buddyId = user?.id || "1";
      if (buddyId === "u1") buddyId = "1";
      
      try {
        const [buddyData, experiencesData] = await Promise.all([
          buddyService.getById(buddyId),
          experienceService.getByBuddyId(buddyId)
        ]);
        setBuddy(buddyData);
        setBuddyStories(experiencesData || []);

        try {
          const savedSlots = localStorage.getItem(`freeSlots_buddy_${buddyId}`);
          if (savedSlots) setFreeSlots(JSON.parse(savedSlots));
        } catch (e) { console.error("Could not load free slots", e); }
        
      } catch (error) {
        console.error("Error fetching preview data:", error);
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

  const isVerified = buddy.verificationStatus === 'verified' || buddy.verificationStatus === 'auto_approved' || buddy.verificationStatus === 'manual_approved';
  const trustScore = isVerified ? Math.min(100, 94 + Math.round(buddy.rating * 1.2)) : Math.min(88, 65 + Math.round(buddy.rating * 3.5));

  const TabContent = () => (
    <>
      {activeTab === 'about' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm relative overflow-hidden">
            <span className="text-3xl text-primary/10 font-serif absolute left-3 top-1 leading-none">"</span>
            <p className="text-secondary/70 text-sm font-medium leading-relaxed italic relative z-10 pl-4">
              {buddy.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-4 border border-gray-50 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-secondary/30">
                <Award size={13} />
                <span className="text-[8px] font-black uppercase tracking-widest">Interests</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {buddy.tags?.slice(0, 5).map((tag) => (
                  <span key={tag} className="text-[8px] font-black text-secondary/50 uppercase bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-gray-50 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-secondary/30">
                <Globe size={13} />
                <span className="text-[8px] font-black uppercase tracking-widest">Languages</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {buddy.languages.slice(0, 4).map((lang) => (
                  <span key={lang} className="text-[8px] font-black text-white uppercase bg-secondary px-2 py-0.5 rounded">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 rounded-3xl p-5 border border-emerald-500/10 space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-emerald-600 fill-current" />
              <h4 className="text-xs font-black text-secondary uppercase tracking-wider">Identity & Trust Credentials</h4>
            </div>
            <div className="space-y-2 text-[10px] font-bold text-secondary/60 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>ID Verification status: {isVerified ? 'VERIFIED' : 'PENDING'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Timed Evidence Review: {isVerified ? 'COMPLETED' : 'PENDING'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Safety Guidelines Compliance: 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'slots' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-secondary/30 uppercase tracking-widest">Select Available Date</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => {
                const today = new Date();
                const dayOfWeek = today.getDay() || 7;
                const monday = new Date(today);
                monday.setDate(today.getDate() - dayOfWeek + 1);
                const currentDay = new Date(monday);
                currentDay.setDate(monday.getDate() + i);
                const dateStr = currentDay.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                const hasSlots = freeSlots.some(s => s.date === dateStr);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    disabled={!hasSlots}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border shrink-0 w-12 snap-start cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
                        : hasSlots
                          ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10'
                          : 'bg-slate-50 text-secondary/10 border-slate-100 opacity-40'
                    }`}
                  >
                    <span className="text-[7px] font-black uppercase tracking-wider">{day}</span>
                    <span className="text-sm font-black">{currentDay.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {selectedDate ? (
              <div className="pt-3 border-t border-gray-50 space-y-2">
                <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest text-center">Available hours</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {freeSlots.filter(s => s.date === selectedDate).map(slot => (
                    <span key={slot.id} className="px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg">
                      {slot.time}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] font-bold text-secondary/40 text-center py-2">Tap an active date slot to view specific meetup times.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {mockReviews.map((review, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <img src={review.avatar} alt={review.author} className="w-8 h-8 rounded-xl object-cover" />
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-black text-secondary text-xs">{review.author}</h4>
                      <span className="bg-emerald-500/10 text-emerald-600 text-[6px] font-black uppercase tracking-widest px-1 py-0.5 rounded flex items-center gap-0.5">
                        <Shield size={6} className="fill-current" /> Verified Trip
                      </span>
                    </div>
                    <p className="text-[7px] font-black text-secondary/20 uppercase tracking-widest mt-0.5">{review.date}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={8} className={`${s <= review.rating ? 'fill-primary text-primary' : 'text-slate-100'}`} />
                  ))}
                </div>
              </div>
              <p className="text-secondary/60 text-xs font-medium italic">"{review.content}"</p>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] relative pb-20 md:pb-8">
      {/* Exit Preview Warning bar header */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary z-[101]"></div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white/90 backdrop-blur-md border border-gray-100 px-5 py-2 rounded-full shadow-md flex items-center gap-3">
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
         <p className="text-[8px] font-black text-secondary uppercase tracking-[0.25em]">Profile Preview Mode</p>
         <button 
           onClick={() => navigate('/buddy/dashboard')}
           className="px-2.5 py-1 bg-secondary hover:bg-primary text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors cursor-pointer border-none"
         >
           Exit
         </button>
      </div>

      {/* Main Preview */}
      <div className="pt-16 max-w-screen-xl mx-auto px-6 lg:px-16 py-8">
        
        {/* ===== MOBILE PREVIEW ===== */}
        <div className="md:hidden flex flex-col space-y-6">
          <div className="relative h-[200px] w-full rounded-2xl overflow-hidden bg-slate-900 shrink-0 shadow-sm">
            <img src={buddy.image} alt={buddy.name} className="w-full h-full object-cover opacity-80" />
            <div className="absolute -bottom-6 left-6 w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow bg-slate-100">
              <img src={buddy.image} alt={buddy.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="pt-10 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-secondary tracking-tight">{buddy.name}</h1>
                <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-widest">{buddy.age} yrs • {buddy.location}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-primary">${buddy.price}</span>
                <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block">/ hr</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-gray-100 px-2 py-1 rounded-lg">
                <Star size={10} className="fill-primary text-primary" />
                <span className="text-[9px] font-black text-secondary">{buddy.rating}</span>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-lg border border-emerald-500/15 font-black text-[9px]">
                <Shield size={8} className="fill-current" />
                <span>{trustScore}% Trust</span>
              </div>
            </div>
          </div>

          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-gray-100">
            {(['about', 'slots', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-secondary/40'
                }`}
              >
                {tab === 'slots' ? 'Availability' : tab}
              </button>
            ))}
          </div>

          <div className="pb-16">
            <TabContent />
          </div>

          {/* Locked sticky bottom controls */}
          <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex gap-3 z-30 shadow-md">
            <button disabled className="flex-1 py-3 bg-slate-50 border border-slate-100 text-secondary/30 text-[9px] font-black uppercase tracking-widest rounded-xl opacity-50 cursor-not-allowed">
              Message (Locked)
            </button>
            <button disabled className="flex-[2] py-3 bg-primary/40 text-white text-[9px] font-black uppercase tracking-widest rounded-xl cursor-not-allowed">
              Book (Locked)
            </button>
          </footer>
        </div>

        {/* ===== DESKTOP PREVIEW ===== */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {/* Left panel */}
          <aside className="col-span-1 space-y-6">
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-900 shadow-sm border border-gray-100">
              <img src={buddy.image} alt={buddy.name} className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-2xl font-black">${buddy.price}</span>
                <span className="text-white/50 text-xs font-bold">/ hour</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                  <Star size={11} className="fill-primary text-primary" />
                  <span className="text-xs font-black text-secondary">{buddy.rating}</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-500/15 font-black text-xs">
                  <Shield size={10} className="fill-current" />
                  <span>{trustScore}% Trust</span>
                </div>
              </div>
              <p className="text-xs text-secondary/40 font-bold uppercase tracking-wider">{buddy.location}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
              <Shield className="text-primary shrink-0" size={16} />
              <p className="text-[8px] font-black text-secondary/40 leading-normal uppercase tracking-widest">
                This is a preview of your public profile page.
              </p>
            </div>
          </aside>

          {/* Right details */}
          <div className="col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-secondary tracking-tight">{buddy.name}</h1>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-lg">Verified Buddy</span>
              </div>
              <p className="text-secondary/40 font-bold text-xs mt-1">{buddy.age} years old • {buddy.location}</p>
            </div>

            <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-gray-100">
              {(['about', 'slots', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === tab ? 'bg-white text-primary shadow-sm border border-gray-50' : 'text-secondary/40 hover:text-secondary/60'
                  }`}
                >
                  {tab === 'slots' ? 'Availability' : tab}
                </button>
              ))}
            </div>

            <TabContent />
          </div>
        </div>

      </div>
    </div>
  );
};

export default BuddyPreview;
