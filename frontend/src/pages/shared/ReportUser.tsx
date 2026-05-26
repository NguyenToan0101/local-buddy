import React, { useState } from 'react';
import { ShieldAlert, X, Upload, CheckCircle, Info, ChevronRight, MessageSquare } from 'lucide-react';
import Button from '../../components/ui/Button';

const ReportUser: React.FC = () => {
  const [reason, setReason] = useState<string>('');
  
  const targetUser = {
    name: "Alex Thompson",
    avatar: "https://i.pravatar.cc/100?u=alex",
    joinedDate: "Member since 2023"
  };

  const reasons = [
    "Inappropriate behavior",
    "Harassment or bullying",
    "Spam or scam",
    "Fake profile or impersonation",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-surface-dark/40 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-[800px] w-full bg-white rounded-[72px] shadow-2xl border border-white/50 overflow-hidden relative">
         
         <header className="p-10 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-primary">
               <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <ShieldAlert size={28} />
               </div>
               <h1 className="text-2xl font-black text-secondary tracking-tight">Report User</h1>
            </div>
            <button className="w-12 h-12 bg-surface rounded-full flex items-center justify-center text-secondary/20 hover:text-primary transition-all">
               <X size={24} />
            </button>
         </header>

         <main className="p-12 sm:p-16 space-y-12">
            <div className="space-y-4">
               <h2 className="text-4xl font-black text-secondary tracking-tighter">Help us keep Local Buddy safe</h2>
               <p className="text-secondary/40 font-medium text-lg leading-relaxed">
                  If someone is violating our community guidelines, please let us know. Your report is anonymous and helps us protect the community.
               </p>
            </div>

            {/* Target User Info */}
            <div className="bg-surface rounded-[40px] p-8 flex items-center gap-6 border border-gray-100">
               <img src={targetUser.avatar} alt={targetUser.name} className="w-16 h-16 rounded-full shadow-xl" />
               <div>
                  <h3 className="text-lg font-black text-secondary tracking-tight">Reporting: {targetUser.name}</h3>
                  <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">{targetUser.joinedDate}</p>
               </div>
            </div>

            {/* Reasons */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 text-primary">
                  <ShieldAlert size={20} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Reason for report</h4>
               </div>
               <div className="space-y-3">
                  {reasons.map((r) => (
                     <button 
                       key={r}
                       onClick={() => setReason(r)}
                       className={`w-full flex items-center justify-between p-6 rounded-[32px] border transition-all ${reason === r ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-white border-gray-100 hover:border-primary/20'}`}
                     >
                        <span className={`font-bold text-sm ${reason === r ? 'text-primary' : 'text-secondary/60'}`}>{r}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${reason === r ? 'border-primary bg-primary' : 'border-gray-100'}`}>
                           {reason === r && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 text-primary">
                  <MessageSquare size={20} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Description</h4>
               </div>
               <div className="relative">
                  <textarea 
                    placeholder="Please provide more details about the incident..."
                    className="w-full bg-white border-2 border-gray-100 rounded-[40px] p-10 text-secondary font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all min-h-[200px] resize-none"
                  ></textarea>
                  <div className="absolute bottom-10 right-10 text-[10px] font-black text-secondary/20">0 / 500</div>
               </div>
            </div>

            {/* Upload */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 text-primary">
                  <Upload size={20} />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Upload Evidence (Optional)</h4>
               </div>
               <div className="border-4 border-dashed border-[#FFEAE1] rounded-[48px] p-16 text-center space-y-4 hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-[#FFEAE1] rounded-full flex items-center justify-center text-primary mx-auto group-hover:scale-110 transition-transform">
                     <Upload size={32} />
                  </div>
                  <div>
                     <p className="text-secondary font-bold text-lg tracking-tight">Click to upload or drag and drop</p>
                     <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">PNG, JPG or PDF (max. 5MB)</p>
                  </div>
               </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col md:row gap-6 pt-12">
               <Button className="flex-1 py-6 text-2xl shadow-2xl shadow-primary/30">Submit Report</Button>
               <button className="px-12 py-6 text-secondary/20 font-black uppercase tracking-widest hover:text-secondary transition-all">Cancel</button>
            </div>

            <div className="flex items-start gap-4 p-8 bg-surface rounded-[32px] border border-gray-100">
               <Info size={20} className="text-primary/40 shrink-0 mt-1" />
               <p className="text-[10px] font-bold text-secondary/40 leading-relaxed uppercase tracking-widest">
                  Our safety team typically reviews reports within 24 hours.
               </p>
            </div>
         </main>

         <footer className="py-10 bg-surface/50 text-center text-[10px] font-black text-secondary/20 uppercase tracking-[0.2em] border-t border-white/50">
            Local Buddy Safety Center • Protecting our Community
         </footer>
      </div>
    </div>
  );
};

export default ReportUser;
