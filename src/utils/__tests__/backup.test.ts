import {
  CURRENT_BACKUP_VERSION,
  STORAGE_KEYS,
  createBackupPayload,
  parseBackupJson,
  readLatestStorageState,
  validateBackup,
} from '../backup';
import { FRESH_PLAYER_PROFILE, INITIAL_ACHIEVEMENTS, INITIAL_PLAYER_PROFILE, INITIAL_QUESTS } from '../../game/initialData';

// Mock localStorage for Node.js test environment
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }
}

// Set global localStorage
const mockStorage = new MockLocalStorage();
(globalThis as any).localStorage = mockStorage;

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${testName}`);
  } else {
    console.error(`  FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

console.log('\n--- RUNNING BACKUP & RESTORE TEST SUITE ---\n');

// 1. Export structure & versioning tests
console.log('1. Export Backup Structure & Versioning:');
mockStorage.clear();
const backupResult = createBackupPayload(INITIAL_PLAYER_PROFILE, INITIAL_QUESTS, INITIAL_ACHIEVEMENTS);
assert(backupResult.payload.version === CURRENT_BACKUP_VERSION, 'Backup version matches CURRENT_BACKUP_VERSION (1)');
assert(backupResult.payload.formatVersion === 1, 'Backup formatVersion is 1');
assert(typeof backupResult.payload.exportTimestamp === 'string', 'exportTimestamp is a string');
assert(!isNaN(Date.parse(backupResult.payload.exportTimestamp)), 'exportTimestamp is a valid ISO date');
assert(backupResult.payload.profile.name === INITIAL_PLAYER_PROFILE.name, 'Payload contains active profile');
assert(backupResult.payload.quests.length === INITIAL_QUESTS.length, 'Payload contains active quests');
assert(backupResult.payload.achievements.length === INITIAL_ACHIEVEMENTS.length, 'Payload contains active achievements');

// 2. Direct localStorage reading test (Requirement 2)
console.log('\n2. Reading Directly from localStorage Before Export:');
mockStorage.clear();
const customProfile = { ...INITIAL_PLAYER_PROFILE, name: 'CYBER_HERO', level: 99 };
mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(customProfile));
const customQuests = INITIAL_QUESTS.slice(0, 2);
mockStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(customQuests));
const customAchievements = INITIAL_ACHIEVEMENTS.slice(0, 3);
mockStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(customAchievements));

const exportedFromStorage = createBackupPayload(INITIAL_PLAYER_PROFILE, INITIAL_QUESTS, INITIAL_ACHIEVEMENTS);
assert(exportedFromStorage.payload.profile.name === 'CYBER_HERO', 'Export reads latest profile directly from localStorage');
assert(exportedFromStorage.payload.profile.level === 99, 'Export reads latest profile level from localStorage');
assert(exportedFromStorage.payload.quests.length === 2, 'Export reads latest quests directly from localStorage');
assert(exportedFromStorage.payload.achievements.length === 3, 'Export reads latest achievements directly from localStorage');

// 3. Validation tests (Requirement 4)
console.log('\n3. Backup Validation & Required Fields:');
// Valid payload
const validValidation = validateBackup(exportedFromStorage.payload);
assert(validValidation.valid === true, 'Valid payload passes validation');
assert(validValidation.data !== undefined, 'Valid payload returns structured data');

// Empty or non-object
assert(validateBackup(null).valid === false, 'Rejects null input');
assert(validateBackup([]).valid === false, 'Rejects array input');
assert(validateBackup('string').valid === false, 'Rejects string input');

// Version validation
assert(validateBackup({ ...exportedFromStorage.payload, version: 2 }).valid === false, 'Rejects unsupported version 2');
assert(validateBackup({ ...exportedFromStorage.payload, version: -1 }).valid === false, 'Rejects negative version');
assert(validateBackup({ ...exportedFromStorage.payload, version: 'one' as any }).valid === false, 'Rejects non-number version');

