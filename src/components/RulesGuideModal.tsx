import React from 'react';
import { X, Shield, Swords, Target, Clock, Trophy, Users, AlertTriangle } from 'lucide-react';

interface RulesGuideModalProps {
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 sticky top-0 bg-slate-900/90 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-black font-['Outfit'] text-amber-400">
              OFFICIAL RULES OF SEVEN STONES
            </h2>
            <p className="text-xs text-slate-400">
              Also known as Lagori, Pittu Garam, or Satoliya
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rules Content */}
        <div className="space-y-6 text-sm text-slate-300">
          {/* Rule 1: Setup & Throwing */}
          <section className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-red-400" /> 1. The 7-Meter Throw & Chances
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li>Exactly <strong>seven individual stones</strong> are stacked from largest to smallest inside the central circle.</li>
              <li>The attacking team throws from a line marked <strong>exactly 7 metres</strong> from the stones.</li>
              <li>Each attacking player receives <strong>3 chances</strong> to hit and knock down the stack.</li>
              <li><strong className="text-rose-400">Line Violation:</strong> If an attacker steps over the 7m line before releasing the ball, it counts as a foul.</li>
              <li><strong className="text-amber-400">Airborne Catch:</strong> If a thrown ball is caught by a defender while still airborne, all remaining chances for that thrower are immediately forfeited.</li>
              <li>If all attackers exhaust their 3 chances without hitting the stones, the team roles switch immediately.</li>
            </ul>
          </section>

          {/* Rule 2: Defenders & Stationary Ball Rule */}
          <section className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" /> 2. Defenders & Ball Possession
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li>Once the stack is knocked down, possession transfers to the defending team.</li>
              <li><strong className="text-amber-300">STATIONARY RULE:</strong> Any defender holding the ball <em>must not walk, run, or chase</em>. They must remain completely stationary.</li>
              <li>To move the ball closer to an attacker, defenders must <strong>pass the ball</strong> to a teammate in a better position.</li>
              <li>Defenders without the ball are allowed to run freely around the playing field.</li>
              <li>Defenders can <strong>never</strong> eliminate an attacker by touching them with hands or body.</li>
            </ul>
          </section>

          {/* Rule 3: Rebuilding & Elimination */}
          <section className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-2">
              <Swords className="w-5 h-5 text-emerald-400" /> 3. Stone Rebuilding & Ball Elimination
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li>Attackers must run around the court, dodge thrown balls, collect the scattered stones, and rebuild all 7 stones in order.</li>
              <li><strong className="text-emerald-400">Progress Preservation:</strong> If one attacker places some stones and retreats or gets eliminated, subsequent attackers retain the existing progress.</li>
              <li><strong className="text-rose-400">Elimination:</strong> An attacker is eliminated <em>only</em> if directly hit by a ball thrown by a defender.</li>
              <li>Eliminated players cannot move or touch stones for the rest of the round.</li>
            </ul>
          </section>

          {/* Rule 4: Victory Sequence & Match Time */}
          <section className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-amber-400" /> 4. Victory Calls & Win Conditions
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-300">
              <li>Once all 7 stones are stacked, attackers must complete <strong>three distinct calls of “Seven Stones!”</strong> (1/3, 2/3, 3/3).</li>
              <li>Defenders can still throw and eliminate attackers during the victory calls.</li>
              <li><strong>Attacker Win:</strong> All 7 stones rebuilt + 3 calls finished with at least 1 attacker still standing.</li>
              <li><strong>Defender Win:</strong> All attackers are eliminated before the 3 victory calls complete.</li>
              <li><strong>Time Limit:</strong> The match duration is strictly <strong>10:00 minutes</strong>. If the clock runs out without a decisive win, the match is evaluated as a time-limit result.</li>
            </ul>
          </section>

          {/* Controls Summary */}
          <section className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="font-bold text-white text-sm mb-2">Controls Guide:</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-amber-400 font-bold">W, A, S, D / Arrows:</span> Move Player
              </div>
              <div>
                <span className="text-amber-400 font-bold">Mouse / Space:</span> Aim & Throw Ball
              </div>
              <div>
                <span className="text-amber-400 font-bold">E / Key F / Action:</span> Pick / Stack Stone
              </div>
              <div>
                <span className="text-amber-400 font-bold">Esc / P:</span> Pause Game
              </div>
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-colors cursor-pointer"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
