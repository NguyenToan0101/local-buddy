import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Star,
  Wallet,
  X,
} from 'lucide-react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardOverview from '../../components/buddy/DashboardOverview';
import TripsTab from '../../components/buddy/TripsTab';
import MessagesTab from '../../components/buddy/MessagesTab';
import EarningsTab from '../../components/buddy/EarningsTab';
import ScheduleTab from '../../components/buddy/ScheduleTab';
import SettingsTab from '../../components/buddy/SettingsTab';
import BookingDetail from './BookingDetail';
import NotificationPopover from '../../components/features/NotificationPopover';
import { bookingService, buddyService, messageService, transactionService, type Buddy } from '../../services/api';

const money = (value: number) => `$${value.toFixed(2)}`;

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-sm font-black uppercase text-primary">
    {(name || 'LB').slice(0, 2)}
  </div>
);

const BuddyDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [profile, setProfile] = useState<Buddy | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/buddy/dashboard' },
    { id: 'trips', icon: Calendar, label: 'Trips', path: '/buddy/dashboard/trips' },
    { id: 'schedule', icon: Clock, label: 'Schedule', path: '/buddy/dashboard/schedule' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/buddy/dashboard/messages' },
    { id: 'earnings', icon: Wallet, label: 'Earnings', path: '/buddy/dashboard/earnings' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/buddy/dashboard/settings' },
  ];

  const currentItem = useMemo(() => {
    const path = location.pathname;
    return menuItems.find((item) => path === item.path || (item.id === 'trips' && path.startsWith('/buddy/dashboard/trips/'))) || menuItems[0];
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError('');
        const [profileData, bookingsData, messagesData, transactionsData] = await Promise.all([
          buddyService.getById(user.id),
          bookingService.getAll(0, 100),
          messageService.getConversations(),
          transactionService.getByBuddyId(user.id),
        ]);

        setProfile(profileData);
        setBookings(bookingsData.filter((booking: any) => String(booking.buddyId) === String(user.id)));
        setChats(messagesData.filter((conversation: any) => String(conversation.buddyId) === String(user.id)));
        setTransactions(transactionsData);
      } catch (err) {
        console.error('Error fetching buddy dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const totalEarnings = useMemo(() => {
    return transactions.reduce((acc, item) => {
      const amount = Number(item.amount || 0);
      return item.type === 'payout' ? acc - amount : acc + amount;
    }, 0);
  }, [transactions]);

  const confirmedTrips = useMemo(() => {
    return bookings.filter((booking) => ['CONFIRMED', 'COMPLETED'].includes(booking.status)).length;
  }, [bookings]);

  const pendingTrips = useMemo(() => bookings.filter((booking) => booking.status === 'PENDING').length, [bookings]);

  const stats = useMemo(
    () => [
      { label: 'Wallet balance', value: money(totalEarnings), icon: Wallet, color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'Bookings', value: String(bookings.length), icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Pending', value: String(pendingTrips), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
      {
        label: 'Rating',
        value: profile?.rating ? `${Number(profile.rating).toFixed(1)} (${profile.reviewCount || 0})` : 'No reviews',
        icon: Star,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
      },
    ],
    [bookings.length, pendingTrips, profile?.rating, profile?.reviewCount, totalEarnings]
  );

  const displayName = profile?.name || user?.name || 'Buddy';
  const displayAvatar = profile?.image || user?.avatar || user?.googleAvatar;
  const verificationLabel = profile?.verificationStatus ? profile.verificationStatus.replace(/_/g, ' ') : 'unverified';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <aside
      className={`flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        sidebarCollapsed ? 'md:w-24' : 'md:w-72'
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <Link to="/buddy/dashboard" className={`flex items-center gap-3 ${sidebarCollapsed ? 'md:mx-auto' : ''}`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-primary-glow">
            <Compass size={22} strokeWidth={3} />
          </div>
          {!sidebarCollapsed && <span className="text-sm font-black uppercase tracking-widest text-secondary">Local Buddy</span>}
        </Link>
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="hidden h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-secondary/45 transition hover:text-primary md:flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={17} strokeWidth={3} />
          </button>
        )}
      </div>

      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="mx-auto mt-4 hidden h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-secondary/45 transition hover:text-primary md:flex"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={17} strokeWidth={3} />
        </button>
      )}

      <nav className="flex-1 space-y-1.5 p-4">
        {menuItems.map((item) => {
          const active = currentItem.id === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest transition ${
                active ? 'bg-primary/10 text-primary' : 'text-secondary/45 hover:bg-slate-50 hover:text-secondary'
              }`}
            >
              <item.icon size={18} strokeWidth={active ? 3 : 2.5} className={sidebarCollapsed ? 'md:mx-auto' : ''} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'md:justify-center' : ''}`}>
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
            {displayAvatar ? <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" /> : <InitialAvatar name={displayName} />}
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-secondary">{displayName}</p>
                <p className="mt-0.5 truncate text-[9px] font-black uppercase tracking-widest text-primary">{verificationLabel}</p>
              </div>
              <button onClick={handleLogout} className="rounded-xl p-2 text-secondary/35 transition hover:bg-rose-50 hover:text-rose-600" aria-label="Logout">
                <LogOut size={17} strokeWidth={3} />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-11 w-11 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Loading dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block">{sidebar}</div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-secondary/40 md:hidden">
          <div className="h-full w-80 max-w-[85vw] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <span className="text-sm font-black uppercase tracking-widest text-secondary">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-slate-50 p-2 text-secondary/50">
                <X size={18} strokeWidth={3} />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-secondary md:hidden">
                <Menu size={19} strokeWidth={3} />
              </button>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <currentItem.icon size={20} strokeWidth={3} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight text-secondary">{currentItem.label}</h1>
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-secondary/35">
                  {confirmedTrips} confirmed trips · {chats.length} conversations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setIsNotifOpen((open) => !open)}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:text-primary ${
                    isNotifOpen ? 'text-primary' : 'text-secondary/45'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell size={18} strokeWidth={3} />
                </button>
                <NotificationPopover
                  isOpen={isNotifOpen}
                  onClose={() => setIsNotifOpen(false)}
                  onScanStart={(booking) => {
                    setIsNotifOpen(false);
                    if (booking?.id) navigate(`/buddy/dashboard/trips/${booking.id}`);
                  }}
                />
              </div>
              <Link
                to="/buddy/preview"
                className="hidden rounded-xl bg-secondary px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary sm:inline-flex"
              >
                Preview profile
              </Link>
            </div>
          </div>
        </header>

        {error && (
          <div className="px-4 pt-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">{error}</div>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardOverview stats={stats} upcomingTrips={bookings} chats={chats} />} />
            <Route path="trips" element={<TripsTab upcomingTrips={bookings} />} />
            <Route path="trips/:id" element={<BookingDetail />} />
            <Route path="schedule" element={<ScheduleTab />} />
            <Route path="messages" element={<MessagesTab chats={chats} />} />
            <Route path="earnings" element={<EarningsTab />} />
            <Route path="settings" element={<SettingsTab />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default BuddyDashboard;