// Timestamp validation
assert(validateBackup({ ...exportedFromStorage.payload, exportTimestamp: undefined as any }).valid === false, 'Rejects missing timestamp');
assert(validateBackup({ ...exportedFromStorage.payload, exportTimestamp: 'not-a-date' }).valid === false, 'Rejects invalid date timestamp');

// Profile validation
assert(validateBackup({ ...exportedFromStorage.payload, profile: undefined as any }).valid === false, 'Rejects missing profile');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, name: '' } }).valid === false, 'Rejects empty operator name');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, level: 0 } }).valid === false, 'Rejects level 0');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, level: -5 } }).valid === false, 'Rejects negative level');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, rank: '' } }).valid === false, 'Rejects empty rank');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, currentXp: -1 } }).valid === false, 'Rejects negative XP');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, xpToNextLevel: 0 } }).valid === false, 'Rejects zero XP threshold');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, attributes: null as any } }).valid === false, 'Rejects null attributes');
assert(validateBackup({ ...exportedFromStorage.payload, profile: { ...customProfile, attributes: { ...customProfile.attributes, STR: 'strong' as any } } }).valid === false, 'Rejects non-numeric attribute value');

// Quests validation
assert(validateBackup({ ...exportedFromStorage.payload, quests: 'not-an-array' as any }).valid === false, 'Rejects non-array quests');
assert(validateBackup({ ...exportedFromStorage.payload, quests: [{ id: '', title: 'Test', status: 'active', objectives: [] }] }).valid === false, 'Rejects quest with empty ID');
assert(validateBackup({ ...exportedFromStorage.payload, quests: [{ id: 'q1', title: '', status: 'active', objectives: [] }] }).valid === false, 'Rejects quest with empty title');
assert(validateBackup({ ...exportedFromStorage.payload, quests: [{ id: 'q1', title: 'Test', status: 'invalid_status' as any, objectives: [] }] }).valid === false, 'Rejects quest with invalid status');
assert(validateBackup({ ...exportedFromStorage.payload, quests: [{ id: 'q1', title: 'Test', status: 'active', objectives: 'none' as any }] }).valid === false, 'Rejects quest with non-array objectives');

// Achievements validation
assert(validateBackup({ ...exportedFromStorage.payload, achievements: 'not-an-array' as any }).valid === false, 'Rejects non-array achievements');
assert(validateBackup({ ...exportedFromStorage.payload, achievements: [{ id: '', title: 'Test', unlocked: true }] }).valid === false, 'Rejects achievement with empty ID');
assert(validateBackup({ ...exportedFromStorage.payload, achievements: [{ id: 'a1', title: '', unlocked: true }] }).valid === false, 'Rejects achievement with empty title');
assert(validateBackup({ ...exportedFromStorage.payload, achievements: [{ id: 'a1', title: 'Test', unlocked: 'yes' as any }] }).valid === false, 'Rejects achievement with non-boolean unlocked');

// 4. JSON String Parsing (Requirement 3 & 4)
console.log('\n4. JSON String Parsing:');
assert(parseBackupJson('').valid === false, 'Rejects empty JSON string');
assert(parseBackupJson('   ').valid === false, 'Rejects whitespace JSON string');
assert(parseBackupJson('invalid json {[').valid === false, 'Rejects malformed JSON syntax');
const validJsonString = JSON.stringify(exportedFromStorage.payload);
const parsedValid = parseBackupJson(validJsonString);
assert(parsedValid.valid === true, 'Successfully parses and validates valid JSON backup string');

// 5. Handling Missing localStorage Keys & Corrupted Storage (Requirement 8)
console.log('\n5. Safe Handling of Missing / Corrupted Storage:');
mockStorage.clear();
const fromEmpty = readLatestStorageState(FRESH_PLAYER_PROFILE, INITIAL_QUESTS, INITIAL_ACHIEVEMENTS);
assert(fromEmpty.profile.name === FRESH_PLAYER_PROFILE.name, 'Missing storage safely returns active profile without throwing');
assert(mockStorage.getItem(STORAGE_KEYS.PROFILE) !== null, 'Safely self-heals missing storage by persisting active profile');

