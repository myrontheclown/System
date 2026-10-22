import {
  calculateXpProgression,
  getRankForLevel,
  getRequiredXpForLevel,
  getResonanceMultiplier,
} from '../progression';
import { AttributeKey, PlayerProfile, Quest, Achievement } from '../../types';
import {
  FRESH_PLAYER_PROFILE,
  INITIAL_ACHIEVEMENTS,
  INITIAL_PLAYER_PROFILE,
  INITIAL_QUESTS,
} from '../initialData';

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, details?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  PASS: ${testName}`);
  } else {
    console.error(`  FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

/**
 * Test harness replicating SystemContext's exact state and ref mechanics across all update paths
 */
class SystemStateController {
  public profile: PlayerProfile;
  public quests: Quest[];
  public achievements: Achievement[];
  public systemEvent: any = { type: null };

  public profileRef: { current: PlayerProfile };
  public questsRef: { current: Quest[] };
  public achievementsRef: { current: Achievement[] };

  constructor(profile = INITIAL_PLAYER_PROFILE, quests = INITIAL_QUESTS, achievements = INITIAL_ACHIEVEMENTS) {
    this.profile = JSON.parse(JSON.stringify(profile));
    this.quests = JSON.parse(JSON.stringify(quests));
    this.achievements = JSON.parse(JSON.stringify(achievements));
    this.profileRef = { current: this.profile };
    this.questsRef = { current: this.quests };
    this.achievementsRef = { current: this.achievements };
  }

  completeQuest(questId: string) {
    const targetQuest = this.questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'completed' || targetQuest.status === 'failed') return;

    if (targetQuest.isBoss) {
      this.claimBossVictory(questId);
      return;
    }

    const updatedObjectives = targetQuest.objectives.map((o) => ({
      ...o,
      completed: true,
      current: o.target,
    }));

    this.questsRef.current = this.questsRef.current.map((q) =>
      q.id === questId ? { ...q, status: 'completed' as const, objectives: updatedObjectives } : q
    );
    this.quests = this.questsRef.current;

    const gainedXp = Math.round(targetQuest.xpReward * this.profileRef.current.resonanceMultiplier);
    const progression = calculateXpProgression(
      this.profileRef.current.level,
      this.profileRef.current.currentXp,
      this.profileRef.current.xpToNextLevel,
      this.profileRef.current.rank,
      this.profileRef.current.unallocatedPoints,
      this.profileRef.current.totalXp,
      gainedXp
    );

    const nextAttrs = { ...this.profileRef.current.attributes };
    if (targetQuest.statRewards) {
      (Object.keys(targetQuest.statRewards) as AttributeKey[]).forEach((key) => {
        const reward = targetQuest.statRewards?.[key] || 0;
        nextAttrs[key] = (nextAttrs[key] || 10) + reward;
      });
    }

    this.profileRef.current = {
      ...this.profileRef.current,
      level: progression.level,
      rank: progression.rank,
      currentXp: progression.currentXp,
      xpToNextLevel: progression.xpToNextLevel,
      totalXp: progression.totalXp,
      attributes: nextAttrs,
      unallocatedPoints: progression.unallocatedPoints,
      totalQuestsCompleted: this.profileRef.current.totalQuestsCompleted + 1,
    };
    this.profile = this.profileRef.current;

