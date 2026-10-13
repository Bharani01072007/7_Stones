import * as THREE from 'three';
import { GameMode, Player, TeamId, Role, TossState, MatchStats } from './types';
import {
  ARENA_WIDTH,
  ARENA_LENGTH,
  THROWING_LINE_Z,
  THROWING_FOUL_MARGIN,
  STONE_CIRCLE_RADIUS,
  TOTAL_STONES,
  CHANCES_PER_ATTACKER,
  MATCH_DURATION_SECONDS,
  PLAYER_RADIUS,
  BALL_RADIUS,
  INTERACTION_RADIUS
} from './constants';
import { PlaygroundScene } from './scene';
import { CharacterVisual } from './character';
import { StonesSystem } from './stones';
import { BallSystem } from './ball';
import { soundManager } from './audio';

export interface GameEngineListeners {
  onStateChange: (state: GameMode) => void;
  onTimerTick: (secondsLeft: number) => void;
  onHUDUpdate: () => void;
  onVictoryCall: (callNumber: number) => void;
  onAlert: (message: string, duration?: number) => void;
}

export class GameEngine {
  public playground: PlaygroundScene;
  public stonesSystem: StonesSystem;
  public ballSystem: BallSystem;
  public characters: Map<string, CharacterVisual> = new Map();

  // Match State
  public state: GameMode = 'MENU';
  public teamRoles: { [team in TeamId]: Role } = {
    TEAM_A: 'ATTACKERS',
    TEAM_B: 'DEFENDERS'
  };
  public playersPerTeam: number = 3;
  public players: Player[] = [];
  public currentAttackerIndex: number = 0; // index among active attackers taking throwing turns
  public matchTimeRemaining: number = MATCH_DURATION_SECONDS;
  public victoryCallStep: number = 0; // 0, 1, 2, 3
  public matchWinner: TeamId | null = null;
  public winReason: string = '';

  // Aiming & Input State
  public aimPitch: number = 0.35; // vertical angle
  public aimYaw: number = 0; // horizontal angle
  public throwPower: number = 18; // speed
  public isAiming: boolean = false;
  public aimCharge: number = 0; // 0 to 1

  // Virtual input keys
  public inputKeys = {
    moveX: 0, // -1 to 1
    moveZ: 0, // -1 to 1
    isInteracting: false,
    isThrowing: false
  };

  public tossState: TossState = {
    userChoice: null,
    result: null,
    winnerTeam: null,
    isFlipping: false
  };

  public stats: MatchStats = {
    throwsAttempted: 0,
    throwsHit: 0,
    eliminationsCount: 0,
    stonesRebuilt: 0,
    passesCompleted: 0
  };

