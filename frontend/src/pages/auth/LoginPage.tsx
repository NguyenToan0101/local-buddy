import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Compass, Star, Facebook } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const loggedInUser = await login(email.trim(), password);
      if (loggedInUser.role === 'BUDDY') {
        navigate('/buddy/dashboard');
      } else {
        navigate('/traveller/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-12 items-center">
        
        {/* Left Side - Login Form Card */}
        <div className="w-full lg:w-[460px] bg-white rounded-[40px] p-10 lg:p-14 shadow-sm border border-gray-50 flex flex-col justify-center min-h-[640px]">
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-2 group transition-all hover:opacity-80">
              <div className="w-10 h-10 bg-[#FF7E4B] rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(255,126,75,0.3)] group-hover:scale-105 transition-transform">
                <Compass size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Local Buddy</span>
            </Link>
          </div>

          <div className="space-y-2 mb-10">
            <h1 className="text-[42px] font-black text-[#1A1A1A] tracking-tight leading-tight">Welcome Back</h1>
            <p className="text-[#9CA3AF] font-medium text-lg leading-relaxed">
              Sign in to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#4B5563] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF7E4B] transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com" 
                  className="w-full bg-[#F9FAFB] border-none outline-none rounded-2xl py-5.5 pl-14 pr-6 font-semibold text-[#1A1A1A] transition-all placeholder:text-[#9CA3AF] shadow-sm focus:ring-2 focus:ring-[#FF7E4B]/10"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-[#4B5563]">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-[#FF7E4B] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF7E4B] transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#F9FAFB] border-none outline-none rounded-2xl py-5.5 pl-14 pr-14 font-semibold text-[#1A1A1A] transition-all placeholder:text-[#9CA3AF] shadow-sm focus:ring-2 focus:ring-[#FF7E4B]/10"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 font-bold text-sm px-2 text-center">{error}</p>}

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF7E4B] hover:bg-[#FF6B35] text-white py-4.5 text-lg font-bold rounded-2xl shadow-[0_10px_20px_rgba(255,126,75,0.2)] transition-all hover:scale-[1.02] active:scale-95 border-none"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="relative my-10 flex items-center">
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
            <span className="flex-shrink mx-4 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">or continue with</span>
            <div className="flex-grow border-t border-[#E5E7EB]"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-4 border-2 border-[#F3F4F6] rounded-2xl font-bold text-[#1A1A1A] hover:bg-[#F9FAFB] transition-all transform hover:-translate-y-0.5">
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="text-sm">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 py-4 border-2 border-[#F3F4F6] rounded-2xl font-bold text-[#1A1A1A] hover:bg-[#F9FAFB] transition-all transform hover:-translate-y-0.5">
              <Facebook size={20} className="text-[#1877F2] fill-[#1877F2]" />
              <span className="text-sm">Facebook</span>
            </button>
          </div>

          <div className="text-center mt-10">
            <p className="text-sm font-bold text-[#9CA3AF]">
              Don't have an account? <Link to="/signup" className="text-[#FF7E4B] hover:underline">Sign up</Link>
            </p>
          </div>
        </div>

        {/* Right Side - Testimonial Card */}
        <div className="hidden lg:block flex-1 relative h-[640px] group">
          <div className="absolute inset-0 rounded-[60px] overflow-hidden shadow-2xl">
            <img 
              src="/assets/auth/hanoi.png" 
              alt="Hanoi Old Quarter" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s]"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700"></div>
          </div>

          {/* Floating Icon */}
          <div className="absolute top-10 right-10 w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20 shadow-xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
             <div className="w-16 h-16 bg-[#FF7E4B] rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                <Compass size={28} className="animate-spin-slow" />
             </div>
          </div>

          {/* Testimonial Content */}
          <div className="absolute bottom-16 left-12 right-12 z-20 space-y-6">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={18} fill="#FF7E4B" className="text-[#FF7E4B]" />
              ))}
            </div>
            <h2 className="text-[32px] font-black text-white leading-tight italic">
              "Found a legendary <br/> Pho spot in Hanoi <br/> thanks to my buddy!"
            </h2>
            <p className="text-white/80 font-bold text-lg">
              — Alex, World Traveler
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
