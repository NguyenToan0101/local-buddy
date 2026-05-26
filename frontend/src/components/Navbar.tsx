import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, MessageSquare, Bell, Calendar } from 'lucide-react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  const hideMarketingLinks = location.pathname.startsWith('/traveller/');

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
      navigate(`/traveller/experience/live/${activeBooking.id}`);
    } catch (error) {
      console.error("Error starting trip from scanner:", error);
    }
  };

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
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16">
        <div className="flex justify-between items-center h-24">
          <Link to={user ? "/traveller/home" : "/"} className="flex items-center gap-3 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 bg-primary rounded-[18px] flex items-center justify-center text-white shadow-primary-glow">
              <Compass size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black text-secondary tracking-tighter uppercase">Local Buddy</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link
              to={user ? "/traveller/buddies" : "/login"}
              className="text-[11px] font-black text-secondary/40 hover:text-primary uppercase tracking-[0.25em] transition-all"
            >
              Explore
            </Link>
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
                  to={user.role === 'BUDDY' ? "/buddy/dashboard" : "/traveller/booking"}
                  className="text-[11px] font-black text-secondary/40 hover:text-primary uppercase tracking-[0.25em] transition-all"
                >
                  My Bookings
                </Link>

                <Link
                  to="/traveller/messages"
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

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <Link to={user.role === 'BUDDY' ? "/buddy/dashboard" : "/traveller/profile"} className="block hover:text-primary transition-colors">
                    <p className="text-xs font-black text-secondary uppercase tracking-widest">{user.name}</p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">{user.role}</p>
                  </Link>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-surface-dark overflow-hidden border-2 border-primary/10">
                  <img src={user.avatar || `https://i.pravatar.cc/100?u=${user.id}`} alt={user.name} />
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-secondary/40 hover:text-red-500 transition-colors">
                  Logout
                </Button>
              </div>
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
