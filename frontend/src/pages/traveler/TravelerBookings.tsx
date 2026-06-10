import React, { useState, useEffect } from 'react';
import {
  MapPin, Calendar, Clock, MessageCircle, ArrowRight, Compass,
  Activity, ShieldCheck, Zap, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Star, Filter, Wallet, Users
} from 'lucide-react';
import { bookingService } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING: {
    label: 'Awaiting Payment',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    icon: AlertCircle,
    pulse: true,
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle,
    pulse: false,
  },
  UPCOMING: {
    label: 'Upcoming',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    icon: Zap,
    pulse: false,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-secondary/50',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: CheckCircle,
    pulse: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
    icon: XCircle,
    pulse: false,
  },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.CONFIRMED;

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'upcoming', label: 'Upcoming', icon: Zap },
  { key: 'pending', label: 'Pending', icon: AlertCircle },
  { key: 'completed', label: 'Done', icon: CheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
] as const;

type TabKey = typeof TABS[number]['key'];

// ─── Booking Card ─────────────────────────────────────────────────────────────
const BookingCard: React.FC<{ booking: any; index: number }> = ({ booking, index }) => {
  const navigate = useNavigate();
  const statusCfg = getStatusConfig(booking.status);
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className="group relative bg-white rounded-3xl border border-slate-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Left accent bar — color coded by status */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusCfg.dot} rounded-l-3xl`} />

      <div className="pl-5 pr-5 py-5 flex flex-col gap-4">

        {/* ── Row 1: Buddy + Price ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100">
                <img
                  src={booking.buddyAvatar || `https://i.pravatar.cc/100?u=${booking.buddyId}`}
                  alt={booking.buddyName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                <ShieldCheck size={8} className="text-white" />
              </div>
            </div>

            {/* Title & buddy */}
            <div className="min-w-0 flex-1">
              <Link
                to={`/traveller/booking/${booking.id}`}
                className="block font-black text-secondary text-base leading-tight truncate hover:text-primary transition-colors"
              >
                {booking.title || 'Local Experience'}
              </Link>
              <p className="text-xs text-secondary/40 font-semibold mt-0.5">
                with {booking.buddyName || 'Your Local Buddy'}
              </p>
            </div>
          </div>

          {/* Price badge */}
          <div className="shrink-0 text-right">
            <p className="text-xl font-black text-secondary tracking-tight">${booking.price}</p>
            <p className="text-[9px] font-bold text-secondary/30 uppercase tracking-widest">total</p>
          </div>
        </div>

        {/* ── Row 2: Status pill ── */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
            {statusCfg.label}
          </span>
          {booking.meetupStatus === 'IN_PROGRESS' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-500 text-white animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" /> Live Now
            </span>
          )}
        </div>

        {/* ── Row 3: Trip metadata strip ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Calendar, label: 'Date', value: booking.date || '—' },
            { icon: Clock, label: 'Time', value: booking.time || '—' },
            { icon: Activity, label: 'Duration', value: `${booking.hours || 3}h` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col gap-1 bg-slate-50 rounded-xl p-2.5">
              <div className="flex items-center gap-1 text-secondary/30">
                <Icon size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
              </div>
              <p className="text-xs font-black text-secondary truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Location row */}
        {booking.location && (
          <div className="flex items-center gap-1.5 text-secondary/40">
            <MapPin size={11} className="text-primary shrink-0" />
            <p className="text-xs font-semibold truncate">{booking.location}</p>
          </div>
        )}

        {/* ── Row 4: Action buttons ── */}
        <div className="flex gap-2 pt-1 border-t border-slate-50">
          {/* Message */}
          <button
            onClick={() => navigate(`/traveller/messages?buddyId=${booking.buddyId}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-secondary/60 hover:text-secondary text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-transparent"
          >
            <MessageCircle size={13} /> Chat
          </button>

          {/* View details */}
          <Link
            to={`/traveller/booking/${booking.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-secondary/60 hover:text-secondary text-[10px] font-black uppercase tracking-wider transition-all border border-transparent"
          >
            Details <ChevronRight size={11} />
          </Link>

          {/* Primary CTA — dynamic per status */}
          {booking.status === 'PENDING' && (
            <Link
              to="/traveller/checkout"
              state={{ bookingId: booking.id }}
              className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
            >
              <Wallet size={13} /> Pay Now
            </Link>
          )}

          {booking.meetupStatus === 'IN_PROGRESS' && (
            <button
              onClick={() => (window.location.href = `/traveller/experience/live/${booking.id}`)}
              className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer border-none animate-pulse"
            >
              <Zap size={13} /> Join Live
            </button>
          )}

          {booking.status === 'COMPLETED' && !booking.hasReview && (
            <Link
              to={`/traveller/review/${booking.id}`}
              className="flex-[1.5] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
            >
              <Star size={13} /> Review
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const BookingSkeleton = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="pl-5 pr-5 py-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded-full w-3/5" />
          <div className="h-3 bg-slate-100 rounded-full w-2/5" />
        </div>
        <div className="w-16 h-8 bg-slate-100 rounded-xl" />
      </div>
      <div className="h-6 w-32 bg-slate-100 rounded-full" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl" />)}
      </div>
      <div className="flex gap-2">
        {[1,2,3].map(i => <div key={i} className="flex-1 h-9 bg-slate-50 rounded-xl" />)}
      </div>
    </div>
  </div>
);

// ─── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar: React.FC<{ bookings: any[] }> = ({ bookings }) => {
  const total = bookings.length;
  const upcoming = bookings.filter(b => ['CONFIRMED', 'UPCOMING'].includes(b.status)).length;
  const spent = bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((acc, b) => acc + (parseFloat(b.price) || 0), 0);
  const buddies = new Set(bookings.map(b => b.buddyId).filter(Boolean)).size;

  const stats = [
    { label: 'Total Trips', value: total, icon: Compass, color: 'text-primary' },
    { label: 'Upcoming', value: upcoming, icon: Zap, color: 'text-sky-500' },
    { label: 'Spent', value: `$${spent.toFixed(0)}`, icon: Wallet, color: 'text-emerald-500' },
    { label: 'Buddies', value: buddies, icon: Users, color: 'text-violet-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-2xl border border-slate-100 px-4 py-3.5 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={17} />
          </div>
          <div>
            <p className="text-lg font-black text-secondary leading-none">{value}</p>
            <p className="text-[9px] font-bold text-secondary/30 uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TravelerBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getAll();
        setTimeout(() => {
          setBookings(data || []);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const myBookings = bookings.filter(b => String(b.userId) === String(user?.id));

  const filteredBookings = myBookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.status === 'PENDING';
    if (activeTab === 'upcoming') return ['CONFIRMED', 'UPCOMING'].includes(b.status);
    if (activeTab === 'completed') return b.status === 'COMPLETED';
    if (activeTab === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginated = filteredBookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Count per tab for badges
  const counts: Record<TabKey, number> = {
    all: myBookings.length,
    upcoming: myBookings.filter(b => ['CONFIRMED', 'UPCOMING'].includes(b.status)).length,
    pending: myBookings.filter(b => b.status === 'PENDING').length,
    completed: myBookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: myBookings.filter(b => b.status === 'CANCELLED').length,
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.3em] mb-1">Your Journeys</p>
              <h1 className="text-3xl md:text-4xl font-black text-secondary tracking-tight">
                My <span className="text-primary">Bookings</span>
              </h1>
            </div>
            <button
              onClick={() => navigate('/traveller/buddies')}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-primary-glow cursor-pointer border-none"
            >
              Find Buddies <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        {!loading && myBookings.length > 0 && (
          <div className="mb-6">
            <StatsBar bookings={myBookings} />
          </div>
        )}

        {/* ── Tab bar ── */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            const count = counts[key];
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isActive
                    ? 'bg-secondary text-white border-secondary shadow-lg'
                    : 'bg-white text-secondary/40 border-slate-200 hover:border-secondary/20 hover:text-secondary/70'
                }`}
              >
                <Icon size={13} />
                {label}
                {count > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-secondary/40'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => <BookingSkeleton key={i} />)}
          </div>
        ) : paginated.length > 0 ? (
          <>
            {/* Results count */}
            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest mb-4">
              {filteredBookings.length} {activeTab === 'all' ? 'total' : activeTab} booking{filteredBookings.length !== 1 ? 's' : ''}
            </p>

            {/* Booking grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginated.map((booking, i) => (
                <BookingCard key={booking.id || i} booking={booking} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ArrowRight size={16} className="rotate-180" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-secondary text-white shadow-lg'
                          : 'bg-white border border-slate-200 text-secondary/40 hover:border-secondary/30'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="relative">
              <div className="w-28 h-28 bg-white rounded-[36px] border border-slate-100 shadow-sm flex items-center justify-center">
                <Compass size={44} className="text-secondary/10" />
              </div>
              {/* Decorative dots */}
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary/10 border-2 border-white" />
              <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-secondary/5 border-2 border-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-secondary tracking-tight">
                {activeTab === 'all' ? 'No trips yet' : `No ${activeTab} bookings`}
              </h3>
              <p className="text-sm text-secondary/40 font-medium max-w-xs mx-auto leading-relaxed">
                {activeTab === 'all'
                  ? 'Your adventure starts here. Find a local buddy and book your first experience.'
                  : `You don't have any ${activeTab} bookings right now.`}
              </p>
            </div>

            {activeTab === 'all' ? (
              <button
                onClick={() => navigate('/traveller/buddies')}
                className="btn-primary px-8 py-3.5 text-xs cursor-pointer"
              >
                Explore Local Buddies <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => handleTabChange('all')}
                className="btn-ghost px-8 py-3.5 text-xs cursor-pointer"
              >
                View all bookings
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelerBookings;