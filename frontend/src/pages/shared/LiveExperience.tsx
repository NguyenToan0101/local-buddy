import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
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
  routeStops?: string[];
  itineraryNotes?: string;
  date?: string;
  time?: string;
  hours?: number;
  guests?: number;
  price?: number | string;
  totalPrice?: number | string;
  status?: string;
  meetupStatus?: string;
  liveStartedAt?: string;
};

const FALLBACK_LOCATION = 'Vietnam';

function formatStatus(status?: string) {
  return (status || 'IN_PROGRESS').replace(/_/g, ' ').toLowerCase();
}

function getBookingStart(booking: Booking | null) {
  if (booking?.liveStartedAt) {
    const liveStart = new Date(booking.liveStartedAt);
    if (!Number.isNaN(liveStart.getTime())) return liveStart;
  }
  if (!booking?.date) return null;
  const normalizedTime = booking.time?.length === 5 ? `${booking.time}:00` : booking.time || '00:00:00';
  const start = new Date(`${booking.date}T${normalizedTime}+07:00`);
  return Number.isNaN(start.getTime()) ? null : start;
}

function formatDate(date?: string) {
  if (!date) return 'To be confirmed';
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

const StatTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <Icon size={16} className="text-primary" />
    <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-secondary/35">{label}</p>
    <p className="mt-1 truncate text-sm font-black text-secondary">{value}</p>
  </div>
);

const LiveExperience: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const data = await bookingService.getLive(id);
        setBooking({
          ...data,
          liveStartedAt: data.liveStartedAt || new Date().toISOString(),
        });
      } catch (err: unknown) {
        console.error('Error fetching live booking:', err);
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

  const handleComplete = async () => {
    if (!booking?.id || completing) return;
    try {
      setCompleting(true);
      const updated = await bookingService.complete(booking.id);
      setBooking(updated);
      navigate(`/traveller/review/${booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete this live experience.');
    } finally {
      setCompleting(false);
    }
  };

  const time = formatDuration(remainingSeconds);
  const routeStops = Array.isArray(booking?.routeStops) ? booking.routeStops.filter(Boolean) : [];
  const experienceTitle = booking?.title || booking?.activity || 'Local Experience';
  const location = booking?.meetingPoint || routeStops[0] || FALLBACK_LOCATION;
  const meetupStatus = booking?.meetupStatus || 'IN_PROGRESS';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={38} />
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Loading live experience</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-secondary">Live session unavailable</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-secondary/50">
            {error || 'We could not find this live booking.'}
          </p>
          <button
            onClick={() => navigate('/traveller/booking')}
            className="mt-6 w-full rounded-xl bg-secondary py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary"
          >
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-secondary">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/traveller/booking')}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-secondary/55 transition hover:text-primary"
            aria-label="Back to bookings"
          >
            <ArrowLeft size={20} strokeWidth={3} />
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
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-primary-glow transition hover:bg-primary-dark"
            aria-label="Message buddy"
          >
            <MessageCircle size={19} strokeWidth={3} />
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="space-y-6 lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-white p-5 sm:p-6 lg:p-8">
              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary">Live session</p>
                      <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary sm:text-4xl">{experienceTitle}</h2>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-primary-glow">
                      <Activity size={22} strokeWidth={3} />
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin size={19} strokeWidth={3} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Meeting area</p>
                        <p className="mt-1 text-base font-black leading-snug text-secondary">{location}</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-secondary/50">
                          {booking.description || 'Follow your buddy guidance and keep the session active while exploring.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary/40">
                      <span>Session progress</span>
                      <span>{Math.round(elapsedPercent)}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${elapsedPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary p-5 text-white shadow-sm sm:p-6">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Time remaining</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'H', value: time.h },
                      { label: 'M', value: time.m },
                      { label: 'S', value: time.s },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-white/10 p-4 text-center">
                        <p className="text-3xl font-black leading-none tabular-nums text-primary sm:text-4xl">{item.value}</p>
                        <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-white/40">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/35">Start</p>
                      <p className="mt-1 text-sm font-black">{booking.time || '--:--'} on {formatDate(booking.date)}</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/35">Duration</p>
                      <p className="mt-1 text-sm font-black">{booking.hours || 1} hour session</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/35">Route stops</p>
                      <p className="mt-1 text-sm font-black">{routeStops.length || 0} planned stops</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile icon={Calendar} label="Date" value={formatDate(booking.date)} />
            <StatTile icon={Clock} label="Time" value={`${booking.time || '--:--'} (${booking.hours || 1}h)`} />
            <StatTile icon={Users} label="Guests" value={booking.guests || 1} />
            <StatTile icon={Wallet} label="Paid" value={formatMoney(booking.totalPrice || booking.price)} />
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {booking.buddyAvatar ? (
                  <img src={booking.buddyAvatar} alt={booking.buddyName || 'Local buddy'} className="h-full w-full object-cover" />
                ) : (
                  <InitialAvatar name={booking.buddyName} />
                )}
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">Your local buddy</p>
                <h2 className="truncate text-xl font-black tracking-tight">{booking.buddyName || 'Local Buddy'}</h2>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-secondary/40">
                  <ShieldCheck size={13} strokeWidth={3} className="text-emerald-500" />
                  Verified host
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Live itinerary</p>
                <h3 className="text-xl font-black tracking-tight">Route timeline</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} strokeWidth={3} />
              </div>
            </div>

            <div className="relative space-y-5 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-px before:bg-slate-200">
              <div className="relative pl-9">
                <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-primary" />
                <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">Meetup point</p>
                <h4 className="mt-1 text-sm font-black leading-snug text-secondary">{location}</h4>
              </div>

              {routeStops.length > 0 ? (
                routeStops.map((stop, index) => (
                  <div key={`${stop}-${index}`} className="relative pl-9">
                    <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-slate-200 text-[8px] font-black text-secondary/50">
                      {index + 1}
                    </span>
                    <p className="text-[8px] font-black uppercase tracking-widest text-secondary/35">Stop {index + 1}</p>
                    <h4 className="mt-1 text-sm font-black leading-snug text-secondary">{stop}</h4>
                  </div>
                ))
              ) : (
                <div className="relative pl-9">
                  <span className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-slate-200" />
                  <p className="text-sm font-semibold leading-6 text-secondary/50">No extra route stops were added for this booking.</p>
                </div>
              )}
            </div>

            {booking.itineraryNotes && (
              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Buddy notes</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-secondary/60">{booking.itineraryNotes}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Session controls</p>
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

            {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-600">{error}</p>}

            <button
              onClick={() => navigate(`/traveller/booking/${booking.id}`)}
              className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:border-primary/30 hover:text-primary"
            >
              View booking details
            </button>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="mt-3 w-full rounded-xl bg-primary py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary-dark disabled:opacity-60"
            >
              {completing ? 'Completing...' : 'Complete and review'}
            </button>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Star size={18} className="mt-0.5 text-amber-600" />
              <p className="text-sm font-bold leading-6 text-amber-800">
                Keep the live session open while traveling. Use messages if the meeting point changes or you need help from your buddy.
              </p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default LiveExperience;
