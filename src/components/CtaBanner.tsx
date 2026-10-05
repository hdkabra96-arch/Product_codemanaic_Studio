import React from 'react';
import { Rocket, ArrowRight } from 'lucide-react';
import { ToolCategory } from '../types';

interface CtaBannerProps {
  category: ToolCategory;
  onCtaClick: () => void;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({ category, onCtaClick }) => {
  const isAi = category === 'ai';

  const getHeading = () => {
    switch (category) {
      case 'pdf':
        return (
          <>
            Make Your <span className="text-[#F4A62A]">PDF Work Easier!</span>
          </>
        );
      case 'image':
        return (
          <>
            Make Your <span className="text-[#F4A62A]">Images Better in Seconds!</span>
          </>
        );
      case 'video':
        return (
          <>
            Make Your <span className="text-[#F4A62A]">Videos Better in Seconds!</span>
          </>
        );
      case 'audio':
        return (
          <>
            Make Your <span className="text-[#F4A62A]">Audio Work Easier!</span>
          </>
        );
      case 'utility':
        return (
          <>
            Make Your <span className="text-[#F4A62A]">Work More Productive!</span>
          </>
        );
      case 'ai':
        return (
          <>
            Powerful <span className="text-[#F4A62A]">AI Tools Are Coming Soon!</span>
          </>
        );
      default:
        return (
          <>
            Ready to Make <span className="text-[#F4A62A]">Your Work Easier?</span>
          </>
        );
    }
  };

  const getSubtitle = () => {
    if (isAi) {
      return "We're working on bringing the next generation of AI tools to make your work even easier.";
    }
    return 'Explore all our tools and experience fast, secure and high-quality results — anytime, anywhere.';
  };

  const getButtonText = () => {
    switch (category) {
      case 'pdf':
        return 'Explore All Tools →';
      case 'image':
        return 'Explore All Image Tools →';
      case 'video':
        return 'Explore All Video Tools →';
      case 'audio':
        return 'Explore All Audio Tools →';
      case 'utility':
        return 'Explore All Utility Tools →';
      case 'ai':
        return 'Notify Me When Available →';
      default:
        return 'Explore All Tools →';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#200B02] via-[#3E1605] to-[#B45309] text-white p-8 sm:p-10 lg:p-12 shadow-[0_16px_36px_rgba(32,11,2,0.25)] border border-amber-600/30">
      {/* Decorative background ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D98218]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-[#EA580C]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Decorative Script on right matching screenshot */}
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 font-handwriting text-3xl font-bold text-amber-200/20 select-none rotate-3 pointer-events-none text-right">
        Convert <br />
        Edit <br />
        Create <br />
        Simplify
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        {/* Left: Rocket & Title */}
        <div className="flex items-start sm:items-center gap-5 sm:gap-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#D98218] to-[#F4A62A] flex items-center justify-center shrink-0 shadow-[0_8px_20px_rgba(217,130,24,0.4)] border border-white/20">
            <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-pulse" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {getHeading()}
            </h2>
            <p className="text-sm sm:text-base text-amber-100/80 mt-2 max-w-xl">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="shrink-0 w-full sm:w-auto">
          <button
            onClick={onCtaClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white text-sm sm:text-base font-bold shadow-[0_6px_22px_rgba(217,130,24,0.45)] hover:shadow-[0_8px_28px_rgba(217,130,24,0.6)] hover:from-[#C66A08] hover:to-[#B35309] transition-all transform active:scale-95 cursor-pointer"
          >
            <span>{getButtonText().replace(' →', '')}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
