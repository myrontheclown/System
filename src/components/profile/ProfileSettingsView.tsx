import React, { useState, useRef } from 'react';
import { downloadBackupFile, parseBackupJson, SystemBackupPayload } from '../../utils/backup';
import { useSystem } from '../../context/SystemContext';
import {
  Edit2,
  Plus,
  Minus,
  Check,
  CheckCircle,
  Radio,
  Clock,
  Bell,
  Volume2,
  EyeOff,
  Download,
  Shield,
  Terminal,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  X,
  Upload,
} from 'lucide-react';

export const ProfileSettingsView: React.FC<{ onRestartOnboarding: () => void }> = ({
  onRestartOnboarding,
}) => {
  const {
    profile,
    quests,
    achievements,
    updateGoals,
    updatePreferences,
    updateNotifications,
    updateAppearance,
    updateProfileName,
    resetProgress,
    loadShowcaseState,
    exportBackup,
    restoreBackup,
  } = useSystem();

  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [customGoalName, setCustomGoalName] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<SystemBackupPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message: msg, type });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), type === 'error' ? 4500 : 2500);
  };

  const allAvailableGoals = [
    'Fitness',
    'Programming',
    'Learning',
    'Reading',
    'Career',
    'Social',
    'Finance',
    'Personal growth',
    ...profile.selectedGoals.filter(
      (g) =>
        ![
          'Fitness',
          'Programming',
          'Learning',
          'Reading',
          'Career',
          'Social',
          'Finance',
          'Personal growth',
        ].includes(g)
    ),
  ];

  const handleToggleGoal = (goal: string) => {
    const isSelected = profile.selectedGoals.includes(goal);
    let nextGoals: string[];
    if (isSelected) {
      nextGoals = profile.selectedGoals.filter((g) => g !== goal);
    } else {
      nextGoals = [...profile.selectedGoals, goal];
    }
    updateGoals(nextGoals);
    showToast(`Updated goals: ${nextGoals.length} active`);
  };

  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoalName.trim()) return;
    const trimmed = customGoalName.trim();
    if (!profile.selectedGoals.includes(trimmed)) {
      updateGoals([...profile.selectedGoals, trimmed]);
      showToast(`Added goal vector: ${trimmed}`);
    }
    setCustomGoalName('');
    setShowAddGoalModal(false);
  };

  const handleDifficultyChange = (diff: typeof profile.preferences.difficulty) => {
    updatePreferences({ difficulty: diff });
    showToast(`Difficulty scaled to ${diff}`);
  };

  const handleQuotaChange = (delta: number) => {
    const nextQuota = Math.max(3, Math.min(8, profile.preferences.dailyQuota + delta));
    updatePreferences({ dailyQuota: nextQuota });
    showToast(`Daily quota set to ${nextQuota} protocols`);
  };

  const handleToggleDomain = (domain: 'BODY' | 'MIND' | 'CAREER' | 'LIFE') => {
    const current = profile.preferences.activeDomains;
    let next: typeof current;
    if (current.includes(domain)) {
      if (current.length === 1) {
        showToast('At least one domain must remain active');
        return;
      }
      next = current.filter((d) => d !== domain);
    } else {
      next = [...current, domain];
    }
    updatePreferences({ activeDomains: next });
    showToast(`Domain matrix adjusted: ${domain}`);
  };

  const cycleResetTime = () => {
    const times = ['04:00 AM', '05:00 AM', '06:00 AM', '12:00 AM'];
    const currentIdx = times.indexOf(profile.preferences.dailyResetTime);
    const nextTime = times[(currentIdx + 1) % times.length];
    updatePreferences({ dailyResetTime: nextTime });
    showToast(`Cycle reset scheduled for ${nextTime}`);
  };

  const handleExportBackup = () => {
    try {
      const result = exportBackup();
      if (!result.success || !result.data) {
        showToast(result.error || 'Failed to generate backup payload.', 'error');
        return;
      }
      downloadBackupFile(result.data);
      showToast('System backup exported successfully.', 'success');
    } catch (err) {
      showToast(`Export error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handleTriggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type && file.type !== 'application/json') {
      showToast('Invalid file format: Please select a valid JSON backup file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          showToast('Failed to read file contents.', 'error');
          return;
        }

        const result = parseBackupJson(content);
        if (!result.valid || !result.data) {
          showToast(result.error || 'Validation failed: Invalid backup file.', 'error');
          return;
        }

        // Store validated data and present overwrite confirmation modal
        setPendingRestore(result.data);
        setShowRestoreModal(true);
      } catch (err) {
        showToast(`Error processing backup: ${err instanceof Error ? err.message : 'Corrupted file'}`, 'error');
      }
    };

    reader.onerror = () => {
      showToast('Error reading the selected file from disk.', 'error');
    };

    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    try {
      const result = restoreBackup(pendingRestore);
      setShowRestoreModal(false);
      setPendingRestore(null);

      if (result.success) {
        showToast('System backup restored successfully.', 'success');
      } else {
        showToast(result.error || 'Failed to restore backup.', 'error');
      }
    } catch (err) {
      setShowRestoreModal(false);
      setPendingRestore(null);
      showToast(`Restoration failed: ${err instanceof Error ? err.message : 'Storage error'}. Data preserved.`, 'error');
    }
  };

  const handleCancelRestore = () => {
    setShowRestoreModal(false);
    setPendingRestore(null);
  };

  const handleConfirmPurge = () => {
    resetProgress();
    setShowPurgeModal(false);
    showToast('SYSTEM PURGE COMPLETE: Initialized to Level 1');
  };

  const xpPercentage = Math.min(
    100,
    Number(((profile.currentXp / profile.xpToNextLevel) * 100).toFixed(1))
  );

  return (
    <div className="flex flex-col w-full pb-10 space-y-6 select-none animate-fadeIn">
      {/* Toast popup */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed top-18 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg bg-[#0D0E14] max-w-[90vw] text-xs font-mono font-bold shadow-2xl z-50 flex items-center gap-2 animate-bounce ${
            toast.type === 'error'
              ? 'border border-[#FF5263] text-[#FF5263]'
              : toast.type === 'success'
              ? 'border border-[#3DDB8B] text-[#F5F5F7]'
              : 'border border-[#4D8DFF] text-[#F5F5F7]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              toast.type === 'error'
                ? 'bg-[#FF5263] shadow-[0_0_8px_#FF5263]'
                : toast.type === 'success'
                ? 'bg-[#3DDB8B] shadow-[0_0_8px_#3DDB8B]'
                : 'bg-[#4D8DFF] shadow-[0_0_8px_#4D8DFF]'
            }`}
          />
          <span className="truncate">{toast.message}</span>
        </div>
      )}

      {/* Top Context Ticker */}
      <div className="flex items-center justify-between px-1 text-[#9290A0]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B3DFF] animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-[#F5F5F7] font-semibold">
            OPERATOR ID: {profile.operatorId}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
          STATUS: SYNCHRONIZED
        </span>
      </div>

      {/* Player Profile Hero */}
      <div className="w-full bg-[#14151D] border border-[#29233A] rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-[#8B3DFF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Geometric Emblem Avatar */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-[#0D0E14] rounded-xl shadow-inner border border-[#29233A]" />
              <svg
                className="w-12 h-12 text-[#8B3DFF] drop-shadow-[0_0_8px_rgba(139,61,255,0.45)]"
                fill="none"
                viewBox="0 0 100 100"
              >
                <polygon
                  points="50 6, 88 28, 88 72, 50 94, 12 72, 12 28"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="#0D0E14"
                />
                <polygon
                  points="50 22, 74 36, 74 64, 50 78, 26 64, 26 36"
                  stroke="#B45CFF"
                  strokeWidth="2"
                  fill="rgba(139, 61, 255, 0.15)"
                />
                <circle cx="50" cy="50" r="7" fill="#4D8DFF" className="animate-ping" style={{ transformOrigin: 'center', animationDuration: '3s' }} />
                <circle cx="50" cy="50" r="5" fill="#F5F5F7" />
              </svg>
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-[#0D0E14] border border-[#29233A] text-[9px] font-mono text-[#3DDB8B] flex items-center gap-0.5 shadow">
                <span className="w-1 h-1 rounded-full bg-[#3DDB8B]" />
                LV{profile.level}
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#F5F5F7] tracking-tight uppercase leading-none truncate">
                  {profile.name}
                </h2>
                <span className="material-symbols-outlined text-[18px] text-[#4D8DFF]" title="Verified Protocol">
                  verified
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded bg-[#8B3DFF]/20 text-[#B45CFF] text-[10px] font-bold tracking-wider">
                  LEVEL {profile.level}
                </span>
                <span className="text-[#9290A0] text-xs">·</span>
                <span className="px-2 py-0.5 rounded bg-[#1f1f24] text-[#aec6ff] text-[10px] font-bold tracking-wider">
                  RANK {profile.rank}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Trigger */}
          <button
            type="button"
            onClick={() => setShowEditNameModal(true)}
            className="h-9 px-3 rounded-lg bg-[#1f1f24] hover:bg-[#2a292e] text-[#F5F5F7] flex items-center gap-1.5 transition-all active:scale-95 shrink-0 border border-[#29233A]"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#4D8DFF]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              EDIT
            </span>
          </button>
        </div>

        {/* XP Progression Conduit */}
        <div className="mt-5 pt-4 border-t border-[#29233A]/60">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[10px] text-[#9290A0] tracking-wider uppercase font-semibold">
              SYSTEM XP ACCUMULATION
            </span>
            <span className="text-xs font-mono text-[#F5F5F7]">
              {profile.currentXp.toLocaleString()} <span className="text-[#9290A0]">/ {profile.xpToNextLevel.toLocaleString()} XP</span>{' '}
              <span className="text-[#B45CFF] ml-1">[{xpPercentage}%]</span>
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#0D0E14] overflow-hidden relative p-[1px] border border-[#29233A]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] relative shadow-[0_0_12px_rgba(180,92,255,0.7)]"
              style={{ width: `${Math.max(4, xpPercentage)}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
            </div>
          </div>

          <div className="flex justify-between items-center mt-2 text-xs text-[#9290A0]">
            <span>
              Next Calibration:{' '}
              <span className="text-[#F5F5F7]">
                Level {profile.level + 1} (Rank {profile.level >= 17 ? 'C-Trial' : profile.rank})
              </span>
            </span>
            <span className="text-[#B45CFF] font-semibold">
              +{Math.max(0, profile.xpToNextLevel - profile.currentXp)} XP to target
            </span>
          </div>
        </div>
      </div>

      {/* MY GOALS (DIRECTIVES) */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#F5F5F7] uppercase tracking-wide">
              MY GOALS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#1f1f24] text-[#9290A0] text-[10px] font-bold">
              {profile.selectedGoals.length} ACTIVE
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddGoalModal(true)}
            className="flex items-center gap-1 text-[#4D8DFF] hover:text-[#aec6ff] text-xs font-bold uppercase tracking-wider py-1 px-2 rounded hover:bg-[#14151D] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> ADD GOAL
          </button>
        </div>

        <div className="bg-[#14151D] border border-[#29233A] rounded-xl p-4 shadow-sm">
          <p className="text-xs text-[#9290A0] mb-3">
            System directs daily quest generation based on designated focal vectors:
          </p>

          <div className="flex flex-wrap gap-2">
            {allAvailableGoals.map((goal) => {
              const isSelected = profile.selectedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleToggleGoal(goal)}
                  className={`h-9 px-3.5 rounded-lg flex items-center gap-2 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#8B3DFF]/20 text-[#F5F5F7] border border-[#8B3DFF]/40 shadow-[inset_0_0_8px_rgba(139,61,255,0.3)]'
                      : 'bg-[#0D0E14] text-[#9290A0] border border-[#29233A] hover:text-[#F5F5F7]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? 'bg-[#B45CFF] shadow-[0_0_6px_#B45CFF]'
                        : 'bg-[#4b4456]'
                    }`}
                  />
                  <span className={`text-xs ${isSelected ? 'font-medium' : ''}`}>
                    {goal}
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#B45CFF]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* QUEST PREFERENCES */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-[#F5F5F7] uppercase tracking-wide">
            QUEST PREFERENCES
          </span>
          <span className="text-[10px] text-[#9290A0] uppercase font-semibold">
            PROTOCOL MODIFIERS
          </span>
        </div>

        <div className="bg-[#14151D] border border-[#29233A] rounded-xl p-4 shadow-sm space-y-5">
          {/* Difficulty Scaling */}
          <div>
            <label className="text-[10px] font-bold text-[#9290A0] uppercase tracking-wider block mb-2">
              DIFFICULTY SCALING
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0D0E14] rounded-lg border border-[#29233A]">
              {(['Casual', 'Normal', 'Hard', 'Insane'] as const).map((diff) => {
                const isSelected = profile.preferences.difficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => handleDifficultyChange(diff)}
                    className={`py-2 rounded text-center text-xs font-bold tracking-wider uppercase transition-all ${
                      isSelected
                        ? 'bg-[#8B3DFF] text-white shadow-[0_0_12px_rgba(139,61,255,0.4)]'
                        : 'text-[#9290A0] hover:text-[#F5F5F7]'
                    }`}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Quest Stepper */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs text-[#F5F5F7] font-semibold block">
                Daily Quest Quota
              </span>
              <span className="text-[11px] text-[#9290A0]">
                Number of mandatory protocols per cycle
              </span>
            </div>

            <div className="flex items-center gap-3 bg-[#0D0E14] border border-[#29233A] px-2 py-1.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleQuotaChange(-1)}
                className="w-7 h-7 rounded flex items-center justify-center bg-[#1f1f24] hover:bg-[#2a292e] text-[#F5F5F7] active:scale-90 transition-transform"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-base font-bold text-[#F5F5F7] w-5 text-center font-mono">
                {profile.preferences.dailyQuota}
              </span>
              <button
                type="button"
                onClick={() => handleQuotaChange(1)}
                className="w-7 h-7 rounded flex items-center justify-center bg-[#1f1f24] hover:bg-[#2a292e] text-[#F5F5F7] active:scale-90 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Domains Pills */}
          <div className="pt-1">
            <label className="text-[10px] font-bold text-[#9290A0] uppercase tracking-wider block mb-2">
              ACTIVE DOMAINS
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'BODY', label: 'BODY', icon: 'fitness_center', color: 'text-[#4D8DFF]' },
                { key: 'MIND', label: 'MIND', icon: 'psychology', color: 'text-[#B45CFF]' },
                { key: 'CAREER', label: 'CAREER', icon: 'work', color: 'text-[#F5F5F7]' },
                { key: 'LIFE', label: 'LIFE', icon: 'spa', color: 'text-[#3DDB8B]' },
              ].map((domain) => {
                const isActive = profile.preferences.activeDomains.includes(domain.key as any);
                return (
                  <button
                    key={domain.key}
                    type="button"
                    onClick={() => handleToggleDomain(domain.key as any)}
                    className={`h-11 px-3 rounded-lg flex items-center justify-between border transition-all active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#8B3DFF]/20 border-[#8B3DFF]/40 text-[#F5F5F7]'
                        : 'bg-[#0D0E14] border-[#29233A] text-[#9290A0]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[18px] ${domain.color}`}>
                        {domain.icon}
                      </span>
                      <span className="text-xs font-bold tracking-wider">
                        {domain.label}
                      </span>
                    </div>
                    {isActive ? (
                      <CheckCircle className="w-4 h-4 text-[#3DDB8B]" />
                    ) : (
                      <Radio className="w-4 h-4 opacity-20 text-[#9290A0]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Reset Time Row */}
          <button
            type="button"
            onClick={cycleResetTime}
            className="w-full pt-2 flex items-center justify-between text-left group"
          >
            <div>
              <span className="text-xs text-[#F5F5F7] font-semibold block">
                Daily System Reset
              </span>
              <span className="text-[11px] text-[#9290A0]">
                Time when incomplete quests transition to penalty
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0D0E14] border border-[#29233A] px-3 py-1.5 rounded-lg text-[#4D8DFF] group-hover:text-white transition-colors">
              <span className="text-xs font-mono font-bold">
                {profile.preferences.dailyResetTime}
              </span>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-[#F5F5F7] uppercase tracking-wide">
            NOTIFICATIONS
          </span>
          <span className="text-[10px] text-[#4D8DFF] uppercase font-semibold">
            TELEMETRY ALERTS
          </span>
        </div>

        <div className="bg-[#14151D] border border-[#29233A] rounded-xl p-2 divide-y divide-[#29233A]/50">
          {[
            {
              key: 'dailyReminder' as const,
              label: 'Daily quest reminder',
              sub: 'Trigger prompt at 08:00 AM',
              icon: 'alarm',
            },
            {
              key: 'deadlineReminder' as const,
              label: 'Deadline reminders',
              sub: 'Warn 2h prior to quest cycle expiry',
              icon: 'hourglass_bottom',
            },
            {
              key: 'levelUp' as const,
              label: 'Level-up notifications',
              sub: 'Broadcast rank promotions & stat boosts',
              icon: 'upgrade',
            },
            {
              key: 'achievementUnlocks' as const,
              label: 'Achievement unlocks',
              sub: 'Alert on milestone and hidden title clears',
              icon: 'military_tech',
            },
          ].map((item) => {
            const isChecked = profile.notifications[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#9290A0] text-[20px]">
                    {item.icon}
                  </span>
                  <div>
                    <span className="text-xs text-[#F5F5F7] font-semibold block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-[#9290A0]">{item.sub}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateNotifications({ [item.key]: !isChecked })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isChecked ? 'bg-[#8B3DFF]' : 'bg-[#2a292e]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isChecked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* APPEARANCE */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-[#F5F5F7] uppercase tracking-wide">
            APPEARANCE
          </span>
          <span className="text-[10px] text-[#9290A0] uppercase font-semibold">
            DISPLAY PROTOCOL
          </span>
        </div>

        <div className="bg-[#14151D] border border-[#29233A] rounded-xl p-2 divide-y divide-[#29233A]/50">
          {/* Dark Theme Locked */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px]">
                dark_mode
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  Dark Theme
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Always Dark (System Monolith Standard)
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#0D0E14] border border-[#29233A] text-[#9290A0] text-[10px] font-bold font-mono uppercase">
              LOCKED
            </span>
          </div>

          {/* Sound FX */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px]">
                volume_up
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  System sound effects
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Haptic chimes upon quest resolution
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateAppearance({ soundEffects: !profile.appearance.soundEffects })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                profile.appearance.soundEffects ? 'bg-[#4D8DFF]' : 'bg-[#2a292e]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profile.appearance.soundEffects ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reduced Animations */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px]">
                motion_photos_off
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  Reduced animations
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Prioritize maximum battery longevity
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateAppearance({ reducedAnimations: !profile.appearance.reducedAnimations })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                profile.appearance.reducedAnimations ? 'bg-[#8B3DFF]' : 'bg-[#2a292e]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profile.appearance.reducedAnimations ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ACCOUNT & DATA */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-[#F5F5F7] uppercase tracking-wide">
            ACCOUNT & DATA
          </span>
          <span className="text-[10px] text-[#9290A0] uppercase font-semibold">
            REPOSITORIES
          </span>
        </div>

        <div className="bg-[#14151D] border border-[#29233A] rounded-xl p-2 divide-y divide-[#29233A]/50">
          <div className="w-full flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px]">
                badge
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  Account Credentials
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  {profile.name.toLowerCase()}@system.internal
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#3DDB8B] font-mono">
              VERIFIED
            </span>
          </div>

          {/* Hidden File Input for Restore */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
            aria-label="Upload JSON backup file"
          />

          {/* Export Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-[#1b1b20] transition-colors rounded-lg group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px] group-hover:text-white transition-colors">
                download
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  Export System Backup
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Download JSON snapshot of profile, quests & achievements
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#4D8DFF] font-mono">
              EXPORT &gt;
            </span>
          </button>

          {/* Restore Backup */}
          <button
            type="button"
            onClick={handleTriggerFilePicker}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-[#1b1b20] transition-colors rounded-lg group"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px] group-hover:text-white transition-colors">
                upload_file
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  Restore System Backup
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Import previous JSON backup to restore progress
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#B45CFF] font-mono">
              RESTORE &gt;
            </span>
          </button>

          {/* Security & Privacy */}
          <div className="w-full flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px]">
                shield
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  Security & Privacy Protocol
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Local-first encrypted data conduit
                </span>
              </div>
            </div>
            <span className="text-xs text-[#9290A0]">&gt;</span>
          </div>

          {/* About Architecture */}
          <div className="w-full flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#9290A0] text-[20px]">
                terminal
              </span>
              <div>
                <span className="text-xs text-[#F5F5F7] font-semibold block">
                  About SYSTEM Architecture
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  v2.4.0 · Build Optimal-2940
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#B45CFF] px-2 py-0.5 rounded bg-[#8B3DFF]/20">
              STABLE
            </span>
          </div>
        </div>

        {/* PROTOTYPE TESTING & SEEDING CONTROLS */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              loadShowcaseState();
              showToast('Loaded Level 17 Vanguard Showcase Profile');
            }}
            className="py-2.5 px-3 rounded-lg bg-[#14151D] border border-[#8B3DFF]/30 text-[#B45CFF] text-[11px] font-bold uppercase tracking-wider hover:bg-[#8B3DFF]/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load LVL 17 State</span>
          </button>

          <button
            type="button"
            onClick={onRestartOnboarding}
            className="py-2.5 px-3 rounded-lg bg-[#14151D] border border-[#4D8DFF]/30 text-[#4D8DFF] text-[11px] font-bold uppercase tracking-wider hover:bg-[#4D8DFF]/20 transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Run Onboarding</span>
          </button>
        </div>

        {/* DESTRUCTIVE ZONE */}
        <div className="pt-2">
          <div className="p-4 rounded-xl bg-[#14151D] border border-[#93000a]/30 flex flex-col space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#93000a]/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px] text-[#FF5263]">
                  warning
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#FF5263] uppercase tracking-wider block">
                  SYSTEM PURGE PROTOCOL
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Irreversibly resets level, stats, quest records, and progression telemetry back to zero.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="w-full h-11 rounded-lg bg-[#0D0E14] hover:bg-[#93000a]/20 border border-[#93000a]/40 text-[#FF5263] text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET PROGRESS</span>
            </button>
          </div>
        </div>
      </div>

      {/* EDIT OPERATOR NAME MODAL */}
      {showEditNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07070B]/80 backdrop-blur-md">
          <div className="bg-[#14151D] border border-[#29233A] rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-[#F5F5F7] uppercase tracking-wide mb-1">
              Recalibrate Operator Ident
            </h3>
            <p className="text-xs text-[#9290A0] mb-4">
              Enter your designated operator callsign for the System matrix.
            </p>

            <input
              type="text"
              maxLength={14}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full h-11 px-3 rounded-lg bg-[#0D0E14] border border-[#29233A] text-base font-bold text-[#F5F5F7] tracking-wider uppercase focus:border-[#8B3DFF] focus:outline-none mb-4"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditNameModal(false)}
                className="flex-1 h-10 rounded-lg bg-[#1b1b20] text-xs font-semibold text-[#9290A0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editedName.trim()) {
                    updateProfileName(editedName);
                    setShowEditNameModal(false);
                    showToast('Operator designation recalibrated');
                  }
                }}
                className="flex-1 h-10 rounded-lg bg-[#8B3DFF] text-xs font-bold text-white uppercase shadow-[0_0_12px_rgba(139,61,255,0.4)]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION PURGE MODAL */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07070B]/85 backdrop-blur-md">
          <div className="bg-[#14151D] border border-[#93000a]/40 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#93000a]/20 flex items-center justify-center text-[#FF5263]">
                <AlertTriangle className="w-5 h-5 text-[#FF5263]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F7]">
                  INITIATE RESET?
                </h3>
                <span className="text-[10px] text-[#FF5263] uppercase font-bold tracking-wider">
                  HIGH SEVERITY ACTION
                </span>
              </div>
            </div>

            <p className="text-xs text-[#9290A0] leading-relaxed">
              This action will wipe operator <strong className="text-white">{profile.name}</strong> back to Level 1, Rank E, and archive all achievements.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="flex-1 h-10 rounded-lg bg-[#1f1f24] hover:bg-[#2a292e] text-[#F5F5F7] text-xs font-bold uppercase transition-colors"
              >
                ABORT
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                className="flex-1 h-10 rounded-lg bg-[#FF5263] text-[#07070B] text-xs font-bold uppercase tracking-wider hover:opacity-90 shadow-[0_0_12px_rgba(255,82,99,0.4)]"
              >
                CONFIRM PURGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION RESTORE MODAL */}
      {showRestoreModal && pendingRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07070B]/85 backdrop-blur-md">
          <div className="bg-[#14151D] border border-[#8B3DFF]/50 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8B3DFF]/20 flex items-center justify-center text-[#B45CFF]">
                <Upload className="w-5 h-5 text-[#B45CFF]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F7]">
                  RESTORE BACKUP?
                </h3>
                <span className="text-[10px] text-[#B45CFF] uppercase font-bold tracking-wider">
                  OVERWRITE CONFIRMATION
                </span>
              </div>
            </div>

            <p className="text-xs text-[#9290A0] leading-relaxed">
              This action will overwrite your current profile, quests, and achievements with the data from the selected backup file.
            </p>

            {/* Backup Snapshot Details */}
            <div className="bg-[#0D0E14] border border-[#29233A] rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[#9290A0]">
                <span>Operator Ident:</span>
                <span className="font-bold text-white uppercase">{pendingRestore.profile.name}</span>
              </div>
              <div className="flex justify-between items-center text-[#9290A0]">
                <span>Rank & Level:</span>
                <span className="font-mono text-[#4D8DFF]">
                  LVL {pendingRestore.profile.level} · RANK {pendingRestore.profile.rank}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#9290A0]">
                <span>Quests / Badges:</span>
                <span className="font-mono text-[#F5F5F7]">
                  {pendingRestore.quests.length} quests · {pendingRestore.achievements.length} achievements
                </span>
              </div>
              <div className="flex justify-between items-center text-[#9290A0]">
                <span>Exported:</span>
                <span className="font-mono text-[10px] text-[#9290A0]">
                  {new Date(pendingRestore.exportTimestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#FF5263]/10 border border-[#FF5263]/30 text-[11px] text-[#FF5263] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Unsaved current progress will be replaced permanently.</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelRestore}
                className="flex-1 h-10 rounded-lg bg-[#1f1f24] hover:bg-[#2a292e] text-[#F5F5F7] text-xs font-bold uppercase transition-colors"
              >
                ABORT
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 h-10 rounded-lg bg-[#8B3DFF] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 shadow-[0_0_12px_rgba(139,61,255,0.4)]"
              >
                CONFIRM RESTORE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07070B]/80 backdrop-blur-md">
          <div className="bg-[#14151D] border border-[#29233A] rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-[#F5F5F7] uppercase tracking-wide mb-1">
              Add Goal Vector
            </h3>
            <p className="text-xs text-[#9290A0] mb-4">
              Designate a new focal vector for daily quest allocation.
            </p>

            <form onSubmit={handleAddCustomGoal} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="e.g. Marathon Training or Quantum Computing"
                value={customGoalName}
                onChange={(e) => setCustomGoalName(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-[#0D0E14] border border-[#29233A] text-sm text-[#F5F5F7] placeholder-[#9290A0]/50 focus:border-[#4D8DFF] focus:outline-none"
              />

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="flex-1 h-10 rounded-lg bg-[#1b1b20] text-xs font-semibold text-[#9290A0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-[#4D8DFF] text-xs font-bold text-[#07070B] uppercase tracking-wider"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
