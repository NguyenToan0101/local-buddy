import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Globe, Heart, Edit3, ChevronLeft, Hash, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Button from '../../components/ui/Button';
import { touristProfileService } from '../../services/tourist-profile';
import type { TouristProfileResponse } from '../../types/tourist-profile';

const TravelerProfile: React.FC = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [profileData, setProfileData] = useState<TouristProfileResponse | null>(null);
   const [loadingProfile, setLoadingProfile] = useState(true);
   const [hasProfile, setHasProfile] = useState(false);

   if (!user) return <div className="min-h-screen flex items-center justify-center bg-surface font-bold italic">Please log in to view your profile.</div>;

   // Load tourist profile data
   useEffect(() => {
      const loadProfile = async () => {
         try {
            setLoadingProfile(true);
            const exists = await touristProfileService.checkProfileExists();
            setHasProfile(exists);

            if (exists) {
               const profile = await touristProfileService.getProfile();
               setProfileData(profile);
            }
         } catch (error) {
            console.error('Error loading profile:', error);
            setHasProfile(false);
         } finally {
            setLoadingProfile(false);
         }
      };

      loadProfile();
   }, []);

   if (loadingProfile) {
      return (
         <div className="min-h-screen bg-[#FBFBFC]">
            <Navbar />
            <div className="pt-32 flex items-center justify-center">
               <div className="text-center">
                  <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium text-secondary">Loading your profile...</p>
               </div>
            </div>
         </div>
      );
   }

   // Show create profile prompt if no profile exists
   if (!hasProfile) {
      return (
         <div className="min-h-screen bg-[#FBFBFC]">
            <Navbar />
            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-4xl mx-auto">
               <div className="text-center">
                  <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100">
                     <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User size={40} className="text-primary" />
                     </div>

                     <h1 className="text-3xl font-bold text-secondary mb-4">
                        Complete Your Tourist Profile
                     </h1>

                     <p className="text-lg text-secondary/70 mb-8 max-w-2xl mx-auto">
                        Create your tourist profile to help local buddies understand your travel preferences and provide personalized experiences.
                     </p>

                     <Button
                        onClick={() => navigate('/traveller/profile/edit')}
                        className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 flex items-center gap-2 mx-auto"
                     >
                        <Plus size={20} />
                        Create Profile
                     </Button>
                  </div>
               </div>
            </main>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#FBFBFC]">
         <Navbar />

         <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto space-y-12">
            {/* Back Button */}
            <div className="flex items-center">
               <Link to="/traveller/home" className="group flex items-center gap-2 text-secondary/40 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px]">
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-primary/20 transition-all">
                     <ChevronLeft size={16} />
                  </div>
                  Back to Home
               </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
               {/* Left Column: Avatar & Quick Info */}
               <aside className="lg:w-1/3 space-y-8">
                  <div className="bg-white rounded-[48px] shadow-premium p-10 border border-gray-50 flex flex-col items-center text-center space-y-6 relative overflow-hidden group">
                     {/* Decorative Background */}
                     <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/5 to-transparent"></div>

                     <div className="relative pt-6">
                        <div className="w-48 h-48 rounded-full bg-white p-1.5 shadow-2xl relative z-10">
                           <div className="w-full h-full rounded-full overflow-hidden border-4 border-white">
                              <img
                                 src={user.avatar || profileData?.avatarUrl || `https://i.pravatar.cc/200?u=${user.id}`}
                                 alt={user.name}
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                              />
                           </div>
                        </div>
                        <div className="absolute -bottom-2 right-4 bg-primary text-white p-3 rounded-2xl shadow-primary-glow z-20 hover:scale-110 active:scale-95 transition-all">
                           <Link to="/traveller/profile/edit">
                              <Edit3 size={18} />
                           </Link>
                        </div>
                     </div>

                     <div className="space-y-2 relative z-10">
                        <h1 className="text-3xl font-black text-secondary tracking-tight">{profileData?.fullName || user.name}</h1>
                        <p className="text-primary font-bold flex items-center justify-center gap-2">
                           <MapPin size={16} /> {profileData?.nationality || 'Not specified'}
                        </p>
                     </div>

                     <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-gray-50">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Nationality</p>
                           <p className="text-sm font-black text-secondary">{profileData?.nationality || '--'}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Languages</p>
                           <p className="text-sm font-black text-secondary">{profileData?.languages?.length || 0}</p>
                        </div>
                     </div>

                     <Link to="/traveller/profile/edit" className="w-full">
                        <Button variant="ghost" className="w-full py-5 text-[11px] font-black border-2 border-primary/10 hover:bg-primary/5 uppercase tracking-[0.2em]">Edit Profile</Button>
                     </Link>
                  </div>

                  {/* Languages Section */}
                  <div className="bg-white rounded-[40px] shadow-sm p-8 border border-gray-50 space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-secondary/5 rounded-xl text-secondary/40">
                           <Globe size={20} />
                        </div>
                        <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Languages</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {profileData?.languages?.map(lang => (
                           <span key={lang} className="px-4 py-2 bg-surface-dark text-secondary/60 text-xs font-bold rounded-xl border border-gray-100">
                              {lang}
                           </span>
                        ))}
                        {!profileData?.languages?.length && <p className="text-xs font-bold text-secondary/20 italic">No languages added yet.</p>}
                     </div>
                  </div>
               </aside>

               {/* Right Column: Bio, Interests, etc. */}
               <div className="flex-1 space-y-8">
                  {/* Bio Section */}
                  <div className="bg-white rounded-[48px] shadow-sm p-12 border border-gray-50 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                           <User size={28} />
                        </div>
                        <div className="space-y-1">
                           <h2 className="text-2xl font-black text-secondary tracking-tight">About <span className="text-primary italic">Me</span></h2>
                           <p className="text-[10px] font-bold text-secondary/20 uppercase tracking-[0.2em]">A little about yourself</p>
                        </div>
                     </div>
                     <p className="text-lg font-bold text-secondary/70 leading-relaxed italic border-l-4 border-primary/20 pl-8">
                        "{profileData?.bio || 'Welcome to your profile! You haven\'t added a bio yet. Tell buddies what kind of traveler you are to help them recognize you easily.'}"
                     </p>
                  </div>

                  {/* Interests Sections */}
                  <div className="bg-white rounded-[48px] shadow-sm p-12 border border-gray-50 space-y-10">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
                              <Heart size={28} className="fill-primary" />
                           </div>
                           <div className="space-y-1">
                              <h2 className="text-2xl font-black text-secondary tracking-tight">Interests & <span className="text-primary italic">Passions</span></h2>
                              <p className="text-[10px] font-bold text-secondary/20 uppercase tracking-[0.2em]">What makes you travel</p>
                           </div>
                        </div>
                        <Link to="/traveller/profile/edit" className="text-[10px] font-black uppercase text-primary hover:underline">Manage</Link>
                     </div>

                     <div className="flex flex-wrap gap-4">
                        {profileData?.interests?.map(interest => (
                           <div key={interest} className="px-8 py-4 bg-surface-dark border border-gray-100 rounded-2xl flex items-center gap-3 group hover:border-primary/20 hover:bg-primary/5 transition-all">
                              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-secondary/20 group-hover:text-primary transition-all">
                                 <Hash size={16} strokeWidth={3} />
                              </div>
                              <span className="text-sm font-black text-secondary/60 group-hover:text-secondary transition-all">{interest}</span>
                           </div>
                        ))}
                        {!profileData?.interests?.length && <p className="text-sm font-bold text-secondary/20 italic">Share your passions to find like-minded buddies.</p>}
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
};

export default TravelerProfile;