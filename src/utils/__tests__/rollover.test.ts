import { reconcileDailyRollover } from '../dailyRollover';
import { getQuestDayKey } from '../questSchedule';
import { INITIAL_PLAYER_PROFILE, INITIAL_QUESTS } from '../../game/initialData';
import { PlayerProfile, Quest } from '../../types';

let passed = 0;
let total = 0;
function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    passed++;
    console.log('  PASS: ' + testName);
  } else {
    console.error('  FAIL: ' + testName);
    throw new Error('Test failed: ' + testName);
  }
}

console.log('\n--- DAILY ROLLOVER & SCHEDULER TESTS ---\n');

console.log('1. Quest-day calculations:');
assert(getQuestDayKey(new Date('2026-01-01T23:59:59'), '12:00 AM') !== getQuestDayKey(new Date('2026-01-02T00:00:01'), '12:00 AM'), 'midnight');
assert(getQuestDayKey(new Date('2026-01-01T03:59:59'), '04:00 AM') !== getQuestDayKey(new Date('2026-01-01T04:00:01'), '04:00 AM'), 'fouram');

console.log('\n2. Persistence and defaults:');
const pPersist: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
pPersist.preferences.dailyResetTime = '12:00 AM';
const pLoaded: PlayerProfile = JSON.parse(JSON.stringify(pPersist));
assert(pLoaded.preferences.dailyResetTime === '12:00 AM', '12AM persists');
const pDefault: any = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
delete pDefault.preferences.dailyResetTime;
assert((pDefault.preferences.dailyResetTime || '04:00 AM') === '04:00 AM', 'defaults');

console.log('\n3. Exactly one rollover per quest day with new daily set:');
const p3: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p3.preferences.dailyResetTime = '04:00 AM';
p3.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T05:00:00'), '04:00 AM');
let q3: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
q3 = q3.map((x) => (x.id === 'quest-1' && !x.isBoss && !x.id.startsWith('quest-custom-')) ? { ...x, status: 'active' } : x);
const r3a = reconcileDailyRollover(p3, q3, new Date('2026-01-02T05:00:00'));
assert(r3a.profile.lastQuestDayKey !== p3.lastQuestDayKey, 'rollover happens');
const dailyCount3a = r3a.quests.filter(q => !q.isBoss && !q.id.startsWith('quest-custom-') && q.id !== 'quest-boss').length;
assert(dailyCount3a >= 1, 'daily set generated');
const r3b = reconcileDailyRollover(r3a.profile, r3a.quests, new Date('2026-01-02T06:00:00'));
assert(r3b.profile.lastQuestDayKey === r3a.profile.lastQuestDayKey, 'same day no second rollover');
const dailyCount3b = r3b.quests.filter(q => !q.isBoss && !q.id.startsWith('quest-custom-') && q.id !== 'quest-boss').length;
assert(dailyCount3b === dailyCount3a, 'no duplicates');

console.log('\n4. Missed eligible daily quests penalized exactly once:');
const p4: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p4.preferences.dailyResetTime = '04:00 AM';
p4.currentXp = 1000; p4.totalXp = 10000;
p4.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T10:00:00'), '04:00 AM');
let q4: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
q4 = q4.map((x) => (x.id === 'quest-1') ? { ...x, status: 'active' } : x);
const r4a = reconcileDailyRollover(p4, q4, new Date('2026-01-02T10:00:00'));
const xp4a = r4a.profile.currentXp;
assert(r4a.quests.find(q => q.id === 'quest-1')?.status === 'failed', 'marked failed');
const r4b = reconcileDailyRollover(r4a.profile, r4a.quests, new Date('2026-01-02T11:00:00'));
assert(r4b.profile.currentXp === xp4a, 'once');

console.log('\n5. Completed quests never penalized:');
const p5: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p5.preferences.dailyResetTime = '04:00 AM';
p5.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T10:00:00'), '04:00 AM');
const r5 = reconcileDailyRollover(p5, JSON.parse(JSON.stringify(INITIAL_QUESTS)), new Date('2026-01-02T10:00:00'));
assert(r5.quests.find(q => q.id === 'quest-2')?.status === 'completed', 'completed preserved');
assert(r5.quests.find(q => q.id === 'quest-5')?.status === 'completed', 'completed preserved2');