    if (progression.didRankUp) {
      this.systemEvent = { type: 'RANK_UP', levelReached: progression.level, newRank: progression.rank };
    } else if (progression.didLevelUp) {
      this.systemEvent = { type: 'LEVEL_UP', levelReached: progression.level, newRank: progression.rank };
    } else {
      this.systemEvent = { type: 'QUEST_COMPLETE', quest: targetQuest };
    }
  }

  failQuest(questId: string) {
    const targetQuest = this.questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'failed' || targetQuest.status === 'completed') return;

    this.questsRef.current = this.questsRef.current.map((q) =>
      q.id === questId ? { ...q, status: 'failed' as const } : q
    );
    this.quests = this.questsRef.current;

    const deduction = targetQuest.penaltyXp || 50;
    this.profileRef.current = {
      ...this.profileRef.current,
      currentXp: Math.max(0, this.profileRef.current.currentXp - deduction),
      totalXp: Math.max(0, this.profileRef.current.totalXp - deduction),
    };
    this.profile = this.profileRef.current;

    this.systemEvent = { type: 'QUEST_FAILED', quest: targetQuest, penaltyXp: deduction };
  }

  claimBossVictory(questId: string) {
    const targetQuest = this.questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || !targetQuest.isBoss) return;
    if (targetQuest.status === 'completed' || targetQuest.status === 'failed') return;

    this.questsRef.current = this.questsRef.current.map((q) =>
      q.id === questId
        ? {
            ...q,
            status: 'completed' as const,
            objectives: q.objectives.map((o) => ({ ...o, completed: true, current: o.target })),
          }
        : q
    );
    this.quests = this.questsRef.current;

    const gainedXp = targetQuest.xpReward;
    const progression = calculateXpProgression(
      this.profileRef.current.level,
      this.profileRef.current.currentXp,
      this.profileRef.current.xpToNextLevel,
      this.profileRef.current.rank,
      this.profileRef.current.unallocatedPoints,
      this.profileRef.current.totalXp,
      gainedXp
    );

    this.profileRef.current = {
      ...this.profileRef.current,
      level: progression.level,
      rank: progression.rank,
      currentXp: progression.currentXp,
      xpToNextLevel: progression.xpToNextLevel,
      totalXp: progression.totalXp,
      unallocatedPoints: progression.unallocatedPoints,
      attributes: {
        ...this.profileRef.current.attributes,
        VIT: this.profileRef.current.attributes.VIT + 10,
      },
      totalQuestsCompleted: this.profileRef.current.totalQuestsCompleted + 1,
    };
    this.profile = this.profileRef.current;

    const updatedAchievements = this.achievementsRef.current.map((a) =>
      a.id === 'ach-6'
        ? { ...a, unlocked: true, unlockedDate: 'Today', progress: { current: 1, max: 1 } }
        : a
    );
    this.achievementsRef.current = updatedAchievements;
    this.achievements = updatedAchievements;

    this.systemEvent = {
      type: 'BOSS_DEFEATED',
      quest: targetQuest,
      bossReward: { xp: targetQuest.xpReward, statGain: '+10 VIT' },
    };
  }

  startQuest(questId: string) {
    const targetQuest = this.questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'completed' || targetQuest.status === 'failed') return;
    this.questsRef.current = this.questsRef.current.map((q) =>
      q.id === questId ? { ...q, status: 'active' as const } : q
    );
    this.quests = this.questsRef.current;
  }

  toggleObjective(questId: string, objectiveId: string) {
    const targetQuest = this.questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'completed' || targetQuest.status === 'failed') return;

    this.questsRef.current = this.questsRef.current.map((q) => {
      if (q.id !== questId) return q;
      const updatedObjectives = q.objectives.map((obj) => {
        if (obj.id !== objectiveId) return obj;
        const nextCompleted = !obj.completed;
        return {
          ...obj,
          completed: nextCompleted,
          current: nextCompleted ? obj.target : 0,
        };
      });
      return {
        ...q,
        objectives: updatedObjectives,
      };
    });
    this.quests = this.questsRef.current;
  }

  allocateAttribute(key: AttributeKey) {
    if (this.profileRef.current.unallocatedPoints <= 0) return;
    this.profileRef.current = {
      ...this.profileRef.current,
      unallocatedPoints: this.profileRef.current.unallocatedPoints - 1,
      attributes: {
        ...this.profileRef.current.attributes,
        [key]: this.profileRef.current.attributes[key] + 1,
      },
    };
    this.profile = this.profileRef.current;
  }

  addNewQuest(questData: Partial<Quest>) {
    const newId = `quest-custom-${Date.now()}`;
    const fullQuest: Quest = {
      id: newId,
      title: questData.title || 'Custom Directive',
      subtitle: questData.subtitle || 'Tactical Protocol',
      description: questData.description || 'System custom player objective.',
      category: questData.category || 'TRAINING',
      categoryLabel: questData.categoryLabel || 'Custom Protocol',
      status: 'active',
      xpReward: questData.xpReward || 100,
      penaltyXp: 50,
      deadlineTime: 'Today · 11:59 PM',
      deadlineTimestamp: Date.now() + 6 * 3600 * 1000,
      objectives: questData.objectives || [
        {
          id: `${newId}-obj1`,
          text: 'Execute directive parameter',
          note: 'Adhere to protocol standard',
          current: 0,
          target: 1,
          unit: 'task',
          completed: false,
        },
      ],
      statRewards: questData.statRewards || { DISC: 1 },
    };
    this.questsRef.current = [fullQuest, ...this.questsRef.current];
    this.quests = this.questsRef.current;
    return newId;
  }

  updateGoals(goals: string[]) {
    this.profileRef.current = {
      ...this.profileRef.current,
      selectedGoals: goals,
    };
    this.profile = this.profileRef.current;
  }

  updatePreferences(prefs: Partial<PlayerProfile['preferences']>) {
    this.profileRef.current = {
      ...this.profileRef.current,
      preferences: {
        ...this.profileRef.current.preferences,
        ...prefs,
      },
    };
    this.profile = this.profileRef.current;
  }

  updateProfileName(name: string) {
    this.profileRef.current = {
      ...this.profileRef.current,
      name: name.trim().toUpperCase() || 'OPERATOR',
    };
    this.profile = this.profileRef.current;
  }

  resetProgress() {
    this.profileRef.current = FRESH_PLAYER_PROFILE;
    this.profile = FRESH_PLAYER_PROFILE;
    const freshQuests: Quest[] = INITIAL_QUESTS.map((q) => ({
      ...q,
      status: q.isBoss ? 'available' : 'active',
      objectives: q.objectives.map((o) => ({ ...o, completed: false, current: 0 })),
    }));
    this.questsRef.current = freshQuests;
    this.quests = freshQuests;
    const freshAchievements = INITIAL_ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: false,
      progress: a.progress ? { current: 0, max: a.progress.max } : undefined,
    }));
    this.achievementsRef.current = freshAchievements;
    this.achievements = freshAchievements;
  }

  loadShowcaseState() {
    this.profileRef.current = INITIAL_PLAYER_PROFILE;
    this.questsRef.current = INITIAL_QUESTS;
    this.achievementsRef.current = INITIAL_ACHIEVEMENTS;
    this.profile = INITIAL_PLAYER_PROFILE;
    this.quests = INITIAL_QUESTS;
    this.achievements = INITIAL_ACHIEVEMENTS;
  }

  restoreBackup(validData: { profile: PlayerProfile; quests: Quest[]; achievements: Achievement[] }) {
    this.profileRef.current = validData.profile;
    this.questsRef.current = validData.quests;
    this.achievementsRef.current = validData.achievements;
    this.profile = validData.profile;
    this.quests = validData.quests;
    this.achievements = validData.achievements;
  }

  completeOnboarding(data: { name: string; paths: string[]; difficulty: any; dailyQuests: number; timeCommitment: string }) {
    const newProfile: PlayerProfile = {
      ...FRESH_PLAYER_PROFILE,
      name: data.name.trim().toUpperCase() || 'OPERATOR',
      operatorId: `#${Math.floor(1000 + Math.random() * 9000)}-${data.name.slice(0, 3).toUpperCase()}`,
      selectedGoals: data.paths,
      preferences: {
        difficulty: data.difficulty,
        dailyQuota: data.dailyQuests,
        activeDomains: ['BODY', 'MIND'],
        dailyResetTime: '04:00 AM',
        dailyCommitment: data.timeCommitment,
      },
      hasCompletedOnboarding: true,
    };
    this.profileRef.current = newProfile;
    this.profile = newProfile;
  }
}

