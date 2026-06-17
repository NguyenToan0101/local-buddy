import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Send,
  Share2,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
} from 'lucide-react';
import { bookingService, buddyService, reviewService } from '../../services/api';
import type { Buddy } from '../../services/api';

type Booking = {
  id?: string;
  buddyId?: string;
  buddyName?: string;
  buddyAvatar?: string;
  title?: string;
  description?: string;
  bookingType?: string;
  meetingPoint?: string;
  routeStops?: string[];
  date?: string;
  time?: string;
  hours?: number;
  guests?: number;
  totalPrice?: number | string;
  price?: number | string;
  status?: string;
  meetupStatus?: string;
  hasReview?: boolean;
  hasExperienceShare?: boolean;
};

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Could be better',
  3: 'Good',
  4: 'Great',
  5: 'Excellent',
};

function formatDate(date?: string) {
  if (!date) return 'To be confirmed';
  const parsed = new Date(`${date}T00:00:00+07:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMoney(value?: number | string) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Paid';
  return `$${amount.toFixed(2)}`;
}

function formatStatus(status?: string) {
  return (status || 'COMPLETED').replace(/_/g, ' ').toLowerCase();
}

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-black uppercase text-primary">
    {(name || 'LB').slice(0, 2)}
  </div>
);

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon size={18} strokeWidth={3} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">{label}</p>
      <p className="mt-1 text-sm font-black leading-snug text-secondary">{value}</p>
    </div>
  </div>
);

const ReviewExperience: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const bookingData = await bookingService.getById(id);
        setBooking(bookingData);

        if (bookingData.buddyId) {
          const buddyData = await buddyService.getById(bookingData.buddyId);
          setBuddy(buddyData);
        }
      } catch (err) {
        console.error('Error fetching booking details for review:', err);
        setError(err instanceof Error ? err.message : 'Unable to load this booking for review.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id]);

  const displayRating = hoverRating || rating;
  const buddyName = buddy?.name || booking?.buddyName || 'Local Buddy';
  const buddyAvatar = buddy?.image || booking?.buddyAvatar;
  const routeStops = Array.isArray(booking?.routeStops) ? booking.routeStops.filter(Boolean) : [];
  const title = booking?.title || booking?.bookingType || 'Local experience';
  const canSubmit = rating > 0 && !submitting && !booking?.hasReview;

  const reviewHint = useMemo(() => {
    if (!rating) return 'Select a rating to continue';
    return ratingLabels[rating] || 'Rated';
  }, [rating]);

  const handleSubmit = async () => {
    if (!id || !canSubmit) {
      if (!rating) setSubmitError('Please select a star rating before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      await reviewService.createForBooking(id, {
        rating,
        comment: feedback.trim(),
        isPublic,
      });
      setSubmitted(true);
      setBooking((current) => (current ? { ...current, hasReview: true } : current));
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={38} />
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Loading review form</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-secondary">Review unavailable</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-secondary/50">{error || 'We could not find this booking.'}</p>
          <button
            onClick={() => navigate('/traveller/booking')}
            className="mt-6 w-full rounded-xl bg-secondary py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary"
          >
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  if (submitted || booking.hasReview) {
    const justSubmitted = submitted;
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} strokeWidth={3} />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary">
              {justSubmitted ? 'Review submitted' : 'Already reviewed'}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary sm:text-4xl">
              {justSubmitted ? `Thanks for reviewing ${buddyName}` : `You already reviewed ${buddyName}`}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-secondary/50">
              Your review is saved to this completed booking and helps future travelers understand the experience.
            </p>

            <div className="mt-8 rounded-2xl border border-primary/15 bg-primary/5 p-5 text-left sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-primary-glow">
                    <Share2 size={22} strokeWidth={3} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary">Share your experience</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-secondary">
                      {booking.hasExperienceShare
                        ? 'Trip story already shared'
                        : justSubmitted
                          ? 'Want to post a trip story?'
                          : 'You can still post your trip story'}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-secondary/55">
                      {booking.hasExperienceShare
                        ? 'This completed booking already has a public experience story.'
                        : 'Add photos and a short story from this trip so other travelers can discover what the experience felt like.'}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => navigate(`/traveller/experience/share/${booking.id}`)}
                    disabled={booking.hasExperienceShare}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-secondary/40"
                  >
                    <Share2 size={16} strokeWidth={3} /> {booking.hasExperienceShare ? 'Already shared' : 'Share experience'}
                  </button>
                  <button
                    onClick={() => navigate('/traveller/booking')}
                    className="rounded-xl border border-slate-200 bg-white py-3 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-primary/30 hover:text-primary"
                  >
                    Maybe later
                  </button>
                </div>
              </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate('/traveller/booking')}
                className="rounded-xl bg-secondary py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary"
              >
                Back to bookings
              </button>
              <button
                onClick={() => navigate(`/traveller/booking/${booking.id}`)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-primary/30 hover:text-primary"
              >
                View booking
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-secondary">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-secondary/55 transition hover:text-primary"
            aria-label="Back"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Trip review</p>
            <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">{title}</h1>
          </div>
          <div className="hidden rounded-xl bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 sm:block">
            {formatStatus(booking.status)}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {buddyAvatar ? (
                  <img src={buddyAvatar} alt={buddyName} className="h-full w-full object-cover" />
                ) : (
                  <InitialAvatar name={buddyName} />
                )}
                <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Review your local buddy</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary sm:text-4xl">{buddyName}</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-secondary/50">
                  Rate the completed trip honestly. The review is tied to this booking and updates the buddy profile rating after submission.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-secondary/45">
                    <ShieldCheck size={13} strokeWidth={3} className="text-emerald-500" />
                    Verified booking
                  </span>
                  {buddy?.rating != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
                      <Star size={13} className="fill-amber-500 text-amber-500" />
                      {buddy.rating} avg rating
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Your rating</p>
                  <p className="mt-1 text-xl font-black text-secondary">{reviewHint}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2 text-sm font-black text-primary shadow-sm">
                  {rating || 0}/5
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 sm:gap-3" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onFocus={() => setHoverRating(star)}
                    onClick={() => setRating(star)}
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition sm:h-16 sm:w-16 ${
                      star <= displayRating
                        ? 'border-primary bg-primary text-white shadow-primary-glow'
                        : 'border-slate-200 bg-white text-slate-200 hover:border-primary/40 hover:text-primary'
                    }`}
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star size={28} className={star <= displayRating ? 'fill-white' : ''} strokeWidth={3} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Public review comment</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share what went well, how the buddy helped, and any detail future travelers should know."
                className="mt-3 min-h-[180px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-secondary outline-none transition placeholder:text-secondary/30 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                maxLength={1200}
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-secondary/30">
                <span>{feedback.length}/1200</span>
                <span>Saved as review.comment</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPublic((value) => !value)}
              className="mt-6 flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                  {isPublic ? <Eye size={18} strokeWidth={3} /> : <EyeOff size={18} strokeWidth={3} />}
                </div>
                <div>
                  <p className="text-sm font-black text-secondary">{isPublic ? 'Public review' : 'Private review'}</p>
                  <p className="mt-1 text-xs font-semibold text-secondary/45">
                    {isPublic ? 'Visible on buddy profile where reviews are shown.' : 'Stored on the booking but hidden from public profile.'}
                  </p>
                </div>
              </div>
              <div className={`h-6 w-11 rounded-full p-1 transition ${isPublic ? 'bg-primary' : 'bg-slate-300'}`}>
                <div className={`h-4 w-4 rounded-full bg-white transition ${isPublic ? 'translate-x-5' : ''}`} />
              </div>
            </button>

            {submitError && (
              <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
                {submitError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 text-xs font-black uppercase tracking-widest text-white shadow-primary-glow transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} strokeWidth={3} />}
                {submitting ? 'Submitting' : 'Submit review'}
              </button>
              <button
                onClick={() => navigate('/traveller/booking')}
                className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-primary/30 hover:text-primary"
              >
                Skip for now
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Booking summary</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-secondary">{title}</h3>
            {booking.description && (
              <p className="mt-3 text-sm font-semibold leading-6 text-secondary/50">{booking.description}</p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailRow icon={Calendar} label="Date" value={formatDate(booking.date)} />
              <DetailRow icon={Clock} label="Time" value={`${booking.time || '--:--'} (${booking.hours || 1}h)`} />
              <DetailRow icon={UserRound} label="Guests" value={booking.guests || 1} />
              <DetailRow icon={Wallet} label="Paid" value={formatMoney(booking.totalPrice || booking.price)} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Trip route</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-secondary">What this review covers</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin size={19} strokeWidth={3} />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[8px] font-black uppercase tracking-widest text-secondary/30">Meeting point</p>
                <p className="mt-1 text-sm font-black leading-snug text-secondary">{booking.meetingPoint || 'Not specified'}</p>
              </div>
              {routeStops.length > 0 ? (
                <div className="space-y-2">
                  {routeStops.map((stop, index) => (
                    <div key={`${stop}-${index}`} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-black text-primary">
                        {index + 1}
                      </span>
                      <p className="text-sm font-black leading-snug text-secondary">{stop}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-secondary/45">
                  No route stops were added to this booking.
                </p>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default ReviewExperience;
