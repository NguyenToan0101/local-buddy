import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, ChevronRight, Bell, User, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import RegistrationProgress from '../../components/registration/RegistrationProgress';
import TagSelector from '../../components/registration/TagSelector';
import AvailabilityGrid from '../../components/registration/AvailabilityGrid';

const BuddyRegistration: React.FC = () => {
  const [tags, setTags] = useState<string[]>(['Local Markets', 'Hidden Cafes', 'Street Art']);
  const [schedule, setSchedule] = useState<Record<string, string[]>>({
    MON: ['M'],
    TUE: ['A'],
    WED: ['E'],
    THU: ['M'],
    FRI: ['A'],
    SAT: ['E'],
  });

  const handleToggleSlot = (day: string, slot: string) => {
    setSchedule((prev: Record<string, string[]>) => {
      const daySlots = prev[day] || [];
      const newSlots = daySlots.includes(slot)
        ? daySlots.filter((s: string) => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [day]: newSlots };
    });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center">
      {/* Mini Navbar */}
      <nav className="w-full h-16 bg-white/50 backdrop-blur-md px-8 flex justify-between items-center border-b border-gray-100">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
               <MapPin size={18} />
            </div>
            <span className="font-bold text-secondary">Local Buddy</span>
         </div>
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
               <Bell size={20} />
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
               <img src="https://i.pravatar.cc/100?u=current" alt="avatar" />
            </div>
         </div>
      </nav>

      <main className="max-w-5xl w-full p-6 sm:p-12 space-y-12">
        <div className="bg-white rounded-[64px] shadow-premium p-10 sm:p-20 space-y-16 border border-gray-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          <RegistrationProgress currentStep={1} totalSteps={3} title="Buddy Professional Profile" />

          <div className="space-y-4 relative z-10">
             <h2 className="heading-section tracking-tighter">Become a local buddy</h2>
             <p className="text-secondary/40 font-bold text-lg leading-relaxed">
                Join our premium network of local experts. Let's start with the basics to get you verified and visible to world travelers.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
             {/* Profile Photo */}
             <div className="flex flex-col items-center text-center space-y-8 p-10 bg-surface rounded-[48px] border border-gray-50 hover:shadow-premium transition-all group/photo">
                <div className="relative">
                   <div className="w-40 h-40 rounded-full border-4 border-dashed border-primary/20 bg-white flex items-center justify-center text-secondary/10 group-hover/photo:border-primary transition-colors">
                      <Camera size={48} strokeWidth={1.5} />
                   </div>
                   <button className="absolute bottom-2 right-2 w-12 h-12 bg-primary text-white rounded-[18px] flex items-center justify-center shadow-primary-glow hover:scale-110 transition-transform">
                      <Plus size={24} />
                   </button>
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-secondary tracking-tight">Profile Photo</h3>
                   <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">A friendly face builds instant trust</p>
                </div>
             </div>

             {/* Verification Photo */}
             <div className="flex flex-col items-center text-center space-y-8 p-10 bg-surface rounded-[48px] border border-gray-50 hover:shadow-premium transition-all group/verify">
                <div className="w-64 h-40 rounded-[32px] border-4 border-dashed border-primary/20 bg-white flex flex-col items-center justify-center text-secondary/10 gap-4 group-hover/verify:border-primary transition-colors">
                   <div className="p-4 bg-primary/5 rounded-2xl shadow-inner">
                      <User size={32} className="text-primary/20" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary/20">Identity Document</span>
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-secondary tracking-tight">ID Verification</h3>
                   <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Confidential • For safety squad only</p>
                </div>
             </div>
          </div>

          <div className="space-y-12 pt-8 relative z-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Input label="FULL NAME" placeholder="e.g. Alex Johnson" />
                <Input label="WHERE DO YOU GUIDE?" placeholder="e.g. Barcelona, Spain" icon={<MapPin size={24} />} />
             </div>

             <div className="space-y-6">
                <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.4em] ml-2">LANGUAGES SPOKEN</label>
                <div className="w-full bg-surface rounded-[28px] p-6 min-h-[72px] text-secondary/40 font-bold border border-gray-100 italic flex items-center">
                   English, Spanish, Catalan...
                </div>
             </div>

             <div className="space-y-6">
                <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.4em] ml-2">YOUR LOCAL STORY</label>
                <textarea 
                   rows={6}
                   placeholder="Tell travelers about your personality, your secret spots, and why you love your city..."
                   className="w-full bg-surface border border-gray-100 rounded-[40px] p-8 focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-secondary/20 font-bold text-secondary leading-relaxed resize-none"
                />
             </div>

             <TagSelector 
               label="AREAS OF EXPERTISE"
               tags={tags}
               onAddTag={(tag) => setTags([...tags, tag])}
               onRemoveTag={(tag) => setTags(tags.filter((t: string) => t !== tag))}
               placeholder="Add expertise (e.g. Gastronomy, Architecture)"
             />

             <div className="space-y-8">
                <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.4em] ml-2">AVAILABILITY GRID</label>
                <div className="bg-surface p-10 rounded-[48px] border border-gray-100">
                   <AvailabilityGrid 
                     schedule={schedule}
                     onChange={handleToggleSlot}
                   />
                </div>
             </div>
          </div>

          <Button className="w-full py-6 text-xl flex items-center justify-center gap-4 shadow-primary-glow scale-105">
             Continue Onboarding <ChevronRight size={28} strokeWidth={2.5} />
          </Button>

        </div>
        
        <p className="text-center font-bold text-secondary/40">
           Already have a profile? <Link to="/login" className="text-primary hover:underline">Log in here</Link>
        </p>
      </main>
    </div>
  );
};

export default BuddyRegistration;
