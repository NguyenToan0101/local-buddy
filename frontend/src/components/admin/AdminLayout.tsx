import React, { useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  LogOut,
  Search,
  Bell,
  Moon,
  Sun,
  UserCheck,
  Menu,
  X,
  Wallet,
  Siren,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems: Array<{ icon: any; label: string; path: string; badge?: string }> = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: UserCheck, label: "Verification", path: "/admin/verification" },
    { icon: Siren, label: "SOS Monitoring", path: "/admin/sos" },
    { icon: Wallet, label: "Payouts & Taxes", path: "/admin/payouts" },
  ];

  const handleLogout = () => {
    navigate('/admin/login');
  };

  return (
    <div className="h-screen flex overflow-hidden animate-fade-in admin-layout-bg">
      {/* Sidebar Overlay (Mobile) */}
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative h-screen z-50 transition-all duration-500 ease-in-out flex flex-col admin-sidebar-bg border-r shrink-0 ${
        isSidebarOpen ? 'w-72 translate-x-0' : 'w-20 lg:w-24'
      }`}>
        <div className={`p-8 mb-4 flex items-center gap-4 ${isSidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-primary-glow shrink-0">
            <Compass size={24} />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-black tracking-tight text-admin-main">LocalBuddy</h1>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] leading-none">Console</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.label} 
                to={item.path}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all relative group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-primary-glow' 
                    : 'text-admin-muted hover:bg-admin-surface hover:text-indigo-500'
                }`}
              >
                <item.icon size={22} className={`shrink-0 transition-transform ${isActive ? 'scale-110 stroke-[2.5px]' : 'group-hover:scale-110'}`} />
                {isSidebarOpen && (
                  <span className="text-sm font-bold tracking-tight whitespace-nowrap">{item.label}</span>
                )}
                {item.badge && isSidebarOpen && (
                  <span className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-admin">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl text-admin-muted hover:bg-rose-500/10 hover:text-rose-500 transition-all group ${isSidebarOpen ? '' : 'justify-center'}`}
          >
            <LogOut size={22} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-bold tracking-tight">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-24 px-8 flex items-center justify-between sticky top-0 z-40 admin-glass transition-all shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 rounded-xl bg-admin-surface flex items-center justify-center text-admin-muted hover:text-indigo-500 transition-all"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-muted group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search command..." 
                className="w-80 admin-input pl-12"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-admin-surface p-1.5 rounded-2xl border border-admin">
              <button 
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-admin-muted hover:text-white'}`}
              >
                <Sun size={20} />
              </button>
              <button 
                onClick={() => theme === 'light' && toggleTheme()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-lg' : 'text-admin-muted hover:text-indigo-400'}`}
              >
                <Moon size={20} />
              </button>
            </div>
            
            <div className="w-px h-8 bg-admin mx-2"></div>

            <button className="w-12 h-12 rounded-2xl bg-admin-surface flex items-center justify-center text-admin-muted relative group border border-admin hover:scale-105 transition-all">
              <Bell size={22} />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--admin-sidebar)]"></span>
            </button>

            <button className="flex items-center gap-3 pl-3 py-1 pr-1 bg-admin-surface rounded-2xl border border-admin hover:border-indigo-500/30 transition-all cursor-pointer group">
              <div className="text-right hidden sm:block px-1">
                <p className="text-xs font-black text-admin-main leading-tight">Admin Alex</p>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Super Admin</p>
              </div>
              <img 
                src="https://i.pravatar.cc/150?u=admin-alex" 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/10 group-hover:ring-indigo-500/50 transition-all shadow-sm" 
                alt="Admin" 
              />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-8 lg:p-12 relative z-10 flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
