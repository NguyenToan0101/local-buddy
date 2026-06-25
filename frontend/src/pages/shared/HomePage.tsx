import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, Users, QrCode, Bell, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { buddyService, experienceService } from '../../services/api';
import type { Buddy, Experience } from '../../services/api';
import BuddyCard from '../../components/features/BuddyCard';
import ExperienceCard from '../../components/features/ExperienceCard';
import NotificationPopover from '../../components/features/NotificationPopover';
import ScannerModal from '../../components/features/ScannerModal';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSafetyDrawerOpen, setIsSafetyDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [buddiesData, experiencesData] = await Promise.all([
          buddyService.getAll(),
          experienceService.getAll()
        ]);

        const sortData = (data: any[]) => {
          if (!user) return data;
          return [...data].sort((a, b) => {
            const aInLocation = a.location?.toLowerCase().includes(user.location?.toLowerCase() || '');
            const bInLocation = b.location?.toLowerCase().includes(user.location?.toLowerCase() || '');
            if (aInLocation && !bInLocation) return -1;
            if (!aInLocation && bInLocation) return 1;

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
        setTimeout(() => setLoading(false), 300);
      }
    };

    fetchData();
  }, [user]);

  const handleScanStart = (booking: any) => {
    setActiveBooking(booking);
    setShowScanner(true);
    setIsNotifOpen(false);
  };

  const handleScanSuccess = async () => {
    if (!activeBooking) return;
    setShowScanner(false);
    navigate(`/traveller/booking/${activeBooking.id}`);
  };

  const filteredBuddies = searchQuery
    ? buddies.filter(b =>
        b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : buddies;

  const SkeletonCard = () => (
    <div className="w-[260px] flex-shrink-0 h-[380px] bg-white rounded-[32px] animate-pulse border border-gray-100 p-5 space-y-4">
      <div className="w-full h-1/2 bg-slate-100 rounded-[24px]"></div>
      <div className="h-6 bg-slate-100 rounded-full w-2/3"></div>
      <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
    </div>
  );

  const SkeletonGridCard = () => (
    <div className="h-[340px] bg-white rounded-[32px] animate-pulse border border-gray-100 p-5 space-y-4">
      <div className="w-full h-1/2 bg-slate-100 rounded-[24px]"></div>
      <div className="h-6 bg-slate-100 rounded-full w-2/3"></div>
      <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col bg-[#FBFBFC]">

      {/* ===== MOBILE HEADER (hidden on md+) ===== */}
      <header className="md:hidden flex justify-between items-center px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
            <img
              src={user?.avatar || `https://i.pravatar.cc/100?u=${user?.id}`}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest leading-none">Welcome back,</p>
            <h2 className="text-sm font-black text-secondary mt-1">{user?.name || 'Explorer'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanner(true)}
            className="w-10 h-10 rounded-2xl border border-gray-100 bg-slate-50 flex items-center justify-center text-secondary/60 hover:text-primary transition-all shadow-sm cursor-pointer"
          >
            <QrCode size={18} />
          </button>

          <div ref={containerRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="w-10 h-10 rounded-2xl border border-gray-100 bg-slate-50 flex items-center justify-center text-secondary/60 hover:text-primary transition-all shadow-sm relative cursor-pointer"
            >
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-sm"></span>
            </button>
            <NotificationPopover
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onScanStart={handleScanStart}
            />
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col md:max-w-screen-2xl md:w-full md:mx-auto md:px-8 lg:px-16 xl:px-20 space-y-6 md:space-y-10 pb-6">

        {/* ===== DESKTOP HERO SECTION ===== */}
        <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between pt-8 pb-4 gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-black text-secondary tracking-tight">
              Hi {user?.name || 'Traveler'}, <br />
              <span className="text-primary italic">explore {user?.location?.split(',')[0] || 'Vietnam'}?</span>
            </h1>
            <p className="text-secondary/50 font-bold text-sm max-w-md">
              Connect with verified local buddies for authentic experiences.
            </p>
          </div>
          {/* Desktop search + actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buddies or tags..."
                className="w-72 bg-white border border-slate-200 focus:border-primary/30 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-sm text-secondary outline-none placeholder:text-secondary/20 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="w-12 h-12 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-secondary/60 hover:text-primary transition-all shadow-sm cursor-pointer"
            >
              <QrCode size={20} />
            </button>
          </div>
        </div>

        {/* ===== MOBILE GREETING + SEARCH ===== */}
        <div className="md:hidden px-6 pt-6 space-y-4">
          <h1 className="text-3xl font-black text-secondary tracking-tight">
            Hi {user?.name || 'Traveler'}, <br />
            <span className="text-primary italic">explore {user?.location?.split(',')[0] || 'Vietnam'}?</span>
          </h1>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buddies or tags..."
              className="w-full bg-slate-50 border border-slate-100 focus:border-primary/10 rounded-2xl py-3.5 pl-12 pr-4 font-bold text-sm text-secondary outline-none placeholder:text-secondary/20 transition-all focus:bg-white"
            />
          </div>
        </div>

        {/* Safety Guarantee Banner */}
        <div className="px-6 md:px-0">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow">
                <Shield size={18} className="fill-current" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-secondary tracking-tight uppercase leading-none">Safety Promise</h4>
                <p className="text-[10px] text-secondary/50 font-bold leading-normal mt-1 truncate">Timed ID review with required evidence.</p>
              </div>
            </div>
            <button
              onClick={() => setIsSafetyDrawerOpen(true)}
              className="shrink-0 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-white border border-emerald-500/20 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>

        {/* ===== FEATURED BUDDIES ===== */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-6 md:px-0">
            <h2 className="text-xl md:text-2xl font-black text-secondary tracking-tight">
              Featured <span className="text-primary italic">Buddies</span>
            </h2>
            <Link to="/traveller/buddies" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
              View all <ArrowRight size={10} strokeWidth={4} />
            </Link>
          </div>

          {/* Mobile: horizontal scroll carousel */}
          <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide px-6 pb-2">
            {loading ? (
              Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : filteredBuddies.length > 0 ? (
              filteredBuddies.map((buddy) => (
                <div key={buddy.id} className="w-[280px] flex-shrink-0 snap-start">
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
                    verificationStatus={buddy.verificationStatus}
                  />
                </div>
              ))
            ) : (
              <div className="w-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                <Users size={24} className="text-secondary/20" />
                <p className="text-xs text-secondary/40 font-bold">No buddies found.</p>
              </div>
            )}
          </div>

          {/* Desktop: responsive grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonGridCard key={i} />)
            ) : filteredBuddies.length > 0 ? (
              filteredBuddies.slice(0, 8).map((buddy) => (
                <BuddyCard
                  key={buddy.id}
                  id={buddy.id}
                  name={buddy.name}
                  location={buddy.location}
                  rating={buddy.rating}
                  languages={buddy.languages}
                  description={buddy.description}
                  imageUrl={buddy.image}
                  price={buddy.price}
                  tags={buddy.tags}
                  verificationStatus={buddy.verificationStatus}
                />
              ))
            ) : (
              <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                <Users size={24} className="text-secondary/20" />
                <p className="text-xs text-secondary/40 font-bold">No buddies found.</p>
              </div>
            )}
          </div>
        </section>

        {/* ===== EXPERIENCES ===== */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-6 md:px-0">
            <h2 className="text-xl md:text-2xl font-black text-secondary tracking-tight">
              Recent <span className="text-primary italic">Trips</span>
            </h2>
            <Link to="/traveller/experiences" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
              View all <ArrowRight size={10} strokeWidth={4} />
            </Link>
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide px-6 pb-2">
            {loading ? (
              Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : experiences.length > 0 ? (
              experiences.map((exp) => (
                <div key={exp.id} className="w-[280px] flex-shrink-0 snap-start">
                  <ExperienceCard experience={exp} />
                </div>
              ))
            ) : (
              <div className="w-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-xs text-secondary/40 font-bold">No experiences found.</p>
              </div>
            )}
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => <SkeletonGridCard key={i} />)
            ) : experiences.length > 0 ? (
              experiences.slice(0, 8).map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} />
              ))
            ) : (
              <div className="col-span-full py-12 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                <p className="text-xs text-secondary/40 font-bold">No experiences found.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Safety Drawer Sheet */}
      {isSafetyDrawerOpen && (
        <div
          className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center animate-in fade-in duration-300"
          onClick={() => setIsSafetyDrawerOpen(false)}
        >
          <div
            className="bg-white rounded-t-[32px] md:rounded-[32px] w-full md:max-w-md p-6 space-y-5 shadow-premium animate-in slide-in-from-bottom-10 duration-500 pb-8 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto cursor-pointer md:hidden" onClick={() => setIsSafetyDrawerOpen(false)}></div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <Shield size={20} className="fill-current" />
              </div>
              <div>
                <h3 className="text-base font-black text-secondary">Safety Promise</h3>
                <p className="text-[10px] font-bold text-secondary/40">Your safety is our priority</p>
              </div>
            </div>
            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
              {[
                { title: 'Identity Review', desc: 'Local Buddies submit identity evidence and complete automatic verification before hosting.' },
                { title: 'Meet Publicly', desc: 'Always make your first meetup in a crowded public place like cafes or hotel lobbies.' },
                { title: 'Live Location Sharing', desc: 'Share location tracking links directly from booking screens to friends or family.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <h4 className="text-xs font-black text-secondary">{item.title}</h4>
                    <p className="text-[10px] text-secondary/50 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setIsSafetyDrawerOpen(false)} className="btn-secondary w-full py-3.5 text-xs">Got it</button>
          </div>
        </div>
      )}

      {/* QR Scanner Overlay Modal */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onSuccess={handleScanSuccess}
        buddyName={activeBooking?.buddyName || "Buddy"}
      />
    </div>
  );
};

export default HomePage;
