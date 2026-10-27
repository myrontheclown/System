import { PlayerProfile, Quest } from '../types';
import { getQuestDayKey, parseResetTime } from './questSchedule';

export interface RolloverResult {
  profile: PlayerProfile;
  quests: Quest[];
  penaltiesApplied: number;
}

export function isDailyQuest(quest: Quest): boolean {
  if (quest.isBoss) return false;
  if ((quest as any).isWeekly) return false;
  if ((quest as any).isCustom) return false;
  if (quest.id && quest.id.startsWith('quest-custom-')) return false;
  if ((quest.category as string) === 'WEEKLY' || ((quest.categoryLabel as string) || '').toLowerCase().includes('weekly')) return false;
  return true;
}

function generateDailyQuestsForDay(profile: PlayerProfile, existingQuests: Quest[], dayKey: string): Quest[] {
  const quota = profile.preferences?.dailyQuota || 5;
  const templates = [
    {
      title: "Complete today's workout",
      subtitle: '45 min · Strength & Mobility',
      description: 'Complete your scheduled strength workout with proper form.',
      category: 'TRAINING' as const,
      categoryLabel: 'Core Routine',
      xpReward: 180,
      statRewards: { STR: 2, VIT: 1 },
      penaltyXp: 50,
      durationLabel: '45 min',
      objectives: [
        { id: `obj-sq`, text: '4 Sets Compound Movement', note: 'Focus on form', current: 0, target: 4, unit: 'sets', completed: false },
        { id: `obj-mob`, text: '15 Min Mobility', note: 'Hips and mobility', current: 0, target: 15, unit: 'min', completed: false },
      ],
    },
    {
      title: 'Solve coding problems',
      subtitle: 'Algorithms practice',
      description: 'Tackle algorithmic challenges to sharpen problem solving.',
      category: 'INTELLIGENCE' as const,
      categoryLabel: 'System Protocol',
      xpReward: 120,
      statRewards: { INT: 2 },
      penaltyXp: 50,
      durationLabel: '30 min',
      objectives: [
        { id: `obj-cp1`, text: 'Complete 2 problems', note: 'Practice algorithms', current: 0, target: 2, unit: 'problems', completed: false },
      ],
    },
    {
      title: 'Study for focus time',
      subtitle: 'Deep work session',
      description: 'Dedicated study block with no distractions.',
      category: 'LEARNING' as const,
      categoryLabel: 'Cognition',
      xpReward: 100,
      statRewards: { FOC: 1, INT: 1 },
      penaltyXp: 50,
      durationLabel: '45 min',
      objectives: [
        { id: `obj-study`, text: 'Study block', note: 'Deep focus', current: 0, target: 1, unit: 'session', completed: false },
      ],
    },
    {
      title: 'Read',
      subtitle: 'Daily reading',
      description: 'Read to expand knowledge.',
      category: 'KNOWLEDGE' as const,
      categoryLabel: 'Directive',
      xpReward: 50,
      statRewards: { FOC: 1 },
      penaltyXp: 50,
      durationLabel: '20 min',
      objectives: [
        { id: `obj-read`, text: 'Read pages', note: 'Daily reading', current: 0, target: 10, unit: 'pages', completed: false },
      ],
    },
    {
      title: 'Hydration & Discipline',
      subtitle: 'Metabolic routine',
      description: 'Maintain hydration and healthy habits.',
      category: 'DISCIPLINE' as const,
      categoryLabel: 'Daily Routine',
      xpReward: 80,
      statRewards: { VIT: 1, DISC: 1 },
      penaltyXp: 50,
      durationLabel: 'All Day',
      objectives: [
        { id: `obj-hyd`, text: 'Hydrate', note: 'Stay hydrated', current: 0, target: 1, unit: 'protocol', completed: false },
      ],
    },
  ];

  const generated: Quest[] = [];
  const count = Math.max(1, Math.min(quota, templates.length));
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    const baseId = `daily-${dayKey.replace(/[^0-9]/g, '')}-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`;
    generated.push({
      id: baseId,
      title: t.title,
      subtitle: t.subtitle,
      description: t.description,
      category: t.category,
      categoryLabel: t.categoryLabel,
      status: 'active',
      xpReward: t.xpReward,
      statRewards: t.statRewards,
      penaltyXp: t.penaltyXp,
      durationLabel: t.durationLabel,
      deadlineTime: 'Today · 11:59 PM',
      deadlineTimestamp: Date.now() + 24 * 3600 * 1000,
      objectives: t.objectives.map((obj, idx) => ({
        ...obj,
        id: `${baseId}-obj${idx}`,
      })),
    });
  }
  return generated;
}

