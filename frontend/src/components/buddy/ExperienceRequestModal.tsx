import React, { useState } from 'react';
import { 
  X, Utensils, Coffee, ShoppingBag, Footprints, 
  Calendar, Clock, Timer, MapPin, Users, Send 
} from 'lucide-react';
import Button from '../ui/Button';

interface ExperienceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: any) => void;
  buddyName: string;
  buddyAvatar: string;
}

const ExperienceRequestModal: React.FC<ExperienceRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  onSend,
  buddyName,
  buddyAvatar
}) => {
  const [activity, setActivity] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('2 hours');
  const [guests, setGuests] = useState(1);
  const [location, setLocation] = useState('');
  const [isPinning, setIsPinning] = useState(false);

  if (!isOpen) return null;

  const activities = [
    { id: 'Food', icon: Utensils, label: 'Food' },
    { id: 'Coffee', icon: Coffee, label: 'Coffee' },
    { id: 'Market Visit', icon: ShoppingBag, label: 'Market Visit' },
    { id: 'City Walk', icon: Footprints, label: 'City Walk' },
  ];

  const handleSubmit = () => {
    onSend({
      activity,
      description,
      date,
      time,
      duration,
      guests,
      location,
      price: 45 // Default price for now, can be made dynamic
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-xl shadow-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={buddyAvatar} alt={buddyName} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-primary/5 shadow-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                 <div className="w-4 h-4 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Send size={10} />
                 </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-secondary tracking-tight">Plan Your Experience</h2>
              <p className="text-[10px] font-bold text-secondary/30 uppercase tracking-widest">
                Booking with <span className="text-secondary/60">{buddyName}</span> • Local Expert
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl hover:bg-gray-100 flex items-center justify-center text-secondary/40 transition-all border-none bg-transparent">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          {/* Activity Type */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Activity Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activities.map((act) => (
                <button
                  key={act.id}
                  onClick={() => setActivity(act.id)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[11px] font-black transition-all border-2 ${
                    activity === act.id 
                      ? 'bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10' 
                      : 'bg-white border-gray-100 text-secondary/40 hover:border-gray-200'
                  }`}
                >
                  <act.icon size={16} />
                  {act.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share details about what you want to do, dietary restrictions, or specific interests..."
              className="w-full bg-gray-50 border-none rounded-3xl p-6 text-sm font-bold text-secondary placeholder:text-secondary/20 min-h-[120px] outline-none focus:ring-2 focus:ring-primary/5 transition-all resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" size={18} />
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/5"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" size={18} />
                <input 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/5"
                />
              </div>
            </div>
          </div>

          {/* Duration & Guests */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Duration</label>
              <div className="relative">
                <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" size={18} />
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-secondary outline-none appearance-none focus:ring-2 focus:ring-primary/5 cursor-pointer"
                >
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>3 hours</option>
                  <option>4 hours</option>
                  <option>5 hours</option>
                  <option>Full day</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Guests</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" size={18} />
                <input 
                  type="number"
                  min="1"
                  max="10"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/5"
                />
              </div>
            </div>
          </div>

          {/* Meeting Area */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-secondary/30 uppercase tracking-[0.2em] ml-1">Meeting Area</label>
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" size={18} />
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Hoan Kiem Lake, Old Quarter"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/5"
                />
              </div>
              <button 
                onClick={() => setIsPinning(!isPinning)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border-none ${isPinning ? 'bg-primary text-white shadow-primary-glow' : 'bg-gray-50 text-secondary/20 hover:text-primary hover:bg-primary/5'}`}
              >
                <MapPin size={22} className={isPinning ? 'animate-bounce' : ''} />
              </button>
            </div>
          </div>

          {/* Map Preview */}
          <div className="relative rounded-[32px] overflow-hidden border border-gray-100 shadow-inner group h-48 bg-gray-50">
             <iframe 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(location || 'Hanoi, Vietnam')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className={`w-full h-full transition-opacity duration-700 ${isPinning ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}
             ></iframe>
             {!isPinning && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
                  <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-white shadow-sm flex items-center gap-2">
                    <MapPin size={12} className="text-secondary/30" />
                    <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Click pin to activate map</p>
                  </div>
               </div>
             )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-50 space-y-4">
          <Button 
            onClick={handleSubmit}
            className="w-full bg-primary text-white py-5 rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-primary-glow flex items-center justify-center gap-3 border-none hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Send size={18} />
            Send Request
          </Button>
          <p className="text-[10px] text-center text-secondary/20 font-bold uppercase tracking-widest leading-relaxed px-10">
            You won't be charged yet. The Traveler will review your offer and can accept or decline.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ExperienceRequestModal;
