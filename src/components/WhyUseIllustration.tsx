import React, { useState } from 'react';
import { ToolCategory } from '../types';
import { Play, Scissors, Type, ShieldCheck, Bot, FileText, Music, Sparkles } from 'lucide-react';

interface WhyUseIllustrationProps {
  category: ToolCategory;
}

export const WhyUseIllustration: React.FC<WhyUseIllustrationProps> = ({ category }) => {
  // For image before/after slider
  const [sliderPos, setSliderPos] = useState(50);

  if (category === 'image') {
    return (
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-[#E9DCC8] bg-white select-none">
        {/* Before & After interactive comparison slider */}
        <div
          className="relative w-full h-full cursor-ew-resize overflow-hidden"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            setSliderPos((x / rect.width) * 100);
          }}
          onTouchMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const touch = e.touches[0];
            const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
            setSliderPos((x / rect.width) * 100);
          }}
        >
          {/* After Image (full width under layer) - vibrant high-contrast mountains */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-[#1E3A8A] to-[#0D9488] flex items-center justify-center">
            <svg viewBox="0 0 600 400" className="w-full h-full object-cover">
              {/* Sky */}
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#FDE047" />
                </linearGradient>
                <linearGradient id="mntnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
              </defs>
              <rect width="600" height="400" fill="url(#skyGrad)" />
              {/* Sun */}
              <circle cx="450" cy="120" r="40" fill="#FEF08A" opacity="0.9" />
              {/* Mountain silhouettes */}
              <polygon points="100,400 240,140 380,400" fill="url(#mntnGrad)" />
              <polygon points="260,400 420,100 580,400" fill="#334155" />
              <polygon points="0,400 120,200 280,400" fill="#475569" />
              {/* Water reflection */}
              <rect y="280" width="600" height="120" fill="#0284C7" opacity="0.8" />
              {/* Trees */}
              <polygon points="40,280 60,230 80,280" fill="#065F46" />
              <polygon points="70,280 90,220 110,280" fill="#047857" />
              <polygon points="500,280 520,210 540,280" fill="#065F46" />
            </svg>
            <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
              After (Enhanced)
            </span>
          </div>

          {/* Before Image (clipped on left) - muted/dull */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden filter grayscale-[60%] brightness-[85%]"
            style={{ width: `${sliderPos}%` }}
          >
            <div className="w-[100vw] max-w-[600px] h-full">
              <svg viewBox="0 0 600 400" className="w-full h-full object-cover">
                <rect width="600" height="400" fill="#94A3B8" />
                <polygon points="100,400 240,140 380,400" fill="#64748B" />
                <polygon points="260,400 420,100 580,400" fill="#475569" />
                <polygon points="0,400 120,200 280,400" fill="#334155" />
                <rect y="280" width="600" height="120" fill="#64748B" opacity="0.8" />
              </svg>
            </div>
            <span className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm">
              Before
            </span>
          </div>

          {/* Dividing handle slider */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-ew-resize"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-[#102A43] shadow-lg flex items-center justify-center text-xs font-bold -ml-3.5 border border-[#E9DCC8]">
              ⇄
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (category === 'video') {
    return (
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-[#E9DCC8] bg-[#0A1624] p-4 flex flex-col justify-between select-none">
        {/* Video Preview with Mountain & Play Button */}
        <div className="relative w-full h-[62%] rounded-2xl overflow-hidden bg-gradient-to-r from-sky-900 to-indigo-950 flex items-center justify-center">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#D98218_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="w-14 h-14 rounded-full bg-[#D98218] flex items-center justify-center shadow-lg text-white hover:scale-105 transition-transform cursor-pointer">
            <Play className="w-6 h-6 ml-1 fill-white" />
          </div>
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
            00:04:12 / 00:10:00
          </div>
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-500/80 text-[10px] text-white font-bold">
            1080p 60fps
          </div>
        </div>

        {/* Video Timeline & Controls */}
        <div className="w-full h-[32%] bg-[#102A43] rounded-xl p-2.5 flex flex-col justify-between border border-white/10">
          <div className="flex items-center justify-between text-white/80 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded hover:bg-white/10 cursor-pointer">
                <Scissors className="w-3.5 h-3.5 text-[#D98218]" />
              </span>
              <span className="p-1 rounded hover:bg-white/10 cursor-pointer">
                <Type className="w-3.5 h-3.5" />
              </span>
              <span className="p-1 rounded hover:bg-white/10 cursor-pointer">
                <Music className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#F4A62A]">Track 01 (Master)</span>
          </div>

          {/* Audio/Video Waveform Timeline */}
          <div className="relative w-full h-5 bg-[#0B1D2E] rounded-md overflow-hidden flex items-center px-1">
            <div className="w-full h-2.5 bg-gradient-to-r from-amber-500 via-[#D98218] to-emerald-500 rounded-sm opacity-80" />
            {/* Playhead */}
            <div className="absolute left-[40%] top-0 bottom-0 w-0.5 bg-white shadow-sm">
              <div className="w-2 h-2 rounded-full bg-white -ml-0.75 -mt-0.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (category === 'audio') {
    return (
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-[#E9DCC8] bg-gradient-to-br from-[#102A43] to-[#1E3A8A] p-6 flex flex-col items-center justify-center text-white select-none">
        {/* Floating badges */}
        <div className="absolute top-4 left-6 px-3 py-1 rounded-full bg-[#0284C7] text-xs font-bold shadow-md">
          MP3
        </div>
        <div className="absolute top-4 right-6 px-3 py-1 rounded-full bg-[#059669] text-xs font-bold shadow-md">
          WAV
        </div>
        <div className="absolute bottom-6 left-6 px-3 py-1 rounded-full bg-[#EA580C] text-xs font-bold shadow-md">
          AAC
        </div>
        <div className="absolute bottom-6 right-6 px-3 py-1 rounded-full bg-[#7C3AED] text-xs font-bold shadow-md">
          FLAC
        </div>

        {/* Center Modern Audio Card */}
        <div className="w-[75%] max-w-[280px] bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 flex flex-col items-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-[#D98218] flex items-center justify-center shadow-lg text-white mb-3">
            <Music className="w-7 h-7" />
          </div>

          <span className="font-bold text-sm text-white">Audio Studio Core</span>
          <span className="text-[11px] text-amber-200/90 mb-4">Lossless 320kbps Engine</span>

          {/* Sound Wave bars */}
          <div className="flex items-center gap-1.5 h-8">
            {[40, 70, 95, 60, 85, 100, 75, 45, 80, 90, 65, 35].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="w-1.5 bg-gradient-to-t from-[#F4A62A] to-[#D98218] rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category === 'ai') {
    return (
      <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-[#E9DCC8] bg-gradient-to-br from-[#FFFDF8] via-[#FAF5EC] to-[#FFF3DF] p-6 flex flex-col items-center justify-center select-none">
        {/* Friendly AI Robot on Laptop matching screenshot */}
        <div className="relative flex flex-col items-center">
          {/* Floating AI icons */}
          <div className="absolute -top-4 -left-6 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold shadow-md">
            Text AI
          </div>
          <div className="absolute -top-4 -right-6 px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold shadow-md">
            Image AI
          </div>
          <div className="absolute -bottom-2 -left-8 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md">
            Summary
          </div>
          <div className="absolute -bottom-2 -right-8 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow-md">
            Vision
          </div>

          {/* Cute Robot Mascot */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#D98218] via-[#F4A62A] to-[#FBBF24] p-1.5 shadow-[0_12px_28px_rgba(217,130,24,0.35)] flex items-center justify-center text-white mb-3">
            <div className="w-full h-full bg-[#102A43] rounded-2xl flex flex-col items-center justify-center p-2">
              <Bot className="w-10 h-10 text-[#F4A62A] animate-bounce" />
              <div className="flex gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <span className="text-base font-extrabold text-[#102A43]">
              Codemaniac AI Assistant
            </span>
            <p className="text-xs text-[#61758A] mt-0.5">
              Trained on high-speed file manipulation
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default / PDF / Utility illustration: 3D PDF document or desk cards
  return (
    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-[#E9DCC8] bg-gradient-to-br from-[#FFFDF8] via-[#FAF5EC] to-[#FFF3DF] p-6 flex flex-col items-center justify-center select-none">
      {/* 3D Document Podium */}
      <div className="relative flex flex-col items-center">
        {/* Floating security badge */}
        <div className="absolute -top-3 -right-4 px-3 py-1 rounded-full bg-[#D98218] text-white text-xs font-bold shadow-md flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Encrypted</span>
        </div>

        {/* 3D PDF Document */}
        <div className="w-32 h-44 bg-gradient-to-br from-[#EF4444] to-[#B91C1C] rounded-2xl shadow-[0_16px_36px_rgba(239,68,68,0.25)] p-4 flex flex-col justify-between text-white border-2 border-white/40 transform -rotate-3 hover:rotate-0 transition-transform">
          <div className="flex items-center justify-between">
            <FileText className="w-8 h-8" />
            <span className="text-xs font-black tracking-wider bg-white/20 px-2 py-0.5 rounded">
              PDF
            </span>
          </div>

          <div className="space-y-1.5 opacity-80">
            <div className="h-1.5 bg-white rounded-full w-3/4" />
            <div className="h-1.5 bg-white rounded-full w-full" />
            <div className="h-1.5 bg-white rounded-full w-1/2" />
          </div>

          <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[10px] font-bold">
            <span>SECURE</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </div>
        </div>

        {/* Subtle base shadow */}
        <div className="w-48 h-5 bg-[#D98218]/15 rounded-full blur-md mt-4" />
      </div>
    </div>
  );
};
