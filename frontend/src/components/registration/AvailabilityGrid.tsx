import React from 'react';

interface AvailabilityGridProps {
  schedule: Record<string, string[]>; // e.g., { MON: ['M', 'A'], TUE: ['E'] }
  onChange: (day: string, slot: string) => void;
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const SLOTS = [
  { id: 'M', label: 'Morning' },
  { id: 'A', label: 'Afternoon' },
  { id: 'E', label: 'Evening' },
];

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({ schedule, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between px-2">
        {DAYS.map((day) => (
          <div key={day} className="text-[10px] font-bold text-secondary/40 uppercase tracking-widest text-center w-full">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-3">
        {DAYS.map((day) => (
          <div key={day} className="space-y-3">
            {SLOTS.map((slot) => {
              const isActive = schedule[day]?.includes(slot.id);
              return (
                <button
                  key={slot.id}
                  onClick={() => onChange(day, slot.id)}
                  className={`
                    w-full aspect-square rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                      : 'bg-surface-dark text-secondary/40 hover:bg-primary/5 hover:text-primary'}
                  `}
                >
                  {slot.id}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      
      <p className="text-[10px] italic text-secondary/40 text-center">
        * M: Morning, A: Afternoon, E: Evening. Click slots to toggle availability.
      </p>
    </div>
  );
};

export default AvailabilityGrid;
