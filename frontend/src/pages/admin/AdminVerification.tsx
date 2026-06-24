import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/api';

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
  extractedFullName?: string | null;
  extractedIdNumber?: string | null;
  extractedDateOfBirth?: string | null;
  faceMatchScore?: number | null;
  livenessScore?: number | null;
  verificationScore?: number | null;
  qualityScore?: number | null;
  antiSpoofScore?: number | null;
  riskScore?: number | null;
  riskReason?: string | null;
  duplicateDetected?: boolean | null;
  duplicateUserId?: string | null;
  rejectionReason?: string | null;
  autoVerificationMessage?: string | null;
  ocrScore?: number | null;
  age?: number;
}

type FilterStatus = 'All' | VerificationRecord['status'];
type TypeFilter = 'All' | VerificationRecord['type'];

const statusOptions: FilterStatus[] = ['All', 'Unverified', 'Pending', 'Processing', 'Manual Review', 'Verified', 'Rejected'];

const statusStyles: Record<VerificationRecord['status'], { badge: string; dot: string; icon: React.ElementType }> = {
  Unverified: { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400', icon: Clock3 },
  Pending: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500 animate-pulse', icon: Clock3 },
  Processing: { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500 animate-pulse', icon: Loader2 },
  'Manual Review': { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500 animate-pulse', icon: AlertTriangle },
  Verified: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Rejected: { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', icon: XCircle },
};

const formatDate = (value?: string | null) => {
  if (!value || value === 'N/A') return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
};

const isVideoUrl = (url?: string | null) => Boolean(url && (/\/video\/upload\//.test(url) || /\.(mp4|webm)(\?|$)/i.test(url)));

const AdminAvatar = ({ src, name, className }: { src?: string | null; name?: string; className: string }) =>
  src ? (
    <img src={src} className={`${className} object-cover shadow-lg`} alt={name || 'User'} referrerPolicy="no-referrer" />
  ) : (
    <div className={`${className} flex items-center justify-center bg-indigo-600/10 text-xs font-black uppercase text-indigo-600 shadow-lg`}>
      {(name || 'US').slice(0, 2)}
    </div>
  );

const StatusPill = ({ status }: { status: VerificationRecord['status'] }) => {
  const style = statusStyles[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-sm ${style.badge}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      <Icon size={13} className={status === 'Processing' ? 'animate-spin' : ''} />
      {status}
    </span>
  );
};

const EvidenceImage = ({ src, alt, ratio = 'aspect-[4/3]' }: { src: string; alt: string; ratio?: string }) => (
  <div className={`${ratio} overflow-hidden rounded-3xl border border-admin bg-admin-surface group`}>
    <img src={src} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" alt={alt} />
  </div>
);

const AdminVerification: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<VerificationRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [allVerifications, setAllVerifications] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getVerifications();
        setAllVerifications(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load verification records');
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();
  }, []);

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allVerifications
      .filter((item) => statusFilter === 'All' || item.status === statusFilter)
      .filter((item) => typeFilter === 'All' || item.type === typeFilter)
      .filter((item) => {
        if (!query) return true;
        return (
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          Boolean(item.phone?.toLowerCase().includes(query)) ||
          Boolean(item.eVisaNumber?.toLowerCase().includes(query))
        );
      });
  }, [allVerifications, searchQuery, statusFilter, typeFilter]);

  const buddyCount = allVerifications.filter((record) => record.type === 'Buddy').length;
  const travelerCount = allVerifications.filter((record) => record.type === 'Traveller').length;
  const reviewCount = allVerifications.filter((record) => record.status === 'Pending' || record.status === 'Manual Review').length;

  const canManualDecision = (record: VerificationRecord) =>
    (record.status === 'Pending' || record.status === 'Manual Review') &&
    (record.type === 'Traveller' ? Boolean(record.docs.front) : Boolean(record.docs.front && record.docs.back));

  const checklistFor = (record: VerificationRecord) =>
    record.type === 'Traveller'
      ? [
          { label: 'E-visa evidence image', passed: Boolean(record.docs.front) },
          { label: 'E-visa number', passed: Boolean(record.eVisaNumber) },
          { label: 'Issuing country', passed: Boolean(record.eVisaCountry) },
          { label: 'Expiry date', passed: Boolean(record.eVisaExpiryDate) },
        ]
      : [
          { label: 'ID front image', passed: Boolean(record.docs.front) },
          { label: 'ID back image', passed: Boolean(record.docs.back) },
          { label: 'Selfie or liveness video', passed: Boolean(record.docs.selfie) },
        ];

  const calculateAgeFromOcrDob = (dobStr?: string | null): number | null => {
    if (!dobStr) return null;
    const parts = dobStr.split(/[/-]/);
    if (parts.length !== 3) return null;
    const birthYear = parts[2].length === 4 ? parseInt(parts[2], 10) : parts[0].length === 4 ? parseInt(parts[0], 10) : 0;
    return birthYear > 0 ? new Date().getFullYear() - birthYear : null;
  };

  const selectedOcrAge = selectedUser ? calculateAgeFromOcrDob(selectedUser.extractedDateOfBirth) : null;
  const nameMismatch = Boolean(
    selectedUser?.extractedFullName &&
      selectedUser?.name &&
      selectedUser.name.trim().toLowerCase() !== selectedUser.extractedFullName.trim().toLowerCase()
  );
  const ageMismatch = selectedOcrAge !== null && selectedUser?.age !== undefined ? Math.abs(selectedOcrAge - selectedUser.age) > 1 : false;

  const closeModal = () => {
    setSelectedUser(null);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const handleApprove = async (record: VerificationRecord) => {
    try {
      setError(null);
      if (record.type === 'Traveller') {
        await adminService.updateTravelerVerification(record.id, 'verified');
      } else {
        await adminService.updateBuddyVerification(record.id, 'verified');
      }
      setAllVerifications((prev) => prev.map((item) => (item.id === record.id ? { ...item, status: 'Verified' } : item)));
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Failed to approve verification');
    }
  };

  const handleReject = async (record: VerificationRecord) => {
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
      setAllVerifications((prev) => prev.map((item) => (item.id === record.id ? { ...item, status: 'Rejected', rejectionReason: rejectReason } : item)));
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Failed to reject verification');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-admin-main sm:text-4xl">
              <ShieldCheck className="text-indigo-600" size={36} />
              Identity Verification
            </h1>
            <p className="text-base font-bold text-admin-muted sm:text-lg">Review buddy EKYC and traveller E-visa evidence.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted" size={18} />
              <input
                type="text"
                placeholder="Search name, email, phone, E-visa..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full admin-input pl-12"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((open) => !open)}
                className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-admin bg-admin-surface px-6 text-sm font-black shadow-sm transition-all hover:border-indigo-500/50 sm:w-56"
              >
                <span className="inline-flex items-center gap-3">
                  <Filter size={18} className="text-indigo-500" />
                  {statusFilter}
                </span>
                <ChevronDown size={16} className={`text-admin-muted transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-admin admin-glass shadow-2xl">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setFilterOpen(false);
                      }}
                      className={`w-full border-b border-admin px-6 py-4 text-left text-xs font-black transition-all last:border-none hover:bg-indigo-600 hover:text-white ${
                        statusFilter === status ? 'bg-indigo-600 text-white' : 'text-admin-main'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-admin">
          {[
            { id: 'All' as TypeFilter, label: 'All', count: allVerifications.length, icon: ShieldCheck },
            { id: 'Buddy' as TypeFilter, label: 'Buddies', count: buddyCount, icon: ShieldCheck },
            { id: 'Traveller' as TypeFilter, label: 'Travellers', count: travelerCount, icon: User },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTypeFilter(item.id)}
              className={`flex items-center gap-3 border-b-4 px-5 py-4 font-black transition-colors ${
                typeFilter === item.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-admin-muted hover:text-admin-main'
              }`}
            >
              <item.icon size={20} />
              {item.label}
              <span className="rounded-full bg-admin-surface px-3 py-1 text-xs font-black">{item.count}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 px-5 py-4 font-black text-amber-600">
            <AlertTriangle size={20} />
            Need Review
            <span className="rounded-full bg-admin-surface px-3 py-1 text-xs font-black">{reviewCount}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="ml-auto hover:opacity-70">
              <X size={16} />
            </button>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-admin bg-admin-surface p-12 text-center">
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-admin-muted">Loading verification records...</p>
          </div>
        )}

        {!loading && filteredData.length === 0 && (
          <div className="rounded-2xl border border-admin bg-admin-surface p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full admin-layout-bg">
              <ShieldCheck size={32} className="text-admin-muted" />
            </div>
            <h3 className="mb-2 text-lg font-black text-admin-main">No Verification Records Found</h3>
            <p className="text-sm text-admin-muted">{searchQuery || statusFilter !== 'All' || typeFilter !== 'All' ? 'Try adjusting your filters or search query.' : 'No verification records available yet.'}</p>
          </div>
        )}

        {!loading && filteredData.length > 0 && (
          <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-admin bg-admin-surface/50">
                    <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">User Details</th>
                    <th className="hidden px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted md:table-cell">Registration</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">Document</th>
                    <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">Status</th>
                    <th className="px-8 py-5 text-right text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin">
                  {filteredData.map((record) => (
                    <tr key={record.id} className="group transition-all hover:bg-admin-surface/50">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <AdminAvatar src={record.avatar} name={record.name} className="h-12 w-12 rounded-2xl transition-transform group-hover:scale-110" />
                          <div className="min-w-0 space-y-1">
                            <p className="flex items-center gap-2 text-sm font-black text-admin-main">
                              <span className="truncate">{record.name}</span>
                              <span className="inline-flex items-center rounded-md bg-indigo-600/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                                {record.type}
                              </span>
                            </p>
                            <p className="truncate text-[10px] font-black uppercase tracking-tight text-admin-muted">{record.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-8 py-6 md:table-cell">
                        <div className="flex items-center gap-2 text-xs font-black text-admin-muted">
                          <Calendar size={16} className="text-indigo-500" />
                          {formatDate(record.regDate)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-admin bg-admin-surface px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-admin-muted">
                          <FileText size={14} className="text-indigo-500" />
                          {record.docType}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusPill status={record.status} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/verification/detail?id=${encodeURIComponent(record.id)}`)}
                          className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl border border-admin bg-admin-surface text-indigo-500 shadow-sm transition-all hover:bg-indigo-600 hover:text-white"
                        >
                          <Eye size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 animate-fade-in sm:p-6">
          <button type="button" aria-label="Close review modal" className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={closeModal} />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-admin admin-sidebar-bg shadow-2xl xl:flex-row">
            <button
              type="button"
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-admin bg-admin-surface text-admin-muted shadow-sm transition-all hover:text-rose-500 sm:right-6 sm:top-6"
              onClick={closeModal}
            >
              <X size={24} />
            </button>

            <div className="flex-1 overflow-y-auto border-r border-admin admin-layout-bg p-5 custom-scrollbar sm:p-8 xl:p-12">
              <div className="mb-8 flex items-center justify-between pr-12 sm:mb-12">
                <h3 className="flex items-center gap-4 text-xl font-black text-admin-main sm:text-2xl">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <FileText size={20} />
                  </span>
                  Document Review
                </h3>
              </div>

              {selectedUser.type === 'Traveller' && selectedUser.docs.front ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">E-visa Evidence</p>
                    <EvidenceImage src={selectedUser.docs.front} alt="E-visa evidence" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { label: 'E-visa number', value: selectedUser.eVisaNumber || '-' },
                      { label: 'Issuing country', value: selectedUser.eVisaCountry || '-' },
                      { label: 'Expiry date', value: selectedUser.eVisaExpiryDate || '-' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-admin bg-admin-surface p-5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-admin-muted">{item.label}</p>
                        <p className="mt-2 text-sm font-black text-admin-main">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : selectedUser.type === 'Buddy' && selectedUser.docs.front && selectedUser.docs.back ? (
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">{selectedUser.docType} - Front</p>
                    <EvidenceImage src={selectedUser.docs.front} alt="Document front" ratio="aspect-[1.58/1]" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">{selectedUser.docType} - Back</p>
                    <EvidenceImage src={selectedUser.docs.back} alt="Document back" ratio="aspect-[1.58/1]" />
                  </div>
                  <div className="space-y-4 border-t border-admin pt-10 lg:col-span-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-admin-muted">Security Check: Selfie Comparison</p>
                    <div className="relative aspect-[2/1] overflow-hidden rounded-3xl border border-admin">
                      <div className="absolute inset-0 flex">
                        <div className="flex-1 overflow-hidden border-r border-admin bg-admin-surface">
                          {selectedUser.avatar ? (
                            <img src={selectedUser.avatar} className="h-full w-full object-cover" alt="Profile avatar" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-indigo-600/10 text-2xl font-black uppercase text-indigo-600">
                              {(selectedUser.name || 'US').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden bg-admin-surface">
                          {isVideoUrl(selectedUser.docs.selfie) ? (
                            <video src={selectedUser.docs.selfie || ''} className="h-full w-full object-cover" controls muted playsInline />
                          ) : selectedUser.docs.selfie ? (
                            <img src={selectedUser.docs.selfie} className="h-full w-full object-cover" alt="Document selfie" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-widest text-admin-muted">No selfie</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center sm:p-12">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-admin-surface">
                    <FileText size={32} className="text-admin-muted" />
                  </div>
                  <h4 className="mb-2 text-lg font-black text-admin-main">No Documents Uploaded</h4>
                  <p className="text-sm text-admin-muted">This user has not uploaded the required verification evidence yet.</p>
                </div>
              )}
            </div>

            <div className="w-full space-y-8 overflow-y-auto admin-sidebar-bg p-5 custom-scrollbar sm:p-8 xl:w-[480px] xl:p-12">
              <div className="space-y-8">
                <div className="flex items-center justify-between gap-4 pr-12 sm:pr-0">
                  <h3 className="text-xl font-black text-admin-main sm:text-2xl">Identity Metadata</h3>
                  <StatusPill status={selectedUser.status} />
                </div>

                <div className="flex items-center gap-6 rounded-[32px] border border-admin bg-admin-surface p-6 shadow-inner">
                  <AdminAvatar src={selectedUser.avatar} name={selectedUser.name} className="h-20 w-20 rounded-3xl" />
                  <div className="min-w-0">
                    <h4 className="truncate text-xl font-black text-admin-main">{selectedUser.name}</h4>
                    <span className="mt-2 inline-block rounded-lg bg-indigo-600 px-3 py-1 text-[10px] font-black tracking-widest text-white">{selectedUser.type}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {[
                    { icon: User, label: 'Official Name', value: selectedUser.name, warning: nameMismatch ? `OCR name mismatch: ${selectedUser.extractedFullName || 'None'}` : null },
                    { icon: User, label: 'Registered Age', value: selectedUser.age ? `${selectedUser.age} years old` : 'Not provided', warning: ageMismatch ? `DOB suggests ${selectedOcrAge} years old` : null },
                    { icon: FileText, label: 'Email Address', value: selectedUser.email },
                    { icon: FileText, label: 'Phone Number', value: selectedUser.phone || 'Not provided' },
                    ...(selectedUser.type === 'Traveller'
                      ? [
                          { icon: FileText, label: 'E-visa Number', value: selectedUser.eVisaNumber || 'Not provided' },
                          { icon: FileText, label: 'Issuing Country', value: selectedUser.eVisaCountry || 'Not provided' },
                          { icon: Calendar, label: 'E-visa Expiry', value: selectedUser.eVisaExpiryDate || 'Not provided' },
                        ]
                      : []),
                    { icon: Calendar, label: 'Joined Platform', value: formatDate(selectedUser.regDate) },
                  ].map((info) => (
                    <div key={info.label} className="flex gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${info.warning ? 'border-rose-500/30 bg-rose-500/10 text-rose-500' : 'border-admin bg-admin-surface text-admin-muted'}`}>
                        <info.icon size={20} />
                      </div>
                      <div className="flex min-w-0 flex-col justify-center">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-admin-muted">{info.label}</p>
                        <p className={`truncate text-sm font-black ${info.warning ? 'text-rose-500' : 'text-admin-main'}`}>{info.value}</p>
                        {info.warning && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-tight text-rose-500">
                            <AlertTriangle size={12} />
                            {info.warning}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 rounded-[32px] border border-admin bg-admin-surface p-6">
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-admin-main">Review Checklist</h4>
                  {checklistFor(selectedUser).map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 text-xs font-black text-admin-main">
                      <span>{item.label}</span>
                      {item.passed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-rose-500" />}
                    </div>
                  ))}
                  {!canManualDecision(selectedUser) && (selectedUser.status === 'Pending' || selectedUser.status === 'Manual Review') && (
                    <p className="rounded-2xl bg-amber-500/10 p-3 text-xs font-bold text-amber-700">Required evidence is missing, so this record cannot be approved yet.</p>
                  )}
                </div>

                {selectedUser.type === 'Buddy' && (
                  <div className="space-y-4 rounded-[32px] border border-admin bg-admin-surface p-6">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-admin-main">Auto Verification</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Face', value: selectedUser.faceMatchScore },
                        { label: 'Liveness', value: selectedUser.livenessScore },
                        { label: 'Quality', value: selectedUser.qualityScore },
                        { label: 'Anti-spoof', value: selectedUser.antiSpoofScore == null ? null : 100 - selectedUser.antiSpoofScore },
                        { label: 'OCR', value: selectedUser.ocrScore },
                        { label: 'Risk', value: selectedUser.riskScore },
                      ].map((metric) => (
                        <div key={metric.label} className="rounded-2xl border border-admin admin-sidebar-bg p-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-admin-muted">{metric.label}</p>
                          <p className="mt-1 text-lg font-black text-admin-main">{metric.value == null ? '-' : Math.round(metric.value)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 text-xs font-bold text-admin-muted">
                      <p className={nameMismatch ? 'text-rose-500' : ''}>OCR name: <span className={nameMismatch ? 'font-black text-rose-600' : 'text-admin-main'}>{selectedUser.extractedFullName || '-'}</span></p>
                      <p>ID number: <span className="text-admin-main">{selectedUser.extractedIdNumber || '-'}</span></p>
                      <p className={ageMismatch ? 'text-rose-500' : ''}>DOB: <span className={ageMismatch ? 'font-black text-rose-600' : 'text-admin-main'}>{selectedUser.extractedDateOfBirth || '-'}</span></p>
                      {selectedUser.autoVerificationMessage && <p>{selectedUser.autoVerificationMessage}</p>}
                      {selectedUser.riskReason && <p>{selectedUser.riskReason}</p>}
                      {selectedUser.duplicateDetected && (
                        <p className="mt-2 rounded-xl border border-amber-200/30 bg-amber-500/10 p-2.5 text-[10px] font-black uppercase tracking-wider text-amber-500">
                          Duplicate warning: identity overlaps with {selectedUser.duplicateUserId || 'another user'}.
                        </p>
                      )}
                      {selectedUser.rejectionReason && <p className="text-rose-500">{selectedUser.rejectionReason}</p>}
                    </div>
                  </div>
                )}
              </div>

              {canManualDecision(selectedUser) && (
                <div className="space-y-4 border-t border-admin pt-8">
                  {!showRejectForm ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(selectedUser)}
                        className="h-16 w-full rounded-3xl bg-emerald-600 font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.01]"
                      >
                        Approve Verification
                      </button>
                      <button type="button" onClick={() => setShowRejectForm(true)} className="h-14 w-full border border-admin admin-btn-muted font-black uppercase tracking-widest">
                        Decline Verification
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <textarea
                        className="h-36 w-full resize-none border-admin p-6 admin-input focus:ring-rose-500/10"
                        placeholder="Rationale for rejection..."
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                      />
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectReason('');
                          }}
                          className="h-14 flex-1 border border-admin admin-btn-muted"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(selectedUser)}
                          disabled={!rejectReason.trim()}
                          className="h-14 flex-[2] rounded-2xl bg-rose-600 font-black uppercase tracking-widest text-white shadow-xl shadow-rose-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Finalize
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVerification;
