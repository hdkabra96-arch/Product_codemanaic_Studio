import React, { useState } from 'react';
import { ToolCategory } from '../types';
import { Sparkles, Bot } from 'lucide-react';

interface HeroWorkspaceVisualProps {
  category: ToolCategory;
}

export const HeroWorkspaceVisual: React.FC<HeroWorkspaceVisualProps> = ({ category }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Badges per category matching screenshots
  const getFloatingBadges = () => {
    switch (category) {
      case 'pdf':
        return [
          { text: 'PDF', bg: 'bg-[#EF4444]', textCol: 'text-white', top: '10%', left: '8%', delay: '0s' },
          { text: 'Word', bg: 'bg-[#2563EB]', textCol: 'text-white', top: '2%', left: '46%', delay: '0.6s' },
          { text: 'Excel', bg: 'bg-[#059669]', textCol: 'text-white', top: '12%', right: '12%', delay: '1.2s' },
          { text: 'PPT', bg: 'bg-[#EA580C]', textCol: 'text-white', bottom: '26%', right: '4%', delay: '1.8s' },
        ];
      case 'image':
        return [
          { text: 'JPG', bg: 'bg-[#0284C7]', textCol: 'text-white', top: '10%', left: '8%', delay: '0s' },
          { text: 'PNG', bg: 'bg-[#059669]', textCol: 'text-white', top: '2%', left: '46%', delay: '0.5s' },
          { text: 'WEBP', bg: 'bg-[#7C3AED]', textCol: 'text-white', top: '12%', right: '12%', delay: '1.1s' },
          { text: 'OCR', bg: 'bg-[#EA580C]', textCol: 'text-white', bottom: '24%', right: '6%', delay: '1.6s' },
        ];
      case 'video':
        return [
          { text: 'MP4', bg: 'bg-[#0284C7]', textCol: 'text-white', top: '10%', left: '6%', delay: '0s' },
          { text: 'MOV', bg: 'bg-[#059669]', textCol: 'text-white', top: '2%', left: '38%', delay: '0.4s' },
          { text: 'AVI', bg: 'bg-[#0D9488]', textCol: 'text-white', top: '2%', right: '34%', delay: '0.8s' },
          { text: 'GIF', bg: 'bg-[#EA580C]', textCol: 'text-white', top: '12%', right: '10%', delay: '1.2s' },
        ];
      case 'audio':
        return [
          { text: 'MP3', bg: 'bg-[#0284C7]', textCol: 'text-white', top: '10%', left: '8%', delay: '0s' },
          { text: 'WAV', bg: 'bg-[#059669]', textCol: 'text-white', top: '2%', left: '44%', delay: '0.5s' },
          { text: 'AAC', bg: 'bg-[#EA580C]', textCol: 'text-white', top: '12%', right: '14%', delay: '1.0s' },
          { text: 'FLAC', bg: 'bg-[#7C3AED]', textCol: 'text-white', bottom: '28%', right: '6%', delay: '1.5s' },
        ];
      case 'utility':
        return [
          { text: 'QR', bg: 'bg-[#0284C7]', textCol: 'text-white', top: '8%', left: '10%', delay: '0s' },
          { text: '{JSON}', bg: 'bg-[#059669]', textCol: 'text-white', top: '2%', left: '45%', delay: '0.5s' },
          { text: 'HASH', bg: 'bg-[#7C3AED]', textCol: 'text-white', top: '10%', right: '12%', delay: '1.1s' },
          { text: 'LOCK', bg: 'bg-[#D97706]', textCol: 'text-white', bottom: '26%', right: '4%', delay: '1.6s' },
        ];
      case 'ai':
        return [
          { text: 'AI Vision', bg: 'bg-[#0284C7]', textCol: 'text-white', top: '8%', left: '8%', delay: '0s' },
          { text: 'Summarize', bg: 'bg-[#EF4444]', textCol: 'text-white', top: '2%', left: '44%', delay: '0.6s' },
          { text: 'Generate', bg: 'bg-[#7C3AED]', textCol: 'text-white', top: '10%', right: '10%', delay: '1.2s' },
          { text: 'Enhance', bg: 'bg-[#059669]', textCol: 'text-white', bottom: '24%', right: '4%', delay: '1.8s' },
        ];
      default: // all / showcase
        return [
          { text: 'PDF', bg: 'bg-[#EF4444]', textCol: 'text-white', top: '12%', left: '8%', delay: '0s' },
          { text: 'Word', bg: 'bg-[#2563EB]', textCol: 'text-white', top: '2%', left: '38%', delay: '0.5s' },
          { text: 'Excel', bg: 'bg-[#059669]', textCol: 'text-white', top: '2%', right: '34%', delay: '1.0s' },
          { text: 'MP3', bg: 'bg-[#F43F5E]', textCol: 'text-white', top: '12%', right: '8%', delay: '1.5s' },
        ];
    }
  };

  const badges = getFloatingBadges();

  return (
    <div
      data-three-scene-slot="hero-3d"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[16/10] max-w-2xl mx-auto flex items-center justify-center select-none"
    >
      {/* Soft warm golden/orange glow background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#FFF3DF] via-[#FDE6BA]/30 to-transparent rounded-3xl -z-10 blur-2xl transform scale-95" />

      {/* 3D Transform Container responding subtly to mouse */}
      <div
        style={{
          transform: `perspective(1000px) rotateY(${mousePos.x * 0.4}deg) rotateX(${-mousePos.y * 0.4}deg)`,
          transition: 'transform 0.25s ease-out',
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Desk Surface Shadow */}
        <div className="absolute bottom-6 w-[85%] h-14 bg-gradient-to-t from-[#D98218]/15 via-[#102A43]/8 to-transparent rounded-[100%] blur-xl" />

        {/* Hand-lettered decorative slogan on top right (matching screenshots) */}
        <div className="absolute -top-3 right-4 sm:right-6 lg:-right-2 z-20 pointer-events-none rotate-3 sm:rotate-6">
          <div className="font-handwriting text-xl sm:text-2xl text-[#102A43] font-bold tracking-wide leading-tight drop-shadow-sm text-right">
            {category === 'pdf' && (
              <>
                Manage <br />
                <span className="text-[#D98218]">Your PDFs</span> <br />
                Smarter !
              </>
            )}
            {category === 'image' && (
              <>
                Edit <br />
                <span className="text-[#D98218]">Convert</span> <br />
                Enhance Any Image !
              </>
            )}
            {category === 'video' && (
              <>
                Edit <br />
                <span className="text-[#D98218]">Convert</span> <br />
                Enhance Any Video !
              </>
            )}
            {category === 'audio' && (
              <>
                Edit <br />
                <span className="text-[#D98218]">Convert</span> <br />
                Compress Audio !
              </>
            )}
            {category === 'utility' && (
              <>
                Small Tools <br />
                <span className="text-[#D98218]">Big</span> <br />
                Productivity !
              </>
            )}
            {category === 'ai' && (
              <>
                Smarter <br />
                <span className="text-[#D98218]">Tools</span> <br />
                Brighter Ideas !
              </>
            )}
            {category === 'all' && (
              <>
                Your <br />
                <span className="text-[#D98218]">Daily Tools</span> <br />
                For a Smarter Tomorrow !
              </>
            )}
          </div>
        </div>

        {/* Floating Badges with gentle floating animation */}
        {badges.map((b, i) => (
          <div
            key={i}
            style={{
              top: b.top,
              left: b.left,
              right: b.right,
              bottom: b.bottom,
              animation: `float-badge 3.2s ease-in-out infinite alternate ${b.delay}`,
            }}
            className={`absolute z-30 px-3.5 py-1.5 rounded-xl ${b.bg} ${b.textCol} text-xs sm:text-sm font-extrabold shadow-[0_8px_18px_rgba(0,0,0,0.12)] border border-white/50 backdrop-blur-sm flex items-center gap-1.5`}
          >
            <Sparkles className="w-3 h-3 opacity-90" />
            <span>{b.text}</span>
          </div>
        ))}

        {/* Left Coffee Mug with CM Logo */}
        <div className="absolute bottom-10 left-3 sm:left-8 z-20 w-14 sm:w-18 h-18 sm:h-22">
          <div className="relative w-full h-full bg-gradient-to-r from-[#FAF5EC] to-[#FFFFFF] rounded-b-2xl rounded-t-sm shadow-[0_8px_16px_rgba(0,0,0,0.1)] border border-[#E9DCC8] flex flex-col items-center justify-center p-1.5">
            {/* CM brand mark on mug */}
            <div className="w-6 h-6 rounded bg-[#D98218] flex items-center justify-center text-[10px] font-black text-white shadow-inner">
              CM
            </div>
            <span className="text-[7px] font-bold text-[#102A43] tracking-tighter mt-1">
              CODEMANIAC
            </span>
            {/* Mug handle */}
            <div className="absolute -left-3 top-3 w-3 h-7 border-2 border-[#E9DCC8] rounded-l-full bg-transparent" />
          </div>
        </div>

        {/* Right Stack of Books with embossed spine text */}
        <div className="absolute bottom-8 right-2 sm:right-6 z-20 w-24 sm:w-32 flex flex-col gap-1">
          {[
            { title: 'CONVERT', bg: 'bg-[#2A1810] text-[#F4A62A]' },
            { title: 'EDIT', bg: 'bg-[#1C2833] text-[#FBF7EF]' },
            { title: 'CREATE', bg: 'bg-[#1E3A8A] text-[#93C5FD]' },
            { title: 'SIMPLIFY', bg: 'bg-[#064E3B] text-[#A7F3D0]' },
          ].map((bk, idx) => (
            <div
              key={idx}
              className={`h-4 sm:h-5 rounded-r-md rounded-l-xs ${bk.bg} shadow-md border-l-4 border-amber-600/40 flex items-center px-2 font-mono text-[8px] sm:text-[9px] font-bold tracking-widest`}
            >
              {bk.title}
            </div>
          ))}
        </div>

        {/* Center Main Stage: The Laptop */}
        <div className="relative z-10 w-[78%] sm:w-[72%] max-w-lg aspect-[16/10] bg-[#18181B] rounded-2xl p-2.5 sm:p-3.5 shadow-[0_20px_45px_rgba(16,42,67,0.22)] border-2 border-[#3F3F46]">
          {/* Laptop Screen Bezel */}
          <div className="w-full h-full bg-[#102A43] rounded-xl overflow-hidden relative flex flex-col border border-white/10 shadow-inner">
            {/* Top Bar of laptop */}
            <div className="h-5 bg-[#0B1D2E] px-2.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              </div>
              <div className="text-[8px] font-medium text-amber-200/80 tracking-wider">
                CODEMANIAC STUDIO OS
              </div>
              <div className="w-2 h-2 rounded-full bg-white/20" />
            </div>

            {/* Laptop Screen Content Body */}
            <div className="flex-1 bg-gradient-to-br from-[#102A43] via-[#0D2135] to-[#153450] p-3 flex flex-col justify-between relative overflow-hidden">
              {/* Subtle grid background on screen */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D98218_1px,transparent_1px)] [background-size:12px_12px]" />

              {/* Header on screen */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-[#D98218] flex items-center justify-center text-[9px] font-black text-white">
                    CM
                  </div>
                  <span className="text-[10px] font-bold text-white tracking-wide">
                    {category === 'pdf'
                      ? 'PDF Workspace'
                      : category === 'image'
                      ? 'Image Studio'
                      : category === 'video'
                      ? 'Video Suite'
                      : category === 'audio'
                      ? 'Audio Lab'
                      : category === 'utility'
                      ? 'Utility Deck'
                      : category === 'ai'
                      ? 'AI Engine'
                      : 'All-in-One Studio'}
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-[#FFF3DF]/20 border border-[#D98218]/40 text-[8px] text-[#F4A62A] font-semibold">
                  v2.6 Live
                </div>
              </div>

              {/* Dynamic Center Graphic on laptop display */}
              <div className="relative z-10 flex items-center justify-center my-auto">
                {category === 'ai' ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#D98218] to-[#F4A62A] flex items-center justify-center shadow-lg text-white mb-2 animate-bounce">
                      <Bot className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <span className="text-[11px] font-bold text-amber-200">
                      Next-Gen AI Core
                    </span>
                    <span className="text-[8px] text-white/70">
                      Neural File Processing
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
                    {[
                      { l: 'Convert', icon: '⇄', col: 'bg-amber-500/20 text-amber-300' },
                      { l: 'Optimize', icon: '⚡', col: 'bg-emerald-500/20 text-emerald-300' },
                      { l: 'Secure', icon: '🔒', col: 'bg-blue-500/20 text-blue-300' },
                      { l: 'Extract', icon: '📄', col: 'bg-rose-500/20 text-rose-300' },
                      { l: 'Enhance', icon: '✨', col: 'bg-purple-500/20 text-purple-300' },
                      { l: 'Export', icon: '↓', col: 'bg-teal-500/20 text-teal-300' },
                    ].map((tile, tidx) => (
                      <div
                        key={tidx}
                        className={`rounded-lg p-1.5 flex flex-col items-center justify-center border border-white/10 ${tile.col}`}
                      >
                        <span className="text-xs">{tile.icon}</span>
                        <span className="text-[8px] font-medium tracking-tight mt-0.5">
                          {tile.l}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom status bar on laptop display */}
              <div className="relative z-10 flex items-center justify-between text-[8px] text-white/60 pt-1 border-t border-white/10">
                <span>Codemaniac Core 100% Ready</span>
                <span className="text-emerald-400 font-semibold">● AES-256 Encrypted</span>
              </div>
            </div>
          </div>

          {/* Laptop Base (Hinge & keyboard base) */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[108%] h-3 bg-gradient-to-b from-[#A1A1AA] to-[#71717A] rounded-b-xl border-t border-white/30 shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
            {/* Center thumb notch */}
            <div className="w-16 h-1 bg-[#27272A] mx-auto rounded-b-md" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-badge {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          100% {
            transform: translateY(-8px) rotate(1.5deg);
          }
        }
      `}</style>
    </div>
  );
};