console.log('\n--- AUDIT & REGRESSION TESTS: XP REWARDS, PENALTIES & MULTI-LEVEL PROGRESSION ---\n');

// 1. XP Progression & Multi-level Crossing
console.log('1. XP Progression & Multi-Level Threshold Crossing:');

// 1a. Gain without level up
const noLevelUp = calculateXpProgression(1, 100, 500, 'E', 0, 100, 200);
assert(noLevelUp.level === 1, 'No level up keeps level at 1');
assert(noLevelUp.currentXp === 300, 'Current XP increases by 200 to 300');
assert(noLevelUp.totalXp === 300, 'Total XP increases by 200');
assert(noLevelUp.unallocatedPoints === 0, 'Unallocated points remains 0');
assert(noLevelUp.didLevelUp === false, 'didLevelUp is false');

// 1b. Single level up exactly reaching threshold
const exactLevelUp = calculateXpProgression(1, 400, 500, 'E', 0, 400, 100);
assert(exactLevelUp.level === 2, 'Reaching exact threshold advances level to 2');
assert(exactLevelUp.currentXp === 0, 'Excess XP is exactly 0 into new level');
assert(exactLevelUp.unallocatedPoints === 1, 'Unallocated points increments by 1');
assert(exactLevelUp.xpToNextLevel === getRequiredXpForLevel(2), 'xpToNextLevel updates to level 2 requirement');
assert(exactLevelUp.didLevelUp === true, 'didLevelUp is true');

