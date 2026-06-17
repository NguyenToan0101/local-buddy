import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Compass,
  Filter,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  XCircle,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Awaiting payment',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
  },
  UPCOMING: {
    label: 'Upcoming',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    icon: Zap,
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
};

const TABS = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'upcoming', label: 'Upcoming', icon: Zap },
  { key: 'pending', label: 'Pending', icon: AlertCircle },
  { key: 'completed', label: 'Done', icon: CheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
] as const;

type TabKey = typeof TABS[number]['key'];

const getStatusConfig = (status?: string) =>
  STATUS_CONFIG[(status || 'CONFIRMED') as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.CONFIRMED;

const currency = (value: unknown) => `$${Number(value || 0).toFixed(0)}`;

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-sm font-black uppercase text-primary">
    {(name || 'LB').slice(0, 2)}
  </div>
);

const SummaryTile = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none text-secondary">{value}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-secondary/45">{label}</p>
      </div>
    </div>
  </div>
);

const BookingSkeleton = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex gap-4">
      <div className="h-14 w-14 rounded-xl bg-slate-100" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
    </div>
    <div className="mt-5 grid grid-cols-3 gap-3">
      <div className="h-16 rounded-xl bg-slate-50" />
      <div className="h-16 rounded-xl bg-slate-50" />
      <div className="h-16 rounded-xl bg-slate-50" />
    </div>
  </div>
);

