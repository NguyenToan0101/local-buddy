import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Star, Tag, X } from 'lucide-react';
import { experienceService } from '../../services/api';
import type { Experience } from '../../services/api';
import ExperienceCard from '../../components/features/ExperienceCard';
import Footer from '../../components/Footer';

const ITEMS_PER_PAGE = 12;
const TAGS = ['Food', 'Culture', 'History', 'Nature', 'Photography', 'Nightlife', 'Hidden gems', 'Street food', 'Coffee', 'Walking tour'];

const ExploreExperiences: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentPage(0);
  }, [rating, searchQuery, selectedTags]);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await experienceService.search({
          searchQuery,
          tags: selectedTags,
          rating: rating || undefined,
          page: currentPage,
          size: ITEMS_PER_PAGE,
        });
        setExperiences(Array.isArray(data.content) ? data.content : []);
        setTotalPages(Math.max(1, data.totalPages || 1));
        setTotalElements(data.totalElements || 0);
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setExperiences([]);
        setTotalPages(1);
        setTotalElements(0);
        setError(err instanceof Error ? err.message : 'Unable to load experiences.');
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [currentPage, rating, searchQuery, selectedTags]);

  const hasFilters = useMemo(() => selectedTags.length > 0 || rating > 0 || searchQuery.trim().length > 0, [rating, searchQuery, selectedTags.length]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.some((item) => item.toLowerCase() === tag.toLowerCase())
        ? current.filter((item) => item.toLowerCase() !== tag.toLowerCase())
        : [...current, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setRating(0);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-secondary">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Traveler experiences</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Explore trip stories</h1>
              <p className="mt-2 text-sm font-semibold text-secondary/50">{totalElements} stories from completed bookings</p>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={19} strokeWidth={3} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search stories or places"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition placeholder:text-secondary/30 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="flex h-12 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star === rating ? 0 : star)} aria-label={`Filter ${star} stars`}>
                  <Star size={17} className={rating && star <= rating ? 'fill-primary text-primary' : 'text-slate-300'} strokeWidth={3} />
                </button>
              ))}
              <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-secondary/45">{rating ? `${rating}.0+` : 'Any'}</span>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-secondary/55 transition hover:border-rose-200 hover:text-rose-600"
              >
                <X size={15} strokeWidth={3} />
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {TAGS.map((tag) => {
              const selected = selectedTags.some((item) => item.toLowerCase() === tag.toLowerCase());
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                    selected ? 'bg-primary text-white' : 'bg-slate-100 text-secondary/45 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <Tag size={12} strokeWidth={3} />
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        {error && <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : experiences.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black tracking-tight">No stories found</h2>
            <p className="mt-2 text-sm font-semibold text-secondary/50">Try clearing filters or searching a broader place.</p>
            <button onClick={clearFilters} className="mt-6 rounded-xl bg-secondary px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-primary">
              Reset filters
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <section className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <button
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={15} strokeWidth={3} />
              Previous
            </button>
            <p className="text-xs font-black uppercase tracking-widest text-secondary/40">
              Page {currentPage + 1} of {totalPages}
            </p>
            <button
              onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
              disabled={currentPage >= totalPages - 1}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight size={15} strokeWidth={3} />
            </button>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ExploreExperiences;