// 1c. Multi-level crossing (crossing 3 levels in one large reward)
const l2Req = getRequiredXpForLevel(2);
const l3Req = getRequiredXpForLevel(3);
const multiReward = 500 + l2Req + 150; // Enough to clear Level 1 and Level 2, into Level 3 with 150 XP
const multiLevel = calculateXpProgression(1, 0, 500, 'E', 0, 0, multiReward);
assert(multiLevel.level === 3, `Large XP reward crosses 2 thresholds from L1 to L3 (actual: ${multiLevel.level})`);
assert(multiLevel.levelsGained === 2, 'Reports exactly 2 levels gained');
assert(multiLevel.currentXp === 150, 'Remaining XP after multiple deductions is 150');
assert(multiLevel.unallocatedPoints === 2, 'Gains exactly 2 unallocated attribute points');
assert(multiLevel.xpToNextLevel === l3Req, 'Threshold is set to Level 3 required XP');

// 1d. Multi-level rank transition (Level 4 to Level 6 crosses Rank 'E' -> 'D' threshold at Level 5)
const rankUpProgression = calculateXpProgression(4, 0, 800, 'E', 0, 3000, 2500);
assert(rankUpProgression.level >= 5, 'Advances past level 5');
assert(rankUpProgression.rank === 'D', 'Rank updates to D');
assert(rankUpProgression.didRankUp === true, 'didRankUp is true');

// 2. Prevent Duplicate Quest Completion Rewards (Requirement 1)
console.log('\n2. Prevent Duplicate Quest Completion Rewards:');
const sim1 = new SystemStateController();
const questId = 'quest-1';
const initialXp = sim1.profile.currentXp;
const initialTotalXp = sim1.profile.totalXp;
const initialCompletedCount = sim1.profile.totalQuestsCompleted;
const initialStr = sim1.profile.attributes.STR;

// Complete first time
sim1.completeQuest(questId);
assert(sim1.quests.find((q) => q.id === questId)?.status === 'completed', 'Quest status becomes completed');
assert(sim1.profile.totalXp > initialTotalXp, 'XP awarded on first completion');
assert(sim1.profile.totalQuestsCompleted === initialCompletedCount + 1, 'Quests completed incremented by 1');
assert(sim1.profile.attributes.STR > initialStr, 'Attribute reward applied on first completion');

const xpAfterFirst = sim1.profile.currentXp;
const totalXpAfterFirst = sim1.profile.totalXp;
const completedCountAfterFirst = sim1.profile.totalQuestsCompleted;
const strAfterFirst = sim1.profile.attributes.STR;

// Attempt complete second time (duplicate call)
sim1.completeQuest(questId);
assert(sim1.profile.currentXp === xpAfterFirst, 'Duplicate completion awards NO additional current XP');
assert(sim1.profile.totalXp === totalXpAfterFirst, 'Duplicate completion awards NO additional total XP');
assert(sim1.profile.totalQuestsCompleted === completedCountAfterFirst, 'Duplicate completion does NOT increment quest count');
assert(sim1.profile.attributes.STR === strAfterFirst, 'Duplicate completion awards NO duplicate attribute rewards');

// 3. Failed Quests Cannot Be Completed (Requirement 1)
console.log('\n3. Failed Quests Cannot Be Completed:');
const sim2 = new SystemStateController();
const quest3Id = 'quest-3'; // starts active
sim2.failQuest(quest3Id);
assert(sim2.quests.find((q) => q.id === quest3Id)?.status === 'failed', 'Quest is failed');
const xpAfterFail = sim2.profile.totalXp;
const completedAfterFail = sim2.profile.totalQuestsCompleted;

