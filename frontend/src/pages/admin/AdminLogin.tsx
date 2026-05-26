import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Command, ArrowRight, Eye, EyeOff, Compass } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
      </div>

      <div className="max-w-xl w-full relative z-10">
        {/* Brand Section */}
        <div className="text-center mb-12 space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5 border border-white/10 rounded-[32px] shadow-2xl backdrop-blur-md mb-4 group hover:scale-110 transition-transform duration-500">
            <Compass size={48} className="text-indigo-500 group-hover:rotate-180 transition-transform duration-1000" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
              Local<span className="text-indigo-500">Buddy</span>
            </h1>
            <p className="text-slate-500 font-black tracking-[0.4em] text-[10px] uppercase">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[56px] p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 animate-gradient-x"></div>
          
          <div className="mb-10">
            <h2 className="text-2xl font-black text-white tracking-tight">Admin sign in</h2>
            <p className="text-slate-500 text-sm font-bold mt-1">Use your email and password.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Email</label>
                <div className="relative group/input">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors">
                    <Command size={22} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@localbuddy.com"
                    className="w-full h-20 bg-white/5 border border-white/5 rounded-[28px] pl-16 pr-8 text-white font-black text-lg outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-4">Password</label>
                <div className="relative group/input">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors">
                    <Lock size={22} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-20 bg-white/5 border border-white/5 rounded-[28px] pl-16 pr-16 text-white font-black text-lg outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-24 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[32px] font-black text-2xl shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 group/btn transition-all active:scale-95 border-b-[6px] border-indigo-800"
            >
              Sign in <ArrowRight size={32} className="group-hover/btn:translate-x-3 transition-transform duration-500" />
            </button>
          </form>

          {/* Quick Actions */}
          <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
            <span />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-10 flex items-center justify-center gap-3 text-slate-700">
          <Shield size={16} className="text-slate-800" />
          <p className="text-[10px] font-black uppercase tracking-[0.1em]">
            This page is for admins only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
