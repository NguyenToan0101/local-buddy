import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, 
  UserCheck, MapPin, ArrowUpRight, ArrowDownRight,
  Plus, Eye
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../context/ThemeContext';

const AdminDashboard: React.FC = () => {
  const { theme } = useTheme();

  const data = useMemo(() => [
    { name: 'Mon', bookings: 45, revenue: 2400 },
    { name: 'Tue', bookings: 52, revenue: 3200 },
    { name: 'Wed', bookings: 48, revenue: 2800 },
    { name: 'Thu', bookings: 61, revenue: 4100 },
    { name: 'Fri', bookings: 55, revenue: 3900 },
    { name: 'Sat', bookings: 67, revenue: 4800 },
    { name: 'Sun', bookings: 72, revenue: 5200 },
  ], []);

  const metrics = [
    { 
      label: "Total Revenue", 
      value: "$24,580.00", 
      change: "+12.5%", 
      trend: "up", 
      icon: DollarSign, 
      color: "bg-emerald-500",
      gradient: "from-emerald-500/20 to-emerald-500/0",
      chartData: [{ v: 10 }, { v: 25 }, { v: 15 }, { v: 35 }, { v: 20 }, { v: 45 }, { v: 38 }]
    },
    { 
      label: "Commission Earned", 
      value: "$3,687.00", 
      change: "+8.2%", 
      trend: "up", 
      icon: Wallet, 
      color: "bg-indigo-600",
      gradient: "from-indigo-600/20 to-indigo-600/0"
    },
    { 
      label: "Pending Verifications", 
      value: "12", 
      change: "Priority", 
      trend: "alert", 
      icon: UserCheck, 
      color: "bg-rose-500",
      gradient: "from-rose-500/20 to-rose-500/0",
      alert: true
    },
    { 
      label: "Ongoing Trips", 
      value: "28", 
      change: "Real-time", 
      trend: "stable", 
      icon: MapPin, 
      color: "bg-amber-500",
      gradient: "from-amber-500/20 to-amber-500/0"
    }
  ];

  const recentVerifications = [
    { name: "Nguyen Van A", type: "Buddy", date: "2024-03-16", status: "Pending", avatar: "https://i.pravatar.cc/150?u=1" },
    { name: "Le Thi B", type: "Traveller", date: "2024-03-15", status: "Pending", avatar: "https://i.pravatar.cc/150?u=2" },
    { name: "Tran C", type: "Buddy", date: "2024-03-15", status: "Verified", avatar: "https://i.pravatar.cc/150?u=3" },
  ];

  // Map CSS variables to Recharts colors
  const chartColors = theme === 'dark' ? {
    grid: "rgba(255, 255, 255, 0.05)",
    text: "#94a3b8",
    line: "#818cf8",
    tooltipBg: "#111827",
    tooltipBorder: "rgba(255, 255, 255, 0.1)"
  } : {
    grid: "#e2e8f0",
    text: "#64748b",
    line: "#6366f1",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0"
  };

  return (
    <AdminLayout>
      <div className="space-y-10 animate-slide-up">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-admin-main">The Command Center</h1>
            <p className="text-lg font-bold text-admin-muted">Monitor system health and performance snapshots.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-primary-glow hover:scale-105 active:scale-95 transition-all">
            <Plus size={18} />
            Generate Report
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {metrics.map((metric, i) => (
            <div key={i} className="admin-card relative overflow-hidden group border-none">
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-40 group-hover:opacity-100 transition-opacity`}></div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={`w-14 h-14 rounded-2xl ${metric.color} flex items-center justify-center text-white shadow-xl shadow-${metric.color.split('-')[1]}-500/20`}>
                    <metric.icon size={28} />
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    metric.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 
                    metric.trend === 'alert' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-admin-surface text-admin-muted'
                  }`}>
                    {metric.trend === 'up' ? <ArrowUpRight size={14} /> : 
                     metric.trend === 'down' ? <ArrowDownRight size={14} /> : null}
                    {metric.change}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-admin-muted uppercase tracking-[0.2em]">{metric.label}</p>
                  <h3 className={`text-3xl font-black text-admin-main ${metric.alert ? 'animate-pulse' : ''}`}>{metric.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Lists */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Main Growth Chart */}
          <div className="xl:col-span-2 admin-card">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-admin-main tracking-tight">Booking Growth</h3>
                <p className="text-sm font-bold text-admin-muted">Daily volume snapshots</p>
              </div>
              <div className="flex gap-2 p-1 bg-admin-surface rounded-xl border border-admin">
                {['D', 'W', 'M'].map((label) => (
                  <button key={label} className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${
                    label === 'D' ? 'bg-indigo-600 text-white shadow-lg' : 'text-admin-muted hover:text-indigo-500'
                  }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 800 }}
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: chartColors.text, fontSize: 12, fontWeight: 800 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: chartColors.tooltipBg, 
                      borderColor: chartColors.tooltipBorder,
                      borderRadius: '24px',
                      boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
                      padding: '16px',
                      border: '1px solid ' + chartColors.tooltipBorder
                    }}
                    itemStyle={{ fontWeight: 800, fontSize: '14px', color: theme === 'dark' ? '#fff' : '#000' }}
                    labelStyle={{ marginBottom: '8px', color: chartColors.text, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke={chartColors.line} 
                    strokeWidth={5} 
                    dot={{ r: 6, strokeWidth: 3, fill: chartColors.tooltipBg, stroke: chartColors.line }}
                    activeDot={{ r: 10, strokeWidth: 0, fill: chartColors.line }}
                    animationDuration={2500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Verification Access */}
          <div className="admin-card flex flex-col">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-admin-main tracking-tight mb-2">Priority Queue</h3>
              <p className="text-sm font-bold text-admin-muted">Waiting for manual review.</p>
            </div>
            
            <div className="flex-1 space-y-6">
              {recentVerifications.map((user, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-admin-surface p-3 rounded-2xl transition-all border border-transparent hover:border-admin">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-lg" alt={user.name} />
                    <div>
                      <h4 className="text-sm font-black text-admin-main">{user.name}</h4>
                      <p className="text-[10px] font-black text-admin-muted uppercase tracking-widest">{user.type} • {user.date}</p>
                    </div>
                  </div>
                  <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-lg shadow-lg">
                    <Eye size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button className="admin-btn-muted !w-full !h-16 !mt-8 !text-sm border border-admin">
              Access Full Queue
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
