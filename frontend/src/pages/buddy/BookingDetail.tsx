import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MessageCircle,
  ShieldCheck,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { bookingService } from '../../services/api';
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
    <p className="mt-1 truncate text-sm font-black text-secondary">{value || '-'}</p>
  </div>
);

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-black uppercase text-primary">
    {(name || 'TR').slice(0, 2)}
  </div>
);

const BookingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const data = await bookingService.getById(id);
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const routeStops: string[] = Array.isArray(booking?.routeStops) ? booking.routeStops.filter(Boolean) : [];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Syncing booking details</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center">
        <h3 className="text-xl font-black text-secondary">Booking not found</h3>
        <Button onClick={() => navigate('/buddy/dashboard/trips')} className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest">
          Back to trips
        </Button>
      </div>
    );
  }

  const price = Number(booking.totalPrice ?? booking.price ?? 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 pb-24 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          onClick={() => navigate('/buddy/dashboard/trips')}
          className="mb-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/50 transition hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to trips
        </button>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(booking.status)}`}>
                {booking.status}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary/45">
                {booking.bookingType || 'Session'}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-secondary/45">
                LB-{String(booking.id).slice(0, 8)}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-secondary md:text-4xl">
              {booking.activity || booking.title || 'Local experience'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-secondary/55">
              Review the traveler request, confirm logistics and keep the itinerary ready before payment or meetup.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 lg:w-80">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
              <ShieldCheck size={15} /> Escrow status
            </div>
            <p className="mt-2 text-3xl font-black text-secondary">{money(price)}</p>
            <p className="mt-1 text-xs font-bold text-secondary/45">Expected booking payout</p>
          </div>
        </div>
      </section>

      <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              {booking.travelerAvatar ? (
                <img src={booking.travelerAvatar} alt={booking.traveler || 'Traveler'} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <InitialAvatar name={booking.traveler} />
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Traveler</p>
                <h2 className="truncate text-xl font-black text-secondary">{booking.traveler || 'Traveler'}</h2>
                <p className="mt-1 text-xs font-bold text-secondary/45">{booking.guests || booking.guestCount || 1} guest request</p>
              </div>
            </div>
            <Link
              to="/buddy/dashboard/messages"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-dark"
            >
              <MessageCircle size={15} /> Open messages
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-secondary">Payout summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between font-bold text-secondary/55">
                <span>Booking price</span>
                <span className="text-secondary">{money(price)}</span>
              </div>
              <div className="flex justify-between font-bold text-secondary/55">
                <span>Service deduction</span>
                <span className="text-emerald-700">$0</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-secondary">
                <span>Net payout</span>
                <span>{money(price)}</span>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-secondary/45">
                <DollarSign size={15} className="text-primary" /> Traveler pays 100% upfront. Payout releases after completion.
              </div>
            </div>
          </section>
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-black text-secondary">Session details</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <InfoTile label="Date" value={booking.date} icon={Calendar} />
              <InfoTile label="Start" value={booking.time} icon={Clock} />
              <InfoTile label="Duration" value={`${booking.hours || 3} hours`} icon={UserIcon} />
              <InfoTile label="Guests" value={booking.guests || booking.guestCount || 1} icon={Users} />
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Meeting point</p>
                  <p className="mt-1 text-sm font-black text-secondary">{booking.meetingPoint || 'Not set yet'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black text-secondary">Itinerary details</h2>
                <p className="mt-1 text-sm font-medium text-secondary/50">
                  This booking is read-only for buddies. Traveler-created booking details cannot be edited while pending.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {booking.meetingPoint && (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Meetup spot</p>
                  <p className="mt-1 text-sm font-black text-secondary">{booking.meetingPoint}</p>
                </div>
              )}
              {routeStops.length > 0 ? (
                routeStops.map((stop, index) => (
                  <div key={`${stop}-${index}`} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Stop {index + 1}</p>
                      <p className="mt-1 text-sm font-black text-secondary">{stop}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-700">
                  No itinerary details were provided by the traveler yet.
                </div>
              )}
              {booking.itineraryNotes && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Guidance</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-secondary/60">{booking.itineraryNotes}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default BookingDetail;
