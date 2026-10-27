import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  Achievement,
  AttributeKey,
  NavigationTab,
  PlayerProfile,
  Quest,
  SystemEventState,
  SystemEventType,
} from '../types';
import {
  FRESH_PLAYER_PROFILE,
  INITIAL_ACHIEVEMENTS,
  INITIAL_PLAYER_PROFILE,
  INITIAL_QUESTS,
} from '../game/initialData';
import {
  calculateXpProgression,
  getRankForLevel,
  getRequiredXpForLevel,
  getResonanceMultiplier,
  SoundFX,
  triggerBossConfetti,
  triggerSystemConfetti,
} from '../game/progression';
import {
  STORAGE_KEYS,
  SystemBackupPayload,
  createBackupPayload,
  validateBackup,
} from '../utils/backup';
import { reconcileDailyRollover } from '../utils/dailyRollover';
import { getQuestDayKey } from '../utils/questSchedule';

export { STORAGE_KEYS };

interface SystemContextType {
  profile: PlayerProfile;
  quests: Quest[];
  achievements: Achievement[];
  currentTab: NavigationTab;
  selectedQuestId: string | null;
  systemEvent: SystemEventState;
  systemTime: string;

  // Navigation
  navigateTo: (tab: NavigationTab) => void;
  openQuestDetail: (questId: string) => void;
  closeQuestDetail: () => void;

  // Quest Actions
  toggleObjective: (questId: string, objectiveId: string) => void;
  startQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  failQuest: (questId: string) => void;
  claimBossVictory: (questId: string) => void;
  addNewQuest: (questData: Partial<Quest>) => void;

  // Progression & Stats
  allocateAttribute: (key: AttributeKey) => void;
  closeSystemEvent: () => void;
  triggerSimulationEvent: (type: SystemEventType) => void;

  // Settings & Profile
  updateGoals: (goals: string[]) => void;
  updatePreferences: (prefs: Partial<PlayerProfile['preferences']>) => void;
  updateNotifications: (notifs: Partial<PlayerProfile['notifications']>) => void;
  updateAppearance: (app: Partial<PlayerProfile['appearance']>) => void;
  updateProfileName: (name: string) => void;
  resetProgress: () => void;
  loadShowcaseState: () => void;
  loadFreshState: () => void;

  // Backup & Restore
  exportBackup: () => { success: boolean; data?: SystemBackupPayload; warnings?: string[]; error?: string };
  restoreBackup: (backupPayload: SystemBackupPayload) => { success: boolean; error?: string };

  // Onboarding
  completeOnboarding: (data: {
    name: string;
    paths: string[];
    difficulty: PlayerProfile['preferences']['difficulty'];
    dailyQuests: number;
    timeCommitment: string;
  }) => void;
}