sim2.completeQuest(quest3Id);
assert(sim2.quests.find((q) => q.id === quest3Id)?.status === 'failed', 'Failed quest remains failed');
assert(sim2.profile.totalXp === xpAfterFail, 'Failed quest completion grants NO XP');
assert(sim2.profile.totalQuestsCompleted === completedAfterFail, 'Failed quest completion does NOT increment completed quests');

// 4. Prevent Duplicate Failure Penalties (Requirement 2)
console.log('\n4. Prevent Duplicate Failure Penalties:');
const sim3 = new SystemStateController();
const quest4Id = 'quest-4'; // starts active
const xpBeforePenalty = sim3.profile.currentXp;
const penalty = sim3.quests.find((q) => q.id === quest4Id)?.penaltyXp || 50;

// Fail first time
sim3.failQuest(quest4Id);
assert(sim3.quests.find((q) => q.id === quest4Id)?.status === 'failed', 'Quest marked failed on first call');
assert(sim3.profile.currentXp === Math.max(0, xpBeforePenalty - penalty), 'Penalty deducted on first failure');

const xpAfterFirstPenalty = sim3.profile.currentXp;

// Attempt fail second time
sim3.failQuest(quest4Id);
assert(sim3.profile.currentXp === xpAfterFirstPenalty, 'Calling failQuest repeatedly does NOT deduct additional penalty XP');

// Attempt fail third time
sim3.failQuest(quest4Id);
assert(sim3.profile.currentXp === xpAfterFirstPenalty, 'Calling failQuest a 3rd time does NOT deduct additional penalty XP');

// 5. Completed Quests Cannot Be Failed (Requirement 2)
console.log('\n5. Completed Quests Cannot Be Failed:');
const sim4 = new SystemStateController();
const activeQuestId = 'quest-1';
sim4.completeQuest(activeQuestId);
assert(sim4.quests.find((q) => q.id === activeQuestId)?.status === 'completed', 'Quest completed');
const xpAfterComplete = sim4.profile.currentXp;

sim4.failQuest(activeQuestId);
assert(sim4.quests.find((q) => q.id === activeQuestId)?.status === 'completed', 'Completed quest cannot transition to failed');
assert(sim4.profile.currentXp === xpAfterComplete, 'Completed quest cannot suffer penalty deduction');

// 6. Conflicting Order Invariance (Requirement 5)
console.log('\n6. Conflicting Order Invariance:');
// Complete then Fail
const sim5A = new SystemStateController();
sim5A.completeQuest('quest-3');
sim5A.failQuest('quest-3');
assert(sim5A.quests.find((q) => q.id === 'quest-3')?.status === 'completed', 'Complete then fail leaves quest completed');

// Fail then Complete
const sim5B = new SystemStateController();
sim5B.failQuest('quest-4');
sim5B.completeQuest('quest-4');
assert(sim5B.quests.find((q) => q.id === 'quest-4')?.status === 'failed', 'Fail then complete leaves quest failed');

// 7. Prevent Duplicate Boss Rewards (Requirement 3)
console.log('\n7. Prevent Duplicate Boss Rewards:');
const simBoss = new SystemStateController();
const bossId = 'quest-boss';
const bossQuest = simBoss.quests.find((q) => q.id === bossId)!;
assert(bossQuest.isBoss === true, 'Verified quest-boss is boss quest');

const bossXpBefore = simBoss.profile.totalXp;
const vitBefore = simBoss.profile.attributes.VIT;
const achBefore = simBoss.achievements.find((a) => a.id === 'ach-6')?.unlocked;
assert(achBefore === false, 'Shadow Sovereign achievement starts locked');

// Claim victory first time
simBoss.claimBossVictory(bossId);
assert(simBoss.quests.find((q) => q.id === bossId)?.status === 'completed', 'Boss quest marked completed');
assert(simBoss.profile.totalXp === bossXpBefore + bossQuest.xpReward, 'Boss XP awarded on first victory');
assert(simBoss.profile.attributes.VIT === vitBefore + 10, '+10 VIT awarded on first boss victory');
assert(simBoss.achievements.find((a) => a.id === 'ach-6')?.unlocked === true, 'Shadow Sovereign achievement unlocked');

