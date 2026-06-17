import React from 'react';
import { Wallet, Star, Clock, Calendar, MessageSquare, ArrowRight, ArrowUpRight, Compass, ShieldAlert, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface DashboardOverviewProps {
  stats: any[];
  upcomingTrips: any[];
  chats: any[];
}

const InitialAvatar: React.FC<{ name?: string }> = ({ name }) => (
  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-black uppercase text-primary">
    {(name || 'TR').slice(0, 2)}
  </div>
);

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, upcomingTrips, chats }) => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-secondary via-[#1E293B] to-secondary rounded-[32px] p-8 text-white shadow-lg border border-white/5">
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-100px] left-[-100px] w-[250px] h-[250px] bg-secondary/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-primary">
            <Sparkles size={12} className="text-primary fill-primary" /> Active Hosting Mode
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Welcome back, <span className="text-primary italic font-bold">{user?.name || 'Buddy'}</span>!
            </h2>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium">
              You have {upcomingTrips.filter(t => t.status === 'CONFIRMED' || t.status === 'UPCOMING').length} upcoming sessions. Make sure your calendar availability is up to date to receive more bookings.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "My Schedule", path: "schedule", icon: Clock, desc: "Slots & Calendar" },
          { label: "Messages & Offers", path: "messages", icon: MessageSquare, desc: "Custom Offers" },
          { label: "My Wallet", path: "earnings", icon: Wallet, desc: "Payouts & Logs" },
          { label: "My Settings", path: "settings", icon: Settings, desc: "Verification & Bio" }
        ].map((action, idx) => (
          <Link 
            key={idx} 
            to={action.path}
            className="p-4 bg-white border border-gray-100/80 rounded-2xl flex flex-col justify-between hover:border-primary/20 hover:shadow-premium transition-all duration-200 group hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 bg-primary/5 group-hover:bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-colors">
              <action.icon size={18} />
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-secondary leading-none">{action.label}</p>
              <p className="text-[8px] font-medium text-secondary/40 uppercase tracking-widest mt-1">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100/80 flex flex-col justify-between hover:shadow-premium transition-all duration-200 group min-h-[140px]">
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm`}>
                <stat.icon size={22} />
              </div>
              {stat.label === "Wallet Balance" && (
                <button className="px-4 py-2 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all border-none">
                  Withdraw Funds
                </button>
              )}
            </div>
            <div className="mt-4">
              <p className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-2xl sm:text-3xl font-black text-secondary tracking-tight">{stat.value}</p>
                {stat.label === "Avg Rating" && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="fill-amber-400 text-amber-400" />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Activity & Message Callout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Booking Preview */}
        <div className="xl:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-secondary tracking-tight">Recent Sessions</h3>
              <p className="text-[8px] font-bold text-secondary/40 uppercase tracking-widest mt-0.5">Your most recent customer bookings</p>
            </div>
            <Link to="trips" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
              View All Trips <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingTrips.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center space-y-3">
                <Calendar size={28} className="text-secondary/15 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/30">No upcoming sessions</p>
              </div>
            ) : (
              upcomingTrips.slice(0, 3).map((trip) => (
                <Link key={trip.id} to={`trips/${trip.id}`} className="block">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 group hover:shadow-premium hover:border-primary/10 transition-all duration-200">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-surface-dark overflow-hidden ring-2 ring-primary/5 shrink-0">
                          {trip.travelerAvatar ? (
                            <img src={trip.travelerAvatar} alt={trip.traveler || 'Traveler'} className="w-full h-full object-cover" />
                          ) : (
                            <InitialAvatar name={trip.traveler} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-secondary text-sm truncate leading-snug group-hover:text-primary transition-colors">
                            {trip.activity || trip.title}
                          </h4>
                          <p className="text-[10px] font-bold text-secondary/40 mt-0.5 uppercase tracking-wide">
                            Traveler: <span className="text-secondary italic">{trip.traveler || 'Explorer'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          trip.status === 'CONFIRMED' || trip.status === 'UPCOMING' 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {trip.status}
                        </span>
                        <p className="text-xs font-black text-secondary mt-1.5">${trip.price}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Messages Preview */}
        <div className="xl:col-span-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/80 flex flex-col justify-between h-full min-h-[320px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="space-y-6">
              <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
                <MessageSquare size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-secondary tracking-tight">Messages & Offers</h3>
                <p className="text-xs text-secondary/40 font-bold leading-relaxed max-w-sm">
                  Send custom pricing, itinerary duration adjustments, and securely close bookings with traveler requests. You have {chats.length} active threads.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.2em]">Chat & Negotiate</p>
              <Link to="messages">
                <Button className="bg-primary text-white pl-6 pr-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-primary-glow border-none flex items-center gap-2 group/btn">
                  Open Chats
                  <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dummy star icon replacement to prevent compilation crash if React.createElement does not import it directly
const StarIcon: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = '' }) => (
  <Star size={size} className={className} />
);

// Settings icon fallback
const Settings: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export default DashboardOverview;
