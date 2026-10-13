export type GameMode = 
  | 'MENU' 
  | 'TOSS' 
  | 'ROLE_SELECTION' 
  | 'MATCH_COUNTDOWN' 
  | 'ATTACKING_THROW' 
  | 'REBUILDING' 
  | 'VICTORY_CALLS' 
  | 'ROUND_RESULT' 
  | 'MATCH_RESULT' 
  | 'PAUSED';

export type TeamId = 'TEAM_A' | 'TEAM_B';
export type Role = 'ATTACKERS' | 'DEFENDERS';

export interface Player {
  id: string;
  name: string;
  team: TeamId;
  number: number;
  isHuman: boolean;
  position: [number, number, number]; // x, y, z
  rotation: number; // yaw in radians
  isEliminated: boolean;
  chancesLeft: number; // starts at 3 for attackers
  isHoldingBall: boolean;
  hasCarriedStoneId: number | null; // stone currently carried if any
  animState: 'idle' | 'run' | 'throw' | 'place' | 'hit' | 'celebrate';
  animTimer: number;
  color: string;
}

export interface StoneData {
  id: number; // 0 to 6 (7 stones total)
  sizeRadius: number;
  height: number;
  color: string;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  angularVelocity: [number, number, number];
  isStacked: boolean;
  stackIndex: number | null; // 0 (bottom) to 6 (top)
}

export interface BallData {
  position: [number, number, number];
  velocity: [number, number, number];
  isInAir: boolean;
  holderPlayerId: string | null;
  lastThrownByPlayerId: string | null;
  isThrowViolation: boolean; // stepped over 7m line
}

export interface TossState {
  userChoice: 'HEADS' | 'TAILS' | null;
  result: 'HEADS' | 'TAILS' | null;
  winnerTeam: TeamId | null;
  isFlipping: boolean;
}

export interface MatchStats {
  throwsAttempted: number;
  throwsHit: number;
  eliminationsCount: number;
  stonesRebuilt: number;
  passesCompleted: number;
}
