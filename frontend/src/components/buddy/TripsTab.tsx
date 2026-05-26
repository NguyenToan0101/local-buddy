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
  const itemsPerPage = 3;

  const handleMeetupPoint = async (tripId: string) => {
    try {
      await bookingService.updateMeetupStatus(tripId, 'BUDDY_WAITING');
      setShowQrModal(tripId);
      // In a real app, this would trigger a socket event or similar
      window.location.reload(); // Refresh to show new state
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

  // Pagination logic
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedTrips = filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Derive busy days for calendar from ALL upcoming/confirmed trips
  const busyDays = upcomingTrips
    .filter(t => t.status === 'CONFIRMED' || t.status === 'UPCOMING')
    .map(trip => {
      const day = parseInt(trip.date.match(/\d+/)?.[0] || "0");
      return day;
    }).filter(day => day > 0);

  return (
    <div className="space-y-12">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h3 className="text-4xl font-black text-secondary tracking-tighter italic">Experience Management</h3>
          <p className="text-secondary/40 font-bold text-sm italic">Manage your sessions, travelers, and schedule in one place.</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-white/50 p-2 rounded-[32px] border border-gray-100 w-fit">
          {(['pending', 'upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`px-10 py-4 rounded-[26px] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-none ${activeTab === tab ? 'bg-secondary text-white shadow-xl scale-105' : 'text-secondary/40 hover:bg-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Trips List */}
        <div className="grid grid-cols-1 gap-10">
          {paginatedTrips.length > 0 ? (
            <>
              {paginatedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white rounded-[48px] shadow-premium border border-gray-50 group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="p-10 md:p-12 flex flex-col gap-10">
                    <Link to={`/buddy/dashboard/trips/${trip.id}`} className="block group/card no-underline">
                      {/* Header: Traveler & Earnings */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-3xl bg-surface-dark overflow-hidden ring-4 ring-primary/5">
                              <img src={`https://i.pravatar.cc/150?u=${trip.id}`} alt="Traveler" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -right-2 -bottom-2 bg-primary rounded-full p-1.5 border-4 border-white shadow-lg">
                              <ShieldCheck size={14} className="text-white" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg ${trip.status === 'CONFIRMED' || trip.status === 'UPCOMING' ? 'bg-green-100 text-green-600' :
                                  trip.status === 'PENDING' ? 'bg-amber-100 text-amber-600 animate-pulse' :
                                    'bg-gray-100 text-gray-400'}`}>
                                {trip.status === 'PENDING' ? 'Waiting for Payment' : trip.status}
                              </span>
                              {trip.meetupStatus === 'IN_PROGRESS' && (
                                <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse border-none">Live</span>
                              )}
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Confirmed Booking</span>
                            </div>
                            <h4 className="text-3xl font-black text-secondary tracking-tighter italic group-hover:text-primary transition-colors leading-none">
                              {trip.activity || trip.title}
                            </h4>
                            <p className="text-sm font-bold text-secondary/40">Hosted traveler <span className="text-secondary italic">{trip.traveler || 'Mystery Traveler'}</span></p>
                          </div>
                        </div>

                        <div className="sm:text-right flex flex-col items-end">
                          <p className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.3em] mb-1">Your Earnings</p>
                          <p className="text-4xl font-black text-secondary tracking-tight group-hover:text-primary transition-colors italic">${trip.price}</p>
                        </div>
                      </div>

                      {/* Trip Info Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-y border-gray-50">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-secondary/20">
                            <CalendarIcon size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Date</span>
                          </div>
                          <p className="text-sm font-black text-secondary italic">{trip.date}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-secondary/20">
                            <Clock size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Time</span>
                          </div>
                          <p className="text-sm font-black text-secondary italic">{trip.time}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-secondary/20">
                            <Activity size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Duration</span>
                          </div>
                          <p className="text-sm font-black text-secondary italic">{trip.hours || 3} Hours</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-secondary/20">
                            <MapPin size={16} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Meeting Point</span>
                          </div>
                          <p className="text-sm font-black text-secondary italic truncate">{trip.location}</p>
                        </div>
                      </div>
                    </Link>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-4 text-xs font-bold italic text-secondary/40">
                        <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center">
                          <User size={18} className="text-primary" />
                        </div>
                        Verified Traveler Identity & Safe-Pay Protection active.
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm bg-white">
                          <MessageCircle size={18} className="text-primary" /> Chat with Traveler
                        </button>
                        {trip.meetupStatus === 'IN_PROGRESS' && (
                          <Link to={`/buddy/live/${trip.id}`} className="flex-1 sm:flex-none">
                            <Button className="w-full px-12 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-primary-glow border-none bg-green-500 hover:bg-green-600">
                              Join Live Session
                            </Button>
                          </Link>
                        )}
                        {(trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') && trip.meetupStatus === 'BUDDY_WAITING' && (
                          <button
                            onClick={() => setShowQrModal(trip.id)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-secondary-dark transition-all shadow-lg border-none animate-pulse"
                          >
                            <QrCode size={18} /> Show QR Code
                          </button>
                        )}
                        {(trip.status === 'CONFIRMED' || trip.status === 'UPCOMING') && !trip.meetupStatus && (
                          <button
                            onClick={() => handleMeetupPoint(trip.id)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-primary-glow border-none"
                          >
                            <MapPin size={18} /> I'm at the Meetup Point
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-16">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="w-14 h-14 rounded-[24px] bg-white border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ArrowRight size={18} className="rotate-180" />
                  </button>

                  <div className="flex items-center gap-3">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-14 h-14 rounded-[24px] font-black text-[11px] transition-all shadow-sm border-none ${currentPage === page ? 'bg-secondary text-white scale-110 shadow-lg' : 'bg-white text-secondary/40 border-gray-100 hover:border-primary/30'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="w-14 h-14 rounded-[24px] bg-white border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-[64px] py-40 px-12 text-center border border-gray-100 shadow-premium">
              <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-secondary/10 mx-auto mb-8">
                <Map size={48} />
              </div>
              <h4 className="text-4xl font-black text-secondary tracking-tighter italic">No {activeTab} experiences.</h4>
              <p className="text-secondary/30 text-lg max-w-sm mx-auto italic leading-relaxed">Your journey log is clear. Stay discoverable to receive new bookings and inquiries.</p>
            </div>
          )}
        </div>
      </div>


      {/* Meetup QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-secondary/80 backdrop-blur-md" onClick={() => setShowQrModal(null)}></div>
          <div className="bg-white rounded-[64px] p-12 max-w-md w-full relative z-10 shadow-2xl text-center space-y-8 overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary"></div>
            <button
              onClick={() => setShowQrModal(null)}
              className="absolute top-8 right-8 text-secondary/20 hover:text-primary transition-colors border-none bg-transparent"
            >
              <X size={24} />
            </button>

            <div className="space-y-2 pt-4">
              <h4 className="text-4xl font-black text-secondary tracking-tighter italic">Buddy is Waiting.</h4>
              <p className="text-secondary/40 font-bold text-sm">Traveler will scan this to start the journey.</p>
            </div>

            <div className="relative mx-auto w-64 h-64 bg-surface rounded-[40px] flex items-center justify-center p-8 ring-8 ring-primary/5 group-hover:ring-primary/10 transition-all">
              <div className="absolute inset-0 border-4 border-dashed border-primary/20 rounded-[40px] animate-[spin_20s_linear_infinite]"></div>
              <div className="relative z-10 w-full h-full text-secondary opacity-80 group-hover:opacity-100 transition-opacity">
                <QrCode size="100%" strokeWidth={1.5} />
              </div>
              {/* Scanline Effect */}
              <div className="absolute left-6 right-6 top-6 h-1 bg-primary/30 blur-sm rounded-full animate-[bounce_3s_infinite]"></div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 bg-green-50 px-6 py-3 rounded-2xl border border-green-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Active Signal broadcasting...</span>
              </div>
              <p className="text-[9px] font-black text-secondary/20 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">Please stay within 5 meters of the meetup point.</p>
            </div>

            <Button onClick={() => setShowQrModal(null)} className="w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-primary-glow border-none">
              Minimize & Wait
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsTab;
