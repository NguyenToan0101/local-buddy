import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Plus,
  Route,
  Send,
  Shield,
  Sparkles,
  Timer,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import Button from '../ui/Button';

interface ExperienceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: any) => void;
  buddyName: string;
  buddyAvatar: string;
  hourlyRate?: number;
}

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-black uppercase text-primary">
    {(name || 'LB').slice(0, 2)}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[10px] font-black uppercase tracking-widest text-secondary/45">{children}</label>
);

const Section = ({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-secondary">{title}</h3>
        {description && <p className="mt-1 text-xs font-medium leading-5 text-secondary/50">{description}</p>}
      </div>
    </div>
    {children}
  </section>
);

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-secondary outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10 placeholder:text-secondary/25';

const ExperienceRequestModal: React.FC<ExperienceRequestModalProps> = ({
  isOpen,
  onClose,
  onSend,
  buddyName,
  buddyAvatar,
  hourlyRate = 0,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('2 hours');
  const [guests, setGuests] = useState(1);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [routeStops, setRouteStops] = useState<string[]>(['']);
  const [itineraryNotes, setItineraryNotes] = useState('');
  const [price, setPrice] = useState(45);
  const [priceEdited, setPriceEdited] = useState(false);

  const hours = useMemo(() => {
    if (duration.toLowerCase().includes('full')) return 8;
    return Math.max(1, parseInt(duration, 10) || 1);
  }, [duration]);

  const calculatedPrice = useMemo(() => {
    const baseRate = Number(hourlyRate) > 0 ? Number(hourlyRate) : 45;
    return Number((baseRate * hours).toFixed(2));
  }, [hourlyRate, hours]);

  const cleanedRouteStops = useMemo(() => routeStops.map((stop) => stop.trim()).filter(Boolean), [routeStops]);
  const canSend = Boolean(date && time && (meetingPoint.trim() || cleanedRouteStops.length > 0));

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setDuration('2 hours');
    setGuests(1);
    setMeetingPoint('');
    setRouteStops(['']);
    setItineraryNotes('');
    setPriceEdited(false);
    setPrice(calculatedPrice);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !priceEdited) setPrice(calculatedPrice);
  }, [calculatedPrice, isOpen, priceEdited]);

  const handleSubmit = () => {
    if (!canSend) return;
    onSend({
      title: title.trim() || `Custom proposal from ${buddyName}`,
      description,
      bookingType: 'CONSULTATION',
      date,
      time,
      duration,
      hours,
      guests,
      meetingPoint: meetingPoint.trim(),
      routeStops: cleanedRouteStops,
      itineraryNotes,
      price,
    });
  };

  const updateRouteStop = (index: number, value: string) => {
    setRouteStops((current) => current.map((stop, stopIndex) => (stopIndex === index ? value : stop)));
  };

  const addRouteStop = () => {
    setRouteStops((current) => (current.length >= 20 ? current : [...current, '']));
  };

  const removeRouteStop = (index: number) => {
    setRouteStops((current) => (current.length === 1 ? [''] : current.filter((_, stopIndex) => stopIndex !== index)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/70 p-3 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-slate-50 shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative shrink-0">
              {buddyAvatar ? (
                <img src={buddyAvatar} alt={buddyName} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <InitialAvatar name={buddyName} />
              )}
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary text-white">
                <Send size={10} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Custom offer</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-secondary">Create Proposal Offer</h2>
              <p className="mt-1 text-xs font-semibold text-secondary/50">
                Sending as <span className="font-black text-secondary">{buddyName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-secondary/45 transition hover:text-rose-600"
            aria-label="Close proposal modal"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <Section
                title="Offer summary"
                description="Give the traveler a concise reason to accept this proposal."
                icon={Sparkles}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FieldLabel>Proposal headline</FieldLabel>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={`Custom experience with ${buddyName}`}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Proposal details</FieldLabel>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe highlights, local tips, food stops, pacing and what makes this route useful."
                      className={`${inputClass} min-h-28 resize-none leading-6`}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Route plan" description="Meeting point or at least one route stop is required." icon={Route}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FieldLabel>Meeting point</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
                      <input
                        type="text"
                        value={meetingPoint}
                        onChange={(event) => setMeetingPoint(event.target.value)}
                        placeholder="Hotel lobby, cafe name, station exit..."
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel>Route stops</FieldLabel>
                      <button
                        type="button"
                        onClick={addRouteStop}
                        className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary"
                      >
                        <Plus size={13} /> Add stop
                      </button>
                    </div>

                    <div className="space-y-2">
                      {routeStops.map((stop, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={stop}
                            onChange={(event) => updateRouteStop(index, event.target.value)}
                            placeholder={index === 0 ? 'First stop or highlight' : 'Next stop'}
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => removeRouteStop(index)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                            aria-label="Remove stop"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FieldLabel>Itinerary notes</FieldLabel>
                    <textarea
                      value={itineraryNotes}
                      onChange={(event) => setItineraryNotes(event.target.value)}
                      placeholder="What to bring, pickup guidance, safety notes, food preferences..."
                      className={`${inputClass} min-h-24 resize-none leading-6`}
                    />
                  </div>
                </div>
              </Section>
            </div>

            <aside className="space-y-4 lg:col-span-2">
              <Section title="Schedule" icon={Calendar}>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <FieldLabel>Date</FieldLabel>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
                      <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Time</FieldLabel>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
                      <input
                        type="time"
                        value={time}
                        onChange={(event) => setTime(event.target.value)}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <FieldLabel>Duration</FieldLabel>
                      <div className="relative">
                        <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
                        <select
                          value={duration}
                          onChange={(event) => setDuration(event.target.value)}
                          className={`${inputClass} appearance-none pl-11`}
                        >
                          <option>1 hour</option>
                          <option>2 hours</option>
                          <option>3 hours</option>
                          <option>4 hours</option>
                          <option>5 hours</option>
                          <option>Full day</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel>Guests</FieldLabel>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={guests}
                          onChange={(event) => setGuests(Math.max(1, parseInt(event.target.value, 10) || 1))}
                          className={`${inputClass} pl-11`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Pricing" icon={DollarSign}>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <FieldLabel>Total offer price</FieldLabel>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={16} />
                      <input
                        type="number"
                        min="1"
                        value={price}
                        onChange={(event) => {
                          setPriceEdited(true);
                          setPrice(Math.max(1, Number(event.target.value) || 1));
                        }}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Rate calculation</p>
                    <p className="mt-1 text-sm font-black text-secondary">
                      ${Number(hourlyRate || 45).toFixed(2)} x {hours}h = ${calculatedPrice.toFixed(2)}
                    </p>
                    {priceEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setPriceEdited(false);
                          setPrice(calculatedPrice);
                        }}
                        className="mt-3 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark"
                      >
                        Reset to rate
                      </button>
                    )}
                  </div>
                </div>
              </Section>

              <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Proposal preview</p>
                <h3 className="mt-2 text-lg font-black leading-tight text-secondary">
                  {title.trim() || `Custom proposal from ${buddyName}`}
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">When</p>
                    <p className="mt-1 truncate text-xs font-black text-secondary">{date || 'No date'} {time || ''}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Total</p>
                    <p className="mt-1 text-xs font-black text-secondary">${price}</p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-white p-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Route</p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold text-secondary/60">
                      {meetingPoint.trim() || cleanedRouteStops[0] || 'Meeting point required'}
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/35">
              <Shield size={14} className="text-primary" />
              Traveler pays through secure checkout after accepting
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-secondary/60 transition hover:text-secondary"
              >
                Cancel
              </button>
              <Button
                onClick={handleSubmit}
                disabled={!canSend}
                className="rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest"
              >
                <Send size={14} /> Send proposal
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ExperienceRequestModal;
