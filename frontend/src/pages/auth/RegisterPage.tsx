import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Compass, Shield, Star, Facebook, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'TRAVELER' | 'BUDDY'>('TRAVELER');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNotice, setShowNotice] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      await register({ email, name, password, role });
      if (role === 'BUDDY') {
        navigate('/buddy/welcome');
      } else {
        navigate('/traveller/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6 text-[#1A1A1A]">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row-reverse gap-12 items-center">
        
        {/* Left Side - Register Form Card */}
        <div className="w-full lg:w-[480px] bg-white rounded-[40px] p-10 lg:p-14 shadow-sm border border-gray-50 flex flex-col justify-center min-h-[720px]">
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-2 group transition-all hover:opacity-80">
              <div className="w-10 h-10 bg-[#FF7E4B] rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(255,126,75,0.3)] group-hover:scale-105 transition-transform">
                <Compass size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Local Buddy</span>
            </Link>
          </div>

          <div className="space-y-2 mb-10">
            <h1 className="text-[42px] font-black text-[#1A1A1A] tracking-tight leading-tight">Create Identity</h1>
            <p className="text-[#9CA3AF] font-medium text-lg leading-relaxed">
              Join our global community of world travelers and experts.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
               <label className="text-xs font-black text-[#9CA3AF] uppercase tracking-[0.2em] ml-1">Choose your path</label>
               <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#F9FAFB] rounded-2xl border border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setRole('TRAVELER')}
                    className={`py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                      role === 'TRAVELER' ? 'bg-white text-[#FF7E4B] shadow-sm scale-[1.02]' : 'text-[#9CA3AF] hover:text-[#4B5563]'
                    }`}
                  >
                    Traveler
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('BUDDY')}
                    className={`py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                      role === 'BUDDY' ? 'bg-white text-[#FF7E4B] shadow-sm scale-[1.02]' : 'text-[#9CA3AF] hover:text-[#4B5563]'
                    }`}
                  >
                    Local Buddy
                  </button>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF7E4B] transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name" 
                  className="w-full bg-[#F9FAFB] border-none outline-none rounded-2xl py-5.5 pl-14 pr-6 font-semibold transition-all placeholder:text-[#9CA3AF] shadow-sm focus:ring-2 focus:ring-[#FF7E4B]/10"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF7E4B] transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address" 
                  className="w-full bg-[#F9FAFB] border-none outline-none rounded-2xl py-5.5 pl-14 pr-6 font-semibold transition-all placeholder:text-[#9CA3AF] shadow-sm focus:ring-2 focus:ring-[#FF7E4B]/10"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF7E4B] transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password" 
                  className="w-full bg-[#F9FAFB] border-none outline-none rounded-2xl py-5.5 pl-14 pr-14 font-semibold transition-all placeholder:text-[#9CA3AF] shadow-sm focus:ring-2 focus:ring-[#FF7E4B]/10"
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

              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] group-focus-within:text-[#FF7E4B] transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password" 
                  className="w-full bg-[#F9FAFB] border-none outline-none rounded-2xl py-5.5 pl-14 pr-14 font-semibold transition-all placeholder:text-[#9CA3AF] shadow-sm focus:ring-2 focus:ring-[#FF7E4B]/10"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="relative mb-6">
                {showNotice && (
                  <div className="absolute bottom-full left-0 mb-4 w-[340px] bg-white rounded-[32px] p-8 shadow-2xl border border-gray-50 animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <Shield size={18} className="text-primary" />
                      </div>
                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Profile Verification Notice</h4>
                         <p className="text-[10px] font-bold text-secondary/60 leading-relaxed text-justify">
                            By verifying your profile, you confirm that the personal information submitted is accurate. In cases where illegal or suspicious activities are detected, this information may be shared with relevant authorities.
                         </p>
                         <p className="text-[10px] font-bold text-secondary/60 leading-relaxed text-justify">
                            This platform is designed exclusively to connect travelers with local guides for tourism experiences.
                         </p>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-r border-b border-gray-50 rotate-45"></div>
                  </div>
                )}
                
                <div 
                  className="flex items-center gap-3 px-1 py-1 group/terms"
                  onMouseEnter={() => setShowNotice(true)}
                  onMouseLeave={() => setShowNotice(false)}
                >
                   <input 
                     type="checkbox" 
                     id="verification-agree" 
                     required 
                     className="w-5 h-5 rounded-lg border-gray-200 text-primary focus:ring-primary/20 accent-primary cursor-pointer transition-all hover:scale-110" 
                   />
                   <label 
                     htmlFor="verification-agree" 
                     className="text-[11px] font-black text-secondary/50 uppercase tracking-tight cursor-pointer group-hover/terms:text-secondary transition-colors"
                   >
                      I understand & agree to the terms
                   </label>
                </div>
              </div>

              {error && <p className="text-red-500 font-bold text-sm px-2 text-center">{error}</p>}

              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF7E4B] hover:bg-[#FF6B35] text-white py-4.5 text-lg font-bold rounded-2xl shadow-[0_10px_20_rgba(255,126,75,0.2)] transition-all hover:scale-[1.02] active:scale-95 border-none mt-4"
              >
                {loading ? 'Creating account...' : 'Complete Registration'}
              </Button>
            </form>

            <div className="relative my-8 flex items-center">
              <div className="flex-grow border-t border-[#E5E7EB]"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">or continue with</span>
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

            <div className="text-center pt-6 border-t border-gray-50">
              <p className="text-sm font-bold text-[#9CA3AF]">
                Already a member? <Link to="/login" className="text-[#FF7E4B] hover:underline">Sign in instead</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Discovery Card */}
        <div className="hidden lg:block flex-1 relative h-[640px] group">
          <div className="absolute inset-0 rounded-[60px] overflow-hidden shadow-2xl">
            <img 
              src="/assets/auth/halong.png" 
              alt="Ha Long Bay" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s]"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-700"></div>
          </div>

          <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20 shadow-xl overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
             <div className="w-16 h-16 bg-[#FF7E4B] rounded-full flex items-center justify-center text-white shadow-lg relative z-10">
                <Compass size={28} className="animate-spin-slow" />
             </div>
          </div>

          <div className="absolute bottom-16 left-12 right-12 z-20 space-y-6">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={18} fill="#FF7E4B" className="text-[#FF7E4B]" />
              ))}
            </div>
            <h2 className="text-[32px] font-black text-white leading-tight italic">
              "Ha Long Bay is magical. <br/> Buddy knows all the <br/> secret photo spots!"
            </h2>
            <p className="text-white/80 font-bold text-lg">
              — Minh, Explorer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
