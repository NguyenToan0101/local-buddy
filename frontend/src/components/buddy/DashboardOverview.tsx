import React from 'react';
import { Wallet, Star, Clock, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

interface DashboardOverviewProps {
  stats: any[];
  upcomingTrips: any[];
  chats: any[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, upcomingTrips, chats }) => (
  <div className="space-y-12">
    {/* Quick Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 flex flex-col justify-between hover:shadow-premium transition-all group min-h-[160px]">
          <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-[22px] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
            <stat.icon size={28} />
          </div>
          <div>
            <div className="flex justify-between items-end">
               <div>
                  <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-secondary tracking-tight">{stat.value}</p>
               </div>
               {stat.label === "Wallet Balance" && (
                 <button className="mb-1 px-4 py-2 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all border-none">
                   Withdraw
                 </button>
               )}
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
      {/* Booking Preview */}
      <div className="xl:col-span-5 space-y-10">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-secondary tracking-tight">Recent Activity</h3>
          <Link to="trips" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All</Link>
        </div>
        <div className="space-y-6">
          {upcomingTrips.slice(0, 2).map((trip) => (
            <Link key={trip.id} to={`trips/${trip.id}`} className="block">
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 group hover:shadow-premium transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full"></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{trip.traveler || 'Mystery Traveler'}</p>
                  <h4 className="text-xl font-black text-secondary tracking-tight group-hover:text-primary transition-colors mb-4">{trip.activity}</h4>
                  <div className="flex items-center gap-6 text-secondary/40 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary" /> {trip.date}
                    </div>
                    <div className="bg-primary/5 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-center">{trip.status || 'Confirmed'}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Messages Preview */}
      <div className="xl:col-span-7">
        <div className="bg-white rounded-[48px] p-10 shadow-premium border border-gray-50 flex flex-col items-center justify-center text-center space-y-6 h-full min-h-[400px] relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary relative z-10 group-hover:rotate-12 transition-transform duration-500">
              <MessageSquare size={40} />
           </div>
           <div className="max-w-md relative z-10 text-center">
              <h3 className="text-3xl font-black text-secondary tracking-tight mb-3">Connect & Close</h3>
              <p className="text-secondary/40 font-bold text-sm leading-relaxed px-4">
                You have {chats.length} active conversations. Use the <b>Sales Center</b> to send custom offers and get paid instantly.
              </p>
           </div>
           <Link to="messages" className="relative z-10">
              <Button className="bg-primary text-white pl-10 pr-8 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-primary-glow border-none flex items-center gap-3 group/btn">
                Open Sales Center
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </Button>
           </Link>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardOverview;
