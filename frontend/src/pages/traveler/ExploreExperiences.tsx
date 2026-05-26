import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, ChevronDown, Filter, ChevronRight, Compass, Clock, Globe, Check } from 'lucide-react';
import { experienceService } from '../../services/api';
import type { Experience } from '../../services/api';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import ExperienceCard from '../../components/features/ExperienceCard';
import Footer from '../../components/Footer';

const ExploreExperiences: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Foodie']);
  const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
  const [rating, setRating] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const data = await experienceService.getAll();
        setExperiences(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching experiences:", error);
        setExperiences([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExperiences();

    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (durationRef.current && !durationRef.current.contains(event.target as Node)) {
        setIsDurationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleDuration = (duration: string) => {
    setSelectedDuration(prev => 
      prev.includes(duration) ? prev.filter(d => d !== duration) : [...prev, duration]
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <Navbar />
      
      <main className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 pt-32 pb-20 space-y-12">
        
        {/* Banner Section */}
        <div className="bg-white rounded-[64px] p-16 shadow-premium border border-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
           
           <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-px bg-primary/30"></div>
                 <div className="flex items-center gap-2 text-primary">
                    <Compass size={18} className="animate-spin-slow" strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Explore Mode</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <h1 className="text-6xl md:text-7xl font-black tracking-tighter italic">
                    <span className="text-secondary">Recent</span> <span className="text-primary not-italic">Experiences</span>
                 </h1>
              </div>
           </div>
        </div>

        {/* PROPERLY ALIGNED Horizontal Filter Bar */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-full p-2.5 shadow-premium border border-gray-50 flex items-center gap-3 sticky top-28 z-40 max-w-7xl mx-auto h-20">
           
           {/* Search Input - Strict Height */}
           <div className="relative flex-1 group min-w-[240px] h-full">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-all z-10">
                 <Search size={22} strokeWidth={2.5} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH EXPERIENCES, TOPICS..." 
                className="w-full h-full bg-surface-dark border-2 border-transparent focus:border-primary/10 rounded-full pl-16 pr-6 font-black text-[11px] uppercase tracking-widest text-secondary outline-none transition-all placeholder:text-secondary/20"
              />
           </div>

           <div className="h-10 w-px bg-gray-100 hidden lg:block"></div>

           {/* Category Dropdown - Strict Height */}
           <div className="relative h-full" ref={categoryRef}>
              <button 
                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsDurationOpen(false); }}
                className={`h-full flex items-center gap-5 px-10 rounded-full border border-transparent transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${selectedTags.length > 0 ? 'bg-primary/5 text-primary shadow-sm' : 'bg-surface-dark text-secondary/40 hover:bg-gray-100'}`}
              >
                 <Filter size={18} strokeWidth={2.5} className={selectedTags.length > 0 ? 'text-primary' : 'text-secondary/30'} />
                 <span>{selectedTags.length > 0 ? `${selectedTags.length} CATEGORIES` : 'CATEGORIES'}</span>
                 <ChevronDown size={16} className={`transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryOpen && (
                 <div className="absolute top-full mt-4 left-0 w-72 bg-white rounded-[32px] shadow-premium border border-gray-50 p-6 space-y-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 gap-1">
                       {['Foodie', 'History', 'Nighlife', 'Art', 'Nature', 'Culture', 'Photography', 'Discovery'].map(tag => (
                          <button 
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTags.includes(tag) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-secondary/40'}`}
                          >
                             {tag}
                             {selectedTags.includes(tag) && <Check size={16} strokeWidth={3} />}
                          </button>
                       ))}
                    </div>
                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center px-2">
                       <button onClick={() => setSelectedTags([])} className="text-[9px] font-black uppercase tracking-widest text-secondary/30 hover:text-red-500 transition-colors">Clear all</button>
                       <button onClick={() => setIsCategoryOpen(false)} className="text-[9px] font-black uppercase tracking-widest text-primary">Apply</button>
                    </div>
                 </div>
              )}
           </div>

           <div className="h-10 w-px bg-gray-100 hidden lg:block"></div>

           {/* Duration Dropdown - Strict Height */}
           <div className="relative h-full" ref={durationRef}>
              <button 
                onClick={() => { setIsDurationOpen(!isDurationOpen); setIsCategoryOpen(false); }}
                className={`h-full flex items-center gap-5 px-10 rounded-full border border-transparent transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${selectedDuration.length > 0 ? 'bg-primary/5 text-primary shadow-sm' : 'bg-surface-dark text-secondary/40 hover:bg-gray-100'}`}
              >
                 <Clock size={18} strokeWidth={2.5} className={selectedDuration.length > 0 ? 'text-primary' : 'text-secondary/30'} />
                 <span>{selectedDuration.length > 0 ? selectedDuration[0].toUpperCase() : 'DURATION'}</span>
                 <ChevronDown size={16} className={`transition-transform duration-300 ${isDurationOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDurationOpen && (
                 <div className="absolute top-full mt-4 left-0 w-64 bg-white rounded-[32px] shadow-premium border border-gray-50 p-6 space-y-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 gap-1">
                       {['< 2 Hours', 'Half Day', 'Full Day', 'Multi-day'].map(duration => (
                          <button 
                            key={duration}
                            onClick={() => toggleDuration(duration)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDuration.includes(duration) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-secondary/40'}`}
                          >
                             {duration}
                             {selectedDuration.includes(duration) && <Check size={16} strokeWidth={3} />}
                          </button>
                       ))}
                    </div>
                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end items-center px-2">
                       <button onClick={() => setIsDurationOpen(false)} className="text-[9px] font-black uppercase tracking-widest text-primary">Done</button>
                    </div>
                 </div>
              )}
           </div>

           <div className="h-10 w-px bg-gray-100 hidden lg:block"></div>

           {/* Rating Filter - Strict Height */}
           <div className="h-full bg-surface-dark px-10 rounded-full flex items-center gap-8 border border-transparent hover:border-gray-100 transition-all group">
              <div className="flex items-center gap-1.5">
                 {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-125">
                       <Star size={18} className={star <= rating ? 'fill-primary text-primary' : 'text-secondary/10'} />
                    </button>
                 ))}
              </div>
              <span className="text-[11px] font-black text-secondary tracking-widest whitespace-nowrap">{rating}.0+</span>
           </div>

           {/* SEARCH Button - Precise height and shadow to match sample */}
           <button className="h-full bg-primary text-white px-14 rounded-full font-black text-[13px] uppercase tracking-[0.25em] shadow-primary-glow flex items-center justify-center hover:scale-[1.03] active:scale-95 transition-all outline-none">
              SEARCH
           </button>
        </div>

        {/* Experience Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
           {loading ? (
             Array(10).fill(0).map((_, i) => (
               <div key={i} className="animate-pulse bg-white rounded-[48px] h-[500px] border border-gray-50 shadow-sm"></div>
             ))
           ) : (
             experiences.map(exp => (
               <div key={exp.id} className="transition-all hover:scale-[1.02]">
                  <ExperienceCard experience={exp} />
               </div>
             ))
           )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 pt-20">
           <button className="w-16 h-16 flex items-center justify-center rounded-full bg-white border border-gray-100 text-secondary/40 hover:text-primary hover:border-primary transition-all rotate-180 hover:shadow-premium group">
              <ChevronRight size={24} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
           </button>
           <div className="flex gap-4">
              {[1, 2, 3].map(page => (
                 <button key={page} className={`w-16 h-16 flex items-center justify-center rounded-[24px] font-black text-base transition-all ${page === 1 ? 'bg-primary text-white shadow-primary-glow scale-110' : 'bg-white text-secondary/40 hover:text-secondary border border-gray-100'}`}>
                    {page}
                 </button>
              ))}
              <span className="flex items-center text-secondary/20 font-black px-2 tracking-[0.5em] text-xl">...</span>
           </div>
           <button className="w-16 h-16 flex items-center justify-center rounded-full bg-white border border-gray-100 text-secondary/40 hover:text-primary hover:border-primary transition-all hover:shadow-premium group">
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
           </button>
        </div>
      </main>

      <Footer />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default ExploreExperiences;
