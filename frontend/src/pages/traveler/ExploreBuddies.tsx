import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ChevronLeft, Users, Shield, Star,
  MapPin, MessageSquare, Eye, SlidersHorizontal, X, ArrowRight
} from 'lucide-react';
import { buddyService } from '../../services/api';
import type { Buddy } from '../../services/api';

const ITEMS_PER_PAGE = 12;

const INTEREST_TAGS = [
  'All', 'Foodie', 'Hiking', 'Nightlife', 'Art',
  'Nature', 'Culture', 'History', 'Photography', 'Beach'
];

// ─── Individual Buddy Card ────────────────────────────────────────────────────
const BuddyListCard: React.FC<{ buddy: Buddy; index: number }> = ({ buddy, index }) => {
  const navigate = useNavigate();
  const isVerified =
    buddy.verificationStatus === 'verified' ||
    buddy.verificationStatus === 'auto_approved' ||
    buddy.verificationStatus === 'manual_approved';
  const trustScore = isVerified
    ? Math.min(100, 94 + Math.round(buddy.rating * 1.2))
    : Math.min(88, 65 + Math.round(buddy.rating * 3.5));

  return (
    <div
      className="group bg-white rounded-3xl border border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Photo */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={buddy.image}
          alt={buddy.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Dark gradient at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* Verified badge */}
        {isVerified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
            <Shield size={9} className="fill-current" />
            Verified
          </div>
        )}

        {/* Rating + price overlaid on bottom of photo */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl shadow-sm">
            <Star size={11} className="fill-primary text-primary" />
            <span className="text-xs font-black text-secondary">{buddy.rating}</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-white drop-shadow">${buddy.price}</span>
            <span className="text-white/60 text-[10px] font-bold ml-1">/hr</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Name + location */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-secondary text-base leading-tight group-hover:text-primary transition-colors">
              {buddy.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-lg">
              <Shield size={8} className="fill-current" />
              {trustScore}%
            </div>
          </div>
          <div className="flex items-center gap-1 text-secondary/40 mt-1">
            <MapPin size={11} className="text-primary shrink-0" />
            <span className="text-xs font-semibold truncate">{buddy.location}</span>
          </div>
        </div>

        {/* Languages */}
        <div className="flex flex-wrap gap-1">
          {buddy.languages?.slice(0, 3).map(lang => (
            <span key={lang} className="px-2 py-0.5 bg-secondary/5 text-secondary/50 text-[9px] font-black uppercase tracking-wider rounded-lg border border-secondary/5">
              {lang}
            </span>
          ))}
        </div>

        {/* Tags */}
        {buddy.tags && buddy.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {buddy.tags.slice(0, 4).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-wider rounded-lg border border-primary/10">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Push buttons to bottom */}
        <div className="flex-1" />

        {/* ── ACTION BUTTONS ── */}
        <div className="flex gap-2 pt-2 border-t border-slate-50">
          <button
            onClick={() => navigate(`/traveller/buddy/${buddy.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-secondary/60 hover:text-secondary text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <Eye size={13} />
            Profile
          </button>
          <button
            onClick={() => navigate(`/traveller/messages?buddyId=${buddy.id}`)}
            className="flex-[1.4] flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-primary/20 border-none cursor-pointer"
          >
            <MessageSquare size={13} />
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
    <div className="h-52 bg-slate-100" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-slate-100 rounded-full w-3/4" />
      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
      <div className="flex gap-1">
        {[1,2,3].map(i => <div key={i} className="h-5 w-14 bg-slate-50 rounded-lg" />)}
      </div>
      <div className="h-9 bg-slate-50 rounded-xl mt-2" />
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const ExploreBuddies: React.FC = () => {
  const navigate = useNavigate();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isSafetyDrawerOpen, setIsSafetyDrawerOpen] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(h);
  }, [searchQuery]);

  useEffect(() => { setCurrentPage(0); }, [debouncedSearchQuery, selectedInterests]);

  useEffect(() => {
    const fetchBuddies = async () => {
      setLoading(true);
      try {
        const data = await buddyService.search({
          searchQuery: debouncedSearchQuery,
          tags: selectedInterests,
          rating: 0,
          page: currentPage,
          size: ITEMS_PER_PAGE,
        });
        setBuddies(Array.isArray(data.content) ? data.content : []);
        setTotalPages(Math.max(1, data.totalPages || 1));
        setTotalElements(data.totalElements || 0);
      } catch {
        setBuddies([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };
    fetchBuddies();
  }, [currentPage, debouncedSearchQuery, selectedInterests]);

  const toggleTag = (tag: string) => {
    if (tag === 'All') return setSelectedInterests([]);
    setSelectedInterests(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearSearch = () => { setSearchQuery(''); setSelectedInterests([]); };

  const hasFilters = searchQuery.length > 0 || selectedInterests.length > 0;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">

      {/* ══════════ STICKY HEADER ══════════ */}
      <header className="sticky top-0 md:top-[96px] z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-16">

          {/* Top row */}
          <div className="flex items-center gap-3 py-4">
            <button
              onClick={() => navigate('/traveller/home')}
              className="md:hidden w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-secondary/60 hover:text-primary transition-all cursor-pointer shrink-0"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-black text-secondary tracking-tight leading-none">
                Find a <span className="text-primary italic">Buddy</span>
              </h1>
              {totalElements > 0 && !loading && (
                <p className="text-[10px] font-bold text-secondary/30 uppercase tracking-widest mt-0.5">
                  {totalElements} guides available
                </p>
              )}
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-sm relative hidden sm:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/30 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="City, name or tag..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary/30 focus:bg-white rounded-2xl py-2.5 pl-10 pr-10 text-sm font-semibold text-secondary outline-none placeholder:text-secondary/25 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-secondary cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Safety button — desktop */}
            <button
              onClick={() => setIsSafetyDrawerOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-emerald-100 transition-all cursor-pointer shrink-0"
            >
              <Shield size={14} className="fill-current" />
              Safety
            </button>
          </div>

          {/* Mobile search row */}
          <div className="sm:hidden pb-3 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/30 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="City, name or tag..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-primary/30 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-semibold text-secondary outline-none placeholder:text-secondary/25 transition-all"
            />
          </div>

          {/* Filter chips row */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {INTEREST_TAGS.map(tag => {
              const active = tag === 'All' ? selectedInterests.length === 0 : selectedInterests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                    active
                      ? 'bg-secondary text-white border-secondary shadow-sm'
                      : 'bg-transparent text-secondary/40 border-slate-200 hover:border-secondary/30 hover:text-secondary/70'
                  }`}
                >
                  {tag}
                </button>
              );
            })}

            {hasFilters && (
              <button
                onClick={clearSearch}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-200 text-rose-400 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer shrink-0 ml-1"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══════════ GRID CONTENT ══════════ */}
      <main className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-16 py-6 pb-24 md:pb-10">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : buddies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {buddies.map((buddy, i) => (
                <BuddyListCard key={buddy.id} buddy={buddy} index={i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ArrowRight size={16} className="rotate-180" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                        currentPage === p
                          ? 'bg-secondary text-white shadow-md'
                          : 'bg-white border border-slate-200 text-secondary/40 hover:border-secondary/30'
                      }`}
                    >
                      {p + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-secondary/40 hover:text-primary hover:border-primary/30 disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-28 text-center space-y-5">
            <div className="w-24 h-24 bg-white rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-center">
              <Users size={36} className="text-secondary/10" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-secondary">No buddies found</h3>
              <p className="text-sm text-secondary/40 font-medium max-w-xs mx-auto">
                Try different tags or search terms to discover local guides.
              </p>
            </div>
            <button onClick={clearSearch} className="btn-ghost px-8 py-3 text-xs cursor-pointer">
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* ══════════ MOBILE SAFETY FAB ══════════ */}
      <button
        onClick={() => setIsSafetyDrawerOpen(true)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl flex items-center justify-center z-30 transition-all active:scale-95 border-none cursor-pointer"
      >
        <Shield size={22} className="fill-current" />
      </button>

      {/* ══════════ SAFETY DRAWER ══════════ */}
      {isSafetyDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={() => setIsSafetyDrawerOpen(false)}
        >
          <div
            className="bg-white rounded-t-[28px] md:rounded-[28px] w-full md:max-w-md px-6 pt-5 pb-8 space-y-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto md:hidden" />

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Shield size={18} className="fill-current" />
              </div>
              <div>
                <h3 className="font-black text-secondary text-base">Safety Promise</h3>
                <p className="text-[10px] font-bold text-secondary/40">Your security matters</p>
              </div>
              <button
                onClick={() => setIsSafetyDrawerOpen(false)}
                className="ml-auto w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-secondary/40 hover:text-secondary cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { n: 1, title: 'Biometric Verification', desc: 'Buddies submit ID + face scans matched against government documents.' },
                { n: 2, title: 'Meet Publicly First', desc: 'Always make your first meetup in busy public places like cafes or hotel lobbies.' },
                { n: 3, title: 'Live Location Sharing', desc: 'Share real-time location links from booking screens to trusted contacts.' },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {n}
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary">{title}</p>
                    <p className="text-xs text-secondary/50 font-medium mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsSafetyDrawerOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-secondary text-white text-xs font-black uppercase tracking-widest hover:bg-secondary-light transition-all cursor-pointer border-none"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreBuddies;
