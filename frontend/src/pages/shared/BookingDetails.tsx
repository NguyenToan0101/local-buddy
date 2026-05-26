import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Share2, 
  MoreHorizontal, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  Clock, 
  Tag, 
  CreditCard, 
  ChevronRight, 
  HelpCircle, 
  ArrowLeft,
  Activity,
  ShieldCheck,
  Star,
  Info,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { bookingService, buddyService } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/ui/Button';

const BookingDetails: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [buddy, setBuddy] = useState<any>(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const bookingData = await bookingService.getById(id);
        setBooking(bookingData);
        
        if (bookingData.buddyId) {
          const buddyData = await buddyService.getById(bookingData.buddyId);
          setBuddy(buddyData);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
           <div className="text-center space-y-4">
              <h2 className="text-2xl font-black text-secondary italic">Booking Not Found</h2>
              <Link to="/traveller/booking">
                 <Button variant="secondary" size="lg">Back to My Bookings</Button>
              </Link>
           </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate fees
  const activityFee = booking.price || 0;
  const serviceFee = Math.round(activityFee * 0.1);
  const total = activityFee + serviceFee;

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col font-sans selection:bg-primary/10">
      <Navbar />

      <main className="pt-32 pb-32 px-4 sm:px-8 max-w-7xl mx-auto w-full flex-1">
        
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
           
           {/* Cinematic Hero Header */}
           <header className="relative py-20 px-12 md:px-16 rounded-[64px] overflow-hidden group">
              <div className="absolute inset-0 bg-secondary shadow-card overflow-hidden">
                 <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse"></div>
                 <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                 <div className="space-y-6 text-center md:text-left">
                    <Link to="/traveller/booking" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-6 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] text-white/60 hover:bg-white/20 transition-all">
                       <ArrowLeft size={12} className="text-primary" /> Back to My Bookings
                    </Link>
                    <div className="space-y-2">
                       <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] italic">
                          Booking <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-orange">Detail</span>
                       </h1>
                       <p className="text-xl font-medium text-white/40 italic tracking-tight">Managed with Local Buddy Pro Services</p>
                    </div>
                 </div>

                 <div className="flex flex-col sm:row items-center gap-6">
                     <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl text-center min-w-[240px] space-y-4">
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Current Status</div>
                        <div className="flex items-center justify-center gap-3 bg-accent-green/20 text-accent-green px-8 py-4 rounded-2xl border border-accent-green/30">
                           <CheckCircle2 size={18} />
                           <span className="text-xs font-black uppercase tracking-widest">{booking.status}</span>
                        </div>
                        {booking.status === 'COMPLETED' && (
                           <Link to={`/traveller/review/${booking.id}`} className="block">
                              <Button className="w-full bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-primary-glow flex items-center justify-center gap-2 hover:scale-105 transition-all">
                                 <Star size={14} className="fill-white" /> Review Buddy
                              </Button>
                           </Link>
                        )}
                     </div>
                 </div>
              </div>
           </header>

           <div className="flex flex-col lg:flex-row gap-16">
              
              {/* Left Column: Activity & Logistics */}
              <div className="flex-1 space-y-16">
                 
                 {/* Buddy Spotlight */}
                 {buddy && (
                    <section className="bg-white rounded-[56px] shadow-premium p-12 border border-gray-50 flex flex-col md:flex-row items-center gap-12 group hover:shadow-xl transition-all duration-700">
                       <div className="relative shrink-0">
                          <div className="w-40 h-40 rounded-[48px] overflow-hidden border-8 border-gray-50 shadow-2xl group-hover:scale-105 transition-transform duration-700">
                             <img src={buddy?.image || "/assets/img/Linh.jpg"} alt={buddy?.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-primary text-white rounded-2xl border-4 border-white flex items-center justify-center shadow-xl rotate-12">
                             <ShieldCheck size={24} />
                          </div>
                       </div>
                       <div className="flex-1 text-center md:text-left space-y-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest rounded-lg">Verified Identity Expert</div>
                          <h3 className="text-5xl font-black text-secondary tracking-tighter italic leading-none">{buddy.name}</h3>
                          <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
                             <div className="flex items-center gap-2 text-primary">
                                <Star size={18} className="fill-primary" />
                                <span className="text-xl font-black text-secondary tracking-tight">{buddy.rating}</span>
                             </div>
                             <span className="w-1.5 h-1.5 bg-gray-100 rounded-full"></span>
                             <span className="text-[11px] font-black text-secondary/30 uppercase tracking-widest">{buddy.reviewCount} Reviews</span>
                          </div>
                       </div>
                       <button className="bg-secondary text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95">
                          Direct Message
                       </button>
                    </section>
                 )}

                 {/* Trip Logistics */}
                 <section className="bg-white rounded-[56px] shadow-premium p-12 border border-gray-50 space-y-12">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-10">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em]">Experience Title</p>
                          <h2 className="text-4xl font-black text-secondary tracking-tighter leading-tight italic">{booking.title}</h2>
                       </div>
                       <div className="w-16 h-16 bg-accent-orange/10 text-accent-orange rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <Activity size={32} />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                       <div className="space-y-4">
                          <div className="flex items-center gap-3 text-secondary/20">
                             <Calendar size={18} /> <span className="text-[9px] font-black uppercase tracking-[0.3em]">Date</span>
                          </div>
                          <p className="text-2xl font-black text-secondary italic tracking-tight">{booking.date}</p>
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3 text-secondary/20">
                             <Clock size={18} /> <span className="text-[9px] font-black uppercase tracking-[0.3em]">Time</span>
                          </div>
                          <p className="text-2xl font-black text-secondary italic tracking-tight">{booking.time}</p>
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3 text-secondary/20">
                             <Activity size={18} /> <span className="text-[9px] font-black uppercase tracking-[0.3em]">Duration</span>
                          </div>
                          <p className="text-2xl font-black text-secondary italic tracking-tight">{booking.hours} Hours</p>
                       </div>
                    </div>

                    <div className="bg-gray-50 rounded-[40px] p-10 space-y-6">
                       <div className="flex items-center gap-4 text-secondary/40">
                          <MapPin size={24} className="text-primary" />
                          <h4 className="text-xl font-black tracking-tight italic">Meeting Point</h4>
                       </div>
                       <p className="text-2xl font-black text-secondary tracking-tight italic">{booking.location}</p>
                       <p className="text-lg font-medium text-secondary/40 italic leading-relaxed">{booking.description || "Meet at the designated location discussed in the messages."}</p>
                       <div className="pt-6">
                          <button className="w-full py-6 rounded-[24px] bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-secondary hover:text-primary transition-all shadow-sm">
                             View on Map Explorer
                          </button>
                       </div>
                    </div>
                 </section>

              </div>

              {/* Right Column: Pricing & Security */}
              <aside className="lg:w-[450px] space-y-12">
                 
                 {/* Financial Overview */}
                 <div className="bg-white rounded-[56px] shadow-premium p-12 border border-gray-50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    <h3 className="text-2xl font-black text-secondary tracking-tighter italic mb-10 flex items-center gap-3">
                       <DollarSign size={24} className="text-primary" /> Financial Review
                    </h3>

                    <div className="space-y-8">
                       <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em]">Activity Fee</span>
                          <span className="text-2xl font-black text-secondary tracking-tight">${activityFee}</span>
                       </div>
                       <div className="flex justify-between items-center px-4">
                          <span className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em]">Service Fee</span>
                          <span className="text-2xl font-black text-secondary tracking-tight">${serviceFee}</span>
                       </div>
                       <div className="pt-10 border-t border-gray-50 flex justify-between items-center px-4">
                          <div className="space-y-1">
                             <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Total Paid</span>
                             <p className="text-5xl font-black text-secondary tracking-tighter italic leading-none">${total}</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-12 bg-gray-50/50 rounded-[32px] p-8 space-y-6">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
                             <CreditCard size={28} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest mb-1">Payment Method</p>
                             <h4 className="font-black text-secondary tracking-tight italic">Visa ending in 4242</h4>
                          </div>
                       </div>
                       <div className="px-2">
                          <p className="text-[9px] font-black text-secondary/10 uppercase tracking-widest">Transaction ID: TX-827361{booking.id}</p>
                       </div>
                    </div>

                    <div className="mt-12 space-y-4">
                       <button className="w-full py-6 rounded-2xl bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-secondary/10">
                          Get Receipt PDF
                       </button>
                       <button className="w-full py-6 rounded-2xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:border-red-100 transition-all">
                          Initiate Cancellation
                       </button>
                    </div>
                 </div>

                 {/* Help & Support */}
                 <div className="bg-secondary p-12 rounded-[56px] text-white space-y-8 relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mb-24"></div>
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10">
                       <HelpCircle size={32} className="text-primary" />
                    </div>
                    <div className="space-y-4 relative z-10">
                       <h4 className="text-3xl font-black italic tracking-tight">Need assistance?</h4>
                       <p className="text-white/40 text-sm font-medium italic leading-relaxed">Our specialized concierge team is available 24/7 to ensure your experience is flawless.</p>
                    </div>
                    <div className="flex flex-col gap-4 pt-6 relative z-10">
                       <button className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-primary transition-colors flex items-center gap-2">
                          Visit Help Explorer <ArrowRight size={14} />
                       </button>
                       <button className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-primary transition-colors flex items-center gap-2">
                          Contact Security Team <ArrowRight size={14} />
                       </button>
                    </div>
                 </div>

              </aside>

           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingDetails;
