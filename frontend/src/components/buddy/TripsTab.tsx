import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Map,
  MapPin,
  Play,
  QrCode,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Button from '../ui/Button';

type TripSummary = {
  id: string;
  status: string;
  meetupStatus?: string;
  activity?: string;
  title?: string;
  price?: React.ReactNode;
  date?: string;
  time?: string;
  hours?: number;
  meetingPoint?: string;
  traveler?: string;
  travelerAvatar?: string;
  guests?: number;
};

interface TripsTabProps {
  upcomingTrips: TripSummary[];
}

const QR_READER_ID = 'buddy-trip-qr-reader';
const CANCEL_REASONS = [
  'Schedule conflict',
  'Traveler details are incomplete',
  'Unable to provide this itinerary',
  'Safety or policy concern',
];

const tabs = [
  { key: 'pending', label: 'Pending', icon: AlertCircle },
  { key: 'upcoming', label: 'Upcoming', icon: Calendar },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'cancelled', label: 'Cancelled', icon: X },
] as const;

type TripTab = typeof tabs[number]['key'];

const statusClasses = (status?: string) => {
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'COMPLETED') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const SummaryTile = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xl font-black leading-none text-secondary">{value}</p>
        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-secondary/45">{label}</p>
      </div>
    </div>
  </div>
);

const InitialAvatar = ({ name }: { name?: string }) => (
  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black uppercase text-primary">
    {(name || 'TR').slice(0, 2)}
  </div>
);

