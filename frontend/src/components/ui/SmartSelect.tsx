import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface SmartSelectProps {
  label: string;
  options: Option[];
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

const SmartSelect: React.FC<SmartSelectProps> = ({
  label,
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Select an option...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(option.value)) {
        onChange(currentValues.filter(v => v !== option.value));
      } else {
        onChange([...currentValues, option.value]);
      }
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className={`space-y-3 relative ${className}`} ref={dropdownRef}>
      <label className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] ml-4 transition-colors group-focus-within:text-primary">
        {label}
      </label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-surface-dark border-2 rounded-[24px] py-4 px-6 flex items-center justify-between cursor-pointer transition-all duration-300 ${
          isOpen ? 'border-primary/20 bg-white shadow-premium' : 'border-transparent hover:border-primary/10'
        }`}
      >
        <div className="flex flex-wrap gap-2 flex-1">
          {multiple && Array.isArray(value) && value.length > 0 ? (
            value.map(v => {
              const opt = options.find(o => o.value === v);
              return (
                <span 
                  key={v} 
                  className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase flex items-center gap-2 animate-in zoom-in-90"
                >
                  {opt?.label || v}
                  <button onClick={(e) => { e.stopPropagation(); handleSelect(opt!); }} className="hover:text-primary-dark">
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              );
            })
          ) : !multiple && value ? (
            <span className="font-bold text-secondary">
              {options.find(o => o.value === value)?.label || value}
            </span>
          ) : (
            <span className="text-secondary/20 font-bold italic">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={18} className={`text-secondary/20 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 right-0 z-[100] bg-white rounded-[32px] shadow-2xl border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20" />
              <input 
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search options..."
                className="w-full bg-surface-dark border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/5"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 overscroll-contain">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div 
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    isSelected(opt.value) ? 'bg-primary/5 text-primary' : 'hover:bg-surface-dark text-secondary'
                  }`}
                >
                  <span className="font-bold text-sm tracking-tight">{opt.label}</span>
                  {isSelected(opt.value) && <Check size={16} strokeWidth={3} />}
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-bold text-secondary/20 italic">No options found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSelect;
