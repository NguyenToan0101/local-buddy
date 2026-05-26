import React, { useState, useEffect } from 'react';
import {
   MapPin,
   Calendar,
   Clock,
   MessageCircle,
   ArrowRight,
   Compass,
   Activity,
   ShieldCheck,
   Info
} from 'lucide-react';
import { bookingService } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TravelerBookings: React.FC = () => {
   const { user } = useAuth();
   const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
   const [bookings, setBookings] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 3;

   useEffect(() => {
      const fetchBookings = async () => {
         try {
            setLoading(true);
            const data = await bookingService.getAll();
            setTimeout(() => {
               setBookings(data || []);
               setLoading(false);
            }, 600);
         } catch (error) {
            console.error("Error fetching bookings:", error);
            setLoading(false);
         }
      };
      fetchBookings();
   }, []);

   const filteredBookings = bookings.filter(b => {
      const matchesUser = String(b.userId) === String(user?.id);
      const isPending = activeTab === 'pending' && b.status === 'PENDING';
      const isUpcoming = activeTab === 'upcoming' && ['CONFIRMED', 'UPCOMING'].includes(b.status);
      const isCompleted = activeTab === 'completed' && b.status === 'COMPLETED';
      const isCancelled = activeTab === 'cancelled' && b.status === 'CANCELLED';
      return matchesUser && (isPending || isUpcoming || isCompleted || isCancelled);
   });

   const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
   const paginatedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col font-sans selection:bg-primary/10">
         <Navbar />

         <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto w-full flex-1 space-y-24">

            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out space-y-16">

               {/* Control Bar: Tabs & Results Count */}
               <div className="sticky top-24 md:top-28 z-30 -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-4 bg-[#FBFBFC]/80 backdrop-blur-xl">
                 <div className="flex flex-col items-center gap-8">
                  <div className="bg-white p-2 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-1">
                     {(['pending', 'upcoming', 'completed', 'cancelled'] as const).map((tab) => (
                        <button
                           key={tab}
                           onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                           className={`px-10 py-4 rounded-[26px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-secondary text-white shadow-xl scale-105' : 'text-secondary/40 hover:bg-gray-50'}`}
                        >
                           {tab}
                        </button>
                     ))}
                  </div>
                  
                  {filteredBookings.length > 0 && !loading && (
                     <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/5 rounded-full border border-primary/10">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{filteredBookings.length} {activeTab} Records Found</span>
                     </div>
                  )}
                 </div>
               </div>

               {/* Bookings List - Premium Card Styling */}
               <div className="space-y-10 max-w-5xl mx-auto w-full">
                  {loading ? (
                     <div className="grid gap-10">
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="h-64 bg-white rounded-[48px] animate-pulse border border-gray-50"></div>
                        ))}
                     </div>
                  ) : paginatedBookings.length > 0 ? (
                     <div className="grid gap-10">
                        {paginatedBookings.map((booking, i) => (
                           <div
                              key={i}
                              className="bg-white rounded-[48px] shadow-premium border border-gray-50 group transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
                           >
                              <div className="p-10 md:p-12 flex flex-col gap-8">
                                 <Link to={`/traveller/booking/${booking.id}`} className="block group/card no-underline">
                                 {/* Header: Buddy & Status */}
                                 <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                    <div className="flex items-center gap-4">
                                       <div className="relative">
                                          <img src={booking.buddyAvatar || "/assets/img/Linh.jpg"} className="w-16 h-16 rounded-full border-2 border-white shadow-xl object-cover" alt="" />
                                          <div className="absolute -right-1 -bottom-1 bg-primary rounded-full p-1 border-2 border-white">
                                             <ShieldCheck size={12} className="text-white" />
                                          </div>
                                       </div>
                                       <div className="space-y-1">
                                          <h3 className="text-3xl font-black text-secondary tracking-tighter italic leading-none">{booking.title}</h3>
                                          <p className="text-xs font-bold text-secondary/40">with {booking.buddyName || "Local Pro"}</p>
                                       </div>
                                    </div>
                                    
                                    <div className="sm:text-right space-y-1">
                                       <p className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.3em]">Estimated Cost</p>
                                       <p className="text-3xl font-black text-secondary tracking-tight transition-colors group-hover:text-primary">${booking.price}</p>
                                    </div>
                                 </div>

                                 {/* Badges */}
                                  <div className="flex items-center gap-3">
                                     <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-lg">Authentic Session</span>
                                     <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg ${
                                        booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' : 
                                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-600 animate-pulse' : 
                                        'bg-gray-100 text-gray-400'}`}>
                                        {booking.status === 'PENDING' ? 'Awaiting Payment' : booking.status}
                                     </span>
                                  </div>

                                 {/* Trip Info Grid - Standardized to Home colors */}
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-gray-50">
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2 text-secondary/20">
                                          <Calendar size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Date</span>
                                       </div>
                                       <p className="text-sm font-black text-secondary italic">{booking.date}</p>
                                    </div>
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2 text-secondary/20">
                                          <Clock size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Time</span>
                                       </div>
                                       <p className="text-sm font-black text-secondary italic">{booking.time}</p>
                                    </div>
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2 text-secondary/20">
                                          <Activity size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Duration</span>
                                       </div>
                                       <p className="text-sm font-black text-secondary italic">{booking.hours || 3} Hours</p>
                                    </div>
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-2 text-secondary/20">
                                          <MapPin size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Location</span>
                                       </div>
                                       <p className="text-sm font-black text-secondary italic truncate">{booking.location}</p>
                                    </div>
                                    </div>
                               </Link>
                                 <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-3 text-secondary/40 text-[10px] font-bold italic">
                                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                          <Info size={16} className="text-primary" />
                                       </div>
                                       *Personal costs are managed separately.
                                    </div>
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                       <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                                          <MessageCircle size={16} className="text-primary" /> Chat
                                       </button>
                                        {booking.status === 'PENDING' && (
                                           <Link to="/traveller/checkout" state={{ bookingId: booking.id }} className="flex-1 sm:flex-none">
                                              <button 
                                                 className="w-full flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/10 border-none px-6"
                                              >
                                                 Pay Now
                                              </button>
                                           </Link>
                                        )}
                                       {booking.meetupStatus === 'IN_PROGRESS' && (
                                          <button 
                                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/traveller/experience/live/${booking.id}`; }}
                                             className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-[24px] bg-green-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-green-500/10 border-none px-6"
                                          >
                                             Join Live Session
                                          </button>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}

                        {/* Pagination Section - Standardized Size */}
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
                                       className={`w-14 h-14 rounded-[24px] font-black text-[11px] transition-all shadow-sm ${currentPage === page ? 'bg-secondary text-white scale-110 shadow-lg' : 'bg-white text-secondary/40 border border-gray-100 hover:border-primary/30'}`}
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
                     </div>
                  ) : (
                     <div className="bg-white rounded-[64px] py-40 px-12 text-center border border-gray-100 shadow-premium">
                        <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center text-secondary/10 mx-auto mb-8">
                           <Compass size={48} />
                        </div>
                        <h4 className="text-4xl font-black text-secondary tracking-tighter italic">Your map is empty.</h4>
                        <p className="text-secondary/30 text-lg max-w-sm mx-auto mb-12 italic leading-relaxed">Authentic connections are just a message away. Let's find your first Local Buddy.</p>
                        <Button className="px-16 py-6 rounded-[28px] text-[11px] tracking-[0.2em] font-black" onClick={() => window.location.href = '/traveller/buddies'}>
                           EXPLORE LOCAL BUDDIES
                        </Button>
                     </div>
                  )}
               </div>
            </div>
         </main>

         <Footer />
      </div>
   );
};

export default TravelerBookings;