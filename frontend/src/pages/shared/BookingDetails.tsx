import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  QrCode,
  ShieldCheck,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { bookingService, buddyService } from '../../services/api';
import Button from '../../components/ui/Button';

const statusClass = (status?: string) => {
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'COMPLETED') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const money = (value: unknown) => `$${Number(value || 0).toFixed(0)}`;

const InfoTile = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
}) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
    <Icon size={16} className="text-primary" />
    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-secondary/35">{label}</p>
    <p className="mt-1 text-sm font-black text-secondary">{value || '-'}</p>
  </div>
);

const BookingDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [buddy, setBuddy] = useState<any>(null);
  const [qrToken, setQrToken] = useState<any>(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
        console.error('Error fetching booking details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id]);

  useEffect(() => {
    const loadQrToken = async () => {
      if (!id || booking?.meetupStatus !== 'BOTH_ARRIVED') return;
      try {
        const token = await bookingService.getQrToken(id);
        setQrToken(token);
      } catch (error) {
        console.error('Error fetching QR token:', error);
      }
    };

    loadQrToken();
  }, [id, booking?.meetupStatus]);

  const handleTravelerArrived = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setActionError('');
      const updated = await bookingService.markTravelerArrived(id);
      setBooking(updated);
    } catch (error: any) {
      setActionError(error?.message || 'Unable to mark arrival.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      setActionError('');
      const updated = await bookingService.complete(id);
      setBooking(updated);
    } catch (error: any) {
      setActionError(error?.message || 'Unable to complete trip.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Loading booking details</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
        <h2 className="text-xl font-black text-secondary">Booking not found</h2>
        <button
          onClick={() => navigate('/traveller/booking')}
          className="rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white"
        >
          Back to bookings
        </button>
      </div>
    );
  }

  const activityFee = Number(booking.price || booking.totalPrice || 0);
  const serviceFee = Math.round(activityFee * 0.1);
  const total = activityFee + serviceFee;
  const meetupStatus = booking.meetupStatus || 'NOT_STARTED';
  const isConfirmed = booking.status === 'CONFIRMED';
  const routeStops: string[] = Array.isArray(booking.routeStops) ? booking.routeStops.filter(Boolean) : [];

  const steps = [
    { label: 'Requested', done: ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(booking.status) },
    { label: 'Paid', done: ['CONFIRMED', 'COMPLETED'].includes(booking.status) },
    { label: 'Meetup', done: ['BOTH_ARRIVED', 'IN_PROGRESS'].includes(meetupStatus) || booking.status === 'COMPLETED' },
    { label: 'Completed', done: booking.status === 'COMPLETED' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <button
            onClick={() => navigate('/traveller/booking')}
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/50 transition hover:text-primary"
          >
            <ArrowLeft size={16} /> Back to bookings
          </button>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(booking.status)}`}>
                  {booking.status}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary/45">
                  LB-{String(booking.id).slice(0, 8)}
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-secondary md:text-4xl">
                {booking.title || booking.activity || 'Local experience'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-secondary/55">
                {booking.description || 'Review the schedule, route, payment and check-in status before your meetup.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:w-80">
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Total estimate</p>
              <p className="mt-1 text-3xl font-black text-secondary">{money(total)}</p>
              <p className="mt-1 text-xs font-bold text-secondary/45">Includes platform service fee</p>
            </div>
          </div>
        </section>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {buddy && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <img src={buddy.image} alt={buddy.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your local buddy</p>
                      <h2 className="truncate text-xl font-black text-secondary">{buddy.name}</h2>
                      <div className="mt-1 flex items-center gap-2 text-xs font-bold text-secondary/50">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        {buddy.rating || '5.0'} rating
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/traveller/messages?buddyId=${buddy.id}`)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-secondary/70 transition hover:border-primary/30 hover:text-primary"
                  >
                    <MessageSquare size={15} /> Message
                  </button>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-secondary">Trip overview</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <InfoTile label="Date" value={booking.date} icon={Calendar} />
                <InfoTile label="Start" value={booking.time} icon={Clock} />
                <InfoTile label="Duration" value={`${booking.hours || 3} hours`} icon={Zap} />
                <InfoTile label="Guests" value={booking.guests || booking.guestCount || 1} icon={Users} />
              </div>
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Meeting point</p>
                    <p className="mt-1 text-sm font-black text-secondary">{booking.meetingPoint || 'To be confirmed'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-black text-secondary">Itinerary</h2>
              {booking.bookingType === 'CONSULTATION' && routeStops.length === 0 && !booking.meetingPoint ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-700">
                  Your buddy is preparing route details. Payment opens after the itinerary is ready.
                </div>
              ) : routeStops.length > 0 ? (
                <div className="mt-5 space-y-4">
                  {routeStops.map((stop, index) => (
                    <div key={`${stop}-${index}`} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Stop {index + 1}</p>
                        <p className="mt-1 text-sm font-black text-secondary">{stop}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm font-medium text-secondary/50">No route stops added yet.</p>
              )}
              {booking.itineraryNotes && (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Notes</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-secondary/60">{booking.itineraryNotes}</p>
                </div>
              )}
            </section>

            {isConfirmed && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-black text-secondary">Meetup verification</h2>
                {actionError && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{actionError}</div>
                )}

                {meetupStatus === 'NOT_STARTED' && (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-medium leading-6 text-secondary/55">
                      Confirm when you arrive at the meeting point. Your buddy will receive the meetup signal.
                    </p>
                    <Button onClick={handleTravelerArrived} disabled={actionLoading} className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest">
                      {actionLoading ? 'Confirming...' : 'I have arrived'}
                    </Button>
                  </div>
                )}
                {meetupStatus === 'TRAVELER_ARRIVED' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
                    Arrival confirmed. Waiting for your buddy to check in.
                  </div>
                )}
                {meetupStatus === 'BUDDY_ARRIVED' && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm font-bold text-secondary">
                      Your buddy has arrived. Confirm your arrival to generate the QR start code.
                    </div>
                    <Button onClick={handleTravelerArrived} disabled={actionLoading} className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest">
                      I have arrived
                    </Button>
                  </div>
                )}
                {meetupStatus === 'BOTH_ARRIVED' && (
                  <div className="mt-5 text-center">
                    <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-inner">
                      {qrToken?.qrPayload ? <QRCodeSVG value={qrToken.qrPayload} size={190} /> : <QrCode size={86} className="text-secondary/20" />}
                    </div>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-secondary/45">
                      Show this QR to your buddy to start the session
                    </p>
                  </div>
                )}
                {meetupStatus === 'IN_PROGRESS' && (
                  <div className="mt-4 space-y-3">
                    <Button
                      onClick={() => navigate(`/traveller/experience/live/${booking.id}`)}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-700"
                    >
                      Open live experience
                    </Button>
                    <button
                      onClick={handleCompleteTrip}
                      disabled={actionLoading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-widest text-secondary/70"
                    >
                      Complete session
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-base font-black text-secondary">Booking progress</h2>
              <div className="mt-5 space-y-4">
                {steps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${step.done ? 'bg-primary text-white' : 'bg-slate-100 text-secondary/35'}`}>
                      {step.done ? <Check size={15} /> : index + 1}
                    </span>
                    <p className={`text-sm font-black ${step.done ? 'text-secondary' : 'text-secondary/40'}`}>{step.label}</p>
                  </div>
                ))}
              </div>

              <div className="my-5 border-t border-slate-100" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between font-bold text-secondary/55">
                  <span>Guide fee</span>
                  <span className="text-secondary">{money(activityFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-secondary/55">
                  <span>Service fee</span>
                  <span className="text-secondary">{money(serviceFee)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-secondary">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
                  <ShieldCheck size={15} /> Escrow protected
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {booking.status === 'PENDING' && (
                  <>
                    <Link
                      to="/traveller/checkout"
                      state={{ bookingId: booking.id }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-dark"
                    >
                      <CreditCard size={15} /> Pay booking
                    </Link>
                    <Link
                      to={`/traveller/booking/${booking.id}/cancel`}
                      className="flex w-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-600"
                    >
                      Cancel request
                    </Link>
                  </>
                )}
                {booking.status === 'COMPLETED' && (
                  <Link
                    to={`/traveller/review/${booking.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-xs font-black uppercase tracking-widest text-white"
                  >
                    <CheckCircle2 size={15} /> Review buddy
                  </Link>
                )}
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default BookingDetails;
