import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Star, Check, ArrowRight, Share2, Home } from 'lucide-react';
import Button from '../../components/ui/Button';
import { bookingService, buddyService } from '../../services/api';

const ReviewExperience: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [friendly, setFriendly] = useState<boolean | null>(null);
  const [enjoyable, setEnjoyable] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [buddy, setBuddy] = useState<any>(null);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const bookingData = await bookingService.getById(id);
        setBooking(bookingData);
        
        if (bookingData.buddyId) {
          const buddyData = await buddyService.getById(bookingData.buddyId);
          setBuddy(buddyData);
        }
      } catch (error) {
        console.error("Error fetching booking details for review:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    try {
      setSubmitting(true);
      // In a real app, we'd send this to the backend
      // For this demo, we'll update the buddy's reviews array if it exists
      if (buddy) {
        const newReview = {
          id: Date.now(),
          author: booking.traveler || "You",
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          content: feedback,
          rating: rating,
          avatar: "https://i.pravatar.cc/150?u=current_user"
        };
        
        const updatedReviews = [...(buddy.reviews || []), newReview];
        await buddyService.updateProfile(buddy.id, { 
          reviews: updatedReviews,
          rating: (buddy.rating * buddy.reviewCount + rating) / (buddy.reviewCount + 1),
          reviewCount: buddy.reviewCount + 1
        });
      }
      
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-surface-dark/40 backdrop-blur-2xl flex items-center justify-center">
         <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
       </div>
     );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-dark/40 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-[800px] w-full bg-white rounded-[72px] shadow-2xl border border-white/50 overflow-hidden relative animate-in zoom-in-95 duration-500">
           <div className="p-12 sm:p-20 space-y-12 text-center">
              <div className="w-24 h-24 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto text-accent-green mb-8">
                 <Check size={48} strokeWidth={3} />
              </div>
              <div className="space-y-4">
                 <h1 className="text-5xl font-black text-secondary tracking-tighter italic">Thank you for your feedback!</h1>
                 <p className="text-lg font-medium text-secondary/40 leading-relaxed max-w-md mx-auto">
                    Your review helps {buddy?.name} grow and helps other travelers make better choices.
                 </p>
              </div>

              <div className="bg-primary/5 rounded-[48px] p-10 space-y-8 border border-primary/10">
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-secondary tracking-tight">Share Your Experience?</h3>
                    <p className="text-sm font-bold text-primary uppercase tracking-widest">Earn 500 bonus points</p>
                 </div>
                 <p className="text-secondary/60 font-medium italic">
                    Would you like to write a short story and share some photos from your journey with the community?
                 </p>
                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button 
                      onClick={() => navigate(`/traveller/experience/share/${id}`)}
                      className="flex-1 py-6 shadow-primary-glow flex items-center justify-center gap-3"
                    >
                      <Share2 size={20} /> Yes, Share Now
                    </Button>
                    <button 
                      onClick={() => navigate('/traveller/home')}
                      className="flex-1 py-6 bg-white border border-gray-100 rounded-[24px] text-secondary font-black uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-3"
                    >
                      <Home size={18} /> Maybe later
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark/40 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-[800px] w-full bg-white rounded-[72px] shadow-2xl border border-white/50 overflow-hidden relative">
         
         <button 
           onClick={() => navigate(-1)}
           className="absolute top-10 right-10 w-14 h-14 bg-surface rounded-full flex items-center justify-center text-secondary/20 hover:text-primary transition-all z-10"
         >
            <X size={28} />
         </button>

         <div className="p-12 sm:p-20 space-y-12 text-center">
            {/* Profile Header */}
            <div className="space-y-6">
               <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full p-1 bg-surface shadow-2xl">
                     <img src={buddy?.image || "/assets/img/Linh.jpg"} alt={buddy?.name} className="w-full h-full rounded-full border-4 border-white shadow-inner" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full border-4 border-white flex items-center justify-center text-white shadow-xl">
                     <Check size={18} strokeWidth={4} />
                  </div>
               </div>
               <div className="space-y-2">
                  <h1 className="text-5xl font-black text-secondary tracking-tighter italic">How was your experience?</h1>
                  <p className="text-lg font-bold text-primary uppercase tracking-[0.2em]">{`with ${buddy?.name || 'Local Buddy'}`}</p>
               </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-4">
               <div className="flex justify-center gap-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                     <button 
                       key={s} 
                       onMouseEnter={() => setRating(s)}
                       onClick={() => setRating(s)}
                       className="transition-all hover:scale-125"
                     >
                        <Star 
                           size={48} 
                           className={`${s <= rating ? 'fill-primary text-primary shadow-primary/20' : 'text-primary/10'}`} 
                           strokeWidth={s <= rating ? 0 : 3}
                        />
                     </button>
                  ))}
               </div>
               <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em]">Tap to rate</p>
            </div>

            {/* Questions */}
            <div className="space-y-8 max-w-sm mx-auto pt-8">
               <div className="space-y-4">
                  <p className="text-sm font-black text-secondary uppercase tracking-widest">Was the buddy friendly?</p>
                  <div className="bg-surface rounded-full p-1.5 flex gap-1 border border-gray-100 shadow-inner">
                     <button 
                       onClick={() => setFriendly(true)}
                       className={`flex-1 py-3 rounded-full font-bold text-xs transition-all ${friendly === true ? 'bg-white text-primary shadow-xl shadow-primary/5' : 'text-secondary/40'}`}
                     >
                        Yes
                     </button>
                     <button 
                       onClick={() => setFriendly(false)}
                       className={`flex-1 py-3 rounded-full font-bold text-xs transition-all ${friendly === false ? 'bg-white text-primary shadow-xl shadow-primary/5' : 'text-secondary/40'}`}
                     >
                        No
                     </button>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-sm font-black text-secondary uppercase tracking-widest">Was the experience enjoyable?</p>
                  <div className="bg-surface rounded-full p-1.5 flex gap-1 border border-gray-100 shadow-inner">
                     <button 
                       onClick={() => setEnjoyable(true)}
                       className={`flex-1 py-3 rounded-full font-bold text-xs transition-all ${enjoyable === true ? 'bg-white text-primary shadow-xl shadow-primary/5' : 'text-secondary/40'}`}
                     >
                        Yes
                     </button>
                     <button 
                       onClick={() => setEnjoyable(false)}
                       className={`flex-1 py-3 rounded-full font-bold text-xs transition-all ${enjoyable === false ? 'bg-white text-primary shadow-xl shadow-primary/5' : 'text-secondary/40'}`}
                     >
                        No
                     </button>
                  </div>
               </div>
            </div>

            {/* Feedback Area */}
            <div className="space-y-4 pt-4">
               <p className="text-left text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-8">Your feedback</p>
               <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="w-full bg-[#FFEAE1]/5 border-2 border-[#FFEAE1]/20 rounded-[40px] p-10 text-secondary font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all min-h-[160px] resize-none"
               ></textarea>
            </div>

            {/* CTA */}
            <div className="pt-8 space-y-6">
               <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-6 text-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4"
               >
                  {submitting ? "Submitting..." : (
                    <>Submit Review <ArrowRight size={24} /></>
                  )}
               </Button>
               <button 
                onClick={() => navigate('/traveller/home')}
                className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.2em] hover:text-primary transition-colors"
               >
                  Skip for now
               </button>
            </div>
         </div>

         <footer className="py-10 bg-surface/50 text-center text-[10px] font-black text-secondary/20 uppercase tracking-[0.2em] border-t border-white/50">
            © 2024 Local Buddy Platform. All rights reserved.
         </footer>
      </div>
    </div>
  );
};

export default ReviewExperience;
