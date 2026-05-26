import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Sparkles, MapPin, Shield, Clock, FileText, Upload, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import SmartSelect from '../../components/ui/SmartSelect';

const nationalities = [
  { label: 'Vietnamese', value: 'Vietnamese' },
  { label: 'American', value: 'American' },
  { label: 'British', value: 'British' },
  { label: 'French', value: 'French' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'German', value: 'German' },
  { label: 'Australian', value: 'Australian' },
  { label: 'Canadian', value: 'Canadian' },
  { label: 'Singaporean', value: 'Singaporean' },
].sort((a, b) => a.label.localeCompare(b.label));

const languagesList = [
  { label: 'Vietnamese', value: 'Vietnamese' },
  { label: 'English', value: 'English' },
  { label: 'French', value: 'French' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'German', value: 'German' },
].sort((a, b) => a.label.localeCompare(b.label));

const interestsList = [
  { label: 'Photography', value: 'Photography' },
  { label: 'Foodie', value: 'Foodie' },
  { label: 'Hiking', value: 'Hiking' },
  { label: 'History', value: 'History' },
  { label: 'Cuisine', value: 'Cuisine' },
  { label: 'Old Quarter', value: 'Old Quarter' },
  { label: 'Urban Hiking', value: 'Urban Hiking' },
  { label: 'Craft Beer', value: 'Craft Beer' },
  { label: 'Art Galleries', value: 'Art Galleries' },
  { label: 'Local Markets', value: 'Local Markets' },
  { label: 'Bike Tours', value: 'Bike Tours' },
].sort((a, b) => a.label.localeCompare(b.label));

const EditProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passportFrontInputRef = useRef<HTMLInputElement>(null);
  const passportBackInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    // keep as string for better input UX (allow empty)
    age: user?.age != null ? String(user.age) : '',
    nationality: user?.nationality || '',
    description: user?.description || '',
    languages: user?.languages || [],
    interests: user?.interests || [],
    avatar: user?.avatar || '',
    location: user?.location || ''
  });

  const [passportFront, setPassportFront] = useState<File | null>(null);
  const [passportBack, setPassportBack] = useState<File | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  useEffect(() => {
    // Scroll to verification section when coming from hash link
    if (window.location.hash === '#identity-verification') {
      setTimeout(() => {
        document.getElementById('identity-verification')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
      };
    });
  };

  const compressDocImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 650;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
    });
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmitVerification = async () => {
    if (!user) return;
    if (user.verificationStatus === 'verified') return;
    if (!passportFront || !passportBack) return;

    try {
      setSubmittingVerification(true);
      const [frontRaw, backRaw] = await Promise.all([fileToBase64(passportFront), fileToBase64(passportBack)]);
      const [frontB64, backB64] = await Promise.all([compressDocImage(frontRaw), compressDocImage(backRaw)]);
      const payload: any = {
        verificationStatus: 'pending',
        verificationDocs: {
          selfie: formData.avatar || user.avatar || '',
          front: frontB64,
          back: backB64,
        },
      };

      // Guard against overly large payloads (base64 can get huge)
      const approxChars = JSON.stringify(payload).length;
      if (approxChars > 1_800_000) {
        alert('Images are too large. Please choose smaller photos (or take a new photo with lower resolution) and try again.');
        return;
      }

      await updateUser(payload);
      alert('Submitted! Your verification is now pending review.');

      setPassportFront(null);
      setPassportBack(null);
      // clear file inputs so selecting same file again works
      if (passportFrontInputRef.current) passportFrontInputRef.current.value = '';
      if (passportBackInputRef.current) passportBackInputRef.current.value = '';
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        const compressed = await compressImage(base64Str);
        setFormData(prev => ({ ...prev, avatar: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const payload: any = { ...formData };
      // convert age back to number (or omit if empty)
      const trimmedAge = String(formData.age ?? '').trim();
      if (trimmedAge === '') {
        delete payload.age;
      } else {
        const n = Number(trimmedAge);
        payload.age = Number.isFinite(n) ? n : 0;
      }

      await updateUser(payload);
      if (user.role === 'BUDDY') {
        navigate('/buddy/dashboard/settings');
      } else {
        navigate('/traveller/profile');
      }
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <Navbar />

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-16">
        <div className="bg-white rounded-[64px] shadow-premium border border-gray-50 overflow-hidden">
          
          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row">
            
            {/* Left: Avatar & Profile Summary (Fixed style sidebar) */}
            <div className="lg:w-1/3 bg-surface-dark/30 p-12 flex flex-col items-center border-r border-gray-50 space-y-10">
               <div 
                 className="relative group p-1.5 bg-white rounded-full shadow-2xl cursor-pointer"
                 onClick={handleAvatarClick}
               >
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-inner relative">
                     <img 
                       src={formData.avatar || `https://i.pravatar.cc/200?u=${user.id}`} 
                       alt="Profile" 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                     />
                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="text-white" size={32} />
                     </div>
                  </div>
                  <div className="absolute -bottom-2 right-4 bg-primary text-white p-4 rounded-2xl shadow-primary-glow z-20 hover:scale-110 active:scale-95 transition-all">
                     <Camera size={20} />
                  </div>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
               </div>

               <div className="text-center space-y-3">
                  <h2 className="text-3xl font-black text-secondary tracking-tighter">Edit <span className="text-primary italic">Profile</span></h2>
                  <p className="text-secondary/40 font-bold text-sm leading-relaxed px-4">
                     Update your details to maintain a fresh and engaging traveler profile.
                  </p>
               </div>

               <div className="w-full pt-10 space-y-4">
                  <Button 
                    onClick={handleSave} 
                    className="w-full py-5 shadow-primary-glow text-[11px] font-black uppercase tracking-[0.2em] rounded-24 transition-all hover:scale-[1.02] active:scale-95"
                  >
                     Save Changes
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/traveller/profile')} 
                    className="w-full py-5 border-2 border-gray-100 hover:bg-white text-[11px] font-black uppercase tracking-[0.2em] rounded-24 transition-all"
                  >
                     Discard
                  </Button>
               </div>
            </div>

            {/* Right: All Fields in One Unified Layout */}
            <div className="lg:w-2/3 p-12 lg:p-16 space-y-12">
               
               {/* Identity Row */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                        <User size={12} className="text-primary" /> Full Name
                     </label>
                     <input 
                       name="name"
                       value={formData.name}
                       onChange={handleChange}
                       className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 transition-all rounded-[24px] py-4.5 px-6 font-bold text-lg text-secondary outline-none focus:bg-white focus:shadow-premium"
                       placeholder="Jean Doe"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4">Age</label>
                     <input 
                       name="age"
                       type="number"
                       value={formData.age}
                       onChange={handleChange}
                       className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 transition-all rounded-[24px] py-4.5 px-6 font-bold text-lg text-secondary outline-none focus:bg-white focus:shadow-premium"
                       placeholder="25"
                     />
                  </div>
               </div>

               {/* Current Location Row */}
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                     <MapPin size={12} className="text-primary" /> Current Address
                  </label>
                  <input 
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 transition-all rounded-[24px] py-4.5 px-6 font-bold text-lg text-secondary outline-none focus:bg-white focus:shadow-premium"
                    placeholder="Hanoi, Vietnam"
                  />
               </div>

               {/* Origin & Skills */}
               <div className="space-y-8">
                  <SmartSelect 
                    label="Nationality"
                    options={nationalities}
                    value={formData.nationality}
                    onChange={(val) => handleSelectChange('nationality', val)}
                    placeholder="Where are you from?"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <SmartSelect 
                       multiple
                       label="Languages"
                       options={languagesList}
                       value={formData.languages}
                       onChange={(val) => handleSelectChange('languages', val)}
                       placeholder="Add languages..."
                     />
                     <SmartSelect 
                       multiple
                       label="Interests"
                       options={interestsList}
                       value={formData.interests}
                       onChange={(val) => handleSelectChange('interests', val)}
                       placeholder="Add passions..."
                     />
                  </div>
               </div>

               {/* Bio */}
               <div className="space-y-8 pt-6 border-t border-gray-50">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                        <Sparkles size={12} className="text-primary" /> Bio / Story
                     </label>
                     <textarea 
                       name="description"
                       value={formData.description}
                       onChange={handleChange}
                       rows={3}
                       className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 transition-all rounded-[32px] py-6 px-8 font-bold text-secondary outline-none focus:bg-white focus:shadow-premium resize-none italic leading-relaxed"
                       placeholder="Tell your story..."
                     />
                  </div>
               </div>

               {/* Identity Verification (Traveler) */}
               {user.role === 'TRAVELER' && (
                 <div id="identity-verification" className="space-y-8 pt-10 border-t border-gray-50 scroll-mt-32">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                         <Shield size={22} />
                       </div>
                       <div className="space-y-1">
                         <h3 className="text-2xl font-black text-secondary tracking-tight">
                           Identity <span className="text-primary italic">Verification</span>
                         </h3>
                         <p className="text-[10px] font-bold text-secondary/20 uppercase tracking-[0.25em]">
                           Passport/ID front + back
                         </p>
                       </div>
                     </div>
                     {user.verificationStatus === 'verified' ? (
                       <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                         <CheckCircle2 size={14} /> Verified
                       </div>
                     ) : user.verificationStatus === 'pending' ? (
                       <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                         <Clock size={14} /> Pending
                       </div>
                     ) : (
                       <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                         <Shield size={14} /> Unverified
                       </div>
                     )}
                   </div>

                   {user.verificationStatus === 'verified' ? (
                     <div className="p-6 rounded-3xl bg-surface-dark border border-gray-100">
                       <p className="text-[11px] font-bold text-secondary/50">
                         Your identity is verified. Passport/ID documents are locked and cannot be edited.
                       </p>
                     </div>
                   ) : user.verificationStatus === 'pending' ? (
                     <div className="p-6 rounded-3xl bg-surface-dark border border-gray-100 flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary shrink-0">
                         <Clock size={18} />
                       </div>
                       <p className="text-[11px] font-bold text-secondary/50">
                         Your documents are being reviewed. You can&apos;t change passport images while pending.
                       </p>
                     </div>
                   ) : (
                     <>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div
                           onClick={() => passportFrontInputRef.current?.click()}
                           className={`group relative h-52 rounded-[40px] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${
                             passportFront ? 'border-accent-green bg-accent-green/5' : 'border-gray-100 hover:border-primary/20 bg-surface-dark hover:bg-primary/5'
                           }`}
                         >
                           <input
                             type="file"
                             ref={passportFrontInputRef}
                             hidden
                             accept="image/*"
                             onChange={(e) => setPassportFront(e.target.files?.[0] || null)}
                           />
                           {passportFront ? (
                             <div className="text-center space-y-2">
                               <CheckCircle2 className="text-accent-green mx-auto" size={32} />
                               <p className="text-[9px] font-black text-accent-green uppercase tracking-widest">Front Selected</p>
                             </div>
                           ) : (
                             <div className="text-center space-y-3">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-secondary/20 group-hover:text-primary transition-colors shadow-sm">
                                 <FileText size={24} />
                               </div>
                               <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Front Side</p>
                             </div>
                           )}
                         </div>

                         <div
                           onClick={() => passportBackInputRef.current?.click()}
                           className={`group relative h-52 rounded-[40px] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${
                             passportBack ? 'border-accent-green bg-accent-green/5' : 'border-gray-100 hover:border-primary/20 bg-surface-dark hover:bg-primary/5'
                           }`}
                         >
                           <input
                             type="file"
                             ref={passportBackInputRef}
                             hidden
                             accept="image/*"
                             onChange={(e) => setPassportBack(e.target.files?.[0] || null)}
                           />
                           {passportBack ? (
                             <div className="text-center space-y-2">
                               <CheckCircle2 className="text-accent-green mx-auto" size={32} />
                               <p className="text-[9px] font-black text-accent-green uppercase tracking-widest">Back Selected</p>
                             </div>
                           ) : (
                             <div className="text-center space-y-3">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-secondary/20 group-hover:text-primary transition-colors shadow-sm">
                                 <Upload size={24} />
                               </div>
                               <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Back Side</p>
                             </div>
                           )}
                         </div>
                       </div>

                       <Button
                         onClick={handleSubmitVerification}
                         disabled={submittingVerification || !passportFront || !passportBack}
                         className="w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-primary-glow"
                       >
                         {submittingVerification ? 'Submitting...' : 'Submit for Verification'}
                       </Button>
                       <p className="text-[10px] font-bold text-secondary/30 uppercase tracking-[0.3em] text-center">
                         After submit, documents are locked while pending
                       </p>
                     </>
                   )}
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
