import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Globe, Heart, Edit3, ChevronLeft, Hash, Loader2, Plus, LogOut, Mail, Phone, Calendar, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { touristProfileService } from '../../services/tourist-profile';
import type { TouristProfileResponse } from '../../types/tourist-profile';

const TravelerProfile: React.FC = () => {
   const { user, logout } = useAuth();
   const navigate = useNavigate();

   const handleLogout = () => {
      logout();
      navigate('/');
   };

   const formatDate = (dateStr?: string) => {
      if (!dateStr) return 'June 2026';
      try {
         const date = new Date(dateStr);
         return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } catch {
         return 'June 2026';
      }
   };

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
         <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
               <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
               <p className="text-lg font-medium text-secondary">Loading your profile...</p>
            </div>
         </div>
      );
   }

   // Show create profile prompt if no profile exists
   if (!hasProfile) {
      return (
         <div className="min-h-screen bg-[#FBFBFC]">
            <main className="pt-6 pb-20 px-4 sm:px-6 lg:px-16 max-w-4xl mx-auto">
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

                  {/* Logout for no-profile state — mobile only */}
                  <button
                     onClick={handleLogout}
                     className="md:hidden mt-8 flex items-center justify-center gap-2 text-xs font-black text-rose-400 hover:text-rose-500 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                     <LogOut size={14} /> Sign Out
                  </button>
               </div>
            </main>
         </div>
      );
   }

   const verificationStatus = profileData?.verificationStatus || user.verificationStatus || 'pending';
   const isVerified = verificationStatus === 'verified';

   return (
      <div className="min-h-screen bg-[#FBFBFC] pb-16 font-sans">
         <main className="pt-6 pb-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Back Navigation Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
               <Link to="/traveller/home" className="group flex items-center gap-2 text-secondary/50 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px]">
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:shadow-primary-glow group-hover:border-primary/20 transition-all">
                     <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  Back to Home
               </Link>
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-xl">
                  <Award size={12} className="text-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em]">
                     Premium Traveler Profile
                  </span>
               </div>
            </div>

            {/* Split Content Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 px-2 sm:px-6">
               {/* Left Column: Avatar & Quick Info Card */}
               <aside className="lg:col-span-4 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-white rounded-[40px] shadow-premium hover:shadow-premium-hover p-8 border border-slate-100 flex flex-col items-center text-center space-y-6 transition-all duration-300 relative overflow-hidden group">
                     {/* Background styling card elements */}
                     <div className="absolute -top-10 -left-10 w-28 h-28 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>

                     {/* Avatar double-ring */}
                     <div className="relative">
                        <div className="w-36 h-36 rounded-full bg-white p-1.5 shadow-xl relative z-10 border border-slate-50">
                           <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50">
                              <img
                                 src={user.avatar || profileData?.avatarUrl || `https://i.pravatar.cc/200?u=${user.id}`}
                                 alt={user.name}
                                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                 referrerPolicy="no-referrer"
                                 onError={(event) => {
                                    event.currentTarget.src = `https://i.pravatar.cc/200?u=${user.id}`;
                                 }}
                              />
                           </div>
                        </div>
                        <Link 
                           to="/traveller/profile/edit" 
                           className="absolute bottom-1 right-2 bg-primary hover:bg-primary-dark text-white p-3 rounded-2xl shadow-primary-glow z-20 hover:scale-110 active:scale-95 transition-all border-none cursor-pointer flex items-center justify-center"
                        >
                           <Edit3 size={14} />
                        </Link>
                     </div>

                     {/* Name & Badge */}
                     <div className="space-y-2 relative z-10">
                        <div className="flex items-center justify-center gap-1.5">
                           <h1 className="text-2xl font-black text-secondary tracking-tight">{profileData?.fullName || user.name}</h1>
                           {isVerified && <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" strokeWidth={2.5} />}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-lg text-primary text-[9px] font-black uppercase tracking-wider border border-primary/10">
                           <MapPin size={10} className="text-primary animate-pulse" />
                           <span>{profileData?.nationality || 'Global Explorer'}</span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                           isVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                           {isVerified ? 'Verified Traveler' : 'Verification Pending'}
                        </div>
                     </div>

                     {/* Interactive Travel Stats Row */}
                     <div className="grid grid-cols-3 gap-2 w-full py-4 px-2 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                        <div className="text-center">
                           <p className="text-lg font-black text-secondary">6</p>
                           <p className="text-[8px] font-black text-secondary/35 uppercase tracking-wider mt-0.5">Trips</p>
                        </div>
                        <div className="text-center border-x border-slate-200/60">
                           <p className="text-lg font-black text-secondary">3</p>
                           <p className="text-[8px] font-black text-secondary/35 uppercase tracking-wider mt-0.5">Cities</p>
                        </div>
                        <div className="text-center">
                           <p className="text-lg font-black text-secondary">4</p>
                           <p className="text-[8px] font-black text-secondary/35 uppercase tracking-wider mt-0.5">Buddies</p>
                        </div>
                     </div>

                     {/* Profile Quick Details list */}
                     <div className="w-full space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-left">
                           <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-secondary/40 shrink-0 border border-slate-100/30">
                              <Mail size={13} />
                           </div>
                           <div className="min-w-0">
                              <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest leading-none">Email Address</p>
                              <p className="text-xs font-bold text-secondary truncate mt-1">{profileData?.email || user.email}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 text-left">
                           <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-secondary/40 shrink-0 border border-slate-100/30">
                              <Phone size={13} />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest leading-none">Phone Contact</p>
                              <p className="text-xs font-bold text-secondary mt-1">{profileData?.phone || user.phone || 'Not provided'}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 text-left">
                           <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-secondary/40 shrink-0 border border-slate-100/30">
                              <Calendar size={13} />
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-secondary/30 uppercase tracking-widest leading-none">Member Since</p>
                              <p className="text-xs font-bold text-secondary mt-1">{formatDate(profileData?.createdAt)}</p>
                           </div>
                        </div>
                     </div>

                     <Link to="/traveller/profile/edit" className="w-full">
                        <Button variant="ghost" className="w-full py-4 text-[10px] font-black border-2 border-slate-100 hover:border-primary/20 hover:bg-primary/5 uppercase tracking-widest transition-all">
                           Edit Profile Details
                        </Button>
                     </Link>
                  </div>

                  {/* Spoken Languages Card */}
                  <div className="bg-white rounded-[32px] shadow-sm p-6 border border-slate-100 space-y-4">
                     <div className="flex items-center gap-2.5 text-secondary/40">
                        <Globe size={15} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">Spoken Languages</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {profileData?.languages?.map(lang => (
                           <span key={lang} className="px-3.5 py-2 bg-slate-50 hover:bg-primary/5 text-secondary/70 hover:text-primary text-xs font-bold rounded-xl border border-slate-100 transition-colors">
                              {lang}
                           </span>
                        ))}
                        {!profileData?.languages?.length && (
                           <p className="text-xs font-bold text-secondary/20 italic">No spoken languages specified yet.</p>
                        )}
                     </div>
                  </div>
               </aside>

               {/* Right Column: Bio, Interests, Travel Wishlist */}
               <div className="lg:col-span-8 space-y-6">
                  {/* Biography section */}
                  <div className="bg-white rounded-[40px] shadow-sm p-8 md:p-10 border border-slate-100 space-y-6 relative overflow-hidden group">
                     {/* Background gradient orb */}
                     <div className="absolute top-0 right-0 w-28 h-28 bg-[#FF7A45]/5 rounded-full blur-2xl pointer-events-none"></div>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF7A45]/10 rounded-2xl flex items-center justify-center text-primary">
                           <User size={18} />
                        </div>
                        <div>
                           <h2 className="text-lg font-black text-secondary tracking-tight">Biography Story</h2>
                           <p className="text-[8px] font-bold text-secondary/30 uppercase tracking-widest mt-0.5">A personal intro for Local Buddies</p>
                        </div>
                     </div>
                     <div className="relative pt-4 pl-6 border-l-2 border-[#FF7A45]/20">
                        <span className="absolute -top-7 -left-3 text-7xl font-serif text-[#FF7A45]/10 select-none pointer-events-none leading-none">“</span>
                        <p className="text-base font-bold text-secondary/70 leading-relaxed italic">
                           {profileData?.bio || "Welcome to your traveler profile! Go ahead and add a biography so local buddy hosts can understand your interests and customize their tours to suit you perfectly."}
                        </p>
                     </div>
                  </div>

                  {/* E-visa evidence */}
                  <div className="bg-white rounded-[40px] shadow-sm p-8 md:p-10 border border-slate-100 space-y-6">
                     <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                              <ShieldCheck size={18} />
                           </div>
                           <div>
                              <h2 className="text-lg font-black text-secondary tracking-tight">E-visa Evidence</h2>
                              <p className="text-[8px] font-bold text-secondary/30 uppercase tracking-widest mt-0.5">Traveler authorization details</p>
                           </div>
                        </div>
                        <Link to="/traveller/profile/edit" className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">Manage</Link>
                     </div>

                     {profileData?.eVisaNumber || profileData?.eVisaEvidence ? (
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-5">
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                 <p className="text-[8px] font-black text-secondary/35 uppercase tracking-widest">Number</p>
                                 <p className="mt-1 text-xs font-black text-secondary truncate">{profileData?.eVisaNumber || '-'}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                 <p className="text-[8px] font-black text-secondary/35 uppercase tracking-widest">Country</p>
                                 <p className="mt-1 text-xs font-black text-secondary truncate">{profileData?.eVisaCountry || '-'}</p>
                              </div>
                              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                 <p className="text-[8px] font-black text-secondary/35 uppercase tracking-widest">Expiry</p>
                                 <p className="mt-1 text-xs font-black text-secondary truncate">{profileData?.eVisaExpiryDate || '-'}</p>
                              </div>
                           </div>
                           {profileData?.eVisaEvidence && (
                              <div className="h-32 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                                 <img src={profileData.eVisaEvidence} alt="E-visa evidence" className="h-full w-full object-cover" />
                              </div>
                           )}
                        </div>
                     ) : (
                        <p className="text-xs font-bold text-secondary/25 italic">No E-visa evidence added yet.</p>
                     )}
                  </div>

                  {/* Travel Passions / Interests Section */}
                  <div className="bg-white rounded-[40px] shadow-sm p-8 md:p-10 border border-slate-100 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-primary">
                              <Heart size={18} className="fill-primary" />
                           </div>
                           <div>
                              <h2 className="text-lg font-black text-secondary tracking-tight">Travel Passions</h2>
                              <p className="text-[8px] font-bold text-secondary/30 uppercase tracking-widest mt-0.5">What gets you excited to explore</p>
                           </div>
                        </div>
                        <Link to="/traveller/profile/edit" className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">Manage</Link>
                     </div>

                     <div className="flex flex-wrap gap-2.5">
                        {profileData?.interests?.map(interest => (
                           <div key={interest} className="px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2 group hover:border-primary/20 hover:bg-primary/5 transition-all">
                              <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-secondary/30 group-hover:text-primary transition-all">
                                 <Hash size={11} strokeWidth={2.5} />
                              </div>
                              <span className="text-xs font-black text-secondary/60 group-hover:text-secondary transition-all">{interest}</span>
                           </div>
                        ))}
                        {!profileData?.interests?.length && (
                           <p className="text-xs font-bold text-secondary/20 italic">Share your passions to find like-minded local guides.</p>
                        )}
                     </div>
                  </div>


               </div>
            </div>

            {/* Logout Mobile Section */}
            <div className="pt-6 border-t border-slate-100 md:hidden px-4">
               <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
               >
                  <LogOut size={16} />
                  Sign Out
               </button>
               <p className="text-center text-[10px] text-secondary/20 font-bold mt-3">
                  Logged in as <span className="text-secondary/40">{user?.email || user?.name}</span>
               </p>
            </div>
         </main>
      </div>
   );
};

export default TravelerProfile;
