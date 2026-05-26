import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../../services/api';

const HOURS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

// Parse "09:00 AM" -> 24h number
const parseHour = (timeStr: string): number => {
  const [timePart, period] = (timeStr || '').split(' ');
  let h = parseInt(timePart?.split(':')[0] || '0');
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h;
};

// "08:00" -> 24h number
const slotToHour = (slot: string) => parseInt(slot.split(':')[0]);

// 24h number -> "08:00 AM" / "02:00 PM"
const hourToStr12 = (h: number) => {
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:00 ${period}`;
};

const ScheduleTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // Free slots persisted in localStorage per buddyId
  const buddyId = user?.id || "1";
  const localKey = `freeSlots_buddy_${buddyId}`;
  const [generatedSlots, setGeneratedSlots] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(localKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Sync to localStorage whenever slots change
  useEffect(() => {
    try {
      localStorage.setItem(localKey, JSON.stringify(generatedSlots));
    } catch { /* quota exceeded, ignore */ }
  }, [generatedSlots, localKey]);

  // Modal State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeFrom, setTimeFrom] = useState('08:00');
  const [timeTo, setTimeTo] = useState('16:00');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingService.getAll();
        setBookings(data.filter((b: any) => String(b.buddyId) === String(buddyId)));
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [buddyId]);

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return {
      name: day.toLocaleDateString('en-US', { weekday: 'long' }),
      shortName: day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      date: day.getDate(),
      fullDate: day.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      dateLabel: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateObj: day,
      isToday: day.toDateString() === new Date().toDateString(),
    };
  });

  const changeWeek = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const getMonthYearString = () =>
    currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get slot status for a given day + slot hour
  const getSlotInfo = (fullDate: string, slotHour: number) => {
    const slotStr12 = hourToStr12(slotHour);

    // Check real booking (duration-aware)
    const booking = bookings.find(b => {
      if (b.date !== fullDate) return false;
      const start = parseHour(b.time);
      const end = start + (b.hours || 1);
      return slotHour >= start && slotHour < end;
    });
    if (booking) {
      const isFirst = parseHour(booking.time) === slotHour;
      return { type: 'booked', booking, isFirst };
    }

    // Check generated free slot
    const free = generatedSlots.find(s => s.date === fullDate && s.time === slotStr12);
    if (free) return { type: 'free', slot: free };

    return { type: 'empty' };
  };

  const handleAddSingleSlot = (date: string, slotHour: number) => {
    const time = hourToStr12(slotHour);
    if (generatedSlots.some(s => s.date === date && s.time === time)) return;
    if (bookings.some(b => {
      const start = parseHour(b.time);
      const end = start + (b.hours || 1);
      return b.date === date && slotHour >= start && slotHour < end;
    })) return;
    setGeneratedSlots(prev => [...prev, {
      id: `free-${Date.now()}-${Math.random()}`,
      date, time, status: 'FREE', title: 'Available'
    }]);
  };

  const handleRemoveFreeSlot = (id: string) => {
    setGeneratedSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleDaySelect = (i: number) =>
    setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);

  const generateSlots = () => {
    if (!startDate || !endDate || selectedDays.length === 0) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const newSlots: any[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (selectedDays.includes(d.getDay())) {
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const si = HOURS.indexOf(timeFrom), ei = HOURS.indexOf(timeTo);
        if (si !== -1 && ei !== -1) {
          for (let i = si; i <= ei; i++) {
            const hour = HOURS[i];
            const h = slotToHour(hour);
            const time = hourToStr12(h);
            if (!generatedSlots.some(s => s.date === dateStr && s.time === time)) {
              newSlots.push({ id: `free-${Date.now()}-${Math.random()}`, date: dateStr, time, status: 'FREE', title: 'Available' });
            }
          }
        }
      }
    }
    setGeneratedSlots(prev => [...prev, ...newSlots]);
    setShowQuickAdd(false);
    setStartDate(''); setEndDate(''); setSelectedDays([]);
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-4xl font-black text-secondary tracking-tighter italic">Schedule</h3>
          <p className="text-secondary/40 font-bold text-sm">Manage your availability — green slots are visible to travellers for booking.</p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="bg-primary px-8 py-4 rounded-[24px] text-white text-[11px] font-black uppercase tracking-widest shadow-primary-glow flex items-center gap-3 hover:scale-105 active:scale-95 transition-all border-none"
        >
          <Plus size={16} strokeWidth={3} /> Quick Add Slots
        </button>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => changeWeek(-1)} className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center text-secondary/30 hover:text-primary hover:border-primary/30 transition-all bg-white">
            <ChevronLeft size={18} />
          </button>
          <h4 className="text-lg font-black text-secondary tracking-tight">{getMonthYearString()}</h4>
          <button onClick={() => changeWeek(1)} className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center text-secondary/30 hover:text-primary hover:border-primary/30 transition-all bg-white">
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={() => setCurrentDate(new Date())} className="px-5 h-10 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary hover:border-primary/30 transition-all bg-white">
          Today
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-green-400"></div><span className="text-secondary/50">Free Slot</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-secondary"></div><span className="text-secondary/50">Booked</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-amber-400"></div><span className="text-secondary/50">Pending</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md border-2 border-dashed border-gray-200"></div><span className="text-secondary/50">Empty (click to add)</span></div>
      </div>

      {/* Time header */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="grid gap-0" style={{ gridTemplateColumns: '120px 1fr' }}>
          {/* Hour labels row */}
          <div className="bg-gray-50 border-b border-gray-100 p-3 flex items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-secondary/20">Day / Time</span>
          </div>
          <div className="border-b border-gray-100 bg-gray-50 grid" style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)` }}>
            {HOURS.map(h => (
              <div key={h} className="p-2 text-center border-l border-gray-100 first:border-l-0">
                <span className="text-[9px] font-black text-secondary/30 uppercase tracking-wide">{h}</span>
              </div>
            ))}
          </div>

          {/* Day rows */}
          {weekDays.map((day, dayIdx) => (
            <React.Fragment key={day.fullDate}>
              {/* Day label */}
              <div className={`p-4 border-b border-gray-100 flex flex-col justify-center ${day.isToday ? 'bg-primary/5' : 'bg-white'} ${dayIdx === weekDays.length - 1 ? 'border-b-0' : ''}`}>
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${day.isToday ? 'text-primary' : 'text-secondary/30'}`}>{day.shortName}</span>
                <span className={`text-lg font-black leading-tight ${day.isToday ? 'text-primary' : 'text-secondary'}`}>{day.date}</span>
                <span className="text-[9px] text-secondary/30 font-bold">{day.dateLabel}</span>
              </div>

              {/* Slots */}
              <div
                className={`border-b border-gray-100 grid ${dayIdx === weekDays.length - 1 ? 'border-b-0' : ''}`}
                style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)` }}
              >
                {HOURS.map(hourStr => {
                  const slotHour = slotToHour(hourStr);
                  const slotKey = `${day.fullDate}-${hourStr}`;
                  const info = getSlotInfo(day.fullDate, slotHour);
                  const isHovered = hoveredSlot === slotKey;

                  if (info.type === 'booked') {
                    const { booking, isFirst } = info;
                    const isPending = booking.status === 'PENDING';
                    return (
                      <div
                        key={slotKey}
                        onClick={() => navigate(`/buddy/dashboard/trips/${booking.id}`)}
                        className={`relative border-l border-white/20 min-h-[64px] cursor-pointer hover:opacity-90 transition-opacity ${isPending ? 'bg-amber-500' : 'bg-secondary'} ${isFirst ? 'rounded-l-xl' : ''}`}
                        title={`${booking.title} — ${booking.traveler} (click to view detail)`}
                      >
                        {isFirst && (
                          <div className="p-2 h-full flex flex-col justify-between">
                            <span className={`text-[7px] font-black uppercase tracking-widest ${isPending ? 'text-amber-900/60' : 'text-white/50'}`}>{booking.status}</span>
                            <div>
                              <span className={`text-[9px] font-black leading-tight block truncate ${isPending ? 'text-amber-950' : 'text-white'}`}>{booking.title}</span>
                              <span className={`text-[8px] font-bold ${isPending ? 'text-amber-900/70' : 'text-white/60'}`}>{booking.traveler}</span>
                            </div>
                          </div>
                        )}
                        {!isFirst && (
                          <div className="h-full w-full flex items-center justify-center opacity-30">
                            <div className="w-1 h-8 bg-white/50 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (info.type === 'free') {
                    return (
                      <div
                        key={slotKey}
                        onMouseEnter={() => setHoveredSlot(slotKey)}
                        onMouseLeave={() => setHoveredSlot(null)}
                        className="relative border-l border-gray-100 min-h-[64px] bg-green-50 border-t-2 border-t-green-400 group cursor-pointer"
                      >
                        <div className="p-2 h-full flex flex-col items-center justify-center">
                          <Check size={12} className="text-green-500 mb-1" />
                          <span className="text-[7px] font-black uppercase tracking-widest text-green-600">Free</span>
                        </div>
                        {/* Remove button on hover */}
                        <button
                          onClick={() => handleRemoveFreeSlot(info.slot.id)}
                          className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border-none"
                        >
                          <X size={8} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  }

                  // Empty slot
                  return (
                    <div
                      key={slotKey}
                      onMouseEnter={() => setHoveredSlot(slotKey)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => handleAddSingleSlot(day.fullDate, slotHour)}
                      className="relative border-l border-gray-100 min-h-[64px] hover:bg-green-50/60 cursor-pointer transition-colors group"
                    >
                      {isHovered && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-1 opacity-60">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Plus size={12} className="text-primary" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-[9px] font-black text-secondary/30 uppercase tracking-widest block mb-1">This Week</span>
          <span className="text-2xl font-black text-secondary">{bookings.filter(b => weekDays.some(d => d.fullDate === b.date)).length}</span>
          <span className="text-xs text-secondary/40 font-bold block">Bookings</span>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-[9px] font-black text-secondary/30 uppercase tracking-widest block mb-1">Free Slots</span>
          <span className="text-2xl font-black text-green-500">{generatedSlots.filter(s => weekDays.some(d => d.fullDate === s.date)).length}</span>
          <span className="text-xs text-secondary/40 font-bold block">This week</span>
        </div>
        <div className="bg-secondary rounded-2xl p-6 shadow-sm">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Total Trips</span>
          <span className="text-2xl font-black text-white">{bookings.length}</span>
          <span className="text-xs text-white/40 font-bold block">All time</span>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm" onClick={() => setShowQuickAdd(false)}></div>
          <div className="bg-white rounded-[48px] p-12 max-w-2xl w-full relative z-10 shadow-2xl space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-secondary tracking-tighter italic">Quick Add Slots</h3>
                <p className="text-secondary/40 font-bold text-xs">Generate multiple available slots instantly.</p>
              </div>
              <button onClick={() => setShowQuickAdd(false)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-secondary/40 hover:text-primary transition-all border-none">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-2">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-surface border-none rounded-2xl px-6 py-4 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-2">End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-surface border-none rounded-2xl px-6 py-4 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-2">Days of Week</label>
                <div className="flex gap-2 flex-wrap">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <button key={day} onClick={() => handleDaySelect(index)}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-none ${selectedDays.includes(index) ? 'bg-secondary text-white shadow-lg' : 'bg-surface text-secondary/40 hover:bg-gray-100'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pb-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-2">From</label>
                  <select value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                    className="w-full bg-surface border-none rounded-2xl px-6 py-4 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-2">To</label>
                  <select value={timeTo} onChange={e => setTimeTo(e.target.value)}
                    className="w-full bg-surface border-none rounded-2xl px-6 py-4 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={generateSlots}
                disabled={!startDate || !endDate || selectedDays.length === 0}
                className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-[12px] uppercase tracking-widest shadow-primary-glow hover:scale-[1.02] active:scale-95 transition-all border-none disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed">
                Generate Free Slots
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTab;
