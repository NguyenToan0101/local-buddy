import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  MessageCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  Compass,
  ArrowRight,
  Star,
  User as UserIcon
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Button from '../../components/ui/Button';

const BookingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const data = await bookingService.getById(id);
        setBooking(data);
      } catch (error) {
        console.error("Error fetching booking detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.3em]">Loading Booking Details...</p>
    </div>
  );

  if (!booking) return (
    <div className="text-center py-20 space-y-6">
      <h3 className="text-3xl font-black text-secondary tracking-tight italic">Booking not found</h3>
      <Button onClick={() => navigate('/buddy/dashboard/trips')} className="rounded-2xl px-8 py-4 uppercase tracking-widest font-black text-[10px]">Back to Trips</Button>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/buddy/dashboard/trips')}
          className="group flex items-center gap-3 text-secondary/40 hover:text-primary transition-all font-black text-[10px] uppercase tracking-widest border-none bg-transparent cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronLeft size={18} />
          </div>
          Back to Sessions
        </button>
        
        <div className="flex items-center gap-4">
          <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${booking.status === 'CONFIRMED' || booking.status === 'UPCOMING' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {booking.status}
          </span>
          <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest ml-2">ID: LB-{booking.id.padStart(6, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Traveler & Financials */}
        <div className="lg:col-span-4 space-y-10">
          {/* Traveler Card */}
          <div className="bg-white rounded-[48px] p-10 shadow-premium border border-gray-50 space-y-8 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl transition-colors group-hover:bg-primary/10"></div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-[32px] overflow-hidden shadow-2xl ring-4 ring-primary/5">
                  <img src={`https://i.pravatar.cc/150?u=${booking.id}`} alt="Traveler" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -right-2 -bottom-2 bg-green-500 rounded-full p-2 border-4 border-white shadow-lg">
                  <ShieldCheck size={16} className="text-white" />
                </div>
              </div>
              <div>
                <h4 className="text-2xl font-black text-secondary tracking-tighter uppercase">{booking.traveler || 'Mystery Traveler'}</h4>
                <p className="text-[10px] font-bold text-secondary/30 uppercase tracking-widest mt-1">Hanoi Traveler • Verified</p>
              </div>
              <div className="flex items-center gap-6 pt-2">
                 <div className="text-center">
                    <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest mb-1">Trips</p>
                    <p className="text-sm font-black text-secondary">12</p>
                 </div>
                 <div className="w-px h-8 bg-gray-100"></div>
                 <div className="text-center">
                    <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest mb-1">Joined</p>
                    <p className="text-sm font-black text-secondary">2022</p>
                 </div>
              </div>
              <Button className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-primary-glow border-none flex items-center justify-center gap-3">
                <MessageCircle size={18} /> Chat with {booking.traveler?.split(' ')[0] || 'Traveler'}
              </Button>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-secondary rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur flex items-center justify-center text-white">
                  <DollarSign size={24} />
                </div>
                <div className="bg-white/10 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Payout Pending</div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Total Earnings</p>
                <div className="flex items-end gap-2 text-primary">
                  <span className="text-5xl font-black tracking-tighter">{booking.price}</span>
                  <span className="text-xs font-black uppercase tracking-widest mb-3 opacity-50">USD</span>
                </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="opacity-40">Session Rate</span>
                    <span>{booking.price}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="opacity-40">Service Fee</span>
                    <span>-$0.00</span>
                 </div>
                 <div className="h-px bg-white/10"></div>
                 <div className="flex justify-between items-center text-xs font-black text-primary">
                    <span>Net Income</span>
                    <span>{booking.price}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Itinerary Details */}
        <div className="lg:col-span-8 space-y-12">
          {/* Main Trip Info */}
          <div className="bg-white rounded-[56px] p-12 shadow-premium border border-gray-50 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                  <Compass size={20} />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{booking.activity}</span>
              </div>
              <h3 className="text-5xl font-black text-secondary tracking-tighter italic leading-none">{booking.activity || booking.title}</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 p-10 bg-surface-dark rounded-[40px] border border-gray-100 shadow-inner">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                     <Calendar size={14} />
                     <p className="text-[8px] font-black uppercase tracking-widest">Date</p>
                  </div>
                  <p className="text-lg font-black text-secondary">{booking.date}</p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                     <Clock size={14} />
                     <p className="text-[8px] font-black uppercase tracking-widest">Starts</p>
                  </div>
                  <p className="text-lg font-black text-secondary">{booking.time}</p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                     <Star size={14} />
                     <p className="text-[8px] font-black uppercase tracking-widest">Duration</p>
                  </div>
                  <p className="text-lg font-black text-secondary">3 Hours</p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                     <UserIcon size={14} />
                     <p className="text-[8px] font-black uppercase tracking-widest">People</p>
                  </div>
                  <p className="text-lg font-black text-secondary">2 Persons</p>
               </div>
            </div>

            <div className="space-y-10">
              <h5 className="text-xl font-black text-secondary tracking-tight uppercase border-l-4 border-primary pl-6">Itinerary Timeline</h5>
              
              <div className="relative ml-6 space-y-12">
                 <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-primary/10 border-l border-dashed border-primary/30"></div>
                 
                 <div className="relative pl-12 group">
                    <div className="absolute left-[-5px] top-2 w-3 h-3 rounded-full bg-primary border-4 border-white shadow-lg group-hover:scale-150 transition-transform"></div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-secondary/30 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={10} className="text-primary" /> Meeting Point
                       </p>
                       <h6 className="text-xl font-black text-secondary tracking-tight">St. Joseph's Cathedral, Old Quarter</h6>
                       <p className="text-sm font-bold text-secondary/40 max-w-lg leading-relaxed italic">Wait near the side entrance. I'll be wearing a Local Buddy orange lanyard.</p>
                    </div>
                 </div>

                 <div className="relative pl-12 group">
                    <div className="absolute left-[-5px] top-2 w-3 h-3 rounded-full bg-primary border-4 border-white shadow-lg group-hover:scale-150 transition-transform"></div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-secondary/30 uppercase tracking-widest">Action Highlight</p>
                       <h6 className="text-xl font-black text-secondary tracking-tight">Exploring Hidden Train Street Cafe</h6>
                       <p className="text-sm font-bold text-secondary/40 max-w-lg leading-relaxed italic">We'll secure a safe spot for photos and enjoy the signature egg coffee while talking about local railways history.</p>
                    </div>
                 </div>

                 <div className="relative pl-12 group">
                    <div className="absolute left-[-5px] top-2 w-3 h-3 rounded-full bg-gray-200 border-4 border-white shadow-lg group-hover:scale-150 transition-transform"></div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-secondary/30 uppercase tracking-widest">End Point</p>
                       <h6 className="text-xl font-black text-secondary tracking-tight">Long Bien Bridge Sunset</h6>
                       <p className="text-sm font-bold text-secondary/40 max-w-lg leading-relaxed italic">Session concludes with a panoramic sunset view over the Red River.</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="pt-12 border-t border-gray-50 flex items-center justify-between">
               <div className="flex items-center gap-4 text-xs font-black text-secondary/20 uppercase tracking-widest">
                  <ShieldCheck size={18} className="text-primary" /> Protected by Local Buddy Guarantee
               </div>
               <button className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:gap-5 transition-all">
                  Print Trip Summary <ArrowRight size={14} strokeWidth={4} />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