  private listeners: GameEngineListeners;
  private lastTime: number = 0;
  private victoryCallTimer: number = 0;
  private aiActionTimer: number = 0;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, listeners: GameEngineListeners) {
    this.listeners = listeners;
    this.playground = new PlaygroundScene(container);
    this.stonesSystem = new StonesSystem(this.playground.scene);
    this.ballSystem = new BallSystem(this.playground.scene);

    this.lastTime = performance.now();
    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  public setPlayersCount(count: number) {
    this.playersPerTeam = Math.max(2, Math.min(5, count));
  }

  // --- TOSS & SETUP FLOW ---
  public startToss(userChoice: 'HEADS' | 'TAILS') {
    this.tossState.userChoice = userChoice;
    this.tossState.isFlipping = true;
    this.setState('TOSS');
    soundManager.playCoinFlip();

    setTimeout(() => {
      const coinResult: 'HEADS' | 'TAILS' = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
      const userWon = coinResult === userChoice;
      this.tossState.result = coinResult;
      this.tossState.winnerTeam = userWon ? 'TEAM_A' : 'TEAM_B';
      this.tossState.isFlipping = false;
      this.setState('ROLE_SELECTION');
      this.listeners.onHUDUpdate();
    }, 1800);
  }

  public chooseRole(winningTeamRole: Role) {
    if (!this.tossState.winnerTeam) return;

    const winner = this.tossState.winnerTeam;
    const loser: TeamId = winner === 'TEAM_A' ? 'TEAM_B' : 'TEAM_A';
    const otherRole: Role = winningTeamRole === 'ATTACKERS' ? 'DEFENDERS' : 'ATTACKERS';

    this.teamRoles[winner] = winningTeamRole;
    this.teamRoles[loser] = otherRole;

    this.startMatchCountdown();
  }

  public startMatchCountdown() {
    this.initPlayers();
    this.setState('MATCH_COUNTDOWN');
    soundManager.playWhistle();

    setTimeout(() => {
      this.startThrowingPhase();
    }, 2200);
  }

  // --- PLAYERS INITIALIZATION ---
  public initPlayers() {
    // Clear old meshes
    this.characters.forEach(char => {
      this.playground.scene.remove(char.root);
      char.dispose();
    });
    this.characters.clear();
    this.players = [];

    // Team A players
    for (let i = 0; i < this.playersPerTeam; i++) {
      const isHuman = i === 0; // Player 1 is always the human player
      const p: Player = {
        id: `A_${i}`,
        name: isHuman ? 'You' : `Player A${i + 1}`,
        team: 'TEAM_A',
        number: i + 1,
        isHuman,
        position: [0, 0, 0],
        rotation: 0,
        isEliminated: false,
        chancesLeft: CHANCES_PER_ATTACKER,
        isHoldingBall: false,
        hasCarriedStoneId: null,
        animState: 'idle',
        animTimer: 0,
        color: '#ef4444'
      };
      this.players.push(p);
    }

    // Team B players
    for (let i = 0; i < this.playersPerTeam; i++) {
      const p: Player = {
        id: `B_${i}`,
        name: `Player B${i + 1}`,
        team: 'TEAM_B',
        number: i + 1,
        isHuman: false,
        position: [0, 0, 0],
        rotation: 0,
        isEliminated: false,
        chancesLeft: CHANCES_PER_ATTACKER,
        isHoldingBall: false,
        hasCarriedStoneId: null,
        animState: 'idle',
        animTimer: 0,
        color: '#2563eb'
      };
      this.players.push(p);
    }

    // Create 3D visuals
    this.players.forEach(p => {
      const char = new CharacterVisual(p);
      this.characters.set(p.id, char);
      this.playground.scene.add(char.root);
    });

    this.positionPlayersForThrow();
  }

  // Position players according to rules:
  // Attackers at 7m line, Defenders behind stones
  public positionPlayersForThrow() {
    const attackers = this.getAttackers();
    const defenders = this.getDefenders();

    // Attacker positions: queued at the 7-meter line (Z = -7.0m)
    attackers.forEach((atk, idx) => {
      atk.isHoldingBall = false;
      atk.hasCarriedStoneId = null;
      atk.animState = 'idle';
      if (idx === this.currentAttackerIndex) {
        // Active thrower stands directly on throwing mark
        atk.position = [0, 0, THROWING_LINE_Z];
        atk.rotation = 0; // faces toward stones (positive Z)
        atk.isHoldingBall = true;
      } else {
        // Teammates wait in queue along sideline behind the 7m line
        const offsetX = -2.5 - idx * 1.5;
        atk.position = [offsetX, 0, THROWING_LINE_Z - 1.5];
        atk.rotation = Math.PI * 0.25;
      }
      this.updateCharacterVisual(atk);
    });

    // Defender positions: spread out behind the stones (Z = +2.5 to +8)
    defenders.forEach((def, idx) => {
      def.isHoldingBall = false;
      def.hasCarriedStoneId = null;
      def.animState = 'idle';
      // One keeper near stones, others spread around
      if (idx === 0) {
        def.position = [0, 0, 3.5];
        def.rotation = Math.PI; // faces stones (negative Z)
      } else {
        const xSpread = (idx % 2 === 0 ? 1 : -1) * (2.5 + Math.floor(idx / 2) * 2.2);
        def.position = [xSpread, 0, 5.0 + idx * 1.2];
        def.rotation = Math.PI;
      }
      this.updateCharacterVisual(def);
    });

    // Place ball with active thrower
    const activeThrower = attackers[this.currentAttackerIndex];
    if (activeThrower) {
      this.ballSystem.giveToPlayer(activeThrower.id, activeThrower.position, activeThrower.rotation);
    }
  }

  public startThrowingPhase() {
    this.setState('ATTACKING_THROW');
    this.stonesSystem.resetToFullStack();
    this.positionPlayersForThrow();
    const activeThrower = this.getActiveThrower();
    this.listeners.onAlert(`${activeThrower?.name || 'Attacker'}'s turn to throw! (Chances: ${activeThrower?.chancesLeft}/3)`);
  }

  // --- THROWING LOGIC ---
  public handleThrowAction() {
    if (this.state !== 'ATTACKING_THROW') return;

    const thrower = this.getActiveThrower();
    if (!thrower || !thrower.isHoldingBall) return;

    // Check 7-meter line violation rule:
    // If attacker stepped over the throwing line before release
    const isViolation = thrower.position[2] > THROWING_FOUL_MARGIN;

    // Calculate throw velocity based on pitch, yaw and power
    const yaw = thrower.rotation;
    const speed = this.throwPower;
    const vx = Math.sin(yaw) * speed * Math.cos(this.aimPitch);
    const vy = Math.sin(this.aimPitch) * speed + 1.5;
    const vz = Math.cos(yaw) * speed * Math.cos(this.aimPitch);

    const startPos = new THREE.Vector3(
      thrower.position[0],
      thrower.position[1] + 1.2,
      thrower.position[2]
    );

    thrower.isHoldingBall = false;
    thrower.animState = 'throw';
    thrower.animTimer = 0;
    this.stats.throwsAttempted++;

    if (isViolation) {
      this.listeners.onAlert('⚠️ FOUL! Stepped over the 7m line!', 2500);
    }

    this.ballSystem.throw(startPos, new THREE.Vector3(vx, vy, vz), thrower.id, isViolation);
    this.ballSystem.hideTrajectory();
    this.listeners.onHUDUpdate();
  }

  // Handle outcome when a throw misses or ends
  private handleMissedThrow(thrower: Player) {
    thrower.chancesLeft--;
    this.listeners.onAlert(`Missed! Chances left: ${thrower.chancesLeft}/3`);

    if (thrower.chancesLeft <= 0) {
      // Next attacker's turn
      const attackers = this.getAttackers().filter(p => !p.isEliminated);
      const nextIndex = this.currentAttackerIndex + 1;

      if (nextIndex < attackers.length) {
        this.currentAttackerIndex = nextIndex;
        this.positionPlayersForThrow();
        const nextThrower = this.getActiveThrower();
        this.listeners.onAlert(`${nextThrower?.name}'s turn to throw!`);
      } else {
        // ALL attackers exhausted their 3 chances without knocking down the stack!
        this.handleAllAttackersExhausted();
      }
    } else {
      // Same attacker still has chances
      this.positionPlayersForThrow();
    }
  }

  // Rule: If all attacking players exhaust their 3 chances, switch roles!
  private handleAllAttackersExhausted() {
    this.listeners.onAlert('All 3 chances exhausted! SWITCHING TEAMS!', 3000);
    soundManager.playWhistle();

    setTimeout(() => {
      // Switch roles
      const teamAOldRole = this.teamRoles.TEAM_A;
      this.teamRoles.TEAM_A = teamAOldRole === 'ATTACKERS' ? 'DEFENDERS' : 'ATTACKERS';
      this.teamRoles.TEAM_B = teamAOldRole === 'ATTACKERS' ? 'ATTACKERS' : 'DEFENDERS';

      // Reset chances
      this.players.forEach(p => {
        p.chancesLeft = CHANCES_PER_ATTACKER;
        p.isEliminated = false;
      });
      this.currentAttackerIndex = 0;
      this.startThrowingPhase();
    }, 2800);
  }

  // --- STACK KNOCKED DOWN -> REBUILDING PHASE ---
  public handleStackKnockedDown(impactPos: THREE.Vector3, ballVel: THREE.Vector3) {
    this.stonesSystem.scatterStones(impactPos, ballVel);
    this.stats.throwsHit++;
    this.setState('REBUILDING');
    this.listeners.onAlert('💥 STONES DOWN! Rebuild the 7 stones!', 3000);

    // Ball immediately transfers to defending team!
    // Give ball to the nearest defender to where ball landed
    setTimeout(() => {
      const defenders = this.getDefenders().filter(p => !p.isEliminated);
      if (defenders.length > 0) {
        const ballPos = this.ballSystem.getPositionVector();
        let closest = defenders[0];
        let minDist = Infinity;
        defenders.forEach(d => {
          const dist = Math.hypot(d.position[0] - ballPos.x, d.position[2] - ballPos.z);
          if (dist < minDist) {
            minDist = dist;
            closest = d;
          }
        });

        closest.isHoldingBall = true;
        this.ballSystem.giveToPlayer(closest.id, closest.position, closest.rotation);
        this.updateCharacterVisual(closest);
        this.listeners.onHUDUpdate();
      }
    }, 400);
  }

  // --- STONE REBUILDING INTERACTION ---
  public handleStoneInteraction(player: Player) {
    if (this.state !== 'REBUILDING' && this.state !== 'VICTORY_CALLS') return;
    if (player.isEliminated) return;
    if (this.teamRoles[player.team] !== 'ATTACKERS') return;

    const pPos: [number, number, number] = player.position;
    const distToCenter = Math.hypot(pPos[0], pPos[2]);

    // If player is already carrying a stone: can place it at the center circle!
    if (player.hasCarriedStoneId !== null) {
      if (distToCenter <= STONE_CIRCLE_RADIUS + 0.8) {
        // Place stone onto stack!
        const success = this.stonesSystem.stackNextStone();
        if (success) {
          player.hasCarriedStoneId = null;
          player.animState = 'place';
          this.stats.stonesRebuilt++;
          this.updateCharacterVisual(player);
          this.listeners.onAlert(`Stone placed! (${this.stonesSystem.rebuiltCount}/7)`);

          // Check if all 7 stones are stacked!
          if (this.stonesSystem.rebuiltCount === TOTAL_STONES) {
            this.startVictoryCalls();
          }
        }
      } else {
        this.listeners.onAlert('Bring the stone into the marked circle!', 1500);
      }
      return;
    }

    // If player is NOT carrying a stone:
    // Check if near the next required stone to pick it up, or if at circle, place next stone if near!
    const targetStoneId = this.stonesSystem.rebuiltCount;
    const targetStone = this.stonesSystem.stones.find(s => s.id === targetStoneId && !s.isStacked);

    if (targetStone) {
      const distToStone = Math.hypot(targetStone.position[0] - pPos[0], targetStone.position[2] - pPos[2]);
      if (distToStone <= INTERACTION_RADIUS) {
        // Pick up stone!
        player.hasCarriedStoneId = targetStone.id;
        // Hide scattered stone while carried
        targetStone.position[1] = -100;
        this.updateCharacterVisual(player);
        soundManager.playStonePlace();
        this.listeners.onAlert(`Picked stone #${targetStone.id + 1}! Run to center circle!`, 2000);
      } else if (distToCenter <= STONE_CIRCLE_RADIUS + 0.8) {
        this.listeners.onAlert(`Find stone #${targetStoneId + 1} on the field!`, 1500);
      }
    }
  }

  // --- VICTORY CALLS ("Seven Stones!" 3x) ---
  public startVictoryCalls() {
    this.setState('VICTORY_CALLS');
    this.victoryCallStep = 1;
    this.victoryCallTimer = 0;
    this.listeners.onVictoryCall(1);
    soundManager.speakVictoryCall(1);
  }

  private updateVictoryCalls(delta: number) {
    this.victoryCallTimer += delta;

    if (this.victoryCallStep === 1 && this.victoryCallTimer >= 1.4) {
      this.victoryCallStep = 2;
      this.victoryCallTimer = 0;
      this.listeners.onVictoryCall(2);
      soundManager.speakVictoryCall(2);
    } else if (this.victoryCallStep === 2 && this.victoryCallTimer >= 1.4) {
      this.victoryCallStep = 3;
      this.victoryCallTimer = 0;
      this.listeners.onVictoryCall(3);
      soundManager.speakVictoryCall(3);
    } else if (this.victoryCallStep === 3 && this.victoryCallTimer >= 1.2) {
      // Victory completed!
      const activeAttackers = this.getAttackers().filter(p => !p.isEliminated);
      if (activeAttackers.length > 0) {
        const attackerTeam = this.getAttackingTeamId();
        this.endMatch(attackerTeam, 'Seven Stones successfully rebuilt and called 3 times!');
      }
    }
  }

  // --- DEFENDER PASSING & ELIMINATION ---
  public defenderPassBall(passer: Player, targetDefender: Player) {
    if (!passer.isHoldingBall || passer.isEliminated) return;

    passer.isHoldingBall = false;
    passer.animState = 'throw';
    this.updateCharacterVisual(passer);

    const fromPos = new THREE.Vector3(passer.position[0], 1.2, passer.position[2]);
    const toPos = new THREE.Vector3(targetDefender.position[0], 1.3, targetDefender.position[2]);

    // Head-level controlled trajectory
    const dir = toPos.clone().sub(fromPos);
    const dist = dir.length();
    const speed = Math.min(22, Math.max(12, dist * 2.2));
    const flightTime = dist / speed;

    const vx = dir.x / flightTime;
    const vy = (dir.y + 0.5 * 14.0 * flightTime * flightTime) / flightTime;
    const vz = dir.z / flightTime;

    this.ballSystem.throw(fromPos, new THREE.Vector3(vx, vy, vz), passer.id);
    this.stats.passesCompleted++;
  }

  public defenderThrowAtAttacker(defender: Player, targetAttacker: Player) {
    if (!defender.isHoldingBall || defender.isEliminated) return;

    defender.isHoldingBall = false;
    defender.animState = 'throw';
    this.updateCharacterVisual(defender);

    const fromPos = new THREE.Vector3(defender.position[0], 1.2, defender.position[2]);
    const toPos = new THREE.Vector3(targetAttacker.position[0], 1.1, targetAttacker.position[2]);

    const dir = toPos.clone().sub(fromPos);
    const dist = dir.length();
    const speed = 19;
    const flightTime = dist / speed;

    const vx = dir.x / flightTime;
    const vy = (dir.y + 0.5 * 14.0 * flightTime * flightTime) / flightTime;
    const vz = dir.z / flightTime;

    this.ballSystem.throw(fromPos, new THREE.Vector3(vx, vy, vz), defender.id);
  }

  // Eliminate attacker upon direct ball impact
  public eliminateAttacker(attacker: Player) {
    if (attacker.isEliminated) return;

    attacker.isEliminated = true;
    attacker.animState = 'hit';

    // Drop any stone carried
    if (attacker.hasCarriedStoneId !== null) {
      const stone = this.stonesSystem.stones.find(s => s.id === attacker.hasCarriedStoneId);
      if (stone) {
        stone.position = [attacker.position[0], 0.2, attacker.position[2]];
        stone.velocity = [0, 0, 0];
      }
      attacker.hasCarriedStoneId = null;
    }

    this.stats.eliminationsCount++;
    soundManager.playPlayerHit();
    this.updateCharacterVisual(attacker);
    this.listeners.onAlert(`💥 ${attacker.name} ELIMINATED!`, 2500);

    // Check if ALL attackers have been eliminated
    const remainingAttackers = this.getAttackers().filter(p => !p.isEliminated);
    if (remainingAttackers.length === 0) {
      const defenderTeam = this.getDefendingTeamId();
      this.endMatch(defenderTeam, 'Defenders eliminated all attackers with the ball!');
    }
  }

  // --- END OF MATCH ---
  public endMatch(winner: TeamId | null, reason: string) {
    this.matchWinner = winner;
    this.winReason = reason;
    this.setState('MATCH_RESULT');

    if (winner) {
      soundManager.playFanfare();
    }
  }

  // --- GAME LOOP ---
  private gameLoop(time: number) {
    if (this.isDestroyed) return;

    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (this.state !== 'PAUSED' && this.state !== 'MENU') {
      // 10:00 Countdown timer
      if (this.state !== 'MATCH_RESULT' && this.state !== 'TOSS' && this.state !== 'ROLE_SELECTION') {
        this.matchTimeRemaining -= delta;
        if (this.matchTimeRemaining <= 0) {
          this.matchTimeRemaining = 0;
          this.endMatch(null, 'Time limit of 10:00 reached! Draw evaluation.');
        }
        this.listeners.onTimerTick(Math.ceil(this.matchTimeRemaining));
      }

      // Physics updates
      this.stonesSystem.updatePhysics(delta);
      this.ballSystem.updatePhysics(delta);

      // Check ball collisions
      this.checkBallCollisions();

      // Update Human and AI movement
      this.updatePlayers(delta);

      // Update Victory Calls progression if active
      if (this.state === 'VICTORY_CALLS') {
        this.updateVictoryCalls(delta);
      }

      // Camera follow
      this.updateCamera();
    }

    this.playground.render();
    requestAnimationFrame(this.gameLoop);
  }

  private checkBallCollisions() {
    const ballPos = this.ballSystem.getPositionVector();
    const ballVel = this.ballSystem.getVelocityVector();

    // 1. In ATTACKING_THROW phase: Check collision with stacked stones
    if (this.state === 'ATTACKING_THROW' && this.ballSystem.data.isInAir) {
      if (this.stonesSystem.checkStackBallCollision(ballPos, BALL_RADIUS)) {
        if (this.ballSystem.data.isThrowViolation) {
          // Foul: stack reset, miss counted
          this.listeners.onAlert('Throw violation! Line crossed!', 2000);
          const thrower = this.getActiveThrower();
          if (thrower) this.handleMissedThrow(thrower);
        } else {
          this.handleStackKnockedDown(ballPos, ballVel);
        }
        return;
      }

      // Check if throw missed and landed on ground behind stones
      if (!this.ballSystem.data.isInAir && ballPos.y <= BALL_RADIUS + 0.05) {
        const thrower = this.getActiveThrower();
        if (thrower) {
          this.handleMissedThrow(thrower);
        }
        return;
      }

      // Airborne Catch Rule:
      // If defender catches the ball while it is still airborne before touching ground or stones
      if (this.ballSystem.data.isInAir && ballPos.z > 0) {
        for (const def of this.getDefenders()) {
          const dPos = def.position;
          const dist = Math.hypot(dPos[0] - ballPos.x, dPos[2] - ballPos.z);
          if (dist < 1.0 && ballPos.y > 0.4 && ballPos.y < 2.0) {
            // Airborne catch!
            const thrower = this.getActiveThrower();
            if (thrower) {
              this.listeners.onAlert(`🙌 AIRBORNE CATCH by ${def.name}! All 3 chances lost!`, 3000);
              thrower.chancesLeft = 0;
              this.handleMissedThrow(thrower);
              return;
            }
          }
        }
      }
    }

    // 2. In REBUILDING or VICTORY_CALLS: Defender throws ball to eliminate attackers or pass
    if ((this.state === 'REBUILDING' || this.state === 'VICTORY_CALLS') && this.ballSystem.data.isInAir) {
      // Check collision with attackers
      for (const atk of this.getAttackers()) {
        if (atk.isEliminated) continue;

        const aPos = atk.position;
        const dist = Math.hypot(aPos[0] - ballPos.x, aPos[2] - ballPos.z);

        if (dist <= PLAYER_RADIUS + BALL_RADIUS && ballPos.y >= 0.2 && ballPos.y <= 1.7) {
          // HIT! Attacker eliminated!
          this.ballSystem.data.isInAir = false;
          this.eliminateAttacker(atk);
          return;
        }
      }

      // Defender catch ball (passing receiver)
      for (const def of this.getDefenders()) {
        if (def.isEliminated || def.id === this.ballSystem.data.lastThrownByPlayerId) continue;

        const dPos = def.position;
        const dist = Math.hypot(dPos[0] - ballPos.x, dPos[2] - ballPos.z);
        if (dist <= 1.1 && ballPos.y >= 0.3 && ballPos.y <= 2.0) {
          // Catch pass!
          def.isHoldingBall = true;
          this.ballSystem.giveToPlayer(def.id, def.position, def.rotation);
          this.updateCharacterVisual(def);
          this.listeners.onHUDUpdate();
          return;
        }
      }
    }
  }

  // --- PLAYER MOVEMENT & AI SYSTEM ---
  private updatePlayers(delta: number) {
    const humanPlayer = this.getHumanPlayer();

    // 1. Update Human Player
    if (humanPlayer && !humanPlayer.isEliminated) {
      let isMoving = false;

      // RULE: DEFENDER HOLDING BALL MUST REMAIN STATIONARY!
      const isStationaryDefender = humanPlayer.isHoldingBall && this.teamRoles[humanPlayer.team] === 'DEFENDERS';

      if (!isStationaryDefender) {
        const moveSpeed = 6.2;
        const dx = this.inputKeys.moveX;
        const dz = this.inputKeys.moveZ;

        if (dx !== 0 || dz !== 0) {
          isMoving = true;
          const len = Math.hypot(dx, dz);
          const nx = (dx / len) * moveSpeed * delta;
          const nz = (dz / len) * moveSpeed * delta;

          humanPlayer.position[0] = Math.max(-ARENA_WIDTH / 2 + 0.8, Math.min(ARENA_WIDTH / 2 - 0.8, humanPlayer.position[0] + nx));
          humanPlayer.position[2] = Math.max(-ARENA_LENGTH / 2 + 0.8, Math.min(ARENA_LENGTH / 2 - 0.8, humanPlayer.position[2] + nz));
          humanPlayer.rotation = Math.atan2(dx, dz);
        }
      }

      // Check interaction key for rebuilding stones
      if (this.inputKeys.isInteracting) {
        this.handleStoneInteraction(humanPlayer);
      }

      // Update aim trajectory if human has ball and is aiming
      if (humanPlayer.isHoldingBall && this.state === 'ATTACKING_THROW') {
        const yaw = humanPlayer.rotation;
        const vx = Math.sin(yaw) * this.throwPower * Math.cos(this.aimPitch);
        const vy = Math.sin(this.aimPitch) * this.throwPower + 1.5;
        const vz = Math.cos(yaw) * this.throwPower * Math.cos(this.aimPitch);
        const startPos = new THREE.Vector3(humanPlayer.position[0], 1.2, humanPlayer.position[2]);
        this.ballSystem.updateTrajectory(startPos, new THREE.Vector3(vx, vy, vz));
      } else {
        this.ballSystem.hideTrajectory();
      }

      this.updateCharacterVisual(humanPlayer, isMoving);
    }

    // 2. Update AI Players
    this.updateAIPlayers(delta);
  }

  // Intelligent AI behaviors:
  // - Defenders with ball: REMAIN STATIONARY. Find closest attacker or pass to teammate closer to target.
  // - Defenders without ball: Move toward loose ball or surround active attackers.
  // - Attackers: Run to unstacked stones, carry to center circle, dodge away if ball incoming!
  private updateAIPlayers(delta: number) {
    this.aiActionTimer += delta;

    this.players.forEach(ai => {
      if (ai.isHuman || ai.isEliminated) return;

      const isAttacker = this.teamRoles[ai.team] === 'ATTACKERS';
      let isMoving = false;

      if (this.state === 'REBUILDING' || this.state === 'VICTORY_CALLS') {
        if (isAttacker) {
          // --- AI ATTACKER BEHAVIOR ---
          // Check threat: ball flying nearby?
          const ballPos = this.ballSystem.getPositionVector();
          const distToBall = Math.hypot(ai.position[0] - ballPos.x, ai.position[2] - ballPos.z);

          if (this.ballSystem.data.isInAir && distToBall < 4.0) {
            // Dodge away from ball trajectory!
            const dodgeX = ai.position[0] - ballPos.x;
            const dodgeZ = ai.position[2] - ballPos.z;
            this.moveAIToward(ai, ai.position[0] + dodgeX * 3, ai.position[2] + dodgeZ * 3, 6.5, delta);
            isMoving = true;
          } else if (ai.hasCarriedStoneId !== null) {
            // Carrying stone: move directly to center circle!
            const distToCenter = Math.hypot(ai.position[0], ai.position[2]);
            if (distToCenter > 1.2) {
              this.moveAIToward(ai, 0, 0, 5.5, delta);
              isMoving = true;
            } else {
              // Within circle: place stone!
              this.handleStoneInteraction(ai);
            }
          } else {
            // Not carrying stone: find next unstacked stone and go pick it up
            const targetStone = this.stonesSystem.stones.find(s => s.id === this.stonesSystem.rebuiltCount && !s.isStacked);
            if (targetStone) {
              const distToStone = Math.hypot(ai.position[0] - targetStone.position[0], ai.position[2] - targetStone.position[2]);
              if (distToStone > 1.2) {
                this.moveAIToward(ai, targetStone.position[0], targetStone.position[2], 5.2, delta);
                isMoving = true;
              } else {
                this.handleStoneInteraction(ai);
              }
            } else {
              // All scattered stones are being held or already stacked; hover safely
              this.moveAIToward(ai, Math.sin(Date.now() * 0.001) * 4, -4, 4.0, delta);
              isMoving = true;
            }
          }
        } else {
          // --- AI DEFENDER BEHAVIOR ---
          if (ai.isHoldingBall) {
            // CRITICAL RULE: DEFENDER WITH BALL IS STRICTLY STATIONARY!
            // No movement. Must aim and pass or throw at an attacker!
            if (this.aiActionTimer >= 1.2) {
              this.aiActionTimer = 0;
              const activeAttackers = this.getAttackers().filter(p => !p.isEliminated);
              if (activeAttackers.length > 0) {
                // Find closest attacker
                let targetAttacker = activeAttackers[0];
                let minDist = Infinity;
                activeAttackers.forEach(atk => {
                  const d = Math.hypot(atk.position[0] - ai.position[0], atk.position[2] - ai.position[2]);
                  if (d < minDist) {
                    minDist = d;
                    targetAttacker = atk;
                  }
                });

                // If attacker is within 9m: throw ball directly to eliminate!
                if (minDist <= 9.5) {
                  ai.rotation = Math.atan2(targetAttacker.position[0] - ai.position[0], targetAttacker.position[2] - ai.position[2]);
                  this.defenderThrowAtAttacker(ai, targetAttacker);
                } else {
                  // Attacker is far away: pass to teammate who is closer!
                  const teammates = this.getDefenders().filter(d => !d.isEliminated && d.id !== ai.id);
                  let bestTeammate = teammates[0];
                  let bestDist = Infinity;
                  teammates.forEach(tm => {
                    const d = Math.hypot(tm.position[0] - targetAttacker.position[0], tm.position[2] - targetAttacker.position[2]);
                    if (d < bestDist) {
                      bestDist = d;
                      bestTeammate = tm;
                    }
                  });

                  if (bestTeammate) {
                    ai.rotation = Math.atan2(bestTeammate.position[0] - ai.position[0], bestTeammate.position[2] - ai.position[2]);
                    this.defenderPassBall(ai, bestTeammate);
                  }
                }
              }
            }
          } else {
            // AI Defender WITHOUT ball: Can move freely!
            // If ball is loose on ground, run to pick it up!
            const ballPos = this.ballSystem.getPositionVector();
            const distToBall = Math.hypot(ai.position[0] - ballPos.x, ai.position[2] - ballPos.z);

            if (!this.ballSystem.data.isInAir && this.ballSystem.data.holderPlayerId === null) {
              if (distToBall > 0.8) {
                this.moveAIToward(ai, ballPos.x, ballPos.z, 5.8, delta);
                isMoving = true;
              } else {
                // Pick up loose ball!
                ai.isHoldingBall = true;
                this.ballSystem.giveToPlayer(ai.id, ai.position, ai.rotation);
                this.updateCharacterVisual(ai);
                this.listeners.onHUDUpdate();
              }
            } else {
              // Position themselves to intercept attackers near the center circle!
              const targetX = Math.sin(ai.number * 2.0) * 4.5;
              const targetZ = 1.5 + ai.number * 1.8;
              this.moveAIToward(ai, targetX, targetZ, 4.5, delta);
              isMoving = true;
            }
          }
        }
      }

      this.updateCharacterVisual(ai, isMoving);
    });
  }

  private moveAIToward(ai: Player, targetX: number, targetZ: number, speed: number, delta: number) {
    const dx = targetX - ai.position[0];
    const dz = targetZ - ai.position[2];
    const dist = Math.hypot(dx, dz);

    if (dist > 0.1) {
      ai.position[0] += (dx / dist) * speed * delta;
      ai.position[2] += (dz / dist) * speed * delta;
      ai.rotation = Math.atan2(dx, dz);
    }
  }

  private updateCharacterVisual(player: Player, isMoving: boolean = false) {
    const visual = this.characters.get(player.id);
    if (!visual) return;

    visual.player = player;
    visual.setCarryingStone(player.hasCarriedStoneId !== null);
    visual.update(0.016, isMoving);
  }

  // Camera smoothly follows player or active thrower
  private updateCamera() {
    const focusTarget = this.getHumanPlayer() || this.getActiveThrower();
    if (!focusTarget) return;

    const targetPos = new THREE.Vector3(...focusTarget.position);

    if (this.state === 'ATTACKING_THROW') {
      // Behind-the-thrower camera view pointing toward stones
      const camTarget = new THREE.Vector3(targetPos.x, targetPos.y + 4.2, targetPos.z - 6.5);
      this.playground.camera.position.lerp(camTarget, 0.08);
      this.playground.camera.lookAt(targetPos.x, 1.2, targetPos.z + 7.0);
    } else {
      // Dynamic overhead action angle
      const camTarget = new THREE.Vector3(targetPos.x * 0.4, 12.0, targetPos.z - 11.0);
      this.playground.camera.position.lerp(camTarget, 0.06);
      this.playground.camera.lookAt(targetPos.x, 0.5, targetPos.z);
    }
  }

  // --- GETTERS & UTILITIES ---
  public setState(nextState: GameMode) {
    this.state = nextState;
    this.listeners.onStateChange(nextState);
  }

  public getHumanPlayer(): Player | undefined {
    return this.players.find(p => p.isHuman);
  }

  public getActiveThrower(): Player | undefined {
    const attackers = this.getAttackers().filter(p => !p.isEliminated);
    return attackers[this.currentAttackerIndex] || attackers[0];
  }

  public getAttackers(): Player[] {
    return this.players.filter(p => this.teamRoles[p.team] === 'ATTACKERS');
  }

  public getDefenders(): Player[] {
    return this.players.filter(p => this.teamRoles[p.team] === 'DEFENDERS');
  }

  public getAttackingTeamId(): TeamId {
    return this.teamRoles.TEAM_A === 'ATTACKERS' ? 'TEAM_A' : 'TEAM_B';
  }

  public getDefendingTeamId(): TeamId {
    return this.teamRoles.TEAM_A === 'DEFENDERS' ? 'TEAM_A' : 'TEAM_B';
  }

  public restartMatch() {
    this.matchTimeRemaining = MATCH_DURATION_SECONDS;
    this.victoryCallStep = 0;
    this.matchWinner = null;
    this.winReason = '';
    this.currentAttackerIndex = 0;
    this.stats = {
      throwsAttempted: 0,
      throwsHit: 0,
      eliminationsCount: 0,
      stonesRebuilt: 0,
      passesCompleted: 0
    };
    this.startMatchCountdown();
  }

  public dispose() {
    this.isDestroyed = true;
    this.characters.forEach(c => c.dispose());
    this.characters.clear();
    this.playground.dispose();
  }
}
