import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Info, MessageSquare, ShieldAlert, Upload, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { reportService, userService } from '../../services/api';

type ReportTarget = {
  id: string;
  name?: string;
  fullName?: string;
  avatar?: string;
  displayAvatarUrl?: string;
  role?: string;
};

const reasons = [
  'Inappropriate behavior',
  'Harassment or bullying',
  'Spam or scam',
  'Fake profile or impersonation',
  'Other',
];

const ReportUser: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState<ReportTarget | null>(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await userService.getById(id);
        setTargetUser(data);
      } catch (err) {
        console.error('Failed to load report target:', err);
        setError('Unable to load this user.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    if (!reason) {
      setError('Please select a reason for the report.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await reportService.create({
        reportedUserId: id,
        reason,
        description,
        evidenceUrl,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit report:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark/40 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-dark/40 backdrop-blur-2xl flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 text-center space-y-6 shadow-2xl border border-white/50">
          <div className="w-20 h-20 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center mx-auto">
            <CheckCircle size={42} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-secondary tracking-tight">Report submitted</h1>
            <p className="text-sm font-bold text-secondary/45 leading-relaxed">Our safety team will review your report and take appropriate action.</p>
          </div>
          <Button onClick={() => navigate(-1)} className="w-full py-4 rounded-2xl">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-surface-dark/40 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 text-center space-y-5">
          <h1 className="text-2xl font-black text-secondary">User unavailable</h1>
          <p className="text-sm font-bold text-secondary/40">{error || 'This user could not be found.'}</p>
          <Button onClick={() => navigate(-1)} className="w-full py-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const displayName = targetUser.fullName || targetUser.name || 'User';
  const avatar = targetUser.displayAvatarUrl || targetUser.avatar;

  return (
    <div className="min-h-screen bg-surface-dark/40 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-[800px] w-full bg-white rounded-[48px] shadow-2xl border border-white/50 overflow-hidden relative">
        <header className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-primary">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <ShieldAlert size={28} />
            </div>
            <h1 className="text-2xl font-black text-secondary tracking-tight">Report User</h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-surface rounded-full flex items-center justify-center text-secondary/20 hover:text-primary transition-all"
            aria-label="Close report form"
          >
            <X size={24} />
          </button>
        </header>

        <main className="p-8 sm:p-12 space-y-10">
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-secondary tracking-tighter">Help us keep Local Buddy safe</h2>
            <p className="text-secondary/40 font-medium text-base leading-relaxed">
              Your report is private and goes to the Local Buddy safety team.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          <div className="bg-surface rounded-[32px] p-6 flex items-center gap-5 border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden shadow-xl shrink-0">
              {avatar && <img src={avatar} alt={displayName} className="w-full h-full object-cover" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-secondary tracking-tight">Reporting: {displayName}</h3>
              <p className="text-[10px] font-black text-secondary/20 uppercase tracking-widest">{targetUser.role || 'User'}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-primary">
              <ShieldAlert size={20} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Reason for report</h4>
            </div>
            <div className="space-y-3">
              {reasons.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setReason(item)}
                  className={`w-full flex items-center justify-between p-5 rounded-[24px] border transition-all ${reason === item ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-white border-gray-100 hover:border-primary/20'}`}
                >
                  <span className={`font-bold text-sm ${reason === item ? 'text-primary' : 'text-secondary/60'}`}>{item}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${reason === item ? 'border-primary bg-primary' : 'border-gray-100'}`}>
                    {reason === item && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-primary">
              <MessageSquare size={20} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Description</h4>
            </div>
            <div className="relative">
              <textarea
                value={description}
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Please provide more details about the incident..."
                className="w-full bg-white border-2 border-gray-100 rounded-[32px] p-8 text-secondary font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all min-h-[180px] resize-none"
              />
              <div className="absolute bottom-7 right-8 text-[10px] font-black text-secondary/20">{description.length} / 500</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3 text-primary">
              <Upload size={20} />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Evidence URL (Optional)</h4>
            </div>
            <input
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              placeholder="Paste a screenshot, document, or image URL"
              className="w-full bg-white border-2 border-gray-100 rounded-[24px] px-6 py-5 text-secondary font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-6">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1 py-5 text-lg shadow-2xl shadow-primary/30">
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
            <button onClick={() => navigate(-1)} className="px-10 py-5 text-secondary/30 font-black uppercase tracking-widest hover:text-secondary transition-all">
              Cancel
            </button>
          </div>

          <div className="flex items-start gap-4 p-6 bg-surface rounded-[24px] border border-gray-100">
            <Info size={20} className="text-primary/40 shrink-0 mt-1" />
            <p className="text-[10px] font-bold text-secondary/40 leading-relaxed uppercase tracking-widest">
              Our safety team typically reviews reports within 24 hours.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportUser;