export function reconcileDailyRollover(
  profile: PlayerProfile,
  quests: Quest[],
  now: Date = new Date()
): RolloverResult {
  const resetTime = profile.preferences && profile.preferences.dailyResetTime ? profile.preferences.dailyResetTime : '04:00 AM';
  const currentDayKey = getQuestDayKey(now, resetTime);
  const lastDayKey = profile.lastQuestDayKey;

  let newProfile: PlayerProfile = { ...profile };
  let newQuests: Quest[] = quests.map((q) => ({ ...q }));

  const processedPenaltyKeys = new Set<string>(newProfile.processedMissedPenaltyDayKeys || []);

  if (!lastDayKey || lastDayKey !== currentDayKey) {
    const missedKeys: string[] = [];
    if (lastDayKey) {
      try {
        const parts = lastDayKey.split('|');
        const lastDateStr = parts[0];
        const dateParts = lastDateStr.split('-');
        const ly = parseInt(dateParts[0], 10);
        const lm = parseInt(dateParts[1], 10);
        const ld = parseInt(dateParts[2], 10);
        const cursor = new Date(ly, lm - 1, ld);
        cursor.setDate(cursor.getDate() + 1);
        const maxDays = 366;
        let days = 0;
        while (days < maxDays) {
          const prt = parseResetTime(resetTime);
          const candidate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), prt.hour, prt.minute, 0, 0);
          if (candidate > now) break;
          const candidateKey = getQuestDayKey(candidate, resetTime);
          if (candidateKey === currentDayKey) break;
          if (!processedPenaltyKeys.has(candidateKey)) {
            missedKeys.push(candidateKey);
          }
          cursor.setDate(cursor.getDate() + 1);
          days++;
          if (missedKeys.length > 100) break;
        }
      } catch (e) {
        // ignore
      }
    }

    let totalPenalty = 0;
    for (let i = 0; i < newQuests.length; i++) {
      const q = newQuests[i];
      if (!isDailyQuest(q)) continue;
      if (q.status === 'completed') continue;
      if (q.status === 'failed') continue;
      const penalty = typeof q.penaltyXp === 'number' ? q.penaltyXp : 50;
      totalPenalty += penalty;
      newQuests[i] = { ...q, status: 'failed' };
    }
    if (totalPenalty > 0) {
      newProfile.currentXp = Math.max(0, newProfile.currentXp - totalPenalty);
      newProfile.totalXp = Math.max(0, newProfile.totalXp - totalPenalty);
    }

    // Generate new daily quest set for new day; replace only previous day's eligible daily quests
    // Preserve completed/failed daily quests (history) and preserve non-daily (boss/custom/weekly)
    const preservedSpecial = newQuests.filter(q => {
      if (!isDailyQuest(q)) return true; // non-daily
      if (q.status === 'completed' || q.status === 'failed') return true; // preserve history
      return false;
    });
    const newDailySet = generateDailyQuestsForDay(newProfile, newQuests, currentDayKey);
    newQuests = [...newDailySet, ...preservedSpecial];

    if (lastDayKey && !processedPenaltyKeys.has(lastDayKey)) {
      processedPenaltyKeys.add(lastDayKey);
    }
    for (let j = 0; j < missedKeys.length; j++) {
      processedPenaltyKeys.add(missedKeys[j]);
    }
    newProfile.processedMissedPenaltyDayKeys = Array.from(processedPenaltyKeys);
    newProfile.lastQuestDayKey = currentDayKey;
    newProfile.lastQuestRolloverAt = Date.now();
    return { profile: newProfile, quests: newQuests, penaltiesApplied: totalPenalty };
  } else {
    if (!newProfile.lastQuestDayKey) {
      newProfile.lastQuestDayKey = currentDayKey;
    }
    if (!newProfile.processedMissedPenaltyDayKeys) {
      newProfile.processedMissedPenaltyDayKeys = profile.processedMissedPenaltyDayKeys || [];
    }
    return { profile: newProfile, quests: newQuests, penaltiesApplied: 0 };
  }
}
