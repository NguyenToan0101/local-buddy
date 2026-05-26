import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Star, ArrowRight, CheckCircle2, Clock, Play, AlertTriangle, QrCode } from 'lucide-react';
import { notificationService, bookingService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onScanStart: (booking: any) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'booking': return <CheckCircle2 size={18} />;
    case 'reminder': return <Clock size={18} />;
    case 'status': return <Play size={18} />;
    case 'warning': return <AlertTriangle size={18} />;
    case 'review': return <Star size={18} />;
    default: return <Bell size={18} />;
  }
};

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose, onScanStart }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [waitingBooking, setWaitingBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
      checkMeetupStatus();
    }
  }, [isOpen, user]);

  const checkMeetupStatus = async () => {
    try {
      const bookings = await bookingService.getAll();
      const waiting = bookings.find((b: any) => b.meetupStatus === 'BUDDY_WAITING' && b.userId === (user?.id || 'u1'));
      setWaitingBooking(waiting);
    } catch (error) {
      console.error("Error checking meetup status for notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-4 w-[400px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>
      {/* Arrow */}
      <div className="absolute -top-2 right-10 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>

      {!user ? (
        <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center relative">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <Bell size={40} className="text-primary" />
            </div>
            {/* Shopee-style decorative elements */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-400 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-secondary">Login to see Notifications</p>
          </div>
          <div className="flex w-full gap-3">
            <Link 
              to="/signup" 
              onClick={onClose}
              className="flex-1 py-3 bg-surface-dark text-secondary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all text-center"
            >
              Sign Up
            </Link>
            <Link 
              to="/login" 
              onClick={onClose}
              className="flex-1 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-all text-center"
            >
              Login
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden rounded-xl">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Recent Notifications</span>
            {notifications.some(n => n.unread) && (
              <span className="w-2 h-2 bg-primary rounded-full"></span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-3 border-primary/10 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {/* Synthetic Buddy Waiting Notification */}
                {waitingBooking && (
                   <div 
                     className="p-5 flex items-start gap-4 transition-all hover:bg-white cursor-pointer group bg-primary/5 border-l-4 border-primary"
                     onClick={() => onScanStart(waitingBooking)}
                   >
                     <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-white shadow-primary-glow animate-pulse">
                        <QrCode size={18} />
                     </div>
                     <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start">
                           <h4 className="text-xs font-black text-secondary tracking-tight">Buddy is waiting for you!</h4>
                           <span className="text-[8px] font-black text-primary uppercase animate-pulse">Live</span>
                        </div>
                        <p className="text-[11px] font-medium text-secondary/60 leading-tight">
                           <span className="text-secondary font-black">{waitingBooking.buddyName}</span> is at the meetup point. Tap to scan and start journey.
                        </p>
                     </div>
                   </div>
                )}
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-5 flex items-start gap-4 transition-all hover:bg-gray-50 cursor-pointer group ${notif.unread ? 'bg-primary/5' : ''}`}
                    onClick={() => handleMarkAsRead(notif.id, {} as any)}
                  >
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${notif.color || 'bg-surface-dark text-secondary/40'} shadow-sm`}>
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-secondary truncate pr-2">
                          {notif.title}
                        </h4>
                        <span className="text-[8px] font-black text-secondary/20 uppercase shrink-0 mt-0.5">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-secondary/40 line-clamp-2 leading-tight">
                        {notif.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-secondary/20 font-bold uppercase tracking-widest text-[10px]">
                No new notifications
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
};

export default NotificationPopover;
