import { Achievement, PlayerProfile, Quest } from '../types';
import { FRESH_PLAYER_PROFILE } from '../game/initialData';

export const CURRENT_BACKUP_VERSION = 1;

export const STORAGE_KEYS = {
  PROFILE: 'system_player_profile_v1',
  QUESTS: 'system_player_quests_v1',
  ACHIEVEMENTS: 'system_player_achievements_v1',
} as const;

export interface SystemBackupPayload {
  version: number;
  formatVersion?: number;
  exportTimestamp: string;
  architectureVersion?: string;
  profile: PlayerProfile;
  quests: Quest[];
  achievements: Achievement[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: SystemBackupPayload;
}

/**
 * Validates the structure and required fields of an imported backup object.
 * Rejects invalid or unsupported files with descriptive error messages.
 */
export function validateBackup(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Invalid backup format: Root must be a JSON object.' };
  }

  const data = raw as Record<string, unknown>;

  // Format Version validation
  const version = data.version ?? data.formatVersion;
  if (version !== undefined) {
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
      return { valid: false, error: `Invalid backup format version: "${String(version)}". Must be a positive integer.` };
    }
    if (version > CURRENT_BACKUP_VERSION) {
      return {
        valid: false,
        error: `Unsupported backup version (${version}). This SYSTEM version supports up to version ${CURRENT_BACKUP_VERSION}.`,
      };
    }
  } else if (!data.architectureVersion) {
    return { valid: false, error: 'Invalid backup file: Missing format version or architecture version identifier.' };
  }

  // Export Timestamp validation
  if (!data.exportTimestamp || typeof data.exportTimestamp !== 'string') {
    return { valid: false, error: 'Invalid backup file: Missing or invalid export timestamp.' };
  }
  if (isNaN(Date.parse(data.exportTimestamp))) {
    return { valid: false, error: 'Invalid backup file: Export timestamp is not a parseable date string.' };
  }

  // Profile validation
  if (!data.profile || typeof data.profile !== 'object' || Array.isArray(data.profile)) {
    return { valid: false, error: 'Invalid backup file: Missing player profile data.' };
  }
  const profile = data.profile as Record<string, unknown>;

  if (typeof profile.name !== 'string' || !profile.name.trim()) {
    return { valid: false, error: 'Invalid player profile: Missing or empty operator name.' };
  }
  if (typeof profile.level !== 'number' || !Number.isInteger(profile.level) || profile.level < 1) {
    return { valid: false, error: 'Invalid player profile: Level must be a positive integer.' };
  }
  if (typeof profile.rank !== 'string' || !profile.rank.trim()) {
    return { valid: false, error: 'Invalid player profile: Missing or invalid rank tier.' };
  }
  if (typeof profile.currentXp !== 'number' || profile.currentXp < 0 || !Number.isFinite(profile.currentXp)) {
    return { valid: false, error: 'Invalid player profile: Current XP must be a non-negative number.' };
  }
  if (typeof profile.xpToNextLevel !== 'number' || profile.xpToNextLevel <= 0 || !Number.isFinite(profile.xpToNextLevel)) {
    return { valid: false, error: 'Invalid player profile: XP threshold to next level must be a positive number.' };
  }
  if (!profile.attributes || typeof profile.attributes !== 'object' || Array.isArray(profile.attributes)) {
    return { valid: false, error: 'Invalid player profile: Missing attributes matrix.' };
  }

  const attrs = profile.attributes as Record<string, unknown>;
  const requiredAttrKeys = ['STR', 'VIT', 'INT', 'FOC', 'DISC', 'SOC'];
  for (const attr of requiredAttrKeys) {
    if (typeof attrs[attr] !== 'number' || !Number.isFinite(attrs[attr]) || attrs[attr] < 0) {
      return { valid: false, error: `Invalid player profile: Attribute ${attr} must be a valid non-negative number.` };
    }
  }

  // Quests validation
  if (!Array.isArray(data.quests)) {
    return { valid: false, error: 'Invalid backup file: Quests field must be an array.' };
  }

  for (let i = 0; i < data.quests.length; i++) {
    const q = data.quests[i];
    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      return { valid: false, error: `Invalid backup: Quest entry at index ${i} is not a valid object.` };
    }
    if (typeof q.id !== 'string' || !q.id.trim()) {
      return { valid: false, error: `Invalid backup: Quest entry at index ${i} is missing a valid id.` };
    }
    if (typeof q.title !== 'string' || !q.title.trim()) {
      return { valid: false, error: `Invalid backup: Quest entry at index ${i} is missing a title.` };
    }
    if (typeof q.status !== 'string' || !['available', 'active', 'completed', 'failed'].includes(q.status)) {
      return { valid: false, error: `Invalid backup: Quest "${q.title || i}" has an invalid status "${String(q.status)}".` };
    }
    if (!Array.isArray(q.objectives)) {
      return { valid: false, error: `Invalid backup: Quest "${q.title || i}" objectives must be an array.` };
    }
    for (let j = 0; j < q.objectives.length; j++) {
      const obj = q.objectives[j];
      if (!obj || typeof obj !== 'object' || typeof obj.id !== 'string' || typeof obj.text !== 'string' || typeof obj.completed !== 'boolean') {
        return { valid: false, error: `Invalid backup: Objective at index ${j} in quest "${q.title}" is malformed.` };
      }
    }
  }

  // Achievements validation
  if (!Array.isArray(data.achievements)) {
    return { valid: false, error: 'Invalid backup file: Achievements field must be an array.' };
  }

  for (let i = 0; i < data.achievements.length; i++) {
    const a = data.achievements[i];
    if (!a || typeof a !== 'object' || Array.isArray(a)) {
      return { valid: false, error: `Invalid backup: Achievement entry at index ${i} is not a valid object.` };
    }
    if (typeof a.id !== 'string' || !a.id.trim()) {
      return { valid: false, error: `Invalid backup: Achievement entry at index ${i} is missing a valid id.` };
    }
    if (typeof a.title !== 'string' || !a.title.trim()) {
      return { valid: false, error: `Invalid backup: Achievement entry at index ${i} is missing a title.` };
    }
    if (typeof a.unlocked !== 'boolean') {
      return { valid: false, error: `Invalid backup: Achievement "${a.title || i}" unlocked flag must be boolean.` };
    }
  }

  // Safe normalization of player profile to prevent runtime errors from missing optional properties
  const normalizedProfile: PlayerProfile = {
    ...FRESH_PLAYER_PROFILE,
    ...(profile as unknown as PlayerProfile),
    attributes: {
      ...FRESH_PLAYER_PROFILE.attributes,
      ...(profile.attributes as PlayerProfile['attributes']),
    },
    preferences: {
      ...FRESH_PLAYER_PROFILE.preferences,
      ...((profile.preferences as PlayerProfile['preferences']) || {}),
      dailyResetTime: (profile.preferences as any)?.dailyResetTime || (FRESH_PLAYER_PROFILE.preferences?.dailyResetTime) || '04:00 AM',
    },
    notifications: {
      ...FRESH_PLAYER_PROFILE.notifications,
      ...((profile.notifications as PlayerProfile['notifications']) || {}),
    },
    appearance: {
      ...FRESH_PLAYER_PROFILE.appearance,
      ...((profile.appearance as PlayerProfile['appearance']) || {}),
    },
    hasCompletedOnboarding:
      typeof profile.hasCompletedOnboarding === 'boolean'
        ? profile.hasCompletedOnboarding
        : (profile.level as number) > 1,
  };

  return {
    valid: true,
    data: {
      version: typeof version === 'number' ? version : CURRENT_BACKUP_VERSION,
      formatVersion: CURRENT_BACKUP_VERSION,
      exportTimestamp: data.exportTimestamp,
      architectureVersion: (data.architectureVersion as string) || '2.4.0-Optimal',
      profile: normalizedProfile,
      quests: data.quests as Quest[],
      achievements: data.achievements as Achievement[],
    },
  };
}

