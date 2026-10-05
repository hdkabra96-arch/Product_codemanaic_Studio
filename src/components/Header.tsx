import React, { useState } from 'react';
import {
  Search,
  Menu,
  X,
  LayoutGrid,
  FileText,
  Image as ImageIcon,
  PlaySquare,
  Music,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { CodemaniacLogo } from './CodemaniacLogo';
import { PageView, ToolCategory } from '../types';

interface HeaderProps {
  currentPage: PageView;
  activeCategory: ToolCategory;
  onNavigate: (page: PageView, category?: ToolCategory) => void;
  onSelectCategory: (category: ToolCategory) => void;
  onOpenSearch: () => void;
  onOpenLetsTalk?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  activeCategory,
  onNavigate,
  onSelectCategory,
  onOpenSearch,
  onOpenLetsTalk: _onOpenLetsTalk,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Category pill items matching the Second Image
  const categoryMenuItems: {
    id: ToolCategory;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'all',
      label: 'All Products',
      icon: <LayoutGrid className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'pdf',
      label: 'PDF Tools',
      icon: <FileText className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'image',
      label: 'Image Tools',
      icon: <ImageIcon className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'video',
      label: 'Video Tools',
      icon: <PlaySquare className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'audio',
      label: 'Audio Tools',
      icon: <Music className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'utility',
      label: 'Utility Tools',
      icon: <Wrench className="w-4 h-4 stroke-[2.2]" />,
    },
    {
      id: 'ai',
      label: 'AI Tools',
      icon: <Sparkles className="w-4 h-4 stroke-[2.2]" />,
    },
  ];

  // Secondary pages under mobile menu
  const secondaryLinks: { label: string; page: PageView }[] = [
    { label: 'Service', page: 'service' },
    { label: 'Education Hub', page: 'education' },
    { label: 'About Us', page: 'about' },
    { label: 'Blog', page: 'blog' },
    { label: 'Contact Us', page: 'contact' },
    { label: 'Privacy Policy', page: 'privacy' },
  ];

  const handleCategoryClick = (catId: ToolCategory) => {
    onSelectCategory(catId);
    setMobileMenuOpen(false);
  };

  const handleSecondaryClick = (page: PageView) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBF7EF]/95 backdrop-blur-md border-b border-[#E9DCC8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <button
          onClick={() => {
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 text-left cursor-pointer focus:outline-none shrink-0"
        >
          <CodemaniacLogo />
        </button>

        {/* Center: The Category Menu from the Second Image */}
        <nav className="hidden xl:flex items-center gap-2 lg:gap-2.5 shrink-0 py-1">
          {categoryMenuItems.map((item) => {
            // Determine active state
            const isActive =
              (currentPage === 'product' && item.id === 'all') ||
              (currentPage === 'category' && activeCategory === item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleCategoryClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white shadow-[0_4px_14px_rgba(217,130,24,0.38)] scale-[1.02]'
                    : 'bg-white text-[#102A43] border border-[#E9DCC8] hover:border-[#D98218] hover:bg-[#FFF3DF]/60 hover:text-[#D98218]'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-[#D98218]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right side: Search Icon */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#102A43] hover:text-[#D98218] hover:bg-[#FFF3DF] transition-colors cursor-pointer border border-transparent hover:border-[#E9DCC8]"
            title="Search tools (Ctrl+K)"
            aria-label="Search tools"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Mobile menu hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-[#102A43] hover:bg-[#FFF3DF] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Menu className="w-6 h-6 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#FFFDF8] border-b border-[#E9DCC8] shadow-lg animate-in slide-in-from-top duration-200 max-h-[85vh] overflow-y-auto">
          <div className="px-5 py-4 space-y-4">
            {/* Category Menu Section in Mobile */}
            <div>
              <div className="text-[10px] font-bold text-[#61758A] uppercase tracking-wider mb-2">
                PRODUCT CATEGORIES
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categoryMenuItems.map((item) => {
                  const isActive =
                    (currentPage === 'product' && item.id === 'all') ||
                    (currentPage === 'category' && activeCategory === item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleCategoryClick(item.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white shadow-md'
                          : 'bg-white text-[#102A43] border border-[#E9DCC8] hover:border-[#D98218]'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-[#D98218]'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Other Pages in Mobile */}
            <div className="pt-2 border-t border-[#E9DCC8]">
              <div className="text-[10px] font-bold text-[#61758A] uppercase tracking-wider mb-2">
                COMPANY & HUB
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {secondaryLinks.map((link) => (
                  <button
                    key={link.page}
                    onClick={() => handleSecondaryClick(link.page)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      currentPage === link.page
                        ? 'bg-[#FFF3DF] text-[#D98218] font-bold'
                        : 'text-[#102A43] hover:bg-[#FBF7EF]'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

