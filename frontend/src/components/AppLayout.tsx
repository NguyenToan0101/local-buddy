import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

// Routes that skip the global navigation entirely (auth flows, full-screen experiences)
const FULLSCREEN_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/register/buddy',
  '/buddy/welcome',
  '/buddy/preview',
  '/admin/login',
];

// Routes that hide the bottom navigation (mobile) but still show the desktop navbar
const HIDE_BOTTOM_NAV_PREFIXES = [
  '/traveller/experience/live',
  '/buddy/live',
  '/traveller/buddy/',
];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  const isFullscreen = FULLSCREEN_PATHS.includes(path);
  const isAdminPath = path.startsWith('/admin');

  // Admin pages get their own layout with no shared nav
  if (isAdminPath) {
    return <>{children}</>;
  }

  // Auth / landing pages — no nav at all
  if (isFullscreen) {
    return <>{children}</>;
  }

  const hideBottomNav = HIDE_BOTTOM_NAV_PREFIXES.some(prefix => path.startsWith(prefix));
  const isBuddyPath = path.startsWith('/buddy');

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col overflow-x-hidden">
      {/* Desktop / Tablet top navigation — hidden on mobile */}
      {!isBuddyPath && (
        <div className="hidden md:block">
          <Navbar />
        </div>
      )}

      {/* Main page content */}
      <main className={`flex-1 flex flex-col ${isBuddyPath ? '' : 'md:pt-24'}`}>
        {children}
      </main>

      {/* Mobile bottom navigation — hidden on md+ */}
      {!hideBottomNav && (
        <div className="md:hidden">
          <div className="pb-16" /> {/* spacer so content isn't hidden behind bottom nav */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <BottomNavigation />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
