import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, MapPin, Plus, Shield, Trash2, Users, X, Info, Sparkles } from 'lucide-react';
import { bookingService, messageService } from '../../services/api';
import type { AvailabilitySlot, Buddy } from '../../services/api';
import Button from '../ui/Button';

interface DirectBookingModalProps {
  buddy: Buddy;
  isOpen: boolean;
  onClose: () => void;
  availableSlots?: AvailabilitySlot[];
}

type NormalizedSlot = AvailabilitySlot & {
  dateIso: string;
  time24: string;
  startsAt: Date;
};

const DEFAULT_START_TIME = '09:00';

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function normalizeDateToIso(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
}

function normalizeTimeTo24(time: string) {
  const trimmed = (time || '').trim();
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) return trimmed;

  const [timePart, periodRaw] = trimmed.split(' ');
  const [hourRaw, minuteRaw = '00'] = (timePart || '').split(':');
  let hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  const period = periodRaw?.toUpperCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return DEFAULT_START_TIME;
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function buildStartsAt(dateIso: string, time24: string) {
  return new Date(`${dateIso}T${time24}:00+07:00`);
}

function formatSlotDate(dateIso: string) {
  const parsed = new Date(`${dateIso}T00:00:00+07:00`);
  return {
    day: parsed.getDate(),
    month: parsed.toLocaleString('en-US', { month: 'short' }),
    weekday: parsed.toLocaleString('en-US', { weekday: 'short' }),
  };
}

