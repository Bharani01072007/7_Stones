import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Home, Target, Shield, Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TeamId, MatchStats } from '../game/types';
import { TEAM_COLORS } from '../game/constants';

interface MatchResultModalProps {
  winner: TeamId | null;
  winReason: string;
  stats: MatchStats;
  onPlayAgain: () => void;
  onReturnMenu: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  winner,
  winReason,
  stats,
  onPlayAgain,
  onReturnMenu
}) => {
  useEffect(() => {
    if (winner) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [winner]);

  const winnerName = winner
    ? winner === 'TEAM_A'
      ? TEAM_COLORS.TEAM_A.name
      : TEAM_COLORS.TEAM_B.name
    : 'Time Limit Draw';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4 overflow-y-auto">
      <div className="w-full max-w-lg my-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-center">
        {/* Banner Icon */}
        <div className={`w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center shadow-xl ${
          winner ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {winner ? <Trophy className="w-10 h-10" /> : <Shield className="w-10 h-10" />}
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
          MATCH CONCLUDED
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white mb-2">
          {winner ? `${winnerName} Victory!` : 'Time Limit Result'}
        </h2>

        <p className="text-sm text-slate-300 mb-6 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
          {winReason}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 text-left">
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Throws Attempted</div>
            <div className="text-xl font-black text-amber-400">{stats.throwsAttempted}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Stones Hit</div>
            <div className="text-xl font-black text-emerald-400">{stats.throwsHit}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Eliminations</div>
            <div className="text-xl font-black text-rose-400">{stats.eliminationsCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Stones Rebuilt</div>
            <div className="text-xl font-black text-amber-300">{stats.stonesRebuilt} / 7</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 sm:col-span-2">
            <div className="text-[11px] text-slate-400">Defender Passes Completed</div>
            <div className="text-xl font-black text-sky-400">{stats.passesCompleted}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25"
          >
            <RotateCcw className="w-5 h-5" /> Play Again
          </button>

          <button
            onClick={onReturnMenu}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
