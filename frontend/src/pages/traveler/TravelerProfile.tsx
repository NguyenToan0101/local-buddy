import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Globe, Heart, Edit3, ChevronLeft, Hash, Shield, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Button from '../../components/ui/Button';

const TravelerProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-surface font-bold italic">Please log in to view your profile.</div>;

  // Sync latest verificationStatus from API after admin approve
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setSyncing(true);
        await updateUser({});
      } catch {
        // ignore
      } finally {
        if (mounted) setSyncing(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

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

        {/* Verification banner styled similar to Buddy welcome */}
        <div className="bg-white rounded-[40px] px-8 py-8 md:px-12 md:py-10 text-secondary flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-premium border border-gray-100 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 p-10 text-primary/10 pointer-events-none">
            <Shield size={120} />
          </div>
          <div className="flex items-start gap-5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              {user.verificationStatus === 'verified' ? <Shield size={22} /> : <Clock size={22} />}
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em]">
                <Sparkles size={12} className="animate-pulse" /> Traveler Identity
              </div>
              {user.verificationStatus === 'verified' ? (
                <>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">You&apos;re a verified traveler</h2>
                  <p className="text-xs md:text-sm font-medium text-secondary/60 max-w-xl">
                    Your identity has been verified. Local buddies will see you as a trusted guest in the community.
                  </p>
                </>
              ) : user.verificationStatus === 'pending' ? (
                <>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">Verification in progress</h2>
                  <p className="text-xs md:text-sm font-medium text-secondary/60 max-w-xl">
                    Our safety team is reviewing your passport and selfie. You&apos;ll receive an update once everything is confirmed.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">Verify your traveler identity</h2>
                  <p className="text-xs md:text-sm font-medium text-secondary/60 max-w-xl">
                    A quick passport and selfie check helps buddies feel safe before accepting your requests and trips.
                  </p>
                </>
              )}
            </div>
          </div>

          {user.verificationStatus !== 'verified' && (
            <div className="relative z-10 flex flex-col items-stretch gap-3 md:items-end">
              <div className="text-right">
                {syncing && (
                  <p className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.3em] mb-2">
                    Syncing status...
                  </p>
                )}
              </div>
              <Button
                onClick={() => navigate('/traveller/profile/edit#identity-verification')}
                className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-primary-glow hover:scale-[1.03] active:scale-95 transition-all border-none"
              >
                {user.verificationStatus === 'pending' ? 'View verification' : 'Start verification'}
              </Button>
              <p className="text-[9px] font-black text-secondary/30 uppercase tracking-[0.3em] hidden md:block">
                End-to-end encrypted • For safety only
              </p>
            </div>
          )}
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
                            src={user.avatar || `https://i.pravatar.cc/200?u=${user.id}`} 
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
                    <h1 className="text-3xl font-black text-secondary tracking-tight">{user.name}</h1>
                    <p className="text-primary font-bold flex items-center justify-center gap-2">
                       <MapPin size={16} /> {user.location}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-gray-50">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Age</p>
                       <p className="text-lg font-black text-secondary">{user.age || '--'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Nationality</p>
                       <p className="text-lg font-black text-secondary truncate px-2">{user.nationality || '--'}</p>
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
                    {user.languages?.map(lang => (
                       <span key={lang} className="px-4 py-2 bg-surface-dark text-secondary/60 text-xs font-bold rounded-xl border border-gray-100">
                          {lang}
                       </span>
                    ))}
                    {!user.languages && <p className="text-xs font-bold text-secondary/20 italic">No languages added yet.</p>}
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
                       <h2 className="text-2xl font-black text-secondary tracking-tight">Your <span className="text-primary italic">Bio</span></h2>
                       <p className="text-[10px] font-bold text-secondary/20 uppercase tracking-[0.2em]">A little about yourself</p>
                    </div>
                 </div>
                 <p className="text-lg font-bold text-secondary/70 leading-relaxed italic border-l-4 border-primary/20 pl-8">
                    "{user.description || 'Welcome to your profile! You haven\'t added a bio yet. Tell buddies what kind of traveler you are to help them recognize you easily.'}"
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
                    {user.interests?.map(interest => (
                       <div key={interest} className="px-8 py-4 bg-surface-dark border border-gray-100 rounded-2xl flex items-center gap-3 group hover:border-primary/20 hover:bg-primary/5 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-secondary/20 group-hover:text-primary transition-all">
                             <Hash size={16} strokeWidth={3} />
                          </div>
                          <span className="text-sm font-black text-secondary/60 group-hover:text-secondary transition-all">{interest}</span>
                       </div>
                    ))}
                    {!user.interests && <p className="text-sm font-bold text-secondary/20 italic">Share your passions to find like-minded buddies.</p>}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default TravelerProfile;
