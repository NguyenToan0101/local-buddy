import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../services/api';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Map,
  Activity,
  ShieldCheck,
  User,
  ArrowRight,
  QrCode,
  X
} from 'lucide-react';
import Button from '../ui/Button';

interface TripsTabProps {
  upcomingTrips: any[];
}

const TripsTab: React.FC<TripsTabProps> = ({ upcomingTrips }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [showQrModal, setShowQrModal] = useState<string | null>(null);
  const itemsPerPage = 6; // increased slightly for better desktop utilization

  const handleMeetupPoint = async (tripId: string) => {
    try {
      await bookingService.updateMeetupStatus(tripId, 'BUDDY_WAITING');
      setShowQrModal(tripId);
      // Optimistic state update or full refresh
      window.location.reload();
    } catch (error) {
      console.error("Error updating meetup status:", error);
    }
  };

  // Filter trips based on activeTab
  const filteredTrips = upcomingTrips.filter(trip => {
    if (activeTab === 'pending') return trip.status === 'PENDING';
    if (activeTab === 'upcoming') return trip.status === 'CONFIRMED' || trip.status === 'UPCOMING';
    return trip.status === activeTab.toUpperCase();
  });

  // Pagination
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-xl font-black text-secondary tracking-tight">Session Schedules</h3>
        <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Manage traveler sessions, verify meetups, and join live tracking</p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-2xl w-fit">
        {(['pending', 'upcoming', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-none cursor-pointer ${
              activeTab === tab 
              ? 'bg-secondary text-white shadow-sm' 
              : 'text-secondary/40 hover:text-secondary hover:bg-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trips list */}
      {paginatedTrips.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paginatedTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-3xl border border-gray-100/80 shadow-sm flex flex-col justify-between overflow-hidden hover:border-primary/10 hover:shadow-premium transition-all duration-200 group"
            >
              <div className="p-6 space-y-6">
                {/* Top header details */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-dark overflow-hidden ring-2 ring-primary/5 shrink-0">
                      <img src={`https://i.pravatar.cc/100?u=${trip.id}`} alt="Traveler" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${
                          trip.status === 'CONFIRMED' || trip.status === 'UPCOMING' ? 'bg-green-500/10 text-green-600' :
                          trip.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 animate-pulse' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {trip.status === 'PENDING' ? 'Wait Pay' : trip.status}
                        </span>
                        {trip.meetupStatus === 'IN_PROGRESS' && (
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider animate-pulse">Live</span>
                        )}
                      </div>
                      <h4 className="text-base font-black text-secondary tracking-tight mt-1 truncate max-w-[200px] sm:max-w-xs group-hover:text-primary transition-colors">
                        {trip.activity || trip.title}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[8px] font-bold text-secondary/30 uppercase tracking-widest">Payout</p>
                    <p className="text-lg font-black text-secondary italic mt-0.5">${trip.price}</p>
                  </div>
                </div>

                {/* Details layout grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-50 text-xs">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-secondary/20 uppercase tracking-widest flex items-center gap-1"><CalendarIcon size={10} /> Date</p>
                    <p className="font-black text-secondary">{trip.date}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-secondary/20 uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> Start Time</p>
                    <p className="font-black text-secondary">{trip.time}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-secondary/20 uppercase tracking-widest flex items-center gap-1"><Activity size={10} /> Duration</p>
                    <p className="font-black text-secondary">{trip.hours || 3} Hours</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-secondary/20 uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> Location</p>
                    <p className="font-black text-secondary truncate" title={trip.location}>{trip.location}</p>
                  </div>
                </div>

                {/* Card description details */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-secondary/40 italic">
                  <ShieldCheck size={14} className="text-primary shrink-0" /> Host protections & Safe Escrow payment active
                </div>
              </div>

              {/* Action actions row */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                <Link to={`/buddy/dashboard/trips/${trip.id}`} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                  View Detail <ArrowRight size={10} />
                </Link>
                <div className="flex items-center gap-2">
                  {trip.meetupStatus === 'IN_PROGRESS' && (
                    <Link to={`/buddy/live/${trip.id}`}>
                      <Button className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm bg-green-500 hover:bg-green-600 text-white border-none">
                        Join Session
                      </Button>
                    </Link>
                  )}
                  {(trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') && trip.meetupStatus === 'BUDDY_WAITING' && (
                    <button
                      onClick={() => setShowQrModal(trip.id)}
                      className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-secondary text-white hover:bg-secondary-dark border-none shadow-sm flex items-center gap-1.5 animate-pulse"
                    >
                      <QrCode size={12} /> Show QR
                    </button>
                  )}
                  {(trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') && !trip.meetupStatus && (
                    <button
                      onClick={() => handleMeetupPoint(trip.id)}
                      className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary text-white hover:bg-primary-dark border-none shadow-sm flex items-center gap-1.5"
                    >
                      <MapPin size={12} /> I'm Here
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[32px] py-28 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-secondary/10 mx-auto mb-6">
            <Map size={32} />
          </div>
          <h4 className="text-lg font-black text-secondary tracking-tight">No {activeTab} bookings</h4>
          <p className="text-xs text-secondary/40 italic max-w-xs mx-auto mt-2 leading-relaxed">
            Your host listings are live. Maintain a high response score to attract bookings.
          </p>
        </div>
      )}

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary disabled:opacity-30 transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border-none cursor-pointer ${
                  currentPage === page 
                  ? 'bg-secondary text-white shadow-sm' 
                  : 'bg-white text-secondary/40 hover:bg-gray-50 shadow-sm border border-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary disabled:opacity-30 transition-all cursor-pointer shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Meetup QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm" onClick={() => setShowQrModal(null)}></div>
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full relative z-10 shadow-2xl text-center space-y-6 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary"></div>
            <button
              onClick={() => setShowQrModal(null)}
              className="absolute top-6 right-6 text-secondary/20 hover:text-primary transition-colors border-none bg-transparent cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-1.5 pt-4">
              <h4 className="text-xl font-black text-secondary tracking-tight">Meetup Waiting Signal</h4>
              <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Traveler scans this to verify coordinates</p>
            </div>

            <div className="relative mx-auto w-48 h-48 bg-surface rounded-[24px] flex items-center justify-center p-6 ring-4 ring-primary/5 transition-all">
              <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-[24px] animate-[spin_30s_linear_infinite]"></div>
              <div className="relative z-10 w-full h-full text-secondary opacity-90">
                <QrCode size="100%" strokeWidth={1.5} />
              </div>
              <div className="absolute left-4 right-4 top-4 h-0.5 bg-primary/40 blur-[1px] rounded-full animate-[bounce_4s_infinite]"></div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Broadcasting coordinates...</span>
              </div>
              <p className="text-[9px] font-bold text-secondary/30 uppercase tracking-wider max-w-[220px] mx-auto leading-relaxed">
                Stay at the specified meetup point. Payout activates when traveler scanning completes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsTab;
