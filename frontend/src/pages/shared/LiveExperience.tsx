import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { bookingService } from '../../services/api';

type Booking = {
  id?: string;
  buddyId?: string;
  buddyName?: string;
  buddyAvatar?: string;
  title?: string;
  activity?: string;
  description?: string;
  meetingPoint?: string;
  date?: string;
  time?: string;
  hours?: number;
  guests?: number;
  price?: number | string;
  totalPrice?: number | string;
  status?: string;
  meetupStatus?: string;
};

const FALLBACK_LOCATION = 'Vietnam';

function formatStatus(status?: string) {
  return (status || 'IN_PROGRESS').replace(/_/g, ' ').toLowerCase();
}

function getBookingStart(booking: Booking | null) {
  if (!booking?.date) return null;
  const normalizedTime = booking.time?.length === 5 ? `${booking.time}:00` : booking.time || '00:00:00';
  const start = new Date(`${booking.date}T${normalizedTime}+07:00`);
  return Number.isNaN(start.getTime()) ? null : start;
}

function formatDate(date?: string) {
  if (!date) return 'Date to be confirmed';
  const parsed = new Date(`${date}T00:00:00+07:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMoney(value?: number | string) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Paid';
  return `$${amount.toFixed(2)}`;
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-base font-black uppercase text-primary">
    {(name || 'LB').slice(0, 2)}
  </div>
);

const LiveExperience: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const data = await bookingService.getById(id);
        setBooking(data);
      } catch (err: unknown) {
        console.error('Error fetching booking for live view:', err);
        setError(err instanceof Error ? err.message : 'Unable to load this live experience.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startAt = useMemo(() => getBookingStart(booking), [booking]);
  const endAt = useMemo(() => {
    if (!startAt) return null;
    return new Date(startAt.getTime() + (booking?.hours || 1) * 60 * 60 * 1000);
  }, [booking?.hours, startAt]);

  const remainingSeconds = useMemo(() => {
    if (!endAt) return 0;
    return Math.max(0, Math.floor((endAt.getTime() - now) / 1000));
  }, [endAt, now]);

  const elapsedPercent = useMemo(() => {
    if (!startAt || !endAt) return 0;
    const total = endAt.getTime() - startAt.getTime();
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((now - startAt.getTime()) / total) * 100));
  }, [endAt, now, startAt]);

  const time = formatDuration(remainingSeconds);
  const experienceTitle = booking?.title || booking?.activity || 'Local Experience';
  const location = booking?.meetingPoint || FALLBACK_LOCATION;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  const meetupStatus = booking?.meetupStatus || 'IN_PROGRESS';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-secondary/40 font-black uppercase tracking-widest text-[10px]">Loading live session</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-16 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Activity size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-secondary tracking-tight">Live session unavailable</h1>
            <p className="text-sm font-bold text-secondary/45 leading-relaxed">
              {error || 'We could not find this booking.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/traveller/booking')}
            className="w-full rounded-2xl bg-secondary text-white py-4 text-[10px] font-black uppercase tracking-widest"
          >
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-secondary">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/traveller/booking')}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-secondary/55 transition hover:text-primary"
            aria-label="Back to bookings"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                {formatStatus(meetupStatus)}
              </p>
            </div>
            <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">{experienceTitle}</h1>
          </div>

          <button
            onClick={() => navigate(`/traveller/messages?buddyId=${booking.buddyId || ''}`)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-primary-glow transition hover:bg-primary-dark"
            aria-label="Message buddy"
          >
            <MessageCircle size={19} strokeWidth={3} />
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-8">
        <section className="lg:col-span-8 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              <div className="relative min-h-[320px] bg-slate-100 md:min-h-[520px]">
                <iframe
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full"
                  title="Live experience location"
                />
                <div className="absolute left-4 right-4 top-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Navigation size={18} strokeWidth={3} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Active location</p>
                      <p className="truncate text-sm font-black text-secondary">{location}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 p-5 sm:p-6">
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {booking.buddyAvatar ? (
                        <img
                          src={booking.buddyAvatar}
                          alt={booking.buddyName || 'Local buddy'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <InitialAvatar name={booking.buddyName} />
                      )}
                      <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary">Your buddy</p>
                      <h2 className="truncate text-xl font-black tracking-tight">{booking.buddyName || 'Local Buddy'}</h2>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-secondary/40">
                        <ShieldCheck size={13} strokeWidth={3} className="text-emerald-500" />
                        Verified Local Buddy
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Hours', value: time.h },
                      { label: 'Minutes', value: time.m },
                      { label: 'Seconds', value: time.s },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center">
                        <p className="text-3xl font-black leading-none tracking-tight text-primary tabular-nums">{item.value}</p>
                        <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-primary/45">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary/35">
                      <span>Session progress</span>
                      <span>{Math.round(elapsedPercent)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${elapsedPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Calendar, label: 'Date', value: formatDate(booking.date) },
                    { icon: Clock, label: 'Time', value: `${booking.time || '--:--'} (${booking.hours || 1}h)` },
                    { icon: Users, label: 'Guests', value: `${booking.guests || 1}` },
                    { icon: Wallet, label: 'Total', value: formatMoney(booking.totalPrice || booking.price) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <item.icon size={15} strokeWidth={3} className="mb-3 text-primary" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-secondary/30">{item.label}</p>
                      <p className="mt-1 truncate text-xs font-black text-secondary">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Trip plan</p>
                <h3 className="text-xl font-black tracking-tight">Live itinerary</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} strokeWidth={3} />
              </div>
            </div>

            <div className="relative space-y-7 before:absolute before:bottom-4 before:left-[9px] before:top-4 before:w-px before:bg-slate-200">
              {[
                {
                  label: 'Meeting point',
                  title: location,
                  detail: booking.description || 'Meet at the location confirmed in your booking.',
                  active: true,
                  icon: MapPin,
                },
                {
                  label: 'Active experience',
                  title: experienceTitle,
                  detail: `${booking.buddyName || 'Your buddy'} is hosting this ${booking.hours || 1}-hour session.`,
                  active: meetupStatus === 'IN_PROGRESS',
                  icon: Activity,
                },
                {
                  label: 'Session wrap-up',
                  title: 'Complete the trip',
                  detail: 'After the session ends, you can return to bookings and leave a review.',
                  active: false,
                  icon: CheckCircle2,
                },
              ].map((item) => (
                <div key={item.label} className="relative pl-9">
                  <span className={`absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white ${item.active ? 'bg-primary' : 'bg-slate-200'}`} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-primary/55">
                      <item.icon size={12} strokeWidth={3} />
                      <p className="text-[8px] font-black uppercase tracking-widest">{item.label}</p>
                    </div>
                    <h4 className="text-sm font-black leading-snug text-secondary">{item.title}</h4>
                    <p className="text-xs font-semibold leading-relaxed text-secondary/45">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Booking status</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-secondary/30">Payment</p>
                <p className="mt-1 text-sm font-black text-secondary">{formatStatus(booking.status)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-secondary/30">Meetup</p>
                <p className="mt-1 text-sm font-black text-secondary">{formatStatus(meetupStatus)}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/traveller/booking/${booking.id}`)}
              className="mt-5 w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:border-primary/30 hover:text-primary"
            >
              View booking details
            </button>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default LiveExperience;
