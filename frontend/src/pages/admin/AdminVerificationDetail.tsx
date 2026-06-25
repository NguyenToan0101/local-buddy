import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/api';
import { isPdfEvidence } from '../../utils/evisaEvidence';

interface VerificationRecord {
  id: string;
  name: string;
  type: 'Buddy' | 'Traveller';
  regDate: string;
  docType: 'CCCD' | 'Passport' | 'E-Visa';
  status: 'Unverified' | 'Pending' | 'Processing' | 'Manual Review' | 'Verified' | 'Rejected';
  avatar: string;
  docs: {
    front: string | null;
    back: string | null;
    selfie: string | null;
  };
  email: string;
  phone: string | null;
  eVisaNumber?: string | null;
  eVisaCountry?: string | null;
  eVisaExpiryDate?: string | null;
  verificationScore?: number | null;
  riskScore?: number | null;
  riskReason?: string | null;
  duplicateDetected?: boolean | null;
  duplicateUserId?: string | null;
  rejectionReason?: string | null;
  autoVerificationMessage?: string | null;
  age?: number;
}

const statusStyles: Record<VerificationRecord['status'], { badge: string; dot: string; icon: React.ElementType }> = {
  Unverified: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: Clock3 },
  Pending: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: Clock3 },
  Processing: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: Loader2 },
  'Manual Review': { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle },
  Verified: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Rejected: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: XCircle },
};

const formatDate = (value?: string | null) => {
  if (!value || value === 'N/A') return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
};

const isVideoUrl = (url?: string | null) => Boolean(url && (/\/video\/upload\//.test(url) || /\.(mp4|webm)(\?|$)/i.test(url)));

const StatusBadge = ({ status }: { status: VerificationRecord['status'] }) => {
  const style = statusStyles[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${style.badge}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      <Icon size={13} className={status === 'Processing' ? 'animate-spin' : ''} />
      {status}
    </span>
  );
};

const Avatar = ({ record }: { record: VerificationRecord }) =>
  record.avatar ? (
    <img src={record.avatar} alt={record.name} className="h-16 w-16 rounded-2xl object-cover shadow-lg" referrerPolicy="no-referrer" />
  ) : (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/10 text-sm font-black uppercase text-indigo-600 shadow-lg">
      {(record.name || 'US').slice(0, 2)}
    </div>
  );

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
  <div className="flex items-start gap-3 border-b border-admin py-3 last:border-b-0">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-admin-surface text-admin-muted">
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-admin-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black text-admin-main">{value || 'Not provided'}</p>
    </div>
  </div>
);

const SummaryCell = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-admin-surface text-admin-muted">
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-admin-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black text-admin-main">{value || 'Not provided'}</p>
    </div>
  </div>
);

const EvidenceFrame = ({
  src,
  label,
  ratio = 'aspect-[4/3]',
  compact = false,
  onPreview,
}: {
  src: string;
  label: string;
  ratio?: string;
  compact?: boolean;
  onPreview?: (src: string, label: string) => void;
}) => (
  <div className="space-y-3">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-admin-muted">{label}</p>
    <div className={`${ratio} ${compact ? 'max-h-[280px] max-w-xl' : ''} overflow-hidden rounded-xl border border-admin bg-admin-surface`}>
      {isPdfEvidence(src) ? (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-3 text-admin-muted transition-colors hover:text-indigo-500"
        >
          <FileText size={40} />
          <span className="text-[10px] font-black uppercase tracking-widest">Open PDF evidence</span>
        </a>
      ) : (
        <button type="button" onClick={() => onPreview?.(src, label)} className="group relative h-full w-full cursor-zoom-in">
          <img src={src} alt={label} className="h-full w-full object-contain" />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/75 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn size={13} />
            View
          </span>
        </button>
      )}
    </div>
  </div>
);

const AdminVerificationDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const recordId = searchParams.get('id');
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ src: string; label: string } | null>(null);

  useEffect(() => {
    const loadRecord = async () => {
      if (!recordId) {
        setError('Missing verification record id.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getVerifications();
        const records = Array.isArray(data) ? (data as VerificationRecord[]) : [];
        const found = records.find((item) => item.id === recordId);
        if (!found) {
          setError('Verification record was not found.');
          setRecord(null);
          return;
        }
        setRecord(found);
      } catch (err: any) {
        setError(err.message || 'Failed to load verification detail');
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [recordId]);

  const checklist = useMemo(() => {
    if (!record) return [];
    return record.type === 'Traveller'
      ? [
          { label: 'E-visa evidence file', passed: Boolean(record.docs.front) },
          { label: 'E-visa number', passed: Boolean(record.eVisaNumber) },
          { label: 'Issuing country', passed: Boolean(record.eVisaCountry) },
          { label: 'Expiry date', passed: Boolean(record.eVisaExpiryDate) },
        ]
      : [
          { label: 'ID front image', passed: Boolean(record.docs.front) },
          { label: 'ID back image', passed: Boolean(record.docs.back) },
          { label: 'Selfie verification video', passed: Boolean(record.docs.selfie) },
        ];
  }, [record]);

  const canManualDecision = Boolean(
    record &&
      (record.status === 'Pending' || record.status === 'Manual Review') &&
      (record.type === 'Traveller' ? record.docs.front : record.docs.front && record.docs.back)
  );

  const handleApprove = async () => {
    if (!record) return;
    try {
      setError(null);
      if (record.type === 'Traveller') {
        await adminService.updateTravelerVerification(record.id, 'verified');
      } else {
        await adminService.updateBuddyVerification(record.id, 'verified');
      }
      setRecord({ ...record, status: 'Verified' });
      setShowRejectForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to approve verification');
    }
  };

  const handleReject = async () => {
    if (!record) return;
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setError(null);
      if (record.type === 'Traveller') {
        await adminService.updateTravelerVerification(record.id, 'rejected', rejectReason);
      } else {
        await adminService.updateBuddyVerification(record.id, 'rejected', rejectReason);
      }
      setRecord({ ...record, status: 'Rejected', rejectionReason: rejectReason });
      setShowRejectForm(false);
      setRejectReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject verification');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Link to="/admin/verification" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-admin-muted hover:text-indigo-500">
              <ArrowLeft size={16} />
              Verification list
            </Link>
            <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-admin-main sm:text-3xl">
              <ShieldCheck className="text-indigo-600" size={30} />
              Verification Detail
            </h1>
          </div>
          {record && <StatusBadge status={record.status} />}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-admin bg-admin-surface p-12 text-center">
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-admin-muted">Loading verification detail...</p>
          </div>
        )}

        {!loading && !record && (
          <div className="rounded-2xl border border-admin bg-admin-surface p-12 text-center">
            <FileText size={40} className="mx-auto mb-4 text-admin-muted" />
            <p className="text-sm font-bold text-admin-muted">Open a record from the verification list.</p>
            <button type="button" onClick={() => navigate('/admin/verification')} className="admin-btn-muted mt-6 border border-admin px-6 py-3">
              Go to list
            </button>
          </div>
        )}

        {record && (
          <>
            <section className="admin-card !rounded-2xl !p-0 overflow-hidden">
              <div className="flex flex-col gap-5 border-b border-admin px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar record={record} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-black text-admin-main">{record.name}</h2>
                      <span className="rounded-lg bg-indigo-600/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                        {record.type}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-admin-muted">ID: {record.id}</p>
                  </div>
                </div>
                {canManualDecision && (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <button type="button" onClick={handleApprove} className="h-11 rounded-xl bg-emerald-600 px-5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-emerald-700">
                      Approve
                    </button>
                    <button type="button" onClick={() => setShowRejectForm((value) => !value)} className="admin-btn-muted h-11 border border-admin px-5">
                      Decline
                    </button>
                  </div>
                )}
              </div>

              {showRejectForm && canManualDecision && (
                <div className="grid gap-3 border-b border-admin bg-admin-surface/60 px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-6">
                  <textarea
                    className="admin-input min-h-24 resize-none p-4"
                    placeholder="Rationale for rejection..."
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                  />
                  <div className="flex gap-2 sm:w-40 sm:flex-col">
                    <button type="button" onClick={handleReject} disabled={!rejectReason.trim()} className="h-11 flex-1 rounded-xl bg-rose-600 px-4 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                      Finalize
                    </button>
                    <button type="button" onClick={() => setShowRejectForm(false)} className="admin-btn-muted h-11 flex-1 border border-admin px-4">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { icon: Mail, label: 'Email', value: record.email },
                  { icon: Phone, label: 'Phone', value: record.phone || 'Not provided' },
                  { icon: Calendar, label: 'Joined', value: formatDate(record.regDate) },
                  { icon: FileText, label: 'Document', value: record.docType },
                ].map((item) => (
                  <div key={item.label} className="border-b border-admin px-5 py-3 sm:border-r sm:px-6 xl:border-b-0 xl:last:border-r-0">
                    <SummaryCell icon={item.icon} label={item.label} value={item.value} />
                  </div>
                ))}
              </div>
            </section>

            {record.type === 'Traveller' ? (
              <section className="admin-card !rounded-2xl !p-0 overflow-hidden">
                <div className="space-y-6 p-6">
                  <div>
                    <h2 className="text-xl font-black text-admin-main">Traveller Visa Dossier</h2>
                    <p className="mt-1 text-sm font-bold text-admin-muted">
                      One evidence file is enough here, so the review focuses on visa fields and expiry.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      ['E-visa Number', record.eVisaNumber || '-'],
                      ['Issuing Country', record.eVisaCountry || '-'],
                      ['Expiry Date', record.eVisaExpiryDate || '-'],
                    ].map(([label, value]) => (
                      <div key={label} className="border-t border-admin pt-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-admin-muted">{label}</p>
                        <p className="mt-1 truncate text-base font-black text-admin-main">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(220px,340px)_minmax(0,1fr)] md:items-start">
                    <div>
                      {record.docs.front ? (
                        <EvidenceFrame src={record.docs.front} label="E-visa Evidence" ratio="aspect-[4/3]" compact onPreview={(src, label) => setImagePreview({ src, label })} />
                      ) : (
                        <div className="rounded-2xl border border-admin bg-admin-surface p-10 text-center">
                          <FileText size={36} className="mx-auto mb-3 text-admin-muted" />
                          <h3 className="text-base font-black text-admin-main">No E-visa Evidence</h3>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 rounded-xl border border-admin bg-admin-surface/40 p-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-admin-main">Visa Checklist</h3>
                      <div className="mt-3 space-y-1">
                        {checklist.map((item) => (
                          <div key={item.label} className="flex items-center justify-between gap-4 border-b border-admin py-2.5 text-xs font-black text-admin-main last:border-b-0">
                            <span>{item.label}</span>
                            {item.passed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-rose-500" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="admin-card !rounded-2xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-admin-main">EKYC Document Review</h2>
                    <p className="mt-1 text-sm font-bold text-admin-muted">Review identity documents with the selfie evidence.</p>
                  </div>

                  {record.docs.front && record.docs.back ? (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <EvidenceFrame src={record.docs.front} label={`${record.docType} - Front`} ratio="aspect-[1.58/1]" onPreview={(src, label) => setImagePreview({ src, label })} />
                      <EvidenceFrame src={record.docs.back} label={`${record.docType} - Back`} ratio="aspect-[1.58/1]" onPreview={(src, label) => setImagePreview({ src, label })} />
                      <div className="lg:col-span-2">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-admin-muted">Selfie / Liveness</p>
                        <div className="aspect-[2/1] overflow-hidden rounded-xl border border-admin bg-admin-surface">
                          {isVideoUrl(record.docs.selfie) ? (
                            <video src={record.docs.selfie || ''} className="h-full w-full object-contain" controls muted playsInline />
                          ) : record.docs.selfie ? (
                            <button type="button" onClick={() => setImagePreview({ src: record.docs.selfie || '', label: 'Selfie evidence' })} className="group relative h-full w-full cursor-zoom-in">
                              <img src={record.docs.selfie} className="h-full w-full object-contain" alt="Selfie evidence" />
                              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-950/75 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <ZoomIn size={13} />
                                View
                              </span>
                            </button>
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs font-black uppercase tracking-widest text-admin-muted">No selfie evidence</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-admin bg-admin-surface p-10 text-center">
                      <FileText size={36} className="mx-auto mb-3 text-admin-muted" />
                      <h3 className="text-base font-black text-admin-main">No Required Evidence</h3>
                      <p className="mt-1 text-sm font-bold text-admin-muted">This record cannot be approved until evidence is uploaded.</p>
                    </div>
                  )}
                </section>

                <aside className="space-y-6">
                  <section className="admin-card !rounded-2xl space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-admin-main">EKYC Checklist</h3>
                    {checklist.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-4 border-b border-admin py-2.5 text-xs font-black text-admin-main last:border-b-0">
                        <span>{item.label}</span>
                        {item.passed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-rose-500" />}
                      </div>
                    ))}
                  </section>

                  <section className="admin-card !rounded-2xl space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-admin-main">Identity Data</h3>
                    <div className="space-y-3">
                      <DetailRow icon={User} label="Official Name" value={record.name} />
                      <DetailRow icon={FileText} label="ID Front" value={record.docs.front ? 'Uploaded' : 'Missing'} />
                      <DetailRow icon={FileText} label="ID Back" value={record.docs.back ? 'Uploaded' : 'Missing'} />
                      <DetailRow icon={Calendar} label="Selfie Video" value={record.docs.selfie ? 'Uploaded' : 'Missing'} />
                    </div>
                  </section>

                  <section className="admin-card !rounded-2xl space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-admin-main">Automatic Verification</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['Score', record.verificationScore],
                        ['Risk', record.riskScore],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="border-b border-admin pb-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-admin-muted">{label}</p>
                          <p className="mt-1 text-lg font-black text-admin-main">{value == null ? '-' : Math.round(Number(value))}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </aside>
              </div>
            )}

            {imagePreview && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 px-4 pb-4 pt-20 sm:pt-6" role="dialog" aria-modal="true" onClick={() => setImagePreview(null)}>
                <div className="relative flex max-h-full w-full max-w-6xl flex-col" onClick={(event) => event.stopPropagation()}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-black uppercase tracking-widest text-white">{imagePreview.label}</p>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20"
                      aria-label="Close image preview"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-white">
                    <img src={imagePreview.src} alt={imagePreview.label} className="max-h-[calc(100vh-8rem)] w-full object-contain sm:max-h-[calc(100vh-6rem)]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVerificationDetail;
