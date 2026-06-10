import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, ShieldCheck, Lock, User, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { buddyService, bookingService } from '../../services/api';
import type { Buddy } from '../../services/api';
import Button from '../../components/ui/Button';
import { useLocation, useNavigate } from 'react-router-dom';

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = location.state?.bookingId;
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [booking, setBooking] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const isAlreadyPaid = booking ? booking.status && booking.status !== 'PENDING' : false;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (bookingId) {
          const bookingData = await bookingService.getById(bookingId);
          setBooking(bookingData);
          if (bookingData.buddyId) {
            const buddyData = await buddyService.getById(bookingData.buddyId);
            setBuddy(buddyData);
          }
        } else {
          const buddyData = await buddyService.getById("1");
          setBuddy(buddyData);
        }
      } catch (error) {
        console.error("Error fetching data for checkout:", error);
      }
    };
    fetchData();
  }, [bookingId]);

  const handleCheckout = async () => {
    if (!bookingId) {
      setSuccess(true);
      return;
    }

    if (isAlreadyPaid) return;

    try {
      setProcessing(true);
      await bookingService.updateStatus(bookingId, 'CONFIRMED');
      setTimeout(() => {
        setSuccess(true);
        setProcessing(false);
      }, 1500);
    } catch (error) {
      console.error("Error updating booking status:", error);
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#FBFBFC] py-40">
        <div className="bg-white rounded-[32px] p-8 shadow-premium border border-gray-100 w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-green-500/20">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-secondary tracking-tight">Payment Successful!</h2>
            <p className="text-xs text-secondary/40 font-bold max-w-xs mx-auto">Your adventure is officially secured. Your Local Buddy has been notified.</p>
          </div>
          <button 
            onClick={() => navigate('/traveller/booking')} 
            className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl"
          >
            Go to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-[#FBFBFC]">
      {/* App Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-50 sticky top-0 z-40 flex items-center gap-3 shrink-0">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl border border-gray-100 bg-slate-50 flex items-center justify-center text-secondary/60 hover:text-primary transition-all shadow-sm cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-secondary tracking-tight">Checkout</h1>
      </header>

      {/* Main Single Column Layout */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        
        {/* Booking Brief Card */}
        <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-slate-100 shrink-0 shadow-sm">
            <img 
              src={buddy?.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=200"} 
              alt="Guide" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="text-sm font-black text-secondary tracking-tight truncate">
              {booking?.title || "Local Trip"}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-secondary/40 font-bold">
              <User size={11} className="text-primary" />
              <span>With {booking?.buddyName || buddy?.name || "Buddy"}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-secondary/30 font-bold flex-wrap pt-0.5">
              <div className="flex items-center gap-1">
                <Calendar size={10} />
                <span>{booking?.date || "Oct 15, 2024"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={10} />
                <span>{booking?.hours || 4}h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <section className="space-y-3">
          <h3 className="text-xs font-black text-secondary/30 uppercase tracking-widest">Select Payment Method</h3>
          
          {isAlreadyPaid && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-[10px] font-black text-green-700 uppercase tracking-widest text-center">
              Already paid
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <button 
              disabled={isAlreadyPaid}
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'card' ? 'bg-white border-primary shadow-sm scale-102' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
            >
              <CreditCard size={18} className={paymentMethod === 'card' ? 'text-primary' : 'text-secondary/30'} />
              <span className="text-[8px] font-black uppercase tracking-wider">Card</span>
            </button>

            <button 
              disabled={isAlreadyPaid}
              onClick={() => setPaymentMethod('apple')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'apple' ? 'bg-white border-primary shadow-sm scale-102' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
            >
              <span className="text-xs font-black italic">Pay</span>
              <span className="text-[8px] font-black uppercase tracking-wider">Apple</span>
            </button>

            <button 
              disabled={isAlreadyPaid}
              onClick={() => setPaymentMethod('google')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${paymentMethod === 'google' ? 'bg-white border-primary shadow-sm scale-102' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
            >
              <span className="text-xs font-black text-[#4285F4]">G</span>
              <span className="text-[8px] font-black uppercase tracking-wider">Google</span>
            </button>
          </div>
        </section>

        {/* Pricing Summary */}
        <section className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm space-y-3">
          <div className="flex justify-between text-xs text-secondary/50 font-bold uppercase tracking-wider">
            <span>Guide Fee ({booking?.hours || 4}h)</span>
            <span className="font-black text-secondary">${booking?.price || "120.00"}</span>
          </div>
          <div className="flex justify-between text-xs text-secondary/50 font-bold uppercase tracking-wider pb-3 border-b border-gray-50">
            <span>Service Fee</span>
            <span className="font-black text-secondary">$0.00</span>
          </div>
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-xs font-black text-secondary italic">Total Pay</span>
            <span className="text-3xl font-black text-primary">${booking?.price || "120.00"}</span>
          </div>
        </section>

        {/* Local Buddy Safety Escrow Promise */}
        <div className="bg-emerald-500/5 rounded-3xl p-5 border border-emerald-500/20 space-y-3.5">
          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck size={18} />
            <h4 className="text-xs font-black text-secondary uppercase tracking-wider">Safety & Escrow Promise</h4>
          </div>
          <div className="space-y-2 text-[10px] font-bold text-secondary/50 leading-relaxed uppercase tracking-wider">
            <div className="flex gap-2">
              <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
              <p>Escrow Protection: Payment released ONLY after trip completion.</p>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
              <p>Free Cancellation: 100% refund up to 24h before meetup slot.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <footer className="bg-white border-t border-gray-50 p-4 space-y-3 shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <button
          disabled={processing || isAlreadyPaid}
          onClick={handleCheckout}
          className="btn-primary w-full py-4 text-xs font-black tracking-[0.2em] shadow-primary-glow uppercase rounded-2xl flex items-center justify-center gap-2 mb-1 border-none cursor-pointer"
        >
          <Lock size={13} />
          {isAlreadyPaid ? "Already Paid" : processing ? "Securing Session..." : "Secure My Adventure"}
        </button>
        <div className="flex items-center justify-center gap-1.5 text-secondary/30 font-black uppercase tracking-widest text-[8px]">
          <Lock size={10} /> 256-Bit SSL Encrypted Transaction
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
