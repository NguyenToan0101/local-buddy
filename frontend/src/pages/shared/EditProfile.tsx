import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Sparkles, Loader2, ShieldCheck, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import SmartSelect from '../../components/ui/SmartSelect';
import { touristProfileService } from '../../services/tourist-profile';
import { authService } from '../../services/auth';
import { COUNTRIES, COMMON_LANGUAGES, COMMON_INTERESTS } from '../../types/tourist-profile';
import type { TouristProfileRequest, TouristProfileResponse } from '../../types/tourist-profile';

// Convert countries array to SmartSelect format
const nationalities = COUNTRIES.map(country => ({
  label: country,
  value: country
})).sort((a, b) => a.label.localeCompare(b.label));

// Convert languages array to SmartSelect format  
const languagesList = COMMON_LANGUAGES.map(lang => ({
  label: lang,
  value: lang
})).sort((a, b) => a.label.localeCompare(b.label));

// Convert interests array to SmartSelect format
const interestsList = COMMON_INTERESTS.map(interest => ({
  label: interest,
  value: interest
})).sort((a, b) => a.label.localeCompare(b.label));

const EditProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const evidenceInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    nationality: '',
    description: '',
    languages: [] as string[],
    interests: [] as string[],
    avatar: user?.avatar || '',
    eVisaNumber: '',
    eVisaCountry: '',
    eVisaExpiryDate: '',
    eVisaEvidence: ''
  });

  const [touristProfile, setTouristProfile] = useState<TouristProfileResponse | null>(null);
  const [hasTouristProfile, setHasTouristProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Load tourist profile data
  useEffect(() => {
    const loadTouristProfile = async () => {
      try {
        setLoadingProfile(true);
        const exists = await touristProfileService.checkProfileExists();
        setHasTouristProfile(exists);

        if (exists) {
          const profile = await touristProfileService.getProfile();
          setTouristProfile(profile);

          // Populate form with tourist profile data
          setFormData(prev => ({
            ...prev,
            nationality: profile.nationality || '',
            description: profile.bio || '',
            languages: profile.languages || [],
            interests: profile.interests || [],
            eVisaNumber: profile.eVisaNumber || '',
            eVisaCountry: profile.eVisaCountry || '',
            eVisaExpiryDate: profile.eVisaExpiryDate || '',
            eVisaEvidence: profile.eVisaEvidence || '',
            phone: profile.phone || prev.phone
          }));
        }
      } catch (error) {
        console.error('Error loading tourist profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadTouristProfile();
  }, []);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (formData.avatar.startsWith('blob:')) {
        URL.revokeObjectURL(formData.avatar);
      }
      setAvatarFile(file);
      setFormData(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
    }
  };

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('E-visa evidence must be an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, eVisaEvidence: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      // Prepare user data (only basic fields that exist in User entity)
      let avatarUrl = formData.avatar;
      if (avatarFile) {
        const uploadedUser = await authService.uploadAvatar(avatarFile);
        avatarUrl = uploadedUser.avatar || avatarUrl;
      }

      const userPayload: any = {
        name: formData.name,
        avatar: avatarUrl,
        phone: formData.phone
      };

      // Prepare tourist profile data
      const touristProfilePayload: TouristProfileRequest = {
        nationality: formData.nationality,
        bio: formData.description,
        languages: formData.languages,
        interests: formData.interests,
        eVisaNumber: formData.eVisaNumber,
        eVisaCountry: formData.eVisaCountry,
        eVisaExpiryDate: formData.eVisaExpiryDate,
        eVisaEvidence: formData.eVisaEvidence
      };

      // Update user data (basic fields only)
      await updateUser(userPayload);

      // Update or create tourist profile
      if (hasTouristProfile) {
        await touristProfileService.updateProfile(touristProfilePayload);
      } else {
        await touristProfileService.createProfile(touristProfilePayload);
      }

      // Navigate based on user role
      if (user.role === 'BUDDY') {
        navigate('/buddy/dashboard/settings');
      } else {
        navigate('/traveller/profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (!user) return null;

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
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.src = `https://i.pravatar.cc/200?u=${user.id}`;
                    }}
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
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                />
              </div>

              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-secondary tracking-tighter">Edit <span className="text-primary italic">Profile</span></h2>
                <p className="text-secondary/40 font-bold text-sm leading-relaxed px-4">
                  Update your details to maintain a fresh and engaging traveler profile.
                </p>
              </div>

              <div className="w-full pt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full btn-primary"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/traveller/profile')}
                  className="w-full btn-ghost"
                >
                  Discard
                </button>
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
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 transition-all rounded-[24px] py-4.5 px-6 font-bold text-lg text-secondary outline-none focus:bg-white focus:shadow-premium"
                    placeholder="+84 123 456 789"
                  />
                </div>
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

              {/* E-visa evidence */}
              <div className="space-y-6 pt-6 border-t border-gray-50">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-secondary tracking-tight">E-visa Evidence</h3>
                    <p className="mt-1 text-[10px] font-bold text-secondary/35 uppercase tracking-widest">
                      Passport upload is not required for traveler onboarding
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4">E-visa Number</label>
                    <input
                      name="eVisaNumber"
                      value={formData.eVisaNumber}
                      onChange={handleChange}
                      className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 transition-all rounded-[24px] py-4 px-5 font-bold text-sm text-secondary outline-none focus:bg-white focus:shadow-premium"
                      placeholder="EV-2026-001234"
                    />
                  </div>
                  <div>
                    <SmartSelect
                      label="Issuing Country"
                      options={nationalities}
                      value={formData.eVisaCountry}
                      onChange={(val) => handleSelectChange('eVisaCountry', val)}
                      placeholder="Visa country"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4">Expiry Date</label>
                    <input
                      name="eVisaExpiryDate"
                      type="date"
                      value={formData.eVisaExpiryDate}
                      onChange={handleChange}
                      className="w-full bg-surface-dark border-2 border-transparent focus:border-primary/10 transition-all rounded-[24px] py-4 px-5 font-bold text-sm text-secondary outline-none focus:bg-white focus:shadow-premium"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                    <FileText size={12} className="text-primary" /> Evidence Image
                  </label>
                  <button
                    type="button"
                    onClick={() => evidenceInputRef.current?.click()}
                    className="relative flex min-h-[220px] w-full overflow-hidden rounded-[32px] border-2 border-dashed border-slate-100 bg-surface-dark transition-all hover:border-primary/20 hover:bg-white"
                  >
                    {formData.eVisaEvidence ? (
                      <img src={formData.eVisaEvidence} alt="E-visa evidence" className="h-full max-h-[320px] w-full object-cover" />
                    ) : (
                      <span className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 text-secondary/25">
                        <Upload size={28} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Add E-visa evidence</span>
                      </span>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={evidenceInputRef}
                    onChange={handleEvidenceFileChange}
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold text-secondary/35">
                      Upload a screenshot or photo of the E-visa approval page.
                    </p>
                    {formData.eVisaEvidence && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, eVisaEvidence: '' }))}
                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
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

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
