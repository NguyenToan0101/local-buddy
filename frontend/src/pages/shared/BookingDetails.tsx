import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, MessageSquare, MapPin, Calendar, Clock, Star, DollarSign, ArrowRight } from 'lucide-react';
import { bookingService, buddyService } from '../../services/api';
import Footer from '../../components/Footer';
import Button from '../../components/ui/Button';

const BookingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-full flex flex-col items-center justify-center bg-[#FBFBFC] py-40">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mt-4">Loading Booking...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-[#FBFBFC] py-40 px-6 text-center space-y-4">
        <h2 className="text-xl font-black text-secondary">Booking Not Found</h2>
        <button onClick={() => navigate('/traveller/booking')} className="btn-primary py-3 px-6 text-xs uppercase">Back to Bookings</button>
      </div>
    );
  }

  const activityFee = booking.price || 0;
  const serviceFee = Math.round(activityFee * 0.1);
  const total = activityFee + serviceFee;

  return (
    <div className="min-h-full flex flex-col bg-[#FBFBFC]">
      {/* App Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-50 sticky top-0 z-40 flex items-center gap-3 shrink-0 md:bg-transparent md:border-b-0 md:px-0 md:max-w-5xl md:mx-auto md:w-full md:relative md:pt-8 md:pb-2">
        <button 
          onClick={() => navigate('/traveller/booking')}
          className="w-10 h-10 rounded-2xl border border-gray-100 bg-slate-50 flex items-center justify-center text-secondary/60 hover:text-primary transition-all shadow-sm cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-secondary tracking-tight">Booking Details</h1>
      </header>

      {/* Main Column scroll container */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6 md:max-w-5xl md:mx-auto md:w-full md:grid md:grid-cols-12 md:gap-8 md:space-y-0 md:py-6 md:overflow-visible">
        
        {/* Left Column (Buddy spotlight, Progress, Logistics) */}
        <div className="md:col-span-7 space-y-6">
          {/* Buddy Guide Spotlight Card */}
          {buddy && (
            <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-[20px] overflow-hidden border border-gray-100 shrink-0 relative shadow-sm">
                <img src={buddy?.image} alt={buddy.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[7px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-wider">Verified guide</span>
                <h3 className="text-base font-black text-secondary tracking-tight truncate leading-none pt-0.5">{buddy.name}</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-secondary/40 font-bold">
                  <Star size={11} className="fill-primary text-primary" />
                  <span>{buddy.rating} Rating</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/traveller/messages?buddyId=${buddy.id}`)}
                className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-secondary border border-slate-100 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          )}

          {/* Stepper Progress Nodes */}
          <section className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-secondary/30 uppercase tracking-widest">Meetup Progress</h3>
            <div className="relative pl-6 space-y-4">
              {/* Vertical linking line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

              {/* Step 1 */}
              <div className="relative flex gap-3.5 items-start">
                <div className={`absolute -left-6 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center text-[8px] font-black shrink-0 ${
                  ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(booking.status) ? 'bg-primary text-white' : 'bg-slate-100 text-secondary/20'
                }`}></div>
                <div>
                  <h4 className="text-xs font-black text-secondary">Meetup Booked</h4>
                  <p className="text-[9px] text-secondary/40 font-bold uppercase mt-0.5">Requested slot slot-allocated</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex gap-3.5 items-start">
                <div className={`absolute -left-6 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center text-[8px] font-black shrink-0 ${
                  ['CONFIRMED', 'COMPLETED'].includes(booking.status) ? 'bg-primary text-white' : 'bg-slate-100 text-secondary/20'
                }`}></div>
                <div>
                  <h4 className="text-xs font-black text-secondary">Payment Escrowed</h4>
                  <p className="text-[9px] text-secondary/40 font-bold uppercase mt-0.5">Transaction payment held safely</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex gap-3.5 items-start">
                <div className={`absolute -left-6 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center text-[8px] font-black shrink-0 ${
                  ['CONFIRMED', 'COMPLETED'].includes(booking.status) ? 'bg-primary text-white animate-pulse' : 'bg-slate-100 text-secondary/20'
                }`}></div>
                <div>
                  <h4 className="text-xs font-black text-secondary">Chat Active</h4>
                  <p className="text-[9px] text-secondary/40 font-bold uppercase mt-0.5">Coordinate meeting point</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative flex gap-3.5 items-start">
                <div className={`absolute -left-6 w-5 h-5 rounded-full border-4 border-white flex items-center justify-center text-[8px] font-black shrink-0 ${
                  booking.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-secondary/20'
                }`}></div>
                <div>
                  <h4 className="text-xs font-black text-secondary">Finished</h4>
                  <p className="text-[9px] text-secondary/40 font-bold uppercase mt-0.5">Leave a feedback review</p>
                </div>
              </div>
            </div>

            {booking.status === 'COMPLETED' && (
              <Link to={`/traveller/review/${booking.id}`} className="block pt-2">
                <button className="btn-primary w-full py-3.5 text-xs">
                  Review local buddy
                </button>
              </Link>
            )}
          </section>

          {/* Meetup logistics */}
          <section className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-secondary/30 uppercase tracking-widest">Meeting Details</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <Calendar size={14} className="text-primary shrink-0" />
                <span className="text-xs font-black text-secondary">{booking.date}</span>
              </div>
              <div className="flex gap-3 items-center">
                <Clock size={14} className="text-primary shrink-0" />
                <span className="text-xs font-black text-secondary">{booking.time} ({booking.hours} hours)</span>
              </div>
              <div className="flex gap-3 items-start">
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-black text-secondary">{booking.location}</span>
                  <p className="text-[10px] text-secondary/40 font-medium leading-relaxed mt-1">{booking.description || "Meet at the designated spot discussed in messaging."}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Financials, Safety, Actions) */}
        <div className="md:col-span-5 space-y-6 md:sticky md:top-6 h-fit">
          {/* Financial overview */}
          <section className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-secondary/30 uppercase tracking-widest">Financial Review</h3>
            <div className="flex justify-between text-[10px] text-secondary/40 font-black uppercase tracking-wider">
              <span>Guide fee</span>
              <span>${activityFee}</span>
            </div>
            <div className="flex justify-between text-[10px] text-secondary/40 font-black uppercase tracking-wider pb-3 border-b border-gray-50">
              <span>Service fee</span>
              <span>${serviceFee}</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs font-black text-secondary italic">Total Paid</span>
              <span className="text-2xl font-black text-secondary tracking-tight">${total}</span>
            </div>
          </section>


          {/* Desktop feed back-out actions */}
          <div className="hidden md:block">
            <button 
              onClick={() => navigate('/traveller/booking')}
              className="w-full py-3.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-secondary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm"
            >
              My Bookings Feed
            </button>
          </div>
        </div>

      </main>

      {/* Sticky Bottom back-out actions */}
      <footer className="bg-white border-t border-gray-50 p-4 flex gap-3 shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] md:hidden">
        <button 
          onClick={() => navigate('/traveller/booking')}
          className="w-full py-3.5 bg-slate-50 border border-slate-100 text-secondary text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center"
        >
          My Bookings Feed
        </button>
      </footer>
    </div>
  );
};

export default BookingDetails;
