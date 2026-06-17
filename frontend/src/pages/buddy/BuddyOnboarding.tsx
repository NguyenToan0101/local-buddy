import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Camera, Phone, CreditCard, Shield, MapPin, 
  Sparkles, Languages, Upload, Clock, ArrowRight, ArrowLeft, Check, Compass 
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { buddyService, type Buddy } from '../../services/api';
import { COMMON_LANGUAGES, COMMON_INTERESTS } from '../../types/tourist-profile';

const BuddyOnboarding: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [buddyData, setBuddyData] = useState<Partial<Buddy>>({
    name: '',
    age: 22,
    location: '',
    phone: '',
    price: 15,
    description: '',
    languages: [],
    interests: [],
    tags: []
  });

  const [selfiePreviewIsVideo, setSelfiePreviewIsVideo] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const getBuddyId = () => {
    let buddyId = user?.id || '';
    if (buddyId.startsWith('buddy-')) buddyId = buddyId.replace('buddy-', '');
    return buddyId;
  };

  const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    return /\/video\/upload\//.test(url) || /\.(mp4|webm)(\?|$)/i.test(url);
  };

  useEffect(() => {
    const fetchBuddy = async () => {
      if (!user) return;
      try {
        const data = await buddyService.getById(getBuddyId());
        setBuddyData(prev => ({ ...prev, ...data }));
        setSelfiePreviewIsVideo(isVideoUrl(data.selfieUrl));
      } catch (error) {
        console.error("Error fetching buddy data for onboarding:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuddy();
  }, [user]);

  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    let intervalId: any;
    if (buddyData.verificationStatus === 'processing' || isPolling) {
      intervalId = setInterval(async () => {
        try {
          const buddyId = getBuddyId();
          if (!buddyId) return;
          const updated = await buddyService.getById(buddyId);
          setBuddyData(prev => ({ ...prev, ...updated }));
          setSelfiePreviewIsVideo(isVideoUrl(updated.selfieUrl));
          if (updated.verificationStatus !== 'processing' && !isPolling) {
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error polling verification status:", error);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [buddyData.verificationStatus, isPolling]);

  const triggerPolling = () => {
    setIsPolling(true);
    setTimeout(() => {
      setIsPolling(false);
    }, 12000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBuddyData(prev => ({ 
      ...prev, 
      [name]: name === 'age' || name === 'price' ? (parseFloat(value) || 0) : value 
    }));
  };

  const handleToggleLanguage = (lang: string) => {
    setBuddyData(prev => {
      const current = prev.languages || [];
      const updated = current.includes(lang) 
        ? current.filter(l => l !== lang) 
        : [...current, lang];
      return { ...prev, languages: updated };
    });
  };

  const handleToggleInterest = (interest: string) => {
    setBuddyData(prev => {
      const current = prev.interests || [];
      const updated = current.includes(interest) 
        ? current.filter(i => i !== interest) 
        : [...current, interest];
      return { ...prev, interests: updated };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const field = side === 'front' ? 'idCardFront' : 'idCardBack';
      const previewUrl = URL.createObjectURL(file);
      setBuddyData(prev => ({ ...prev, [field]: previewUrl, verificationStatus: 'processing' }));
      triggerPolling();
      try {
        const updated = await buddyService.uploadIdCard(getBuddyId(), side, file);
        setBuddyData(prev => ({ ...prev, ...updated }));
        triggerPolling();
      } catch (error) {
        console.error("Error uploading ID card side:", error);
      }
    }
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert("Verification requires a video file for liveness detection.");
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setSelfiePreviewIsVideo(true);
      setBuddyData(prev => ({ ...prev, selfieUrl: previewUrl, verificationStatus: 'processing' }));
      triggerPolling();
      try {
        const updated = await buddyService.uploadSelfie(getBuddyId(), file);
        setBuddyData(prev => ({ ...prev, ...updated }));
        setSelfiePreviewIsVideo(isVideoUrl(updated.selfieUrl));
        triggerPolling();
      } catch (error) {
        console.error("Error uploading selfie video:", error);
      }
    }
  };

  const handleSaveAndNext = async () => {
    setSaving(true);
    try {
      const { reviews, id, verificationStatus, ...rest } = buddyData;
      await buddyService.updateProfile(getBuddyId(), rest);
      await updateUser({
        name: buddyData.name,
        location: buddyData.location,
        description: buddyData.description,
        avatar: buddyData.image,
        verificationStatus: buddyData.verificationStatus
      });
      setStep(prev => prev + 1);
    } catch (error) {
      console.error("Error updating onboarding details:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.3em]">Loading Onboarding Info...</p>
      </div>
    </div>
  );

  const stepsLabel = ["Identity", "Skills", "Security", "Bio", "Welcome"];

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col justify-between pb-20 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Progress header bar */}
      <div className="w-full max-w-md mx-auto px-6 pt-8 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-primary-glow">
              <Compass size={16} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Guide Onboarding</span>
          </div>
          <span className="text-[10px] font-black text-primary uppercase">Step {step}/5</span>
        </div>

        {/* Progress tracks */}
        <div className="flex items-center justify-between gap-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
          {stepsLabel.map((_, index) => (
            <div 
              key={index} 
              className={`h-full flex-1 rounded-full transition-all duration-300 ${index + 1 <= step ? 'bg-primary' : 'bg-gray-100'}`}
            />
          ))}
        </div>
      </div>

      {/* Step Panels wrapper */}
      <div className="flex-1 w-full max-w-md mx-auto px-6 py-6 flex flex-col justify-center z-10">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* STEP 1: Basic profile fields */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-secondary tracking-tight">Tell us <span className="text-primary italic">who you are</span></h2>
                <p className="text-[8px] text-secondary/40 font-bold uppercase tracking-widest">Let's verify your basic contact details</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input name="name" value={buddyData.name || ''} onChange={handleChange} placeholder="Linh Nguyen" className="w-full bg-surface border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">Age</label>
                    <input name="age" type="number" value={buddyData.age || ''} onChange={handleChange} className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">Hourly Rate ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-secondary/25 text-xs">$</span>
                      <input name="price" type="number" value={buddyData.price || ''} onChange={handleChange} className="w-full bg-surface border border-gray-100 rounded-xl pl-8 pr-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10"/>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">Base Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input name="location" value={buddyData.location || ''} onChange={handleChange} placeholder="Da Nang, Vietnam" className="w-full bg-surface border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10"/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                    <input name="phone" value={buddyData.phone || ''} onChange={handleChange} placeholder="+84 901 234 567" className="w-full bg-surface border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10"/>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Passions selection toggle chips */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-secondary tracking-tight">Languages & <span className="text-primary italic">Interests</span></h2>
                <p className="text-[8px] text-secondary/40 font-bold uppercase tracking-widest">Connect with travelers sharing similar specialties</p>
              </div>

              {/* Languages spoken */}
              <div className="space-y-2">
                <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Languages size={10} className="text-primary" /> Spoken Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_LANGUAGES.map(lang => {
                    const isSelected = (buddyData.languages || []).includes(lang);
                    return (
                      <button
                        key={lang}
                        onClick={() => handleToggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-none cursor-pointer ${
                          isSelected 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-surface text-secondary/50 hover:bg-gray-100'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interests categories */}
              <div className="space-y-2 pt-2">
                <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Sparkles size={10} className="text-primary" /> Interests & Categories</label>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {COMMON_INTERESTS.map(interest => {
                    const isSelected = (buddyData.interests || []).includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => handleToggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-none cursor-pointer ${
                          isSelected 
                          ? 'bg-primary text-white shadow-sm' 
                          : 'bg-surface text-secondary/50 hover:bg-gray-100'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EKYC verification photo uploads */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-secondary tracking-tight">Identity <span className="text-primary italic">Verification</span></h2>
                  <p className="text-[8px] text-secondary/40 font-bold uppercase tracking-widest">Platform security relies on guide verification</p>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-200/20 text-[7px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={8} /> OCR SCAN
                </span>
              </div>

              <div className="space-y-4">
                {/* ID front */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">ID Front Image</label>
                  <div 
                    onClick={() => frontInputRef.current?.click()}
                    className="aspect-[1.8/1] bg-surface rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group/upload"
                  >
                    {buddyData.idCardFront ? (
                      <div className="w-full h-full relative">
                         <img src={buddyData.idCardFront} className="w-full h-full object-cover" alt="ID Front" />
                         <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white" size={20} />
                         </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-secondary/15 mb-1" size={20} />
                        <p className="text-[8px] font-black text-secondary/20 uppercase tracking-widest">Select front photo</p>
                      </>
                    )}
                    <input type="file" ref={frontInputRef} onChange={(e) => handleFileUpload(e, 'front')} className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" />
                  </div>

                  {buddyData.idCardFront && buddyData.qualityScore !== undefined && (
                    <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider ${buddyData.qualityScore >= 70 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {buddyData.qualityScore >= 70 ? '✅ Resolution check passed' : '⚠️ Image resolution blurry'} ({Math.round(buddyData.qualityScore)}%)
                    </div>
                  )}
                  {buddyData.idCardFront && buddyData.extractedFullName && (
                    <div className="bg-surface border border-gray-100 rounded-xl p-3 text-[8px] space-y-1 font-black uppercase tracking-wider text-secondary/40 leading-none">
                      <p><span className="opacity-55">Name:</span> <span className="text-secondary italic">{buddyData.extractedFullName}</span></p>
                      {buddyData.extractedIdNumber && <p><span className="opacity-55">ID:</span> <span className="text-secondary">{buddyData.extractedIdNumber}</span></p>}
                    </div>
                  )}
                </div>

                {/* ID back */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">ID Back Image</label>
                  <div 
                    onClick={() => backInputRef.current?.click()}
                    className="aspect-[1.8/1] bg-surface rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group/upload"
                  >
                    {buddyData.idCardBack ? (
                      <div className="w-full h-full relative">
                         <img src={buddyData.idCardBack} className="w-full h-full object-cover" alt="ID Back" />
                         <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white" size={20} />
                         </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-secondary/15 mb-1" size={20} />
                        <p className="text-[8px] font-black text-secondary/20 uppercase tracking-widest">Select back photo</p>
                      </>
                    )}
                    <input type="file" ref={backInputRef} onChange={(e) => handleFileUpload(e, 'back')} className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" />
                  </div>
                </div>

                {/* Selfie video */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-widest ml-1">Selfie Liveness Video</label>
                  <div 
                    onClick={() => selfieInputRef.current?.click()}
                    className="aspect-[2.2/1] bg-surface rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden relative group/upload"
                  >
                    {buddyData.selfieUrl ? (
                      selfiePreviewIsVideo ? (
                        <video src={buddyData.selfieUrl} className="w-full h-full object-cover" controls muted playsInline />
                      ) : (
                        <img src={buddyData.selfieUrl} className="w-full h-full object-cover" alt="Selfie" />
                      )
                    ) : (
                      <>
                        <Camera className="text-secondary/15 mb-1" size={20} />
                        <p className="text-[8px] font-black text-secondary/20 uppercase tracking-widest">Select video</p>
                      </>
                    )}
                    <input type="file" ref={selfieInputRef} onChange={handleSelfieUpload} className="hidden" accept="video/mp4,video/webm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Bio story narrative */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-secondary tracking-tight">Your <span className="text-primary italic">Story</span></h2>
                <p className="text-[8px] text-secondary/40 font-bold uppercase tracking-widest">Write a short biography introducing yourself</p>
              </div>

              <div className="space-y-4">
                <textarea 
                  name="description" 
                  rows={4} 
                  value={buddyData.description || ''} 
                  onChange={handleChange} 
                  className="w-full bg-surface border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 resize-none italic leading-relaxed" 
                  placeholder="E.g. Hi, I'm Linh! I love hidden photography spots and food streets cafes tour..."
                />

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-secondary/60 text-[10px] font-bold leading-relaxed">
                  <Sparkles size={16} className="text-amber-500 shrink-0" />
                  <p>
                    💡 <b>Pro Tip</b>: Guides with clear bio details and local tour narratives receive <b>5x more bookings</b>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Success wizard completed */}
          {step === 5 && (
            <div className="space-y-6 text-center py-4 animate-in fade-in duration-500">
              <div className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-md mx-auto relative">
                <div className="absolute inset-0 bg-green-500 rounded-2xl animate-ping opacity-25"></div>
                <Check size={28} strokeWidth={3} className="relative z-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-secondary tracking-tight">Onboarding Complete!</h2>
                <p className="text-xs font-bold text-secondary/50 max-w-xs mx-auto leading-relaxed">
                  Your documents have been submitted for review.
                </p>
              </div>

              <div className="bg-surface border border-gray-100 rounded-2xl p-4 space-y-2 text-left text-[10px] font-bold leading-normal">
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock size={12} className="animate-pulse" />
                  <span className="font-black uppercase tracking-wider">Queue status</span>
                </div>
                <p className="text-secondary/70">
                  {buddyData.autoVerificationMessage || "Your files are being processed. Verification completes within a few minutes."}
                </p>
              </div>
            </div>
          )}

          {/* Footer Controls Navigation */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-50 mt-4">
            {step > 1 && step < 5 ? (
              <button 
                onClick={() => setStep(prev => prev - 1)}
                className="w-10 h-10 rounded-xl bg-surface border-none text-secondary/40 hover:text-secondary flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button 
                onClick={handleSaveAndNext}
                disabled={saving}
                className="flex-1 max-w-[12rem] bg-primary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Next Step'} <ArrowRight size={14} />
              </Button>
            ) : step === 4 ? (
              <Button 
                onClick={handleSaveAndNext}
                disabled={saving}
                className="flex-1 max-w-[12rem] bg-secondary text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Finish Setup'} <Check size={14} />
              </Button>
            ) : (
              <Button 
                onClick={() => navigate('/buddy/dashboard')}
                className="w-full bg-primary text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Go to Dashboard <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuddyOnboarding;