const bossXpAfterFirst = simBoss.profile.totalXp;
const vitAfterFirst = simBoss.profile.attributes.VIT;
const questsCompletedAfterFirst = simBoss.profile.totalQuestsCompleted;

// Attempt claim victory second time
simBoss.claimBossVictory(bossId);
assert(simBoss.profile.totalXp === bossXpAfterFirst, 'Repeated boss claim awards NO duplicate XP');
assert(simBoss.profile.attributes.VIT === vitAfterFirst, 'Repeated boss claim awards NO duplicate VIT');
assert(simBoss.profile.totalQuestsCompleted === questsCompletedAfterFirst, 'Repeated boss claim does not increment quest count');

// Attempt completeQuest on already completed boss quest
simBoss.completeQuest(bossId);
assert(simBoss.profile.totalXp === bossXpAfterFirst, 'completeQuest on completed boss awards NO duplicate XP');
assert(simBoss.profile.attributes.VIT === vitAfterFirst, 'completeQuest on completed boss awards NO duplicate VIT');

// Reject non-boss quest passed to claimBossVictory
const normalQuestId = 'quest-1';
const simBossNormal = new SystemStateController();
const profileBeforeNormalBossCall = JSON.stringify(simBossNormal.profile);
simBossNormal.claimBossVictory(normalQuestId);
assert(
  JSON.stringify(simBossNormal.profile) === profileBeforeNormalBossCall,
  'claimBossVictory on non-boss quest is rejected with no state change'
);

// 8. Invalid Quest IDs Do Not Change Player State (Requirement 5)
console.log('\n8. Invalid Quest IDs:');
const simInvalid = new SystemStateController();
const pristineProfileStr = JSON.stringify(simInvalid.profile);
const pristineQuestsStr = JSON.stringify(simInvalid.quests);
const pristineAchievementsStr = JSON.stringify(simInvalid.achievements);

simInvalid.completeQuest('nonexistent-quest-id');
simInvalid.failQuest('nonexistent-quest-id');
simInvalid.claimBossVictory('nonexistent-quest-id');
simInvalid.startQuest('nonexistent-quest-id');

assert(JSON.stringify(simInvalid.profile) === pristineProfileStr, 'Invalid quest IDs leave profile completely untouched');
assert(JSON.stringify(simInvalid.quests) === pristineQuestsStr, 'Invalid quest IDs leave quests completely untouched');
assert(JSON.stringify(simInvalid.achievements) === pristineAchievementsStr, 'Invalid quest IDs leave achievements completely untouched');

// 9. startQuest Immunity:
console.log('\n9. startQuest Immunity:');
const simStart = new SystemStateController();
simStart.completeQuest('quest-1');
simStart.startQuest('quest-1');
assert(simStart.quests.find((q) => q.id === 'quest-1')?.status === 'completed', 'startQuest cannot reactivate a completed quest');

simStart.failQuest('quest-3');
simStart.startQuest('quest-3');
assert(simStart.quests.find((q) => q.id === 'quest-3')?.status === 'failed', 'startQuest cannot reactivate a failed quest');

// 10. Ref Synchronization Across All Update Paths (Final Audit Verification)
console.log('\n10. Ref Synchronization Across All Update Paths:');
const simSync = new SystemStateController();

// 10a. allocateAttribute synchronization
simSync.profileRef.current.unallocatedPoints = 2;
simSync.profile.unallocatedPoints = 2;
const strBeforeAlloc = simSync.profileRef.current.attributes.STR;
simSync.allocateAttribute('STR');
assert(simSync.profileRef.current.attributes.STR === strBeforeAlloc + 1, 'allocateAttribute updates profileRef immediately');
assert(simSync.profile.attributes.STR === strBeforeAlloc + 1, 'allocateAttribute updates profile state immediately');
assert(simSync.profileRef.current.unallocatedPoints === 1, 'Unallocated points reduced in ref');
// Second allocation in same tick
simSync.allocateAttribute('STR');
assert(simSync.profileRef.current.attributes.STR === strBeforeAlloc + 2, 'Second allocateAttribute in same tick updates ref');
assert(simSync.profileRef.current.unallocatedPoints === 0, 'Unallocated points becomes 0');
// Third allocation when points are 0 should be rejected
simSync.allocateAttribute('STR');
assert(simSync.profileRef.current.attributes.STR === strBeforeAlloc + 2, 'Third allocateAttribute when points=0 does nothing');

