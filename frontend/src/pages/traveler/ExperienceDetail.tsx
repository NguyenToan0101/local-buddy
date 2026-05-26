import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Star, ChevronLeft, Compass, ArrowRight, Shield
} from 'lucide-react';
import { buddyService, experienceService } from '../../services/api';
import type { Experience, Buddy } from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
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

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto space-y-20">
        
        {/* Navigation & Header Section */}
        <section className="flex justify-between items-center mb-10">
          <button 
            onClick={() => navigate('/traveller/home')}
            className="group flex items-center gap-3 text-secondary/40 hover:text-secondary transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:shadow-premium transition-all">
              <ChevronLeft size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to home</span>
          </button>
        </section>

        {/* Hero Story Header - Unified Container Style */}
        <section className="relative rounded-[64px] overflow-hidden min-h-[500px] md:aspect-[21/9] shadow-premium group">
          <img 
            src={experience.image} 
            alt={experience.title} 
            className="w-full h-full absolute inset-0 object-cover animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"></div>
          
          <div className="absolute bottom-12 left-12 right-12 z-10 space-y-6">
            <div className="flex flex-wrap gap-2">
              {experience.tags.map(tag => (
                <span key={tag} className="px-5 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-lg">
                  {tag}
                </span>
              ))}
            </div>
            <div className="space-y-2 max-w-4xl text-white">
              <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-tight text-white [text-shadow:_0_4px_12px_rgb(0_0_0_/_60%)]">
                {experience.title}
              </h1>
              <div className="flex items-center gap-6 text-white font-medium">
                <div className="flex items-center gap-2">
                  <MapPin size={22} className="text-primary" />
                  <span className="text-lg drop-shadow-md">{experience.location}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Star size={20} className="text-primary fill-primary" />
                  <span className="text-lg drop-shadow-md">{experience.rating || '5.0'} Experience</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* Traveler Profile Snapshot */}
            <div className="flex items-center gap-6 p-8 bg-white rounded-[40px] border border-gray-50 shadow-sm transition-transform hover:scale-[1.01]">
              <div className="w-20 h-20 rounded-full border-4 border-primary/10 overflow-hidden shadow-lg shrink-0">
                <img src={experience.travelerAvatar || `https://i.pravatar.cc/150?u=${experience.travelerName}`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">Story shared by</p>
                <h3 className="text-2xl font-black text-secondary tracking-tight">{experience.travelerName}</h3>
                <p className="text-secondary/40 font-bold text-sm">Trip taken in {new Date(experience.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* The actual narrative */}
            <section className="relative pt-20 pb-16">
              <div className="absolute top-0 -left-12 text-[240px] font-serif text-primary/5 select-none leading-none -z-10 translate-y-[-20%]">“</div>
              <div className="max-w-3xl mb-24">
                <p className="relative text-xl md:text-2xl text-secondary/70 font-medium leading-[2] tracking-wide first-letter:text-5xl first-letter:font-black first-letter:text-primary first-letter:mr-3 first-letter:float-left first-letter:mt-2">
                  {experience.storyContent}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 h-[500px]">
                <div className="rounded-[48px] overflow-hidden shadow-premium group/memory">
                  <img src={experience.image} className="w-full h-full object-cover group-hover/memory:scale-105 transition-transform duration-1000" alt="Travel memory" />
                </div>
                <div className="grid grid-rows-2 gap-8">
                  <div className="rounded-[40px] overflow-hidden shadow-sm border border-gray-100 group/memory">
                    <img src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover/memory:scale-110 transition-transform duration-1000" alt="Memory" />
                  </div>
                  <div className="rounded-[40px] overflow-hidden relative shadow-sm border border-gray-100 group/memory">
                    <img src="https://images.unsplash.com/photo-1533055640609-24b498dfd74c?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover group-hover/memory:scale-110 transition-transform duration-1000" alt="Memory" />
                    <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm flex items-center justify-center group cursor-pointer">
                      <span className="text-white font-black text-xl uppercase tracking-widest group-hover:scale-110 transition-transform">+ 8 Photos</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area - Unified with Premium Cards */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-8">
            <div className="bg-white p-10 rounded-[56px] border border-gray-100 shadow-premium space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="space-y-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <Compass size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black text-secondary leading-tight tracking-tight">Wanna go <br/>there too?</h3>
                <p className="text-secondary/40 font-bold leading-relaxed">Book directly with {experience.buddyName} for an authentic journey like this one.</p>
              </div>

              <div className="flex items-center gap-5 p-6 bg-[#FBFBFC] rounded-[36px] border border-gray-50 group-hover:border-primary/20 transition-all">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md ring-4 ring-white">
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
                  <h4 className="font-black text-secondary">{experience.buddyName}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                    <Star size={12} className="fill-primary" />
                    <span>Highly Rated</span>
                  </div>
                </div>
              </div>

              <Link 
                to={`/traveller/buddy/${experience.buddyId}`}
                className="flex items-center justify-center gap-3 w-full py-6 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm shadow-primary-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Meet {experience.buddyName} <ArrowRight size={18} strokeWidth={3} />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-secondary to-[#1A1A1A] p-10 rounded-[56px] text-white space-y-8 shadow-2xl relative overflow-hidden group border border-white/5">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
               <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-all duration-500 relative shrink-0">
                 <Shield size={32} className="text-primary" strokeWidth={2} />
               </div>
               <div className="space-y-3">
                 <h4 className="text-2xl font-black tracking-tight italic">Travel with <br/><span className="text-primary not-italic">Peace of Mind</span></h4>
                 <p className="text-white/50 text-sm font-bold leading-relaxed">Verified locals, secure payments, and 24/7 support for every journey.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Similar Stories - Integrated into Flow */}
        <section className="pt-20 space-y-12">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl font-black text-secondary tracking-tight">More <span className="text-primary italic">Inspiration</span></h2>
            <Link to="/traveller/experiences" className="text-xs font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-1 hover:border-primary transition-all">View all stories</Link>
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
                 <div key={i} className="h-80 bg-white rounded-[48px] border border-gray-100 shadow-premium-hover animate-pulse p-8 flex flex-col justify-end">
                    <div className="h-6 bg-gray-100 rounded-full w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                 </div>
               ))
             )}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default ExperienceDetail;
