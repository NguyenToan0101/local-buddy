import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, MessageSquare, Calendar, User, Home, Wallet, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isBuddy = user.role === 'BUDDY';
  const isAdmin = user.role === 'ADMIN';

  // Define paths
  const homePath = isBuddy ? '/buddy/dashboard' : isAdmin ? '/admin/dashboard' : '/traveller/home';
  const explorePath = isBuddy ? '/buddy/dashboard' : '/traveller/buddies';
  const messagesPath = isBuddy ? '/buddy/dashboard/messages' : '/traveller/messages';
  const bookingsPath = isBuddy ? '/buddy/dashboard/trips' : '/traveller/booking';
  const profilePath = isBuddy ? '/buddy/dashboard/settings' : '/traveller/profile';

  const navItems = isBuddy ? [
    { label: 'Home', path: homePath, icon: Home },
    { label: 'Schedule', path: '/buddy/dashboard/schedule', icon: Clock },
    { label: 'Chat', path: messagesPath, icon: MessageSquare },
    { label: 'Bookings', path: bookingsPath, icon: Calendar },
    { label: 'Wallet', path: '/buddy/dashboard/earnings', icon: Wallet },
    { label: 'Profile', path: profilePath, icon: User },
  ] : [
    { label: 'Home', path: homePath, icon: Home },
    { label: 'Explore', path: explorePath, icon: Compass },
    { label: 'Chat', path: messagesPath, icon: MessageSquare },
    { label: 'Bookings', path: bookingsPath, icon: Calendar },
    { label: 'Profile', path: profilePath, icon: User },
  ];

  return (
    <nav className="w-full bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] pb-safe shrink-0 z-30">
      <div className="flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all ${
                isActive ? 'text-primary scale-105' : 'text-secondary/35 hover:text-secondary/60'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isActive ? 'font-black' : 'font-bold'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
