import React from 'react';
import { Pause, RotateCcw, Volume2, VolumeX, Shield, Swords, Target, CircleAlert, Sparkles } from 'lucide-react';
import { GameMode, Player, TeamId, Role } from '../game/types';
import { TOTAL_STONES } from '../game/constants';

interface HUDProps {
  gameState: GameMode;
  secondsRemaining: number;
  teamRoles: { [team in TeamId]: Role };
  players: Player[];
  rebuiltCount: number;
  victoryCallStep: number;
  activeThrower?: Player;
  humanPlayer?: Player;
  ballHolder?: Player;
  onPause: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  alertMessage: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  gameState,
  secondsRemaining,
  teamRoles,
  players,
  rebuiltCount,
  victoryCallStep,
  activeThrower,
  humanPlayer,
  ballHolder,
  onPause,
  onRestart,
  isMuted,
  onToggleMute,
  alertMessage
}) => {
  // Format MM:SS
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const teamAPlayers = players.filter(p => p.team === 'TEAM_A');
  const teamBPlayers = players.filter(p => p.team === 'TEAM_B');

  const teamAActive = teamAPlayers.filter(p => !p.isEliminated).length;
  const teamBActive = teamBPlayers.filter(p => !p.isEliminated).length;

  const isHumanAttacker = humanPlayer ? teamRoles[humanPlayer.team] === 'ATTACKERS' : true;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 z-20">
      {/* TOP BAR: Scoreboard, 10:00 Clock, and Controls */}
      <div className="flex items-start justify-between gap-2 sm:gap-4 pointer-events-auto">
        {/* TEAM A (Phoenix) */}
        <div className={`p-2 sm:p-3 rounded-2xl backdrop-blur-md border shadow-lg transition-all ${
          teamRoles.TEAM_A === 'ATTACKERS'
            ? 'bg-red-950/70 border-red-500/60 shadow-red-500/20'
            : 'bg-slate-900/70 border-slate-700/60'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <div className="text-xs sm:text-sm font-black text-white font-['Outfit']">
              TEAM PHOENIX
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              teamRoles.TEAM_A === 'ATTACKERS' ? 'bg-red-500/30 text-red-300' : 'bg-blue-500/30 text-blue-300'
            }`}>
              {teamRoles.TEAM_A}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2">
            <span>Active: <strong className="text-emerald-400">{teamAActive}</strong>/{teamAPlayers.length}</span>
            {teamRoles.TEAM_A === 'ATTACKERS' && activeThrower?.team === 'TEAM_A' && (
              <span className="text-amber-400">Throws: {activeThrower.chancesLeft}/3</span>
            )}
          </div>
        </div>

        {/* CENTER MATCH CLOCK & REBUILD STATUS */}
        <div className="flex flex-col items-center">
          {/* 10:00 Timer Banner */}
          <div className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/40 shadow-xl flex items-center gap-2.5">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">
              MATCH TIME
            </span>
            <span className={`text-xl sm:text-3xl font-black font-mono tracking-widest ${
              secondsRemaining < 60 ? 'text-red-400 animate-pulse' : 'text-white'
            }`}>
              {timeFormatted}
            </span>
          </div>

          {/* 7 STONES PROGRESS INDICATOR */}
          <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 flex items-center gap-2 shadow-md">
            <span className="text-[10px] font-bold text-amber-400 uppercase">
              Stones: {rebuiltCount}/{TOTAL_STONES}
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map(idx => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-md border transition-all ${
                    idx < rebuiltCount
                      ? 'bg-amber-400 border-amber-300 shadow-sm shadow-amber-400 scale-105'
                      : 'bg-slate-800 border-slate-700 opacity-60'
                  }`}
                  title={`Stone #${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TEAM B (Cobalt) & HEADER CONTROLS */}
        <div className="flex items-start gap-2">
          <div className={`p-2 sm:p-3 rounded-2xl backdrop-blur-md border shadow-lg transition-all text-right ${
            teamRoles.TEAM_B === 'ATTACKERS'
              ? 'bg-blue-950/70 border-blue-500/60 shadow-blue-500/20'
              : 'bg-slate-900/70 border-slate-700/60'
          }`}>
            <div className="flex items-center justify-end gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                teamRoles.TEAM_B === 'ATTACKERS' ? 'bg-red-500/30 text-red-300' : 'bg-blue-500/30 text-blue-300'
              }`}>
                {teamRoles.TEAM_B}
              </span>
              <div className="text-xs sm:text-sm font-black text-white font-['Outfit']">
                TEAM COBALT
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-end gap-2">
              {teamRoles.TEAM_B === 'ATTACKERS' && activeThrower?.team === 'TEAM_B' && (
                <span className="text-amber-400">Throws: {activeThrower.chancesLeft}/3</span>
              )}
              <span>Active: <strong className="text-emerald-400">{teamBActive}</strong>/{teamBPlayers.length}</span>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onPause}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Pause Match"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleMute}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* CENTER POPUP ALERT MESSAGE */}
      {alertMessage && (
        <div className="self-center px-6 py-2.5 rounded-2xl bg-amber-500/90 text-slate-950 font-black text-sm sm:text-base shadow-2xl backdrop-blur-md animate-bounce border-2 border-white">
          {alertMessage}
        </div>
      )}

      {/* BOTTOM CONTEXTUAL ACTION BAR */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        {/* Ball Possession Badge */}
        {ballHolder ? (
          <div className="px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
            <span>Ball Possession: <strong className="text-amber-400">{ballHolder.name}</strong></span>
            {teamRoles[ballHolder.team] === 'DEFENDERS' && (
              <span className="text-[10px] text-rose-300 font-bold bg-rose-950/80 px-2 py-0.5 rounded-full">
                STATIONARY
              </span>
            )}
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full bg-slate-900/70 text-[11px] text-slate-400">
            Ball in play / on ground
          </div>
        )}

        {/* Phase Specific Guides */}
        {gameState === 'ATTACKING_THROW' && (
          <div className="px-5 py-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/50 shadow-2xl text-center max-w-lg">
            <div className="text-xs font-bold text-amber-400 uppercase flex items-center justify-center gap-1.5 mb-1">
              <Target className="w-4 h-4" /> 7-Meter Throwing Phase
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              {activeThrower?.isHuman ? (
                <>
                  <span className="font-bold text-amber-300">Aim:</span> Move mouse or hold controls. <br className="hidden sm:inline" />
                  <span className="font-bold text-emerald-400">Throw:</span> Click or Press Space. Do not cross the 7m line!
                </>
              ) : (
                <>AI Teammate <strong className="text-sky-300">{activeThrower?.name}</strong> is throwing at the stack...</>
              )}
            </p>
          </div>
        )}

        {gameState === 'REBUILDING' && (
          <div className="px-5 py-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/50 shadow-2xl text-center max-w-lg">
            <div className="text-xs font-bold text-emerald-400 uppercase flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" /> Stone Rebuilding Phase
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              {isHumanAttacker ? (
                <>
                  {humanPlayer?.hasCarriedStoneId !== null ? (
                    <span className="text-amber-300 font-bold">
                      Carrying Stone #{humanPlayer!.hasCarriedStoneId! + 1}! Run to center circle and press [E] or action button!
                    </span>
                  ) : (
                    <span>
                      Move near scattered stones and press <strong className="text-emerald-400">[E] / Action</strong> to pick up! Avoid the ball!
                    </span>
                  )}
                </>
              ) : (
                <span>
                  You are Defending! Pass ball to teammates or throw to eliminate attackers before they rebuild!
                </span>
              )}
            </p>
          </div>
        )}

        {gameState === 'VICTORY_CALLS' && (
          <div className="px-6 py-2 rounded-2xl bg-amber-500/90 text-slate-950 font-black text-sm uppercase tracking-wider animate-pulse">
            Calling “Seven Stones!” ({victoryCallStep}/3) — Defenders can still eliminate!
          </div>
        )}
      </div>
    </div>
  );
};
