import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Eye,
  Loader2,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/api';

type DashboardStats = {
  users?: number;
  travelers?: number;
  buddies?: number;
  pendingVerifications?: number;
  verifiedBuddies?: number;
  rejectedBuddies?: number;
};

type BookingRecord = {
  id: string;
  title?: string;
  status?: string;
  meetupStatus?: string;
  totalPrice?: number;
  price?: number;
  date?: string;
  createdAt?: string;
};

type VerificationRecord = {
  id: string;
  name: string;
  type?: string;
  regDate?: string;
  status?: string;
  avatar?: string;
  email?: string;
};

type EarningsResponse = {
  transactions?: Array<{ amount?: number; type?: string }>;
};

const money = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-xs font-black uppercase text-indigo-600 shadow-sm">
    {(name || 'AD').slice(0, 2)}
  </div>
);

function lastSevenDays() {
  const days: Array<{ key: string; name: string; bookings: number; revenue: number }> = [];
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    days.push({
      key,
      name: date.toLocaleDateString(undefined, { weekday: 'short' }),
      bookings: 0,
      revenue: 0,
    });
  }
  return days;
}

const AdminDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [earnings, setEarnings] = useState<EarningsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const [statsData, bookingData, verificationData, earningData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getAllBookings(),
          adminService.getVerifications(),
          adminService.getAllEarningsTransactions(),
        ]);

        setStats(statsData || {});
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setVerifications(Array.isArray(verificationData) ? verificationData : []);
        setEarnings(earningData || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData = useMemo(() => {
    const days = lastSevenDays();
    const byKey = new Map(days.map((day) => [day.key, day]));

    bookings.forEach((booking) => {
      const key = (booking.date || booking.createdAt || '').slice(0, 10);
      const day = byKey.get(key);
      if (!day) return;
      day.bookings += 1;
      day.revenue += Number(booking.totalPrice ?? booking.price ?? 0);
    });

    return days;
  }, [bookings]);

  const revenue = useMemo(
    () =>
      bookings
        .filter((booking) => ['CONFIRMED', 'COMPLETED'].includes(booking.status || ''))
        .reduce((sum, booking) => sum + Number(booking.totalPrice ?? booking.price ?? 0), 0),
    [bookings]
  );

  const commission = useMemo(() => Math.round(revenue * 0.1), [revenue]);
  const walletBalance = useMemo(
    () => (earnings.transactions || []).reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    [earnings.transactions]
  );
  const ongoingTrips = bookings.filter((booking) => booking.meetupStatus === 'IN_PROGRESS').length;
  const priorityQueue = verifications
    .filter((item) => ['Pending', 'Processing', 'Manual Review'].includes(item.status || ''))
    .slice(0, 5);

  const metrics = [
    {
      label: 'Total revenue',
      value: money(revenue),
      helper: `${bookings.length} bookings`,
      icon: DollarSign,
      color: 'bg-emerald-600',
    },
    {
      label: 'Platform commission',
      value: money(commission),
      helper: 'Estimated 10%',
      icon: Wallet,
      color: 'bg-indigo-600',
    },
    {
      label: 'Users',
      value: stats?.users ?? 0,
      helper: `${stats?.travelers ?? 0} travelers / ${stats?.buddies ?? 0} buddies`,
      icon: Users,
      color: 'bg-sky-600',
    },
    {
      label: 'Pending reviews',
      value: stats?.pendingVerifications ?? priorityQueue.length,
      helper: 'Identity verification',
      icon: UserCheck,
      color: 'bg-amber-500',
    },
  ];

  const chartColors =
    theme === 'dark'
      ? {
          grid: 'rgba(255,255,255,0.06)',
          text: '#94a3b8',
          line: '#818cf8',
          tooltipBg: '#111827',
          tooltipBorder: 'rgba(255,255,255,0.12)',
        }
      : {
          grid: '#e2e8f0',
          text: '#64748b',
          line: '#4f46e5',
          tooltipBg: '#ffffff',
          tooltipBorder: '#e2e8f0',
        };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-slide-up">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-indigo-600">Admin console</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-admin-main">Command Center</h1>
            <p className="mt-2 text-base font-bold text-admin-muted">
              Live operational view powered by database records.
            </p>
          </div>
          <div className="rounded-2xl border border-admin bg-admin-surface px-5 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-admin-muted">Wallet ledger</p>
            <p className="mt-1 text-xl font-black text-admin-main">{money(walletBalance)}</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-80 items-center justify-center rounded-3xl border border-admin bg-admin-surface">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-indigo-600" size={36} />
              <p className="text-[10px] font-black uppercase tracking-widest text-admin-muted">Loading dashboard data</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="admin-card !rounded-2xl !p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white ${metric.color}`}>
                      <metric.icon size={22} />
                    </div>
                    <ArrowUpRight size={18} className="text-admin-muted" />
                  </div>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-admin-muted">{metric.label}</p>
                  <p className="mt-1 text-3xl font-black text-admin-main">{metric.value}</p>
                  <p className="mt-2 text-xs font-bold text-admin-muted">{metric.helper}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="admin-card xl:col-span-2">
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-admin-main">Booking Activity</h2>
                    <p className="text-sm font-bold text-admin-muted">Last 7 days from booking records</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-admin bg-admin-surface px-4 py-3">
                    <Calendar size={18} className="text-indigo-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-admin-muted">7 days</span>
                  </div>
                </div>
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 800 }}
                        dy={12}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 800 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartColors.tooltipBg,
                          borderColor: chartColors.tooltipBorder,
                          borderRadius: '16px',
                          border: `1px solid ${chartColors.tooltipBorder}`,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke={chartColors.line}
                        strokeWidth={4}
                        dot={{ r: 5, strokeWidth: 2, fill: chartColors.tooltipBg, stroke: chartColors.line }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="admin-card">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-admin-main">Priority Queue</h2>
                    <p className="text-sm font-bold text-admin-muted">Database verification records</p>
                  </div>
                  <ShieldCheck size={24} className="text-indigo-600" />
                </div>

                <div className="space-y-3">
                  {priorityQueue.length > 0 ? (
                    priorityQueue.map((record) => (
                      <Link
                        key={record.id}
                        to="/admin/verification"
                        className="flex items-center justify-between gap-3 rounded-2xl border border-admin bg-admin-surface p-3 transition hover:border-indigo-500/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {record.avatar ? (
                            <img src={record.avatar} className="h-12 w-12 rounded-2xl object-cover" alt={record.name} />
                          ) : (
                            <InitialAvatar name={record.name} />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-admin-main">{record.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-admin-muted">
                              {record.type || 'Buddy'} • {record.status || 'Pending'}
                            </p>
                          </div>
                        </div>
                        <Eye size={16} className="shrink-0 text-indigo-600" />
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-admin bg-admin-surface p-6 text-center">
                      <UserCheck size={28} className="mx-auto text-admin-muted" />
                      <p className="mt-3 text-sm font-bold text-admin-muted">No pending verification records.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-2xl border border-admin bg-admin-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-admin-muted">Ongoing trips</span>
                    <span className="text-xl font-black text-admin-main">{ongoingTrips}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-admin-muted">
                    <MapPin size={15} className="text-indigo-600" />
                    From live meetup status
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
