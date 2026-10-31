import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ShowcasePageView } from './components/ShowcasePageView';
import { CategoryPageView } from './components/CategoryPageView';
import { DedicatedToolPageView } from './components/DedicatedToolPageView';
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
      const rawHash = window.location.hash.replace('#/', '').toLowerCase();

      // Check if direct tool link (e.g. #/tools/pdf-merge or #/tools/merge-pdf)
      if (rawHash.startsWith('tools/')) {
        const toolId = rawHash.replace(/^tools\//, '').replace(/^\//, '');
        const found = ALL_TOOLS.find(
          (t) =>
            t.id.toLowerCase() === toolId ||
            t.route.toLowerCase() === `/${rawHash}` ||
            t.route.toLowerCase() === `/tools/${toolId}` ||
            t.id.toLowerCase() === toolId.replace(/_/g, '-')
        );
        if (found) {
          setSelectedTool(found);
          setCurrentPage('tool');
          setActiveCategory(found.category);
          document.title = `${found.name} - Codemaniac Studio`;
          return;
        }
      }

      // Also support direct iLovePDF aliases (e.g. #/merge_pdf or #/pdf-merge)
      const directTool = ALL_TOOLS.find(
        (t) =>
          t.id.toLowerCase() === rawHash ||
          t.id.toLowerCase() === rawHash.replace(/_/g, '-') ||
          t.route.toLowerCase() === `/${rawHash}` ||
          (rawHash.endsWith('_pdf') && t.id.toLowerCase() === `pdf-${rawHash.replace('_pdf', '')}`)
      );
      if (directTool) {
        setSelectedTool(directTool);
        setCurrentPage('tool');
        setActiveCategory(directTool.category);
        document.title = `${directTool.name} - Codemaniac Studio`;
        return;
      }

      if (rawHash.startsWith('products/')) {
        const cat = rawHash.replace('products/', '') as ToolCategory;
        if (['pdf', 'image', 'video', 'audio', 'utility', 'ai'].includes(cat)) {
          setCurrentPage('category');
          setActiveCategory(cat);
          document.title = `${cat.toUpperCase()} Tools - Codemaniac Studio`;
          return;
        }
      }

      if (rawHash === 'product' || rawHash === 'products') {
        setCurrentPage('product');
        setActiveCategory('all');
        document.title = 'All Tools & Products - Codemaniac Studio';
        return;
      }

      if (rawHash === 'home' || rawHash === '') {
        setCurrentPage('product');
        setActiveCategory('all');
        document.title = 'Codemaniac Studio - Online Tools Platform';
        return;
      }

      if (['service', 'education', 'about', 'blog', 'contact', 'privacy'].includes(rawHash)) {
        setCurrentPage(rawHash as PageView);
        document.title = `${rawHash.toUpperCase()} - Codemaniac Studio`;
        return;
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
    window.open(`#/tools/${tool.id}`, '_blank');
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

        {currentPage === 'tool' && selectedTool && (
          <DedicatedToolPageView
            tool={selectedTool}
            onNavigate={handleNavigate}
            onSelectTool={handleSelectTool}
            onOpenLetsTalk={() => setIsLetsTalkOpen(true)}
          />
        )}

        {currentPage !== 'product' && currentPage !== 'category' && currentPage !== 'tool' && (
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
      {selectedTool && currentPage !== 'tool' && (
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
