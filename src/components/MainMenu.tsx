import React from 'react';
import { Volume2, VolumeX, BookOpen, Play, Users, Trophy, Shield, Target } from 'lucide-react';
import { soundManager } from '../game/audio';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenRules: () => void;
  playersPerTeam: number;
  onSelectPlayersCount: (count: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenRules,
  playersPerTeam,
  onSelectPlayersCount,
  isMuted,
  onToggleMute
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md px-4 overflow-y-auto">
      <div className="w-full max-w-xl my-auto bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative">
        {/* Top Sound Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-400">
            <Trophy className="w-3.5 h-3.5" /> Traditional Outdoor 3D Game
          </div>
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>

        {/* Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 mb-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <div className="flex -space-x-1">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="w-2.5 h-5 rounded-sm bg-gradient-to-t from-amber-600 to-amber-300 border border-amber-800 shadow-sm"
                  style={{ height: `${12 + (6 - i) * 3}px` }}
                />
              ))}
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent font-['Outfit']">
            SEVEN STONES
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1 font-medium">
            Pittu Garam • Lagori • Satoliya
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Experience the thrilling outdoor classic in full 3D with authentic 7-meter throws, stationary defender passing, and stone rebuilding!
          </p>
        </div>

        {/* Team Configuration: Player Count Selector */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-400" /> Players per Team
            </span>
            <span className="text-xs font-semibold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-800">
              {playersPerTeam} vs {playersPerTeam} Match
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 4, 5].map(count => (
              <button
                key={count}
                onClick={() => {
                  onSelectPlayersCount(count);
                  soundManager.playBounce();
                }}
                className={`py-2 px-3 rounded-xl font-bold text-sm transition-all ${
                  playersPerTeam === count
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {count}v{count}
                {count === 3 && <span className="block text-[10px] font-normal text-sky-200">Default</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <Target className="w-4 h-4 mx-auto mb-1 text-red-400" />
            <div className="text-[11px] font-bold text-slate-200">7m Throw Line</div>
            <div className="text-[10px] text-slate-500">3 Chances Each</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <Shield className="w-4 h-4 mx-auto mb-1 text-blue-400" />
            <div className="text-[11px] font-bold text-slate-200">Stationary Ball</div>
            <div className="text-[10px] text-slate-500">Pass to Move</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <Trophy className="w-4 h-4 mx-auto mb-1 text-amber-400" />
            <div className="text-[11px] font-bold text-slate-200">3 Victory Calls</div>
            <div className="text-[10px] text-slate-500">“Seven Stones!”</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              soundManager.playWhistle();
              onStartGame();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 text-slate-950 font-black text-lg tracking-wide uppercase transition-all shadow-xl shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" /> Start Toss & Play
          </button>

          <button
            onClick={() => {
              soundManager.playBounce();
              onOpenRules();
            }}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-400" /> How to Play & Game Rules
          </button>
        </div>
      </div>
    </div>
  );
};