const BookingCard = ({ booking }: { booking: any }) => {
  const navigate = useNavigate();
  const status = getStatusConfig(booking.status);
  const routeStops = Array.isArray(booking.routeStops) ? booking.routeStops.filter(Boolean) : [];
  const statusLabel =
    booking.bookingType === 'CONSULTATION' && !booking.meetingPoint && routeStops.length === 0
      ? 'Awaiting itinerary'
      : status.label;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative shrink-0">
              {booking.buddyAvatar ? (
                <img
                  src={booking.buddyAvatar}
                  alt={booking.buddyName || 'Buddy'}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : (
                <InitialAvatar name={booking.buddyName} />
              )}
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white">
                <ShieldCheck size={11} />
              </span>
            </div>
            <div className="min-w-0">
              <Link
                to={`/traveller/booking/${booking.id}`}
                className="block truncate text-base font-black text-secondary transition hover:text-primary"
              >
                {booking.title || booking.activity || 'Local experience'}
              </Link>
              <p className="mt-1 truncate text-xs font-bold text-secondary/55">
                with {booking.buddyName || 'Your Local Buddy'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${status.className}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {statusLabel}
                </span>
                {booking.meetupStatus === 'IN_PROGRESS' && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                    Live now
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-right">
            <p className="text-lg font-black text-secondary">{currency(booking.price ?? booking.totalPrice)}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">total</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: 'Date', value: booking.date || '-' },
            { icon: Clock, label: 'Time', value: booking.time || '-' },
            { icon: Users, label: 'Guests', value: booking.guests || booking.guestCount || 1 },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <Icon size={14} className="text-primary" />
              <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-secondary/35">{label}</p>
              <p className="truncate text-xs font-black text-secondary">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
          <div className="flex items-start gap-2 text-xs font-bold text-secondary/60">
            <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
            <span className="line-clamp-2">{booking.meetingPoint || routeStops[0] || 'Meeting point is being prepared'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
        <button
          onClick={() => navigate(`/traveller/messages?buddyId=${booking.buddyId}`)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-secondary/65 transition hover:border-primary/30 hover:text-primary"
        >
          <MessageCircle size={14} /> Chat
        </button>
        <Link
          to={`/traveller/booking/${booking.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-secondary/65 transition hover:border-primary/30 hover:text-primary"
        >
          Details <ArrowRight size={14} />
        </Link>
        {booking.status === 'PENDING' && (
          <Link
            to="/traveller/checkout"
            state={{ bookingId: booking.id }}
            className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-primary-glow transition hover:bg-primary-dark"
          >
            <Wallet size={14} /> Pay now
          </Link>
        )}
        {booking.meetupStatus === 'IN_PROGRESS' && (
          <button
            onClick={() => navigate(`/traveller/experience/live/${booking.id}`)}
            className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-emerald-700"
          >
            <Zap size={14} /> Open live
          </button>
        )}
        {booking.status === 'COMPLETED' && !booking.hasReview && (
          <Link
            to={`/traveller/review/${booking.id}`}
            className="ml-auto inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-secondary-light"
          >
            <Star size={14} /> Review
          </Link>
        )}
      </div>
    </article>
  );
};

const TravelerBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getAll();
        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const myBookings = useMemo(
    () => bookings.filter((booking) => String(booking.userId) === String(user?.id)),
    [bookings, user?.id]
  );

  const counts = useMemo(
    () => ({
      all: myBookings.length,
      upcoming: myBookings.filter((booking) => ['CONFIRMED', 'UPCOMING'].includes(booking.status)).length,
      pending: myBookings.filter((booking) => booking.status === 'PENDING').length,
      completed: myBookings.filter((booking) => booking.status === 'COMPLETED').length,
      cancelled: myBookings.filter((booking) => booking.status === 'CANCELLED').length,
    }),
    [myBookings]
  );

  const filteredBookings = myBookings.filter((booking) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return booking.status === 'PENDING';
    if (activeTab === 'upcoming') return ['CONFIRMED', 'UPCOMING'].includes(booking.status);
    if (activeTab === 'completed') return booking.status === 'COMPLETED';
    if (activeTab === 'cancelled') return booking.status === 'CANCELLED';
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const paginated = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalSpent = myBookings
    .filter((booking) => booking.status === 'COMPLETED')
    .reduce((sum, booking) => sum + Number(booking.price || booking.totalPrice || 0), 0);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Traveler bookings</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary md:text-4xl">Your trip board</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-secondary/55">
                Track payment, meetup status, schedule and next actions for every local experience.
              </p>
            </div>
            <button
              onClick={() => navigate('/traveller/buddies')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary"
            >
              Find buddies <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {!loading && myBookings.length > 0 && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryTile label="Bookings" value={myBookings.length} icon={Compass} />
            <SummaryTile label="Upcoming" value={counts.upcoming} icon={Zap} />
            <SummaryTile label="Pending" value={counts.pending} icon={AlertCircle} />
            <SummaryTile label="Spent" value={currency(totalSpent)} icon={Wallet} />
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm scrollbar-hide">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition ${
                activeTab === key
                  ? 'bg-secondary text-white shadow-sm'
                  : 'text-secondary/45 hover:bg-slate-50 hover:text-secondary'
              }`}
            >
              <Icon size={14} />
              {label}
              <span className={`rounded-full px-2 py-0.5 ${activeTab === key ? 'bg-white/15 text-white' : 'bg-slate-100 text-secondary/45'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <BookingSkeleton key={index} />
            ))}
          </div>
        ) : paginated.length > 0 ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">
                Showing {filteredBookings.length} {activeTab === 'all' ? 'bookings' : activeTab}
              </p>
              {totalPages > 1 && (
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {paginated.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-secondary/25">
              <Compass size={32} />
            </div>
            <h2 className="mt-5 text-xl font-black text-secondary">
              {activeTab === 'all' ? 'No bookings yet' : `No ${activeTab} bookings`}
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-secondary/50">
              {activeTab === 'all'
                ? 'Choose a local buddy to start planning your first experience.'
                : 'Switch filters or check back when this status changes.'}
            </p>
            <button
              onClick={() => (activeTab === 'all' ? navigate('/traveller/buddies') : handleTabChange('all'))}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-dark"
            >
              {activeTab === 'all' ? 'Explore buddies' : 'View all'} <ArrowRight size={15} />
            </button>
          </section>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-secondary/60 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-secondary/60 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelerBookings;
