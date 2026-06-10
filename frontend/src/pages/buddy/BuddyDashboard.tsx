import React, { useMemo, useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Star, 
  Wallet, 
  Settings, 
  Bell, 
  ChevronRight, 
  LogOut,
  ChevronLeft,
  Clock,
  Compass,
  ArrowRight,
  Menu,
  X,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

// Refactored Sub-components
import DashboardOverview from '../../components/buddy/DashboardOverview';
import TripsTab from '../../components/buddy/TripsTab';
import MessagesTab from '../../components/buddy/MessagesTab';
import EarningsTab from '../../components/buddy/EarningsTab';
import ScheduleTab from '../../components/buddy/ScheduleTab';
import SettingsTab from '../../components/buddy/SettingsTab';
import BookingDetail from './BookingDetail';

import { experienceService, bookingService, messageService, transactionService, type Experience } from '../../services/api';

const BuddyDashboard: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real Data State
  const [travelerStories, setTravelerStories] = useState<Experience[]>([]);
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/buddy/dashboard' },
    { id: 'trips', icon: Calendar, label: 'Trips', path: '/buddy/dashboard/trips' },
    { id: 'schedule', icon: Clock, label: 'Schedule', path: '/buddy/dashboard/schedule' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/buddy/dashboard/messages' },
    { id: 'earnings', icon: Wallet, label: 'Earnings', path: '/buddy/dashboard/earnings' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/buddy/dashboard/settings' },
  ];

  const currentTab = useMemo(() => {
    const path = location.pathname;
    const item = menuItems.find(item => item.path === path);
    return item ? item.label : 'Dashboard';
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      let buddyId = user?.id || "1"; 
      if (buddyId === "buddy-1") buddyId = "1";
      
      try {
        if (user) {
          await updateUser({});
        }

        const [storiesData, bookingsData, messagesData, transactionsData] = await Promise.all([
          experienceService.getByBuddyId(buddyId),
          bookingService.getAll(),
          messageService.getConversations(),
          transactionService.getByBuddyId(buddyId)
        ]);

        setTravelerStories(storiesData);
        setUpcomingTrips(bookingsData.filter((b: any) => String(b.buddyId) === String(buddyId)));
        setChats(messagesData.filter((c: any) => String(c.buddyId) === String(buddyId)));
        
        const balance = transactionsData.reduce((acc: number, t: any) => {
          return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
        setTotalEarnings(balance);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const stats = useMemo(() => [
    { label: "Wallet Balance", value: `$${totalEarnings.toFixed(2)}`, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Avg Rating", value: user?.rating?.toString() || "4.9", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
  ], [totalEarnings, user?.rating]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.3em]">Syncing Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col md:flex-row relative">
      {/* Desktop/Tablet Sidebar Navigation */}
      <aside 
        className={`hidden md:flex flex-col border-r border-gray-100/80 bg-white fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-out ${
          sidebarCollapsed ? 'w-24' : 'w-72'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-6 flex items-center justify-between border-b border-gray-50 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          {!sidebarCollapsed ? (
            <Link to="/buddy/dashboard" className="flex items-center gap-3 transition-transform hover:-translate-y-0.5">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-primary-glow">
                <Compass size={22} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-black text-secondary tracking-tighter uppercase whitespace-nowrap">Local Buddy</span>
            </Link>
          ) : (
            <Link to="/buddy/dashboard" className="transition-transform hover:scale-105">
              <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-primary-glow">
                <Compass size={22} strokeWidth={2.5} />
              </div>
            </Link>
          )}

          {!sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(true)}
              className="w-8 h-8 rounded-xl bg-surface hover:bg-gray-50 flex items-center justify-center text-secondary/40 hover:text-primary transition-colors border-none cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Expand Trigger for Collapsed State */}
        {sidebarCollapsed && (
          <div className="p-4 flex justify-center border-b border-gray-50">
             <button 
                onClick={() => setSidebarCollapsed(false)}
                className="w-8 h-8 rounded-xl bg-surface hover:bg-gray-50 flex items-center justify-center text-secondary/40 hover:text-primary transition-colors border-none cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.id === 'trips' && location.pathname.includes('/buddy/dashboard/trips/'));
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
                  isActive 
                  ? "bg-primary/5 text-primary font-black shadow-sm" 
                  : "text-secondary/40 hover:text-secondary hover:bg-gray-50"
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={sidebarCollapsed ? "mx-auto" : ""} />
                {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-[0.15em]">{item.label}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-gray-50 space-y-4 bg-gray-50/30">
          <div className={`flex items-center ${sidebarCollapsed ? "flex-col justify-center" : "gap-3"} px-2`}>
            <div className="w-10 h-10 rounded-xl bg-surface-dark overflow-hidden ring-2 ring-primary/5 shrink-0">
              <img src={user?.avatar || `https://i.pravatar.cc/100?u=${user?.name}`} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-secondary uppercase tracking-wider truncate">{user?.name || 'Linh Nguyen'}</p>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Buddy Host</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button 
                onClick={handleLogout}
                className="text-secondary/20 hover:text-red-500 transition-colors border-none bg-transparent p-1 cursor-pointer"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
          {sidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="w-10 h-10 mx-auto rounded-xl hover:bg-red-50 flex items-center justify-center text-secondary/25 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out pb-24 md:pb-8 ${
          sidebarCollapsed ? 'md:ml-24' : 'md:ml-72'
        }`}
      >
        {/* Header bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100/60 px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                {menuItems.find(i => i.label === currentTab)?.icon && React.createElement(menuItems.find(i => i.label === currentTab)!.icon, { size: 18 })}
             </div>
             <div>
                <h1 className="text-lg font-black text-secondary tracking-tight">{currentTab}</h1>
                <p className="text-[8px] font-black text-secondary/35 uppercase tracking-widest leading-none mt-0.5">Control Center</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Online Status Toggle Switch */}
             <button 
               onClick={() => setIsOnline(!isOnline)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-100 bg-white transition-all shadow-sm ${
                 isOnline ? 'hover:border-green-200' : 'hover:border-gray-200'
               }`}
             >
               <span className="relative flex h-2 w-2">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                 <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
               </span>
               <span className="text-[9px] font-black uppercase tracking-widest text-secondary/60">
                 {isOnline ? 'Online' : 'Offline'}
               </span>
             </button>

             {/* Notifications */}
             <button className="relative w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary transition-all hover:shadow-premium group">
                <Bell size={16} />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border border-white group-hover:animate-pulse"></span>
             </button>



             {/* Profile Preview CTA */}
             <Link to="/buddy/preview" className="hidden sm:block">
                <Button className="bg-secondary text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-premium hover:bg-primary transition-all border-none">
                  Preview Profile
                </Button>
             </Link>
          </div>
        </header>

        {/* Dashboard Tab Content Router */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 min-w-0 w-full overflow-hidden md:overflow-visible animate-in fade-in duration-300">
          <Routes>
            <Route index element={<DashboardOverview stats={stats} upcomingTrips={upcomingTrips} chats={chats} />} />
            <Route path="trips" element={<TripsTab upcomingTrips={upcomingTrips} />} />
            <Route path="trips/:id" element={<BookingDetail />} />
            <Route path="schedule" element={<ScheduleTab />} />
            <Route path="messages" element={<MessagesTab chats={chats} />} />
            <Route path="earnings" element={<EarningsTab />} />
            <Route path="settings" element={<SettingsTab />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default BuddyDashboard;