// 10b. addNewQuest immediately completable via ref
const newQuestId = simSync.addNewQuest({ title: 'Ad-hoc Mission', xpReward: 250 });
assert(simSync.questsRef.current[0].id === newQuestId, 'addNewQuest puts quest in questsRef immediately');
assert(simSync.quests[0].id === newQuestId, 'addNewQuest puts quest in quests state immediately');
const xpBeforeNewQuest = simSync.profileRef.current.totalXp;
simSync.completeQuest(newQuestId);
assert(simSync.questsRef.current.find((q) => q.id === newQuestId)?.status === 'completed', 'New quest immediately completed via ref');
assert(simSync.profileRef.current.totalXp > xpBeforeNewQuest, 'New quest XP credited immediately');

// 10c. Rapid chaining: toggleObjective then completeQuest
const simChain = new SystemStateController();
simChain.toggleObjective('quest-4', 'q4-obj1');
assert(simChain.questsRef.current.find((q) => q.id === 'quest-4')?.objectives[0].completed === true, 'toggleObjective updates questsRef');
simChain.completeQuest('quest-4');
assert(simChain.questsRef.current.find((q) => q.id === 'quest-4')?.status === 'completed', 'completeQuest immediately consumes updated quest');

// 10d. Settings updates sync profileRef
simSync.updateProfileName('SHADOW_OPERATOR');
assert(simSync.profileRef.current.name === 'SHADOW_OPERATOR', 'updateProfileName syncs profileRef');
simSync.updateGoals(['Cybersecurity', 'Endurance']);
assert(simSync.profileRef.current.selectedGoals.length === 2, 'updateGoals syncs profileRef');
simSync.updatePreferences({ difficulty: 'Insane' });
assert(simSync.profileRef.current.preferences.difficulty === 'Insane', 'updatePreferences syncs profileRef');

// 10e. resetProgress syncs all refs
simSync.resetProgress();
assert(simSync.profileRef.current.level === 1, 'resetProgress syncs profileRef level to 1');
assert(simSync.questsRef.current.length === INITIAL_QUESTS.length, 'resetProgress syncs questsRef');
assert(simSync.achievementsRef.current.length === INITIAL_ACHIEVEMENTS.length, 'resetProgress syncs achievementsRef');

// 10f. loadShowcaseState syncs all refs
simSync.loadShowcaseState();
assert(simSync.profileRef.current.level === 17, 'loadShowcaseState syncs profileRef level to 17');
assert(simSync.questsRef.current.length === INITIAL_QUESTS.length, 'loadShowcaseState syncs questsRef');

// 10g. restoreBackup syncs all refs
const mockRestoredProfile = { ...INITIAL_PLAYER_PROFILE, name: 'RESTORED_AGENT', level: 33 };
simSync.restoreBackup({ profile: mockRestoredProfile, quests: INITIAL_QUESTS, achievements: INITIAL_ACHIEVEMENTS });
assert(simSync.profileRef.current.name === 'RESTORED_AGENT', 'restoreBackup syncs profileRef');
assert(simSync.profileRef.current.level === 33, 'restoreBackup syncs profileRef level');
assert(simSync.questsRef.current === INITIAL_QUESTS, 'restoreBackup syncs questsRef');

// 10h. completeOnboarding syncs profileRef
simSync.completeOnboarding({ name: 'ROOKIE', paths: ['Fitness'], difficulty: 'Normal', dailyQuests: 3, timeCommitment: '30m' });
assert(simSync.profileRef.current.name === 'ROOKIE', 'completeOnboarding syncs profileRef');
assert(simSync.profileRef.current.hasCompletedOnboarding === true, 'completeOnboarding sets flag in profileRef');

console.log(`\nAll ${passed} / ${total} audit & regression tests passed successfully!\n`);
