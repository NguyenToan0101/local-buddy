import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Bell, Menu, X } from 'lucide-react';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import NotificationPopover from './features/NotificationPopover';
import ScannerModal from './features/ScannerModal';
import { bookingService } from '../services/api';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isTraveler = user?.role === 'TRAVELER';
  const isBuddy = user?.role === 'BUDDY';
  const isAdmin = user?.role === 'ADMIN';
  const homePath = isBuddy ? '/buddy/dashboard' : isAdmin ? '/admin/dashboard' : user ? '/traveller/home' : '/';
  const messagesPath = isBuddy ? '/buddy/dashboard/messages' : '/traveller/messages';
  const profilePath = isBuddy ? '/buddy/dashboard/settings' : isAdmin ? '/admin/dashboard' : '/traveller/profile';
  const hideMarketingLinks = user || location.pathname.startsWith('/traveller/');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleScanStart = (booking: any) => {
    setActiveBooking(booking);
    setShowScanner(true);
    setIsNotifOpen(false);
  };

  const handleScanSuccess = async () => {
    if (!activeBooking) return;
    try {
      await bookingService.updateMeetupStatus(activeBooking.id, 'IN_PROGRESS');
      setShowScanner(false);
      navigate(isBuddy ? `/buddy/live/${activeBooking.id}` : `/traveller/experience/live/${activeBooking.id}`);
    } catch (error) {
      console.error("Error starting trip from scanner:", error);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-50 shadow-premium">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 relative">
        <div className="flex items-center justify-between h-24">
          <Link to={homePath} className="flex items-center gap-3 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-primary rounded-[18px] flex items-center justify-center text-white shadow-primary-glow">
              <Compass size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black text-secondary tracking-tighter uppercase">Local Buddy</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {(!user || isTraveler) && (
              <Link
                to={user ? "/traveller/buddies" : "/login"}
                className="text-[11px] font-black text-secondary/40 hover:text-primary uppercase tracking-[0.25em] transition-all"
              >
                Explore
              </Link>
            )}
            {!hideMarketingLinks && (
              <a
                href="/#how-it-works"
                className="text-[11px] font-black text-secondary/40 hover:text-primary uppercase tracking-[0.25em] transition-all"
              >
                How it works
              </a>
            )}

            {user && (
              <>
                <Link
                  to={isBuddy ? "/buddy/dashboard/trips" : isAdmin ? "/admin/dashboard" : "/traveller/booking"}
                  className="text-[11px] font-black text-secondary/40 hover:text-primary uppercase tracking-[0.25em] transition-all"
                >
                  {isBuddy ? 'Trips' : isAdmin ? 'Admin' : 'My Bookings'}
                </Link>

                <Link
                  to={messagesPath}
                  className="text-[11px] font-black text-secondary/40 hover:text-primary uppercase tracking-[0.2em] transition-all relative group"
                >
                  Messages
                  <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-sm"></span>
                </Link>

                <div ref={containerRef} className="relative">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                      isNotifOpen ? 'text-primary' : 'text-secondary/40 hover:text-primary'
                    }`}
                  >
                    Notifications
                    <div className="relative">
                      <Bell size={16} />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-sm"></span>
                    </div>
                  </button>
                  <NotificationPopover
                    isOpen={isNotifOpen}
                    onClose={() => setIsNotifOpen(false)}
                    onScanStart={handleScanStart}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 rounded-2xl border border-gray-200 bg-white text-secondary/80 hover:text-primary transition-all flex items-center justify-center"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <Link to={profilePath} className="block hover:text-primary transition-colors">
                      <p className="text-xs font-black text-secondary uppercase tracking-widest">{user.name}</p>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">{user.role}</p>
                    </Link>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-surface-dark overflow-hidden border-2 border-primary/10">
                    <img
                      src={user.avatar || `https://i.pravatar.cc/100?u=${user.id}`}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.src = `https://i.pravatar.cc/100?u=${user.id}`;
                      }}
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-secondary/40 hover:text-red-500 transition-colors">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-[11px] font-black text-secondary/60 hover:text-primary uppercase tracking-[0.2em]">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-primary text-white px-10 py-4 text-xs font-black uppercase tracking-widest shadow-primary-glow scale-105">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute inset-x-0 top-full z-40 bg-white border-t border-gray-100 shadow-xl">
            <div className="px-6 py-4 space-y-4">
              {(!user || isTraveler) && (
                <Link
                  to={user ? "/traveller/buddies" : "/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-black text-secondary/80 hover:text-primary uppercase tracking-[0.25em] transition-all"
                >
                  Explore
                </Link>
              )}
              {!hideMarketingLinks && (
                <a
                  href="/#how-it-works"
                  className="block text-sm font-black text-secondary/80 hover:text-primary uppercase tracking-[0.25em] transition-all"
                >
                  How it works
                </a>
              )}
              {user && (
                <>
                  <Link
                    to={isBuddy ? "/buddy/dashboard/trips" : isAdmin ? "/admin/dashboard" : "/traveller/booking"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-black text-secondary/80 hover:text-primary uppercase tracking-[0.25em] transition-all"
                  >
                    {isBuddy ? 'Trips' : isAdmin ? 'Admin' : 'My Bookings'}
                  </Link>
                  <Link
                    to={messagesPath}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-black text-secondary/80 hover:text-primary uppercase tracking-[0.25em] transition-all"
                  >
                    Messages
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsNotifOpen(true);
                    }}
                    className="w-full text-left text-sm font-black text-secondary/80 hover:text-primary uppercase tracking-[0.25em] transition-all"
                  >
                    Notifications
                  </button>
                </>
              )}

              <div className="pt-4 border-t border-gray-100">
                {user ? (
                  <div className="space-y-3">
                    <Link
                      to={profilePath}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-black text-secondary/80 hover:text-primary uppercase tracking-[0.2em] transition-all"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-sm font-black text-red-500 uppercase tracking-[0.2em]"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-black text-secondary/80 hover:text-primary uppercase tracking-[0.2em] transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-black text-primary uppercase tracking-[0.2em] transition-all"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ScannerModal 
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onSuccess={handleScanSuccess}
        buddyName={activeBooking?.buddyName || "Buddy"}
      />
    </nav>
  );
};

export default Navbar;
