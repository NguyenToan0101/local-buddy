import React, { useState, useEffect } from 'react';
import { Wallet, BarChart3, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';
import { transactionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EarningsTab: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchTransactions();
  }, [user?.id]);

  const totalBalance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-4xl font-black text-secondary tracking-tight italic">System Wallet</h3>
          <p className="text-secondary/40 font-bold text-[10px] uppercase tracking-[0.3em]">Manage your platform earnings and withdrawals</p>
        </div>
        <Button className="bg-secondary text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl flex items-center gap-2 border-none">
          <ArrowDownLeft size={16} /> Withdraw Funds
        </Button>
      </div>

      {/* Main Wallet Card - Premium Minimalist */}
      <div className="bg-white rounded-[56px] shadow-premium p-12 border border-gray-50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
              <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.4em]">Available Balance</p>
            </div>
            <h1 className="text-7xl md:text-8xl font-black text-secondary tracking-tighter italic leading-none">
              ${totalBalance.toFixed(2)}
            </h1>
          </div>

          <div className="hidden md:block w-px h-32 bg-gray-100"></div>

          <div className="grid grid-cols-2 gap-12 flex-1">
             <div className="space-y-1 text-center md:text-left">
                <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest">Lifetime Earnings</p>
                <p className="text-3xl font-black text-secondary italic tracking-tight">${transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0).toFixed(0)}</p>
             </div>
             <div className="space-y-1 text-center md:text-left">
                <p className="text-[9px] font-black text-secondary/20 uppercase tracking-widest">Trips Completed</p>
                <p className="text-3xl font-black text-secondary italic tracking-tight">42</p>
             </div>
          </div>
        </div>
      </div>

      {/* Simplified Transaction History */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h4 className="text-xl font-black text-secondary tracking-tight italic">Transaction Logs</h4>
          <div className="flex gap-4">
             <button className="text-[9px] font-black text-secondary/20 uppercase tracking-widest hover:text-primary transition-colors border-none bg-transparent">Filters</button>
             <button className="text-[9px] font-black text-secondary/20 uppercase tracking-widest hover:text-primary transition-colors border-none bg-transparent">Export</button>
          </div>
        </div>

        <div className="bg-white rounded-[48px] shadow-premium border border-gray-50 divide-y divide-gray-50 overflow-hidden">
          {transactions.length > 0 ? (
            transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-10 hover:bg-gray-50/50 transition-all group">
                <div className="flex items-center gap-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-accent-green/10 text-accent-green' : 'bg-secondary/5 text-secondary/40'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-secondary uppercase tracking-widest mb-1">{t.client || t.target}</h5>
                    <p className="text-[10px] font-bold text-secondary/30 uppercase tracking-tighter italic">{t.activity || 'Earnings Withdrawal'}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`text-2xl font-black italic tracking-tighter ${t.type === 'income' ? 'text-accent-green' : 'text-secondary'}`}>
                    {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                  </p>
                  <p className="text-[9px] font-black text-secondary/10 uppercase tracking-widest">{t.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center space-y-4">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-secondary/10">
                  <Wallet size={32} />
               </div>
               <p className="text-[10px] font-black text-secondary/20 uppercase tracking-[0.3em]">No transaction activity found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EarningsTab;
