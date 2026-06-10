import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

interface MobileAppShellProps {
  children: React.ReactNode;
}

const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // Backoffice routes shouldn't be constrained in the mobile frame
  const isAdminPath = path.startsWith('/admin');

  if (isAdminPath) {
    return <>{children}</>;
  }

  // Paths that do not show the bottom tab navigation bar
  const hideBottomNavPaths = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/register/buddy',
    '/buddy/welcome',
    '/buddy/preview'
  ];

  const showBottomNav = 
    !hideBottomNavPaths.includes(path) && 
    !path.startsWith('/traveller/experience/live') && 
    !path.startsWith('/buddy/live');

  return (
    <div className="min-h-screen bg-[#0f172a] md:bg-[#0b0f19] flex items-center justify-center p-0 md:py-8 font-sans selection:bg-primary/10 overflow-hidden w-full">
      {/* simulated mobile device mockup container */}
      <div className="w-full max-w-[420px] h-screen md:h-[860px] md:max-h-[92vh] bg-[#fdfdff] shadow-2xl relative flex flex-col md:rounded-[44px] md:border-[12px] md:border-slate-800 md:overflow-hidden select-none">
        
        {/* Scrollable Page Screen viewport */}
        <div className="flex-1 overflow-y-auto flex flex-col scrollbar-hide bg-[#fdfdff] relative">
          {children}
        </div>
        
        {/* Bottom navigation bar */}
        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
};

export default MobileAppShell;
