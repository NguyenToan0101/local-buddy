import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, Users, ArrowRight, Shield } from 'lucide-react';
import { bookingService } from '../../services/api';
import type { Buddy } from '../../services/api';
import Button from '../ui/Button';

interface DirectBookingModalProps {
  buddy: Buddy;
  isOpen: boolean;
  onClose: () => void;
  availableSlots?: any[];
}

const DirectBookingModal: React.FC<DirectBookingModalProps> = ({
  buddy,
  isOpen,
  onClose,
  availableSlots = []
}) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [hours, setHours] = useState<number>(3);
  const [guests, setGuests] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group slots by date
  const uniqueDates = Array.from(new Set(availableSlots.map(s => s.date)));

  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      // Default to first available slot date if format allows
      const parsed = new Date(uniqueDates[0]);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed.toISOString().split('T')[0]);
      } else {
        setSelectedDate(uniqueDates[0]);
      }
    } else if (!selectedDate) {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  }, [uniqueDates, selectedDate]);

  if (!isOpen) return null;

  const hourlyRate = buddy.price || 10;
  const activityFee = hourlyRate * hours;
  const serviceFee = Math.round(activityFee * 0.1);
  const total = activityFee + serviceFee;

  const handleBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      // Format time to HH:mm pattern required by backend
      let formattedTime = selectedTime;
      if (formattedTime.includes(' ')) {
        // Parse "10:00 AM" kind of formats if needed
        const [timePart, ampm] = formattedTime.split(' ');
        let [hStr, mStr] = timePart.split(':');
        let h = parseInt(hStr);
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        formattedTime = `${String(h).padStart(2, '0')}:${mStr.padStart(2, '0')}`;
      }
      if (!formattedTime.includes(':')) {
        formattedTime = "09:00";
      }

      // Format date to ISO format YYYY-MM-DD
      let formattedDate = selectedDate;
      const dateObj = new Date(selectedDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0];
      }

      const bookingPayload = {
        buddyId: buddy.id,
        title: `Explore with ${buddy.name}`,
        activity: `City tour and custom local experiences`,
        description: `Direct reservation booking for city local guiding.`,
        location: buddy.location || 'Hanoi, Vietnam',
        date: formattedDate,
        time: formattedTime,
        hours: hours,
        duration: `${hours} hours`,
        guests: guests,
        price: activityFee
      };

      const booking = await bookingService.create(bookingPayload);
      navigate('/traveller/checkout', { state: { bookingId: booking.id } });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Drawer */}
      <div className="relative bg-white rounded-t-[40px] w-full max-w-lg p-8 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto pb-safe">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2 cursor-pointer" onClick={onClose}></div>

        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-black text-secondary tracking-tight">Direct Booking</h3>
            <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest mt-1">Book directly with {buddy.name}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-secondary/40 hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-xs font-bold leading-relaxed">
            {error}
          </div>
        )}

        {/* Date selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> Select Date
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {uniqueDates.length > 0 ? (
              uniqueDates.map((d: any) => {
                const parsed = new Date(d);
                const isSelected = selectedDate === d;
                const displayDay = !isNaN(parsed.getTime()) ? parsed.getDate() : d;
                const displayMonth = !isNaN(parsed.getTime()) ? parsed.toLocaleString('en-US', { month: 'short' }) : '';
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl border-2 transition-all shrink-0 ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm font-bold scale-105'
                        : 'border-gray-100 bg-white text-secondary/50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider">{displayMonth}</span>
                    <span className="text-lg font-black">{displayDay}</span>
                  </button>
                );
              })
            ) : (
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4.5 px-6 font-bold text-secondary outline-none focus:bg-white focus:border-primary/20"
              />
            )}
          </div>
        </div>

        {/* Time and Duration Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-primary" /> Start Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4.5 px-5 font-bold text-secondary outline-none focus:bg-white focus:border-primary/20"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-primary" /> Hours
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden h-[54px]">
              <button
                type="button"
                onClick={() => setHours(h => Math.max(1, h - 1))}
                className="flex-1 h-full text-lg font-black text-secondary/40 hover:text-primary hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-3 text-sm font-black text-secondary">{hours} hrs</span>
              <button
                type="button"
                onClick={() => setHours(h => Math.min(12, h + 1))}
                className="flex-1 h-full text-lg font-black text-secondary/40 hover:text-primary hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Guests and Pricing details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users size={14} className="text-primary" /> Guests
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden h-[54px]">
              <button
                type="button"
                onClick={() => setGuests(g => Math.max(1, g - 1))}
                className="flex-1 h-full text-lg font-black text-secondary/40 hover:text-primary hover:bg-gray-100"
              >
                -
              </button>
              <span className="px-3 text-sm font-black text-secondary">{guests} pax</span>
              <button
                type="button"
                onClick={() => setGuests(g => Math.min(6, g + 1))}
                className="flex-1 h-full text-lg font-black text-secondary/40 hover:text-primary hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em]">Hourly Rate</label>
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl h-[54px] px-5 font-black text-secondary">
              ${hourlyRate} / hour
            </div>
          </div>
        </div>

        {/* Cost summary card */}
        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100/50 space-y-3 text-sm">
          <div className="flex justify-between text-secondary/50 font-bold">
            <span>Activity Fee (${hourlyRate} × {hours} hrs)</span>
            <span className="font-black text-secondary">${activityFee}</span>
          </div>
          <div className="flex justify-between text-secondary/50 font-bold">
            <span>Local Buddy Service Fee (10%)</span>
            <span className="font-black text-secondary">${serviceFee}</span>
          </div>
          <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
            <span className="text-xs font-black text-primary uppercase tracking-widest">Est. Total</span>
            <span className="text-2xl font-black text-secondary">${total}</span>
          </div>
        </div>

        {/* Submit action */}
        <Button
          onClick={handleBooking}
          disabled={loading}
          className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-primary-glow flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Confirm & Pay <ArrowRight size={16} />
            </>
          )}
        </Button>

        <div className="flex justify-center items-center gap-2 text-[9px] font-black text-secondary/35 uppercase tracking-widest text-center">
          <Shield size={12} className="text-primary/40" /> SECURE RESERVATION BY LOCAL BUDDY
        </div>
      </div>
    </div>
  );
};

export default DirectBookingModal;
