import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, DollarSign, 
  Calendar, CheckCircle, Search, Filter, X, ArrowRight, 
  ChevronRight, Award, Landmark, CreditCard, Sparkles, AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { transactionService } from '../../services/api';
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
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  const lifetimeEarnings = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions]);

  const monthlyEarnings = useMemo(() => {
    // Basic mock calculation or actual from this month
    return transactions
      .filter(t => t.type === 'income' && t.date.includes('Jun') || t.date.includes('2026'))
      .reduce((acc, t) => acc + t.amount, 0) || (lifetimeEarnings * 0.4);
  }, [transactions, lifetimeEarnings]);

  // Chart Data
  const chartData = useMemo(() => {
    return [
      { name: 'Jan', amount: 150 },
      { name: 'Feb', amount: 320 },
      { name: 'Mar', amount: 280 },
      { name: 'Apr', amount: 480 },
      { name: 'May', amount: 650 },
      { name: 'Jun', amount: lifetimeEarnings > 0 ? lifetimeEarnings : 890 },
    ];
  }, [lifetimeEarnings]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (activeFilter === 'income') return t.type === 'income';
        if (activeFilter === 'withdrawal') return t.type !== 'income';
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
    
    // Simulate Blockchain / Bank settlement processing
    setTimeout(async () => {
      try {
        const payload = {
          type: 'withdrawal',
          amount: amount,
          target: withdrawMethod === 'bank' ? 'Vietcombank' : withdrawMethod === 'momo' ? 'MoMo Wallet' : 'PayPal Payout',
          activity: `Withdrawal to ${withdrawAccount}`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
        
        // Save to DB
        await transactionService.createTransaction(user?.id || "1", payload);
        await fetchTransactions(); // Refresh data
        
        setIsProcessing(false);
        setIsSuccess(true);
      } catch (err) {
        console.error("Failed to post withdrawal transaction:", err);
        setIsProcessing(false);
      }
    }, 1500);
  };

  const resetWithdrawForm = () => {
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawAccount('');
    setWithdrawName('');
    setIsSuccess(false);
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
                  <p className="text-[10px] font-bold text-white/70 tracking-widest mt-1">BUDDY-ESCROW-••••4892</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none">Holder</p>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mt-1">{user?.name || 'Buddy Host'}</p>
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
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <h4 className="text-xs font-black text-secondary uppercase tracking-wider">Transaction Ledger</h4>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter buttons */}
            <div className="flex bg-[#F3F4F6] rounded-xl p-1 shrink-0">
              {(['all', 'income', 'withdrawal'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                    activeFilter === filter
                    ? 'bg-white text-secondary shadow-sm'
                    : 'text-secondary/40 hover:text-secondary/80'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative shrink-0 w-full sm:w-48">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/35" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className="w-full bg-[#F3F4F6]/60 border border-transparent rounded-xl py-2 pl-8 pr-3 text-[9px] font-black text-secondary placeholder:text-secondary/30 outline-none focus:bg-white focus:border-gray-200 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Ledger Rows */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100/80 divide-y divide-gray-50 overflow-hidden">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4.5 hover:bg-gray-50/20 transition-all group">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    t.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 text-secondary/40'
                  }`}>
                    {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-black text-secondary uppercase tracking-widest truncate">{t.client || t.target || 'Payout Account'}</h5>
                    <p className="text-[8.5px] font-bold text-secondary/40 uppercase tracking-wide truncate mt-0.5">{t.activity || 'Account settlement action'}</p>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black italic tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-secondary'}`}>
                    {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                  </p>
                  <p className="text-[8px] font-bold text-secondary/20 uppercase tracking-widest mt-1">{t.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center space-y-4 bg-gray-50/10">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-secondary/15">
                <Wallet size={22} />
              </div>
              <p className="text-[9px] font-black text-secondary/30 uppercase tracking-widest">No matching transactions</p>
            </div>
          )}
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
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-secondary uppercase tracking-wider">Settlement Initiated</h4>
                  <p className="text-[9px] text-secondary/40 font-bold uppercase tracking-widest">Funds are on the way to your account</p>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-gray-50 text-left space-y-2.5">
                  <div className="flex justify-between text-[9px] font-bold text-secondary/60 uppercase">
                    <span>Withdrawal Amount:</span>
                    <span className="font-black text-emerald-600">${parseFloat(withdrawAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-secondary/60 uppercase">
                    <span>Method:</span>
                    <span className="font-black text-secondary">{withdrawMethod === 'bank' ? 'Vietcombank' : withdrawMethod === 'momo' ? 'MoMo' : 'PayPal'}</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-secondary/60 uppercase">
                    <span>Target Account:</span>
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
                  {/* Select Payment Method */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-secondary/50 uppercase tracking-wider ml-1">Payout Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bank', label: 'Local Bank', icon: Landmark },
                        { id: 'momo', label: 'MoMo', icon: Wallet },
                        { id: 'paypal', label: 'PayPal', icon: CreditCard }
                      ].map((method) => {
                        const Icon = method.icon;
                        const selected = withdrawMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setWithdrawMethod(method.id)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border-solid bg-white ${
                              selected
                              ? 'border-primary bg-primary/[0.02] text-primary'
                              : 'border-gray-100 text-secondary/40 hover:border-gray-200'
                            }`}
                          >
                            <Icon size={14} />
                            <span className="text-[8px] font-black uppercase tracking-wider leading-none">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-secondary/50 uppercase tracking-wider ml-1">
                      {withdrawMethod === 'bank' ? 'Account Number' : withdrawMethod === 'momo' ? 'Phone Number' : 'PayPal Email'}
                    </label>
                    <input 
                      type="text"
                      required
                      value={withdrawAccount}
                      onChange={e => setWithdrawAccount(e.target.value)}
                      placeholder={withdrawMethod === 'bank' ? 'e.g. 1012398485' : withdrawMethod === 'momo' ? 'e.g. 0912345678' : 'e.g. payout@example.com'}
                      className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white" 
                    />
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-secondary/50 uppercase tracking-wider ml-1">Account Holder Name</label>
                    <input 
                      type="text"
                      required
                      value={withdrawName}
                      onChange={e => setWithdrawName(e.target.value)}
                      placeholder="e.g. TOAN NGUYEN"
                      className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10 transition-all focus:bg-white uppercase" 
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
                </div>

                <button 
                  type="submit"
                  disabled={isProcessing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > totalBalance}
                  className="w-full bg-primary hover:bg-primary-dark disabled:bg-secondary/20 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-primary-glow flex items-center justify-center gap-2 border-none cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Settling Funds...
                    </>
                  ) : (
                    <>
                      Confirm Withdrawal
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
