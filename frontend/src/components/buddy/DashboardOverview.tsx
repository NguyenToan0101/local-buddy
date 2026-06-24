import React from 'react';
import { ArrowRight, BarChart3, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface DashboardOverviewProps {
  stats: Array<{
    label: string;
    value: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }>;
  upcomingTrips: any[];
  chats: any[];
}

const InitialAvatar: React.FC<{ name?: string }> = ({ name }) => (
  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-black uppercase text-primary">
    {(name || 'TR').slice(0, 2)}
  </div>
);

const statusClass = (status?: string) => {
  if (status === 'CONFIRMED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'COMPLETED') return 'bg-slate-100 text-slate-600';
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700';
  if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-secondary/55';
};

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, upcomingTrips, chats }) => {
  const { user } = useAuth();
  const nextTrips = upcomingTrips
    .filter((trip) => trip.status !== 'CANCELLED')
    .slice(0, 4);
  const statusData = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
    .map((status) => ({
      status,
      count: upcomingTrips.filter((trip) => trip.status === status).length,
    }))
    .filter((item) => item.count > 0);
  const maxStatusCount = Math.max(1, ...statusData.map((item) => item.count));

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Buddy dashboard</p>
            <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight text-secondary sm:text-3xl">Welcome back, {user?.name || 'Buddy'}</h2>
            <p className="mt-2 text-sm font-semibold leading-5 text-secondary/50 sm:leading-6">
              Follow bookings, conversations, wallet activity and availability from one workspace.
            </p>
          </div>
          <Link
            to="schedule"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary-dark sm:px-5"
          >
            Update schedule
            <ArrowRight size={15} strokeWidth={3} />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${stat.bg} ${stat.color}`}>
              <stat.icon size={18} strokeWidth={3} />
            </div>
            <p className="mt-3 truncate text-[9px] font-black uppercase tracking-widest text-secondary/35 sm:mt-4">{stat.label}</p>
            <p className="mt-1 truncate text-xl font-black tracking-tight text-secondary sm:text-2xl">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Bookings</p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-secondary sm:text-xl">Recent trips</h3>
            </div>
            <Link to="trips" className="text-[10px] font-black uppercase tracking-widest text-primary">
              View all
            </Link>
          </div>

          {nextTrips.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center sm:p-8">
              <Calendar size={30} className="mx-auto text-secondary/20" />
              <p className="mt-3 text-sm font-bold text-secondary/45">No trips from the database yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nextTrips.map((trip) => (
                <Link key={trip.id} to={`trips/${trip.id}`} className="block rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-primary/20 hover:bg-white sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white">
                        {trip.travelerAvatar ? (
                          <img src={trip.travelerAvatar} alt={trip.traveler || 'Traveler'} className="h-full w-full object-cover" />
                        ) : (
                          <InitialAvatar name={trip.traveler} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-black text-secondary">{trip.title || trip.activity || 'Booking'}</h4>
                        <p className="mt-1 truncate text-xs font-semibold text-secondary/45">
                          {trip.traveler || 'Traveler'} · {trip.date || 'No date'} {trip.time || ''}
                        </p>
                      </div>
                    </div>
                    <span className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${statusClass(trip.status)}`}>
                      {trip.status || 'Unknown'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:col-span-5">
          <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Booking analytics</p>
              <h3 className="mt-1 text-lg font-black tracking-tight text-secondary sm:text-xl">Status breakdown</h3>
            </div>
            <BarChart3 size={22} strokeWidth={3} className="text-primary" />
          </div>

          {statusData.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center sm:p-8">
              <BarChart3 size={30} className="mx-auto text-secondary/20" />
              <p className="mt-3 text-sm font-bold text-secondary/45">No booking status data yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {statusData.map((item) => (
                <div key={item.status}>
                  <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-secondary/45">{item.status.replace(/_/g, ' ')}</span>
                    <span className="text-secondary">{item.count}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(8, (item.count / maxStatusCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Conversation threads</p>
                <p className="mt-1 text-2xl font-black text-secondary">{chats.length}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardOverview;
