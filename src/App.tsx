import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ShowcasePageView } from './components/ShowcasePageView';
import { CategoryPageView } from './components/CategoryPageView';
import { OtherPages } from './components/OtherPages';
import { InteractiveToolModal } from './components/InteractiveToolModal';
import { LetsTalkModal } from './components/LetsTalkModal';
import { SearchModal } from './components/SearchModal';
import { PageView, ToolCategory, ToolItem } from './types';
import { ALL_TOOLS } from './data/toolsData';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('product');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLetsTalkOpen, setIsLetsTalkOpen] = useState(false);

  // Sync hash routing on initial load and hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').toLowerCase();

      if (hash.startsWith('products/')) {
        const cat = hash.replace('products/', '') as ToolCategory;
        if (['pdf', 'image', 'video', 'audio', 'utility', 'ai'].includes(cat)) {
          setCurrentPage('category');
          setActiveCategory(cat);
          return;
        }
      }

      if (hash === 'product' || hash === 'products') {
        setCurrentPage('product');
        setActiveCategory('all');
        return;
      }

      if (hash === 'home' || hash === '') {
        setCurrentPage('product'); // Home directs to showcase as requested
        setActiveCategory('all');
        return;
      }

      if (['service', 'education', 'about', 'blog', 'contact', 'privacy'].includes(hash)) {
        setCurrentPage(hash as PageView);
        return;
      }

      // Check if direct tool link
      if (hash.startsWith('tools/')) {
        const toolRoute = `/${hash}`;
        const found = ALL_TOOLS.find((t) => t.route === toolRoute);
        if (found) {
          setSelectedTool(found);
          setCurrentPage('category');
          setActiveCategory(found.category);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Keyboard shortcut for search (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Navigation handler
  const handleNavigate = (page: PageView, category?: ToolCategory) => {
    if (page === 'home' || page === 'product') {
      setCurrentPage('product');
      setActiveCategory('all');
      window.location.hash = '#/product';
    } else if (page === 'category' && category && category !== 'all') {
      setCurrentPage('category');
      setActiveCategory(category);
      window.location.hash = `#/products/${category}`;
    } else {
      setCurrentPage(page);
      window.location.hash = `#/${page}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: ToolCategory) => {
    if (cat === 'all') {
      setCurrentPage('product');
      setActiveCategory('all');
      window.location.hash = '#/product';
    } else {
      setCurrentPage('category');
      setActiveCategory(cat);
      window.location.hash = `#/products/${cat}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTool = (tool: ToolItem) => {
    setSelectedTool(tool);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF7EF] text-[#102A43] font-sans antialiased selection:bg-[#FFF3DF] selection:text-[#D98218]">
      {/* Global Sticky Header */}
      <Header
        currentPage={currentPage}
        activeCategory={activeCategory}
        onNavigate={handleNavigate}
        onSelectCategory={handleSelectCategory}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLetsTalk={() => setIsLetsTalkOpen(true)}
      />

      {/* Main Page Content Body */}
      <main className="flex-1">
        {currentPage === 'product' && activeCategory === 'all' && (
          <ShowcasePageView
            onSelectCategory={handleSelectCategory}
            onSelectTool={handleSelectTool}
            onNavigateHome={() => handleNavigate('home')}
            onOpenLetsTalk={() => setIsLetsTalkOpen(true)}
          />
        )}

        {currentPage === 'category' && activeCategory !== 'all' && (
          <CategoryPageView
            category={activeCategory as Exclude<ToolCategory, 'all'>}
            onSelectCategory={handleSelectCategory}
            onSelectTool={handleSelectTool}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateProduct={() => handleNavigate('product', 'all')}
            onOpenLetsTalk={() => setIsLetsTalkOpen(true)}
          />
        )}

        {currentPage !== 'product' && currentPage !== 'category' && (
          <OtherPages
            page={currentPage}
            onNavigate={handleNavigate}
            onOpenLetsTalk={() => setIsLetsTalkOpen(true)}
          />
        )}
      </main>

      {/* Global Sticky / Standard Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenLetsTalk={() => setIsLetsTalkOpen(true)}
      />

      {/* Interactive Tool Modal / Studio */}
      {selectedTool && (
        <InteractiveToolModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}

      {/* Global Quick Search Modal (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={handleSelectTool}
        onSelectCategory={handleSelectCategory}
      />

      {/* Let's Talk Contact Drawer / Modal */}
      <LetsTalkModal
        isOpen={isLetsTalkOpen}
        onClose={() => setIsLetsTalkOpen(false)}
      />
    </div>
  );
}
