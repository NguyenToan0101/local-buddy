import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckSquare, ChevronDown, Clock, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { bookingService } from '../../services/api';

type Booking = {
  id: string;
  title?: string;
  date?: string;
  time?: string;
  meetingPoint?: string;
  buddyAvatar?: string;
  totalPrice?: number | string;
  price?: number | string;
  status?: string;
};

function getStartAt(booking: Booking | null) {
  if (!booking?.date) return null;
  const time = booking.time?.length === 5 ? `${booking.time}:00` : booking.time || '00:00:00';
  const startAt = new Date(`${booking.date}T${time}+07:00`);
  return Number.isNaN(startAt.getTime()) ? null : startAt;
}

const CancelBooking: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await bookingService.getById(id);
        setBooking(data);
      } catch (err) {
        console.error('Failed to load booking for cancellation:', err);
        setError('Unable to load this booking.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const amount = Number(booking?.totalPrice ?? booking?.price ?? 0);
  const startAt = useMemo(() => getStartAt(booking), [booking]);
  const fullRefund = !startAt || Date.now() < startAt.getTime() - 24 * 60 * 60 * 1000;
  const cancellationFee = fullRefund ? 0 : amount;
  const refund = Math.max(0, amount - cancellationFee);

  const handleCancel = async () => {
    if (!id) return;
    if (!reason.trim()) {
      setError('Please select a cancellation reason.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await bookingService.cancel(id, reason);
      navigate('/traveller/booking');
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark/40 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-surface-dark/40 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 text-center space-y-5">
          <h1 className="text-2xl font-black text-secondary">Booking unavailable</h1>
          <p className="text-sm font-bold text-secondary/40">{error || 'This booking could not be found.'}</p>
          <Button onClick={() => navigate('/traveller/booking')} className="w-full py-4">Back to bookings</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-[800px] w-full bg-white rounded-[40px] shadow-2xl border border-white overflow-hidden">
        <div className="p-8 sm:p-12 space-y-10">
          <div className="flex justify-between items-start gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-black text-secondary tracking-tighter">Cancel Booking?</h1>
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Booking ID: {booking.id}</p>
            </div>
            <Link to={`/traveller/booking/${id}`} className="w-12 h-12 bg-surface rounded-full flex items-center justify-center text-secondary/20 hover:text-primary transition-all shrink-0">
              <X size={24} />
            </Link>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          <div className="bg-white rounded-[32px] p-2 sm:pr-6 border border-gray-100 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
            <div className="w-full sm:w-40 h-28 rounded-[24px] overflow-hidden shadow-lg shrink-0 bg-slate-100">
              {booking.buddyAvatar && <img src={booking.buddyAvatar} alt={booking.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{booking.status}</span>
              <h3 className="text-2xl font-extrabold text-secondary tracking-tight">{booking.title}</h3>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-bold text-secondary/40 uppercase tracking-widest">
                <div className="flex items-center gap-2"><Clock size={16} /> {booking.date} - {booking.time}</div>
                {booking.meetingPoint && (
                  <div className="flex items-center gap-2"><ArrowRight size={16} /> {booking.meetingPoint}</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#FFEAE1]/30 rounded-[32px] p-6 border border-[#FFEAE1] space-y-5">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle size={22} />
              <h4 className="text-sm font-extrabold uppercase tracking-widest">Cancellation Policy</h4>
            </div>
            <div className="flex gap-4">
              <div className={`w-6 h-6 rounded-full ${fullRefund ? 'bg-accent-green' : 'bg-secondary'} text-white flex items-center justify-center shrink-0`}>
                {fullRefund ? <CheckSquare size={14} /> : <Clock size={14} />}
              </div>
              <p className="text-sm font-bold text-secondary/70 leading-relaxed">
                {fullRefund
                  ? 'You are eligible for a full refund because this cancellation is more than 24 hours before the start time.'
                  : 'This booking is within 24 hours of the start time, so the current policy estimates no refund.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-4">Reason for cancelling?</label>
            <div className="relative group">
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full bg-surface border-none rounded-3xl py-5 px-8 font-bold text-secondary outline-none appearance-none focus:ring-4 focus:ring-primary/10 transition-all"
              >
                <option value="">Select a reason</option>
                <option>Change of plans</option>
                <option>Weather conditions</option>
                <option>Health issues</option>
                <option>Other</option>
              </select>
              <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors" size={20} />
            </div>
          </div>

          <div className="pt-8 border-t border-dashed border-gray-100 space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-secondary/40 uppercase tracking-widest">
              <span>Total Paid</span>
              <span className="text-secondary">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-secondary/40 uppercase tracking-widest">
              <span>Cancellation Fee</span>
              <span className={cancellationFee > 0 ? 'text-secondary' : 'text-accent-green'}>${cancellationFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xl font-black text-secondary tracking-tight">Estimated Refund</span>
              <span className="text-3xl font-black text-primary tracking-tight">${refund.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={submitting || booking.status === 'CANCELLED' || !reason.trim()}
              className="w-full py-5 text-lg bg-[#FFEAE1]/50 border-none text-primary font-black hover:bg-primary hover:text-white shadow-lg shadow-primary/5"
            >
              {submitting ? 'Cancelling...' : booking.status === 'CANCELLED' ? 'Already Cancelled' : 'Confirm Cancellation'}
            </Button>
            <Link to={`/traveller/booking/${id}`}>
              <Button className="w-full py-5 text-lg shadow-2xl shadow-primary/30">
                Keep My Booking
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelBooking;
