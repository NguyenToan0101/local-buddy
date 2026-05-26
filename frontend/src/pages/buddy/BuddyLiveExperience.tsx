import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  ChevronLeft
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

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
    // alert("Emergency alert sent! Support is on the way.");
    setSosSent(true);
    // Actual SOS integration would go here
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
    <div className="min-h-screen bg-[#FBFBFC] relative">
      {/* Floating Exit Button */}
      <div className="fixed top-8 left-8 z-[100]">
         <button 
           onClick={() => navigate('/buddy/dashboard/trips')}
           className="flex items-center gap-3 bg-secondary text-white px-8 py-4 rounded-2xl shadow-2xl hover:bg-primary transition-all duration-500 font-black text-[10px] uppercase tracking-widest border-none group"
         >
           <ChevronLeft size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
           Back to Dashboard
         </button>
      </div>

      {/* Live Badge Overlay */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-red-500 z-[101]"></div>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/10 backdrop-blur-xl border border-red-500/20 px-6 py-2 rounded-full shadow-2xl pointer-events-none flex items-center gap-3">
         <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
         <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.4em]">Live Session Mode</p>
      </div>
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-5xl mx-auto space-y-12">
        {/* Header Section */}
        <section className="space-y-6 text-center">
           <div className="space-y-2">
              <h1 className="text-5xl font-black text-secondary tracking-tighter">Buddy Live Hub</h1>
              <p className="text-secondary/40 font-bold text-lg italic">Your safety and experience are monitored in real-time.</p>
           </div>
        </section>

        {/* Traveler Status Card */}
        <section className="bg-white rounded-[48px] p-8 shadow-premium border border-gray-50 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="relative">
                 <div className="w-24 h-24 rounded-[32px] overflow-hidden shadow-2xl ring-4 ring-primary/5">
                    <img src={booking?.travelerAvatar || `https://i.pravatar.cc/150?u=${booking?.userId}`} alt="Traveler" className="w-full h-full object-cover" />
                 </div>
                 <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
              </div>
              <div className="space-y-1 text-center md:text-left">
                 <h2 className="text-2xl font-black text-secondary tracking-tight">{booking?.traveler || "Traveler"}</h2>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <ShieldCheck size={14} strokeWidth={3} /> Trusted Explorer
                 </div>
              </div>
           </div>
           
           <button className="w-16 h-16 bg-surface rounded-[24px] flex items-center justify-center text-secondary/40 hover:text-primary transition-all border-none cursor-pointer">
              <MessageCircle size={28} />
           </button>
        </section>

        {/* Timer Countdown Grid */}
        <section className="grid grid-cols-3 gap-6">
           {[
             { label: 'HOURS', value: time.h },
             { label: 'MINUTES', value: time.m },
             { label: 'SECONDS', value: time.s }
           ].map(t => (
             <div key={t.label} className="bg-primary/5 rounded-[48px] p-10 text-center border-2 border-primary/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 group-hover:bg-white/40 transition-colors"></div>
                <div className="relative z-10 space-y-2">
                   <p className="text-5xl md:text-7xl font-black text-primary tracking-tighter tabular-nums leading-none">{t.value}</p>
                   <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em]">{t.label}</p>
                </div>
             </div>
           ))}
        </section>

        {/* Action & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           {/* Left: Meeting Area */}
           <div className="bg-white rounded-[56px] p-10 shadow-premium border border-gray-50 flex flex-col group h-full">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                    <MapPin size={20} />
                 </div>
                 <h5 className="text-xl font-black text-secondary tracking-tight">Active Location</h5>
              </div>
              
              <div className="flex-1 min-h-[400px] rounded-[36px] overflow-hidden bg-gray-100 relative shadow-inner grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700">
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
              
              <p className="text-sm font-bold text-secondary/40 mt-6 italic tracking-tight">{booking?.location || "Hanoi Old Quarter"}</p>
           </div>

           {/* Right: Itinerary Timeline */}
           <div className="bg-white rounded-[56px] p-10 md:p-12 shadow-premium border border-gray-50 flex flex-col gap-10">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                 <h3 className="text-2xl font-black text-secondary tracking-tight uppercase italic">Itinerary Timeline</h3>
              </div>

              <div className="space-y-12 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/10 before:border-l-2 before:border-dashed before:border-primary/20">
                 {/* Meeting Point */}
                 <div className="relative pl-12">
                    <div className="absolute left-0 top-1.5 w-4 h-4 bg-white border-4 border-primary rounded-full z-10"></div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-primary/40">
                          <MapPin size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Meeting Point</span>
                       </div>
                       <h4 className="text-xl font-black text-secondary tracking-tight leading-tight">St. Joseph's Cathedral, Old Quarter</h4>
                       <p className="text-sm font-bold text-secondary/40 italic leading-relaxed">Wait near the side entrance. I'll be wearing a Local Buddy orange lanyard.</p>
                    </div>
                 </div>

                 {/* Action Highlight */}
                 <div className="relative pl-12">
                    <div className="absolute left-0 top-1.5 w-4 h-4 bg-white border-4 border-primary rounded-full z-10 shadow-lg shadow-primary/20"></div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-primary/40">
                          <Clock size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Action Highlight</span>
                       </div>
                       <h4 className="text-xl font-black text-secondary tracking-tight leading-tight">Exploring Hidden Train Street Cafe</h4>
                       <p className="text-sm font-bold text-secondary/40 italic leading-relaxed">We'll secure a safe spot for photos and enjoy the signature egg coffee while talking about local railways history.</p>
                    </div>
                 </div>

                 {/* End Point */}
                 <div className="relative pl-12">
                    <div className="absolute left-0 top-1.5 w-4 h-4 bg-gray-100 border-4 border-gray-200 rounded-full z-10"></div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-secondary/20">
                          <MapPin size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">End Point</span>
                       </div>
                       <h4 className="text-xl font-black text-secondary/40 tracking-tight leading-tight">Long Bien Bridge Sunset</h4>
                       <p className="text-sm font-bold text-secondary/20 italic leading-relaxed">Session concludes with a panoramic sunset view over the Red River.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Safety Controls Bar */}
        <section className="bg-red-50/30 rounded-[64px] p-12 border border-red-100/50 space-y-8 animate-in slide-in-from-bottom-10 duration-1000">
           <div className="flex items-center gap-4">
              <ShieldAlert size={24} className="text-red-500" />
              <div className="space-y-1">
                 <h4 className="text-2xl font-black text-red-600 tracking-tight uppercase italic leading-none">Emergency Hub</h4>
                 <p className="text-[10px] font-bold text-red-400">Immediate access to Local Buddy support team and emergency services.</p>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <button 
                onClick={handleSOS}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-[32px] py-10 flex items-center justify-center gap-4 shadow-xl border-none font-black text-xl italic tracking-tighter transition-all active:scale-95 group"
              >
                 <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
                 SOS EMERGENCY
              </button>
           </div>
        </section>
      </main>

       {/* SOS Confirmation Modal */}
      <Modal 
        isOpen={isSOSModalOpen} 
        onClose={() => setIsSOSModalOpen(false)}
        title={sosSent ? "SOS Alert Sent" : "Trigger Emergency SOS?"}
        maxWidth="max-w-md"
      >
        <div className="p-8 space-y-8">
          {sosSent ? (
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <ShieldCheck size={48} />
               </div>
               <div className="space-y-3">
                  <h4 className="text-2xl font-black text-secondary tracking-tight">Support is on the way!</h4>
                  <p className="text-sm font-bold text-secondary/40 leading-relaxed italic">
                     Your emergency alert has been broadcast. Our safety team is now tracking your session and coordinating with local services.
                  </p>
               </div>
               <button 
                 onClick={() => setIsSOSModalOpen(false)}
                 className="w-full bg-secondary text-white rounded-2xl py-6 font-black text-[10px] uppercase tracking-widest transition-all"
               >
                  Close / Monitor Session
               </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 animate-pulse">
                    <AlertTriangle size={40} />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-xl font-black text-secondary tracking-tight">Critical Action Required</h4>
                    <p className="text-sm font-bold text-secondary/40 leading-relaxed italic">
                       Are you sure you want to trigger an emergency alert? This will immediately notify **Local Buddy Support** and **Local Emergency Services**.
                    </p>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                   onClick={confirmSOS}
                   className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-6 font-black text-lg tracking-tight shadow-xl shadow-red-200 transition-all active:scale-95 italic"
                 >
                    CONFIRM SOS ALERT
                 </button>
                 <button 
                   onClick={() => setIsSOSModalOpen(false)}
                   className="w-full bg-surface-dark hover:bg-gray-200 text-secondary/60 rounded-2xl py-6 font-black text-[10px] uppercase tracking-widest transition-all"
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
