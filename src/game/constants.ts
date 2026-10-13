export const ARENA_WIDTH = 22; // X range [-11, 11]
export const ARENA_LENGTH = 32; // Z range [-16, 16]

// Stone circle is centered at (0, 0, 0)
export const STONE_CIRCLE_RADIUS = 1.3;

// The exact 7-meter throwing line is at Z = -7.0m
export const THROWING_LINE_Z = -7.0;

// Attacker throw line restriction: attacker cannot step past Z = -7.0m before releasing
export const THROWING_FOUL_MARGIN = -6.8;

// Match duration: 10 minutes in seconds
export const MATCH_DURATION_SECONDS = 600;

// Exactly seven stones
export const TOTAL_STONES = 7;

// Chances per attacker
export const CHANCES_PER_ATTACKER = 3;

// Stone geometry constants: from base stone (0) to top stone (6)
export const STONE_CONFIGS = [
  { id: 0, radius: 0.52, height: 0.12, color: '#64748b' }, // large base stone (slate grey)
  { id: 1, radius: 0.46, height: 0.11, color: '#78716c' }, // warm stone
  { id: 2, radius: 0.40, height: 0.10, color: '#57534e' }, // dark granite
  { id: 3, radius: 0.35, height: 0.09, color: '#a8a29e' }, // light river rock
  { id: 4, radius: 0.30, height: 0.08, color: '#71717a' }, // basalt
  { id: 5, radius: 0.25, height: 0.07, color: '#d97706' }, // amber sandstone
  { id: 6, radius: 0.20, height: 0.06, color: '#ea580c' }, // terra cotta crown stone
];

export const BALL_RADIUS = 0.15;
export const PLAYER_RADIUS = 0.45;
export const PLAYER_HEIGHT = 1.75;
export const INTERACTION_RADIUS = 1.8; // range to pick up / stack stone

export const TEAM_COLORS = {
  TEAM_A: {
    primary: '#ef4444', // Crimson Red
    secondary: '#f97316', // Orange
    name: 'Team Phoenix',
    accent: '#fee2e2'
  },
  TEAM_B: {
    primary: '#2563eb', // Royal Blue
    secondary: '#06b6d4', // Cyan
    name: 'Team Cobalt',
    accent: '#dbeafe'
  }
};
