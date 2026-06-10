import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Check, Calendar, Clock, Trash, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { bookingService, availabilityService } from '../../services/api';

const HOURS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

const parseHour = (timeStr: string): number => {
  const [timePart, period] = (timeStr || '').split(' ');
  let h = parseInt(timePart?.split(':')[0] || '0');
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h;
};

const slotToHour = (slot: string) => parseInt(slot.split(':')[0]);

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
  const [selectedDate, setSelectedDate] = useState<string>('');

  const buddyId = user?.id || "1";
  const [generatedSlots, setGeneratedSlots] = useState<any[]>([]);

  // Modal States
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeFrom, setTimeFrom] = useState('08:00');
  const [timeTo, setTimeTo] = useState('16:00');

  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentDate);
  const mondayStr = monday.toDateString();
  const weekDays = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
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
  }, [mondayStr]);

  // Set default selected date to today or Monday of current week when week changes
  useEffect(() => {
    if (weekDays.length > 0) {
      const todayObj = weekDays.find(d => d.isToday);
      setSelectedDate(todayObj ? todayObj.fullDate : weekDays[0].fullDate);
    }
  }, [mondayStr]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        let cleanBuddyId = buddyId;
        if (cleanBuddyId.startsWith('buddy-')) cleanBuddyId = cleanBuddyId.replace('buddy-', '');

        const [bookingsData, slotsData] = await Promise.all([
          bookingService.getAll(),
          availabilityService.fetchAvailabilities(cleanBuddyId)
        ]);
        setBookings(bookingsData.filter((b: any) => String(b.buddyId) === String(buddyId)));
        setGeneratedSlots(slotsData);
      } catch (error) {
        console.error("Error fetching schedule data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [buddyId, user]);

  const changeWeek = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  const getMonthYearString = () =>
    currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getSlotInfo = (fullDate: string, slotHour: number) => {
    const slotStr12 = hourToStr12(slotHour);

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

    let cleanBuddyId = buddyId;
    if (cleanBuddyId.startsWith('buddy-')) cleanBuddyId = cleanBuddyId.replace('buddy-', '');

    const tempId = `temp-${Date.now()}`;
    const tempSlot = { id: tempId, date, time, status: 'FREE', title: 'Available' };

    setGeneratedSlots(prev => [...prev, tempSlot]);

    availabilityService.addAvailability(cleanBuddyId, {
      date, time, status: 'FREE', title: 'Available'
    }).then(newSlot => {
      setGeneratedSlots(prev => prev.map(s => s.id === tempId ? newSlot : s));
    }).catch(error => {
      console.error("Failed to add slot:", error);
      setGeneratedSlots(prev => prev.filter(s => s.id !== tempId));
    });
  };

  const handleRemoveFreeSlot = (id: string) => {
    let cleanBuddyId = buddyId;
    if (cleanBuddyId.startsWith('buddy-')) cleanBuddyId = cleanBuddyId.replace('buddy-', '');

    const slotToRemove = generatedSlots.find(s => s.id === id);
    if (!slotToRemove) return;

    setGeneratedSlots(prev => prev.filter(s => s.id !== id));

    availabilityService.deleteAvailability(cleanBuddyId, id).catch(error => {
      console.error("Failed to remove slot:", error);
      setGeneratedSlots(prev => [...prev, slotToRemove]);
    });
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
              newSlots.push({ date: dateStr, time, status: 'FREE', title: 'Available' });
            }
          }
        }
      }
    }

    if (newSlots.length === 0) {
      setShowQuickAdd(false);
      return;
    }

    let cleanBuddyId = buddyId;
    if (cleanBuddyId.startsWith('buddy-')) cleanBuddyId = cleanBuddyId.replace('buddy-', '');

    availabilityService.addAvailabilitiesBulk(cleanBuddyId, newSlots).then(savedSlots => {
      setGeneratedSlots(prev => [...prev, ...savedSlots]);
      setShowQuickAdd(false);
      setStartDate(''); setEndDate(''); setSelectedDays([]);
    }).catch(error => {
      console.error("Failed to bulk generate slots:", error);
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-10 h-10 border-4 border-primary/25 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  const activeDayObj = weekDays.find(d => d.fullDate === selectedDate) || weekDays[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-secondary tracking-tight">Availability Schedule</h3>
          <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">Select a day below to set your available session slots</p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 border-none cursor-pointer shrink-0"
        >
          <Plus size={14} strokeWidth={3} /> Bulk Add Slots
        </button>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => changeWeek(-1)} className="w-8 h-8 border border-gray-100 rounded-lg flex items-center justify-center text-secondary/35 hover:text-primary transition-colors bg-white cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <h4 className="text-xs font-black text-secondary uppercase tracking-wider">{getMonthYearString()}</h4>
          <button onClick={() => changeWeek(1)} className="w-8 h-8 border border-gray-100 rounded-lg flex items-center justify-center text-secondary/35 hover:text-primary transition-colors bg-white cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 border border-gray-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-secondary/40 hover:text-primary transition-all bg-white cursor-pointer">
          Today
        </button>
      </div>

      {/* Weekly Date Strip Selector */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isSelected = selectedDate === day.fullDate;
          
          // Calculate counts of free & booked slots
          const dailyFreeCount = generatedSlots.filter(s => s.date === day.fullDate).length;
          const dailyBookedCount = bookings.filter(b => b.date === day.fullDate).length;

          return (
            <button
              key={day.fullDate}
              onClick={() => setSelectedDate(day.fullDate)}
              className={`p-3 rounded-2xl flex flex-col items-center justify-between gap-2 border transition-all cursor-pointer min-h-[90px] ${
                isSelected 
                ? 'bg-secondary border-secondary text-white shadow-md scale-[1.02]' 
                : day.isToday 
                  ? 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10'
                  : 'bg-white border-gray-100 text-secondary hover:border-primary/20 hover:shadow-premium'
              }`}
            >
              <span className={`text-[8px] font-black uppercase tracking-wider ${isSelected ? 'text-white/60' : 'text-secondary/40'}`}>
                {day.shortName}
              </span>
              <span className="text-base font-black leading-none">{day.date}</span>
              
              {/* Dot indicators */}
              <div className="flex gap-1 justify-center min-h-[6px]">
                {dailyBookedCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-secondary'}`} title={`${dailyBookedCount} Booked`}></span>
                )}
                {dailyFreeCount > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} title={`${dailyFreeCount} Free`}></span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Slots Timeline list for the active selected day */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-baseline px-1">
          <h4 className="text-xs font-black text-secondary uppercase tracking-wider">
            Schedule for {activeDayObj.name}, {activeDayObj.dateLabel}
          </h4>
          <span className="text-[8px] font-bold text-secondary/35 uppercase tracking-widest">
            {activeDayObj.isToday ? 'Today' : 'Upcoming'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOURS.map((hourStr) => {
            const slotHour = slotToHour(hourStr);
            const info = getSlotInfo(selectedDate, slotHour);

            if (info.type === 'booked') {
              const { booking, isFirst } = info;
              const isPending = booking.status === 'PENDING';
              return (
                <div
                  key={hourStr}
                  onClick={() => navigate(`/buddy/dashboard/trips/${booking.id}`)}
                  className={`p-4.5 rounded-2xl flex flex-col justify-between min-h-[110px] cursor-pointer hover:shadow-premium transition-all relative group overflow-hidden border ${
                    isPending 
                    ? 'bg-amber-50 border-amber-200 text-secondary' 
                    : 'bg-secondary border-secondary text-white'
                  }`}
                >
                  <div className="absolute top-[-20px] right-[-20px] w-16 h-16 opacity-5 bg-white rounded-full"></div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider">
                      <Clock size={10} /> {hourStr}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      isPending ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/20 text-primary'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className={`text-xs font-black tracking-tight leading-snug truncate ${isPending ? 'text-secondary' : 'text-white'}`}>
                      {booking.title}
                    </p>
                    <p className={`text-[10px] font-bold mt-1 ${isPending ? 'text-secondary/50' : 'text-white/60'}`}>
                      Guest: {booking.traveler}
                    </p>
                  </div>
                </div>
              );
            }

            if (info.type === 'free') {
              return (
                <div
                  key={hourStr}
                  className="p-4.5 rounded-2xl bg-green-500/5 border border-green-200/60 flex items-center justify-between min-h-[90px] group transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-green-600 uppercase tracking-wider">
                      <Clock size={10} /> {hourStr}
                    </div>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1.5 flex items-center gap-1">
                      <Check size={12} strokeWidth={2.5} /> Available
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveFreeSlot(info.slot.id)}
                    className="w-9 h-9 rounded-xl bg-white hover:bg-red-50 text-red-500 border border-gray-100 hover:border-red-200 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                    title="Remove Slot"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              );
            }

            // Empty slot (click to add available)
            return (
              <button
                key={hourStr}
                onClick={() => handleAddSingleSlot(selectedDate, slotHour)}
                className="p-4.5 rounded-2xl bg-white hover:bg-green-500/[0.03] border-2 border-dashed border-gray-200 hover:border-green-300 flex items-center justify-between min-h-[90px] text-left transition-colors cursor-pointer group"
              >
                <div className="space-y-1 select-none">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-secondary/30 uppercase tracking-wider group-hover:text-green-600/60 transition-colors">
                    <Clock size={10} /> {hourStr}
                  </div>
                  <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest mt-1.5 group-hover:text-green-600 transition-colors">
                    Click to Open
                  </p>
                </div>

                <div className="w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-green-500/10 text-secondary/20 group-hover:text-green-600 flex items-center justify-center transition-colors">
                  <Plus size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Slot Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-secondary/70 backdrop-blur-sm" onClick={() => setShowQuickAdd(false)}></div>
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full relative z-10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <div>
                <h3 className="text-lg font-black text-secondary tracking-tight">Bulk Add Blocks</h3>
                <p className="text-[9px] font-bold text-secondary/40 uppercase tracking-widest">Generate available slots over date range</p>
              </div>
              <button 
                onClick={() => setShowQuickAdd(false)} 
                className="w-8 h-8 bg-surface rounded-xl flex items-center justify-center text-secondary/35 hover:text-primary transition-colors border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary uppercase tracking-wider ml-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary uppercase tracking-wider ml-1">End Date</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/10" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-secondary uppercase tracking-wider ml-1">Days of Week</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <button 
                      key={day} 
                      onClick={() => handleDaySelect(index)}
                      className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                        selectedDays.includes(index) 
                        ? 'bg-secondary text-white shadow-sm' 
                        : 'bg-surface text-secondary/40 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-2">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary uppercase tracking-wider ml-1">Time From</label>
                  <select 
                    value={timeFrom} 
                    onChange={e => setTimeFrom(e.target.value)}
                    className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none cursor-pointer"
                  >
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-secondary uppercase tracking-wider ml-1">Time To</label>
                  <select 
                    value={timeTo} 
                    onChange={e => setTimeTo(e.target.value)}
                    className="w-full bg-surface border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-secondary outline-none cursor-pointer"
                  >
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={generateSlots}
                disabled={!startDate || !endDate || selectedDays.length === 0}
                className="w-full bg-primary hover:bg-primary-dark disabled:bg-secondary/20 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all border-none cursor-pointer disabled:cursor-not-allowed"
              >
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