/**
 * Safely parses raw JSON string and runs validation.
 */
export function parseBackupJson(jsonString: string): ValidationResult {
  if (!jsonString || !jsonString.trim()) {
    return { valid: false, error: 'The selected backup file is empty.' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return {
      valid: false,
      error: `Invalid JSON file: ${err instanceof Error ? err.message : 'Failed to parse JSON content.'}`,
    };
  }
  return validateBackup(parsed);
}

/**
 * Reads the latest saved state directly from localStorage.
 * Handles missing localStorage keys and malformed JSON safely without silently resetting progress.
 */
export function readLatestStorageState(
  activeProfile: PlayerProfile,
  activeQuests: Quest[],
  activeAchievements: Achievement[]
): {
  profile: PlayerProfile;
  quests: Quest[];
  achievements: Achievement[];
  warnings: string[];
} {
  const warnings: string[] = [];

  // 1. Read Profile directly from localStorage
  let latestProfile = activeProfile;
  try {
    const rawProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (rawProfile) {
      const parsed = JSON.parse(rawProfile);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.name && parsed.level) {
        latestProfile = parsed;
      } else {
        warnings.push('Profile in localStorage was incomplete; using active session state.');
      }
    } else {
      // Key was missing in localStorage: synchronize current profile so it is not lost
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(activeProfile));
      } catch (saveErr) {
        console.warn('Could not write missing profile key to localStorage', saveErr);
      }
    }
  } catch (parseErr) {
    warnings.push('Profile in localStorage contained malformed JSON; using active session state.');
  }

  // 2. Read Quests directly from localStorage
  let latestQuests = activeQuests;
  try {
    const rawQuests = localStorage.getItem(STORAGE_KEYS.QUESTS);
    if (rawQuests) {
      const parsed = JSON.parse(rawQuests);
      if (Array.isArray(parsed)) {
        latestQuests = parsed;
      } else {
        warnings.push('Quests in localStorage was not an array; using active session state.');
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(activeQuests));
      } catch (saveErr) {
        console.warn('Could not write missing quests key to localStorage', saveErr);
      }
    }
  } catch (parseErr) {
    warnings.push('Quests in localStorage contained malformed JSON; using active session state.');
  }

  // 3. Read Achievements directly from localStorage
  let latestAchievements = activeAchievements;
  try {
    const rawAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (rawAchievements) {
      const parsed = JSON.parse(rawAchievements);
      if (Array.isArray(parsed)) {
        latestAchievements = parsed;
      } else {
        warnings.push('Achievements in localStorage was not an array; using active session state.');
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(activeAchievements));
      } catch (saveErr) {
        console.warn('Could not write missing achievements key to localStorage', saveErr);
      }
    }
  } catch (parseErr) {
    warnings.push('Achievements in localStorage contained malformed JSON; using active session state.');
  }

  return {
    profile: latestProfile,
    quests: latestQuests,
    achievements: latestAchievements,
    warnings,
  };
}

/**
 * Creates a complete backup payload reading current values directly from localStorage.
 */
export function createBackupPayload(
  activeProfile: PlayerProfile,
  activeQuests: Quest[],
  activeAchievements: Achievement[]
): { payload: SystemBackupPayload; warnings: string[] } {
  const { profile, quests, achievements, warnings } = readLatestStorageState(
    activeProfile,
    activeQuests,
    activeAchievements
  );

  const payload: SystemBackupPayload = {
    version: CURRENT_BACKUP_VERSION,
    formatVersion: CURRENT_BACKUP_VERSION,
    exportTimestamp: new Date().toISOString(),
    architectureVersion: '2.4.0-Optimal',
    profile,
    quests,
    achievements,
  };

  return { payload, warnings };
}

/**
 * Triggers a browser download of the backup payload JSON.
 */
export function downloadBackupFile(payload: SystemBackupPayload): void {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  const safeName = (payload.profile?.name || 'OPERATOR')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `system_backup_${safeName}_${timestamp}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
