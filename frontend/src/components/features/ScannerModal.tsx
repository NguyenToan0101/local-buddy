import React from 'react';
import { QrCode, X } from 'lucide-react';
import Button from '../ui/Button';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buddyName: string;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onSuccess, buddyName }) => {
  if (!isOpen) return null;

  // Trigger success automatically after 3 seconds for demo
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSuccess();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black animate-in fade-in duration-500">
       {/* Camera View Mock */}
       <div className="absolute inset-0 opacity-40">
          <img src="https://images.unsplash.com/photo-1517732359359-aefdc190b34e?auto=format&fit=crop&q=80" className="w-full h-full object-cover grayscale" alt="Scanner View" />
       </div>

       <div className="relative z-10 w-full max-w-sm aspect-[9/16] border-4 border-white/20 rounded-[56px] overflow-hidden shadow-2xl flex flex-col items-center justify-center gap-12 p-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-primary/20"></div>
          
          {/* Scan Frame */}
          <div className="relative w-64 h-64">
             <div className="absolute -top-2 -left-2 w-10 h-10 border-t-8 border-l-8 border-primary rounded-tl-3xl"></div>
             <div className="absolute -top-2 -right-2 w-10 h-10 border-t-8 border-r-8 border-primary rounded-tr-3xl"></div>
             <div className="absolute -bottom-2 -left-2 w-10 h-10 border-b-8 border-l-8 border-primary rounded-bl-3xl"></div>
             <div className="absolute -bottom-2 -right-2 w-10 h-10 border-b-8 border-r-8 border-primary rounded-br-3xl"></div>
             
             <div className="w-full h-full border-2 border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                   <QrCode size={80} className="text-white animate-pulse" />
                   <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Align QR Code</p>
                </div>
                {/* Moving Scan Line */}
                <div className="absolute left-0 right-0 top-0 h-1 bg-primary/80 shadow-[0_0_20px_rgba(255,107,53,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
             </div>
          </div>

          <div className="space-y-4 text-center">
             <h4 className="text-3xl font-black text-white tracking-tighter italic">Scanning {buddyName}'s code</h4>
             <p className="text-white/40 font-bold text-xs uppercase tracking-widest px-4 leading-relaxed">Verifying Buddy identity & security signatures...</p>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-10 right-10 bg-white/10 hover:bg-white/20 p-4 rounded-3xl transition-all border-none text-white outline-none"
          >
            <X size={24} />
          </button>
       </div>

       <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scan {
            0%, 100% { top: 10%; }
            50% { top: 90%; }
          }
       `}} />
    </div>
  );
};

export default ScannerModal;
