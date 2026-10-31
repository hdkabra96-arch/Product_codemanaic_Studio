import React from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  FileCheck,
  Layers,
  Sparkles,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { ToolItem, PageView, ToolCategory } from '../types';
import { ALL_TOOLS, CATEGORIES_DATA } from '../data/toolsData';
import { ToolStudioRenderer } from './ToolStudioRenderer';
import { ToolCard } from './ToolCard';

interface DedicatedToolPageViewProps {
  tool: ToolItem;
  onNavigate: (page: PageView, category?: ToolCategory) => void;
  onSelectTool?: (tool: ToolItem) => void;
  onOpenLetsTalk?: () => void;
}

export const DedicatedToolPageView: React.FC<DedicatedToolPageViewProps> = ({
  tool,
  onNavigate,
  onSelectTool: _onSelectTool,
  onOpenLetsTalk,
}) => {
  const categoryInfo = CATEGORIES_DATA[tool.category];
  const categoryName = categoryInfo ? categoryInfo.name : `${tool.category.toUpperCase()} Tools`;

  // Filter 4-5 related tools from the same category
  const relatedTools = ALL_TOOLS.filter(
    (t) => t.category === tool.category && t.id !== tool.id
  ).slice(0, 5);

  // Formulate natural headline matching iLovePDF style
  const getToolHeadline = () => {
    const n = tool.name.trim();
    if (n.toLowerCase().endsWith('pdf') && !n.toLowerCase().includes('files') && !n.toLowerCase().includes('file')) {
      if (n.toLowerCase().includes('merge') || n.toLowerCase().includes('combine')) {
        return `${n} files`;
      }
      return `${n} file`;
    }
    return n;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${tool.name} - Codemaniac Studio`,
          text: tool.description,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EF] text-[#102A43] pb-20">
      {/* Top Breadcrumb & Quick Action Bar */}
      <div className="border-b border-[#E9DCC8] bg-white/70 backdrop-blur-sm sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          {/* Breadcrumb Links */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-[#61758A] truncate">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-[#D98218] transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#A0AEC0] shrink-0" />
            <button
              onClick={() => onNavigate('category', tool.category)}
              className="hover:text-[#D98218] transition-colors cursor-pointer capitalize"
            >
              {categoryName}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-[#A0AEC0] shrink-0" />
            <span className="text-[#102A43] font-bold truncate">{tool.name}</span>
          </nav>

          {/* Quick Share & Category return */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF5EC] hover:bg-[#FFF3DF] border border-[#E9DCC8] text-[11px] font-bold text-[#102A43] transition-colors cursor-pointer"
              title="Share this tool"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D98218]" />
              <span className="hidden sm:inline">Share Tool</span>
            </button>
            <button
              onClick={() => onNavigate('category', tool.category)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF3DF] hover:bg-[#F4A62A]/20 border border-[#F4A62A]/40 text-[11px] font-bold text-[#D98218] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All {categoryName}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Hero & Studio Area matching iLovePDF Image 2 */}
      <section className="pt-10 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center mb-8 sm:mb-12">
          {/* Badge */}
          {tool.badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tool.badge}</span>
            </div>
          )}

          {/* Headline matching Image 2 */}
          <h1 className="text-3xl sm:text-5xl font-black text-[#102A43] tracking-tight leading-tight">
            {getToolHeadline()}
          </h1>

          {/* Subtitle matching Image 2 */}
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-[#61758A] max-w-2xl mx-auto leading-relaxed">
            {tool.description}
          </p>

          {/* Privacy & Engine assurance tags */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-xs font-semibold text-[#61758A]">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Client-Side Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Instant Browser Processing
            </span>
            <span className="inline-flex items-center gap-1.5 text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              Zero Server Uploads
            </span>
          </div>
        </div>

        {/* Central Dedicated Studio Workspace */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-[#E9DCC8] shadow-[0_15px_50px_rgba(217,130,24,0.08)] p-6 sm:p-10 transition-all">
            <ToolStudioRenderer tool={tool} />
          </div>
        </div>
      </section>

      {/* 3-Step Guide Section matching iLovePDF & premier tool pages */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
            How to use {tool.name} in 3 simple steps
          </h2>
          <p className="text-xs sm:text-sm text-[#61758A] mt-1.5">
            Process your digital documents quickly with no software installation required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-black text-lg mb-4 shadow-xs">
              1
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-2">Select Your Files</h3>
            <p className="text-xs text-[#61758A] leading-relaxed">
              Upload from your computer, tablet, or phone, or simply drag and drop your files into the workspace.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-black text-lg mb-4 shadow-xs">
              2
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-2">Customize & Process</h3>
            <p className="text-xs text-[#61758A] leading-relaxed">
              Rearrange page order, select compression levels, or adjust parameters to match your exact needs.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E9DCC8] shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3DF] text-[#D98218] flex items-center justify-center font-black text-lg mb-4 shadow-xs">
              3
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-2">Download Instantly</h3>
            <p className="text-xs text-[#61758A] leading-relaxed">
              Get your finalized output immediately. Your original document quality is preserved with zero watermarks.
            </p>
          </div>
        </div>
      </section>

      {/* Security Guarantee Banner */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-[#FAF5EC] rounded-3xl border border-[#E9DCC8] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E9DCC8] flex items-center justify-center text-[#D98218] shrink-0 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A43]">
                Your Documents are 100% Safe & Private
              </h3>
              <p className="text-xs text-[#61758A] mt-1 max-w-xl leading-relaxed">
                We believe your data belongs to you alone. All processing is executed client-side directly within your browser. No files are uploaded to our servers, and no records are kept.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#102A43] border border-[#E9DCC8]">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ISO 32000-1</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-[#102A43] border border-[#E9DCC8]">
              <Lock className="w-3.5 h-3.5 text-[#D98218]" />
              <span>TLS / AES</span>
            </span>
          </div>
        </div>
      </section>

      {/* Related Tools in Same Category */}
      {relatedTools.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#102A43]">
                Other {categoryName} you might like
              </h2>
              <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                Explore more powerful client-side tools in the {categoryName} suite.
              </p>
            </div>
            <button
              onClick={() => onNavigate('category', tool.category)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D98218] hover:text-[#C66A08] transition-colors cursor-pointer"
            >
              <span>View all {categoryName}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {relatedTools.map((relTool) => (
              <ToolCard
                key={relTool.id}
                tool={relTool}
                onSelectTool={(_t) => {
                  window.open(`#/tools/${relTool.id}`, '_blank');
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Let's Talk CTA Section */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#102A43] to-[#243B53] text-white shadow-xl">
          <h3 className="text-xl sm:text-2xl font-black">Need Custom Tool Development or Enterprise Volume?</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
            We build customized document pipelines, SDKs, and offline offline web tool suites tailored to your workflow.
          </p>
          <button
            onClick={onOpenLetsTalk}
            className="mt-6 px-8 py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#F4A62A] text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Let's Talk
          </button>
        </div>
      </section>
    </div>
  );
};
