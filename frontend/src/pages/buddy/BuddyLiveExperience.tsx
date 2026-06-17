import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-base font-black uppercase text-primary">
    {(name || 'TR').slice(0, 2)}
  </div>
);

const BuddyLiveExperience: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(3600 + 42 * 60 + 5); // 01:42:05 in seconds
  const [loading, setLoading] = useState(true);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const data = await bookingService.getById(id);
        setBooking(data);
      } catch (error) {
        console.error("Error fetching booking for live view:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      h: String(h).padStart(2, '0'),
      m: String(m).padStart(2, '0'),
      s: String(s).padStart(2, '0')
    };
  };

  const time = formatTime(timeLeft);

  const handleSOS = () => {
    setIsSOSModalOpen(true);
    setSosSent(false);
  };

  const confirmSOS = () => {
    setSosSent(true);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-secondary/40 font-black uppercase tracking-widest text-[10px]">Syncing Live Session...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] relative pb-12">
      {/* Floating Exit header */}
      <div className="fixed top-8 left-8 z-[100] hidden md:block">
         <button 
           onClick={() => navigate('/buddy/dashboard/trips')}
           className="flex items-center gap-2 bg-secondary hover:bg-primary text-white px-6 py-3.5 rounded-xl shadow-md transition-all duration-300 font-black text-[10px] uppercase tracking-widest border-none cursor-pointer group"
         >
           <ChevronLeft size={14} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
           Back to Dashboard
         </button>
      </div>

      {/* Floating mobile back */}
      <div className="fixed top-4 left-4 z-[100] md:hidden">
         <button 
           onClick={() => navigate('/buddy/dashboard/trips')}
           className="w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center text-secondary/60 hover:text-primary transition-all border border-gray-100/50 shadow-md cursor-pointer"
         >
           <ChevronLeft size={20} />
         </button>
      </div>

      {/* Live active beacon */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-red-500 z-[101]"></div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/10 backdrop-blur-md border border-red-500/20 px-5 py-1.5 rounded-full shadow-md pointer-events-none flex items-center gap-2 shrink-0">
         <span className="relative flex h-1.5 w-1.5 shrink-0">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
         </span>
         <p className="text-[8px] font-black text-red-600 uppercase tracking-[0.25em] leading-none mt-0.5">Live hosting session</p>
      </div>
      
      <main className="pt-20 pb-12 px-6 max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <section className="space-y-1 text-center">
          <h1 className="text-3xl font-black text-secondary tracking-tight">Buddy Live Hub</h1>
          <p className="text-secondary/40 font-bold text-xs">Your security coordinates are monitored in real-time</p>
        </section>

        {/* Traveler Details Card */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80 flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="relative">
                 <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-primary/5">
                    {booking?.travelerAvatar ? (
                      <img src={booking.travelerAvatar} alt={booking?.traveler || 'Traveler'} className="w-full h-full object-cover" />
                    ) : (
                      <InitialAvatar name={booking?.traveler} />
                    )}
                 </div>
                 <div className="absolute -right-1 -bottom-1 w-4.5 h-4.5 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
              </div>
              <div>
                 <h2 className="text-base font-black text-secondary tracking-tight leading-snug">{booking?.traveler || "Traveler"}</h2>
                 <div className="flex items-center gap-1.5 text-primary font-bold text-[9px] uppercase tracking-wider mt-0.5">
                    <ShieldCheck size={12} strokeWidth={3} /> Trusted Traveler
                 </div>
              </div>
           </div>
           
           <button 
             onClick={() => navigate('/buddy/dashboard/messages')}
             className="w-12 h-12 bg-surface hover:bg-gray-50 rounded-xl flex items-center justify-center text-secondary/35 hover:text-primary transition-all border-none cursor-pointer"
           >
              <MessageCircle size={20} />
           </button>
        </section>

        {/* Stepper Countdowns */}
        <section className="grid grid-cols-3 gap-4">
           {[
             { label: 'HOURS', value: time.h },
             { label: 'MINUTES', value: time.m },
             { label: 'SECONDS', value: time.s }
           ].map(t => (
             <div key={t.label} className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10 relative overflow-hidden group">
                <div className="relative z-10 space-y-1">
                   <p className="text-3xl sm:text-4xl font-black text-primary tracking-tighter tabular-nums leading-none">{t.value}</p>
                   <p className="text-[8px] font-black text-primary/40 uppercase tracking-[0.2em]">{t.label}</p>
                </div>
             </div>
           ))}
        </section>

        {/* Map & Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Active Maps */}
           <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100/80 flex flex-col group h-[480px]">
              <div className="flex items-center gap-2.5 mb-4">
                 <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                    <MapPin size={16} />
                 </div>
                 <h5 className="font-black text-secondary text-sm">Active GPS Tracking</h5>
              </div>
              
              <div className="flex-1 rounded-2xl overflow-hidden bg-gray-100 relative shadow-inner">
                 <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.924403920925!2d105.846875!3d21.032669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abbf5ccdc67b%3A0xee23b03f0813c990!2sSt.%20Joseph's%20Cathedral!5e0!3m2!1sen!2s!4v1710550000000!5m2!1sen!2s" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                 ></iframe>
              </div>
              
              <p className="text-xs font-bold text-secondary/40 mt-4 italic tracking-tight">{booking?.meetingPoint || "To be confirmed"}</p>
           </div>

           {/* Itinerary timeline details */}
           <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-100/80 flex flex-col gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                 <h3 className="text-sm font-black text-secondary uppercase tracking-wider">Itinerary Details</h3>
              </div>

              <div className="space-y-8 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1px] before:bg-primary/15 before:border-l before:border-dashed">
                 {/* Start */}
                 <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-10"></div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-1.5 text-primary/40">
                          <MapPin size={10} />
                          <span className="text-[7px] font-black uppercase tracking-widest">Meeting Point</span>
                       </div>
                       <h4 className="font-black text-secondary text-sm leading-snug">St. Joseph's Cathedral, Old Quarter</h4>
                       <p className="text-[11px] font-bold text-secondary/40 italic leading-normal">Wait near the side entrance. I'll be wearing a Local Buddy orange lanyard.</p>
                    </div>
                  </div>

                 {/* Focus */}
                 <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full z-10"></div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-1.5 text-primary/40">
                          <Clock size={10} />
                          <span className="text-[7px] font-black uppercase tracking-widest">Current Highlight</span>
                       </div>
                       <h4 className="font-black text-secondary text-sm leading-snug">Exploring Hidden Train Street Cafe</h4>
                       <p className="text-[11px] font-bold text-secondary/40 italic leading-normal">We'll secure a safe spot for photos and enjoy the signature egg coffee.</p>
                    </div>
                 </div>

                 {/* End */}
                 <div className="relative pl-8">
                    <div className="absolute left-0 top-1 w-2.5 h-2.5 bg-white border-2 border-gray-300 rounded-full z-10"></div>
                    <div className="space-y-1">
                       <div className="flex items-center gap-1.5 text-secondary/35">
                          <MapPin size={10} />
                          <span className="text-[7px] font-black uppercase tracking-widest">Session Wrap-up</span>
                       </div>
                       <h4 className="font-black text-secondary/50 text-sm leading-snug">Long Bien Bridge Sunset</h4>
                       <p className="text-[11px] font-bold text-secondary/20 italic leading-normal">Session concludes with a sunset view over the Red River.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SOS Emergency hub bar */}
        <section className="bg-red-500/5 rounded-3xl p-6 border border-red-500/10 space-y-4">
           <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-500 shrink-0" />
              <div className="space-y-0.5">
                 <h4 className="text-sm font-black text-red-600 uppercase tracking-wider">Panic SOS Beacon</h4>
                 <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest leading-none">Instant coordinate broadcast to Local Buddy support team</p>
              </div>
           </div>

           <button 
             onClick={handleSOS}
             className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-4 flex items-center justify-center gap-2 shadow-sm border-none font-black text-sm uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
           >
              Trigger SOS Emergency
           </button>
        </section>
      </main>

      {/* SOS Modal popup */}
      <Modal 
        isOpen={isSOSModalOpen} 
        onClose={() => setIsSOSModalOpen(false)}
        title={sosSent ? "SOS Broadcast Active" : "Trigger Emergency SOS?"}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-6">
          {sosSent ? (
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm">
                  <ShieldCheck size={36} />
               </div>
               <div className="space-y-2">
                  <h4 className="text-base font-black text-secondary uppercase tracking-tight">Signal Broadcast Successful</h4>
                  <p className="text-[11px] font-bold text-secondary/40 leading-relaxed italic max-w-xs mx-auto">
                     Emergency coordinators have been notified. Real-time GPS tracking is broadcast to active security services.
                  </p>
               </div>
               <button 
                 onClick={() => setIsSOSModalOpen(false)}
                 className="w-full bg-secondary text-white rounded-xl py-3.5 font-black text-[9px] uppercase tracking-widest transition-all border-none cursor-pointer"
               >
                  Close / Keep Monitoring
               </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 animate-pulse">
                    <AlertTriangle size={32} />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-base font-black text-secondary uppercase tracking-tight">Confirm Signal Broadcast?</h4>
                    <p className="text-[11px] font-bold text-secondary/40 leading-relaxed italic max-w-xs mx-auto">
                       Are you sure you want to broadcast a panic beacon? Local Buddy security and local emergency dispatch services will be contacted instantly.
                    </p>
                 </div>
              </div>

              <div className="flex flex-col gap-2.5">
                 <button 
                   onClick={confirmSOS}
                   className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3.5 font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95 border-none cursor-pointer"
                 >
                    CONFIRM SOS BEACON
                 </button>
                 <button 
                   onClick={() => setIsSOSModalOpen(false)}
                   className="w-full bg-surface-dark hover:bg-gray-200 text-secondary/60 rounded-xl py-3.5 font-black text-[9px] uppercase tracking-widest transition-all border-none cursor-pointer"
                 >
                    Cancel / I'm Safe
                 </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BuddyLiveExperience;
