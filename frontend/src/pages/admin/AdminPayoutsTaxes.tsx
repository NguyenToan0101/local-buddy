import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  FileDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Landmark,
  Receipt,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { buddyService, earningService } from '../../services/api';

type Buddy = {
  id: string;
  name: string;
  image?: string;
  phone?: string;
};

type Earnings = {
  transactions: Array<{
    id: string;
    buddyId: string;
    type: 'income' | 'payout';
    amount: number;
    date?: string;
    target?: string;
  }>;
};

type PayoutRequestStatus = 'PENDING' | 'PAID';

type PayoutRequest = {
  id: string;
  buddyId: string;
  amount: number; // gross requested
  taxRate: number; // e.g. 0.1
  status: PayoutRequestStatus;
  requestedAt: string; // ISO string
  paidAt?: string; // ISO string
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
};

const MOCK_KEY = 'mock_payout_requests_v1';

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

function seedMockPayoutRequests(buddies: Buddy[]): PayoutRequest[] {
  const b1 = buddies[0];
  const b2 = buddies[1] || buddies[0];
  const now = Date.now();
  return [
    {
      id: 'pr_demo_001',
      buddyId: String(b1?.id || '1'),
      amount: 420,
      taxRate: 0.1,
      status: 'PENDING',
      requestedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      bankName: 'VCB',
      bankAccountNumber: '0123456789',
      bankAccountName: (b1?.name || 'Demo Buddy').toUpperCase(),
    },
    {
      id: 'pr_demo_002',
      buddyId: String(b2?.id || '2'),
      amount: 300,
      taxRate: 0.05,
      status: 'PAID',
      requestedAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
      paidAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
      bankName: 'ACB',
      bankAccountNumber: '9988776655',
      bankAccountName: (b2?.name || 'Demo Buddy 2').toUpperCase(),
    },
  ];
}

