import React from 'react';
import {
  ShieldCheck,
  Users,
  Star,
  Clock,
  ChevronRight,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  PlaySquare,
  Music,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { ToolCategory, ToolItem } from '../types';
import { ALL_TOOLS } from '../data/toolsData';
import { HeroWorkspaceVisual } from './HeroWorkspaceVisual';
import { CategoryTabs } from './CategoryTabs';
import { ToolCard } from './ToolCard';
import { CtaBanner } from './CtaBanner';

interface ShowcasePageViewProps {
  onSelectCategory: (category: ToolCategory) => void;
  onSelectTool: (tool: ToolItem) => void;
  onNavigateHome: () => void;
  onOpenLetsTalk: () => void;
}

export const ShowcasePageView: React.FC<ShowcasePageViewProps> = ({
  onSelectCategory,
  onSelectTool,
  onNavigateHome,
  onOpenLetsTalk: _onOpenLetsTalk,
}) => {
  // Category sections configuration with exact featured tools from prompt
  const sections: {
    category: Exclude<ToolCategory, 'all'>;
    title: string;
    subtitle: string;
    buttonLabel: string;
    icon: React.ReactNode;
    toolIds: string[];
    isAi?: boolean;
  }[] = [
    {
      category: 'pdf',
      title: 'PDF Tools',
      subtitle: 'Convert, edit and manage your PDFs easily.',
      buttonLabel: 'View All PDF Tools →',
      icon: <FileText className="w-5 h-5 text-red-500" />,
      toolIds: [
        'pdf-to-word',
        'word-to-pdf',
        'pdf-merge',
        'pdf-split',
        'pdf-compressor',
        'pdf-editor',
      ],
    },
    {
      category: 'image',
      title: 'Image Tools',
      subtitle: 'Convert, resize and enhance your images with ease.',
      buttonLabel: 'View All Image Tools →',
      icon: <ImageIcon className="w-5 h-5 text-sky-500" />,
      toolIds: [
        'image-conversion',
        'image-compressor',
        'image-resizer',
        'image-cropper',
        'image-to-text-ocr',
        'background-remover',
      ],
    },
    {
      category: 'video',
      title: 'Video Tools',
      subtitle: 'Edit, convert and optimize your videos easily.',
      buttonLabel: 'View All Video Tools →',
      icon: <PlaySquare className="w-5 h-5 text-purple-600" />,
      toolIds: [
        'video-conversion',
        'video-compressor',
        'video-trimmer',
        'video-to-mp3',
        'video-to-gif',
      ],
    },
    {
      category: 'audio',
      title: 'Audio Tools',
      subtitle: 'Convert, edit and manage your audio files.',
      buttonLabel: 'View All Audio Tools →',
      icon: <Music className="w-5 h-5 text-pink-500" />,
      toolIds: [
        'audio-converter',
        'audio-compressor',
        'audio-cutter',
      ],
    },
    {
      category: 'utility',
      title: 'Utility Tools',
      subtitle: 'Everyday tools to make your digital work easier.',
      buttonLabel: 'View All Utility Tools →',
      icon: <Wrench className="w-5 h-5 text-amber-500" />,
      toolIds: [
        'qr-code-generator',
        'password-generator',
        'word-counter',
        'json-formatter',
        'url-encoder-decoder',
        'color-picker',
        'timestamp-converter',
      ],
    },
    {
      category: 'ai',
      title: 'AI Tools',
      subtitle: 'Next generation AI tools to boost your productivity.',
      buttonLabel: 'View All AI Tools →',
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      toolIds: [
        'ai-image-editor',
        'ai-image-enhancer',
        'ai-background-remover',
        'ai-pdf-summarizer',
        'ai-document-analyzer',
      ],
      isAi: true,
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* Hero Section Container */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-8 sm:pb-12 bg-gradient-to-b from-[#FFFDF8] via-[#FAF5EC] to-[#FBF7EF] border-b border-[#E9DCC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb: Home > Product */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#61758A] mb-8 font-medium">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#D98218] transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="text-[#D98218] font-bold">Product</span>
          </nav>

          {/* Hero Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#FFF3DF] border border-[#F4A62A]/40 text-[#D98218] text-xs font-extrabold tracking-wider uppercase shadow-xs">
                OUR PRODUCTS
              </div>

              {/* Main Heading with Orange Highlight */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#102A43] tracking-tight leading-[1.1]">
                Powerful Tools{' '}
                <span className="text-[#D98218] block sm:inline">
                  for Everyday Needs
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-[#61758A] leading-relaxed max-w-xl">
                Simple online tools to convert, edit, compress, create and manage your digital files — fast, secure and easy to use.
              </p>

              {/* 4 Statistics matching screenshot */}
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
                      <div className="text-xs font-extrabold text-[#102A43]">10K+</div>
                      <div className="text-[10px] text-[#61758A] font-semibold leading-tight">
                        Happy Users
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
                      <Star className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#102A43]">4.9/5</div>
                      <div className="text-[10px] text-[#61758A] font-semibold leading-tight">
                        User Rating
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF3DF] flex items-center justify-center text-[#D98218] shrink-0">
                      <Clock className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#102A43]">24/7</div>
                      <div className="text-[10px] text-[#61758A] font-semibold leading-tight">
                        Support
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Column (3D Workspace) */}
            <div className="lg:col-span-6 flex justify-center">
              <HeroWorkspaceVisual category="all" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Category Navigation Bar */}
        <div>
          <CategoryTabs
            activeCategory="all"
            onSelectCategory={onSelectCategory}
          />
        </div>

        {/* Product Category Sections (Organized cleanly per Requirement 5) */}
        <div className="space-y-16">
          {sections.map((sec) => {
            const sectionTools = sec.toolIds
              .map((id) => ALL_TOOLS.find((t) => t.id === id))
              .filter(Boolean) as ToolItem[];

            return (
              <section
                key={sec.category}
                className="space-y-6 pt-4 border-t border-[#E9DCC8]/60 first:border-t-0"
              >
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E9DCC8] shadow-xs flex items-center justify-center">
                      {sec.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-[#102A43]">
                          {sec.title}
                        </h2>
                        {sec.isAi && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF3DF] text-[#D98218] border border-[#F4A62A]/40">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#61758A] mt-0.5">
                        {sec.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* "View All [Category] Tools →" Outline Button matching screenshot */}
                  <button
                    onClick={() => {
                      onSelectCategory(sec.category);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E9DCC8] text-xs sm:text-sm font-bold text-[#102A43] hover:text-[#D98218] hover:border-[#D98218] hover:bg-[#FFF3DF]/40 transition-all cursor-pointer w-fit"
                  >
                    <span>{sec.buttonLabel.replace(' →', '')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {sectionTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      onSelectTool={onSelectTool}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Large CTA Banner matching screenshot */}
        <section className="pt-4">
          <CtaBanner
            category="all"
            onCtaClick={() => {
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
          />
        </section>
      </div>
    </div>
  );
};
