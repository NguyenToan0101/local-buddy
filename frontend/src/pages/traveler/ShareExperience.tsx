import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Star,
  Tag,
  UserRound,
  X,
  PlayCircle,
} from 'lucide-react';
import { bookingService, buddyService, experienceService } from '../../services/api';
import type { Buddy } from '../../services/api';

type ShareBooking = {
  id: string;
  traveler?: string;
  travelerAvatar?: string;
  buddyId?: string;
  buddyName?: string;
  buddyAvatar?: string;
  title?: string;
  description?: string;
  meetingPoint?: string;
  routeStops?: string[];
  date?: string;
  time?: string;
  hours?: number;
  guests?: number;
  status?: string;
  meetupStatus?: string;
  totalPrice?: number | string;
  hasExperienceShare?: boolean;
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

function splitTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

const SUGGESTED_TAGS = [
  'Food',
  'Culture',
  'History',
  'Nature',
  'Photography',
  'Nightlife',
  'Hidden gems',
  'Local market',
  'Street food',
  'Coffee',
  'Walking tour',
  'Family friendly',
  'Adventure',
  'Relaxing',
  'Shopping',
  'Sunset',
];

function uniqueTags(values: string[]) {
  const seen = new Set<string>();
  return values.filter((tag) => {
    const key = tag.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-lg font-black uppercase text-primary">
    {(name || 'LB').slice(0, 2)}
  </div>
);

const SummaryTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <Icon size={17} strokeWidth={3} className="text-primary" />
    <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-secondary/35">{label}</p>
    <p className="mt-1 text-sm font-black leading-snug text-secondary">{value || '-'}</p>
  </div>
);

const ShareExperience: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [rating, setRating] = useState(5);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedExperienceId, setPublishedExperienceId] = useState('');
  const [booking, setBooking] = useState<ShareBooking | null>(null);
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;
      try {
        setLoading(true);
        setError('');
        const bookingData = await bookingService.getById(bookingId);
        setBooking(bookingData);
        setTitle(bookingData.title ? `${bookingData.title} with ${bookingData.buddyName || 'my local buddy'}` : '');
        setTags(
          [bookingData.meetingPoint, ...(Array.isArray(bookingData.routeStops) ? bookingData.routeStops : [])]
            .filter(Boolean)
            .slice(0, 4)
            .join(', ')
        );

        if (bookingData.buddyId) {
          const buddyData = await buddyService.getById(bookingData.buddyId);
          setBuddy(buddyData);
        }
      } catch (err) {
        console.error('Error fetching data for sharing experience:', err);
        setError(err instanceof Error ? err.message : 'Unable to load this booking.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagePreviews([]);
      return;
    }
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const buddyName = buddy?.name || booking?.buddyName || 'Local Buddy';
  const buddyAvatar = buddy?.image || booking?.buddyAvatar;
  const parsedTags = useMemo(() => splitTags(tags), [tags]);
  const routeStops = Array.isArray(booking?.routeStops) ? booking.routeStops.filter(Boolean) : [];
  const canPublish = Boolean(booking?.buddyId && title.trim() && content.trim() && !submitting);

  const setSelectedTags = (nextTags: string[]) => {
    setTags(uniqueTags(nextTags).slice(0, 8).join(', '));
  };

  const toggleTag = (tag: string) => {
    const isSelected = parsedTags.some((item) => item.toLowerCase() === tag.toLowerCase());
    setSelectedTags(isSelected ? parsedTags.filter((item) => item.toLowerCase() !== tag.toLowerCase()) : [...parsedTags, tag]);
  };

  const addCustomTag = (value: string) => {
    setSelectedTags([...parsedTags, ...splitTags(value)]);
  };

  const addImageFiles = (files: FileList | null) => {
    if (!files) return;
    const nextFiles = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'));
    setImageFiles((current) => [...current, ...nextFiles].slice(0, 8));
  };

  const removeImageFile = (index: number) => {
    setImageFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = async () => {
    if (!booking) {
      setError('A real completed booking is required before sharing a story.');
      return;
    }
    if (!booking.buddyId) {
      setError('This booking is missing buddy details.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError('Please add a headline and story content.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const created = await experienceService.create({
        title: title.trim(),
        travelerName: booking.traveler || '',
        travelerAvatar: booking.travelerAvatar,
        image: '',
        location: booking.meetingPoint || routeStops[0] || '',
        date: new Date().toISOString().split('T')[0],
        tags: parsedTags,
        storyContent: content.trim(),
        buddyId: booking.buddyId,
        buddyName,
        bookingId: booking.id,
        rating,
        pinned: false,
      });

      const uploadedExperiences = await Promise.all(
        imageFiles.map((file, index) => experienceService.uploadImage(created.id, file, index))
      );
      const finalExperience = uploadedExperiences[uploadedExperiences.length - 1] || created;
      setPublishedExperienceId(finalExperience.id);
      setPublished(true);
    } catch (err) {
      console.error('Error sharing experience:', err);
      setError(err instanceof Error ? err.message : 'Unable to publish your story.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={38} />
          <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Loading story editor</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-secondary">Story unavailable</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-secondary/50">{error || 'This booking could not be loaded.'}</p>
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

  if (booking.hasExperienceShare && !published) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} strokeWidth={3} />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary">Already shared</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary sm:text-4xl">This booking already has a story</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-secondary/50">
              Each completed booking can publish one experience story to keep the feed clean and avoid duplicate posts.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate('/traveller/experiences')}
                className="rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-dark"
              >
                View experiences
              </button>
              <button
                onClick={() => navigate(`/traveller/booking/${booking.id}`)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-primary/30 hover:text-primary"
              >
                Back to booking
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} strokeWidth={3} />
            </div>
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary">Story published</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary sm:text-4xl">Your trip story is live</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-secondary/50">
              The story was saved to the experiences feed with the booking buddy, location, rating and tags.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate('/traveller/experiences')}
                className="rounded-xl bg-primary py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary-dark"
              >
                View experiences
              </button>
              <button
                onClick={() => navigate(publishedExperienceId ? `/traveller/experience/${publishedExperienceId}` : '/traveller/booking')}
                className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black uppercase tracking-widest text-secondary transition hover:border-primary/30 hover:text-primary"
              >
                Open story
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
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Share experience</p>
            <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">{booking.title || 'Create trip story'}</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canPublish}
            className="hidden items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-primary-glow transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={15} strokeWidth={3} />}
            Publish
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Story details</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary sm:text-4xl">Tell travelers what happened</h2>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-secondary/50">
                  This creates a public experience using the `experiences` table and an optional image in `experience_images`.
                </p>
              </div>
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-primary-glow sm:flex">
                <Sparkles size={22} strokeWidth={3} />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Headline</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="A memorable afternoon in Hanoi"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-lg font-black text-secondary outline-none transition placeholder:text-secondary/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  maxLength={160}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Story content</label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write about the places you visited, what the buddy helped with, and the moments future travelers should know."
                  className="mt-3 min-h-[280px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold leading-6 text-secondary outline-none transition placeholder:text-secondary/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  maxLength={3000}
                />
                <div className="mt-2 flex justify-between text-[10px] font-black uppercase tracking-widest text-secondary/30">
                  <span>{content.length}/3000</span>
                  <span>Saved as story_content</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Tags</label>
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTED_TAGS.map((tag) => {
                        const selected = parsedTags.some((item) => item.toLowerCase() === tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                              selected
                                ? 'bg-primary text-white shadow-primary-glow'
                                : 'bg-slate-50 text-secondary/45 hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            <Tag size={12} strokeWidth={3} />
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative mt-4">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} strokeWidth={3} />
                      <input
                        type="text"
                        placeholder="Add custom tags, press Enter"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-xs font-black text-secondary outline-none transition placeholder:text-secondary/25 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ',') {
                            event.preventDefault();
                            addCustomTag(event.currentTarget.value);
                            event.currentTarget.value = '';
                          }
                        }}
                        onBlur={(event) => {
                          addCustomTag(event.currentTarget.value);
                          event.currentTarget.value = '';
                        }}
                      />
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-secondary/35">Choose up to 8 tags for search and filtering.</p>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Rating</label>
                  <div className="mt-3 flex h-[54px] items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} aria-label={`Rate ${star}`}>
                        <Star size={20} className={star <= rating ? 'fill-primary text-primary' : 'text-slate-200'} strokeWidth={3} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {parsedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {parsedTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-secondary/35">Story photos</label>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {imagePreviews.length > 0 ? (
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        {imagePreviews.map((preview, index) => {
                          const isVideo = imageFiles[index]?.type.startsWith('video/');
                          return (
                          <div key={preview} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                            {isVideo ? (
                              <>
                                <video src={`${preview}#t=0.1`} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <PlayCircle size={24} className="text-white/70 drop-shadow-md" />
                                </div>
                              </>
                            ) : (
                              <img src={preview} alt={`Story preview ${index + 1}`} className="h-full w-full object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => removeImageFile(index)}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-secondary shadow-sm transition hover:text-rose-600"
                              aria-label="Remove photo"
                            >
                              <X size={16} strokeWidth={3} />
                            </button>
                          </div>
                          );
                        })}
                        {imagePreviews.length < 8 && (
                          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-white text-center transition hover:bg-primary/5">
                            <ImagePlus size={24} strokeWidth={3} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Add more</span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              multiple
                              className="hidden"
                              onChange={(event) => {
                                addImageFiles(event.target.files);
                                event.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>
                      <p className="mt-3 text-[10px] font-bold text-secondary/35">{imagePreviews.length}/8 photos selected.</p>
                    </div>
                  ) : (
                    <label className="flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-3 p-8 text-center transition hover:bg-primary/5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                        <ImagePlus size={25} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-secondary">Upload real trip media</p>
                        <p className="mt-1 text-xs font-semibold text-secondary/45">Select up to 8 images or videos. Each media is stored in experience_images.</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          addImageFiles(event.target.files);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canPublish}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-xs font-black uppercase tracking-widest text-white shadow-primary-glow transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} strokeWidth={3} />}
                {submitting ? 'Publishing' : 'Publish story'}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Booking source</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-secondary">{booking.title || 'Completed booking'}</h3>
            {booking.description && <p className="mt-3 text-sm font-semibold leading-6 text-secondary/50">{booking.description}</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <SummaryTile icon={Calendar} label="Trip date" value={formatDate(booking.date)} />
              <SummaryTile icon={MapPin} label="Location" value={booking.meetingPoint || routeStops[0] || 'Not specified'} />
              <SummaryTile icon={UserRound} label="Guests" value={booking.guests || 1} />
              <SummaryTile icon={Camera} label="Stops" value={`${routeStops.length} planned`} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {buddyAvatar ? (
                  <img src={buddyAvatar} alt={buddyName} className="h-full w-full object-cover" />
                ) : (
                  <InitialAvatar name={buddyName} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">Featured buddy</p>
                <h3 className="truncate text-xl font-black tracking-tight text-secondary">{buddyName}</h3>
                {buddy?.rating != null && (
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-secondary/40">
                    <Star size={13} className="fill-primary text-primary" /> {buddy.rating} avg rating
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">Preview</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="aspect-[16/9] bg-slate-100">
                {imagePreviews[0] ? (
                  imageFiles[0]?.type.startsWith('video/') ? (
                    <>
                      <video src={`${imagePreviews[0]}#t=0.1`} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <PlayCircle size={48} className="text-white/70 drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <img src={imagePreviews[0]} alt="Experience preview" className="h-full w-full object-cover" />
                  )
                ) : buddyAvatar ? (
                  <img src={buddyAvatar} alt="Experience preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-secondary/25">
                    <ImagePlus size={38} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="line-clamp-2 text-lg font-black leading-tight text-secondary">{title || 'Your story headline'}</h4>
                <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-secondary/50">
                  {content || 'Your story preview will appear here as you write.'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default ShareExperience;
