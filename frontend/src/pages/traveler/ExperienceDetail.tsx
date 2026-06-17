import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Star, ChevronLeft, Compass, ArrowRight, Shield
} from 'lucide-react';
import { buddyService, experienceService } from '../../services/api';
import type { Experience, Buddy } from '../../services/api';
import Navbar from '../../components/Navbar';
import Button from '../../components/ui/Button';
import ExperienceCard from '../../components/features/ExperienceCard';

const ExperienceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [experience, setExperience] = useState<Experience | null>(null);
  const [buddy, setBuddy] = useState<Buddy | null>(null);
  const [similarExperiences, setSimilarExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const [data, allData] = await Promise.all([
          experienceService.getById(id),
          experienceService.getAll()
        ]);
        setExperience(data);
        
        // Fetch buddy data to get the actual avatar
        if (data.buddyId) {
          const buddyData = await buddyService.getById(data.buddyId);
          setBuddy(buddyData);
        }

        // Filter out current experience and take 3
        setSimilarExperiences(allData.filter((e: Experience) => e.id !== id).slice(0, 3));
      } catch (error) {
        console.error("Error fetching experience detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
        <div className="animate-spin text-primary">
          <Compass size={48} />
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-black text-secondary">Story not found</h2>
        <Button onClick={() => navigate('/traveller/experiences')}>Back to Explore Stories</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <Navbar />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto space-y-16">
        
        {/* Navigation & Header Section */}
        <section className="flex items-center justify-between pb-6 border-b border-gray-100/80">
          <button 
            onClick={() => navigate('/traveller/home')}
            className="group flex items-center gap-2.5 text-secondary/50 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px]"
          >
            <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:shadow-primary-glow group-hover:border-primary/20 transition-all duration-300">
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Back to home
          </button>
          <span className="text-[10px] font-black text-secondary/35 uppercase tracking-[0.2em] bg-gray-50 border border-gray-100 px-3.5 py-1.5 rounded-xl">
            Traveler Story
          </span>
        </section>

        {/* Hero Story Header - Unified Premium Container */}
        <section className="relative rounded-[40px] md:rounded-[56px] overflow-hidden min-h-[480px] md:aspect-[21/9] shadow-premium-hover group bg-secondary">
          <img 
            src={experience.image} 
            alt={experience.title} 
            className="w-full h-full absolute inset-0 object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
          />
          {/* Rich gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 md:right-12 z-10 space-y-6">
            <div className="flex flex-wrap gap-2">
              {experience.tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[9px] font-black uppercase tracking-wider text-white">
                  #{tag}
                </span>
              ))}
            </div>
            
            <div className="space-y-4 max-w-4xl text-white">
              <h1 className="text-3xl md:text-6xl font-black tracking-tight leading-tight [text-shadow:_0_2px_10px_rgba(0,0,0,0.4)]">
                {experience.title}
              </h1>
              
              {/* Floating meta glass bar */}
              <div className="inline-flex flex-wrap items-center gap-4 md:gap-6 bg-white/10 backdrop-blur-md border border-white/15 px-6 py-3 rounded-2xl">
                <div className="flex items-center gap-2 text-white">
                  <MapPin size={16} className="text-primary animate-pulse" />
                  <span className="text-xs md:text-sm font-bold tracking-wide">{experience.location}</span>
                </div>
                <div className="h-4 w-px bg-white/20"></div>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs md:text-sm font-black text-white">{experience.rating || '5.0'} Experience</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* Traveler Profile Snapshot */}
            <div className="flex items-center gap-5 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden shadow-sm shrink-0">
                <img 
                  src={experience.travelerAvatar || `https://i.pravatar.cc/150?u=${experience.travelerName}`} 
                  alt={experience.travelerName} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(experience.travelerName)}&background=ff385c&color=fff`;
                  }}
                />
              </div>
              <div>
                <span className="text-primary font-black uppercase tracking-wider text-[8px]">Storyteller Journey</span>
                <h3 className="text-lg font-black text-secondary tracking-tight">{experience.travelerName}</h3>
                <p className="text-secondary/40 font-bold text-xs">Trip in {new Date(experience.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* The actual narrative */}
            <section className="relative">
              <div className="relative pt-6 pb-4">
                <span className="absolute -top-8 -left-4 text-9xl font-serif text-primary/10 select-none pointer-events-none leading-none">“</span>
                <p className="text-lg md:text-xl text-secondary/75 font-semibold leading-[1.8] tracking-wide text-justify italic font-serif pl-6 border-l-2 border-primary/25">
                  {experience.storyContent}
                </p>
              </div>
              
              {/* Photo Memory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-10">
                <div className="md:col-span-7 rounded-[32px] overflow-hidden shadow-premium group/memory h-[320px] md:h-[400px] relative">
                  <img src={experience.image} className="w-full h-full object-cover group-hover/memory:scale-105 transition-transform duration-700" alt="Travel memory" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/memory:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white text-xs font-black uppercase tracking-wider">Explore Local Vibes</span>
                  </div>
                </div>
                <div className="md:col-span-5 grid grid-rows-2 gap-6">
                  <div className="rounded-[24px] overflow-hidden shadow-sm border border-gray-100 group/memory h-[148px] md:h-[188px] relative">
                    <img src={experience.image} className="w-full h-full object-cover group-hover/memory:scale-105 transition-transform duration-700" alt="Memory" />
                  </div>
                  <div className="rounded-[24px] overflow-hidden relative shadow-sm border border-gray-100 group/memory h-[148px] md:h-[188px]">
                    <img src={experience.image} className="w-full h-full object-cover group-hover/memory:scale-105 transition-transform duration-700" alt="Memory" />
                    <div className="absolute inset-0 bg-secondary/85 backdrop-blur-sm flex flex-col items-center justify-center group/btn cursor-pointer transition-all hover:bg-secondary/70">
                      <span className="text-white font-black text-sm uppercase tracking-widest transition-transform group-hover/btn:scale-105">+ 8 Photos</span>
                      <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">Live Gallery</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area - Unified with Premium Cards */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-[40px] border border-gray-100 shadow-premium space-y-8 relative overflow-hidden group">
              {/* Glow effect */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>
              
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Compass size={24} strokeWidth={2.5} className="animate-spin-slow" />
                </div>
                <h3 className="text-2xl font-black text-secondary leading-tight tracking-tight">Wanna go <br/>there too?</h3>
                <p className="text-xs font-bold text-secondary/40 leading-relaxed">Book a personalized itinerary directly with {experience.buddyName} for an authentic, safe journey.</p>
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border-2 border-white shrink-0">
                   <img 
                     src={buddy?.image || `https://i.pravatar.cc/150?u=${experience.buddyId}`} 
                     alt={experience.buddyName} 
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(experience.buddyName)}&background=random`;
                     }}
                   />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-secondary text-sm">{experience.buddyName}</h4>
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-primary uppercase tracking-widest">
                    <Star size={10} className="fill-primary" />
                    <span>Professional Guide</span>
                  </div>
                </div>
              </div>

              <Link 
                to={`/traveller/buddy/${experience.buddyId}`}
                className="flex items-center justify-center gap-3 w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs sm:text-sm shadow-primary-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none cursor-pointer"
              >
                Meet {experience.buddyName} <ArrowRight size={16} strokeWidth={3} />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-secondary to-[#1A1A1A] p-8 md:p-10 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden group border border-white/5">
               <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
               <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-all duration-500 shrink-0">
                 <Shield size={24} className="text-primary" strokeWidth={2} />
               </div>
               <div className="space-y-2.5">
                 <h4 className="text-xl font-black tracking-tight italic">Travel with <br/><span className="text-primary not-italic">Peace of Mind</span></h4>
                 <p className="text-white/50 text-[11px] font-bold leading-relaxed">Verified locals, secure platform escrows, and 24/7 emergency support on every single adventure.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Similar Stories - Integrated into Flow */}
        <section className="pt-12 space-y-10">
          <div className="flex justify-between items-end border-b border-gray-100 pb-5">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Recommended Journeys</span>
              <h2 className="text-3xl md:text-4xl font-black text-secondary tracking-tight mt-1">More <span className="text-primary italic">Inspiration</span></h2>
            </div>
            <Link to="/traveller/experiences" className="text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary/10 pb-1 hover:border-primary transition-all duration-300">View all stories</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {similarExperiences.length > 0 ? (
               similarExperiences.map(exp => (
                 <div key={exp.id} className="transition-transform hover:-translate-y-2 duration-500">
                    <ExperienceCard experience={exp} />
                 </div>
               ))
             ) : (
               [1, 2, 3].map(i => (
                 <div key={i} className="h-80 bg-white rounded-[32px] border border-gray-100 shadow-premium-hover animate-pulse p-8 flex flex-col justify-end">
                    <div className="h-6 bg-gray-100 rounded-full w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                 </div>
               ))
             )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default ExperienceDetail;