const DirectBookingModal: React.FC<DirectBookingModalProps> = ({
  buddy,
  isOpen,
  onClose,
  availableSlots = [],
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>(DEFAULT_START_TIME);
  const [hours, setHours] = useState<number>(3);
  const [guests, setGuests] = useState<number>(1);
  const [bookingType, setBookingType] = useState<'PLANNED_ROUTE' | 'CONSULTATION'>('PLANNED_ROUTE');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [routeStops, setRouteStops] = useState<string[]>(['']);
  const [itineraryNotes, setItineraryNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const normalizedSlots = useMemo<NormalizedSlot[]>(() => {
    const now = Date.now();

    return availableSlots
      .map((slot) => {
        const dateIso = normalizeDateToIso(slot.date);
        const time24 = normalizeTimeTo24(slot.time);
        const startsAt = buildStartsAt(dateIso, time24);
        return { ...slot, dateIso, time24, startsAt };
      })
      .filter((slot) => slot.dateIso && !Number.isNaN(slot.startsAt.getTime()) && slot.startsAt.getTime() >= now)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }, [availableSlots]);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(normalizedSlots.map((slot) => slot.dateIso)));
  }, [normalizedSlots]);

  const slotsForSelectedDate = useMemo(() => {
    return normalizedSlots.filter((slot) => slot.dateIso === selectedDate);
  }, [normalizedSlots, selectedDate]);

  const hasPublishedSlots = normalizedSlots.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setTitle('');
    setDescription('');
    setBookingType('PLANNED_ROUTE');
    setMeetingPoint('');
    setRouteStops(['']);
    setItineraryNotes('');

    if (normalizedSlots.length > 0) {
      const firstSlot = normalizedSlots[0];
      setSelectedDate((current) => (current && uniqueDates.includes(current) ? current : firstSlot.dateIso));
      setSelectedTime((current) => {
        const stillAvailable = normalizedSlots.some((slot) => slot.dateIso === firstSlot.dateIso && slot.time24 === current);
        return stillAvailable ? current : firstSlot.time24;
      });
      return;
    }

    setSelectedDate((current) => current || todayIso());
    setSelectedTime((current) => current || DEFAULT_START_TIME);
  }, [isOpen, normalizedSlots, uniqueDates]);

  if (!isOpen) return null;

  const hourlyRate = Number(buddy.price || 10);
  const total = hourlyRate * hours;
  const selectedStartsAt = buildStartsAt(selectedDate, selectedTime);
  const cleanedRouteStops = routeStops.map((stop) => stop.trim()).filter(Boolean);

  const handleDateSelect = (dateIso: string) => {
    setSelectedDate(dateIso);
    const firstSlot = normalizedSlots.find((slot) => slot.dateIso === dateIso);
    if (firstSlot) setSelectedTime(firstSlot.time24);
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

  const handleBooking = async () => {
    setError(null);

    if (bookingType === 'CONSULTATION') {
      setLoading(true);
      try {
        const conversation = await messageService.getOrCreateConversationByBuddyId(buddy.id);
        const adviceMessage = description.trim() || itineraryNotes.trim()
          ? `Hi ${buddy.name}, I'm looking for a customized plan. Title: "${title.trim() || 'Custom Trip'}". Details: ${description.trim() || itineraryNotes.trim()}`
          : `Hi ${buddy.name}, I do not know where to go yet. Can you help me plan an itinerary?`;
        await messageService.sendMessage(conversation.id, {
          type: 'sent',
          senderRole: 'TRAVELER',
          text: adviceMessage,
          content: adviceMessage,
        });
        navigate(`/traveller/messages?buddyId=${buddy.id}`);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to start consultation chat.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!selectedDate) {
      setError('Please select a booking date.');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(selectedTime)) {
      setError('Please select a valid start time.');
      return;
    }
    if (selectedStartsAt.getTime() < Date.now()) {
      setError('Please choose a future date and time.');
      return;
    }
    if (hasPublishedSlots && !slotsForSelectedDate.some((slot) => slot.time24 === selectedTime)) {
      setError('Please choose one of the buddy available time slots.');
      return;
    }
    if (hours < 1 || hours > 12) {
      setError('Duration must be between 1 and 12 hours.');
      return;
    }
    if (guests < 1 || guests > 6) {
      setError('Guest count must be between 1 and 6.');
      return;
    }
    if (!meetingPoint.trim() && cleanedRouteStops.length === 0) {
      setError('Please enter a meeting point or at least one route stop.');
      return;
    }

    setLoading(true);
    try {
      const bookingPayload = {
        buddyId: buddy.id,
        title: title.trim() || `Local experience with ${buddy.name}`,
        description: description.trim() || `Direct booking for ${hours} hour${hours > 1 ? 's' : ''} with ${guests} guest${guests > 1 ? 's' : ''}.`,
        bookingType: 'PLANNED_ROUTE',
        meetingPoint: meetingPoint.trim(),
        routeStops: cleanedRouteStops,
        itineraryNotes: itineraryNotes.trim(),
        date: selectedDate,
        time: selectedTime,
        hours,
        duration: `${hours} hours`,
        guests,
        price: total,
      };

      const booking = await bookingService.create(bookingPayload);
      navigate('/traveller/checkout', { state: { bookingId: booking.id } });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to initialize booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-secondary/40 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose} 
      />

      <div className="relative z-10 w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] bg-white/90 backdrop-blur-2xl border border-white/60 p-6 sm:p-8 pb-safe shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] space-y-6 scrollbar-hide animate-in slide-in-from-bottom-12 duration-500">
        
        {/* Drag handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-200/80 rounded-full mx-auto sm:hidden mb-2 cursor-pointer" onClick={onClose} />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100/50">
          <div className="flex items-center gap-4.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-primary/10 shadow-md">
                <img 
                  src={buddy.image} 
                  alt={buddy.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-secondary tracking-tight">Direct Booking</h3>
              <p className="mt-0.5 text-[10px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-1.5">
                <span>Adventure with</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 font-black italic">{buddy.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 hover:text-rose-500 text-secondary/30 transition-all border-none shadow-sm cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-xs font-bold leading-relaxed text-rose-500">
            {error}
          </div>
        )}

        {/* Booking Flow Tab */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
            <MapPin size={11} className="text-primary" /> Select Booking Flow
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50/50 border border-slate-100/60 p-1.5">
            <button
              type="button"
              onClick={() => setBookingType('PLANNED_ROUTE')}
              className={`rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                bookingType === 'PLANNED_ROUTE' 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5 font-black' 
                  : 'text-secondary/40 hover:text-secondary bg-transparent'
              }`}
            >
              I have a route
            </button>
            <button
              type="button"
              onClick={() => setBookingType('CONSULTATION')}
              className={`rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                bookingType === 'CONSULTATION' 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-black/5 font-black' 
                  : 'text-secondary/40 hover:text-secondary bg-transparent'
              }`}
            >
              Need advice
            </button>
          </div>
        </div>

        {/* Custom Experience Title */}
        {bookingType === 'PLANNED_ROUTE' && (
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
              <Sparkles size={11} className="text-primary" /> Experience Headline
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. Street Food Adventure with ${buddy.name}`}
                className="w-full rounded-2xl border border-slate-150 bg-slate-50/30 px-5 py-4 text-xs font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all shadow-inner placeholder:text-secondary/20"
              />
            </div>
          </div>
        )}



        {/* Date Selection */}
        {bookingType === 'PLANNED_ROUTE' && (
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
              <Calendar size={11} className="text-primary" /> Select Date
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-2.5 scrollbar-hide">
              {hasPublishedSlots ? (
                uniqueDates.map((dateIso) => {
                  const display = formatSlotDate(dateIso);
                  const isSelected = selectedDate === dateIso;

                  return (
                    <button
                      key={dateIso}
                      type="button"
                      onClick={() => handleDateSelect(dateIso)}
                      className={`flex h-20 min-w-[76px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-black shadow-md shadow-primary/5'
                          : 'border-slate-100 bg-white text-secondary/40 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-[7px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">{display.weekday}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider leading-none mb-1.5">{display.month}</span>
                      <span className="text-lg font-black leading-none">{display.day}</span>
                    </button>
                  );
                })
              ) : (
                <input
                  type="date"
                  value={selectedDate}
                  min={todayIso()}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-150 bg-slate-50/30 px-5 py-4 font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all text-xs"
                />
              )}
            </div>
          </div>
        )}

        {/* Custom Experience Description */}
        {bookingType === 'PLANNED_ROUTE' && (
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
              <Info size={11} className="text-primary" /> Custom Details & Special Requests
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you hoping to do? Any food constraints, accessibility requests, or details the guide should know?"
              className="w-full bg-slate-50/30 border border-slate-150 rounded-3xl p-5 text-xs font-bold text-secondary placeholder:text-secondary/20 min-h-[105px] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all resize-none shadow-inner"
            />
          </div>
        )}

        {/* Logistics (Only for planned routes) */}
        {bookingType === 'PLANNED_ROUTE' ? (
          <div className="space-y-5">
            {/* Meeting Point */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
                <MapPin size={11} className="text-primary" /> Meeting Point
              </label>
              <input
                type="text"
                value={meetingPoint}
                onChange={(event) => setMeetingPoint(event.target.value)}
                placeholder="Cafe XYZ, hotel lobby, cathedral gate..."
                className="w-full rounded-2xl border border-slate-150 bg-slate-50/30 px-5 py-4 text-xs font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all placeholder:text-secondary/20"
              />
            </div>

            {/* Route Stops */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 pl-1">
                <label className="text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em]">
                  Timeline Route Stops
                </label>
                <button
                  type="button"
                  onClick={addRouteStop}
                  className="flex h-8 px-3.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white items-center justify-center gap-1.5 text-[8px] font-black uppercase tracking-widest shadow-md shadow-primary/15 transition-all border-none cursor-pointer"
                  aria-label="Add route stop"
                >
                  <Plus size={10} strokeWidth={3} /> Add Stop
                </button>
              </div>
              
              <div className="relative pl-3 space-y-3 before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[1px] before:bg-slate-200">
                {routeStops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-3 animate-in slide-in-from-left-4 duration-200 relative">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-50/30 border border-primary/10 text-[10px] font-black text-primary relative z-10">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={stop}
                      onChange={(event) => updateRouteStop(index, event.target.value)}
                      placeholder={index === 0 ? 'Hanoi Opera House, Cafe ABC...' : 'Next destination stop'}
                      className="min-w-0 flex-1 rounded-2xl border border-slate-150 bg-slate-50/30 px-4 py-3.5 text-xs font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all placeholder:text-secondary/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeRouteStop(index)}
                      className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors border-none cursor-pointer"
                      aria-label="Remove route stop"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary Notes */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
                <Info size={11} className="text-primary" /> Itinerary Guidance & Route Notes
              </label>
              <textarea
                value={itineraryNotes}
                onChange={(event) => setItineraryNotes(event.target.value)}
                placeholder="Detail custom stops, recommendations on footwear, lunch break plans, safety notices..."
                className="min-h-[96px] w-full resize-none rounded-2xl border border-slate-150 bg-slate-50/30 px-5 py-4 text-xs font-bold text-secondary placeholder:text-secondary/20 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        ) : (
          /* Consultation advice request */
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
              <Info size={11} className="text-primary" /> Consultation Request details
            </label>
            <textarea
              value={itineraryNotes}
              onChange={(event) => setItineraryNotes(event.target.value)}
              placeholder="Tell the guide about your travel group, preferred vibes (chill, active, nature, museum), and what elements you need advice mapping out..."
              className="min-h-32 w-full resize-none rounded-2xl border border-slate-150 bg-slate-50/30 px-5 py-4 text-xs font-bold text-secondary placeholder:text-secondary/20 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all shadow-inner"
            />
          </div>
        )}

        {/* Pricing specs & counters */}
        {bookingType === 'PLANNED_ROUTE' && (
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time Picker */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
                <Clock size={11} className="text-primary" /> Start Time
              </label>
              {hasPublishedSlots ? (
                <div className="grid grid-cols-2 gap-2">
                  {slotsForSelectedDate.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedTime(slot.time24)}
                      className={`h-[52px] rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        selectedTime === slot.time24
                          ? 'border-primary bg-primary/5 text-primary shadow-sm font-black'
                          : 'border-slate-100 bg-slate-50 text-secondary/50 hover:border-primary/20 hover:text-primary hover:bg-white'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                  className="w-full h-[52px] rounded-2xl border border-slate-150 bg-slate-50/30 px-5 py-3 text-xs font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all"
                />
              )}
            </div>

            {/* Hours Duration Stepper */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
                <Clock size={11} className="text-primary" /> Duration
              </label>
              <div className="flex h-[52px] items-center overflow-hidden rounded-2xl border border-slate-150 bg-slate-50/30 shadow-inner">
                <button
                  type="button"
                  onClick={() => setHours((current) => Math.max(1, current - 1))}
                  className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-slate-100 hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
                >
                  -
                </button>
                <span className="min-w-[64px] px-2 text-center text-xs font-black text-secondary">{hours} hrs</span>
                <button
                  type="button"
                  onClick={() => setHours((current) => Math.min(12, current + 1))}
                  className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-slate-100 hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guests Stepper */}
        {bookingType === 'PLANNED_ROUTE' && (
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-[0.25em] ml-1">
              <Users size={11} className="text-primary" /> Guest Group Size
            </label>
            <div className="flex h-[52px] items-center overflow-hidden rounded-2xl border border-slate-150 bg-slate-50/30 shadow-inner">
              <button
                type="button"
                onClick={() => setGuests((current) => Math.max(1, current - 1))}
                className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-slate-100 hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
              >
                -
              </button>
              <span className="min-w-[64px] px-2 text-center text-xs font-black text-secondary">{guests} {guests > 1 ? 'pax' : 'pax'}</span>
              <button
                type="button"
                onClick={() => setGuests((current) => Math.min(6, current + 1))}
                className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-slate-100 hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Pricing calculations receipt block */}
        {bookingType === 'PLANNED_ROUTE' && (
          <div className="space-y-3 rounded-[24px] border border-white bg-slate-50/50 p-6 text-xs shadow-inner">
            <div className="flex justify-between items-center font-bold text-secondary/40 uppercase tracking-widest text-[9px]">
              <span>Buddy Base Rate (${hourlyRate} × {hours} hrs)</span>
              <span className="font-black text-secondary text-sm">${total}</span>
            </div>
            <div className="flex items-end justify-between border-t border-slate-200/50 pt-3 mt-2.5">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] leading-none mb-1">Estimated Total</span>
              <span className="text-3xl font-black text-secondary leading-none italic tracking-tight">${total}</span>
            </div>
            {hasPublishedSlots && (
              <p className="text-[8px] font-bold text-secondary/35 uppercase tracking-widest leading-relaxed mt-2.5 text-center">
                * Calendar dates matches buddy's confirmed local timezone slots.
              </p>
            )}
          </div>
        )}

        {/* Submitting actions */}
        <div className="space-y-4.5 pt-2 border-t border-slate-150/40">
          <Button
            onClick={handleBooking}
            disabled={loading || (bookingType === 'PLANNED_ROUTE' && (!selectedDate || !selectedTime || (!meetingPoint.trim() && routeStops.every((stop) => !stop.trim()))))}
            className="w-full rounded-[20px] py-5 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/15 flex items-center justify-center gap-3 border-none bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white transition-all hover:shadow-primary/25 cursor-pointer active:scale-[0.98]"
          >
            {loading ? (
              <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                {bookingType === 'CONSULTATION' ? 'Chat For Advice' : 'Confirm & Proceed to Checkout'} <ArrowRight size={15} strokeWidth={2.5} />
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-center text-[8px] font-black text-secondary/30 uppercase tracking-widest">
            <Shield size={11} className="text-primary/30 shrink-0" /> Safe Escrow Hold protection active
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectBookingModal;
