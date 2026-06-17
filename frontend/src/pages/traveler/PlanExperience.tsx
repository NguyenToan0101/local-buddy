import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import Footer from '../../components/Footer';
import DirectBookingModal from '../../components/features/DirectBookingModal';
import { availabilityService, buddyService } from '../../services/api';
import type { AvailabilitySlot, Buddy } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PlanExperience: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const fetchPlanData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [buddyData, slotsData] = await Promise.all([
          buddyService.getById(id),
          availabilityService.fetchAvailabilities(id),
        ]);
        setBuddy(buddyData);
        setSlots(slotsData.filter((slot) => slot.status === 'FREE'));
      } catch (err) {
        console.error('Failed to load plan experience data:', err);
        setError('Unable to load this buddy.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!buddy) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 text-center space-y-5 border border-gray-100 shadow-premium">
          <h1 className="text-2xl font-black text-secondary">Buddy unavailable</h1>
          <p className="text-sm font-bold text-secondary/40">{error || 'This buddy could not be found.'}</p>
          <button onClick={() => navigate('/traveller/buddies')} className="btn-primary w-full py-4">
            Back to buddies
          </button>
        </div>
      </div>
    );
  }

  const isVerified = ['verified', 'auto_approved', 'manual_approved'].includes(buddy.verificationStatus || '');

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
      <main className="pt-6 pb-20 px-4 sm:px-6 lg:px-16 max-w-6xl mx-auto w-full">
        <div className="mb-10 flex justify-between items-center">
          <Link to={`/traveller/buddy/${buddy.id}`} className="group flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-secondary/30 hover:text-primary transition-all">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <ArrowLeft size={14} />
            </div>
            Back to Buddy
          </Link>
          {user?.avatar && (
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-4 border-white shadow-premium">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <section className="bg-white rounded-[40px] shadow-premium overflow-hidden border border-gray-50">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[360px] bg-slate-900">
              <img src={buddy.image} alt={buddy.name} className="absolute inset-0 w-full h-full object-cover opacity-85" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-100 border border-emerald-300/20">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-white/10">
                    <Star size={12} className="fill-primary text-primary" /> {buddy.rating}
                  </span>
                </div>
                <h1 className="text-4xl font-black tracking-tight">{buddy.name}</h1>
                <p className="flex items-center gap-2 text-sm font-bold text-white/75">
                  <MapPin size={16} /> {buddy.location}
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-12 space-y-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
                  Plan with real availability
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-secondary tracking-tighter leading-tight">
                  Book a local experience with {buddy.name}
                </h2>
                <p className="text-secondary/50 font-bold leading-relaxed">
                  Pick from this buddy's published availability and continue to checkout. For custom questions, message the buddy before booking.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-secondary/30">Rate</p>
                  <p className="mt-2 text-xl font-black text-secondary">${buddy.price}/h</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-secondary/30">Open slots</p>
                  <p className="mt-2 text-xl font-black text-secondary">{slots.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-secondary/30">Languages</p>
                  <p className="mt-2 text-sm font-black text-secondary truncate">{buddy.languages?.join(', ') || 'Not listed'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="btn-primary flex-1 py-5 flex items-center justify-center gap-2"
                >
                  <Calendar size={18} />
                  Choose Time & Pay
                </button>
                <button
                  onClick={() => navigate(`/traveller/messages?buddyId=${buddy.id}`)}
                  className="btn-ghost flex-1 py-5 flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} />
                  Message Buddy
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <DirectBookingModal
        buddy={buddy}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        availableSlots={slots}
      />
    </div>
  );
};

export default PlanExperience;
