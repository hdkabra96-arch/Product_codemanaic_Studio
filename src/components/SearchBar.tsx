import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChange,
  placeholder = 'Search tools...',
}) => {
  return (
    <div className="relative w-full max-w-xs sm:max-w-sm">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 text-[#61758A] pointer-events-none stroke-[2.2]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-2.5 bg-white border border-[#E9DCC8] rounded-full text-sm text-[#102A43] placeholder-[#61758A] focus:outline-none focus:border-[#D98218] focus:ring-2 focus:ring-[#D98218]/20 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        />
        {query && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3.5 p-1 text-[#61758A] hover:text-[#102A43] transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
