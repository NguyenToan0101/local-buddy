import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  FileDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  X,
  XCircle,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminService, buddyService, payoutRequestService } from '../../services/api';

type Buddy = {
  id: string;
  name: string;
  image?: string;
  phone?: string;
};

type Transaction = {
  id: string;
  buddyId: string;
  type: string;
  amount: number;
};

type Earnings = {
  transactions: Transaction[];
};

type PayoutRequest = {
  id: string;
  buddyId: string;
  buddyName?: string;
  buddyImage?: string;
  amount: number;
  taxRate?: number;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  requestedAt?: string;
  processedAt?: string;
};

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const AdminAvatar = ({ src, name, className }: { src?: string; name?: string; className: string }) =>
  src ? (
    <img src={src} className={`${className} object-cover shadow-lg`} alt={name || 'Buddy'} />
  ) : (
    <div className={`${className} flex items-center justify-center bg-indigo-600/10 text-xs font-black uppercase text-indigo-600 shadow-lg`}>
      {(name || 'BD').slice(0, 2)}
    </div>
  );

const AdminPayoutsTaxes: React.FC = () => {
  const [tab, setTab] = useState<'wallet' | 'payouts' | 'tax'>('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const [b, e, pr] = await Promise.all([
        buddyService.getAll(),
        adminService.getAllEarningsTransactions(),
        payoutRequestService.getAll(),
      ]);

      setBuddies(b as Buddy[]);
      setEarnings(e as Earnings);
      setPayoutRequests(pr as PayoutRequest[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load payouts data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const walletBalances = useMemo(() => {
    const tx = earnings?.transactions || [];
    const sumByBuddy = new Map<string, number>();
    for (const t of tx) {
      const key = String(t.buddyId);
      sumByBuddy.set(key, (sumByBuddy.get(key) || 0) + Number(t.amount || 0));
    }
    return buddies
      .map((buddy) => ({
        buddy,
        balance: sumByBuddy.get(String(buddy.id)) || 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [buddies, earnings]);

  const pendingPayouts = useMemo(
    () => payoutRequests.filter((r) => r.status === 'PENDING'),
    [payoutRequests]
  );

  const approvedPayouts = useMemo(
    () => payoutRequests.filter((r) => r.status === 'PAID'),
    [payoutRequests]
  );

  const taxSummary = useMemo(() => {
    const totalGross = approvedPayouts.reduce((acc, p) => acc + Math.abs(p.amount || 0), 0);
    const taxRate = 0.1;
    const totalTax = totalGross * taxRate;
    const totalNet = totalGross - totalTax;
    return { totalGross, totalTax, totalNet };
  }, [approvedPayouts]);

  const handleApproveWithdrawal = async (request: PayoutRequest) => {
    try {
      setActionLoading(request.id);
      setError(null);
      await payoutRequestService.approve(request.id);
      await refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve withdrawal.';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectWithdrawal = async (request: PayoutRequest) => {
    try {
      setActionLoading(request.id);
      setError(null);
      await payoutRequestService.reject(request.id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject withdrawal.';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const exportBankFile = () => {
    const rows = [
      ['buddyId', 'buddyName', 'amount', 'bankName', 'bankAccountNumber', 'bankAccountName', 'requestId'].join(','),
      ...pendingPayouts.map((w) => {
        const buddy = buddies.find((b) => String(b.id) === String(w.buddyId));
        return [
          w.buddyId,
          JSON.stringify(w.buddyName || buddy?.name || 'Unknown'),
          Number(w.amount).toFixed(2),
          JSON.stringify(w.bankName),
          JSON.stringify(w.bankAccountNumber),
          JSON.stringify(w.bankAccountName),
          w.id,
        ].join(',');
      }),
    ].join('\n');

    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`withdrawal-batch-${stamp}.csv`, rows, 'text/csv');
  };

  return (
    <AdminLayout>
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-admin-main flex items-center gap-3">
              <Wallet className="text-indigo-600" size={34} />
              Payouts &amp; Withdrawals
            </h1>
            <p className="text-lg font-bold text-admin-muted">
              Manage buddy withdrawal requests, payouts, and earnings.
            </p>
          </div>

          <div className="flex gap-2 p-1 bg-admin-surface rounded-2xl border border-admin">
            {[
              { id: 'wallet', label: 'Wallet Balances' },
              { id: 'payouts', label: 'Withdrawal Requests' },
              { id: 'tax', label: 'Payout History' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as 'wallet' | 'payouts' | 'tax')}
                className={`h-11 px-5 rounded-xl text-[11px] font-black uppercase tracking-[0.18em] transition-all ${
                  tab === t.id ? 'bg-indigo-600 text-white shadow-primary-glow' : 'text-admin-muted hover:text-indigo-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-3">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {loading && (
          <div className="p-4 rounded-2xl bg-admin-surface border border-admin text-admin-muted text-sm font-medium">
            Loading payout operations...
          </div>
        )}

        {tab === 'wallet' && (
          <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
            <div className="px-10 py-8 border-b border-admin flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-admin-main tracking-tight">Wallet Balances</h3>
                <p className="text-sm font-bold text-admin-muted">Current balance after income and approved payouts.</p>
              </div>
              <button onClick={refresh} className="admin-btn-muted border border-admin !h-12 !px-6">
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-admin bg-admin-surface/50">
                    <th className="px-10 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      Buddy
                    </th>
                    <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                      Current Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin">
                  {walletBalances.map(({ buddy, balance }) => (
                    <tr key={buddy.id} className="hover:bg-admin-surface/50 transition-all">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <AdminAvatar src={buddy.image} name={buddy.name} className="w-12 h-12 rounded-2xl" />
                          <div>
                            <p className="text-sm font-black text-admin-main">{buddy.name}</p>
                            <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">ID: {buddy.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span className={`text-sm font-black ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatMoney(balance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {walletBalances.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-10 py-16 text-center text-admin-muted font-bold">
                        No buddies found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="space-y-8">
            <div className="admin-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-admin-main tracking-tight flex items-center gap-3">
                    <Clock className="text-amber-500" size={24} /> Pending Withdrawal Requests
                  </h3>
                  <p className="text-sm font-bold text-admin-muted">
                    Buddy withdrawal requests awaiting approval. {pendingPayouts.length} pending.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={exportBankFile}
                    disabled={pendingPayouts.length === 0}
                    className="h-12 px-6 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-primary-glow disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileDown size={18} /> Export Bank File
                    </span>
                  </button>
                  <button onClick={refresh} className="admin-btn-muted border border-admin !h-12 !px-6">
                    Refresh
                  </button>
                </div>
              </div>

              {pendingPayouts.length === 0 && (
                <div className="mt-8 p-6 rounded-3xl bg-admin-surface border border-admin text-admin-muted font-bold">
                  No pending withdrawal requests at this time.
                </div>
              )}
            </div>

            {pendingPayouts.length > 0 && (
              <div className="space-y-4">
                {pendingPayouts.map((w) => {
                  const buddy = buddies.find((b) => String(b.id) === String(w.buddyId));
                  const isRejecting = rejectingId === w.id;
                  const isActing = actionLoading === w.id;

                  if (isRejecting) {
                    return (
                      <div key={w.id} className="admin-card space-y-4">
                        <div className="flex items-start justify-between">
                          <h4 className="text-lg font-black text-admin-main">Reject Withdrawal Request</h4>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="text-admin-muted hover:text-admin-main transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="bg-admin-surface p-4 rounded-2xl">
                          <p className="text-sm font-bold text-admin-main mb-3">Reason for rejection:</p>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full bg-white border border-admin rounded-xl p-3 text-sm font-bold text-admin-main outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleRejectWithdrawal(w)}
                            disabled={isActing}
                            className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-xl shadow-rose-600/20 hover:scale-[1.02] transition-all border-none cursor-pointer disabled:opacity-60"
                          >
                            {isActing ? 'Rejecting...' : 'Confirm Rejection'}
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="flex-1 h-12 rounded-2xl bg-admin-surface border border-admin text-admin-main font-black text-[11px] uppercase tracking-[0.18em] hover:bg-white transition-all border-solid cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={w.id} className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
                      <div className="p-8 border-b border-admin flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <AdminAvatar src={w.buddyImage || buddy?.image} name={w.buddyName || buddy?.name} className="w-16 h-16 rounded-2xl" />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-black text-admin-main">
                                {w.buddyName || buddy?.name || `Buddy ${w.buddyId}`}
                              </h3>
                              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-wider rounded-lg">
                                PENDING
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-admin-muted uppercase tracking-widest">
                              Requested: {w.requestedAt ? new Date(w.requestedAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-8 border-b border-admin bg-admin-surface/30">
                        <div>
                          <p className="text-[9px] font-black text-admin-muted uppercase tracking-widest mb-2">Amount</p>
                          <p className="text-2xl font-black text-admin-main">${Number(w.amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-admin-muted uppercase tracking-widest mb-2">Bank Name</p>
                          <p className="text-sm font-black text-admin-main">{w.bankName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-admin-muted uppercase tracking-widest mb-2">Account Number</p>
                          <p className="text-sm font-bold text-admin-main font-mono">{w.bankAccountNumber}</p>
                        </div>
                      </div>

                      <div className="p-8 flex gap-3">
                        <button
                          onClick={() => handleApproveWithdrawal(w)}
                          disabled={isActing}
                          className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-xl shadow-emerald-600/20 hover:scale-[1.02] transition-all border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <CheckCircle2 size={18} />
                          {isActing ? 'Processing...' : 'Approve & Process'}
                        </button>
                        <button
                          onClick={() => setRejectingId(w.id)}
                          disabled={isActing}
                          className="flex-1 h-12 rounded-2xl bg-rose-600/10 border border-rose-200 text-rose-600 font-black text-[11px] uppercase tracking-[0.18em] hover:bg-rose-600/20 transition-all border-solid cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'tax' && (
          <div className="space-y-8">
            <div className="admin-card">
              <div className="flex items-center justify-between gap-6 mb-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-admin-main tracking-tight flex items-center gap-3">
                    <Receipt className="text-indigo-500" size={24} /> Payout History
                  </h3>
                  <p className="text-sm font-bold text-admin-muted">All approved and processed payouts.</p>
                </div>
                <button
                  onClick={() => {
                    const rows = [
                      ['totalGross', 'totalTax', 'totalNet'].join(','),
                      [taxSummary.totalGross, taxSummary.totalTax, taxSummary.totalNet].join(','),
                    ].join('\n');
                    const stamp = new Date().toISOString().slice(0, 10);
                    downloadTextFile(`tax-summary-${stamp}.csv`, rows, 'text/csv');
                  }}
                  className="admin-btn-muted border border-admin !h-12 !px-6"
                >
                  Export Summary CSV
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                  { label: 'Total Gross', value: formatMoney(taxSummary.totalGross), tone: 'text-admin-main' },
                  { label: 'Tax Withheld (10%)', value: formatMoney(taxSummary.totalTax), tone: 'text-amber-500' },
                  { label: 'Net Paid Out', value: formatMoney(taxSummary.totalNet), tone: 'text-emerald-500' },
                ].map((m) => (
                  <div key={m.label} className="p-8 rounded-[32px] bg-admin-surface border border-admin">
                    <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">{m.label}</p>
                    <p className={`text-3xl font-black mt-3 ${m.tone}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {approvedPayouts.length > 0 && (
              <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
                <div className="px-10 py-8 border-b border-admin">
                  <h4 className="text-lg font-black text-admin-main tracking-tight">Processed Payouts</h4>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-admin bg-admin-surface/50">
                        <th className="px-10 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Buddy</th>
                        <th className="px-10 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Bank</th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Amount</th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Tax (10%)</th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Net</th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">Paid Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin">
                      {approvedPayouts.map((p) => {
                        const buddy = buddies.find((b) => String(b.id) === String(p.buddyId));
                        const gross = Math.abs(p.amount || 0);
                        const tax = gross * 0.1;
                        const net = gross - tax;
                        return (
                          <tr key={p.id} className="hover:bg-admin-surface/50 transition-all">
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <AdminAvatar src={p.buddyImage || buddy?.image} name={p.buddyName || buddy?.name} className="w-12 h-12 rounded-2xl" />
                                <div>
                                  <p className="text-sm font-black text-admin-main">
                                    {p.buddyName || buddy?.name || `Buddy ${p.buddyId}`}
                                  </p>
                                  <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">ID: {p.buddyId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-sm font-black text-admin-main">{p.bankName || 'N/A'}</p>
                            </td>
                            <td className="px-10 py-6 text-right text-sm font-black text-admin-main">{formatMoney(gross)}</td>
                            <td className="px-10 py-6 text-right text-sm font-black text-amber-500">{formatMoney(tax)}</td>
                            <td className="px-10 py-6 text-right text-sm font-black text-emerald-500">{formatMoney(net)}</td>
                            <td className="px-10 py-6 text-right text-sm font-black text-admin-muted">
                              {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {approvedPayouts.length === 0 && (
              <div className="admin-card">
                <p className="text-center text-admin-muted font-bold py-8">No processed payouts yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayoutsTaxes;
