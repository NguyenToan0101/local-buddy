import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, Star, ChevronDown, Filter, ChevronRight, Users, Globe, Check } from 'lucide-react';
import { buddyService } from '../../services/api';
import type { Buddy } from '../../services/api';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import BuddyCard from '../../components/features/BuddyCard';
import Footer from '../../components/Footer';

const ITEMS_PER_PAGE = 10;

const ExploreBuddies: React.FC = () => {
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Hiking', 'Art']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [rating, setRating] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBuddies = async () => {
      try {
        const data = await buddyService.getAll();
        setBuddies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching buddies:", error);
        setBuddies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBuddies();

    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const filteredBuddies = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return buddies.filter((buddy) => {
      const searchableText = [
        buddy.name,
        buddy.location,
        buddy.description,
        ...(buddy.tags || []),
        ...(buddy.interests || []),
        ...(buddy.languages || []),
      ].join(' ').toLowerCase();

      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const matchesInterests = selectedInterests.length === 0 || selectedInterests.some((interest) => {
        const normalizedInterest = interest.toLowerCase();
        return (buddy.tags || []).some((tag) => tag.toLowerCase() === normalizedInterest)
          || (buddy.interests || []).some((item) => item.toLowerCase() === normalizedInterest);
      });
      const matchesLanguages = selectedLanguages.length === 0 || selectedLanguages.some((language) =>
        (buddy.languages || []).some((buddyLanguage) => buddyLanguage.toLowerCase() === language.toLowerCase())
      );
      const matchesRating = Number(buddy.rating || 0) >= rating;

      return matchesSearch && matchesInterests && matchesLanguages && matchesRating;
    });
  }, [buddies, rating, searchQuery, selectedInterests, selectedLanguages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rating, searchQuery, selectedInterests, selectedLanguages]);

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredBuddies.length / ITEMS_PER_PAGE));
    setTotalPages(nextTotalPages);
    setCurrentPage((page) => Math.min(page, nextTotalPages));
  }, [filteredBuddies.length]);

  const paginatedBuddies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBuddies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredBuddies]);

  const goToPreviousPage = () => {
    setCurrentPage((page) => Math.max(1, page - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
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
                    <Users size={18} strokeWidth={3} />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Community</span>
                 </div>
              </div>
              <div className="space-y-2">
                 <h1 className="text-6xl md:text-7xl font-black tracking-tighter italic">
                    <span className="text-secondary">Explore</span> <span className="text-primary not-italic">Buddies</span>
                 </h1>
                 <p className="text-secondary/40 font-bold text-xl tracking-tight">
                    Found <span className="text-secondary font-black">128 local guides</span> ready to connect
                 </p>
              </div>
           </div>
        </div>

        {/* PROPERLY ALIGNED Horizontal Filter Bar */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-full p-4 shadow-premium border border-gray-50 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 sticky top-28 z-40 max-w-7xl mx-auto">
           
           {/* Search Input - Using flex-1 and fixed height to fill container */}
           <div className="relative flex-1 group min-w-[240px] h-14">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-all z-10">
                 <Search size={22} strokeWidth={2.5} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH LOCATION, NAME..." 
                className="w-full h-full bg-surface-dark border-2 border-transparent focus:border-primary/10 rounded-full pl-14 pr-6 font-black text-[11px] uppercase tracking-widest text-secondary outline-none transition-all placeholder:text-secondary/20"
              />
           </div>

           <div className="h-10 w-px bg-gray-100 hidden lg:block"></div>

           {/* Category Dropdown - Strict Height */}
           <div className="relative h-14" ref={categoryRef}>
              <button 
                onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsLanguageOpen(false); }}
                className={`h-14 flex items-center gap-4 px-5 sm:px-10 rounded-full border border-transparent transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${selectedInterests.length > 0 ? 'bg-primary/5 text-primary shadow-sm' : 'bg-surface-dark text-secondary/40 hover:bg-gray-100'}`}
              >
                 <Filter size={18} strokeWidth={2.5} className={selectedInterests.length > 0 ? 'text-primary' : 'text-secondary/30'} />
                 <span>{selectedInterests.length > 0 ? `${selectedInterests.length} CATEGORIES` : 'CATEGORIES'}</span>
                 <ChevronDown size={16} className={`transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryOpen && (
                 <div className="absolute top-full mt-4 left-0 w-72 bg-white rounded-[32px] shadow-premium border border-gray-50 p-6 space-y-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 gap-1">
                       {['Foodie', 'History', 'Nighlife', 'Hiking', 'Art', 'Shopping', 'Nature', 'Culture'].map(interest => (
                          <button 
                            key={interest}
                            onClick={() => toggleInterest(interest)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedInterests.includes(interest) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-secondary/40'}`}
                          >
                             {interest}
                             {selectedInterests.includes(interest) && <Check size={16} strokeWidth={3} />}
                          </button>
                       ))}
                    </div>
                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center px-2">
                       <button onClick={() => setSelectedInterests([])} className="text-[9px] font-black uppercase tracking-widest text-secondary/30 hover:text-red-500 transition-colors">Clear all</button>
                       <button onClick={() => setIsCategoryOpen(false)} className="text-[9px] font-black uppercase tracking-widest text-primary">Apply</button>
                    </div>
                 </div>
              )}
           </div>

           <div className="h-10 w-px bg-gray-100 hidden lg:block"></div>

           {/* Language Dropdown - Strict Height */}
           <div className="relative h-14" ref={languageRef}>
              <button 
                onClick={() => { setIsLanguageOpen(!isLanguageOpen); setIsCategoryOpen(false); }}
                className={`h-14 flex items-center gap-4 px-5 sm:px-10 rounded-full border border-transparent transition-all font-black text-[11px] uppercase tracking-widest whitespace-nowrap ${selectedLanguages.length > 0 ? 'bg-primary/5 text-primary shadow-sm' : 'bg-surface-dark text-secondary/40 hover:bg-gray-100'}`}
              >
                 <Globe size={18} strokeWidth={2.5} className={selectedLanguages.length > 0 ? 'text-primary' : 'text-secondary/30'} />
                 <span>{selectedLanguages.length > 0 ? selectedLanguages[0].toUpperCase() : 'LANGUAGE'}</span>
                 <ChevronDown size={16} className={`transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageOpen && (
                 <div className="absolute top-full mt-4 left-0 w-64 bg-white rounded-[32px] shadow-premium border border-gray-50 p-6 space-y-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 gap-1">
                       {['English', 'Spanish', 'Vietnamese', 'French', 'Japanese', 'Korean'].map(lang => (
                          <button 
                            key={lang}
                            onClick={() => toggleLanguage(lang)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedLanguages.includes(lang) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-secondary/40'}`}
                          >
                             {lang}
                             {selectedLanguages.includes(lang) && <Check size={16} strokeWidth={3} />}
                          </button>
                       ))}
                    </div>
                    <div className="pt-4 mt-2 border-t border-gray-100 flex justify-end items-center px-2">
                       <button onClick={() => setIsLanguageOpen(false)} className="text-[9px] font-black uppercase tracking-widest text-primary">Done</button>
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

        {/* Buddy Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
           {loading ? (
             Array(10).fill(0).map((_, i) => (
               <div key={i} className="animate-pulse bg-white rounded-[48px] h-[500px] border border-gray-50 shadow-sm"></div>
             ))
           ) : (
             paginatedBuddies.map(buddy => (
                <div key={buddy.id} className="flex flex-col group h-full transition-all hover:scale-[1.02]">
                   <BuddyCard 
                     {...buddy}
                     id={String(buddy.id)}
                     imageUrl={buddy.image}
                   />
                   <div className="mt-4 flex gap-3 px-3 pb-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                      <Button variant="ghost" className="flex-1 border-2 border-gray-100 py-4 text-[10px] font-black uppercase tracking-widest hover:border-primary/20 hover:text-primary transition-all rounded-2xl">Profile</Button>
                      <Button className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest shadow-primary-glow rounded-2xl">Connect</Button>
                   </div>
                </div>
             ))
           )}
        </div>

        {/* Enhanced Pagination */}
        <div className="flex justify-center items-center gap-4 pt-20">
           <button
             onClick={goToPreviousPage}
             disabled={currentPage === 1}
             className={`w-16 h-16 flex items-center justify-center rounded-full bg-white border border-gray-100 transition-all rotate-180 group ${currentPage === 1 ? 'text-secondary/10 cursor-not-allowed' : 'text-secondary/40 hover:text-primary hover:border-primary hover:shadow-premium'}`}
           >
              <ChevronRight size={24} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
           </button>
           <div className="flex gap-4 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                 <button
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={`w-16 h-16 flex items-center justify-center rounded-[24px] font-black text-base transition-all ${page === currentPage ? 'bg-primary text-white shadow-primary-glow scale-110' : 'bg-white text-secondary/40 hover:text-secondary border border-gray-100'}`}
                 >
                    {page}
                 </button>
              ))}
           </div>
           <button
             onClick={goToNextPage}
             disabled={currentPage === totalPages}
             className={`w-16 h-16 flex items-center justify-center rounded-full bg-white border border-gray-100 transition-all group ${currentPage === totalPages ? 'text-secondary/10 cursor-not-allowed' : 'text-secondary/40 hover:text-primary hover:border-primary hover:shadow-premium'}`}
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

export default ExploreBuddies;
