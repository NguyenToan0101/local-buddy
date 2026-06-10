import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, ShieldCheck, Lock, Bell, User, ArrowLeft, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { buddyService, paymentService } from '../../services/api';
import type { Buddy } from '../../services/api';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';


const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = location.state?.bookingId;
  
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAlreadyPaid = booking ? booking.status && booking.status !== 'PENDING' : false;
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

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
          // Fallback for demo
          const buddyData = await buddyService.getById("1");
          setBuddy(buddyData);
        }
      } catch (error) {
        console.error("Error fetching data for checkout:", error);
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookingId]);

  const handleCreateOrder = async () => {
    if (!bookingId) {
      setError("Booking ID is required");
      return;
    }
    try {
      const order = await paymentService.createPayPalOrder(bookingId);
      return order.id;
    } catch (error) {
      console.error("Error creating order:", error);
        const errorMessage =
      error instanceof Error
         ? error.message
         : "Failed to create payment order";
      setError(errorMessage);
      throw error;
    }
  };

  const handleApprove = async (data: any) => {
    try {
      setProcessing(true);
      const payment = await paymentService.capturePayPalOrder(data.orderID, bookingId);
      console.log("Payment captured:", payment);
      setTimeout(() => {
        setSuccess(true);
        setProcessing(false);
      }, 1500);
    } catch (error) {
      console.error("Error capturing order:", error);
      setError("Payment capture failed. Please try again.");
      setProcessing(false);
    }
  };

  const handleError = (err: any) => {
    console.error("PayPal error:", err);
    setError("Payment failed. Please try again.");
    setProcessing(false);
  };

  if (!clientId) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-[64px] p-16 shadow-premium border border-gray-100 max-w-xl w-full text-center space-y-8">
          <h2 className="text-4xl font-black text-secondary tracking-tighter">Configuration Error</h2>
          <p className="text-secondary/40 font-bold">PayPal Client ID is not configured. Please check your environment variables.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-[64px] p-16 shadow-premium border border-gray-100 max-w-xl w-full text-center space-y-8 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-green-500/20">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-secondary tracking-tighter italic">Payment Successful!</h2>
            <p className="text-secondary/40 font-bold max-w-xs mx-auto italic">Your adventure is now officially confirmed. Your Local Buddy has been notified.</p>
          </div>
          <Button className="w-full py-6 rounded-2xl" onClick={() => navigate('/traveller/booking')}>
            Back to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Main Column */}
          <div className="flex-1 space-y-16 animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="space-y-6">
              <Link to="/traveller/booking" className="group flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-secondary/30 hover:text-primary transition-all">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <ArrowLeft size={14} />
                </div>
                Return to Booking
              </Link>
              <h1 className="text-5xl sm:text-7xl font-black text-secondary tracking-tighter leading-none">
                Finalize your <br/>
                <span className="text-primary italic">Adventure.</span>
              </h1>
              <p className="text-secondary/40 font-bold text-lg max-w-xl">Review your details and secure your booking with our protected payment system.</p>
            </div>

            {/* Booking Summary Section */}
            <section className="space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/5">
                        <Calendar size={20} />
                     </div>
                     <h2 className="text-xl font-black text-secondary tracking-tight">Booking Summary</h2>
                  </div>
                  <span className="text-[10px] font-black text-secondary/20 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">ID: #LB-827C</span>
               </div>
               
               <div className="bg-white rounded-[40px] shadow-premium p-10 border border-gray-50 flex flex-col md:row items-center gap-10 group hover:shadow-premium-hover transition-all duration-500">
                  <div className="relative shrink-0">
                    <div className="w-40 h-40 rounded-[32px] overflow-hidden shadow-2xl ring-8 ring-white group-hover:scale-105 transition-transform duration-500">
                       <img src={buddy?.image || "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400"} alt="Experience" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       <CheckCircle2 size={24} />
                    </div>
                  </div>
                   <div className="flex-1 space-y-6 text-center md:text-left">
                      <div className="space-y-2">
                         <div className="flex items-center justify-center md:justify-start gap-3">
                            <h3 className="text-2xl font-black text-secondary tracking-tight">{booking?.title || "Madrid Local Exploration"}</h3>
                            <span className="px-2 py-0.5 bg-accent-green/10 text-accent-green text-[8px] font-black uppercase tracking-widest rounded">Flexible</span>
                         </div>
                         <p className="text-secondary/40 font-bold">Custom local experience tailored to your interests.</p>
                      </div>
                      <div className="flex flex-wrap justify-center md:justify-start gap-8">
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block">With Buddy</span>
                            <div className="flex items-center gap-2 font-black text-secondary text-sm">
                               <User size={14} className="text-primary" /> {booking?.buddyName || buddy?.name || "Buddy"}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block">DateTime</span>
                            <div className="flex items-center gap-2 font-black text-secondary text-sm">
                               <Calendar size={14} className="text-primary" /> {booking?.date || "Oct 15, 2024"} • {booking?.time || "10:00 AM"}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block">Duration</span>
                            <div className="flex items-center gap-2 font-black text-secondary text-sm">
                               <Clock size={14} className="text-primary" /> {booking?.hours || 4} Hours
                            </div>
                         </div>
                      </div>
                   </div>
               </div>
            </section>

            {/* Payment Methods Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm shadow-primary/5">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-black text-secondary tracking-tight">Payment Method</h2>
              </div>

              {isAlreadyPaid && (
                <div className="rounded-[32px] border border-green-200 bg-green-50 px-6 py-5 text-sm font-black text-green-700 uppercase tracking-widest">
                  This booking has already been paid.
                </div>
              )}

              {error && (
                <div className="rounded-[32px] border border-red-200 bg-red-50 px-6 py-5 text-sm font-black text-red-700 uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* PayPal */}
                <button 
                  disabled={isAlreadyPaid}
                  onClick={() => setPaymentMethod('paypal')}
                  className={`relative p-8 rounded-[40px] border-4 transition-all duration-500 overflow-hidden group ${paymentMethod === 'paypal' ? 'bg-white border-primary shadow-premium scale-[1.02]' : 'bg-gray-50/50 border-transparent hover:border-gray-200'} ${isAlreadyPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${paymentMethod === 'paypal' ? 'bg-[#003087] text-white shadow-lg' : 'bg-white text-secondary/20 group-hover:text-primary'}`}>
                      <span className="text-2xl font-black italic">PP</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className={`font-black text-sm uppercase tracking-widest leading-none ${paymentMethod === 'paypal' ? 'text-secondary' : 'text-secondary/40'}`}>PayPal</h4>
                      <p className="text-[8px] font-bold text-secondary/20 uppercase tracking-[0.2em]">Secure & Fast</p>
                    </div>
                  </div>
                  {paymentMethod === 'paypal' && <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-primary-glow"></div>}
                </button>

                {/* Credit Card */}
                <button 
                  disabled={isAlreadyPaid || true}
                  onClick={() => setPaymentMethod('card')}
                  className={`relative p-8 rounded-[40px] border-4 transition-all duration-500 overflow-hidden group ${paymentMethod === 'card' ? 'bg-white border-primary shadow-premium scale-[1.02]' : 'bg-gray-50/50 border-transparent hover:border-gray-200'} ${isAlreadyPaid || true ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-6 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${paymentMethod === 'card' ? 'bg-primary text-white shadow-lg rotate-12' : 'bg-white text-secondary/20 group-hover:text-primary'}`}>
                      <CreditCard size={32} />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`font-black text-sm uppercase tracking-widest leading-none ${paymentMethod === 'card' ? 'text-secondary' : 'text-secondary/40'}`}>Credit Card</h4>
                      <p className="text-[8px] font-bold text-secondary/20 uppercase tracking-[0.2em]">Coming Soon</p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-primary-glow"></div>}
                </button>
              </div>
            </section>
          </div>

          {/* Price Breakdown Sidebar */}
          <aside className="lg:w-[400px] animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="bg-white rounded-[48px] shadow-premium p-12 border border-blue-50/30 sticky top-32 space-y-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-dark opacity-80"></div>
              
              <h3 className="text-2xl font-black text-secondary tracking-tight">Price Breakdown</h3>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center text-secondary/40 px-2">
                  <span className="text-sm font-bold uppercase tracking-widest">Experience ({booking?.totalHours || booking?.hours || 4}h)</span>
                  <span className="font-black text-secondary text-lg">${booking?.totalPrice?.toFixed(2) || booking?.price?.toFixed(2) || "120.00"}</span>
                </div>
                <div className="flex justify-between items-center text-secondary/40 px-2">
                  <span className="text-sm font-bold uppercase tracking-widest">Service Fee</span>
                  <span className="font-black text-secondary text-lg">$0.00</span>
                </div>
                <div className="pt-8 border-t border-gray-50 flex justify-between items-baseline px-2">
                  <span className="text-lg font-black text-secondary italic tracking-tight">Total Investment</span>
                  <span className="text-5xl font-black text-primary tracking-tighter leading-none">${booking?.totalPrice?.toFixed(2) || booking?.price?.toFixed(2) || "120.00"}</span>
                </div>
              </div>

              <div className="space-y-6">
                {!isAlreadyPaid && paymentMethod === 'paypal' && (
                  <PayPalScriptProvider options={{ clientId: clientId || "" }}>
                    <PayPalButtons
                      createOrder={handleCreateOrder}
                      onApprove={handleApprove}
                      onError={handleError}
                      disabled={processing}
                      style={{
                        layout: "vertical",
                        color: "blue",
                        shape: "pill",
                        label: "pay",
                      }}
                    />
                  </PayPalScriptProvider>
                )}
                
                {(isAlreadyPaid || paymentMethod !== 'paypal') && (
                  <Button 
                    disabled={true}
                    className="w-full py-8 text-xl shadow-premium-hover opacity-50 cursor-not-allowed flex items-center justify-center gap-3 border-none"
                  >
                    {isAlreadyPaid ? "Already Paid" : "Select PayPal"}
                  </Button>
                )}

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-primary/30 font-black uppercase tracking-[0.3em] text-[9px]">
                    <Lock size={12} /> SSL Encrypted
                  </div>
                  <div className="flex -space-x-1 opacity-20">
                    <div className="w-8 h-5 bg-secondary rounded-sm"></div>
                    <div className="w-8 h-5 bg-primary rounded-sm"></div>
                    <div className="w-8 h-5 bg-accent-orange rounded-sm"></div>
                  </div>
                </div>
              </div>

              {/* Trust Guarantee Box */}
              <div className="bg-gray-50/50 rounded-[32px] p-8 space-y-4 border border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-accent-green group-hover:rotate-12 transition-transform">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="font-black text-secondary tracking-tight text-sm">Buddy Guarantee</h4>
                </div>
                <p className="text-[10px] font-bold text-secondary/30 leading-relaxed uppercase tracking-widest">
                  Your payment is held in escrow and only released to <span className="text-secondary underline decoration-primary/20">{buddy?.name || "Buddy"}</span> after your experience is successfully completed.
                </p>
              </div>

              {/* Need Help link */}
              <div className="text-center">
                <button className="text-[9px] font-black text-secondary/10 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
                  <Info size={12} /> Questions about this booking?
                </button>
              </div>
            </div>
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
