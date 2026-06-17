import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard, Info, Lock, MapPin, ShieldCheck, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { bookingService, buddyService, paymentService } from '../../services/api';
import type { Buddy } from '../../services/api';

type Booking = {
  id: string;
  buddyId?: string;
  buddyName?: string;
  buddyAvatar?: string;
  title?: string;
  description?: string;
  bookingType?: string;
  meetingPoint?: string;
  routeStops?: string[];
  itineraryNotes?: string;
  date?: string;
  time?: string;
  hours?: number;
  price?: number | string;
  totalPrice?: number | string;
  status?: string;
};

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = location.state?.bookingId as string | undefined;

  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const isAlreadyPaid = booking ? booking.status && booking.status !== 'PENDING' : false;
  const bookingAmount = Number(booking?.totalPrice ?? booking?.price ?? 0);
  const bookingAmountLabel = bookingAmount > 0 ? bookingAmount.toFixed(2) : '0.00';
  const routeStops = Array.isArray(booking?.routeStops) ? booking.routeStops.filter(Boolean) : [];
  const isConsultationAwaitingItinerary = booking?.bookingType === 'CONSULTATION' && !booking?.meetingPoint && routeStops.length === 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!bookingId) {
          setError('Booking ID is required. Please start checkout from a booking.');
          return;
        }

        const bookingData = await bookingService.getById(bookingId);
        setBooking(bookingData);

        if (bookingData.buddyId) {
          const buddyData = await buddyService.getById(bookingData.buddyId);
          setBuddy(buddyData);
        }
      } catch (err) {
        console.error('Error fetching data for checkout:', err);
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  const handleCreateOrder = async () => {
    if (!bookingId) {
      setError('Booking ID is required.');
      return;
    }

    try {
      const order = await paymentService.createPayPalOrder(bookingId);
      return order.id;
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment order.');
      throw err;
    }
  };

  const handleApprove = async (data: { orderID: string }) => {
    if (!bookingId) return;

    try {
      setProcessing(true);
      await paymentService.capturePayPalOrder(data.orderID, bookingId);
      setSuccess(true);
    } catch (err) {
      console.error('Error capturing order:', err);
      setError('Payment capture failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleError = (err: unknown) => {
    console.error('PayPal error:', err);
    setError('Payment failed. Please try again.');
    setProcessing(false);
  };

  if (!clientId) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-10 shadow-premium border border-gray-100 max-w-xl w-full text-center space-y-6">
          <h2 className="text-3xl font-black text-secondary tracking-tight">Configuration Error</h2>
          <p className="text-secondary/40 font-bold">PayPal Client ID is not configured.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-[40px] p-10 shadow-premium border border-gray-100 max-w-xl w-full text-center space-y-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-green-500/20">
            <CheckCircle2 size={42} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-secondary tracking-tight">Payment Successful</h2>
            <p className="text-secondary/40 font-bold max-w-xs mx-auto">Your booking is confirmed and your local buddy has been notified.</p>
          </div>
          <Button className="w-full py-5 rounded-2xl" onClick={() => navigate('/traveller/booking')}>
            Back to My Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-6 py-32">
          <div className="max-w-xl w-full bg-white rounded-[40px] p-10 border border-gray-100 shadow-premium text-center space-y-6">
            <h1 className="text-3xl font-black text-secondary tracking-tight">Checkout unavailable</h1>
            <p className="text-sm font-bold text-secondary/45 leading-relaxed">
              {error || 'We could not load a real booking for this checkout.'}
            </p>
            <Button onClick={() => navigate('/traveller/booking')} className="w-full py-5 rounded-2xl">
              Back to My Bookings
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-12">
            <div className="space-y-6">
              <Link to="/traveller/booking" className="group flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-secondary/30 hover:text-primary transition-all">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <ArrowLeft size={14} />
                </div>
                Return to Booking
              </Link>
              <h1 className="text-5xl sm:text-7xl font-black text-secondary tracking-tighter leading-none">
                Finalize your <br />
                <span className="text-primary italic">Adventure.</span>
              </h1>
              <p className="text-secondary/40 font-bold text-lg max-w-xl">Review your real booking details and secure your payment.</p>
            </div>

            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-xl font-black text-secondary tracking-tight">Booking Summary</h2>
                </div>
                <span className="text-[10px] font-black text-secondary/20 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg truncate">
                  {booking.id}
                </span>
              </div>

              <div className="bg-white rounded-[32px] shadow-premium p-6 sm:p-8 border border-gray-50 flex flex-col md:flex-row items-center gap-8">
                <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-[28px] overflow-hidden shadow-xl ring-8 ring-white bg-slate-100">
                    <img src={buddy?.image || booking.buddyAvatar} alt={booking.buddyName || 'Buddy'} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center text-primary">
                    <CheckCircle2 size={22} />
                  </div>
                </div>

                <div className="flex-1 space-y-5 text-center md:text-left min-w-0">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-secondary tracking-tight">{booking.title}</h3>
                    <p className="text-secondary/40 font-bold">{booking.description || booking.meetingPoint || 'To be confirmed'}</p>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block">With Buddy</span>
                      <div className="flex items-center gap-2 font-black text-secondary text-sm">
                        <User size={14} className="text-primary" /> {booking.buddyName || buddy?.name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block">Date & Time</span>
                      <div className="flex items-center gap-2 font-black text-secondary text-sm">
                        <Calendar size={14} className="text-primary" /> {booking.date} - {booking.time}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-secondary/20 uppercase tracking-widest block">Duration</span>
                      <div className="flex items-center gap-2 font-black text-secondary text-sm">
                        <Clock size={14} className="text-primary" /> {booking.hours} Hours
                      </div>
                    </div>
                  </div>
                  {(booking.meetingPoint || routeStops.length > 0) && (
                    <div className="rounded-2xl bg-slate-50 p-4 text-left space-y-3">
                      {booking.meetingPoint && (
                        <p className="text-xs font-black text-secondary">
                          <MapPin size={13} className="inline text-primary mr-1" /> {booking.meetingPoint}
                        </p>
                      )}
                      {routeStops.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {routeStops.map((stop, index) => (
                            <span key={`${stop}-${index}`} className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-secondary/50 border border-slate-100">
                              {index + 1}. {stop}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-black text-secondary tracking-tight">Payment Method</h2>
              </div>

              {isAlreadyPaid && (
                <div className="rounded-[24px] border border-green-200 bg-green-50 px-6 py-5 text-sm font-black text-green-700 uppercase tracking-widest">
                  This booking has already been paid.
                </div>
              )}

              {isConsultationAwaitingItinerary && (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-6 py-5 text-sm font-black text-amber-700 uppercase tracking-widest">
                  Waiting for buddy itinerary before payment.
                </div>
              )}

              {error && (
                <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-5 text-sm font-black text-red-700 uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                  disabled={Boolean(isAlreadyPaid) || isConsultationAwaitingItinerary}
                  onClick={() => setPaymentMethod('paypal')}
                  className={`relative p-8 rounded-[32px] border-4 transition-all overflow-hidden ${paymentMethod === 'paypal' ? 'bg-white border-primary shadow-premium' : 'bg-gray-50/50 border-transparent hover:border-gray-200'} ${isAlreadyPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${paymentMethod === 'paypal' ? 'bg-[#003087] text-white shadow-lg' : 'bg-white text-secondary/20'}`}>
                      <span className="text-2xl font-black italic">PP</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-sm uppercase tracking-widest leading-none text-secondary">PayPal</h4>
                      <p className="text-[8px] font-bold text-secondary/20 uppercase tracking-[0.2em]">Secure & Fast</p>
                    </div>
                  </div>
                </button>

                <button
                  disabled
                  className="relative p-8 rounded-[32px] border-4 border-transparent bg-gray-50/50 opacity-50 cursor-not-allowed"
                >
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white text-secondary/20">
                      <CreditCard size={32} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-sm uppercase tracking-widest leading-none text-secondary/40">Credit Card</h4>
                      <p className="text-[8px] font-bold text-secondary/20 uppercase tracking-[0.2em]">Coming Soon</p>
                    </div>
                  </div>
                </button>
              </div>
            </section>
          </div>

          <aside className="lg:w-[400px]">
            <div className="bg-white rounded-[40px] shadow-premium p-8 border border-blue-50/30 sticky top-32 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary opacity-80" />
              <h3 className="text-2xl font-black text-secondary tracking-tight">Price Breakdown</h3>

              <div className="space-y-5">
                <div className="flex justify-between items-center text-secondary/40">
                  <span className="text-sm font-bold uppercase tracking-widest">Experience ({booking.hours}h)</span>
                  <span className="font-black text-secondary text-lg">${bookingAmountLabel}</span>
                </div>
                <div className="flex justify-between items-center text-secondary/40">
                  <span className="text-sm font-bold uppercase tracking-widest">Service Fee</span>
                  <span className="font-black text-secondary text-lg">$0.00</span>
                </div>
                <div className="pt-6 border-t border-gray-50 flex justify-between items-baseline">
                  <span className="text-lg font-black text-secondary italic tracking-tight">Total</span>
                  <span className="text-5xl font-black text-primary tracking-tighter leading-none">${bookingAmountLabel}</span>
                </div>
              </div>

              <div className="space-y-6">
                {!isAlreadyPaid && !isConsultationAwaitingItinerary && paymentMethod === 'paypal' && (
                  <PayPalScriptProvider options={{ clientId: clientId || '' }}>
                    <PayPalButtons
                      createOrder={handleCreateOrder}
                      onApprove={handleApprove}
                      onError={handleError}
                      disabled={processing}
                      style={{ layout: 'vertical', color: 'blue', shape: 'pill', label: 'pay' }}
                    />
                  </PayPalScriptProvider>
                )}

                {(isAlreadyPaid || isConsultationAwaitingItinerary || paymentMethod !== 'paypal') && (
                  <Button disabled className="w-full py-6 shadow-premium-hover opacity-50 cursor-not-allowed">
                    {isAlreadyPaid ? 'Already Paid' : isConsultationAwaitingItinerary ? 'Awaiting Itinerary' : 'Select PayPal'}
                  </Button>
                )}

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-primary/30 font-black uppercase tracking-[0.3em] text-[9px]">
                    <Lock size={12} /> SSL Encrypted
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-[28px] p-6 space-y-4 border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-accent-green">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="font-black text-secondary tracking-tight text-sm">Buddy Guarantee</h4>
                </div>
                <p className="text-[10px] font-bold text-secondary/30 leading-relaxed uppercase tracking-widest">
                  Your payment is held in escrow and only released to {booking.buddyName || buddy?.name || 'your buddy'} after completion.
                </p>
              </div>

              <button className="text-[9px] font-black text-secondary/10 uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto">
                <Info size={12} /> Questions about this booking?
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
