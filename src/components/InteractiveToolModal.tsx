import React, { useState } from 'react';
import { X, Sparkles, Share2 } from 'lucide-react';
import { ToolItem } from '../types';
import { ToolStudioRenderer } from './ToolStudioRenderer';

interface InteractiveToolModalProps {
  tool: ToolItem | null;
  onClose: () => void;
}

export const InteractiveToolModal: React.FC<InteractiveToolModalProps> = ({
  tool,
  onClose,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!tool) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setToastMessage('Link copied to clipboard!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FFFDF8] rounded-3xl border border-[#E9DCC8] shadow-[0_20px_50px_rgba(16,42,67,0.25)]">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 px-6 py-5 bg-[#FAF5EC] border-b border-[#E9DCC8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.badgeBg}`}>
              <Sparkles className="w-5 h-5 text-[#D98218]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#D98218] border border-[#E9DCC8]">
                  {tool.category.toUpperCase()} TOOL
                </span>
                <span className="text-xs text-[#61758A]">Codemaniac Studio</span>
              </div>
              <h2 className="text-lg font-extrabold text-[#102A43]">{tool.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`#/tools/${tool.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#D98218] hover:underline px-3 py-1 bg-white rounded-full border border-[#E9DCC8]"
            >
              Open in new tab ↗
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] hover:text-[#D98218] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <ToolStudioRenderer tool={tool} />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#FAF5EC]/50 border-t border-[#E9DCC8] flex items-center justify-between text-xs text-[#61758A]">
          <span>100% Client-Side Processing</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-[#D98218] transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Tool</span>
          </button>
        </div>

        {toastMessage && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#102A43] text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top duration-200">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
