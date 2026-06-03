import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Compass, CheckCircle2, RotateCw, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import { authService } from '../../services/auth';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requirements = useMemo(() => [
    { label: 'At least 8 digits', met: /^\d{8,}$/.test(password) },
  ], [password]);
  const validPassword = requirements.every((req) => req.met);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError('Reset token is missing. Please request a new reset link.');
      return;
    }
    if (!validPassword) {
      setError('Password does not meet the requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await authService.resetPassword(token, password);
      setSuccess(true);
      window.setTimeout(() => navigate('/login'), 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full bg-white rounded-[48px] shadow-2xl p-8 sm:p-16 space-y-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <Link to="/" className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-4">
             <Compass size={32} />
          </Link>
          <h1 className="text-4xl font-bold text-secondary">Reset Password</h1>
          <p className="text-secondary/60">Create a strong, unique password to keep your account safe.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {!token && (
            <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-600">
              Reset token is missing. Please request a new reset link.
            </div>
          )}
          {error && (
            <div className="rounded-3xl bg-red-50 p-5 text-sm font-bold text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-3xl bg-green-50 p-5 text-sm font-bold text-green-600">
              Password updated. Redirecting to login...
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="w-full space-y-2">
               <label htmlFor="new-password" className="block text-sm font-medium text-secondary/70 ml-1">
                 New Password
               </label>
               <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors">
                   <Lock size={20} />
                 </div>
                 <input
                   id="new-password"
                   placeholder="Enter new password"
                   type={showPassword ? 'text' : 'password'}
                   value={password}
                   onChange={(event) => setPassword(event.target.value)}
                   className="input-base pl-16 pr-16 placeholder:text-secondary/10"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword((value) => !value)}
                   className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-primary transition-colors"
                   aria-label={showPassword ? 'Hide password' : 'Show password'}
                 >
                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                 </button>
               </div>
             </div>
             <div className="w-full space-y-2">
               <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary/70 ml-1">
                 Confirm New Password
               </label>
               <div className="relative group">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors">
                   <Lock size={20} />
                 </div>
                 <input
                   id="confirm-password"
                   placeholder="Re-enter new password"
                   type={showConfirmPassword ? 'text' : 'password'}
                   value={confirmPassword}
                   onChange={(event) => setConfirmPassword(event.target.value)}
                   className="input-base pl-16 pr-16 placeholder:text-secondary/10"
                 />
                 <button
                   type="button"
                   onClick={() => setShowConfirmPassword((value) => !value)}
                   className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary/30 hover:text-primary transition-colors"
                   aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                 >
                   {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                 </button>
               </div>
             </div>
          </div>

          <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
             <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Password Requirements</h3>
             <ul className="space-y-4">
                {requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-secondary/60 font-medium">
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${req.met ? 'bg-green-500 text-white' : 'border-2 border-gray-200'}`}>
                        {req.met && <CheckCircle2 size={12} />}
                     </div>
                     {req.label}
                  </li>
                ))}
             </ul>
          </div>

          <Button
            type="submit"
            disabled={!token || loading || success}
            isLoading={loading}
            className="w-full py-4 text-lg flex items-center justify-center gap-3"
          >
             Update Password <RotateCw size={20} />
          </Button>
        </form>

        <div className="pt-6 border-t border-gray-100 text-center">
           <p className="text-secondary/40 font-bold flex items-center justify-center gap-2">
              Need help? <a href="#" className="text-primary hover:underline">Contact Support</a>
           </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
