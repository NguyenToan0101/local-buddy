import React, { useState, useEffect } from 'react';
import { Search, Filter, Home, Heart, MessageCircle, Globe, User, Settings, LogOut } from 'lucide-react';
import { matchService, buddyService } from '../../services/api';
import type { Buddy } from '../../services/api';
import Button from '../../components/ui/Button';

const Matches: React.FC = () => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [allBuddies, setAllBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchData, buddyData] = await Promise.all([
          matchService.getAll(),
          buddyService.getAll()
        ]);
        setMatches(matchData);
        setAllBuddies(buddyData);
        if (matchData.length > 0) {
          setSelectedMatchId(matchData[0].id);
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFullMatchInfo = (match: any) => {
    const buddyInfo = allBuddies.find(b => b.id === match.buddyId);
    return { ...match, ...buddyInfo, name: buddyInfo?.name || "Buddy", avatar: buddyInfo?.image };
  };

  const currentMatch = matches.find(m => m.id === selectedMatchId) 
    ? getFullMatchInfo(matches.find(m => m.id === selectedMatchId))
    : null;

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-100 flex flex-col py-8 px-4 transition-all overflow-hidden whitespace-nowrap">
         <div className="flex items-center gap-3 px-2 mb-12">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
               <Heart size={24} className="fill-white" />
            </div>
            <div className="hidden lg:block">
               <h1 className="text-lg font-extrabold text-secondary">Local Buddy</h1>
               <p className="text-[10px] uppercase font-bold text-secondary/40 tracking-widest leading-none">Find your community</p>
            </div>
         </div>

         <nav className="flex-1 space-y-2">
            <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-secondary/40 hover:text-primary hover:bg-surface transition-all group">
               <Home size={24} />
               <span className="hidden lg:block font-bold">Home</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#FFEAE1] text-primary transition-all group shadow-sm">
               <Heart size={24} className="fill-primary" />
               <span className="hidden lg:block font-extrabold">Matches</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-secondary/40 hover:text-primary hover:bg-surface transition-all group">
               <MessageCircle size={24} />
               <span className="hidden lg:block font-bold">Messages</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-secondary/40 hover:text-primary hover:bg-surface transition-all group">
               <Globe size={24} />
               <span className="hidden lg:block font-bold">Explore</span>
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-secondary/40 hover:text-primary hover:bg-surface transition-all group">
               <User size={24} />
               <span className="hidden lg:block font-bold">Profile</span>
            </button>
         </nav>

         <div className="mt-auto space-y-2">
            <div className="mb-6 p-4 bg-surface rounded-[24px] hidden lg:flex items-center gap-3">
               <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden">
                  <img src="https://i.pravatar.cc/100?u=me" alt="me" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-secondary">David Miller</h4>
                  <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-widest">New York, USA</p>
               </div>
               <Settings size={14} className="ml-auto text-secondary/20 cursor-pointer" />
            </div>
            <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500/40 hover:text-red-500 hover:bg-red-50 transition-all group">
               <LogOut size={24} />
               <span className="hidden lg:block font-bold">Sign Out</span>
            </button>
         </div>
      </aside>

      {/* Main Content: Match List */}
      <main className="flex-1 bg-white flex flex-col min-w-0 transition-all">
         <header className="px-12 py-16 border-b border-gray-100 flex flex-col md:row justify-between items-start md:items-center gap-10">
            <div className="space-y-2">
               <h2 className="heading-section">Your Matches</h2>
               <p className="text-secondary/30 font-black uppercase tracking-widest text-xs">You have 4 new connections this week</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-80 group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search matches..." 
                    className="input-base pl-16 py-5"
                  />
               </div>
               <button className="w-16 h-16 bg-surface-dark border-2 border-transparent rounded-[24px] flex items-center justify-center text-secondary/30 hover:text-primary hover:border-primary/20 transition-all">
                  <Filter size={24} />
               </button>
            </div>
         </header>

         <div className="px-12 py-8 border-b border-gray-100 flex gap-4 overflow-x-auto scrollbar-hide">
            {['All Matches', 'New (4)', 'Near Me', 'Active Recently', 'Coffee Lovers'].map((filter, i) => (
               <button key={filter} className={`px-8 py-3 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-primary text-white shadow-primary-glow' : 'bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10'}`}>
                  {filter}
               </button>
            ))}
         </div>

         <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {loading ? (
               <div className="text-center py-20 italic font-bold text-secondary/20">Finding your matches...</div>
            ) : matches.length === 0 ? (
               <div className="text-center py-20 italic font-bold text-secondary/20">No matches yet. Keep exploring!</div>
            ) : matches.map(match => {
               const fullInfo = getFullMatchInfo(match);
               return (
                  <div 
                  key={match.id}
                  onClick={() => setSelectedMatchId(match.id)}
                  className={`group p-10 rounded-[64px] border-2 cursor-pointer transition-all flex flex-col sm:row items-center gap-10 ${selectedMatchId === match.id ? 'bg-white border-primary/20 shadow-premium' : 'bg-white border-gray-50 hover:border-surface-dark hover:shadow-xl'}`}
                  >
                  <div className="relative shrink-0">
                     <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-primary-soft shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <img src={fullInfo.avatar} alt={fullInfo.name} className="w-full h-full rounded-full object-cover border-4 border-white" />
                     </div>
                     <div className="absolute bottom-1 right-2 w-6 h-6 bg-accent-green rounded-full border-4 border-white shadow-sm"></div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                     <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-secondary tracking-tight">{fullInfo.name}</h3>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/10">{match.time}</span>
                     </div>
                     <p className="text-secondary/30 italic font-bold text-lg leading-relaxed truncate group-hover:text-secondary group-hover:not-italic transition-all">"{match.snippet}"</p>
                     <div className="flex gap-3 pt-2">
                        {match.status && (
                           <span className="px-5 py-2 bg-accent-green/5 text-accent-green text-[10px] font-black rounded-full uppercase tracking-widest border border-accent-green/10">
                              {match.status}
                           </span>
                        )}
                        {match.distance && (
                           <span className="px-5 py-2 bg-primary/5 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/10">
                              {match.distance}
                           </span>
                        )}
                     </div>
                  </div>
               </div>
               );
            })}
         </div>
      </main>

      {/* Right Column: Match Preview */}
      <aside className="hidden xl:flex w-[450px] bg-white border-l border-gray-100 flex-col overflow-y-auto">
         {currentMatch ? (
            <div className="p-16 space-y-16">
               {/* Minimal Profile */}
               <div className="text-center space-y-10">
                  <div className="relative inline-block">
                     <div className="w-56 h-56 rounded-[64px] bg-gradient-to-br from-primary/10 to-transparent p-1 shadow-premium">
                        <div className="w-full h-full rounded-[60px] overflow-hidden border-8 border-white shadow-inner">
                           <img src={currentMatch.avatar} alt={currentMatch.name} className="w-full h-full object-cover" />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <h2 className="heading-section tracking-tighter">{currentMatch.name}</h2>
                     <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
                        <p className="text-[10px] font-black text-accent-green uppercase tracking-[0.4em]">Active Now</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/20">Bio</h3>
                  <p className="text-lg font-bold leading-relaxed text-secondary/60 italic">
                     "{currentMatch.description || "No bio available"}"
                  </p>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary/20">Interests</h3>
                  <div className="flex flex-wrap gap-3">
                     {currentMatch.interests?.map((interest: string) => (
                        <span key={interest} className="px-6 py-3 bg-surface border-2 border-white text-secondary/40 text-xs font-black rounded-2xl shadow-sm uppercase tracking-widest">
                           {interest}
                        </span>
                     )) || <span className="text-secondary/20 italic">No interests listed</span>}
                  </div>
               </div>

               <div className="pt-12 space-y-6">
                  <Button size="lg" className="w-full py-8 text-lg shadow-primary-glow">Message {currentMatch.name.split(' ')[0]}</Button>
                  <button className="w-full py-6 rounded-[32px] border-2 border-gray-50 text-secondary/10 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all group">
                     <Heart size={28} className="fill-current group-hover:scale-125 transition-transform duration-500" />
                  </button>
               </div>
            </div>
         ) : (
            <div className="flex-1 flex items-center justify-center text-secondary/20 italic font-bold">Select a match to preview</div>
         )}
      </aside>

    </div>
  );
};

export default Matches;
