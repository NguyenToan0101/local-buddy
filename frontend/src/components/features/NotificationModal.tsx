import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Star, ArrowRight, CheckCircle2, Clock, Play, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import { notificationService } from '../../services/api';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'booking': return <CheckCircle2 size={20} />;
    case 'reminder': return <Clock size={20} />;
    case 'status': return <Play size={20} />;
    case 'warning': return <AlertTriangle size={20} />;
    case 'review': return <Star size={20} />;
    default: return <Bell size={20} />;
  }
};

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      // Only show the latest 5 notifications in the modal
      setNotifications(data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(notifications.filter(n => n.unread).map(n => notificationService.markAsRead(n.id)));
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notifications" maxWidth="max-w-md">
      <div className="flex flex-col h-full">
        {/* Actions */}
        <div className="px-8 py-4 flex justify-between items-center bg-surface/50 border-b border-gray-50">
          <span className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">
            {notifications.filter(n => n.unread).length} New
          </span>
          <button 
            onClick={handleMarkAllRead}
            className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-all"
          >
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto max-h-[460px] scrollbar-hide">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-secondary/40 uppercase tracking-widest">Loading...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-6 flex items-start gap-4 transition-all hover:bg-surface cursor-pointer group ${notif.unread ? 'bg-primary/5' : ''}`}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className={`relative shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${notif.color || 'bg-surface-dark text-secondary/40'} shadow-sm`}>
                    {getIcon(notif.type)}
                    {notif.unread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-black text-secondary truncate pr-2">
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-black text-secondary/20 uppercase shrink-0 mt-1">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-secondary/40 line-clamp-2 leading-relaxed">
                      {notif.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-surface-dark rounded-full flex items-center justify-center mx-auto text-secondary/20">
                <Bell size={28} />
              </div>
              <p className="text-sm font-bold text-secondary/40">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationModal;