const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or fallback to default showcase state
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure backward compatibility for missing reset time
        return {
          ...INITIAL_PLAYER_PROFILE,
          ...parsed,
          preferences: {
            ...INITIAL_PLAYER_PROFILE.preferences,
            ...(parsed.preferences || {}),
          },
          notifications: {
            ...INITIAL_PLAYER_PROFILE.notifications,
            ...(parsed.notifications || {}),
          },
          appearance: {
            ...INITIAL_PLAYER_PROFILE.appearance,
            ...(parsed.appearance || {}),
          },
        };
      }
    } catch (e) {
      console.error('Error loading profile from storage', e);
    }
    return INITIAL_PLAYER_PROFILE;
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading quests from storage', e);
    }
    return INITIAL_QUESTS;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading achievements from storage', e);
    }
    return INITIAL_ACHIEVEMENTS;
  });

  const profileRef = useRef(profile);
  profileRef.current = profile;
  const questsRef = useRef(quests);
  questsRef.current = quests;
  const achievementsRef = useRef(achievements);
  achievementsRef.current = achievements;

  // Run daily rollover/reconciliation on mount and when becoming visible
  useEffect(() => {
    try {
      const result = reconcileDailyRollover(profileRef.current, questsRef.current, new Date());
      if (result.profile !== profileRef.current || JSON.stringify(result.quests) !== JSON.stringify(questsRef.current)) {
        profileRef.current = result.profile;
        questsRef.current = result.quests;
        setProfile(result.profile);
        setQuests(result.quests);
      } else if (!profileRef.current.lastQuestDayKey) {
        const resetTime = result.profile.preferences?.dailyResetTime || '04:00 AM';
        profileRef.current = { ...profileRef.current, lastQuestDayKey: getQuestDayKey(new Date(), resetTime) };
        setProfile(profileRef.current);
      }
    } catch (e) {
      console.error('Error during daily rollover reconciliation', e);
    }

    const handleVisibility = () => {
      try {
        if (document.visibilityState === 'visible') {
          const result = reconcileDailyRollover(profileRef.current, questsRef.current, new Date());
          if (result.profile !== profileRef.current || JSON.stringify(result.quests) !== JSON.stringify(questsRef.current)) {
            profileRef.current = result.profile;
            questsRef.current = result.quests;
            setProfile(result.profile);
            setQuests(result.quests);
          }
        }
      } catch (e) {
        console.error('Error during visibility rollover reconciliation', e);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('system');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [systemEvent, setSystemEvent] = useState<SystemEventState>({ type: null });
  const [systemTime, setSystemTime] = useState<string>('04:20:43');

  // Real-time clock for top header telemetry
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const s = now.getSeconds().toString().padStart(2, '0');
      setSystemTime(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save to LocalStorage whenever state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
    } catch (e) {
      console.error('Error saving quests', e);
    }
  }, [quests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (e) {
      console.error('Error saving achievements', e);
    }
  }, [achievements]);

  // Navigation handlers
  const navigateTo = (tab: NavigationTab) => {
    SoundFX.playClick(profile.appearance.soundEffects);
    setCurrentTab(tab);
    setSelectedQuestId(null);
  };

  const openQuestDetail = (questId: string) => {
    SoundFX.playClick(profile.appearance.soundEffects);
    setSelectedQuestId(questId);
  };

  const closeQuestDetail = () => {
    SoundFX.playClick(profile.appearance.soundEffects);
    setSelectedQuestId(null);
  };

  // Toggle objective in a quest
  const toggleObjective = (questId: string, objectiveId: string) => {
    const targetQuest = questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'completed' || targetQuest.status === 'failed') return;

    SoundFX.playToggle(profileRef.current.appearance.soundEffects);
    questsRef.current = questsRef.current.map((q) => {
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
    setQuests(questsRef.current);
  };

  const startQuest = (questId: string) => {
    const targetQuest = questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'completed' || targetQuest.status === 'failed') return;

    SoundFX.playClick(profileRef.current.appearance.soundEffects);
    questsRef.current = questsRef.current.map((q) => (q.id === questId ? { ...q, status: 'active' } : q));
    setQuests(questsRef.current);
  };

  // Complete a quest and trigger rewards/level up
  const completeQuest = (questId: string) => {
    const targetQuest = questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'completed' || targetQuest.status === 'failed') return;

    if (targetQuest.isBoss) {
      claimBossVictory(questId);
      return;
    }

    // Mark all objectives completed and quest completed
    const updatedObjectives = targetQuest.objectives.map((o) => ({
      ...o,
      completed: true,
      current: o.target,
    }));

    questsRef.current = questsRef.current.map((q) =>
      q.id === questId
        ? { ...q, status: 'completed', objectives: updatedObjectives }
        : q
    );
    setQuests(questsRef.current);

    // Apply XP with Resonance multiplier and calculate multi-level progression
    const gainedXp = Math.round(targetQuest.xpReward * profileRef.current.resonanceMultiplier);
    const progression = calculateXpProgression(
      profileRef.current.level,
      profileRef.current.currentXp,
      profileRef.current.xpToNextLevel,
      profileRef.current.rank,
      profileRef.current.unallocatedPoints,
      profileRef.current.totalXp,
      gainedXp
    );

    const nextAttrs = { ...profileRef.current.attributes };
    if (targetQuest.statRewards) {
      (Object.keys(targetQuest.statRewards) as AttributeKey[]).forEach((key) => {
        const reward = targetQuest.statRewards?.[key] || 0;
        nextAttrs[key] = (nextAttrs[key] || 10) + reward;
      });
    }

    profileRef.current = {
      ...profileRef.current,
      level: progression.level,
      rank: progression.rank,
      currentXp: progression.currentXp,
      xpToNextLevel: progression.xpToNextLevel,
      totalXp: progression.totalXp,
      attributes: nextAttrs,
      unallocatedPoints: progression.unallocatedPoints,
      totalQuestsCompleted: profileRef.current.totalQuestsCompleted + 1,
    };
    setProfile(profileRef.current);

    if (progression.didRankUp) {
      SoundFX.playRankUp(profileRef.current.appearance.soundEffects);
      triggerSystemConfetti();
      setSystemEvent({
        type: 'RANK_UP',
        levelReached: progression.level,
        newRank: progression.rank,
        quest: targetQuest,
      });
    } else if (progression.didLevelUp) {
      SoundFX.playLevelUp(profileRef.current.appearance.soundEffects);
      triggerSystemConfetti();
      setSystemEvent({
        type: 'LEVEL_UP',
        levelReached: progression.level,
        newRank: progression.rank,
        quest: targetQuest,
      });
    } else {
      SoundFX.playQuestComplete(profileRef.current.appearance.soundEffects);
      triggerSystemConfetti();
      setSystemEvent({
        type: 'QUEST_COMPLETE',
        quest: targetQuest,
      });
    }
  };

  // Fail a quest (penalty triggered once)
  const failQuest = (questId: string) => {
    const targetQuest = questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'failed' || targetQuest.status === 'completed') return;

    questsRef.current = questsRef.current.map((q) => (q.id === questId ? { ...q, status: 'failed' } : q));
    setQuests(questsRef.current);

    const deduction = targetQuest.penaltyXp || 50;
    SoundFX.playPenalty(profileRef.current.appearance.soundEffects);

    profileRef.current = {
      ...profileRef.current,
      currentXp: Math.max(0, profileRef.current.currentXp - deduction),
      totalXp: Math.max(0, profileRef.current.totalXp - deduction),
    };
    setProfile(profileRef.current);

    setSystemEvent({
      type: 'QUEST_FAILED',
      quest: targetQuest,
      penaltyXp: deduction,
    });
  };

  // Boss victory handler (awarded once only)
  const claimBossVictory = (questId: string) => {
    const targetQuest = questsRef.current.find((q) => q.id === questId);
    if (!targetQuest || !targetQuest.isBoss) return;
    if (targetQuest.status === 'completed' || targetQuest.status === 'failed') return;

    questsRef.current = questsRef.current.map((q) =>
      q.id === questId
        ? {
            ...q,
            status: 'completed',
            objectives: q.objectives.map((o) => ({ ...o, completed: true, current: o.target })),
          }
        : q
    );
    setQuests(questsRef.current);

    const gainedXp = targetQuest.xpReward;
    const progression = calculateXpProgression(
      profileRef.current.level,
      profileRef.current.currentXp,
      profileRef.current.xpToNextLevel,
      profileRef.current.rank,
      profileRef.current.unallocatedPoints,
      profileRef.current.totalXp,
      gainedXp
    );

    profileRef.current = {
      ...profileRef.current,
      level: progression.level,
      rank: progression.rank,
      currentXp: progression.currentXp,
      xpToNextLevel: progression.xpToNextLevel,
      totalXp: progression.totalXp,
      unallocatedPoints: progression.unallocatedPoints,
      attributes: {
        ...profileRef.current.attributes,
        VIT: profileRef.current.attributes.VIT + 10,
      },
      totalQuestsCompleted: profileRef.current.totalQuestsCompleted + 1,
    };
    setProfile(profileRef.current);

    // Unlock Shadow Sovereign achievement if present
    const updatedAchievements = achievementsRef.current.map((a) =>
      a.id === 'ach-6'
        ? { ...a, unlocked: true, unlockedDate: 'Today', progress: { current: 1, max: 1 } }
        : a
    );
    achievementsRef.current = updatedAchievements;
    setAchievements(updatedAchievements);

    SoundFX.playBossVictory(profileRef.current.appearance.soundEffects);
    triggerBossConfetti();

    setSystemEvent({
      type: 'BOSS_DEFEATED',
      quest: targetQuest,
      bossReward: {
        title: targetQuest.title,
        description: targetQuest.description,
        xp: targetQuest.xpReward,
        statGain: '+10 VIT',
        specialUnlock: targetQuest.specialReward || 'Title: Endurance Sovereign + Special Quest Line Unlocked',
      },
    });
  };

  // Allocate an attribute point from leveling up
  const allocateAttribute = (key: AttributeKey) => {
    if (profileRef.current.unallocatedPoints <= 0) return;
    SoundFX.playClick(profileRef.current.appearance.soundEffects);
    profileRef.current = {
      ...profileRef.current,
      unallocatedPoints: profileRef.current.unallocatedPoints - 1,
      attributes: {
        ...profileRef.current.attributes,
        [key]: profileRef.current.attributes[key] + 1,
      },
    };
    setProfile(profileRef.current);
  };

  const closeSystemEvent = () => {
    SoundFX.playClick(profile.appearance.soundEffects);
    setSystemEvent({ type: null });
  };

  // Simulation mode trigger (allows previewing all system event overlays)
  const triggerSimulationEvent = (type: SystemEventType) => {
    SoundFX.playClick(profile.appearance.soundEffects);
    if (type === 'LEVEL_UP') {
      SoundFX.playLevelUp(profile.appearance.soundEffects);
      triggerSystemConfetti();
      setSystemEvent({
        type: 'LEVEL_UP',
        levelReached: profile.level + 1,
        newRank: profile.rank,
      });
    } else if (type === 'RANK_UP') {
      SoundFX.playRankUp(profile.appearance.soundEffects);
      triggerSystemConfetti();
      setSystemEvent({
        type: 'RANK_UP',
        levelReached: profile.level,
        newRank: 'C',
      });
    } else if (type === 'BOSS_DEFEATED') {
      SoundFX.playBossVictory(profile.appearance.soundEffects);
      triggerBossConfetti();
      setSystemEvent({
        type: 'BOSS_DEFEATED',
        bossReward: {
          title: 'THE 10K',
          description: 'Complete a 10 km run.',
          xp: 1500,
          statGain: '+10 VIT',
          specialUnlock: 'Title: Endurance Sovereign + Special Quest Line Unlocked',
        },
      });
    } else if (type === 'QUEST_COMPLETE') {
      const q = quests[0];
      SoundFX.playQuestComplete(profile.appearance.soundEffects);
      triggerSystemConfetti();
      setSystemEvent({
        type: 'QUEST_COMPLETE',
        quest: q,
      });
    } else if (type === 'QUEST_FAILED') {
      SoundFX.playPenalty(profile.appearance.soundEffects);
      setSystemEvent({
        type: 'QUEST_FAILED',
        penaltyXp: 50,
      });
    } else if (type === 'ACHIEVEMENT_UNLOCKED') {
      SoundFX.playLevelUp(profile.appearance.soundEffects);
      triggerSystemConfetti();
      setSystemEvent({
        type: 'ACHIEVEMENT_UNLOCKED',
        achievement: achievements[0],
      });
    }
  };

  // Add custom quest
  const addNewQuest = (questData: Partial<Quest>) => {
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

    questsRef.current = [fullQuest, ...questsRef.current];
    setQuests(questsRef.current);
    SoundFX.playClick(profileRef.current.appearance.soundEffects);
  };

  // Settings updates
  const updateGoals = (goals: string[]) => {
    SoundFX.playToggle(profileRef.current.appearance.soundEffects);
    profileRef.current = {
      ...profileRef.current,
      selectedGoals: goals,
    };
    setProfile(profileRef.current);
  };

  const updatePreferences = (prefs: Partial<PlayerProfile['preferences']>) => {
    SoundFX.playToggle(profileRef.current.appearance.soundEffects);
    profileRef.current = {
      ...profileRef.current,
      preferences: {
        ...(profileRef.current.preferences || {
          difficulty: 'Normal',
          dailyQuota: 5,
          activeDomains: ['BODY', 'MIND'],
          dailyResetTime: '04:00 AM',
          dailyCommitment: '30–60 min',
        }),
        ...prefs,
      },
    };
    setProfile(profileRef.current);
  };

  const updateNotifications = (notifs: Partial<PlayerProfile['notifications']>) => {
    SoundFX.playToggle(profileRef.current.appearance.soundEffects);
    profileRef.current = {
      ...profileRef.current,
      notifications: {
        ...profileRef.current.notifications,
        ...notifs,
      },
    };
    setProfile(profileRef.current);
  };

  const updateAppearance = (app: Partial<PlayerProfile['appearance']>) => {
    SoundFX.playToggle(profileRef.current.appearance.soundEffects);
    profileRef.current = {
      ...profileRef.current,
      appearance: {
        ...profileRef.current.appearance,
        ...app,
      },
    };
    setProfile(profileRef.current);
  };

  const updateProfileName = (name: string) => {
    SoundFX.playClick(profileRef.current.appearance.soundEffects);
    profileRef.current = {
      ...profileRef.current,
      name: name.trim().toUpperCase() || 'OPERATOR',
    };
    setProfile(profileRef.current);
  };

  // Reset to Level 1 / Fresh profile
  const resetProgress = () => {
    SoundFX.playPenalty(profile.appearance.soundEffects);
    profileRef.current = FRESH_PLAYER_PROFILE;
    setProfile(FRESH_PLAYER_PROFILE);
    const freshQuests: Quest[] = INITIAL_QUESTS.map((q) => ({
      ...q,
      status: q.isBoss ? 'available' : 'active',
      objectives: q.objectives.map((o) => ({ ...o, completed: false, current: 0 })),
    }));
    questsRef.current = freshQuests;
    setQuests(freshQuests);
    const freshAchievements = INITIAL_ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: false,
      progress: a.progress ? { current: 0, max: a.progress.max } : undefined,
    }));
    achievementsRef.current = freshAchievements;
    setAchievements(freshAchievements);
    setCurrentTab('system');
    setSelectedQuestId(null);
  };

  // Reset to Level 17 active showcase profile
  const loadShowcaseState = () => {
    SoundFX.playClick(profileRef.current.appearance.soundEffects);
    profileRef.current = INITIAL_PLAYER_PROFILE;
    questsRef.current = INITIAL_QUESTS;
    achievementsRef.current = INITIAL_ACHIEVEMENTS;
    setProfile(INITIAL_PLAYER_PROFILE);
    setQuests(INITIAL_QUESTS);
    setAchievements(INITIAL_ACHIEVEMENTS);
    setCurrentTab('system');
    setSelectedQuestId(null);
  };

  const loadFreshState = () => {
    resetProgress();
  };

  // Backup & Restore handlers
  const exportBackup = () => {
    try {
      const { payload, warnings } = createBackupPayload(profileRef.current, questsRef.current, achievementsRef.current);
      SoundFX.playClick(profile.appearance.soundEffects);
      return { success: true, data: payload, warnings };
    } catch (err) {
      return {
        success: false,
        error: `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };

  const restoreBackup = (backupPayload: SystemBackupPayload): { success: boolean; error?: string } => {
    // 1. Validation check
    const validation = validateBackup(backupPayload);
    if (!validation.valid || !validation.data) {
      return {
        success: false,
        error: validation.error || 'Backup validation failed.',
      };
    }

    const validData = validation.data;

    // 2. Snapshot current localStorage before any modifications
    const snapshot = {
      profile: localStorage.getItem(STORAGE_KEYS.PROFILE),
      quests: localStorage.getItem(STORAGE_KEYS.QUESTS),
      achievements: localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS),
    };

    try {
      // Ensure backward compatibility for reset time
      const restoredProfile = {
        ...validData.profile,
        preferences: {
          ...(validData.profile.preferences || {}),
          dailyResetTime: validData.profile.preferences?.dailyResetTime || '04:00 AM',
        },
      };

      // 3. Serialize and write to localStorage
      const profileStr = JSON.stringify(restoredProfile);
      const questsStr = JSON.stringify(validData.quests);
      const achievementsStr = JSON.stringify(validData.achievements);

      localStorage.setItem(STORAGE_KEYS.PROFILE, profileStr);
      localStorage.setItem(STORAGE_KEYS.QUESTS, questsStr);
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievementsStr);

      // 4. Update React Context state immediately
      profileRef.current = restoredProfile;
      questsRef.current = validData.quests;
      achievementsRef.current = validData.achievements;
      setProfile(restoredProfile);
      setQuests(validData.quests);
      setAchievements(validData.achievements);
      setSelectedQuestId(null);

      // Audio cue matching app visual identity
      SoundFX.playLevelUp(validData.profile.appearance.soundEffects);

      return { success: true };
    } catch (storageError) {
      // Rollback to snapshot if writing to localStorage threw an error
      try {
        if (snapshot.profile !== null) {
          localStorage.setItem(STORAGE_KEYS.PROFILE, snapshot.profile);
        } else {
          localStorage.removeItem(STORAGE_KEYS.PROFILE);
        }
        if (snapshot.quests !== null) {
          localStorage.setItem(STORAGE_KEYS.QUESTS, snapshot.quests);
        } else {
          localStorage.removeItem(STORAGE_KEYS.QUESTS);
        }
        if (snapshot.achievements !== null) {
          localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, snapshot.achievements);
        } else {
          localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
        }
      } catch (rollbackErr) {
        console.error('Critical: Failed to rollback storage state', rollbackErr);
      }

      return {
        success: false,
        error: `Restore failed: ${storageError instanceof Error ? storageError.message : 'Storage write failure'}. Current data was preserved.`,
      };
    }
  };

  // Onboarding completion
  const completeOnboarding = (data: {
    name: string;
    paths: string[];
    difficulty: PlayerProfile['preferences']['difficulty'];
    dailyQuests: number;
    timeCommitment: string;
  }) => {
    SoundFX.playLevelUp(profile.appearance.soundEffects);
    triggerSystemConfetti();

    const activeDomains = data.paths.map((p) => p.toUpperCase() as any);

    const newProfile: PlayerProfile = {
      ...FRESH_PLAYER_PROFILE,
      name: data.name.trim().toUpperCase() || 'OPERATOR',
      operatorId: `#${Math.floor(1000 + Math.random() * 9000)}-${data.name.slice(0, 3).toUpperCase()}`,
      selectedGoals: data.paths,
      preferences: {
        difficulty: data.difficulty,
        dailyQuota: data.dailyQuests,
        activeDomains: activeDomains.length > 0 ? activeDomains : ['BODY', 'MIND'],
        dailyResetTime: '04:00 AM',
        dailyCommitment: data.timeCommitment,
      },
      hasCompletedOnboarding: true,
    };
    profileRef.current = newProfile;
    setProfile(newProfile);
    setCurrentTab('system');
  };

  return (
    <SystemContext.Provider
      value={{
        profile,
        quests,
        achievements,
        currentTab,
        selectedQuestId,
        systemEvent,
        systemTime,
        navigateTo,
        openQuestDetail,
        closeQuestDetail,
        toggleObjective,
        startQuest,
        completeQuest,
        failQuest,
        claimBossVictory,
        addNewQuest,
        allocateAttribute,
        closeSystemEvent,
        triggerSimulationEvent,
        updateGoals,
        updatePreferences,
        updateNotifications,
        updateAppearance,
        updateProfileName,
        resetProgress,
        loadShowcaseState,
        loadFreshState,
        exportBackup,
        restoreBackup,
        completeOnboarding,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
