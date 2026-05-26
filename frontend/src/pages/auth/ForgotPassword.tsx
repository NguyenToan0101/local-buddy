import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Compass, ArrowLeft, Send, Star } from 'lucide-react';
import Button from '../../components/ui/Button';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6 text-[#1A1A1A]">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-12 items-center">
        
        {/* Left Side - Form Card */}
        <div className="w-full lg:w-[460px] bg-white rounded-[40px] p-10 lg:p-14 shadow-sm border border-gray-50 flex flex-col justify-center min-h-[640px]">
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-2 group transition-all hover:opacity-80">
              <div className="w-10 h-10 bg-[#FF7E4B] rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(255,126,75,0.3)] group-hover:scale-105 transition-transform">
                <Compass size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase">Local Buddy</span>
            </Link>
          </div>

          {!isSent ? (
            <>
              <div className="space-y-2 mb-10">
                <h1 className="text-[42px] font-black text-[#1A1A1A] tracking-tight leading-tight">Oh No! <br/> Lost your way?</h1>
                <p className="text-[#9CA3AF] font-medium text-lg leading-relaxed">
                  Don't worry, even the best travelers get lost sometimes. We'll help you get back on track.
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

                <Button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF7E4B] hover:bg-[#FF6B35] text-white py-4.5 text-lg font-bold rounded-2xl shadow-[0_10px_20px_rgba(255,126,75,0.2)] transition-all hover:scale-[1.02] active:scale-95 border-none flex items-center justify-center gap-3"
                >
                  {loading ? 'Sending...' : (
                    <>
                      Send Reset link
                      <Send size={20} />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-8 py-10">
              <div className="w-24 h-24 bg-[#FF7E4B]/10 rounded-full flex items-center justify-center mx-auto text-[#FF7E4B]">
                <Send size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-[#1A1A1A]">Check your mail!</h2>
                <p className="text-[#9CA3AF] font-medium leading-relaxed px-4">
                  We've sent a magic link to <span className="text-[#1A1A1A] font-bold">{email}</span>. Click it to reset your password.
                </p>
              </div>
              <button 
                onClick={() => setIsSent(false)}
                className="text-[#FF7E4B] font-bold hover:underline"
              >
                Didn't receive it? Try again
              </button>
            </div>
          )}

          <div className="text-center mt-12 pt-8 border-t border-gray-50">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors">
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>

        {/* Right Side - Hoi An Image */}
        <div className="hidden lg:block flex-1 relative h-[640px] group">
          <div className="absolute inset-0 rounded-[60px] overflow-hidden shadow-2xl">
            <img 
              src="/assets/auth/hoian.png" 
              alt="Hoi An Ancient Town" 
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
              "Lost in the lanterns <br/> of Hoi An... and <br/> found myself again."
            </h2>
            <p className="text-white/80 font-bold text-lg">
              — Sophie, Dreamer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
