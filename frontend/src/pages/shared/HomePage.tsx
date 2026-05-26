import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ChevronLeft, ChevronRight, Star, Clock, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { buddyService, experienceService, bookingService } from '../../services/api';
import { QrCode, X, Shield } from 'lucide-react';
import type { Buddy, Experience } from '../../services/api';
import Navbar from '../../components/Navbar';
import BuddyCard from '../../components/features/BuddyCard';
import ExperienceCard from '../../components/features/ExperienceCard';
import Footer from '../../components/Footer';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const buddyScrollRef = useRef<HTMLDivElement>(null);
  const experienceScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [buddiesData, experiencesData] = await Promise.all([
          buddyService.getAll(),
          experienceService.getAll()
        ]);

        // Smart Sorting Logic
        const sortData = (data: any[]) => {
          if (!user) return data;
          
          return [...data].sort((a, b) => {
            // 1. Same location priority
            const aInLocation = a.location?.toLowerCase().includes(user.location?.toLowerCase() || '');
            const bInLocation = b.location?.toLowerCase().includes(user.location?.toLowerCase() || '');
            if (aInLocation && !bInLocation) return -1;
            if (!aInLocation && bInLocation) return 1;

            // 2. Matching interests priority
            const aMatchInterests = a.tags?.some((tag: string) => user.interests?.includes(tag)) || false;
            const bMatchInterests = b.tags?.some((tag: string) => user.interests?.includes(tag)) || false;
            if (aMatchInterests && !bMatchInterests) return -1;
            if (!aMatchInterests && bMatchInterests) return 1;

            return 0;
          });
        };

        setBuddies(sortData(buddiesData));
        setExperiences(sortData(experiencesData || []));
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Shorter loading for smoother feel
      }
    };

    fetchData();
  }, [user]);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.8;
      const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      ref.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const SkeletonCard = () => (
    <div className="w-[264px] flex-shrink-0 h-[450px] bg-white rounded-[48px] animate-pulse border border-gray-50 p-6 space-y-6">
      <div className="w-full h-2/3 bg-gray-100 rounded-[36px]"></div>
      <div className="space-y-3">
        <div className="h-6 bg-gray-100 rounded-full w-2/3"></div>
        <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-4 bg-gray-100 rounded-full w-12"></div>
        <div className="h-4 bg-gray-100 rounded-full w-12"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto space-y-24">
        
        {/* Header & Greetings */}
        <section className="space-y-12 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-secondary tracking-tight transition-all duration-700 opacity-0 translate-y-4" style={{ opacity: 1, transform: 'translateY(0)' }}>
              Hi {user?.name.split(' ')[0] || 'Traveler'}, <br/>
              <span className="text-primary italic">explore {user?.location?.split(',')[0] || 'Vietnam'} today?</span>
            </h1>
          </div>

          <div className="relative max-w-2xl group mx-auto">
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors">
                <Search size={24} />
             </div>
             <input 
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search buddies, experiences, or places..."
               className="w-full bg-white border-2 border-transparent focus:border-primary/10 rounded-[32px] py-6 pl-16 pr-8 font-bold text-lg text-secondary shadow-premium focus:shadow-premium-hover transition-all outline-none placeholder:text-secondary/10"
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button className="bg-primary text-white p-4 rounded-2xl shadow-primary-glow hover:scale-105 active:scale-95 transition-all">
                   <ArrowRight size={20} strokeWidth={3} />
                </button>
             </div>
          </div>
        </section>

        {/* Section 1: Featured Buddies */}
        <section className="space-y-8 relative group/section">
          <div className="flex justify-between items-end">
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-secondary tracking-tight">Featured <span className="text-primary italic">Buddies</span></h2>
                <p className="text-secondary/40 font-bold">Recommended based on your interests and location.</p>
             </div>
             <div>
                <Link to="/traveller/buddies" className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors">View all</Link>
             </div>
          </div>

          <div className="relative">
            {/* Side Navigation Arrows */}
            <button 
              onClick={() => scroll(buddyScrollRef, 'left')} 
              className="absolute -left-7 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/20 hover:shadow-premium shadow-lg transition-all active:scale-90 lg:flex items-center justify-center hidden opacity-0 group-hover/section:opacity-100 translate-x-4 group-hover/section:translate-x-0"
            >
               <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => scroll(buddyScrollRef, 'right')} 
              className="absolute -right-7 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/20 hover:shadow-premium shadow-lg transition-all active:scale-90 lg:flex items-center justify-center hidden opacity-0 group-hover/section:opacity-100 -translate-x-4 group-hover/section:translate-x-0"
            >
               <ChevronRight size={28} strokeWidth={2.5} />
            </button>

            <div 
              ref={buddyScrollRef} 
              className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar px-2"
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {loading ? (
                Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              ) : buddies.length > 0 ? (
                buddies.map((buddy) => (
                  <div key={buddy.id} className="w-[264px] flex-shrink-0 snap-start transition-transform hover:-translate-y-2 duration-500">
                     <BuddyCard
                        id={buddy.id}
                        name={buddy.name}
                        location={buddy.location}
                        rating={buddy.rating}
                        languages={buddy.languages}
                        description={buddy.description}
                        imageUrl={buddy.image}
                        price={buddy.price}
                        tags={buddy.tags}
                     />
                  </div>
                ))
              ) : (
                <div className="w-full py-20 bg-white rounded-[48px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-secondary/20">
                      <Users size={32} />
                   </div>
                   <p className="text-secondary/40 font-bold">No buddies found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Recent Experiences */}
        <section className="space-y-8 relative group/section">
          <div className="flex justify-between items-end">
             <div className="space-y-2">
                <h2 className="text-3xl font-black text-secondary tracking-tight">Recent <span className="text-primary italic">Experiences</span></h2>
                <p className="text-secondary/40 font-bold">Join authentic journeys from fellow travelers.</p>
             </div>
             <div>
                <Link to="/traveller/experiences" className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors">View all</Link>
             </div>
          </div>

          <div className="relative">
            {/* Side Navigation Arrows */}
            <button 
              onClick={() => scroll(experienceScrollRef, 'left')} 
              className="absolute -left-7 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/20 hover:shadow-premium shadow-lg transition-all active:scale-90 lg:flex items-center justify-center hidden opacity-0 group-hover/section:opacity-100 translate-x-4 group-hover/section:translate-x-0"
            >
               <ChevronLeft size={28} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => scroll(experienceScrollRef, 'right')} 
              className="absolute -right-7 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/20 hover:shadow-premium shadow-lg transition-all active:scale-90 lg:flex items-center justify-center hidden opacity-0 group-hover/section:opacity-100 -translate-x-4 group-hover/section:translate-x-0"
            >
               <ChevronRight size={28} strokeWidth={2.5} />
            </button>

            <div 
              ref={experienceScrollRef} 
              className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar px-2"
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
            >
              {loading ? (
                Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              ) : experiences.length > 0 ? (
                experiences.map((exp) => (
                  <div key={exp.id} className="w-[264px] flex-shrink-0 snap-start h-full">
                     <ExperienceCard experience={exp} />
                  </div>
                ))
              ) : (
                <div className="w-full py-20 bg-white rounded-[48px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                   <p className="text-secondary/40 font-bold">No experiences found.</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Global CSS to hide scrollbars */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <Footer />
    </div>
  );
};

export default HomePage;
