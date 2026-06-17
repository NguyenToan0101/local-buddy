import React, { useEffect, useState } from 'react';
import {
  Search, Filter, ChevronDown,
  Eye, Calendar, User, FileText, AlertTriangle, X,
  ShieldCheck, Loader2
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService } from '../../services/api';

// Interface matching backend AdminVerificationDto
interface VerificationRecord {
  id: string;
  name: string;
  type: 'Buddy';
  regDate: string;
  docType: 'CCCD' | 'Passport';
  status: 'Pending' | 'Processing' | 'Manual Review' | 'Verified' | 'Rejected';
  avatar: string;
  docs: {
    front: string | null;
    back: string | null;
    selfie: string;
  };
  email: string;
  phone: string | null;
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

type FilterStatus = 'All' | 'Pending' | 'Processing' | 'Manual Review' | 'Verified' | 'Rejected';

const AdminAvatar = ({ src, name, className }: { src?: string | null; name?: string; className: string }) =>
  src ? (
    <img src={src} className={`${className} object-cover shadow-lg`} alt={name || 'User'} referrerPolicy="no-referrer" />
  ) : (
    <div className={`${className} flex items-center justify-center bg-indigo-600/10 text-xs font-black uppercase text-indigo-600 shadow-lg`}>
      {(name || 'US').slice(0, 2)}
    </div>
  );

const AdminVerification: React.FC = () => {
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<VerificationRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [allVerifications, setAllVerifications] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAgeFromOcrDob = (dobStr?: string | null): number | null => {
    if (!dobStr) return null;
    const parts = dobStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let birthYear = 0;
      if (parts[2].length === 4) {
        birthYear = parseInt(parts[2], 10);
      } else if (parts[0].length === 4) {
        birthYear = parseInt(parts[0], 10);
      }
      if (birthYear > 0) {
        return new Date().getFullYear() - birthYear;
      }
    }
    return null;
  };

  const selectedOcrAge = selectedUser ? calculateAgeFromOcrDob(selectedUser.extractedDateOfBirth) : null;
  const nameMismatch = selectedUser?.extractedFullName && selectedUser?.name
    ? selectedUser.name.trim().toLowerCase() !== selectedUser.extractedFullName.trim().toLowerCase()
    : false;
  const ageMismatch = selectedOcrAge !== null && selectedUser?.age !== undefined
    ? Math.abs(selectedOcrAge - selectedUser.age) > 1
    : false;

  // Fetch buddy verification records only. Travellers do not require identity verification.
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await adminService.getVerifications();
        setAllVerifications(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load verification records');
        console.error('Error fetching verifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();
  }, []);

  const handleApprove = async (record: VerificationRecord) => {
    try {
      setError(null);

      await adminService.updateBuddyVerification(record.id, 'verified');

      // Update local state
      setAllVerifications((prev) =>
        prev.map((v) =>
          v.id === record.id ? { ...v, status: 'Verified' } : v
        )
      );

      setSelectedUser(null);
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

      await adminService.updateBuddyVerification(record.id, 'rejected', rejectReason);

      // Update local state
      setAllVerifications((prev) =>
        prev.map((v) =>
          v.id === record.id ? { ...v, status: 'Rejected' } : v
        )
      );

      setSelectedUser(null);
      setShowRejectForm(false);
      setRejectReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject verification');
    }
  };

