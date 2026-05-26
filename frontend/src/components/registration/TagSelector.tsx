import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TagSelectorProps {
  label?: string;
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

const TagSelector: React.FC<TagSelectorProps> = ({
  label,
  tags,
  onAddTag,
  onRemoveTag,
  placeholder = "Add tag...",
  suggestions = []
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onAddTag(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-bold text-secondary ml-1">{label}</label>}
      <div className="flex flex-wrap gap-2 min-h-[56px] p-4 bg-surface-dark rounded-2xl border-2 border-transparent focus-within:border-primary/20 transition-all">
        {tags.map((tag) => (
          <span 
            key={tag} 
            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-primary/20 text-primary text-sm font-bold rounded-full shadow-sm"
          >
            {tag}
            <button onClick={() => onRemoveTag(tag)} className="hover:text-primary-dark">
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none text-secondary font-medium min-w-[120px]"
        />
      </div>
      
      {suggestions.length > 0 && (
         <div className="flex flex-wrap gap-2">
            {suggestions.filter(s => !tags.includes(s)).map(s => (
               <button 
                 key={s}
                 onClick={() => onAddTag(s)}
                 className="px-4 py-1.5 border border-gray-100 hover:border-primary hover:text-primary rounded-full text-xs font-bold text-secondary/40 transition-all"
               >
                 {s}
               </button>
            ))}
         </div>
      )}
    </div>
  );
};

export default TagSelector;
