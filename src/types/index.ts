export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type AttributeKey = 'STR' | 'VIT' | 'INT' | 'FOC' | 'DISC' | 'SOC';

export interface AttributeDefinition {
  key: AttributeKey;
  name: string;
  fullName: string;
  description: string;
  icon: string;
}

export interface QuestObjective {
  id: string;
  text: string;
  note: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
}

export type QuestCategory = 
  | 'TRAINING' 
  | 'INTELLIGENCE' 
  | 'LEARNING' 
  | 'KNOWLEDGE' 
  | 'DISCIPLINE' 
  | 'CAREER' 
  | 'LIFE' 
  | 'BOSS';

export interface Quest {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: QuestCategory;
  categoryLabel: string;
  isRare?: boolean;
  isBoss?: boolean;
  status: 'available' | 'active' | 'completed' | 'failed';
  xpReward: number;
  statRewards?: Partial<Record<AttributeKey, number>>;
  penaltyXp: number;
  durationLabel?: string;
  deadlineTime: string;
  deadlineTimestamp: number;
  objectives: QuestObjective[];
  specialReward?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tierLabel: string;
  xpReward: number;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: { current: number; max: number };
}

export interface DailyHistoryRecord {
  day: string;
  fullDay: string;
  date: string;
  xp: number;
  completedQuests: number;
}

export interface PlayerProfile {
  name: string;
  operatorId: string;
  level: number;
  rank: RankTier;
  tier: string;
  currentXp: number;
  xpToNextLevel: number;
  totalXp: number;
  resonanceMultiplier: number;
  targetClass: string;
  attributes: Record<AttributeKey, number>;
  unallocatedPoints: number;
  streakDays: number;
  totalQuestsCompleted: number;
  history: DailyHistoryRecord[];
  selectedGoals: string[];
  preferences: {
    difficulty: 'Casual' | 'Normal' | 'Hard' | 'Insane';
    dailyQuota: number;
    activeDomains: Array<'BODY' | 'MIND' | 'CAREER' | 'DISCIPLINE' | 'SOCIAL' | 'LIFE'>;
    dailyResetTime: string;
    dailyCommitment?: string;
  };
  notifications: {
    dailyReminder: boolean;
    deadlineReminder: boolean;
    levelUp: boolean;
    achievementUnlocks: boolean;
  };
  appearance: {
    darkThemeLocked: boolean;
    soundEffects: boolean;
    reducedAnimations: boolean;
  };
  hasCompletedOnboarding: boolean;
}

export type NavigationTab = 'system' | 'quests' | 'stats' | 'profile';

export type SystemEventType = 
  | 'QUEST_COMPLETE' 
  | 'LEVEL_UP' 
  | 'RANK_UP' 
  | 'ACHIEVEMENT_UNLOCKED' 
  | 'QUEST_FAILED' 
  | 'BOSS_DEFEATED';

export interface SystemEventState {
  type: SystemEventType | null;
  quest?: Quest;
  levelReached?: number;
  newRank?: RankTier;
  achievement?: Achievement;
  penaltyXp?: number;
  bossReward?: {
    title: string;
    description: string;
    xp: number;
    statGain: string;
    specialUnlock: string;
  };
}
