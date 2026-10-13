import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';

interface VictoryCallOverlayProps {
  callNumber: number; // 1, 2, 3
}

export const VictoryCallOverlay: React.FC<VictoryCallOverlayProps> = ({ callNumber }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
      <div className="text-center transform animate-in zoom-in-75 duration-300">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-sm mb-3">
          <Sparkles className="w-4 h-4 animate-spin" /> CALL {callNumber} OF 3
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white font-['Outfit'] drop-shadow-[0_10px_25px_rgba(245,158,11,0.6)]">
          “SEVEN STONES!”
        </h1>

        <div className="flex justify-center items-center gap-3 mt-4">
          {[1, 2, 3].map(step => (
            <div
              key={step}
              className={`w-12 h-3 rounded-full transition-all ${
                step <= callNumber
                  ? 'bg-amber-400 shadow-lg shadow-amber-400/50 scale-110'
                  : 'bg-slate-700 opacity-50'
              }`}
            />
          ))}
        </div>

        <p className="text-xs sm:text-sm text-amber-200/90 font-medium mt-3 bg-slate-950/70 py-1 px-4 rounded-full max-w-sm mx-auto">
          Defenders can still eliminate remaining attackers!
        </p>
      </div>
    </div>
  );
};