const TripsTab: React.FC<TripsTabProps> = ({ upcomingTrips }) => {
  const [activeTab, setActiveTab] = useState<TripTab>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [scannerTripId, setScannerTripId] = useState<string | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [actionError, setActionError] = useState('');
  const [scannerStatus, setScannerStatus] = useState('Point the camera at the traveler QR');
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [cancelTripId, setCancelTripId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [tripOverrides, setTripOverrides] = useState<Record<string, Partial<TripSummary>>>({});
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const detectedPayloadRef = useRef('');
  const startWithQrPayloadRef = useRef<(payload: string) => Promise<void>>(async () => {});
  const itemsPerPage = 6;

  const closeScanner = useCallback(() => {
    setScannerTripId(null);
    setQrInput('');
    setScannerStatus('Point the camera at the traveler QR');
    detectedPayloadRef.current = '';
  }, []);

  const handleMeetupPoint = async (tripId: string) => {
    try {
      setActionError('');
      const updated = await bookingService.markBuddyArrived(tripId);
      setTripOverrides((current) => ({ ...current, [tripId]: updated }));
      if (updated.meetupStatus === 'BOTH_ARRIVED') setScannerTripId(tripId);
    } catch (error) {
      console.error('Error updating meetup status:', error);
      setActionError(error instanceof Error ? error.message : 'Unable to mark arrival.');
    }
  };

  const handleStartWithQrPayload = useCallback(
    async (payload: string) => {
      if (!scannerTripId || !payload.trim() || isStartingTrip) return;
      try {
        setActionError('');
        setIsStartingTrip(true);
        setScannerStatus('QR detected. Starting trip...');
        const updated = await bookingService.startWithQr(scannerTripId, payload.trim());
        setTripOverrides((current) => ({ ...current, [scannerTripId]: updated }));
        closeScanner();
        window.location.href = `/buddy/live/${scannerTripId}`;
      } catch (error) {
        console.error('Error starting trip:', error);
        setActionError(error instanceof Error ? error.message : 'Unable to start trip.');
        setScannerStatus('QR invalid or expired. Ask the traveler to refresh it.');
        detectedPayloadRef.current = '';
      } finally {
        setIsStartingTrip(false);
      }
    },
    [closeScanner, isStartingTrip, scannerTripId]
  );

  useEffect(() => {
    startWithQrPayloadRef.current = handleStartWithQrPayload;
  }, [handleStartWithQrPayload]);

  const handleComplete = async (tripId: string) => {
    try {
      setActionError('');
      const updated = await bookingService.complete(tripId);
      setTripOverrides((current) => ({ ...current, [tripId]: updated }));
    } catch (error) {
      console.error('Error completing trip:', error);
      setActionError(error instanceof Error ? error.message : 'Unable to complete trip.');
    }
  };

  const openCancelModal = (tripId: string) => {
    setCancelTripId(tripId);
    setCancelReason('');
    setActionError('');
  };

  const closeCancelModal = () => {
    if (isCancelling) return;
    setCancelTripId(null);
    setCancelReason('');
  };

  const handleCancelPending = async () => {
    if (!cancelTripId || !cancelReason.trim()) {
      setActionError('Please select or enter a cancellation reason.');
      return;
    }
    try {
      setIsCancelling(true);
      setActionError('');
      const updated = await bookingService.cancel(cancelTripId, cancelReason.trim());
      setTripOverrides((current) => ({ ...current, [cancelTripId]: updated }));
      setCancelTripId(null);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling pending booking:', error);
      setActionError(error instanceof Error ? error.message : 'Unable to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const mergedTrips = useMemo(
    () => upcomingTrips.map((trip) => ({ ...trip, ...(tripOverrides[trip.id] || {}) })),
    [tripOverrides, upcomingTrips]
  );

  const counts = useMemo(
    () => ({
      pending: mergedTrips.filter((trip) => trip.status === 'PENDING').length,
      upcoming: mergedTrips.filter((trip) => ['CONFIRMED', 'UPCOMING'].includes(trip.status)).length,
      completed: mergedTrips.filter((trip) => trip.status === 'COMPLETED').length,
      cancelled: mergedTrips.filter((trip) => trip.status === 'CANCELLED').length,
    }),
    [mergedTrips]
  );

  const filteredTrips = mergedTrips.filter((trip) => {
    if (activeTab === 'pending') return trip.status === 'PENDING';
    if (activeTab === 'upcoming') return trip.status === 'CONFIRMED' || trip.status === 'UPCOMING';
    return trip.status === activeTab.toUpperCase();
  });

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / itemsPerPage));
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const upcomingRevenue = mergedTrips
    .filter((trip) => ['CONFIRMED', 'UPCOMING'].includes(trip.status))
    .reduce((sum, trip) => sum + Number(trip.price || 0), 0);

  useEffect(() => {
    if (!scannerTripId) return;

    let active = true;

    const stopCamera = () => {
      const scanner = qrScannerRef.current;
      qrScannerRef.current = null;
      if (!scanner) return;

      const clearScanner = () => {
        try {
          scanner.clear();
        } catch {
          // The scanner can already be cleared after a permission failure.
        }
      };

      if (scanner.isScanning) scanner.stop().then(clearScanner).catch(clearScanner);
      else clearScanner();
    };

    const startCamera = async () => {
      try {
        const scanner = new Html5Qrcode(QR_READER_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        qrScannerRef.current = scanner;
        setScannerStatus('Opening camera...');

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
          async (decodedText) => {
            if (!active || !decodedText || decodedText === detectedPayloadRef.current) return;
            detectedPayloadRef.current = decodedText;
            setQrInput(decodedText);
            await startWithQrPayloadRef.current(decodedText);
          },
          () => {
            if (active) setScannerStatus('Camera is active. Keep the QR centered and steady.');
          }
        );
      } catch (error) {
        console.error('Unable to start QR camera:', error);
        setScannerStatus('Camera unavailable. Allow camera permission or paste the QR payload below.');
      }
    };

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [scannerTripId]);

  const renderActions = (trip: TripSummary) => (
    <div className="flex flex-wrap items-center gap-2">
      {trip.meetupStatus === 'IN_PROGRESS' && (
        <>
          <Link
            to={`/buddy/live/${trip.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-emerald-700"
          >
            <Play size={14} /> Live
          </Link>
          <button
            onClick={() => handleComplete(trip.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-secondary/70 transition hover:text-primary"
          >
            <CheckCircle2 size={14} /> Complete
          </button>
        </>
      )}
      {(trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') && trip.meetupStatus === 'BOTH_ARRIVED' && (
        <button
          onClick={() => setScannerTripId(trip.id)}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary"
        >
          <QrCode size={14} /> Scan QR
        </button>
      )}
      {(trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') &&
        ['NOT_STARTED', 'TRAVELER_ARRIVED'].includes(trip.meetupStatus || 'NOT_STARTED') && (
          <button
            onClick={() => handleMeetupPoint(trip.id)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-primary-dark"
          >
            <MapPin size={14} /> I'm here
          </button>
        )}
      {(trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') && trip.meetupStatus === 'BUDDY_ARRIVED' && (
        <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
          Waiting traveler
        </span>
      )}
      {trip.status === 'PENDING' && (
        <button
          onClick={() => openCancelModal(trip.id)}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-600 transition hover:bg-rose-600 hover:text-white"
        >
          <X size={14} /> Cancel
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Buddy trips</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-secondary">Session operations</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-secondary/55">
              Follow requests, upcoming meetups, live sessions and itinerary handoff from one board.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            ${upcomingRevenue.toFixed(0)} upcoming revenue
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm scrollbar-hide">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setCurrentPage(1);
            }}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition ${
              activeTab === key ? 'bg-secondary text-white shadow-sm' : 'text-secondary/45 hover:bg-slate-50 hover:text-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
            <span className={`rounded-full px-2 py-0.5 ${activeTab === key ? 'bg-white/15 text-white' : 'bg-slate-100 text-secondary/45'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {actionError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {actionError}
        </div>
      )}

      {paginatedTrips.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {paginatedTrips.map((trip) => (
            <article
              key={trip.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    {trip.travelerAvatar ? (
                      <img
                        src={trip.travelerAvatar}
                        alt={trip.traveler || 'Traveler'}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <InitialAvatar name={trip.traveler} />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClasses(trip.status)}`}>
                          {trip.status === 'PENDING' ? 'Awaiting payment' : trip.status}
                        </span>
                        {trip.meetupStatus === 'IN_PROGRESS' && (
                          <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                            Live
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 truncate text-base font-black text-secondary">{trip.activity || trip.title || 'Local experience'}</h3>
                      <p className="mt-1 text-xs font-bold text-secondary/50">{trip.traveler || 'Traveler'} request</p>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-right">
                    <p className="text-lg font-black text-secondary">${trip.price || 0}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-secondary/35">payout</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: Calendar, label: 'Date', value: trip.date || '-' },
                    { icon: Clock, label: 'Start', value: trip.time || '-' },
                    { icon: Activity, label: 'Hours', value: `${trip.hours || 3}h` },
                    { icon: Users, label: 'Guests', value: trip.guests || 1 },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <Icon size={14} className="text-primary" />
                      <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-secondary/35">{label}</p>
                      <p className="truncate text-xs font-black text-secondary">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-start gap-2 text-xs font-bold text-secondary/60">
                    <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
                    <span className="line-clamp-2">{trip.meetingPoint || 'Meeting point is not set yet'}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-secondary/35">
                  <ShieldCheck size={14} className="text-primary" />
                  Escrow protected session
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to={`/buddy/dashboard/trips/${trip.id}`}
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark"
                >
                  View detail <ArrowRight size={14} />
                </Link>
                {renderActions(trip)}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-secondary/25">
            <Map size={32} />
          </div>
          <h3 className="mt-5 text-xl font-black text-secondary">No {activeTab} bookings</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-secondary/50">
            New traveler activity will appear here as soon as bookings move into this status.
          </p>
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-secondary/50 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-secondary/60">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-secondary/50 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {scannerTripId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm" onClick={closeScanner} />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl">
            <button
              onClick={closeScanner}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-secondary/45 transition hover:text-primary"
            >
              <X size={18} />
            </button>
            <h4 className="pr-8 text-xl font-black text-secondary">Start trip with QR</h4>
            <p className="mt-2 text-xs font-bold text-secondary/50">{scannerStatus}</p>

            <div className="relative mx-auto mt-5 h-56 w-56 overflow-hidden rounded-2xl bg-secondary">
              <div id={QR_READER_ID} className="absolute inset-0 h-full w-full [&_button]:hidden [&_img]:hidden [&_span]:hidden [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover" />
              <div className="absolute inset-8 rounded-2xl border-2 border-white/75 shadow-[0_0_0_999px_rgba(0,0,0,0.22)]" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                <Camera size={13} /> Scan traveler code
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <textarea
                value={qrInput}
                onChange={(event) => setQrInput(event.target.value)}
                placeholder="local-buddy://booking/.../start?token=..."
                className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/10"
              />
              <Button
                onClick={() => handleStartWithQrPayload(qrInput)}
                disabled={isStartingTrip || !qrInput.trim()}
                className="w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest"
              >
                <Play size={14} /> Start trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {cancelTripId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm" onClick={closeCancelModal} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={closeCancelModal}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-secondary/45 transition hover:text-primary"
              disabled={isCancelling}
            >
              <X size={18} />
            </button>
            <div className="pr-10">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-rose-600">Cancel booking</p>
              <h4 className="mt-2 text-xl font-black text-secondary">Select a cancellation reason</h4>
              <p className="mt-2 text-sm font-medium leading-6 text-secondary/55">
                The traveler will see this reason in their booking notification.
              </p>
            </div>

            <div className="mt-5 grid gap-2">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setCancelReason(reason)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-black transition ${
                    cancelReason === reason
                      ? 'border-rose-300 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-slate-50 text-secondary/65 hover:border-rose-200'
                  }`}
                  disabled={isCancelling}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Or write a specific reason..."
              className="mt-4 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-secondary outline-none focus:ring-4 focus:ring-rose-500/10"
              disabled={isCancelling}
            />

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-secondary/60"
              >
                Keep booking
              </button>
              <button
                onClick={handleCancelPending}
                disabled={isCancelling || !cancelReason.trim()}
                className="rounded-xl bg-rose-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsTab;
