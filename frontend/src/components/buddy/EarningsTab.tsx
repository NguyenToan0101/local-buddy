import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, DollarSign, 
  Calendar, CheckCircle, Search, Filter, X, ArrowRight, Clock,
  ChevronRight, Award, CreditCard, Sparkles, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { payoutRequestService, transactionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EarningsTab: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'withdrawal'>('all');
  
  // Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const walletSuffix = user?.id ? user.id.slice(-4).toUpperCase() : '----';

  // Load Transactions
  const fetchTransactions = async () => {
    try {
      const data = await transactionService.getByBuddyId(user?.id || "1");
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

  // Calculations
  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const lifetimeEarnings = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => {
        if (t.type !== 'income') return false;
        const date = new Date(t.createdAt || t.date);
        return !Number.isNaN(date.getTime()) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  // Chart Data
  const chartData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        name: formatter.format(date),
        amount: 0,
      };
    });

    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        const date = new Date(t.createdAt || t.date);
        if (Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const bucket = months.find(month => month.key === key);
        if (bucket) bucket.amount += Number(t.amount || 0);
      });

    return months;
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (activeFilter === 'income') return t.type === 'income';
        if (activeFilter === 'withdrawal') return t.type === 'payout';
        return true;
      })
      .filter(t => {
        if (!searchQuery) return true;
        const targetStr = (t.client || t.target || t.activity || '').toLowerCase();
        return targetStr.includes(searchQuery.toLowerCase());
      });
  }, [transactions, activeFilter, searchQuery]);

  // Handle Payout
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > totalBalance) return;

    setIsProcessing(true);
    setSubmitError(null);
    try {
      await payoutRequestService.create({
        amount,
        bankName: withdrawBankName,
        bankAccountNumber: withdrawAccount,
        bankAccountName: user?.name,
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Failed to submit withdrawal request:', err);
      setSubmitError(err?.message || 'Failed to submit withdrawal request');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWithdrawForm = () => {
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawAccount('');
    setWithdrawBankName('');
    setIsSuccess(false);
    setSubmitError(null);
    if (isSuccess) {
      fetchTransactions();
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Header with Stats Summary Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-black text-secondary tracking-tight">Earnings & Escrow Wallet</h3>
          <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mt-1">
            Track revenue statistics, checkouts, and withdraw funds securely
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-primary-glow flex items-center gap-1.5 border-none cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <ArrowDownLeft size={13} strokeWidth={3} /> Withdraw Funds
          </button>
        </div>
      </div>

      {/* 2. Top Grid Layout: Wallet Card & Income Chart side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Glassmorphic Debit Wallet Card & Mini Stats */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          
          {/* Neon Gradient Card */}
          <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-secondary text-white rounded-[32px] p-6 border border-white/5 relative overflow-hidden shadow-premium flex-1 flex flex-col justify-between min-h-[220px] group">
            {/* Animated Glow Grid Overlays */}
            <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-[-30px] left-[-30px] w-24 h-24 bg-emerald-500/10 rounded-full blur-[30px] pointer-events-none"></div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <div className="flex items-center gap-2 text-white/50 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-[8px] font-black uppercase tracking-widest">Escrow Balance</p>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter italic">
                  ${totalBalance.toFixed(2)}
                </h1>
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
                <CreditCard size={18} className="text-primary" />
              </div>
            </div>

            <div className="space-y-4 pt-8 relative z-10">
              {/* Card specs */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none">Wallet ID</p>
                  <p className="text-[10px] font-bold text-white/70 tracking-widest mt-1">BUDDY-ESCROW-••••{walletSuffix}</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none">Holder</p>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">{user?.name || 'Account'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats Metrics Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm space-y-1.5 hover:shadow-premium transition-all">
              <p className="text-[8px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-1">
                <TrendingUp size={10} className="text-emerald-500" /> Lifetime Income
              </p>
              <p className="text-lg font-black text-secondary italic tracking-tight">
                ${lifetimeEarnings.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-sm space-y-1.5 hover:shadow-premium transition-all">
              <p className="text-[8px] font-black text-secondary/40 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} className="text-primary" /> This Month
              </p>
              <p className="text-lg font-black text-secondary italic tracking-tight text-primary">
                ${monthlyEarnings.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Earnings Area Chart */}
        <div className="lg:col-span-7 bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center pb-4 border-b border-gray-50">
            <div>
              <h4 className="text-xs font-black text-secondary uppercase tracking-wider">Revenue Stream Analytics</h4>
              <p className="text-[8px] font-bold text-secondary/35 uppercase tracking-widest mt-0.5">Timeline overview of earnings over time</p>
            </div>
            
            <span className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-wider rounded-xl border border-emerald-500/25 flex items-center gap-1">
              ● Active Month
            </span>
          </div>

          {/* Recharts Wrapper */}
          <div className="h-44 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A45" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#FF7A45" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A39994', fontSize: 9, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#A39994', fontSize: 9, fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#2D1E17', 
                    border: 'none', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    fontSize: '10px', 
                    fontWeight: 900,
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }} 
                  labelClassName="hidden"
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#FF7A45" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorEarnings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. Transaction Logs - Filterable & Searchable Table */}
      <div className="space-y-6 pt-8 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div>
            <h4 className="text-sm font-black text-secondary uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={16} className="text-primary animate-pulse" /> Transaction Ledger
            </h4>
            <p className="text-[9px] font-bold text-secondary/40 uppercase tracking-wider mt-1">Detailed history of all financial activities</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter buttons */}
            <div className="flex bg-slate-100/80 rounded-2xl p-1 shrink-0 backdrop-blur-md border border-white/50 shadow-inner">
              {(['all', 'income', 'withdrawal'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border-none cursor-pointer ${
                    activeFilter === filter
                    ? 'bg-white text-primary shadow-sm scale-100'
                    : 'bg-transparent text-secondary/40 hover:text-secondary hover:bg-white/50 scale-95 hover:scale-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative shrink-0 w-full sm:w-64 group">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40 group-focus-within:text-primary transition-colors duration-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, description..."
                className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-bold text-secondary placeholder:text-secondary/30 outline-none focus:bg-white focus:border-primary/30 focus:shadow-[0_0_15px_rgba(255,122,69,0.1)] transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Ledger Rows */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          
          <div className="divide-y divide-slate-50/80">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t, index) => (
                <div 
                  key={t.id} 
                  className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-all duration-300 group relative overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                  <div className="flex items-center gap-4 min-w-0 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                      t.type === 'income' 
                      ? 'bg-gradient-to-br from-emerald-400/10 to-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 border border-slate-200'
                    }`}>
                      {t.type === 'income' ? <ArrowUpRight size={20} strokeWidth={2.5} /> : <ArrowDownLeft size={20} strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-[11px] font-black text-secondary uppercase tracking-widest truncate group-hover:text-primary transition-colors duration-300">
                        {t.client || t.target || (t.type === 'income' ? 'System / Bonus' : 'Payout Account')}
                      </h5>
                      <p className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest truncate mt-1">
                        {t.activity || t.description || 'Account settlement action'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0 relative z-10">
                    <p className={`text-base font-black italic tracking-tight group-hover:scale-105 transition-transform duration-300 origin-right ${
                      t.type === 'income' ? 'text-emerald-500' : 'text-slate-700'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <Clock size={10} className="text-secondary/20" />
                      <p className="text-[9px] font-bold text-secondary/30 uppercase tracking-widest">
                        {t.date || t.createdAt}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center space-y-5 bg-slate-50/30">
                <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-[20px] flex items-center justify-center mx-auto text-secondary/20 relative">
                  <Wallet size={24} />
                  <div className="absolute inset-0 bg-primary/5 rounded-[20px] animate-pulse"></div>
                </div>
                <div>
                  <p className="text-[11px] font-black text-secondary/40 uppercase tracking-widest">No matching transactions</p>
                  <p className="text-[9px] font-bold text-secondary/30 tracking-wider mt-1">Try adjusting your filters or search query</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Interactive Withdraw Funds Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-secondary/60 backdrop-blur-sm" onClick={resetWithdrawForm}></div>
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl overflow-hidden border border-gray-100">
            
            {/* Success Animation view */}
            {isSuccess ? (
              <div className="py-6 text-center space-y-5 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Clock size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-secondary uppercase tracking-wider">Withdrawal Request Submitted</h4>
                  <p className="text-[9px] text-secondary/40 font-bold uppercase tracking-widest">Your request is pending admin approval</p>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-gray-50 text-left space-y-2.5">
                  <div className="flex justify-between text-[9px] font-bold text-secondary/60 uppercase">
                    <span>Withdrawal Amount:</span>
                    <span className="font-black text-emerald-600">${parseFloat(withdrawAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-secondary/60 uppercase">
                    <span>Bank Name:</span>
                    <span className="font-black text-secondary">{withdrawBankName}</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-secondary/60 uppercase">
                    <span>Account Number:</span>
                    <span className="font-black text-secondary">{withdrawAccount}</span>
                  </div>
                </div>
                <button
                  onClick={resetWithdrawForm}
                  className="w-full bg-secondary hover:bg-secondary-light text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest border-none cursor-pointer hover:shadow-premium transition-all"
                >
                  Return to Wallet
                </button>
              </div>
            ) : (
              /* Input Form view */
              <form onSubmit={handleWithdrawal} className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div>
                    <h3 className="text-base font-black text-secondary tracking-tight uppercase">Withdraw Cash</h3>
                    <p className="text-[8px] font-bold text-secondary/40 uppercase tracking-widest">Transfer funds from escrow balance</p>
                  </div>
                  <button 
                    type="button"
                    onClick={resetWithdrawForm}
                    className="w-8 h-8 bg-surface hover:bg-gray-100 rounded-xl flex items-center justify-center text-secondary/35 hover:text-primary transition-colors border-none cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Bank Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-secondary/50 uppercase tracking-wider ml-1">Bank Name</label>
                    <input 
                      type="text"
                      required
                      value={withdrawBankName}
                      onChange={e => setWithdrawBankName(e.target.value)}
                      placeholder="e.g. Vietcombank, ACB, MB Bank"
                      className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white uppercase" 
                    />
                  </div>

                  {/* Input Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-secondary/50 uppercase tracking-wider ml-1">Bank Account Number</label>
                    <input 
                      type="text"
                      required
                      value={withdrawAccount}
                      onChange={e => setWithdrawAccount(e.target.value)}
                      placeholder="e.g. 1012398485"
                      className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                    />
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline px-1">
                      <label className="text-[8px] font-black text-secondary/50 uppercase tracking-wider">Amount to Withdraw</label>
                      <button 
                        type="button"
                        onClick={() => setWithdrawAmount(totalBalance.toString())}
                        className="text-[8px] font-black text-primary hover:text-primary-dark uppercase tracking-widest border-none bg-transparent cursor-pointer"
                      >
                        Max (${totalBalance.toFixed(2)})
                      </button>
                    </div>
                    
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40" />
                      <input 
                        type="number"
                        required
                        min="1"
                        max={totalBalance}
                        step="0.01"
                        value={withdrawAmount}
                        onChange={e => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-surface border border-gray-100 rounded-xl py-3 pl-9 pr-4 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                      />
                    </div>
                  </div>

                  {/* Balance Warning */}
                  {parseFloat(withdrawAmount) > totalBalance && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="text-[8px] font-black uppercase tracking-wider">Insufficient funds in Escrow Balance</span>
                    </div>
                  )}

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="text-[8px] font-black uppercase tracking-wider">{submitError}</span>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing || !withdrawAmount || !withdrawBankName || !withdrawAccount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > totalBalance}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-secondary/20 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-primary-glow flex items-center justify-center gap-2 border-none cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      Submit Withdrawal Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default EarningsTab;
