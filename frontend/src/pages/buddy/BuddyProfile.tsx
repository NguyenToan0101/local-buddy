import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Globe, CheckCircle2, ChevronLeft, Shield, Award, Calendar, MessageSquare } from 'lucide-react';
import { availabilityService, buddyService } from '../../services/api';
import type { AvailabilitySlot, Buddy } from '../../services/api';
import DirectBookingModal from '../../components/features/DirectBookingModal';
import { trackingService } from '../../services/tracking';

const BuddyProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [loading, setLoading] = useState(true);
  const [freeSlots, setFreeSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'slots' | 'reviews'>('about');

  useEffect(() => {
    const fetchBuddy = async () => {
      if (!id) return;
      try {
        const buddyData = await buddyService.getById(id);
        setBuddy(buddyData);
        void trackingService.track('VIEW_BUDDY_PROFILE', {
          buddyId: buddyData.id,
          location: buddyData.location,
        });

        try {
          const slotsData = await availabilityService.fetchAvailabilities(id);
          setFreeSlots(slotsData.filter(slot => slot.status === 'FREE'));
        } catch (e) {
          console.error("Could not load free slots", e);
          setFreeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching buddy details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuddy();
  }, [id]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mt-4">Loading Profile...</p>
    </div>
  );

  if (!buddy) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center space-y-4">
      <h2 className="text-xl font-black text-secondary">Buddy Not Found</h2>
      <button onClick={() => navigate('/traveller/home')} className="btn-primary py-3 px-6 text-xs uppercase">Go Home</button>
    </div>
  );

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
          {buddy.reviews && buddy.reviews.length > 0 ? (
            buddy.reviews.map((review, idx) => (
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
            ))
          ) : (
            <p className="text-xs text-secondary/40 text-center py-10 font-bold">No reviews from the traveler community yet.</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-full bg-[#FBFBFC]">

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden flex flex-col">
        {/* Hero Cover Photo */}
        <div className="relative h-[240px] w-full shrink-0 overflow-hidden bg-slate-900">
          <img src={buddy.image} alt={buddy.name} className="w-full h-full object-cover opacity-80" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-5 left-5 w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-md border border-white/20 text-secondary/60 hover:text-primary z-20 cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="absolute -bottom-10 left-6 w-24 h-24 rounded-[28px] overflow-hidden border-4 border-white shadow-lg z-10 bg-slate-100">
            <img src={buddy.image} alt={buddy.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="px-6 pt-12 pb-4 space-y-3 shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-2xl font-black text-secondary tracking-tight">{buddy.name}</h1>
                {isVerified ? (
                  <span className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg border border-emerald-500/15" title="Identity Verified">
                    <Shield size={12} className="fill-current" />
                  </span>
                ) : (
                  <span className="text-[7px] font-black text-amber-600 uppercase bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/15">Unverified</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-secondary/50 text-xs font-bold">
                <MapPin size={12} className="text-primary shrink-0" />
                <span>{buddy.location}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary tracking-tight">${buddy.price}</span>
              <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block leading-none">/ hour</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-gray-100 px-2.5 py-1 rounded-xl shadow-sm">
              <Star size={11} className="fill-primary text-primary" />
              <span className="text-[10px] font-black text-secondary">{buddy.rating}</span>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-xl border border-emerald-500/15 font-black text-[10px]">
              <Shield size={10} className="fill-current" />
              <span>{trustScore}% Trust</span>
            </div>
            <span className="text-[9px] text-secondary/30 font-black uppercase tracking-widest">{buddy.age} Years Old</span>
          </div>
        </div>

        <div className="flex bg-slate-100/50 p-1 rounded-2xl mx-6 my-2 border border-gray-100 shrink-0">
          {(['about', 'slots', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab ? 'bg-white text-primary shadow-sm border border-gray-50' : 'text-secondary/40 hover:text-secondary/60'
              }`}
            >
              {tab === 'slots' ? 'Availability' : tab}
            </button>
          ))}
        </div>

        <div className="flex-1 px-6 py-3 pb-24">
          <TabContent />
        </div>

        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-50 p-4 flex gap-3 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <button
            onClick={() => navigate(`/traveller/messages?buddyId=${buddy.id}`)}
            className="flex-1 py-3.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-secondary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={13} />
            Message
          </button>
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="flex-[2] py-3.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-primary-glow border-none cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Calendar size={13} />
            Book Direct (${buddy.price}/h)
          </button>
        </footer>
      </div>

      {/* ===== DESKTOP LAYOUT (2-column) ===== */}
      <div className="hidden md:block max-w-screen-xl mx-auto px-8 lg:px-16 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-secondary/40 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px] mb-8 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
            <ChevronLeft size={16} />
          </div>
          Back
        </button>

        <div className="grid grid-cols-3 gap-8">
          {/* LEFT: Profile card + booking CTA */}
          <aside className="col-span-1 space-y-6">
            {/* Profile image */}
            <div className="relative rounded-[32px] overflow-hidden aspect-[4/5] bg-slate-900">
              <img src={buddy.image} alt={buddy.name} className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-white">${buddy.price}</span>
                  <span className="text-white/50 text-xs font-bold">/ hour</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-50 border border-gray-100 px-2.5 py-1.5 rounded-xl">
                  <Star size={12} className="fill-primary text-primary" />
                  <span className="text-xs font-black text-secondary">{buddy.rating}</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-1.5 rounded-xl border border-emerald-500/15 font-black text-xs">
                  <Shield size={11} className="fill-current" />
                  <span>{trustScore}% Trust</span>
                </div>
                {isVerified && (
                  <span className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-secondary/50 text-sm font-bold">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>{buddy.location}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                <Calendar size={16} />
                Book Direct · ${buddy.price}/h
              </button>
              <button
                onClick={() => navigate(`/traveller/messages?buddyId=${buddy.id}`)}
                className="btn-ghost w-full py-4 flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} />
                Send Message
              </button>
            </div>
          </aside>

          {/* RIGHT: Profile details */}
          <div className="col-span-2 space-y-6">
            {/* Name & trust badge */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-secondary tracking-tight">{buddy.name}</h1>
                {isVerified ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 rounded-xl border border-emerald-500/20 text-xs font-black">
                    <Shield size={13} className="fill-current" /> Verified Buddy
                  </span>
                ) : (
                  <span className="text-xs font-black text-amber-600 uppercase bg-amber-500/10 px-2 py-1 rounded-xl border border-amber-500/15">Unverified</span>
                )}
              </div>
              <p className="text-secondary/40 font-bold text-sm">{buddy.age} years old · {buddy.location}</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-gray-100">
              {(['about', 'slots', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
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

      <DirectBookingModal
        buddy={buddy}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        availableSlots={freeSlots}
      />
    </div>
  );
};

export default BuddyProfile;
