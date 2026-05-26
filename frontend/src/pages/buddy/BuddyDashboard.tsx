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
  ArrowRight
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
      // Normalize ID if it comes from a legacy session
      if (buddyId === "buddy-1") buddyId = "1";
      
      try {
        // Đồng bộ lại thông tin user (bao gồm verificationStatus) từ API,
        // phòng trường hợp admin vừa approve trong bảng users.
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

  // Derived Stats
  const stats = [
    { label: "Wallet Balance", value: `$${totalEarnings.toFixed(2)}`, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Avg Rating", value: user?.rating?.toString() || "4.9", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFF]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.3em]">Syncing Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-28" : "w-80"} border-r border-gray-100 flex flex-col fixed inset-y-0 z-50 bg-white transition-all duration-500 ease-in-out`}>
        <div className="py-10 px-8 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <Link to="/buddy/dashboard" className="flex items-center gap-3 transition-transform hover:-translate-y-0.5">
              <div className="w-12 h-12 bg-primary rounded-[18px] flex items-center justify-center text-white shadow-primary-glow">
                <Compass size={28} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black text-secondary tracking-tighter uppercase whitespace-nowrap">Local Buddy</span>
            </Link>
          ) : (
            <Link to="/buddy/dashboard" className="mx-auto flex items-center justify-center transition-transform hover:scale-110">
              <div className="w-12 h-12 bg-primary rounded-[18px] flex items-center justify-center text-white shadow-primary-glow">
                <Compass size={28} strokeWidth={2.5} />
              </div>
            </Link>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-secondary/30 hover:text-primary transition-colors border-none cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>
        {sidebarCollapsed && (
          <div className="px-8 pb-10 flex justify-center">
             <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-secondary/30 hover:text-primary transition-colors border-none cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
          </div>
        )}

        <nav className="flex-1 px-6 py-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-[22px] transition-all duration-300 group relative ${
                location.pathname === item.path 
                ? "bg-primary text-white shadow-primary-glow translate-x-1" 
                : "text-secondary/40 hover:text-primary hover:bg-primary/5"
              }`}
            >
              <item.icon size={20} strokeWidth={location.pathname === item.path ? 2.5 : 2} className={sidebarCollapsed ? "mx-auto" : ""} />
              {!sidebarCollapsed && <span className="text-[11px] font-black uppercase tracking-[0.2em]">{item.label}</span>}
              {location.pathname === item.path && !sidebarCollapsed && (
                <div className="absolute right-6 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              )}
            </Link>
          ))}
          
        </nav>

        <div className="p-8 border-t border-gray-50 space-y-6">

          <div className={`flex items-center ${sidebarCollapsed ? "flex-col justify-center" : "gap-4"} px-4`}>
            <div className="w-12 h-12 rounded-2xl bg-surface-dark overflow-hidden ring-4 ring-primary/5">
              <img src={user?.avatar || `https://i.pravatar.cc/100?u=linh`} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-secondary uppercase tracking-widest truncate">{user?.name || 'Linh Nguyen'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className={`w-1.5 h-1.5 rounded-full ${
                     user?.verificationStatus === 'verified' ? 'bg-green-500' : 
                     user?.verificationStatus === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                   }`}></div>
                   <p className={`text-[8px] font-black uppercase tracking-widest ${
                     user?.verificationStatus === 'verified' ? 'text-green-500' : 
                     user?.verificationStatus === 'pending' ? 'text-amber-500' : 'text-red-500'
                   }`}>
                     {user?.verificationStatus === 'verified' ? 'Verified Buddy' : 
                      user?.verificationStatus === 'pending' ? 'Pending Verification' : 'Unverified'}
                   </p>
                </div>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className={`text-secondary/20 hover:text-red-500 transition-colors border-none bg-transparent ${sidebarCollapsed ? "mt-4" : ""}`}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarCollapsed ? "ml-28" : "ml-80"} transition-all duration-500`}>
        <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50 px-12 py-8 flex justify-between items-center">
          <div className="flex items-center gap-6">
             <div className="w-12 h-12 bg-secondary/5 rounded-2xl flex items-center justify-center text-secondary">
                {menuItems.find(i => i.label === currentTab)?.icon && React.createElement(menuItems.find(i => i.label === currentTab)!.icon, { size: 24 })}
             </div>
             <div>
                <h1 className="text-2xl font-black text-secondary tracking-tight">{currentTab}</h1>
                <p className="text-[10px] font-bold text-secondary/30 uppercase tracking-[0.3em]">Buddy Control Center</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <button className="relative w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-secondary/40 hover:text-primary transition-all hover:shadow-premium group">
                <Bell size={20} />
                <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border-2 border-white group-hover:animate-ping"></span>
             </button>
             <Link to="/buddy/preview">
                <Button className="bg-secondary text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-primary transition-all border-none">
                  Profile Preview
                </Button>
             </Link>
          </div>
        </header>

        <div className="p-12 animate-in fade-in duration-700">
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
