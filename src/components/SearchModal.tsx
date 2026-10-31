import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Clock3 } from 'lucide-react';
import { ALL_TOOLS } from '../data/toolsData';
import { ToolItem, ToolCategory } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolItem) => void;
  onSelectCategory: (category: ToolCategory) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onSelectCategory,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<ToolCategory>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTools = ALL_TOOLS.filter((tool) => {
    const matchesCategory =
      activeCategoryFilter === 'all' || tool.category === activeCategoryFilter;
    const matchesQuery =
      query.trim() === '' ||
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.description.toLowerCase().includes(query.toLowerCase()) ||
      tool.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] rounded-3xl border border-[#E9DCC8] shadow-[0_20px_50px_rgba(16,42,67,0.3)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 bg-[#FAF5EC] border-b border-[#E9DCC8] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#D98218] shrink-0 stroke-[2.2]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search across all ${ALL_TOOLS.length} Codemaniac tools (e.g. Merge PDF, Sign PDF, PDF to Word)...`}
            className="w-full bg-transparent text-sm sm:text-base text-[#102A43] placeholder-[#61758A] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#61758A] hover:text-[#102A43] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md bg-white border border-[#E9DCC8] text-[10px] font-mono text-[#61758A] hover:text-[#102A43] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Category Filters */}
        <div
          className="px-4 py-2.5 bg-white border-b border-[#E9DCC8] flex items-center gap-2 overflow-x-auto no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(
            [
              { id: 'all', label: 'All (72)' },
              { id: 'pdf', label: 'PDF (15)' },
              { id: 'image', label: 'Image (14)' },
              { id: 'video', label: 'Video (12)' },
              { id: 'audio', label: 'Audio (7)' },
              { id: 'utility', label: 'Utility (14)' },
              { id: 'ai', label: 'AI (10)' },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategoryFilter(c.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                activeCategoryFilter === c.id
                  ? 'bg-[#D98218] text-white'
                  : 'bg-[#FAF5EC] text-[#61758A] hover:text-[#102A43] border border-[#E9DCC8]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12 text-[#61758A]">
              <p className="text-sm">No tools matching "{query}"</p>
              <p className="text-xs mt-1">Try searching for PDF, Image, Video, or QR.</p>
            </div>
          ) : (
            filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => {
                  window.open(`#/tools/${tool.id}`, '_blank');
                  onClose();
                }}
                className="group p-3 rounded-2xl bg-white hover:bg-[#FFF3DF]/50 border border-[#E9DCC8] hover:border-[#D98218] transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${tool.badgeBg}`}
                  >
                    {tool.category.toUpperCase().slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#102A43] group-hover:text-[#D98218] transition-colors">
                        {tool.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold text-[#61758A] bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#E9DCC8]">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#61758A] line-clamp-1">{tool.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {tool.status === 'coming_soon' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D98218] bg-[#FFF3DF] px-2 py-0.5 rounded-full border border-[#F4A62A]/30">
                      <Clock3 className="w-3 h-3" /> Coming Soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D98218] group-hover:translate-x-1 transition-transform">
                      Try Now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 bg-[#FAF5EC] border-t border-[#E9DCC8] flex items-center justify-between text-xs text-[#61758A]">
          <span>Found {filteredTools.length} tools</span>
          {activeCategoryFilter !== 'all' && (
            <button
              onClick={() => {
                onSelectCategory(activeCategoryFilter);
                onClose();
              }}
              className="text-[#D98218] font-bold hover:underline cursor-pointer"
            >
              Open {activeCategoryFilter.toUpperCase()} Tools Category Page →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
