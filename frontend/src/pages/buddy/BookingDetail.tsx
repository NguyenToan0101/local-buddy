import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  MessageCircle,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  DollarSign,
  Compass,
  ArrowRight,
  Star,
  User as UserIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Button from '../../components/ui/Button';

const BookingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [actionError, setActionError] = useState('');
  const [itineraryDraft, setItineraryDraft] = useState({
    meetingPoint: '',
    routeStops: [''],
    itineraryNotes: '',
    location: '',
    hours: 3,
    price: '',
  });

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const data = await bookingService.getById(id);
        setBooking(data);
        setItineraryDraft({
          meetingPoint: data.meetingPoint || '',
          routeStops: Array.isArray(data.routeStops) && data.routeStops.length > 0 ? data.routeStops : [''],
          itineraryNotes: data.itineraryNotes || data.description || '',
          location: data.location || '',
          hours: data.hours || 3,
          price: String(data.totalPrice ?? data.price ?? ''),
        });
      } catch (error) {
        console.error("Error fetching booking detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const routeStops: string[] = Array.isArray(booking?.routeStops) ? booking.routeStops.filter(Boolean) : [];

  const updateRouteStop = (index: number, value: string) => {
    setItineraryDraft((current) => ({
      ...current,
      routeStops: current.routeStops.map((stop, stopIndex) => (stopIndex === index ? value : stop)),
    }));
  };

  const addRouteStop = () => {
    setItineraryDraft((current) => ({
      ...current,
      routeStops: current.routeStops.length >= 20 ? current.routeStops : [...current.routeStops, ''],
    }));
  };

  const removeRouteStop = (index: number) => {
    setItineraryDraft((current) => ({
      ...current,
      routeStops: current.routeStops.length === 1 ? [''] : current.routeStops.filter((_, stopIndex) => stopIndex !== index),
    }));
  };

  const handleSaveItinerary = async () => {
    if (!id) return;
    const cleanedStops = itineraryDraft.routeStops.map((stop) => stop.trim()).filter(Boolean);
    if (!itineraryDraft.meetingPoint.trim() && cleanedStops.length === 0) {
      setActionError('Meeting point or at least one route stop is required.');
      return;
    }
    try {
      setSavingItinerary(true);
      setActionError('');
      const updated = await bookingService.updateItinerary(id, {
        location: itineraryDraft.location.trim() || itineraryDraft.meetingPoint.trim() || cleanedStops[0],
        meetingPoint: itineraryDraft.meetingPoint.trim(),
        routeStops: cleanedStops,
        itineraryNotes: itineraryDraft.itineraryNotes.trim(),
        hours: itineraryDraft.hours,
        price: itineraryDraft.price ? Number(itineraryDraft.price) : undefined,
      });
      setBooking(updated);
    } catch (error) {
      console.error("Error updating itinerary:", error);
      setActionError(error instanceof Error ? error.message : 'Unable to update itinerary.');
    } finally {
      setSavingItinerary(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin"></div>
      <p className="text-[9px] font-black text-secondary/30 uppercase tracking-widest">Syncing Booking Details...</p>
    </div>
  );

  if (!booking) return (
    <div className="text-center py-20 space-y-4">
      <h3 className="text-xl font-black text-secondary uppercase tracking-tight italic">Booking Not Found</h3>
      <Button onClick={() => navigate('/buddy/dashboard/trips')} className="rounded-xl px-6 py-3 uppercase tracking-widest font-black text-[9px]">Back to Trips</Button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header navigations */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate('/buddy/dashboard/trips')}
          className="group flex items-center gap-2 text-secondary/40 hover:text-primary transition-all font-black text-[9px] uppercase tracking-widest border-none bg-transparent cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <ChevronLeft size={16} />
          </div>
          Back to list
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-secondary/20 uppercase tracking-widest">ID: LB-{booking.id.padStart(6, '0')}</span>
          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
            booking.status === 'CONFIRMED' || booking.status === 'UPCOMING' 
            ? 'bg-green-500/10 text-green-600' 
            : 'bg-gray-100 text-gray-400'
          }`}>
            {booking.status}
          </span>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left pane: Traveler info & Finance */}
        <div className="lg:col-span-4 space-y-6">
          {/* Traveler Account Details */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100/80 space-y-6 relative overflow-hidden group">
            <div className="absolute top-[-40px] right-[-40px] w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-[20px] overflow-hidden shadow-md ring-2 ring-primary/5">
                  <img src={`https://i.pravatar.cc/150?u=${booking.id}`} alt="Traveler" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -right-1.5 -bottom-1.5 bg-green-500 rounded-full p-1 border-2 border-white shadow-sm">
                  <ShieldCheck size={12} className="text-white" />
                </div>
              </div>
              
              <div>
                <h4 className="font-black text-secondary text-base uppercase tracking-tight">{booking.traveler || 'Traveler'}</h4>
                <p className="text-[9px] font-bold text-secondary/35 uppercase tracking-widest mt-0.5">Verified Traveler</p>
              </div>

              <Link to="/buddy/dashboard/messages" className="w-full">
                <Button className="w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border-none flex items-center justify-center gap-2">
                  <MessageCircle size={14} /> Send Message
                </Button>
              </Link>
            </div>
          </div>

          {/* Pricing balance card */}
          <div className="bg-secondary rounded-[24px] p-6 text-white shadow-md relative overflow-hidden group border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center text-white">
                  <DollarSign size={20} />
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Escrow Safe Pay</div>
              </div>
              
              <div>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Host Income</p>
                <div className="flex items-end gap-1.5 text-primary">
                  <span className="text-4xl font-black tracking-tight leading-none">${booking.price}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">USD</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2.5 text-[10px] font-bold">
                <div className="flex justify-between items-center opacity-85">
                  <span className="opacity-50">Booking Rate</span>
                  <span>${booking.price}</span>
                </div>
                <div className="flex justify-between items-center opacity-85">
                  <span className="opacity-50">Service Commission</span>
                  <span>-$0.00</span>
                </div>
                <div className="h-px bg-white/10"></div>
                <div className="flex justify-between items-center text-primary font-black">
                  <span>Net Earnings</span>
                  <span>${booking.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Specifications details & Itinerary */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-gray-100/80 space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                  <Compass size={16} />
                </div>
                <span className="text-[8px] font-black text-primary uppercase tracking-widest">{booking.activity || 'Tour Session'}</span>
              </div>
              <h3 className="text-2xl font-black text-secondary tracking-tight italic leading-tight">{booking.activity || booking.title}</h3>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-gray-50 border border-gray-100 rounded-2xl text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <Calendar size={12} />
                  <p className="text-[8px] font-black uppercase tracking-widest">Date</p>
                </div>
                <p className="font-black text-secondary">{booking.date}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <Clock size={12} />
                  <p className="text-[8px] font-black uppercase tracking-widest">Time</p>
                </div>
                <p className="font-black text-secondary">{booking.time}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <Star size={12} />
                  <p className="text-[8px] font-black uppercase tracking-widest">Duration</p>
                </div>
                <p className="font-black text-secondary">{booking.hours || 3} Hours</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <UserIcon size={12} />
                  <p className="text-[8px] font-black uppercase tracking-widest">Guests</p>
                </div>
                <p className="font-black text-secondary">2 Persons</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              <h5 className="text-sm font-black text-secondary uppercase tracking-wider border-l-4 border-primary pl-4">Itinerary details</h5>

              {actionError && <p className="text-xs font-bold text-rose-500">{actionError}</p>}

              {booking.status === 'PENDING' ? (
                <div className="space-y-4">
                  <input
                    value={itineraryDraft.meetingPoint}
                    onChange={(event) => setItineraryDraft((current) => ({ ...current, meetingPoint: event.target.value }))}
                    placeholder="Meeting point"
                    className="w-full rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs font-bold text-secondary outline-none focus:border-primary/30"
                  />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-secondary/30 uppercase tracking-widest">Route stops</span>
                      <button onClick={addRouteStop} className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center">
                        <Plus size={14} />
                      </button>
                    </div>
                    {itineraryDraft.routeStops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">{index + 1}</span>
                        <input
                          value={stop}
                          onChange={(event) => updateRouteStop(index, event.target.value)}
                          placeholder="Cafe XYZ, Cho ABC, Bien 123..."
                          className="min-w-0 flex-1 rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs font-bold text-secondary outline-none focus:border-primary/30"
                        />
                        <button onClick={() => removeRouteStop(index)} className="h-9 w-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      value={itineraryDraft.location}
                      onChange={(event) => setItineraryDraft((current) => ({ ...current, location: event.target.value }))}
                      placeholder="Main area"
                      className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs font-bold text-secondary outline-none focus:border-primary/30"
                    />
                    <input
                      type="number"
                      min={1}
                      value={itineraryDraft.hours}
                      onChange={(event) => setItineraryDraft((current) => ({ ...current, hours: Number(event.target.value) || 1 }))}
                      className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs font-bold text-secondary outline-none focus:border-primary/30"
                    />
                    <input
                      type="number"
                      min={0}
                      value={itineraryDraft.price}
                      onChange={(event) => setItineraryDraft((current) => ({ ...current, price: event.target.value }))}
                      placeholder="Price"
                      className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs font-bold text-secondary outline-none focus:border-primary/30"
                    />
                  </div>
                  <textarea
                    value={itineraryDraft.itineraryNotes}
                    onChange={(event) => setItineraryDraft((current) => ({ ...current, itineraryNotes: event.target.value }))}
                    placeholder="Notes for traveler"
                    className="min-h-24 w-full resize-none rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs font-bold text-secondary outline-none focus:border-primary/30"
                  />
                  <Button onClick={handleSaveItinerary} disabled={savingItinerary} className="w-full py-3 text-[10px] uppercase tracking-widest">
                    {savingItinerary ? 'Saving...' : 'Save Itinerary For Traveler'}
                  </Button>
                </div>
              ) : (
                <div className="relative ml-2 space-y-8">
                  <div className="absolute left-[3px] top-2 bottom-2 w-0.5 bg-primary/10 border-l border-dashed border-primary/25"></div>

                  {(booking.meetingPoint || booking.location) && (
                    <div className="relative pl-8 group">
                      <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest flex items-center gap-1">
                          <MapPin size={8} className="text-primary" /> Meetup Spot
                        </p>
                        <h6 className="font-black text-secondary text-sm">{booking.meetingPoint || booking.location}</h6>
                      </div>
                    </div>
                  )}

                  {routeStops.map((stop, index) => (
                    <div key={`${stop}-${index}`} className="relative pl-8 group">
                      <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm"></div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest">Stop {index + 1}</p>
                        <h6 className="font-black text-secondary text-sm">{stop}</h6>
                      </div>
                    </div>
                  ))}

                  {booking.itineraryNotes && (
                    <p className="rounded-2xl bg-gray-50 p-4 text-[11px] font-bold text-secondary/40 italic leading-normal">
                      {booking.itineraryNotes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer assurances */}
            <div className="pt-6 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-secondary/25 uppercase tracking-wider">
                <ShieldCheck size={16} className="text-primary" /> Supported by Local Buddy Escrow
              </div>
              <button 
                onClick={() => window.print()}
                className="text-primary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline"
              >
                Print Trip Summary <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