function loadMockPayoutRequests(): PayoutRequest[] {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMockPayoutRequests(next: PayoutRequest[]) {
  try {
    localStorage.setItem(MOCK_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

const AdminPayoutsTaxes: React.FC = () => {
  const [tab, setTab] = useState<'wallet' | 'payouts' | 'tax'>('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);

      const [b, e] = await Promise.all([
        buddyService.getAll(),
        earningService.getStats(),
      ]);

      // payoutRequests are demo-only and stored in localStorage
      let p = loadMockPayoutRequests();
      if (!Array.isArray(p) || p.length === 0) {
        const seeded = seedMockPayoutRequests(b as any);
        saveMockPayoutRequests(seeded);
        p = seeded;
      }

      setBuddies(b as any);
      setEarnings(e as any);
      setPayoutRequests(p);
    } catch (err: any) {
      setError(err?.message || 'Failed to load payouts data.');
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
      const k = String(t.buddyId);
      sumByBuddy.set(k, (sumByBuddy.get(k) || 0) + Number(t.amount || 0));
    }
    return buddies
      .map((b) => ({
        buddy: b,
        balance: sumByBuddy.get(String(b.id)) || 0,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [buddies, earnings]);

  const pendingPayouts = useMemo(
    () => payoutRequests.filter((p) => p.status === 'PENDING'),
    [payoutRequests]
  );
  const paidPayouts = useMemo(
    () => payoutRequests.filter((p) => p.status === 'PAID'),
    [payoutRequests]
  );

  const taxSummary = useMemo(() => {
    const paid = paidPayouts;
    const totalGross = paid.reduce((acc, p) => acc + p.amount, 0);
    const totalTax = paid.reduce((acc, p) => acc + p.amount * (p.taxRate ?? 0), 0);
    const totalNet = totalGross - totalTax;
    return { totalGross, totalTax, totalNet };
  }, [paidPayouts]);

  const exportBankFile = () => {
    // Simple CSV format; can be adapted to bank-specific formats later.
    const rows = [
      ['buddyId', 'amountNet', 'bankName', 'bankAccountNumber', 'bankAccountName', 'requestId'].join(','),
      ...pendingPayouts.map((p) => {
        const tax = p.amount * (p.taxRate ?? 0);
        const net = p.amount - tax;
        return [
          p.buddyId,
          net.toFixed(2),
          JSON.stringify(p.bankName),
          JSON.stringify(p.bankAccountNumber),
          JSON.stringify(p.bankAccountName),
          p.id,
        ].join(',');
      }),
    ].join('\n');

    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`bank-batch-${stamp}.csv`, rows, 'text/csv');
  };

  const confirmPaid = async (p: PayoutRequest) => {
    try {
      setLoading(true);
      setError(null);

      const paidAt = new Date().toISOString();

      // 1) Mark payout request as PAID
      const next = payoutRequests.map((x) =>
        x.id === p.id ? { ...x, status: 'PAID' as const, paidAt } : x
      );
      setPayoutRequests(next);
      saveMockPayoutRequests(next);

      // 2) Append a payout transaction into earnings so wallet balances reflect it
      const tax = p.amount * (p.taxRate ?? 0);
      const net = p.amount - tax;
      await earningService.appendTransaction({
        id: String(Date.now()),
        buddyId: String(p.buddyId),
        type: 'payout',
        amount: -Math.abs(net),
        target: 'Bank Transfer',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      });

      setEarnings(await earningService.getStats() as any);
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm paid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-admin-main flex items-center gap-3">
              <Wallet className="text-indigo-600" size={34} />
              Payouts & Taxes
            </h1>
            <p className="text-lg font-bold text-admin-muted">
              End-of-month money operations: balances, batch payouts, and tax withholding.
            </p>
          </div>

          <div className="flex gap-2 p-1 bg-admin-surface rounded-2xl border border-admin">
            {[
              { id: 'wallet', label: 'Wallet Balances' },
              { id: 'payouts', label: 'Payout Requests' },
              { id: 'tax', label: 'Tax Reports' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
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
                <p className="text-sm font-bold text-admin-muted">Computed from `earnings.transactions`.</p>
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
                          <img
                            src={buddy.image || `https://i.pravatar.cc/150?u=buddy-${buddy.id}`}
                            className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-black text-admin-main">{buddy.name}</p>
                            <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">ID: {buddy.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <span
                          className={`text-sm font-black ${
                            balance >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
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
                    <Landmark className="text-indigo-500" size={24} /> Payout Requests
                  </h3>
                  <p className="text-sm font-bold text-admin-muted">
                    Export a batch transfer file, then confirm once paid.
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
                  No payout requests found. Add a `payoutRequests` collection in `db.json` to start using this tab.
                </div>
              )}
            </div>

            {pendingPayouts.length > 0 && (
              <div className="admin-card !p-0 overflow-hidden border-none shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-admin bg-admin-surface/50">
                        <th className="px-10 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Buddy
                        </th>
                        <th className="px-10 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Bank
                        </th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Gross
                        </th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Tax
                        </th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Net
                        </th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin">
                      {pendingPayouts.map((p) => {
                        const b = buddies.find((x) => String(x.id) === String(p.buddyId));
                        const tax = p.amount * (p.taxRate ?? 0);
                        const net = p.amount - tax;
                        return (
                          <tr key={p.id} className="hover:bg-admin-surface/50 transition-all">
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <img
                                  src={b?.image || `https://i.pravatar.cc/150?u=buddy-${p.buddyId}`}
                                  className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                                  alt=""
                                />
                                <div>
                                  <p className="text-sm font-black text-admin-main">{b?.name || `Buddy ${p.buddyId}`}</p>
                                  <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">
                                    Requested • {new Date(p.requestedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-sm font-black text-admin-main">{p.bankName}</p>
                              <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">
                                {p.bankAccountNumber} • {p.bankAccountName}
                              </p>
                            </td>
                            <td className="px-10 py-6 text-right text-sm font-black text-admin-main">{formatMoney(p.amount)}</td>
                            <td className="px-10 py-6 text-right text-sm font-black text-amber-500">
                              {formatMoney(tax)}
                            </td>
                            <td className="px-10 py-6 text-right text-sm font-black text-emerald-500">
                              {formatMoney(net)}
                            </td>
                            <td className="px-10 py-6 text-right">
                              <button
                                onClick={() => confirmPaid(p)}
                                className="h-11 px-5 rounded-2xl bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.18em] shadow-xl shadow-emerald-600/20 hover:scale-[1.02] transition-all"
                              >
                                <span className="inline-flex items-center gap-2">
                                  <CheckCircle2 size={18} /> Confirm Paid
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'tax' && (
          <div className="space-y-8">
            <div className="admin-card">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-admin-main tracking-tight flex items-center gap-3">
                    <Receipt className="text-indigo-500" size={24} /> Tax Reports
                  </h3>
                  <p className="text-sm font-bold text-admin-muted">
                    Totals from PAID payouts (withholding at source).
                  </p>
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

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Gross Paid', value: formatMoney(taxSummary.totalGross), tone: 'text-admin-main' },
                  { label: 'Tax Withheld', value: formatMoney(taxSummary.totalTax), tone: 'text-amber-500' },
                  { label: 'Net Paid Out', value: formatMoney(taxSummary.totalNet), tone: 'text-emerald-500' },
                ].map((m) => (
                  <div key={m.label} className="p-8 rounded-[32px] bg-admin-surface border border-admin">
                    <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">{m.label}</p>
                    <p className={`text-3xl font-black mt-3 ${m.tone}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 admin-card !p-0 overflow-hidden border-none shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-admin bg-admin-surface/50">
                        <th className="px-10 py-5 text-left text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Buddy
                        </th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Gross
                        </th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Tax
                        </th>
                        <th className="px-10 py-5 text-right text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">
                          Paid At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin">
                      {paidPayouts.map((p) => {
                        const b = buddies.find((x) => String(x.id) === String(p.buddyId));
                        const tax = p.amount * (p.taxRate ?? 0);
                        return (
                          <tr key={p.id} className="hover:bg-admin-surface/50 transition-all">
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <img
                                  src={b?.image || `https://i.pravatar.cc/150?u=buddy-${p.buddyId}`}
                                  className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                                  alt=""
                                />
                                <div>
                                  <p className="text-sm font-black text-admin-main">{b?.name || `Buddy ${p.buddyId}`}</p>
                                  <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">ID: {p.buddyId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right text-sm font-black text-admin-main">{formatMoney(p.amount)}</td>
                            <td className="px-10 py-6 text-right text-sm font-black text-amber-500">{formatMoney(tax)}</td>
                            <td className="px-10 py-6 text-right text-sm font-black text-admin-muted">
                              {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {paidPayouts.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-10 py-16 text-center text-admin-muted font-bold">
                            No paid payouts yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayoutsTaxes;

