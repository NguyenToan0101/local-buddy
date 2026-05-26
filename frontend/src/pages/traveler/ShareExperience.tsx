import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Camera, Send, ArrowRight, Tag, MapPin, Star, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import { bookingService, experienceService, buddyService } from '../../services/api';

const ShareExperience: React.FC = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [buddy, setBuddy] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!bookingId) return;
        setLoading(true);
        const bookingData = await bookingService.getById(bookingId);
        setBooking(bookingData);
        
        if (bookingData.buddyId) {
          const buddyData = await buddyService.getById(bookingData.buddyId);
          setBuddy(buddyData);
        }
      } catch (error) {
        console.error("Error fetching data for sharing experience:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!title || !content) {
      alert("Please provide a title and your story content.");
      return;
    }

    try {
      setSubmitting(true);
      const experienceData = {
        title,
        travelerName: booking.traveler || "Hoang An", // Default for demo
        travelerAvatar: booking.travelerAvatar || "https://i.pravatar.cc/150?u=current_user",
        image: booking.buddyAvatar || "/assets/img/hoian.jpg", // Fallback
        location: booking.location || "Vietnam",
        date: new Date().toISOString().split('T')[0],
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        storyContent: content,
        buddyId: booking.buddyId,
        buddyName: booking.buddyName,
        rating: 5,
      };

      await experienceService.create(experienceData);
      alert("Your experience has been shared successfully!");
      navigate('/traveller/home');
    } catch (error) {
      console.error("Error sharing experience:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] py-20 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-10 rounded-[48px] shadow-premium border border-gray-50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <div className="space-y-2 relative z-10">
              <h1 className="text-4xl md:text-6xl font-black text-secondary tracking-tighter italic">
                 Share Your <span className="text-primary not-italic">Story</span>
              </h1>
              <p className="text-secondary/40 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                 <Sparkles size={16} className="text-primary" /> Create lasting memories
              </p>
           </div>
           <button 
             onClick={() => navigate(-1)}
             className="w-14 h-14 bg-surface-dark rounded-full flex items-center justify-center text-secondary/20 hover:text-primary transition-all relative z-10"
           >
              <X size={28} />
           </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* Left: Input Form */}
           <div className="lg:col-span-12 space-y-10">
              <div className="bg-white p-12 rounded-[56px] shadow-premium border border-gray-50 space-y-10">
                 
                 {/* Experience Title */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em] ml-6">Headline for your adventure</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Hidden Gems of Hanoi with Linh"
                      className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 rounded-[32px] px-8 py-6 text-xl font-black text-secondary italic placeholder:text-secondary/10 outline-none transition-all shadow-inner"
                    />
                 </div>

                 {/* Story Content */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em] ml-6">The Full Story</label>
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tell the community about the secret spots, the amazing food, and the moments that made this trip special..."
                      className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 rounded-[40px] px-10 py-10 text-lg font-medium text-secondary/70 italic leading-relaxed placeholder:text-secondary/10 outline-none transition-all shadow-inner min-h-[300px] resize-none"
                    />
                 </div>

                 {/* Tags & Meta */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em] ml-6">Tags (comma separated)</label>
                       <div className="relative">
                          <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                          <input 
                            type="text" 
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="Foodie, Culture, Sunset..."
                            className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 rounded-2xl pl-16 pr-6 py-5 text-sm font-black text-secondary uppercase tracking-widest outline-none transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em] ml-6">Photo Memories</label>
                       <button className="w-full py-5 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20 text-primary flex items-center justify-center gap-3 group hover:bg-primary/10 transition-all">
                          <Camera size={20} className="group-hover:rotate-12 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Upload Journey Photos</span>
                       </button>
                    </div>
                 </div>

                 {/* Post Summary Card */}
                 {buddy && (
                    <div className="bg-[#1A1A1A] p-8 rounded-[40px] text-white flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:scale-105 transition-transform">
                             <img src={buddy.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">Featured Buddy</p>
                             <h4 className="text-xl font-black italic">{buddy.name}</h4>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                          <MapPin size={16} className="text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{booking?.location}</span>
                       </div>
                    </div>
                 )}

                 {/* Submit Button */}
                 <div className="pt-4">
                    <Button 
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-7 text-xl shadow-primary-glow flex items-center justify-center gap-4"
                    >
                       {submitting ? "Publishing Story..." : (
                          <>Post My Journey Story <Send size={20} strokeWidth={3} /></>
                       )}
                    </Button>
                    <p className="text-center text-[10px] font-black text-secondary/20 uppercase tracking-[0.2em] mt-8">Your story will be visible to potential travelers at /traveller/experiences</p>
                 </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default ShareExperience;