  // Filter data by status and search query.
  const filteredData = allVerifications
    .filter((item) => filter === 'All' || item.status === filter)
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.phone && item.phone.toLowerCase().includes(query))
      );
    });

  const buddyCount = allVerifications.length;
  const isVideoUrl = (url?: string | null) => {
    if (!url) return false;
    return /\/video\/upload\//.test(url) || /\.(mp4|webm)(\?|$)/i.test(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-10 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-admin-main flex items-center gap-3">
              <ShieldCheck className="text-indigo-600" size={36} />
              Identity Verification
            </h1>
            <p className="text-lg font-bold text-admin-muted">
              Verify credentials for a safe and trusted community.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group w-full max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full admin-input pl-12"
              />
            </div>

            <div className="relative group">
              <button className="flex items-center gap-3 h-12 px-6 text-sm font-black bg-admin-surface border border-admin rounded-2xl transition-all shadow-sm hover:border-indigo-500/50">
                <Filter size={18} className="text-indigo-500" />
                {filter}
                <ChevronDown size={16} className="text-admin-muted group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute right-0 mt-3 w-48 admin-glass rounded-2xl shadow-2xl overflow-hidden border border-admin invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-50">
                {(['All', 'Pending', 'Processing', 'Manual Review', 'Verified', 'Rejected'] as FilterStatus[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="w-full text-left px-6 py-4 text-xs font-black hover:bg-indigo-600 hover:text-white transition-all border-b border-admin last:border-none text-admin-main"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 border-b border-admin">
          <div className="flex items-center gap-3 px-6 py-4 font-black border-b-4 border-indigo-600 text-indigo-600">
            <ShieldCheck size={20} />
            Buddies
            <span className="px-3 py-1 bg-admin-surface rounded-full text-xs font-black">
              {buddyCount}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-3">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:opacity-70">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-12 rounded-2xl bg-admin-surface border border-admin text-center">
            <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-sm font-medium text-admin-muted">Loading verification records...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredData.length === 0 && (
          <div className="p-12 rounded-2xl bg-admin-surface border border-admin text-center">
            <div className="w-16 h-16 bg-admin-layout-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-admin-muted" />
            </div>
            <h3 className="text-lg font-black text-admin-main mb-2">No Buddies Found</h3>
            <p className="text-sm text-admin-muted">
              {searchQuery || filter !== 'All'
                ? 'Try adjusting your filters or search query.'
                : 'No buddy verification records available yet.'}
            </p>
          </div>
        )}

        {/* Verification Table */}
        {!loading && filteredData.length > 0 && (
          <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-admin bg-admin-surface/50">
                    <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      User Details
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em] md:table-cell hidden">
                      Registration
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      Document
                    </th>
                    <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      Status
                    </th>
                    <th className="px-8 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin">
                  {filteredData.map((record) => (
                    <tr key={record.id} className="group hover:bg-admin-surface/50 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <AdminAvatar src={record.avatar} name={record.name} className="w-12 h-12 rounded-2xl group-hover:scale-110 transition-transform" />
                          <div className="space-y-1">
                            <p className="text-sm font-black text-admin-main flex items-center gap-2">
                              {record.name}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-600/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.18em]">
                                {record.type}
                              </span>
                            </p>
                            <p className="text-[10px] font-black text-admin-muted uppercase tracking-tight">
                              {record.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 md:table-cell hidden">
                        <div className="flex items-center gap-2 text-admin-muted text-xs font-black">
                          <Calendar size={16} className="text-indigo-500" />
                          {new Date(record.regDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-admin-surface text-admin-muted text-[10px] font-black uppercase tracking-widest border border-admin">
                          <FileText size={14} className="text-indigo-500" />
                          {record.docType}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div
                          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${record.status === 'Pending' || record.status === 'Manual Review'
                            ? 'bg-amber-100 text-amber-600'
                            : record.status === 'Processing'
                              ? 'bg-blue-100 text-blue-600'
                            : record.status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-red-100 text-red-600'
                            }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${record.status === 'Pending' || record.status === 'Manual Review'
                              ? 'bg-amber-500 animate-pulse'
                              : record.status === 'Processing'
                                ? 'bg-blue-500 animate-pulse'
                              : record.status === 'Verified'
                                ? 'bg-emerald-500'
                                : 'bg-red-500'
                              }`}
                          ></span>
                          {record.status}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => setSelectedUser(record)}
                          className="w-10 h-10 rounded-xl bg-admin-surface text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-admin flex items-center justify-center lg:ml-auto lg:mr-0"
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

      {/* Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => {
              setSelectedUser(null);
              setShowRejectForm(false);
              setRejectReason('');
            }}
          ></div>

          <div className="bg-admin-sidebar border border-admin w-full max-w-7xl rounded-[48px] shadow-2xl overflow-hidden relative z-10 flex flex-col xl:flex-row min-h-[80vh] xl:min-h-[90vh]">
            <button
              className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-admin-surface flex items-center justify-center text-admin-muted hover:text-rose-500 border border-admin shadow-sm transition-all z-20"
              onClick={() => {
                setSelectedUser(null);
                setShowRejectForm(false);
                setRejectReason('');
              }}
            >
              <X size={24} />
            </button>

            {/* Left: Documents View */}
            <div className="flex-1 bg-admin-layout-bg p-12 overflow-y-auto border-r border-admin custom-scrollbar">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black flex items-center gap-4 text-admin-main">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <FileText size={20} />
                  </div>
                  Document Review
                </h3>
              </div>

              {selectedUser.docs.front && selectedUser.docs.back ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      {selectedUser.docType} - Front
                    </p>
                    <div className="aspect-[1.58/1] bg-admin-surface rounded-[32px] overflow-hidden border border-admin group">
                      <img
                        src={selectedUser.docs.front}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt="Document front"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      {selectedUser.docType} - Back
                    </p>
                    <div className="aspect-[1.58/1] bg-admin-surface rounded-[32px] overflow-hidden border border-admin group">
                      <img
                        src={selectedUser.docs.back}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt="Document back"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4 pt-10 border-t border-admin">
                    <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      Security Check: Selfie Comparison
                    </p>
                    <div className="aspect-[2/1] relative rounded-[32px] overflow-hidden border border-admin">
                      <div className="absolute inset-0 flex">
                        <div className="flex-1 bg-admin-surface border-r border-admin overflow-hidden">
                          {selectedUser.avatar ? (
                            <img
                              src={selectedUser.avatar}
                              className="w-full h-full object-cover"
                              alt="Profile avatar"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-indigo-600/10 text-2xl font-black uppercase text-indigo-600">
                              {(selectedUser.name || 'US').slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 bg-admin-surface overflow-hidden">
                          {isVideoUrl(selectedUser.docs.selfie) ? (
                            <video
                              src={selectedUser.docs.selfie}
                              className="w-full h-full object-cover"
                              controls
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={selectedUser.docs.selfie}
                              className="w-full h-full object-cover"
                              alt="Document selfie"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-admin-surface rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-admin-muted" />
                  </div>
                  <h4 className="text-lg font-black text-admin-main mb-2">No Documents Uploaded</h4>
                  <p className="text-sm text-admin-muted">
                    This user has not uploaded verification documents yet.
                  </p>
                </div>
              )}
            </div>

            {/* Right: User Details & Decisions */}
            <div className="w-full xl:w-[480px] p-12 space-y-10 overflow-y-auto bg-admin-sidebar custom-scrollbar">
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-admin-main">Identity Metadata</h3>
                <div className="flex items-center gap-6 p-6 bg-admin-surface rounded-[32px] border border-admin shadow-inner">
                  <AdminAvatar src={selectedUser.avatar} name={selectedUser.name} className="w-20 h-20 rounded-3xl" />
                  <div>
                    <h4 className="text-xl font-black text-admin-main">{selectedUser.name}</h4>
                    <span className="inline-block px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black tracking-widest mt-2">
                      {selectedUser.type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {[
                    { icon: User, label: 'Official Name', value: selectedUser.name, warning: nameMismatch ? `OCR Name mismatch: "${selectedUser.extractedFullName || 'None'}"` : null },
                    { icon: User, label: 'Registered Age', value: selectedUser.age ? `${selectedUser.age} years old` : 'Not provided', warning: ageMismatch ? `DOB mismatch: suggests ${selectedOcrAge} years old` : null },
                    { icon: FileText, label: 'Email Address', value: selectedUser.email },
                    { icon: FileText, label: 'Phone Number', value: selectedUser.phone || 'Not provided' },
                    { icon: Calendar, label: 'Joined Platform', value: new Date(selectedUser.regDate).toLocaleDateString() },
                  ].map((info, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${info.warning ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-admin-surface border-admin text-admin-muted'}`}>
                        <info.icon size={20} />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.2em] mb-1">
                          {info.label}
                        </p>
                        <p className={`text-sm font-black truncate ${info.warning ? 'text-rose-500' : 'text-admin-main'}`}>{info.value}</p>
                        {info.warning && (
                          <p className="text-[10px] font-black uppercase text-rose-500 mt-1 tracking-tight animate-pulse flex items-center gap-1">
                            ⚠️ {info.warning}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-admin-surface rounded-[32px] border border-admin space-y-4">
                  <h4 className="text-sm font-black text-admin-main uppercase tracking-[0.2em]">Auto Verification</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Face', value: selectedUser.faceMatchScore },
                      { label: 'Liveness', value: selectedUser.livenessScore },
                      { label: 'Quality', value: selectedUser.qualityScore },
                      { label: 'Anti-spoof', value: selectedUser.antiSpoofScore == null ? null : 100 - selectedUser.antiSpoofScore },
                      { label: 'OCR', value: selectedUser.ocrScore },
                      { label: 'Risk', value: selectedUser.riskScore },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-admin bg-admin-sidebar p-4">
                        <p className="text-[9px] font-black text-admin-muted uppercase tracking-widest">{metric.label}</p>
                        <p className="text-lg font-black text-admin-main mt-1">{metric.value == null ? '-' : Math.round(metric.value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-xs font-bold text-admin-muted">
                    <p className={nameMismatch ? 'text-rose-500' : ''}>OCR name: <span className={nameMismatch ? 'text-rose-600 font-black' : 'text-admin-main'}>{selectedUser.extractedFullName || '-'}</span> {nameMismatch && '⚠️'}</p>
                    <p>ID number: <span className="text-admin-main">{selectedUser.extractedIdNumber || '-'}</span></p>
                    <p className={ageMismatch ? 'text-rose-500' : ''}>DOB: <span className={ageMismatch ? 'text-rose-600 font-black' : 'text-admin-main'}>{selectedUser.extractedDateOfBirth || '-'}</span> {ageMismatch && '⚠️'}</p>
                    {selectedUser.autoVerificationMessage && <p>{selectedUser.autoVerificationMessage}</p>}
                    {selectedUser.riskReason && <p>{selectedUser.riskReason}</p>}
                    {selectedUser.duplicateDetected && (
                      <p className="text-amber-500 font-black uppercase tracking-wider text-[10px] bg-amber-500/10 p-2.5 rounded-xl border border-amber-200/30 mt-2">
                        ⚠️ Duplicate warning: identity overlaps with {selectedUser.duplicateUserId || 'another user'}.
                      </p>
                    )}
                    {selectedUser.rejectionReason && <p className="text-rose-500">{selectedUser.rejectionReason}</p>}
                  </div>
                </div>
              </div>

              {/* Only show approve/reject for records selected for manual review. */}
              {selectedUser.status === 'Manual Review' && selectedUser.docs.front && selectedUser.docs.back && (
                <div className="pt-10 border-t border-admin space-y-4">
                  {!showRejectForm ? (
                    <>
                      <button
                        onClick={() => handleApprove(selectedUser)}
                        className="w-full h-20 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                      >
                        Approve Verification
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="w-full h-16 admin-btn-muted border border-admin font-black uppercase tracking-widest"
                      >
                        Decline Verification
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <textarea
                        className="w-full h-40 admin-input p-6 border-admin focus:ring-rose-500/10"
                        placeholder="Rationale for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      ></textarea>
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectReason('');
                          }}
                          className="flex-1 h-16 admin-btn-muted border border-admin"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(selectedUser)}
                          disabled={!rejectReason.trim()}
                          className="flex-[2] h-16 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
