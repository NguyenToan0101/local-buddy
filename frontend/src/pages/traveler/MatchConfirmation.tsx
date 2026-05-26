import React from 'react';
import { X, Heart, MessageCircle, ChevronRight, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';

const MatchConfirmation: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-secondary/95 backdrop-blur-xl flex items-center justify-center p-4">
      <button className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
         <X size={24} />
      </button>

      <div className="max-w-xl w-full text-center space-y-12">
        {/* Animated Icon */}
        <div className="relative inline-block">
           <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-150"></div>
           <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl relative z-10 rotate-12">
              <Sparkles size={48} />
           </div>
        </div>

        <div className="space-y-4">
           <h1 className="text-6xl font-extrabold text-white tracking-tight">It's a Match!</h1>
           <p className="text-white/60 text-xl font-medium">You and Alex are ready for an adventure.</p>
        </div>

        {/* Avatars */}
        <div className="flex justify-center items-center gap-6">
           <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl">
                 <img src="https://i.pravatar.cc/200?u=me" alt="You" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent-green text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                 <Sparkles size={14} />
              </div>
           </div>

           <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
              <Heart size={32} className="fill-white" />
           </div>

           <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl">
                 <img src="https://i.pravatar.cc/200?u=alex" alt="Alex" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                 <Sparkles size={14} />
              </div>
           </div>
        </div>

        {/* Shared Interest */}
        <div className="bg-white/5 rounded-[40px] p-8 space-y-4 border border-white/10">
           <p className="text-white font-bold">
              Alex is also interested in <span className="text-accent-green">Street Food Tours</span> and <span className="text-accent-green">Hidden Cafes</span>.
           </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
            <Button 
               onClick={() => window.location.href = '/traveller/plan/1'}
               className="w-full py-5 text-xl bg-accent-green hover:bg-accent-green/90 shadow-xl shadow-accent-green/20 flex items-center justify-center gap-3"
            >
               <Heart size={20} /> Plan Experience
            </Button>
           <div className="grid grid-cols-2 gap-4">
              <Button variant="ghost" className="bg-primary hover:bg-primary/90 text-white border-none py-5 text-lg flex items-center justify-center gap-3">
                 <MessageCircle size={20} /> Chat
              </Button>
              <Button variant="ghost" className="bg-white hover:bg-gray-100 text-secondary border-none py-5 text-lg flex items-center justify-center gap-3">
                 Next <ChevronRight size={20} />
              </Button>
           </div>
           <button className="text-white/40 font-bold text-sm hover:text-white transition-colors py-2 uppercase tracking-widest">
              Continue Browsing
           </button>
        </div>
      </div>
    </div>
  );
};

export default MatchConfirmation;
