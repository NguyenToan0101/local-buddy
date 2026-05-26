import React, { useEffect, useState } from 'react';
import { 
  Search, Filter, ChevronDown, 
  Eye, Calendar, User, FileText, AlertTriangle, X,
  ShieldCheck
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { buddyService, userService } from '../../services/api';

interface VerificationRecord {
  id: string;
  name: string;
  type: 'Buddy' | 'Traveller';
  regDate: string;
  docType: 'CCCD' | 'Passport';
  status: 'Pending' | 'Verified' | 'Rejected';
  avatar: string;
  docs: {
    front: string;
    back: string;
    selfie: string;
  };
  email: string;
  phone: string;
}

const AdminVerification: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Verified' | 'Rejected'>('All');
  const [selectedUser, setSelectedUser] = useState<VerificationRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accounts from mock/localStorage DB
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy cả users và buddies, ưu tiên trạng thái từ buddies (Buddy tự upload CCCD)
        const [users, buddies] = await Promise.all([
          userService.getAll(),
          buddyService.getAll(),
        ]);

        const buddyById = new Map<string, any>();
        (buddies as any[]).forEach((b) => buddyById.set(String(b.id), b));

        const mapped: VerificationRecord[] = (users as any[]).map((u: any, index: number) => {
          const buddy = buddyById.get(String(u.id));

          const rawStatus =
            buddy?.verificationStatus ??
            u.verificationStatus ??
            'unverified';

          const status: VerificationRecord['status'] =
            rawStatus === 'verified'
              ? 'Verified'
              : rawStatus === 'rejected'
              ? 'Rejected'
              : 'Pending';

          return {
            id: u.id,
            name: u.name,
            type: u.role === 'BUDDY' ? 'Buddy' : 'Traveller',
            regDate: u.createdAt || u.registrationDate || 'N/A',
            docType: u.role === 'TRAVELER' ? 'Passport' : 'CCCD',
            status,
            avatar:
              buddy?.image ||
              u.avatar ||
              `https://i.pravatar.cc/150?u=${encodeURIComponent(u.email || String(index))}`,
            docs: {
              front: buddy?.idCardFront || u.verificationDocs?.front || '',
              back: buddy?.idCardBack || u.verificationDocs?.back || '',
              selfie:
                buddy?.idCardFront ||
                u.verificationDocs?.selfie ||
                buddy?.image ||
                u.avatar ||
                '',
            },
            email: u.email || '',
            phone: buddy?.phone || u.phone || '',
          };
        });

        // Hiển thị đầy đủ (Pending / Verified / Rejected) để admin xem lịch sử
        setVerifications(mapped);
      } catch (err: any) {
        setError(err.message || 'Something went wrong while loading users/buddies.');
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();
  }, []);

  const handleApprove = async (record: VerificationRecord) => {
    try {
      setError(null);
      await userService.patchById(record.id, { verificationStatus: 'verified' });

      // Nếu là Buddy thì cập nhật luôn hồ sơ trong 'buddies'
      if (record.type === 'Buddy') {
        await buddyService.updateProfile(record.id, { verificationStatus: 'verified' });
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.id === record.id
            ? {
                ...v,
                status: 'Verified',
              }
            : v
        )
      );
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to approve user.');
    }
  };

  const handleReject = async (record: VerificationRecord) => {
    if (!rejectReason) return;
    try {
      setError(null);
      await userService.patchById(record.id, {
        verificationStatus: 'rejected',
        verificationRejectReason: rejectReason,
      });

      if (record.type === 'Buddy') {
        await buddyService.updateProfile(record.id, {
          verificationStatus: 'rejected',
          verificationRejectReason: rejectReason,
        } as any);
      }

      setVerifications((prev) =>
        prev.map((v) =>
          v.id === record.id
            ? {
                ...v,
                status: 'Rejected',
              }
            : v
        )
      );
      setSelectedUser(null);
      setShowRejectForm(false);
      setRejectReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject user.');
    }
  };

  const filteredData = verifications.filter(item => 
    filter === 'All' ? true : item.status === filter
  );

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
            <p className="text-lg font-bold text-admin-muted">Verify credentials for a safe and trusted community.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-64 admin-input pl-12"
              />
            </div>
            <div className="relative group">
              <button className="flex items-center gap-3 h-12 px-6 text-sm font-black bg-admin-surface border border-admin rounded-2xl transition-all shadow-sm hover:border-indigo-500/50">
                <Filter size={18} className="text-indigo-500" />
                {filter}
                <ChevronDown size={16} className="text-admin-muted group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute right-0 mt-3 w-48 admin-glass rounded-2xl shadow-2xl overflow-hidden border border-admin invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-50">
                {['All', 'Pending', 'Verified', 'Rejected'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className="w-full text-left px-6 py-4 text-xs font-black hover:bg-indigo-600 hover:text-white transition-all border-b border-admin last:border-none text-admin-main"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error / Loading */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-3">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="p-4 rounded-2xl bg-admin-surface border border-admin text-admin-muted text-sm font-medium">
            Loading accounts that need verification...
          </div>
        )}

        {/* Verification Table */}
        <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-admin bg-admin-surface/50">
                  <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">User Details</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em] md:table-cell hidden">Registration</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Document</th>
                  <th className="px-8 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin">
                {filteredData.map((record) => (
                  <tr key={record.id} className="group hover:bg-admin-surface/50 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={record.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-lg group-hover:scale-110 transition-transform" alt="" />
                        <div className="space-y-1">
                          <p className="text-sm font-black text-admin-main flex items-center gap-2">
                            {record.name}
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-600/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.18em]">
                              {record.type}
                            </span>
                          </p>
                          <p className="text-[10px] font-black text-admin-muted uppercase tracking-tight">{record.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 md:table-cell hidden">
                      <div className="flex items-center gap-2 text-admin-muted text-xs font-black">
                        <Calendar size={16} className="text-indigo-500" />
                        {record.regDate}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-admin-surface text-admin-muted text-[10px] font-black uppercase tracking-widest border border-admin">
                        <FileText size={14} className="text-indigo-500" />
                        {record.docType}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                        record.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                        record.status === 'Verified' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          record.status === 'Pending' ? 'bg-amber-500 animate-pulse' :
                          record.status === 'Verified' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}></span>
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
      </div>

      {/* Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-fade-in">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setSelectedUser(null)}></div>
          
          <div className="bg-admin-sidebar border border-admin w-full max-w-7xl rounded-[48px] shadow-2xl overflow-hidden relative z-10 flex flex-col xl:flex-row h-[90vh]">
            <button 
              className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-admin-surface flex items-center justify-center text-admin-muted hover:text-rose-500 border border-admin shadow-sm transition-all z-20" 
              onClick={() => setSelectedUser(null)}
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">{selectedUser.docType} - Front</p>
                  <div className="aspect-[1.58/1] bg-admin-surface rounded-[32px] overflow-hidden border border-admin group">
                    <img src={selectedUser.docs.front} className="w-full h-full object-cover grayscale-0 group-hover:scale-105 transition-transform duration-700" alt="" />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">{selectedUser.docType} - Back</p>
                  <div className="aspect-[1.58/1] bg-admin-surface rounded-[32px] overflow-hidden border border-admin group">
                    <img src={selectedUser.docs.back} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4 pt-10 border-t border-admin">
                  <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Security Check: Selfie Comparison</p>
                  <div className="aspect-[2/1] relative rounded-[32px] overflow-hidden border border-admin">
                     <div className="absolute inset-0 flex">
                        <div className="flex-1 bg-admin-surface border-r border-admin overflow-hidden">
                           <img src={selectedUser.avatar} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 bg-admin-surface overflow-hidden">
                           <img src={selectedUser.docs.selfie} className="w-full h-full object-cover" alt="" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: User Details & Decisions */}
            <div className="w-full xl:w-[480px] p-12 space-y-10 overflow-y-auto bg-admin-sidebar custom-scrollbar">
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-admin-main">Identity Metadata</h3>
                <div className="flex items-center gap-6 p-6 bg-admin-surface rounded-[32px] border border-admin shadow-inner">
                  <img src={selectedUser.avatar} className="w-20 h-20 rounded-3xl object-cover shadow-2xl" alt="" />
                  <div>
                    <h4 className="text-xl font-black text-admin-main">{selectedUser.name}</h4>
                    <span className="inline-block px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black tracking-widest mt-2">{selectedUser.type}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {[
                    { icon: User, label: "Official Name", value: selectedUser.name },
                    { icon: FileText, label: "Registry Type", value: selectedUser.docType },
                    { icon: Calendar, label: "Joined Platform", value: selectedUser.regDate },
                  ].map((info, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-admin-surface border border-admin flex items-center justify-center text-admin-muted">
                        <info.icon size={20} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-[10px] font-black text-admin-muted uppercase tracking-[0.2em] mb-1">{info.label}</p>
                        <p className="text-sm font-black text-admin-main">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-10 border-t border-admin space-y-4">
                {!showRejectForm ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedUser)}
                      className="w-full h-20 bg-emerald-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                    >
                      Approve Match
                    </button>
                    <button 
                      onClick={() => setShowRejectForm(true)}
                      className="w-full h-16 admin-btn-muted border border-admin font-black uppercase tracking-widest"
                    >
                      Decline Entry
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
                        onClick={() => setShowRejectForm(false)}
                        className="flex-1 h-16 admin-btn-muted border border-admin"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(selectedUser)}
                        disabled={!rejectReason}
                        className="flex-[2] h-16 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 disabled:opacity-50"
                      >
                        Finalize
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVerification;
