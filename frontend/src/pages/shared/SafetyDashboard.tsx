import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Phone, Users, Clock, ShieldCheck, Navigation } from 'lucide-react';
import Button from '../../components/ui/Button';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

const SafetyDashboard: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendSOS = async () => {
    if (!user) return;
    if (sending) return;
    const payload = {
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      severity: 'CRITICAL',
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      userAvatar: user.avatar || '',
      // These can be wired to real trip/booking data later
      buddyId: undefined,
      buddyName: undefined,
      locationText: user.location || 'Unknown location',
      lat: null,
      lng: null,
      note: 'SOS triggered from Safety Dashboard.',
    };
    setSending(true);
    try {
      // Demo mode: store to localStorage so admin page can read it
      const key = 'mock_sos_alerts_v1';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const next = [payload, ...arr];
      localStorage.setItem(key, JSON.stringify(next));
      setSent(true);
    } catch {
      alert('Could not send SOS. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Live Status */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[48px] p-10 shadow-premium border border-gray-100 flex flex-col md:flex-row items-center gap-10">
              <div className="relative">
                <div className="w-48 h-48 rounded-full border-[12px] border-primary/10 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl font-black text-secondary">{formatTime(timeLeft)}</p>
                    <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest">Time Remaining</p>
                  </div>
                </div>
                <div className="absolute inset-0 border-[12px] border-primary rounded-full border-t-transparent animate-spin-slow"></div>
              </div>
              
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-secondary">In progress: Street Food Tour</h2>
                  <p className="text-secondary/60 font-medium flex items-center justify-center md:justify-start gap-2">
                    <MapPin size={18} className="text-primary" /> District 1, Ho Chi Minh City
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                   <div className="px-6 py-3 bg-green-50 text-green-600 rounded-2xl flex items-center gap-2 font-bold">
                      <ShieldCheck size={20} /> Buddy Verified
                   </div>
                   <div className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl flex items-center gap-2 font-bold">
                      <Navigation size={20} /> Live Tracking Active
                   </div>
                </div>
              </div>
            </div>

            {/* Map Preview */}
            <div className="bg-white rounded-[48px] p-4 shadow-premium border border-gray-100 h-[500px] relative overflow-hidden group">
               <img 
                 src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" 
                 alt="Map" 
                 className="w-full h-full object-cover rounded-[36px] grayscale-[0.2] group-hover:scale-105 transition-transform duration-1000"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 via-transparent to-transparent"></div>
               <div className="absolute top-10 right-10 flex flex-col gap-3">
                  <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
                     <Users size={20} />
                  </button>
                  <button className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-secondary hover:text-primary transition-colors">
                     <Clock size={20} />
                  </button>
               </div>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-8">
            <div className="bg-red-500 rounded-[48px] p-10 text-white shadow-xl shadow-red-500/20 space-y-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                   <AlertTriangle size={40} className="animate-pulse" />
                </div>
                <h3 className="text-4xl font-black">SOS</h3>
                <p className="text-white/80 font-medium">Emergency assistance required? Tap to alert local responders.</p>
              </div>
              <Button
                variant="dark"
                onClick={sendSOS}
                disabled={sending || sent}
                className="w-full bg-white text-red-500 hover:bg-white/90 border-none h-16 text-lg disabled:opacity-60"
              >
                {sent ? 'SOS Sent' : sending ? 'Sending...' : 'Send SOS Alert'}
              </Button>
            </div>

            <div className="bg-white rounded-[48px] p-10 shadow-premium border border-gray-100 space-y-8">
               <h3 className="text-2xl font-black text-secondary">Safety Check-in</h3>
               <p className="text-secondary/40 font-medium">Is everything going well? Reassure your loved ones by checking in.</p>
               <Button variant="secondary" className="w-full h-16 text-lg">I'm Feeling Safe</Button>
            </div>

            <div className="bg-secondary rounded-[48px] p-10 text-white shadow-premium space-y-8">
               <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                     <Phone className="text-primary" />
                  </div>
                  <div>
                     <p className="font-bold">Quick Support</p>
                     <p className="text-white/40 text-sm">24/7 Safety Team</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <Button variant="ghost" className="w-full text-white hover:bg-white/5 border border-white/10 h-14 justify-start px-6">Call Safety Agent</Button>
                  <Button variant="ghost" className="w-full text-white hover:bg-white/5 border border-white/10 h-14 justify-start px-6">Message Support</Button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SafetyDashboard;
