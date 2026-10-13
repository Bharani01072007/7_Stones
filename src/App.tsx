/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameMode, Player, TeamId, Role } from './game/types';
import { MainMenu } from './components/MainMenu';
import { TossModal } from './components/TossModal';
import { HUD } from './components/HUD';
import { VictoryCallOverlay } from './components/VictoryCallOverlay';
import { MobileControls } from './components/MobileControls';
import { PauseMenu } from './components/PauseMenu';
import { MatchResultModal } from './components/MatchResultModal';
import { RulesGuideModal } from './components/RulesGuideModal';
import { soundManager } from './game/audio';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React State mirrored from engine
  const [gameState, setGameState] = useState<GameMode>('MENU');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(3);
  const [teamRoles, setTeamRoles] = useState<{ [team in TeamId]: Role }>({
    TEAM_A: 'ATTACKERS',
    TEAM_B: 'DEFENDERS'
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [rebuiltCount, setRebuiltCount] = useState<number>(7);
  const [victoryCallStep, setVictoryCallStep] = useState<number>(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertTimeoutId, setAlertTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [activeThrower, setActiveThrower] = useState<Player | undefined>(undefined);
  const [humanPlayer, setHumanPlayer] = useState<Player | undefined>(undefined);
  const [ballHolder, setBallHolder] = useState<Player | undefined>(undefined);

  // Initialize Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onStateChange: (newState) => {
        setGameState(newState);
        syncEngineState(engine);
      },
      onTimerTick: (timeLeft) => {
        setSecondsRemaining(timeLeft);
      },
      onHUDUpdate: () => {
        syncEngineState(engine);
      },
      onVictoryCall: (callNum) => {
        setVictoryCallStep(callNum);
      },
      onAlert: (msg, duration = 2000) => {
        setAlertMessage(msg);
        if (alertTimeoutId) clearTimeout(alertTimeoutId);
        const timeout = setTimeout(() => {
          setAlertMessage(null);
        }, duration);
        setAlertTimeoutId(timeout);
      }
    });

    engineRef.current = engine;
    syncEngineState(engine);

    // Keyboard controls
    const keysDown = new Set<string>();

    const updateMovement = () => {
      let dx = 0;
      let dz = 0;
      if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) dz += 1;
      if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) dz -= 1;
      if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) dx -= 1;
      if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) dx += 1;

      if (engineRef.current) {
        engineRef.current.inputKeys.moveX = dx;
        engineRef.current.inputKeys.moveZ = dz;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (engine.state !== 'MENU' && engine.state !== 'MATCH_RESULT') {
          if (engine.state === 'PAUSED') {
            engine.setState('REBUILDING'); // or prior state
          } else {
            engine.setState('PAUSED');
          }
        }
        return;
      }

      keysDown.add(e.code);
      updateMovement();

      if (e.code === 'KeyE' || e.code === 'KeyF') {
        const hp = engine.getHumanPlayer();
        if (hp) engine.handleStoneInteraction(hp);
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (engine.state === 'ATTACKING_THROW') {
          engine.handleThrowAction();
        } else if (engine.state === 'REBUILDING') {
          const hp = engine.getHumanPlayer();
          if (hp) engine.handleStoneInteraction(hp);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
      updateMovement();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!engineRef.current || engineRef.current.state !== 'ATTACKING_THROW') return;
      const thrower = engineRef.current.getActiveThrower();
      if (!thrower || !thrower.isHuman) return;

      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;

      // Adjust aim yaw and pitch
      engineRef.current.aimYaw = normX * 0.75;
      thrower.rotation = engineRef.current.aimYaw;
      engineRef.current.aimPitch = Math.max(0.15, Math.min(0.65, 0.35 + normY * 0.3));
    };

    const handleClick = () => {
      if (!engineRef.current) return;
      if (engineRef.current.state === 'ATTACKING_THROW') {
        const thrower = engineRef.current.getActiveThrower();
        if (thrower?.isHuman && thrower.isHoldingBall) {
          engineRef.current.handleThrowAction();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      engine.dispose();
    };
  }, []);

  const syncEngineState = (engine: GameEngine) => {
    setGameState(engine.state);
    setTeamRoles({ ...engine.teamRoles });
    setPlayers([...engine.players]);
    setRebuiltCount(engine.stonesSystem.rebuiltCount);
    setVictoryCallStep(engine.victoryCallStep);
    setActiveThrower(engine.getActiveThrower());
    setHumanPlayer(engine.getHumanPlayer());
    const holder = engine.players.find(p => p.id === engine.ballSystem.data.holderPlayerId);
    setBallHolder(holder);
  };

  // User Actions
  const handleStartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.setPlayersCount(playersPerTeam);
    engineRef.current.setState('TOSS');
  };

  const handleFlipCoin = (choice: 'HEADS' | 'TAILS') => {
    if (!engineRef.current) return;
    engineRef.current.startToss(choice);
  };

  const handleChooseRole = (role: Role) => {
    if (!engineRef.current) return;
    engineRef.current.chooseRole(role);
  };

  const handlePause = () => {
    if (engineRef.current) engineRef.current.setState('PAUSED');
  };

  const handleResume = () => {
    if (engineRef.current) {
      if (engineRef.current.stonesSystem.rebuiltCount === 7) {
        engineRef.current.setState('ATTACKING_THROW');
      } else {
        engineRef.current.setState('REBUILDING');
      }
    }
  };

  const handleRestart = () => {
    if (engineRef.current) engineRef.current.restartMatch();
  };

  const handleReturnMenu = () => {
    if (engineRef.current) {
      engineRef.current.setState('MENU');
      engineRef.current.stonesSystem.resetToFullStack();
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Mobile Handlers
  const handleMobileMove = (dx: number, dz: number) => {
    if (engineRef.current) {
      engineRef.current.inputKeys.moveX = dx;
      engineRef.current.inputKeys.moveZ = dz;
    }
  };

  const handleMobileThrow = () => {
    if (!engineRef.current) return;
    if (engineRef.current.state === 'ATTACKING_THROW') {
      engineRef.current.handleThrowAction();
    } else {
      const hp = engineRef.current.getHumanPlayer();
      if (hp?.isHoldingBall) {
        // Defender throw or pass
        const targets = engineRef.current.getAttackers().filter(p => !p.isEliminated);
        if (targets.length > 0) engineRef.current.defenderThrowAtAttacker(hp, targets[0]);
      }
    }
  };

  const handleMobileInteract = () => {
    if (!engineRef.current) return;
    const hp = engineRef.current.getHumanPlayer();
    if (hp) engineRef.current.handleStoneInteraction(hp);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Main Menu Screen */}
      {gameState === 'MENU' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenRules={() => setShowRules(true)}
          playersPerTeam={playersPerTeam}
          onSelectPlayersCount={(count) => setPlayersPerTeam(count)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Toss & Role Selection Screen */}
      {(gameState === 'TOSS' || gameState === 'ROLE_SELECTION') && engineRef.current && (
        <TossModal
          tossState={engineRef.current.tossState}
          onFlipCoin={handleFlipCoin}
          onChooseRole={handleChooseRole}
          playersPerTeam={playersPerTeam}
        />
      )}

      {/* Match Countdown Banner */}
      {gameState === 'MATCH_COUNTDOWN' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/60 pointer-events-none">
          <div className="text-center animate-bounce">
            <h2 className="text-6xl sm:text-8xl font-black text-amber-400 font-['Outfit'] drop-shadow-2xl">
              GET READY!
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-white mt-2">
              Match starting at the 7-meter mark!
            </p>
          </div>
        </div>
      )}

      {/* Match HUD Overlay */}
      {(gameState === 'ATTACKING_THROW' ||
        gameState === 'REBUILDING' ||
        gameState === 'VICTORY_CALLS' ||
        gameState === 'MATCH_COUNTDOWN' ||
        gameState === 'PAUSED') && (
        <HUD
          gameState={gameState}
          secondsRemaining={secondsRemaining}
          teamRoles={teamRoles}
          players={players}
          rebuiltCount={rebuiltCount}
          victoryCallStep={victoryCallStep}
          activeThrower={activeThrower}
          humanPlayer={humanPlayer}
          ballHolder={ballHolder}
          onPause={handlePause}
          onRestart={handleRestart}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          alertMessage={alertMessage}
        />
      )}

      {/* "Seven Stones!" 3x Victory Call Banner */}
      {gameState === 'VICTORY_CALLS' && (
        <VictoryCallOverlay callNumber={victoryCallStep} />
      )}

      {/* Mobile Touch Controls */}
      {(gameState === 'ATTACKING_THROW' || gameState === 'REBUILDING' || gameState === 'VICTORY_CALLS') && (
        <MobileControls
          onMove={handleMobileMove}
          onThrow={handleMobileThrow}
          onInteract={handleMobileInteract}
          isThrowPhase={gameState === 'ATTACKING_THROW'}
          canInteract={humanPlayer?.hasCarriedStoneId !== null || rebuiltCount < 7}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenRules={() => setShowRules(true)}
          onReturnMenu={handleReturnMenu}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Match Concluded Result Modal */}
      {gameState === 'MATCH_RESULT' && engineRef.current && (
        <MatchResultModal
          winner={engineRef.current.matchWinner}
          winReason={engineRef.current.winReason}
          stats={engineRef.current.stats}
          onPlayAgain={handleRestart}
          onReturnMenu={handleReturnMenu}
        />
      )}

      {/* Rules Guide Modal */}
      {showRules && (
        <RulesGuideModal onClose={() => setShowRules(false)} />
      )}
    </div>
  );
}
