import React, { useState } from 'react';
import { Coins, Swords, Shield, CheckCircle } from 'lucide-react';
import { TossState, Role, TeamId } from '../game/types';
import { soundManager } from '../game/audio';

interface TossModalProps {
  tossState: TossState;
  onFlipCoin: (choice: 'HEADS' | 'TAILS') => void;
  onChooseRole: (role: Role) => void;
  playersPerTeam: number;
}

export const TossModal: React.FC<TossModalProps> = ({
  tossState,
  onFlipCoin,
  onChooseRole,
  playersPerTeam
}) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const isUserWinner = tossState.winnerTeam === 'TEAM_A';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md px-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-center">
        {/* Step 1: Call the Coin Toss */}
        {tossState.result === null && !tossState.isFlipping && (
          <div>
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-3">
              <Coins className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white">
              COIN TOSS
            </h2>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              Choose Heads or Tails to determine who gets to choose Attack or Defend!
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => onFlipCoin('HEADS')}
                className="py-5 px-4 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 hover:from-amber-600/30 hover:to-amber-500/20 border-2 border-slate-700 hover:border-amber-400 font-black text-lg transition-all transform hover:scale-[1.02] cursor-pointer group"
              >
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg group-hover:rotate-12 transition-transform">
                  H
                </div>
                HEADS
              </button>

              <button
                onClick={() => onFlipCoin('TAILS')}
                className="py-5 px-4 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 hover:from-amber-600/30 hover:to-amber-500/20 border-2 border-slate-700 hover:border-amber-400 font-black text-lg transition-all transform hover:scale-[1.02] cursor-pointer group"
              >
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg group-hover:-rotate-12 transition-transform">
                  T
                </div>
                TAILS
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Coin Flipping Animation */}
        {tossState.isFlipping && (
          <div className="py-8">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-4 border-amber-200 flex items-center justify-center text-3xl font-black text-slate-950 shadow-2xl animate-spin">
                ★
              </div>
            </div>
            <h3 className="text-2xl font-bold text-amber-300 animate-pulse">
              Flipping Coin in the Air...
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Your call: <span className="font-bold text-white">{tossState.userChoice}</span>
            </p>
          </div>
        )}

        {/* Step 3: Result & Role Selection */}
        {tossState.result !== null && !tossState.isFlipping && (
          <div>
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg">
              {tossState.result === 'HEADS' ? 'H' : 'T'}
            </div>

            <div className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1">
              Toss Result: {tossState.result}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] mb-2">
              {isUserWinner ? (
                <span className="text-emerald-400">Team Phoenix (You) Won the Toss!</span>
              ) : (
                <span className="text-sky-400">Team Cobalt Won the Toss!</span>
              )}
            </h2>

            <p className="text-sm text-slate-300 mb-6">
              {isUserWinner
                ? 'Choose whether your team wants to ATTACK first (throw at stones) or DEFEND first:'
                : 'Team Cobalt chose to DEFEND first. You will be ATTACKING!'}
            </p>

            {isUserWinner ? (
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    setSelectedRole('ATTACKERS');
                    soundManager.playBounce();
                  }}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedRole === 'ATTACKERS'
                      ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
                      <Swords className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-base text-white">ATTACK FIRST</div>
                      <div className="text-xs text-slate-400">
                        Throw at the 7 stones from the 7m line & rebuild them!
                      </div>
                    </div>
                  </div>
                  {selectedRole === 'ATTACKERS' && <CheckCircle className="w-6 h-6 text-rose-400" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedRole('DEFENDERS');
                    soundManager.playBounce();
                  }}
                  className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedRole === 'DEFENDERS'
                      ? 'bg-sky-500/20 border-sky-500 shadow-lg shadow-sky-500/20'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-black text-base text-white">DEFEND FIRST</div>
                      <div className="text-xs text-slate-400">
                        Guard stones, pass ball while stationary & eliminate attackers!
                      </div>
                    </div>
                  </div>
                  {selectedRole === 'DEFENDERS' && <CheckCircle className="w-6 h-6 text-sky-400" />}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-800/60 mb-6 text-left">
                <div className="text-xs text-sky-400 font-bold uppercase mb-1">Assigned Roles:</div>
                <div className="text-sm text-slate-200">
                  • <strong>Your Team (Phoenix):</strong> Attackers (Throwing from 7m)
                </div>
                <div className="text-sm text-slate-200">
                  • <strong>Team Cobalt:</strong> Defenders (Behind stones)
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (isUserWinner) {
                  if (selectedRole) onChooseRole(selectedRole);
                } else {
                  // Opponent chose defenders, so user attacks
                  onChooseRole('ATTACKERS');
                }
              }}
              disabled={isUserWinner && !selectedRole}
              className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition-all cursor-pointer ${
                (isUserWinner ? selectedRole !== null : true)
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/25 scale-[1.01]'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              Start Match Countdown ({playersPerTeam}v{playersPerTeam})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
