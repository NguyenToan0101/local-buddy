import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Shield, ArrowRight, Camera, Sparkles, Globe } from 'lucide-react';
import Button from '../../components/ui/Button';

const BuddyOnboarding: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { 
      title: "Identity Verification", 
      desc: "Safety is our top priority", 
      icon: Shield,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    { 
      title: "Professional Profile", 
      desc: "Make a stunning first impression", 
      icon: Camera,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    { 
      title: "Global Connection", 
      desc: "Connect with travelers worldwide", 
      icon: Globe,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/5 rounded-full blur-[140px] animate-pulse-slow"></div>

      <div className="max-w-5xl w-full bg-white/40 backdrop-blur-3xl rounded-[72px] shadow-premium p-16 sm:p-24 border border-white/60 relative z-10 text-center space-y-20 animate-in fade-in zoom-in duration-1000">
        
        {/* Header Section */}
        <div className="space-y-10">
          <div className="flex justify-center">
            <div className="w-28 h-28 bg-primary text-white rounded-[36px] flex items-center justify-center shadow-primary-glow animate-bounce-slow relative">
               <div className="absolute inset-0 bg-primary rounded-[36px] animate-ping opacity-20"></div>
               <Compass size={52} strokeWidth={2.5} className="relative z-10" />
            </div>
          </div>
          
          <div className="space-y-5">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter italic text-secondary leading-tight">
              Welcome, <span className="text-primary not-italic">New Buddy!</span>
            </h1>
            <p className="text-secondary/50 font-bold text-2xl leading-relaxed max-w-3xl mx-auto italic">
              "Join us in creating authentic local experiences for travelers around the globe."
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
           {features.map((item, i) => (
             <div 
               key={i} 
               className="bg-white/60 backdrop-blur-xl p-10 rounded-[48px] border border-white border-t-white/80 shadow-sm hover:shadow-premium transition-all hover:-translate-y-2 group"
               style={{ transitionDelay: `${i * 100}ms` }}
             >
                <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner`}>
                   <item.icon size={32} />
                </div>
                <h4 className="text-xl font-black text-secondary tracking-tight mb-3">{item.title}</h4>
                <p className="text-[10px] font-black text-secondary/30 leading-relaxed uppercase tracking-[0.2em]">{item.desc}</p>
             </div>
           ))}
        </div>

        {/* Verification Message Area */}
        <div className="bg-secondary p-16 rounded-[60px] text-white space-y-10 relative overflow-hidden group shadow-2xl border border-white/10">
          <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <Shield size={200} />
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-3 bg-primary/20 text-primary px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.3em] border border-primary/20">
              <Sparkles size={14} className="animate-pulse" /> Identity First Community
            </div>
            <h2 className="text-4xl font-black tracking-tighter">Verify Your Identity</h2>
            <p className="text-white/40 font-bold text-lg max-w-2xl mx-auto leading-relaxed italic">
              To be visible to travelers and start your journey as a Local Buddy, we need to verify your ID. This step ensures safety for our entire community.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8">
            <Button 
              onClick={() => navigate('/buddy/dashboard/settings')}
              className="px-16 py-6 bg-primary text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-primary-glow hover:scale-[1.05] active:scale-95 transition-all border-none flex items-center gap-6"
            >
              Verify Identity Now <ArrowRight size={22} />
            </Button>
            <div className="flex items-center gap-6 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
               <span className="flex items-center gap-2"><Shield size={12} className="text-primary" /> End-to-end Encrypted</span>
               <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
               <span>GDPR Compliant</span>
            </div>
          </div>
        </div>

        {/* Help Link */}
        <div className="pt-6">
           <p className="text-secondary/20 font-bold text-sm">
             Facing technical issues? <span className="text-primary hover:underline cursor-pointer transition-all decoration-2 underline-offset-4">Contact Buddy Support 24/7</span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default BuddyOnboarding;
