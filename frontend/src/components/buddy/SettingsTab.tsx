import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, Phone, CreditCard, Shield, MapPin, Sparkles, Languages, Upload, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { buddyService, type Buddy } from '../../services/api';

const SettingsTab: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buddyData, setBuddyData] = useState<Partial<Buddy>>({});
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBuddy = async () => {
      if (!user) return;
      let buddyId = user.id;
      if (buddyId.startsWith('buddy-')) buddyId = buddyId.replace('buddy-', '');
      
      try {
        const data = await buddyService.getById(buddyId);
        setBuddyData(data);
      } catch (error) {
        console.error("Error fetching buddy data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBuddy();
  }, [user]);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
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
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress more for ID cards
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBuddyData(prev => ({ 
      ...prev, 
      [name]: name === 'age' || name === 'price' ? (parseFloat(value) || 0) : value 
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    // Không cho upload lại nếu đã được verify
    if (buddyData.verificationStatus === 'verified') return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        const compressed = await compressImage(base64Str);
        setBuddyData(prev => ({ 
          ...prev, 
          [side === 'front' ? 'idCardFront' : 'idCardBack']: compressed 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Không cho đổi avatar qua flow này nếu đã verify (giữ ổn định hồ sơ định danh)
    if (buddyData.verificationStatus === 'verified') return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Str = reader.result as string;
        const compressed = await compressImage(base64Str);
        setBuddyData(prev => ({ 
          ...prev, 
          image: compressed 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    let buddyId = user.id;
    if (buddyId.startsWith('buddy-')) buddyId = buddyId.replace('buddy-', '');

    try {
      // Logic for verification status
      const hasIdPhotos = buddyData.idCardFront && buddyData.idCardBack;
      const updatedStatus = hasIdPhotos ? 'pending' : (buddyData.verificationStatus || 'unverified');

      // 1. Prepare clean payload (exclude large nested fields and ID)
      const { reviews, id, ...rest } = buddyData;
      const cleanData = { 
        ...rest, 
        verificationStatus: updatedStatus 
      };
      
      // Log payload size for debugging
      console.log("Payload size (chars):", JSON.stringify(cleanData).length);
      
      // 2. Update the Buddy specific data in 'buddies' collection
      await buddyService.updateProfile(buddyId, cleanData);
      
      // 3. Update the shared account data in 'users' collection and Auth session
      await updateUser({
        name: buddyData.name,
        location: buddyData.location,
        description: buddyData.description,
        avatar: buddyData.image,
        verificationStatus: updatedStatus,
      });

      setBuddyData(prev => ({ ...prev, verificationStatus: updatedStatus }));
      // Success notification could be added here if a toast system is available
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
        return { 
          label: 'Verified Buddy', 
          color: 'text-green-500', 
          bg: 'bg-green-500/10', 
          icon: Shield,
          desc: 'Your identity has been fully verified.' 
        };
      case 'pending':
        return { 
          label: 'Pending Verification', 
          color: 'text-amber-500', 
          bg: 'bg-amber-500/10', 
          icon: Clock,
          desc: 'Verification in progress. Usually takes up to 24h.' 
        };
      default:
        return { 
          label: 'Unverified', 
          color: 'text-red-500', 
          bg: 'bg-red-500/10', 
          icon: Shield,
          desc: 'Please provide ID photos to be visible to travelers.' 
        };
    }
  };

  const statusConfig = getStatusConfig();

  if (loading) return (
    <div className="p-20 text-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Loading identity profile...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-1000 pb-12">
      {/* Verification Status Banner */}
      {buddyData.verificationStatus !== 'verified' && (
        <div className={`p-6 rounded-[32px] ${statusConfig.bg} border-2 border-white/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative group`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className={`w-14 h-14 ${statusConfig.bg} ${statusConfig.color} rounded-2xl flex items-center justify-center shadow-inner`}>
              <statusConfig.icon size={24} />
            </div>
            <div>
              <h4 className={`text-sm font-black uppercase tracking-widest ${statusConfig.color}`}>{statusConfig.label}</h4>
              <p className="text-secondary/60 text-xs font-bold mt-1 tracking-tight">{statusConfig.desc}</p>
            </div>
          </div>
          {buddyData.verificationStatus === 'unverified' && (
            <div className="flex items-center gap-2 text-primary bg-primary border border-primary/20 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse relative z-10">
               Action required
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <h3 className="text-4xl font-black text-secondary tracking-tighter italic">Profile <span className="text-primary not-italic">Settings</span></h3>
          <p className="text-secondary/40 font-bold text-[10px] uppercase tracking-[0.4em]">Manage your professional buddy identity</p>
        </div>
        <div className="flex items-center gap-4">
           <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-primary text-white px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-primary-glow hover:scale-105 active:scale-95 transition-all border-none"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Avatar and Identity Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white/60 backdrop-blur-3xl rounded-[48px] p-8 shadow-premium border border-white flex flex-col items-center text-center space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/5 to-transparent"></div>
            
            <div 
              className="relative z-10 group/avatar cursor-pointer"
              onClick={() => avatarInputRef.current?.click()}
            >
              <div className="w-32 h-32 rounded-[40px] bg-secondary-dark overflow-hidden border-[6px] border-white shadow-2xl transition-all group-hover/avatar:scale-105 duration-700 ring-1 ring-secondary/5">
                <img src={buddyData.image || `https://i.pravatar.cc/300?u=${user?.id}`} alt="Buddy" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-primary text-white rounded-[22px] flex items-center justify-center shadow-primary-glow border-[6px] border-white group-hover/avatar:rotate-12 transition-transform">
                <Camera size={22} />
              </div>
              <input 
                type="file" 
                ref={avatarInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/*" 
              />
            </div>

            <div className="space-y-3 relative z-10 w-full">
              <h4 className="text-3xl font-black text-secondary tracking-tighter">{buddyData.name}</h4>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${statusConfig.color} ${statusConfig.bg} border border-white`}>
                 <statusConfig.icon size={12} /> {statusConfig.label}
              </div>
            </div>
            
            <div className="w-full pt-8 border-t border-gray-100/50 grid grid-cols-2 gap-6 relative z-10">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.2em]">Verification</p>
                  <p className="text-xs font-black text-secondary uppercase italic">{statusConfig.label === 'Verified Buddy' ? 'Completed' : 'In Progress'}</p>
               </div>
               <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.2em]">Tier Level</p>
                  <p className="text-xs font-black text-primary uppercase italic">Elite Grade</p>
               </div>
            </div>
          </div>

          <div className="bg-secondary rounded-[48px] p-8 text-white space-y-4 shadow-2xl relative overflow-hidden group border border-white/10">
            <div className="absolute -top-10 -right-10 p-8 text-white/[0.03] pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-1000">
              <Shield size={200} />
            </div>
            <div className="flex items-center gap-3 relative z-10">
               <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Shield size={16} />
               </div>
               <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Identity Security</h5>
            </div>
            <p className="text-white/40 text-[12px] font-bold leading-relaxed relative z-10 tracking-tight">
               Your identity data is end-to-end encrypted and utilized exclusively for secure platform verification.
            </p>
          </div>
        </div>

        {/* Right: Form Sections */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white/80 backdrop-blur-2xl rounded-[48px] p-10 shadow-premium border border-white space-y-10">
              
              {/* Profile Overview section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                         <User size={20} />
                      </div>
                      <h4 className="text-xl font-black text-secondary tracking-tight italic">Profile Overview</h4>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Full Name</label>
                    <input name="name" value={buddyData.name || ''} onChange={handleChange} className="w-full bg-surface/50 border border-gray-100/50 rounded-2xl px-8 py-5 font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all"/>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Age</label>
                    <input name="age" type="number" value={buddyData.age || ''} onChange={handleChange} className="w-full bg-surface/50 border border-gray-100/50 rounded-2xl px-8 py-5 font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-7 top-1/2 -translate-y-1/2 text-primary" size={18} />
                      <input name="location" value={buddyData.location || ''} onChange={handleChange} className="w-full bg-surface/50 border border-gray-100/50 rounded-2xl pl-16 pr-8 py-5 font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all"/>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-7 top-1/2 -translate-y-1/2 text-primary" size={18} />
                      <input name="phone" value={buddyData.phone || ''} onChange={handleChange} placeholder="+84 123 456 789" className="w-full bg-surface/50 border border-gray-100/50 rounded-2xl pl-16 pr-8 py-5 font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all"/>
                    </div>
                  </div>
                </div>
              </div>

              {/* pricing Section */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                   <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <CreditCard size={20} />
                   </div>
                   <h4 className="text-xl font-black text-secondary tracking-tight italic">Service Economics</h4>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Hourly Service Rate ($)</label>
                  <div className="relative max-w-[280px] group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-secondary/20 text-xl group-focus-within:text-primary transition-colors">$</span>
                    <input name="price" type="number" value={buddyData.price || ''} onChange={handleChange} className="w-full bg-surface/50 border border-gray-100/50 rounded-[28px] pl-16 pr-20 py-6 font-black text-3xl text-secondary outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all italic tracking-tighter shadow-inner"/>
                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-secondary/20 uppercase tracking-widest">/ hour</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                   <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Sparkles size={20} />
                   </div>
                   <h4 className="text-xl font-black text-secondary tracking-tight italic">Professional Narrative</h4>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Your Story & Local Expertise</label>
                  <textarea name="description" rows={3} value={buddyData.description || ''} onChange={handleChange} className="w-full bg-surface/50 border border-gray-100/50 rounded-[32px] px-10 py-6 font-bold text-secondary outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all resize-none italic leading-relaxed shadow-inner" placeholder="Tell travelers what makes your tours unique..."/>
                </div>
              </div>

              {/* Identity Verification Section */}
              <div className="space-y-6 pt-4">
                 <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                         <Shield size={20} />
                      </div>
                      <h4 className="text-xl font-black text-secondary tracking-tight italic">Identity Authentication</h4>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Front Side */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">ID Card - Front Side</label>
                    <div 
                      onClick={buddyData.verificationStatus === 'verified' ? undefined : () => frontInputRef.current?.click()}
                      className="aspect-[1.6/1] bg-surface/50 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-primary/40 hover:shadow-premium transition-all overflow-hidden relative group/upload shadow-inner"
                    >
                      {buddyData.idCardFront ? (
                        <div className="w-full h-full relative">
                           <img src={buddyData.idCardFront} className="w-full h-full object-cover group-hover/upload:scale-110 transition-transform duration-700" alt="ID Front" />
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload className="text-white" size={32} />
                           </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-secondary/10 mb-4 shadow-sm group-hover/upload:scale-110 transition-transform">
                             <Upload size={24} />
                          </div>
                          <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Select photo</p>
                        </>
                      )}
                      <input type="file" ref={frontInputRef} onChange={(e) => handleFileUpload(e, 'front')} className="hidden" accept="image/*" />
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">ID Card - Back Side</label>
                    <div 
                      onClick={buddyData.verificationStatus === 'verified' ? undefined : () => backInputRef.current?.click()}
                      className="aspect-[1.6/1] bg-surface/50 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-primary/40 hover:shadow-premium transition-all overflow-hidden relative group/upload shadow-inner"
                    >
                      {buddyData.idCardBack ? (
                        <div className="w-full h-full relative">
                           <img src={buddyData.idCardBack} className="w-full h-full object-cover group-hover/upload:scale-110 transition-transform duration-700" alt="ID Back" />
                           <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload className="text-white" size={32} />
                           </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-secondary/10 mb-4 shadow-sm group-hover/upload:scale-110 transition-transform">
                             <Upload size={24} />
                          </div>
                          <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">Select photo</p>
                        </>
                      )}
                      <input type="file" ref={backInputRef} onChange={(e) => handleFileUpload(e, 'back')} className="hidden" accept="image/*" />
                    </div>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
