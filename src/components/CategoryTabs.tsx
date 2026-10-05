import React from 'react';
import {
  LayoutGrid,
  FileText,
  Image as ImageIcon,
  PlaySquare,
  Music,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { ToolCategory } from '../types';

interface CategoryTabsProps {
  activeCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const categories: { id: ToolCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: 'all',
      label: 'All Products',
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      id: 'pdf',
      label: 'PDF Tools',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'image',
      label: 'Image Tools',
      icon: <ImageIcon className="w-4 h-4" />,
    },
    {
      id: 'video',
      label: 'Video Tools',
      icon: <PlaySquare className="w-4 h-4" />,
    },
    {
      id: 'audio',
      label: 'Audio Tools',
      icon: <Music className="w-4 h-4" />,
    },
    {
      id: 'utility',
      label: 'Utility Tools',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'ai',
      label: 'AI Tools',
      icon: <Sparkles className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="w-full overflow-x-auto no-scrollbar py-2"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-max">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white shadow-[0_4px_14px_rgba(217,130,24,0.35)]'
                  : 'bg-white text-[#102A43] border border-[#E9DCC8] hover:border-[#D98218] hover:bg-[#FFF3DF]/50 hover:text-[#D98218]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#D98218]'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
