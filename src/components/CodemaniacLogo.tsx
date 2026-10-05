import React from 'react';

export const CodemaniacLogo: React.FC<{ className?: string; iconOnly?: boolean }> = ({
  className = '',
  iconOnly = false,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* CM Monogram Icon matching screenshots */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#F4A62A] via-[#D98218] to-[#C66A08] flex items-center justify-center shadow-[0_2px_10px_rgba(217,130,24,0.28)]">
        <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
          {/* C arc */}
          <path
            d="M17 13.5C13.5 14.5 11 17.5 11 21C11 25.5 14.5 28.5 19 28.5C21.5 28.5 23.5 27.5 25 25.5"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* M stylized */}
          <path
            d="M21 28.5V14.5L25.5 22L30 14.5V28.5"
            stroke="#102A43"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Accent dot */}
          <circle cx="20.5" cy="11.5" r="2" fill="#FFFFFF" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-extrabold tracking-tight text-xl text-[#102A43]">
              CODEMANIAC
            </span>
          </div>
          <span className="text-[10px] tracking-[0.26em] font-semibold text-[#D98218] mt-0.5">
            STUDIO
          </span>
        </div>
      )}
    </div>
  );
};
