import confetti from 'canvas-confetti';
import { AttributeDefinition, AttributeKey, PlayerProfile, Quest, RankTier } from '../types';

export const ATTRIBUTE_DEFINITIONS: Record<AttributeKey, AttributeDefinition> = {
  STR: {
    key: 'STR',
    name: 'STR',
    fullName: 'Strength',
    description: 'Physical prowess, muscular capacity, and athletic output.',
    icon: 'fitness_center',
  },
  VIT: {
    key: 'VIT',
    name: 'VIT',
    fullName: 'Vitality',
    description: 'Endurance, metabolic stamina, cardiovascular health, and sleep recovery.',
    icon: 'favorite',
  },
  INT: {
    key: 'INT',
    name: 'INT',
    fullName: 'Intelligence',
    description: 'Analytical depth, algorithmic reasoning, and architectural logic.',
    icon: 'psychology',
  },
  FOC: {
    key: 'FOC',
    name: 'FOC',
    fullName: 'Focus',
    description: 'Deep uninterrupted work capacity, single-task immersion, and flow density.',
    icon: 'timer',
  },
  DISC: {
    key: 'DISC',
    name: 'DISC',
    fullName: 'Discipline',
    description: 'Routine consistency, habit reinforcement, and resistance to impulse.',
    icon: 'bolt',
  },
  SOC: {
    key: 'SOC',
    name: 'SOC',
    fullName: 'Social',
    description: 'Interpersonal influence, networking empathy, and team synergy.',
    icon: 'group',
  },
};

/**
 * Calculates XP required to advance to the next level
 */
export function getRequiredXpForLevel(level: number): number {
  if (level === 1) return 500;
  if (level === 17) return 3200;
  if (level === 18) return 3400;
  if (level === 19) return 3650;
  if (level === 20) return 3950;
  // Calibrated progressive curve
  return Math.round(500 + Math.pow(level, 1.48) * 48);
}

/**
 * Calculates player Rank based on Level
 */
export function getRankForLevel(level: number): RankTier {
  if (level >= 55) return 'S';
  if (level >= 42) return 'A';
  if (level >= 30) return 'B';
  if (level >= 18) return 'C';
  if (level >= 5) return 'D';
  return 'E';
}

/**
 * Calculates resonance multiplier from streak
 */
export function getResonanceMultiplier(streakDays: number): number {
  const multiplier = 1.0 + Math.min(streakDays * 0.0125, 0.5);
  return Number(multiplier.toFixed(2));
}

export interface XpProgressionResult {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  rank: RankTier;
  unallocatedPoints: number;
  totalXp: number;
  didLevelUp: boolean;
  didRankUp: boolean;
  levelsGained: number;
}

/**
 * Calculates XP and level progression when XP is gained.
 * Supports crossing multiple level thresholds in a single action,
 * preserving exact level-to-level XP curves and rank thresholds.
 */
export function calculateXpProgression(
  currentLevel: number,
  currentXp: number,
  xpToNextLevel: number,
  currentRank: RankTier,
  currentUnallocatedPoints: number,
  currentTotalXp: number,
  gainedXp: number
): XpProgressionResult {
  const safeGainedXp = Math.max(0, Math.round(gainedXp));
  let level = currentLevel;
  let xp = currentXp + safeGainedXp;
  let totalXp = currentTotalXp + safeGainedXp;
  let threshold = xpToNextLevel > 0 ? xpToNextLevel : getRequiredXpForLevel(level);
  let unallocatedPoints = currentUnallocatedPoints;
  let levelsGained = 0;

  while (xp >= threshold && threshold > 0) {
    levelsGained++;
    level += 1;
    xp -= threshold;
    unallocatedPoints += 1;
    threshold = getRequiredXpForLevel(level);
  }

  const rank = getRankForLevel(level);
  const didLevelUp = levelsGained > 0;
  const didRankUp = rank !== currentRank;

  return {
    level,
    currentXp: xp,
    xpToNextLevel: threshold,
    rank,
    unallocatedPoints,
    totalXp,
    didLevelUp,
    didRankUp,
    levelsGained,
  };
}

// Web Audio API Sci-Fi Sound Synthesizer
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export const SoundFX = {
  playClick(enabled = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  },

  playToggle(enabled = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },

  playQuestComplete(enabled = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.08, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.35);
    });
  },

  playLevelUp(enabled = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Harmonic resonant chord
    const freqs = [329.63, 440, 554.37, 659.25, 880, 1108.73];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + 1.2);
    });
  },

  playRankUp(enabled = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = [220, 329.63, 440, 659.25, 880, 1318.51];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.8);
    });
  },

  playPenalty(enabled = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.4);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  },

  playBossVictory(enabled = true) {
    if (!enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const arpeggio = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.1, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  },
};

/**
 * Trigger confetti with System Violet & Cyber Blue aesthetic
 */
export function triggerSystemConfetti() {
  confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.65 },
    colors: ['#8B3DFF', '#B45CFF', '#4D8DFF', '#3DDB8B', '#FFFFFF'],
    disableForReducedMotion: true,
  });
}

export function triggerBossConfetti() {
  const end = Date.now() + 1.2 * 1000;
  const colors = ['#8B3DFF', '#B45CFF', '#4D8DFF', '#FFFFFF', '#FFD700'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
      disableForReducedMotion: true,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Format countdown seconds into HH:MM:SS
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
