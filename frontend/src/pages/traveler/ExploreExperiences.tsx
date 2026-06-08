import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, ChevronDown, Filter, ChevronRight, Compass, Clock, Globe, Check } from 'lucide-react';
import { experienceService } from '../../services/api';
import type { Experience } from '../../services/api';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import ExperienceCard from '../../components/features/ExperienceCard';
import Footer from '../../components/Footer';

const ITEMS_PER_PAGE = 10;

const ExploreExperiences: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Foodie']);
  const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
  const [rating, setRating] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  useEffect(() => {
    setCurrentPage(0);
  }, [rating, searchQuery, selectedDuration, selectedTags]);

  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true);
      try {
        const data = await experienceService.search({
          searchQuery,
          tags: selectedTags,
          duration: selectedDuration,
          rating,
          page: currentPage,
          size: ITEMS_PER_PAGE,
        });
        setExperiences(Array.isArray(data.content) ? data.content : []);
        setTotalPages(Math.max(1, data.totalPages || 1));
        setTotalElements(data.totalElements || 0);
        if (typeof data.number === 'number' && data.number !== currentPage) {
          setCurrentPage(data.number);
        }
      } catch (error) {
        console.error("Error fetching experiences:", error);
        setExperiences([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [currentPage, rating, searchQuery, selectedDuration, selectedTags]);

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

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(0, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages - 1, page + 1));
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
                 <p className="text-secondary/40 font-bold text-xl tracking-tight">
                    Found <span className="text-secondary font-black">{totalElements} experiences</span>
                 </p>
              </div>
           </div>
        </div>

        {/* PROPERLY ALIGNED Horizontal Filter Bar */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-full p-4 shadow-premium border border-gray-50 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 sticky top-28 z-40 max-w-7xl mx-auto">
           
           {/* Search Input - Strict Height */}
           <div className="relative flex-1 group min-w-[240px] h-14">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-all z-10">
                 <Search size={22} strokeWidth={2.5} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH EXPERIENCES, TOPICS..." 
                className="w-full h-full bg-surface-dark border-2 border-transparent focus:border-primary/10 rounded-full pl-14 pr-6 font-black text-[11px] uppercase tracking-widest text-secondary outline-none transition-all placeholder:text-secondary/20"
              />
           </div>

           <div className="h-10 w-px bg-gray-100 hidden lg:block"></div>

           {/* Category Dropdown - Strict Height */}
           <div className="relative h-14" ref={categoryRef}>
              <button 
                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsDurationOpen(false); }}
                className={`h-14 flex items-center gap-4 px-5 sm:px-10 rounded-full border border-transparent transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${selectedTags.length > 0 ? 'bg-primary/5 text-primary shadow-sm' : 'bg-surface-dark text-secondary/40 hover:bg-gray-100'}`}
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
           <div className="relative h-14" ref={durationRef}>
              <button 
                onClick={() => { setIsDurationOpen(!isDurationOpen); setIsCategoryOpen(false); }}
                className={`h-14 flex items-center gap-4 px-5 sm:px-10 rounded-full border border-transparent transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${selectedDuration.length > 0 ? 'bg-primary/5 text-primary shadow-sm' : 'bg-surface-dark text-secondary/40 hover:bg-gray-100'}`}
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
           <div className="h-14 bg-surface-dark px-5 sm:px-10 rounded-full flex items-center gap-5 border border-transparent hover:border-gray-100 transition-all group">
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
           <button className="h-14 bg-primary text-white px-8 sm:px-14 rounded-full font-black text-[13px] uppercase tracking-[0.25em] shadow-primary-glow flex items-center justify-center hover:scale-[1.03] active:scale-95 transition-all outline-none w-full sm:w-auto">
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
           <button
             onClick={goToPreviousPage}
             disabled={currentPage === 0}
             className={`w-16 h-16 flex items-center justify-center rounded-full bg-white border border-gray-100 transition-all rotate-180 group ${currentPage === 0 ? 'text-secondary/10 cursor-not-allowed' : 'text-secondary/40 hover:text-primary hover:border-primary hover:shadow-premium'}`}
           >
              <ChevronRight size={24} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
           </button>
           <div className="flex gap-4 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, index) => index).map(page => (
                 <button
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={`w-16 h-16 flex items-center justify-center rounded-[24px] font-black text-base transition-all ${page === currentPage ? 'bg-primary text-white shadow-primary-glow scale-110' : 'bg-white text-secondary/40 hover:text-secondary border border-gray-100'}`}
                 >
                    {page + 1}
                 </button>
              ))}
           </div>
           <button
             onClick={goToNextPage}
             disabled={currentPage >= totalPages - 1}
             className={`w-16 h-16 flex items-center justify-center rounded-full bg-white border border-gray-100 transition-all group ${currentPage >= totalPages - 1 ? 'text-secondary/10 cursor-not-allowed' : 'text-secondary/40 hover:text-primary hover:border-primary hover:shadow-premium'}`}
           >
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
