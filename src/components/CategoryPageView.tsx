import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Zap,
  Cloud,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { ToolCategory, ToolItem } from '../types';
import { CATEGORIES_DATA, ALL_TOOLS } from '../data/toolsData';
import { HeroWorkspaceVisual } from './HeroWorkspaceVisual';
import { CategoryTabs } from './CategoryTabs';
import { SearchBar } from './SearchBar';
import { ToolCard } from './ToolCard';
import { WhyUseIllustration } from './WhyUseIllustration';
import { CtaBanner } from './CtaBanner';

interface CategoryPageViewProps {
  category: Exclude<ToolCategory, 'all'>;
  onSelectCategory: (category: ToolCategory) => void;
  onSelectTool: (tool: ToolItem) => void;
  onNavigateHome: () => void;
  onNavigateProduct: () => void;
  onOpenLetsTalk: () => void;
}

export const CategoryPageView: React.FC<CategoryPageViewProps> = ({
  category,
  onSelectCategory,
  onSelectTool,
  onNavigateHome,
  onNavigateProduct,
  onOpenLetsTalk,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const categoryInfo = CATEGORIES_DATA[category];

  const categoryTools = ALL_TOOLS.filter((t) => t.category === category);
  const filteredTools = categoryTools.filter((t) => {
    const matchesSub =
      selectedSubCategory === 'all' ||
      !t.subCategory ||
      t.subCategory === selectedSubCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSub && matchesSearch;
  });

  const PDF_SUB_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'organize', label: 'Organize PDF' },
    { id: 'optimize', label: 'Optimize PDF' },
    { id: 'convert', label: 'Convert PDF' },
    { id: 'edit', label: 'Edit PDF' },
    { id: 'security', label: 'PDF Security' },
    { id: 'intelligence', label: 'PDF Intelligence' },
  ];

  const IMAGE_SUB_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'optimize', label: 'Optimize' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit' },
    { id: 'convert', label: 'Convert' },
    { id: 'security', label: 'Security' },
  ];

  const activeSubCategories =
    category === 'pdf'
      ? PDF_SUB_CATEGORIES
      : category === 'image'
      ? IMAGE_SUB_CATEGORIES
      : null;

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Section Container */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-8 sm:pb-12 bg-gradient-to-b from-[#FFFDF8] via-[#FAF5EC] to-[#FBF7EF] border-b border-[#E9DCC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb matching screenshots */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#61758A] mb-8 font-medium">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#D98218] transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <button
              onClick={onNavigateProduct}
              className="hover:text-[#D98218] transition-colors cursor-pointer"
            >
              Product
            </button>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[#D98218] font-bold">{categoryInfo.name}</span>
          </nav>

          {/* Hero Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Category Badge matching screenshots */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FFF3DF] border border-[#F4A62A]/40 text-[#D98218] text-xs font-extrabold tracking-wider uppercase shadow-xs">
                {categoryInfo.badgeText}
              </div>

              {/* Main Heading with Orange Highlight */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#102A43] tracking-tight leading-[1.1]">
                {categoryInfo.heroTitleLead}{' '}
                <span className="text-[#D98218] block sm:inline">
                  {categoryInfo.heroTitleHighlight}
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-[#61758A] leading-relaxed max-w-xl">
                {categoryInfo.heroDescription}
              </p>

              {/* 4 Benefit Indicators matching screenshots */}
              <div className="pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E9DCC8] shadow-[0_4px_16px_rgba(217,130,24,0.06)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
                      <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#102A43]">100%</div>
                      <div className="text-[10px] text-[#61758A] font-semibold leading-tight">
                        Secure & Private
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
                      <Users className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#102A43]">Easy to Use</div>
                      <div className="text-[10px] text-[#61758A] font-semibold leading-tight">
                        No Installation
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
                      <Zap className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#102A43]">Fast Processing</div>
                      <div className="text-[10px] text-[#61758A] font-semibold leading-tight">
                        Instant Results
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
                      <Cloud className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#102A43]">Works Anywhere</div>
                      <div className="text-[10px] text-[#61758A] font-semibold leading-tight">
                        On Any Device
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Column (3D Workspace) */}
            <div className="lg:col-span-6 flex justify-center">
              <HeroWorkspaceVisual category={category} />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Category Switcher Tabs */}
        <div>
          <CategoryTabs
            activeCategory={category}
            onSelectCategory={onSelectCategory}
          />
        </div>

        {/* Explore Tools Section */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102A43] tracking-tight">
                Explore{' '}
                <span className="text-[#D98218]">{categoryInfo.name}</span>
              </h2>
              <p className="text-sm sm:text-base text-[#61758A] mt-1">
                {categoryInfo.exploreSubtitle}
              </p>
            </div>

            {/* Search Bar */}
            <SearchBar
              query={searchQuery}
              onChange={setSearchQuery}
              placeholder={categoryInfo.searchPlaceholder}
            />
          </div>

          {/* Subcategory Filter Pills for PDF & Image Suites (matching iLovePDF & iLoveIMG) */}
          {activeSubCategories && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {activeSubCategories.map((sub) => {
                  const isSelected = selectedSubCategory === sub.id;
                  const count =
                    sub.id === 'all'
                      ? categoryTools.length
                      : categoryTools.filter((t) => t.subCategory === sub.id).length;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubCategory(sub.id)}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shadow-xs ${
                        isSelected
                          ? 'bg-[#102A43] text-white shadow-md'
                          : 'bg-white text-[#61758A] border border-[#E9DCC8] hover:border-[#D98218] hover:text-[#D98218]'
                      }`}
                    >
                      <span>{sub.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#FAF5EC] text-[#61758A]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Filter Indicator */}
              <div className="flex items-center justify-between text-xs text-[#61758A] px-1">
                <span>
                  Showing <strong className="text-[#102A43]">{filteredTools.length}</strong> of{' '}
                  <strong className="text-[#102A43]">{categoryTools.length}</strong> {category.toUpperCase()} tools
                  {selectedSubCategory !== 'all' && (
                    <> in <span className="text-[#D98218] font-bold">{activeSubCategories.find((s) => s.id === selectedSubCategory)?.label}</span></>
                  )}
                </span>
                {(selectedSubCategory !== 'all' || searchQuery.trim() !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubCategory('all');
                      setSearchQuery('');
                    }}
                    className="text-[#D98218] hover:underline font-semibold cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tools Grid matching screenshots: 4 to 5 cards per row on desktop */}
          {filteredTools.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#E9DCC8]">
              <p className="text-base font-bold text-[#102A43]">
                No tools found matching "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-4 py-2 rounded-full bg-[#FFF3DF] text-[#D98218] text-xs font-bold hover:bg-[#D98218] hover:text-white transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelectTool={onSelectTool}
                />
              ))}
            </div>
          )}
        </section>

        {/* Why Use Our [Category] Tools Section matching screenshots */}
        <section className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Category Illustration */}
            <div className="lg:col-span-5">
              <WhyUseIllustration category={category} />
            </div>

            {/* Right: Why Content with 2x2 Feature Grid */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#102A43] tracking-tight">
                Why Use Our{' '}
                <span className="text-[#D98218]">{categoryInfo.name}?</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {categoryInfo.benefits.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-[#E9DCC8] shadow-[0_2px_12px_rgba(217,130,24,0.04)] flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
                      {b.icon === 'ShieldCheck' && <ShieldCheck className="w-5 h-5 stroke-[2.2]" />}
                      {b.icon === 'Users' && <Users className="w-5 h-5 stroke-[2.2]" />}
                      {b.icon === 'Zap' && <Zap className="w-5 h-5 stroke-[2.2]" />}
                      {b.icon === 'Cloud' && <Cloud className="w-5 h-5 stroke-[2.2]" />}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#102A43]">{b.title}</h4>
                      <p className="text-xs sm:text-sm text-[#61758A] mt-1 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Large CTA Banner matching screenshots */}
        <section className="pt-4">
          <CtaBanner
            category={category}
            onCtaClick={() => {
              if (category === 'ai') {
                onOpenLetsTalk();
              } else {
                onSelectCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        </section>
      </div>
    </div>
  );
};
