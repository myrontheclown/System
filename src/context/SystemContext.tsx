import React, { createContext, useContext, useEffect, useState } from 'react';
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
      if (saved) return JSON.parse(saved);
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
    SoundFX.playToggle(profile.appearance.soundEffects);
    setQuests((prevQuests) =>
      prevQuests.map((q) => {
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

        // If all objectives completed, set status to active/ready
        return {
          ...q,
          objectives: updatedObjectives,
        };
      })
    );
  };

  const startQuest = (questId: string) => {
    SoundFX.playClick(profile.appearance.soundEffects);
    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, status: 'active' } : q))
    );
  };

  // Complete a quest and trigger rewards/level up
  const completeQuest = (questId: string) => {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'completed') return;

    if (targetQuest.isBoss) {
      claimBossVictory(questId);
      return;
    }

    // Mark all objectives completed
    const updatedObjectives = targetQuest.objectives.map((o) => ({
      ...o,
      completed: true,
      current: o.target,
    }));

    setQuests((prev) =>
      prev.map((q) =>
        q.id === questId
          ? { ...q, status: 'completed', objectives: updatedObjectives }
          : q
      )
    );

    // Apply XP with Resonance multiplier
    const gainedXp = Math.round(targetQuest.xpReward * profile.resonanceMultiplier);
    let newCurrentXp = profile.currentXp + gainedXp;
    const newTotalXp = profile.totalXp + gainedXp;
    let newLevel = profile.level;
    let newRank = profile.rank;
    let newUnallocatedPoints = profile.unallocatedPoints;
    let didLevelUp = false;
    let didRankUp = false;

    // Check level up threshold
    if (newCurrentXp >= profile.xpToNextLevel) {
      didLevelUp = true;
      newLevel += 1;
      newCurrentXp -= profile.xpToNextLevel;
      const nextTargetXp = getRequiredXpForLevel(newLevel);
      const calculatedRank = getRankForLevel(newLevel);
      if (calculatedRank !== profile.rank) {
        didRankUp = true;
        newRank = calculatedRank;
      }
      newUnallocatedPoints += 1;

      // Update XP target
      setProfile((prev) => {
        const nextAttrs = { ...prev.attributes };
        if (targetQuest.statRewards) {
          (Object.keys(targetQuest.statRewards) as AttributeKey[]).forEach((key) => {
            const reward = targetQuest.statRewards?.[key] || 0;
            nextAttrs[key] = (nextAttrs[key] || 10) + reward;
          });
        }
        return {
          ...prev,
          level: newLevel,
          rank: newRank,
          currentXp: newCurrentXp,
          xpToNextLevel: nextTargetXp,
          totalXp: newTotalXp,
          attributes: nextAttrs,
          unallocatedPoints: newUnallocatedPoints,
          totalQuestsCompleted: prev.totalQuestsCompleted + 1,
        };
      });

      if (didRankUp) {
        SoundFX.playRankUp(profile.appearance.soundEffects);
        triggerSystemConfetti();
        setSystemEvent({
          type: 'RANK_UP',
          levelReached: newLevel,
          newRank: newRank,
          quest: targetQuest,
        });
      } else {
        SoundFX.playLevelUp(profile.appearance.soundEffects);
        triggerSystemConfetti();
        setSystemEvent({
          type: 'LEVEL_UP',
          levelReached: newLevel,
          newRank: newRank,
          quest: targetQuest,
        });
      }
      return;
    }

    // Normal quest completion without level up
    setProfile((prev) => {
      const nextAttrs = { ...prev.attributes };
      if (targetQuest.statRewards) {
        (Object.keys(targetQuest.statRewards) as AttributeKey[]).forEach((key) => {
          const reward = targetQuest.statRewards?.[key] || 0;
          nextAttrs[key] = (nextAttrs[key] || 10) + reward;
        });
      }
      return {
        ...prev,
        currentXp: newCurrentXp,
        totalXp: newTotalXp,
        attributes: nextAttrs,
        totalQuestsCompleted: prev.totalQuestsCompleted + 1,
      };
    });

    SoundFX.playQuestComplete(profile.appearance.soundEffects);
    triggerSystemConfetti();
    setSystemEvent({
      type: 'QUEST_COMPLETE',
      quest: targetQuest,
    });
  };

  // Fail a quest (penalty triggered)
  const failQuest = (questId: string) => {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest) return;

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, status: 'failed' } : q))
    );

    const deduction = targetQuest.penaltyXp || 50;
    SoundFX.playPenalty(profile.appearance.soundEffects);

    setProfile((prev) => ({
      ...prev,
      currentXp: Math.max(0, prev.currentXp - deduction),
      totalXp: Math.max(0, prev.totalXp - deduction),
    }));

    setSystemEvent({
      type: 'QUEST_FAILED',
      quest: targetQuest,
      penaltyXp: deduction,
    });
  };

  // Boss victory handler
  const claimBossVictory = (questId: string) => {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest) return;

    setQuests((prev) =>
      prev.map((q) =>
        q.id === questId
          ? {
              ...q,
              status: 'completed',
              objectives: q.objectives.map((o) => ({ ...o, completed: true, current: o.target })),
            }
          : q
      )
    );

    setProfile((prev) => ({
      ...prev,
      currentXp: prev.currentXp + targetQuest.xpReward,
      totalXp: prev.totalXp + targetQuest.xpReward,
      attributes: {
        ...prev.attributes,
        VIT: prev.attributes.VIT + 10,
      },
      totalQuestsCompleted: prev.totalQuestsCompleted + 1,
    }));

    // Unlock Shadow Sovereign achievement if present
    setAchievements((prev) =>
      prev.map((a) =>
        a.id === 'ach-6'
          ? { ...a, unlocked: true, unlockedDate: 'Today', progress: { current: 1, max: 1 } }
          : a
      )
    );

    SoundFX.playBossVictory(profile.appearance.soundEffects);
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
    if (profile.unallocatedPoints <= 0) return;
    SoundFX.playClick(profile.appearance.soundEffects);
    setProfile((prev) => ({
      ...prev,
      unallocatedPoints: prev.unallocatedPoints - 1,
      attributes: {
        ...prev.attributes,
        [key]: prev.attributes[key] + 1,
      },
    }));
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

    setQuests((prev) => [fullQuest, ...prev]);
    SoundFX.playClick(profile.appearance.soundEffects);
  };

  // Settings updates
  const updateGoals = (goals: string[]) => {
    SoundFX.playToggle(profile.appearance.soundEffects);
    setProfile((prev) => ({
      ...prev,
      selectedGoals: goals,
    }));
  };

  const updatePreferences = (prefs: Partial<PlayerProfile['preferences']>) => {
    SoundFX.playToggle(profile.appearance.soundEffects);
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...prefs,
      },
    }));
  };

  const updateNotifications = (notifs: Partial<PlayerProfile['notifications']>) => {
    SoundFX.playToggle(profile.appearance.soundEffects);
    setProfile((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        ...notifs,
      },
    }));
  };

  const updateAppearance = (app: Partial<PlayerProfile['appearance']>) => {
    SoundFX.playToggle(profile.appearance.soundEffects);
    setProfile((prev) => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        ...app,
      },
    }));
  };

  const updateProfileName = (name: string) => {
    SoundFX.playClick(profile.appearance.soundEffects);
    setProfile((prev) => ({
      ...prev,
      name: name.trim().toUpperCase() || 'OPERATOR',
    }));
  };

  // Reset to Level 1 / Fresh profile
  const resetProgress = () => {
    SoundFX.playPenalty(profile.appearance.soundEffects);
    setProfile(FRESH_PLAYER_PROFILE);
    setQuests(INITIAL_QUESTS.map((q) => ({
      ...q,
      status: q.isBoss ? 'available' : 'active',
      objectives: q.objectives.map((o) => ({ ...o, completed: false, current: 0 })),
    })));
    setAchievements(INITIAL_ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: false,
      progress: a.progress ? { current: 0, max: a.progress.max } : undefined,
    })));
    setCurrentTab('system');
    setSelectedQuestId(null);
  };

  // Reset to Level 17 active showcase profile
  const loadShowcaseState = () => {
    SoundFX.playClick(profile.appearance.soundEffects);
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
      const { payload, warnings } = createBackupPayload(profile, quests, achievements);
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
      // 3. Serialize and write to localStorage
      const profileStr = JSON.stringify(validData.profile);
      const questsStr = JSON.stringify(validData.quests);
      const achievementsStr = JSON.stringify(validData.achievements);

      localStorage.setItem(STORAGE_KEYS.PROFILE, profileStr);
      localStorage.setItem(STORAGE_KEYS.QUESTS, questsStr);
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, achievementsStr);

      // 4. Update React Context state immediately
      setProfile(validData.profile);
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

    setProfile({
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
    });
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
