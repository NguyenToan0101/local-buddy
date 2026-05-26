import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Compass, CheckCircle2, RotateCw } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ResetPassword: React.FC = () => {
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

        <form className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Input 
               label="New Password" 
               placeholder="Enter new password" 
               type="password"
               icon={<Lock size={20} />}
             />
             <Input 
               label="Confirm New Password" 
               placeholder="Re-enter new password" 
               type="password"
               icon={<Lock size={20} />}
             />
          </div>

          <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
             <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Password Requirements</h3>
             <ul className="space-y-4">
                {[
                  "At least 8 characters long",
                  "At least one uppercase letter (A-Z)",
                  "At least one number (0-9)",
                  "At least one special character (!@#$%^&*)"
                ].map((req, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-secondary/60 font-medium">
                     <div className={`w-5 h-5 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-green-500 text-white' : 'border-2 border-gray-200'}`}>
                        {idx === 0 && <CheckCircle2 size={12} />}
                     </div>
                     {req}
                  </li>
                ))}
             </ul>
          </div>

          <Button className="w-full py-4 text-lg flex items-center justify-center gap-3">
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
