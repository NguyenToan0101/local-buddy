import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Camera, Phone, CreditCard, Shield, MapPin, Sparkles, 
  Languages, Upload, Clock, CheckCircle, AlertTriangle, Eye,
  Lock, Check, Trash2, Award, FileText, Activity, ChevronRight,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { buddyService, type Buddy } from '../../services/api';
import SmartSelect from '../ui/SmartSelect';
import TagSelector from '../registration/TagSelector';
import { COMMON_LANGUAGES, COMMON_INTERESTS } from '../../types/tourist-profile';

const languageOptions = COMMON_LANGUAGES.map(lang => ({ label: lang, value: lang }));
const interestOptions = COMMON_INTERESTS.map(interest => ({ label: interest, value: interest }));

const SettingsTab: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [buddyData, setBuddyData] = useState<Partial<Buddy>>({});
  const [selfiePreviewIsVideo, setSelfiePreviewIsVideo] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'rates' | 'verification'>('profile');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const getBuddyId = () => {
    let buddyId = user?.id || '';
    if (buddyId.startsWith('buddy-')) buddyId = buddyId.replace('buddy-', '');
    return buddyId;
  };

  const isVerifiedStatus = (status?: string) =>
    status === 'verified' || status === 'auto_approved' || status === 'manual_approved';

  const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    return /\/video\/upload\//.test(url) || /\.(mp4|webm)(\?|$)/i.test(url);
  };

  useEffect(() => {
    const fetchBuddy = async () => {
      if (!user) return;
      const buddyId = getBuddyId();
      
      try {
        const data = await buddyService.getById(buddyId);
        setBuddyData(data);
        setSelfiePreviewIsVideo(isVideoUrl(data.selfieUrl));
      } catch (error) {
        console.error("Error fetching buddy data:", error);
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
          console.error("Error polling verification:", error);
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

  const handleSelectChange = (name: string, value: string[]) => {
    setBuddyData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (isVerifiedStatus(buddyData.verificationStatus)) return;
    const file = e.target.files?.[0];
    if (file) {
      const field = side === 'front' ? 'idCardFront' : 'idCardBack';
      const previousValue = buddyData[field];
      if (typeof previousValue === 'string' && previousValue.startsWith('blob:')) {
        URL.revokeObjectURL(previousValue);
      }
      const previewUrl = URL.createObjectURL(file);
      setBuddyData(prev => ({ ...prev, [field]: previewUrl, verificationStatus: 'processing' }));
      triggerPolling();
      try {
        const updated = await buddyService.uploadIdCard(getBuddyId(), side, file);
        setBuddyData(prev => ({ ...prev, ...updated }));
        triggerPolling();
      } catch (error) {
        console.error("Error uploading ID card:", error);
        setBuddyData(prev => ({ ...prev, [field]: previousValue }));
      }
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previousImage = buddyData.image;
      if (typeof previousImage === 'string' && previousImage.startsWith('blob:')) {
        URL.revokeObjectURL(previousImage);
      }
      const previewUrl = URL.createObjectURL(file);
      setBuddyData(prev => ({ ...prev, image: previewUrl }));
      try {
        const updated = await buddyService.uploadAvatar(getBuddyId(), file);
        setBuddyData(prev => ({ ...prev, ...updated }));
      } catch (error) {
        console.error("Error uploading avatar:", error);
        setBuddyData(prev => ({ ...prev, image: previousImage }));
      }
    }
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isVerifiedStatus(buddyData.verificationStatus)) return;
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        console.error("Liveness verification requires a video file.");
        return;
      }
      const previousValue = buddyData.selfieUrl;
      if (typeof previousValue === 'string' && previousValue.startsWith('blob:')) {
        URL.revokeObjectURL(previousValue);
      }
      const previewUrl = URL.createObjectURL(file);
      setSelfiePreviewIsVideo(file.type.startsWith('video/'));
      setBuddyData(prev => ({ ...prev, selfieUrl: previewUrl, verificationStatus: 'processing' }));
      triggerPolling();
      try {
        const updated = await buddyService.uploadSelfie(getBuddyId(), file);
        setBuddyData(prev => ({ ...prev, ...updated }));
        setSelfiePreviewIsVideo(isVideoUrl(updated.selfieUrl) || file.type.startsWith('video/'));
        triggerPolling();
      } catch (error) {
        console.error("Error uploading selfie:", error);
        setBuddyData(prev => ({ ...prev, selfieUrl: previousValue }));
        setSelfiePreviewIsVideo(isVideoUrl(previousValue));
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const buddyId = getBuddyId();

    try {
      const { reviews, id, verificationStatus, ...rest } = buddyData;
      const cleanData = { ...rest };
      
      await buddyService.updateProfile(buddyId, cleanData);
      
      await updateUser({
        name: buddyData.name,
        location: buddyData.location,
        description: buddyData.description,
        avatar: buddyData.image,
        verificationStatus: buddyData.verificationStatus,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = () => {
    const status = buddyData.verificationStatus || 'unverified';
    switch (status) {
      case 'verified':
      case 'auto_approved':
      case 'manual_approved':
        return { 
          label: 'Verified Guide', 
          color: 'text-emerald-600 border-emerald-200/50 bg-emerald-500/[0.04]', 
          badgeColor: 'bg-emerald-500 text-white',
          icon: CheckCircle,
          desc: 'Your host identity verification audit has been approved. Your listing is fully active.' 
        };
      case 'processing':
        return {
          label: 'Processing OCR Audit',
          color: 'text-blue-600 border-blue-200/50 bg-blue-500/[0.04]',
          badgeColor: 'bg-blue-500 text-white animate-pulse',
          icon: Clock,
          desc: 'AI algorithms are checking document OCR values and selfie video liveness.'
        };
      case 'manual_review':
      case 'pending':
        return { 
          label: 'Pending Support Review',
          color: 'text-amber-600 border-amber-200/50 bg-amber-500/[0.04]', 
          badgeColor: 'bg-amber-500 text-white animate-pulse',
          icon: Clock,
          desc: 'OCR scores require manual support review. Verification completes within 24h.'
        };
      case 'rejected':
      case 'auto_rejected':
      case 'manual_rejected':
        return {
          label: 'Verification Rejected',
          color: 'text-rose-600 border-rose-200/50 bg-rose-500/[0.04]',
          badgeColor: 'bg-rose-500 text-white',
          icon: AlertTriangle,
          desc: buddyData.rejectionReason || 'Please re-upload higher resolution ID photos and a valid selfie video.'
        };
      default:
        return { 
          label: 'Identity Unverified', 
          color: 'text-rose-600 border-rose-200/50 bg-rose-500/[0.04]', 
          badgeColor: 'bg-rose-500 text-white',
          icon: AlertTriangle,
          desc: 'Upload identification files to activate your profile on the search explore feeds.' 
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16 relative">
      
      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D1E17] text-white px-5 py-3.5 rounded-2xl shadow-premium border border-white/5 flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check size={12} strokeWidth={3} className="text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider">Host profile saved successfully</span>
        </div>
      )}

      {/* Verification Status Header */}
      {!isVerifiedStatus(buddyData.verificationStatus) && (
        <div className={`p-5 rounded-2xl ${statusConfig.color} border border-solid flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-all`}>
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center">
              <statusConfig.icon size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">{statusConfig.label}</h4>
              <p className="text-[9.5px] font-bold opacity-80 leading-relaxed mt-0.5 max-w-xl">{statusConfig.desc}</p>
            </div>
          </div>
          {buddyData.verificationStatus === 'unverified' && (
            <span className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest animate-pulse shrink-0">
              Action Required
            </span>
          )}
        </div>
      )}

      {/* Primary Section Header */}
      <div className="pb-5 border-b border-gray-100">
        <h3 className="text-xl font-black text-secondary tracking-tight">Host Account Settings</h3>
        <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mt-1">
          Configure listing preferences, rates, biography stories, and verify guide badges
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Sidebar category navigations & Avatar card */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Avatar card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/80 flex flex-col items-center text-center space-y-5">
            <div className="relative group/avatar cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <div className="w-28 h-28 rounded-2xl bg-surface-dark overflow-hidden border-[4px] border-white shadow-md transition-all duration-300 group-hover/avatar:scale-[1.02] group-hover/avatar:brightness-95">
                <img src={buddyData.image || `https://i.pravatar.cc/300?u=${user?.id}`} alt="Buddy" className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 w-28 h-28 rounded-2xl bg-black/30 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 pointer-events-none">
                <Camera size={20} />
                <span className="text-[7px] font-black uppercase tracking-wider mt-1">Change Image</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm border-4 border-white">
                <Camera size={14} />
              </div>
              <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/jpeg,image/jpg,image/png,image/webp" 
              />
            </div>

            <div className="space-y-1.5 w-full">
              <h4 className="text-sm font-black text-secondary tracking-tight uppercase">{buddyData.name}</h4>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-solid ${
                isVerifiedStatus(buddyData.verificationStatus) 
                ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                : 'text-amber-600 bg-amber-50 border-amber-100'
              }`}>
                ● {isVerifiedStatus(buddyData.verificationStatus) ? 'Verified Guide' : 'Verification Needed'}
              </span>
            </div>
          </div>

          {/* Internal subtab navigation */}
          <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100/80 flex flex-col gap-1">
            {[
              { id: 'profile', label: 'Public Profile Info', icon: User },
              { id: 'rates', label: 'Pricing & Expertise', icon: CreditCard },
              { id: 'verification', label: 'Identity & EKYC Audit', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer border border-solid ${
                    active
                    ? 'bg-primary/5 border-primary/10 text-primary font-black shadow-sm'
                    : 'bg-transparent border-transparent text-secondary/40 hover:bg-gray-50 hover:text-secondary'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                  {active && <ChevronRight size={14} className="ml-auto text-primary" />}
                </button>
              );
            })}
          </div>

          {/* Security Banner Info */}
          <div className="bg-secondary text-white rounded-3xl p-5 space-y-3 shadow-md border border-white/5 relative overflow-hidden">
            <div className="absolute top-[-30px] right-[-30px] opacity-5 pointer-events-none">
              <Shield size={120} />
            </div>
            <h5 className="text-[9px] font-black uppercase tracking-widest text-primary">Biometric Security</h5>
            <p className="text-white/50 text-[9px] font-bold leading-normal tracking-wide">
              Identification records are processed securely under Platform Trust metrics. Personal ID details are encrypted and never exposed publicly.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Settings Content Forms */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100/80 min-h-[480px]">
          
          {/* TAB 1: Profile Info Form */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                <User size={16} className="text-primary" />
                <h4 className="text-xs font-black text-secondary uppercase tracking-wider">Public Profile Settings</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">Full Listing Name</label>
                  <input 
                    name="name" 
                    value={buddyData.name || ''} 
                    onChange={handleChange} 
                    className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">Host Age</label>
                  <input 
                    name="age" 
                    type="number" 
                    value={buddyData.age || ''} 
                    onChange={handleChange} 
                    className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">Base Location Coordinates</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" size={13} />
                    <input 
                      name="location" 
                      value={buddyData.location || ''} 
                      onChange={handleChange} 
                      className="w-full bg-surface border border-gray-100 rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" size={13} />
                    <input 
                      name="phone" 
                      value={buddyData.phone || ''} 
                      onChange={handleChange} 
                      className="w-full bg-surface border border-gray-100 rounded-xl pl-9 pr-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">Biography introduction</label>
                <textarea 
                  name="description" 
                  rows={5} 
                  value={buddyData.description || ''} 
                  onChange={handleChange} 
                  className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 resize-none leading-relaxed transition-all focus:bg-white"
                  placeholder="Share details about your tours, cafes locations, and knowledge..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Expertise Form */}
          {activeSubTab === 'rates' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                <CreditCard size={16} className="text-primary" />
                <h4 className="text-xs font-black text-secondary uppercase tracking-wider">Service Rates & Experience Categories</h4>
              </div>

              {/* Service pricing */}
              <div className="space-y-2">
                <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">Hourly Escrow Rate ($)</label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-secondary/40 text-base">$</span>
                  <input 
                    name="price" 
                    type="number" 
                    value={buddyData.price || ''} 
                    onChange={handleChange} 
                    className="w-full bg-surface border border-gray-100 rounded-xl pl-8 pr-12 py-3.5 font-black text-base text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-secondary/30 uppercase tracking-widest">/ hr</span>
                </div>
                <p className="text-[8px] text-secondary/35 uppercase font-bold tracking-wider ml-1">Recommended rates fluctuate between $15.00 - $35.00 based on ratings.</p>
              </div>

              {/* Language and tags */}
              <div className="space-y-4 pt-2">
                <SmartSelect
                  multiple
                  label="Spoken Languages"
                  options={languageOptions}
                  value={buddyData.languages || []}
                  onChange={(val) => handleSelectChange('languages', val)}
                  placeholder="Select languages"
                />
                
                <SmartSelect
                  multiple
                  label="Host Interests"
                  options={interestOptions}
                  value={buddyData.interests || []}
                  onChange={(val) => handleSelectChange('interests', val)}
                  placeholder="Select interests"
                />
                
                <TagSelector 
                  label="Tour Categories Expertise"
                  tags={buddyData.tags || []}
                  onAddTag={(tag) => {
                    const currentTags = buddyData.tags || [];
                    if (!currentTags.includes(tag)) {
                      setBuddyData(prev => ({ ...prev, tags: [...currentTags, tag] }));
                    }
                  }}
                  onRemoveTag={(tag) => {
                    setBuddyData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
                  }}
                  placeholder="Add categories (e.g. History, Photography)"
                  suggestions={['Food Tour', 'History', 'Hidden Gems', 'Photography', 'Nightlife', 'Cafes']}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Identity & EKYC Verification Form */}
          {activeSubTab === 'verification' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  <h4 className="text-xs font-black text-secondary uppercase tracking-wider">Identity Verification Files (EKYC)</h4>
                </div>
                {isVerifiedStatus(buddyData.verificationStatus) && (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle size={10} /> Verified ID
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* ID Front */}
                <div className="space-y-2.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">ID Card - Front Side</label>
                  
                  <div 
                    onClick={isVerifiedStatus(buddyData.verificationStatus) ? undefined : () => frontInputRef.current?.click()}
                    className={`aspect-[1.58/1] bg-[#F9FAFB] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden relative transition-all duration-300 ${
                      isVerifiedStatus(buddyData.verificationStatus)
                      ? 'border-gray-100 cursor-default'
                      : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50/20 cursor-pointer'
                    }`}
                  >
                    {buddyData.idCardFront ? (
                      <div className="w-full h-full relative group">
                        <img src={buddyData.idCardFront} className="w-full h-full object-cover" alt="ID Front" />
                        {!isVerifiedStatus(buddyData.verificationStatus) && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1.5">
                            <Upload size={18} />
                            <span className="text-[8px] font-black uppercase tracking-wider">Change photo</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <Upload className="text-secondary/20 mx-auto" size={18} />
                        <span className="block text-[8px] font-black text-secondary/40 uppercase tracking-widest">Front Side image</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={frontInputRef} 
                      onChange={(e) => handleFileUpload(e, 'front')} 
                      className="hidden" 
                      accept="image/jpeg,image/jpg,image/png,image/webp" 
                    />
                  </div>

                  {/* OCR extracted status */}
                  {buddyData.idCardFront && buddyData.qualityScore !== undefined && (
                    <div className="bg-emerald-500/[0.03] p-3 rounded-2xl border border-emerald-500/10 flex items-center justify-between text-[8px] font-black uppercase tracking-wider">
                      <span className="text-secondary/45">OCR Quality Index</span>
                      <span className={buddyData.qualityScore >= 70 ? 'text-emerald-600' : 'text-rose-500'}>
                        {Math.round(buddyData.qualityScore)}%
                      </span>
                    </div>
                  )}

                  {buddyData.idCardFront && buddyData.extractedFullName && (
                    <div className="bg-surface p-3.5 rounded-2xl border border-gray-50 text-[8px] font-black uppercase tracking-wider text-secondary/45 space-y-1">
                      <div className="flex justify-between">
                        <span className="opacity-60">Full Name:</span> 
                        <span className="text-secondary">{buddyData.extractedFullName}</span>
                      </div>
                      {buddyData.extractedIdNumber && (
                        <div className="flex justify-between">
                          <span className="opacity-60">ID Number:</span> 
                          <span className="text-secondary tracking-widest">{buddyData.extractedIdNumber}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ID Back */}
                <div className="space-y-2.5">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider ml-1">ID Card - Back Side</label>
                  
                  <div 
                    onClick={isVerifiedStatus(buddyData.verificationStatus) ? undefined : () => backInputRef.current?.click()}
                    className={`aspect-[1.58/1] bg-[#F9FAFB] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden relative transition-all duration-300 ${
                      isVerifiedStatus(buddyData.verificationStatus)
                      ? 'border-gray-100 cursor-default'
                      : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50/20 cursor-pointer'
                    }`}
                  >
                    {buddyData.idCardBack ? (
                      <div className="w-full h-full relative group">
                        <img src={buddyData.idCardBack} className="w-full h-full object-cover" alt="ID Back" />
                        {!isVerifiedStatus(buddyData.verificationStatus) && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1.5">
                            <Upload size={18} />
                            <span className="text-[8px] font-black uppercase tracking-wider">Change photo</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <Upload className="text-secondary/20 mx-auto" size={18} />
                        <span className="block text-[8px] font-black text-secondary/40 uppercase tracking-widest">Back Side image</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={backInputRef} 
                      onChange={(e) => handleFileUpload(e, 'back')} 
                      className="hidden" 
                      accept="image/jpeg,image/jpg,image/png,image/webp" 
                    />
                  </div>
                </div>

              </div>

              {/* Selfie video liveness check */}
              <div className="space-y-2.5 pt-2.5 border-t border-gray-50">
                <div className="flex justify-between items-baseline ml-1">
                  <label className="text-[8px] font-black text-secondary/40 uppercase tracking-wider">Liveness Verification Selfie Video</label>
                  {!isVerifiedStatus(buddyData.verificationStatus) && (
                    <span className="text-[8px] text-primary font-bold uppercase tracking-wide">Requires 3s video clip</span>
                  )}
                </div>
                
                <div 
                  onClick={isVerifiedStatus(buddyData.verificationStatus) ? undefined : () => selfieInputRef.current?.click()}
                  className={`aspect-[2.5/1] bg-[#F9FAFB] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden relative transition-all duration-300 ${
                    isVerifiedStatus(buddyData.verificationStatus)
                    ? 'border-gray-100 cursor-default'
                    : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50/20 cursor-pointer'
                  }`}
                >
                  {buddyData.selfieUrl ? (
                    selfiePreviewIsVideo ? (
                      <video src={buddyData.selfieUrl} className="w-full h-full object-cover" controls muted playsInline />
                    ) : (
                      <img src={buddyData.selfieUrl} className="w-full h-full object-cover" alt="Selfie" />
                    )
                  ) : (
                    <div className="text-center space-y-1">
                      <Camera className="text-secondary/20 mx-auto" size={18} />
                      <span className="block text-[8px] font-black text-secondary/40 uppercase tracking-widest">Upload selfie video</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={selfieInputRef} 
                    onChange={handleSelfieUpload} 
                    className="hidden" 
                    accept="video/mp4,video/webm" 
                  />
                </div>

                {/* Score indicators */}
                {buddyData.selfieUrl && buddyData.faceMatchScore !== undefined && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    
                    {/* Face Match Progress Ring */}
                    <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h5 className="text-[9px] font-black text-secondary uppercase tracking-widest">Face Match</h5>
                        <p className="text-[8px] font-bold text-secondary/40 uppercase">Compared against ID OCR photo</p>
                      </div>
                      <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                        <svg className="w-11 h-11 transform -rotate-90">
                          <circle cx="22" cy="22" r="18" stroke="#E5E7EB" strokeWidth="2.5" fill="transparent" />
                          <circle cx="22" cy="22" r="18" stroke="#10B981" strokeWidth="2.5" fill="transparent" 
                            strokeDasharray={`${2 * Math.PI * 18}`}
                            strokeDashoffset={`${2 * Math.PI * 18 * (1 - buddyData.faceMatchScore / 100)}`}
                          />
                        </svg>
                        <span className="absolute text-[9px] font-black text-emerald-600">{Math.round(buddyData.faceMatchScore)}%</span>
                      </div>
                    </div>

                    {/* Liveness Spoof Check */}
                    {buddyData.livenessScore !== undefined && (
                      <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <h5 className="text-[9px] font-black text-secondary uppercase tracking-widest">Anti-Spoof Check</h5>
                          <p className="text-[8px] font-bold text-secondary/40 uppercase font-sans">Liveness print matching</p>
                        </div>
                        <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                          <svg className="w-11 h-11 transform -rotate-90">
                            <circle cx="22" cy="22" r="18" stroke="#E5E7EB" strokeWidth="2.5" fill="transparent" />
                            <circle cx="22" cy="22" r="18" stroke="#10B981" strokeWidth="2.5" fill="transparent" 
                              strokeDasharray={`${2 * Math.PI * 18}`}
                              strokeDashoffset={`${2 * Math.PI * 18 * (1 - buddyData.livenessScore / 100)}`}
                            />
                          </svg>
                          <span className="absolute text-[9px] font-black text-emerald-600">{Math.round(buddyData.livenessScore)}%</span>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          )}

          {/* Form Actions (shared by all tabs at the bottom of the card) */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark disabled:bg-secondary/20 text-white py-3.5 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-primary-glow border-none cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Saving Changes
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>

          {/* Mobile Logout */}
          <div className="mt-6 pt-6 border-t border-gray-100 md:hidden">
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

        </div>

      </div>

    </div>
  );
};

export default SettingsTab;
