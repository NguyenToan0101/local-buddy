import React from 'react';
import { QrCode, X } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buddyName: string;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onSuccess, buddyName }) => {
  const [manualCode, setManualCode] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black animate-in fade-in duration-300 p-4">
      <div className="relative z-10 w-full max-w-sm rounded-[40px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-8 space-y-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all border-none text-white outline-none"
          aria-label="Close scanner"
        >
          <X size={20} />
        </button>

        <div className="pt-8 text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center text-primary">
            <QrCode size={54} />
          </div>
          <div className="space-y-2">
            <h4 className="text-2xl font-black text-white tracking-tight">Scan {buddyName}'s code</h4>
            <p className="text-white/45 font-bold text-xs uppercase tracking-widest leading-relaxed">
              Camera scanning is unavailable in this modal. Paste the QR payload provided by the other participant.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-black text-white/35 uppercase tracking-widest">QR payload</label>
          <textarea
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Paste QR payload here"
            className="w-full min-h-[120px] rounded-2xl bg-black/25 border border-white/10 p-4 text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-primary/50 resize-none"
          />
        </div>

        <button
          onClick={onSuccess}
          disabled={!manualCode.trim()}
          className="w-full rounded-2xl bg-primary py-4 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ScannerModal;