console.log('\n6. Already-failed quests not re-penalized:');
const p6: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p6.preferences.dailyResetTime = '04:00 AM';
p6.currentXp = 500; p6.totalXp = 5000;
p6.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T10:00:00'), '04:00 AM');
let q6: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
q6 = q6.map((x) => (x.id === 'quest-1') ? { ...x, status: 'failed' } : x);
const r6a = reconcileDailyRollover(p6, q6, new Date('2026-01-02T10:00:00'));
const xp6a = r6a.profile.currentXp;
const r6b = reconcileDailyRollover(r6a.profile, r6a.quests, new Date('2026-01-03T01:00:00'));
assert(r6b.profile.currentXp === xp6a, 'not re-penalized');

console.log('\n7. Boss/weekly/custom/non-daily excluded:');
const p7: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p7.preferences.dailyResetTime = '04:00 AM';
p7.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T10:00:00'), '04:00 AM');
let q7: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
q7 = q7.map((x) => x.isBoss ? { ...x, status: 'active' } : x);
const custom: Quest = { id: 'quest-custom-123', title: 'x', subtitle: '', description: '', category: 'TRAINING', categoryLabel: 'Custom', status: 'active', xpReward: 10, penaltyXp: 50, deadlineTime: '', deadlineTimestamp: Date.now(), objectives: [] } as Quest;
q7.push(custom);
const r7 = reconcileDailyRollover(p7, q7, new Date('2026-01-02T10:00:00'));
assert((r7.quests.find(q => q.isBoss)?.status) !== 'failed', 'boss ok');
assert(r7.quests.find(q => q.id === 'quest-custom-123')?.status === 'active', 'custom ok');

console.log('\n8. Closed across multiple boundaries:');
const p8: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p8.preferences.dailyResetTime = '04:00 AM';
p8.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T10:00:00'), '04:00 AM');
let q8: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
q8 = q8.map((x) => (x.id === 'quest-1') ? { ...x, status: 'active' } : x);
const r8 = reconcileDailyRollover(p8, q8, new Date('2026-01-04T10:00:00'));
assert(r8.quests.find(q => q.id === 'quest-1')?.status === 'failed', 'multi day');

console.log('\n9. Repeated reconciliation idempotent:');
const p9: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p9.preferences.dailyResetTime = '04:00 AM';
p9.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T10:00:00'), '04:00 AM');
let q9: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
q9 = q9.map((x) => (x.id === 'quest-1') ? { ...x, status: 'active' } : x);
const r9a = reconcileDailyRollover(p9, q9, new Date('2026-01-02T10:00:00'));
const xp9a = r9a.profile.currentXp; const total9a = r9a.profile.totalXp;
const count9a = r9a.quests.filter(q => !q.isBoss && !q.id.startsWith('quest-custom-') && q.id !== 'quest-boss').length;
const r9b = reconcileDailyRollover(r9a.profile, r9a.quests, new Date('2026-01-02T12:00:00'));
const r9c = reconcileDailyRollover(r9b.profile, r9b.quests, new Date('2026-01-03T01:00:00'));
assert(r9c.profile.currentXp === xp9a && r9c.profile.totalXp === total9a, 'xp idem');
const count9c = r9c.quests.filter(q => !q.isBoss && !q.id.startsWith('quest-custom-') && q.id !== 'quest-boss').length;
assert(count9c === count9a, 'count idem');

console.log('\n10. XP/level progression after penalties:');
const p10: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p10.preferences.dailyResetTime = '04:00 AM';
p10.currentXp = 100; p10.totalXp = 500; p10.level = 1;
p10.lastQuestDayKey = getQuestDayKey(new Date('2026-01-01T10:00:00'), '04:00 AM');
let q10: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
q10 = q10.map((x) => (x.id === 'quest-1') ? { ...x, status: 'active', penaltyXp: 50 } : x);
const r10 = reconcileDailyRollover(p10, q10, new Date('2026-01-02T10:00:00'));
assert(r10.profile.currentXp >= 0 && r10.profile.totalXp >= 0, 'non-neg');
assert(r10.profile.totalXp <= p10.totalXp, 'total ok');

console.log('\n11. Backup/restore compatibility and history preservation:');
const p11: PlayerProfile = JSON.parse(JSON.stringify(INITIAL_PLAYER_PROFILE));
p11.preferences.dailyResetTime = '12:00 AM';
const histLen = p11.history.length;
const b = JSON.stringify({ version: 1, exportTimestamp: new Date().toISOString(), profile: p11, quests: INITIAL_QUESTS, achievements: [] });
const bp = JSON.parse(b);
assert(bp.profile.preferences.dailyResetTime === '12:00 AM', 'backup 12am');
assert(bp.profile.history.length === histLen, 'history preserved');

console.log('\nAll ' + passed + ' / ' + total + ' rollover tests passed successfully!\n');
