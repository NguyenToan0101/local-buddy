import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, MapPin, Plus, Shield, Trash2, Users, X } from 'lucide-react';
import { bookingService } from '../../services/api';
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
    if (bookingType === 'PLANNED_ROUTE' && !meetingPoint.trim() && cleanedRouteStops.length === 0) {
      setError('Please enter a meeting point or at least one route stop.');
      return;
    }

    setLoading(true);
    try {
      const baseLocation = meetingPoint.trim() || cleanedRouteStops[0] || buddy.location || 'To be confirmed';
      const bookingPayload = {
        buddyId: buddy.id,
        title: bookingType === 'CONSULTATION' ? `Trip planning with ${buddy.name}` : `Local experience with ${buddy.name}`,
        activity: bookingType === 'CONSULTATION' ? 'Buddy consultation request' : 'Custom local experience',
        description: itineraryNotes.trim() || (
          bookingType === 'CONSULTATION'
            ? `Traveler wants ${buddy.name} to suggest and prepare an itinerary before payment.`
            : `Direct booking for ${hours} hour${hours > 1 ? 's' : ''} with ${guests} guest${guests > 1 ? 's' : ''}.`
        ),
        bookingType,
        location: baseLocation,
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
      if (bookingType === 'CONSULTATION') {
        navigate(`/traveller/booking/${booking.id}`);
      } else {
        navigate('/traveller/checkout', { state: { bookingId: booking.id } });
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to initialize booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center animate-fade-in">
      <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[40px] bg-white p-8 pb-safe shadow-2xl space-y-6">
        <button
          type="button"
          className="mx-auto block h-1.5 w-12 rounded-full bg-gray-200"
          onClick={onClose}
          aria-label="Close booking form"
        />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-2xl font-black text-secondary tracking-tight">Direct Booking</h3>
            <p className="mt-1 text-xs font-bold text-secondary/40 uppercase tracking-widest">
              Book directly with {buddy.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-secondary/40 transition-colors hover:text-primary"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold leading-relaxed text-rose-500">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
            <MapPin size={14} className="text-primary" /> Booking Flow
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setBookingType('PLANNED_ROUTE')}
              className={`rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                bookingType === 'PLANNED_ROUTE' ? 'bg-white text-primary shadow-sm' : 'text-secondary/40 hover:text-secondary'
              }`}
            >
              I have a route
            </button>
            <button
              type="button"
              onClick={() => setBookingType('CONSULTATION')}
              className={`rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                bookingType === 'CONSULTATION' ? 'bg-white text-primary shadow-sm' : 'text-secondary/40 hover:text-secondary'
              }`}
            >
              Need advice
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
            <Calendar size={14} className="text-primary" /> Select Date
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {hasPublishedSlots ? (
              uniqueDates.map((dateIso) => {
                const display = formatSlotDate(dateIso);
                const isSelected = selectedDate === dateIso;

                return (
                  <button
                    key={dateIso}
                    type="button"
                    onClick={() => handleDateSelect(dateIso)}
                    className={`flex h-20 min-w-[74px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'scale-105 border-primary bg-primary/5 font-bold text-primary shadow-sm'
                        : 'border-gray-100 bg-white text-secondary/50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-wider">{display.weekday}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{display.month}</span>
                    <span className="text-lg font-black">{display.day}</span>
                  </button>
                );
              })
            ) : (
              <input
                type="date"
                value={selectedDate}
                min={todayIso()}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4.5 font-bold text-secondary outline-none focus:border-primary/20 focus:bg-white"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
            <MapPin size={14} className="text-primary" /> Meeting Point
          </label>
          <input
            type="text"
            value={meetingPoint}
            onChange={(event) => setMeetingPoint(event.target.value)}
            placeholder="Cafe XYZ, hotel lobby, station gate..."
            className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm font-bold text-secondary outline-none focus:border-primary/20 focus:bg-white"
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
                Route Stops
              </label>
              <button
                type="button"
                onClick={addRouteStop}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-sm"
                aria-label="Add route stop"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {routeStops.map((stop, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[10px] font-black text-primary">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={stop}
                    onChange={(event) => updateRouteStop(index, event.target.value)}
                    placeholder={index === 0 ? 'Cho ABC, beach 123...' : 'Next place'}
                    className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-bold text-secondary outline-none focus:border-primary/20 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeRouteStop(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white"
                    aria-label="Remove route stop"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <textarea
            value={itineraryNotes}
            onChange={(event) => setItineraryNotes(event.target.value)}
            placeholder={bookingType === 'CONSULTATION' ? 'Tell the buddy your travel style, budget, food preferences...' : 'Extra notes for this route'}
            className="min-h-24 w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-sm font-bold text-secondary outline-none focus:border-primary/20 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
              <Clock size={14} className="text-primary" /> Start Time
            </label>
            {hasPublishedSlots ? (
              <div className="grid grid-cols-2 gap-2">
                {slotsForSelectedDate.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedTime(slot.time24)}
                    className={`h-[54px] rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                      selectedTime === slot.time24
                        ? 'border-primary bg-primary text-white shadow-primary-glow'
                        : 'border-gray-100 bg-gray-50 text-secondary/50 hover:border-primary/20 hover:text-primary'
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
                className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4.5 font-bold text-secondary outline-none focus:border-primary/20 focus:bg-white"
              />
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
              <Clock size={14} className="text-primary" /> Hours
            </label>
            <div className="flex h-[54px] items-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setHours((current) => Math.max(1, current - 1))}
                className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-gray-100 hover:text-primary"
              >
                -
              </button>
              <span className="min-w-[64px] px-3 text-center text-sm font-black text-secondary">{hours} hrs</span>
              <button
                type="button"
                onClick={() => setHours((current) => Math.min(12, current + 1))}
                className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-gray-100 hover:text-primary"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
              <Users size={14} className="text-primary" /> Guests
            </label>
            <div className="flex h-[54px] items-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setGuests((current) => Math.max(1, current - 1))}
                className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-gray-100 hover:text-primary"
              >
                -
              </button>
              <span className="min-w-[64px] px-3 text-center text-sm font-black text-secondary">{guests} pax</span>
              <button
                type="button"
                onClick={() => setGuests((current) => Math.min(6, current + 1))}
                className="h-full flex-1 text-lg font-black text-secondary/40 hover:bg-gray-100 hover:text-primary"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">
              <MapPin size={14} className="text-primary" /> Meeting Area
            </label>
            <div className="flex min-h-[54px] items-center rounded-2xl border border-gray-100 bg-gray-50 px-5 text-xs font-black leading-snug text-secondary">
              {buddy.location || 'To be confirmed'}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-gray-100/50 bg-gray-50 p-6 text-sm">
          <div className="flex justify-between gap-4 font-bold text-secondary/50">
            <span>Buddy rate (${hourlyRate} x {hours} hrs)</span>
            <span className="font-black text-secondary">${total}</span>
          </div>
          <div className="flex items-end justify-between border-t border-gray-200 pt-3">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Total due</span>
            <span className="text-2xl font-black text-secondary">${total}</span>
          </div>
          {hasPublishedSlots && (
            <p className="text-[9px] font-bold text-secondary/35 uppercase tracking-widest leading-relaxed">
              Times shown are from this buddy's published availability.
            </p>
          )}
        </div>

        <Button
          onClick={handleBooking}
          disabled={loading}
          className="w-full rounded-2xl py-5 font-black text-xs uppercase tracking-[0.2em] shadow-primary-glow flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          ) : (
            <>
              {bookingType === 'CONSULTATION' ? 'Request Advice' : 'Confirm & Pay'} <ArrowRight size={16} />
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-center text-[9px] font-black text-secondary/35 uppercase tracking-widest">
          <Shield size={12} className="text-primary/40" /> Secure reservation by Local Buddy
        </div>
      </div>
    </div>
  );
};

export default DirectBookingModal;