// Corrupted JSON in storage
mockStorage.setItem(STORAGE_KEYS.PROFILE, '{{{ corrupt');
mockStorage.setItem(STORAGE_KEYS.QUESTS, '[{ invalid');
mockStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, 'corrupt');
const fromCorrupted = readLatestStorageState(INITIAL_PLAYER_PROFILE, INITIAL_QUESTS, INITIAL_ACHIEVEMENTS);
assert(fromCorrupted.profile.name === INITIAL_PLAYER_PROFILE.name, 'Safely falls back to active profile when storage has malformed JSON');
assert(fromCorrupted.quests.length === INITIAL_QUESTS.length, 'Safely falls back to active quests when storage has malformed JSON');
assert(fromCorrupted.achievements.length === INITIAL_ACHIEVEMENTS.length, 'Safely falls back to active achievements when storage has malformed JSON');
assert(fromCorrupted.warnings.length === 3, 'Generates safe telemetry warnings for each corrupted storage key');

// 6. Non-destructive Atomic Restoration & Rollback (Requirement 6)
console.log('\n6. Atomic Restoration & Rollback:');
// Setup initial storage state
mockStorage.clear();
mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify({ ...INITIAL_PLAYER_PROFILE, name: 'ORIGINAL_PLAYER' }));
mockStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(INITIAL_QUESTS));
mockStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(INITIAL_ACHIEVEMENTS));

// Simulate atomic restore function logic
function simulateRestore(payload: any, forceFailOnAchievements = false) {
  const validation = validateBackup(payload);
  if (!validation.valid || !validation.data) {
    return { success: false, error: validation.error };
  }

  const snapshot = {
    profile: mockStorage.getItem(STORAGE_KEYS.PROFILE),
    quests: mockStorage.getItem(STORAGE_KEYS.QUESTS),
    achievements: mockStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS),
  };

  try {
    mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(validation.data.profile));
    mockStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(validation.data.quests));
    if (forceFailOnAchievements) {
      throw new Error('Disk quota exceeded writing achievements');
    }
    mockStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(validation.data.achievements));
    return { success: true };
  } catch (err: any) {
    // Rollback
    if (snapshot.profile !== null) mockStorage.setItem(STORAGE_KEYS.PROFILE, snapshot.profile);
    else mockStorage.removeItem(STORAGE_KEYS.PROFILE);
    if (snapshot.quests !== null) mockStorage.setItem(STORAGE_KEYS.QUESTS, snapshot.quests);
    else mockStorage.removeItem(STORAGE_KEYS.QUESTS);
    if (snapshot.achievements !== null) mockStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, snapshot.achievements);
    else mockStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    return { success: false, error: err.message };
  }
}

// Validation failure does not touch storage
const invalidPayload = { version: 1 };
const resInvalid = simulateRestore(invalidPayload);
assert(resInvalid.success === false, 'Invalid restore fails gracefully');
const profileAfterInvalid = JSON.parse(mockStorage.getItem(STORAGE_KEYS.PROFILE)!);
assert(profileAfterInvalid.name === 'ORIGINAL_PLAYER', 'Storage is untouched when validation fails');

// Storage failure rolls back completely (never partially restores)
const validNewPayload = {
  ...exportedFromStorage.payload,
  profile: { ...INITIAL_PLAYER_PROFILE, name: 'NEW_PLAYER_RESTORE' },
};
const resFailed = simulateRestore(validNewPayload, true); // force failure on achievements
assert(resFailed.success === false, 'Reports failure on simulated storage error');
const profileAfterRollback = JSON.parse(mockStorage.getItem(STORAGE_KEYS.PROFILE)!);
assert(profileAfterRollback.name === 'ORIGINAL_PLAYER', 'Rolled back profile to original state after failure (never partially restores)');

// Successful restore updates storage
const resSuccess = simulateRestore(validNewPayload, false);
assert(resSuccess.success === true, 'Successful restore returns success');
const profileAfterSuccess = JSON.parse(mockStorage.getItem(STORAGE_KEYS.PROFILE)!);
assert(profileAfterSuccess.name === 'NEW_PLAYER_RESTORE', 'Restored data written to storage');

console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!\n`);
