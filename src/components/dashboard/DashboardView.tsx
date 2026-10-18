import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Quest, SystemEventType } from '../../types';
import { Play, Check, Timer, ArrowRight, ShieldAlert, Sparkles, ChevronRight, Award, Trophy, Skull } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    profile,
    quests,
    openQuestDetail,
    completeQuest,
    triggerSimulationEvent,
  } = useSystem();

  const [showSimMenu, setShowSimMenu] = useState(false);

  // Calculate greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Compute daily quest completion metrics
  const dailyQuests = quests.filter((q) => !q.isBoss);
  const completedCount = dailyQuests.filter((q) => q.status === 'completed').length;
  const totalCount = dailyQuests.length || 5;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const earnedXpToday = dailyQuests
    .filter((q) => q.status === 'completed')
    .reduce((acc, q) => acc + q.xpReward, 0);

  const xpPercentage = Math.min(
    100,
    Number(((profile.currentXp / profile.xpToNextLevel) * 100).toFixed(1))
  );

  const xpRemaining = Math.max(0, profile.xpToNextLevel - profile.currentXp);

  return (
    <div className="flex flex-col w-full pb-8 select-none">
      {/* Top Greeting & Telemetry Header */}
      <header className="flex items-center justify-between py-2 mb-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-bold text-[#F5F5F7] tracking-tight">
            {getGreeting()}, {profile.name.charAt(0) + profile.name.slice(1).toLowerCase()}.
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3DDB8B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3DDB8B] shadow-[0_0_8px_rgba(61,219,139,0.8)]" />
            </span>
            <p className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              System progression protocol is running ·{' '}
              <span className="text-[#3DDB8B]">SYNC OPTIMAL</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0D0E14] border border-[#29233A]">
          <span className="material-symbols-outlined text-[#4D8DFF] text-[14px]">
            sensors
          </span>
          <span className="text-[10px] text-[#9290A0] font-mono font-medium">0.04ms</span>
        </div>
      </header>

      {/* Hero Progression Module */}
      <section className="relative overflow-hidden rounded-xl bg-[#14151D] p-4 border border-[#29233A] shadow-[0_0_28px_rgba(139,61,255,0.18)] mb-3">
        {/* Ambient Energy Flare */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8B3DFF]/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[#B45CFF]/15 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-3">
          {/* Card Sub-header: Level & Rank */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
                Current Vector
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-[#F5F5F7] tracking-tight">
                  LEVEL {profile.level}
                </span>
                <span className="text-[11px] text-[#B45CFF] font-semibold tracking-wider uppercase">
                  {profile.tier}
                </span>
              </div>
            </div>

            {/* Rank Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#8B3DFF]/20 border border-[#8B3DFF]/40 shadow-[0_0_18px_rgba(139,61,255,0.35)]">
              <span className="material-symbols-outlined text-[#B45CFF] text-[18px]">
                workspace_premium
              </span>
              <span className="text-xs text-[#B45CFF] tracking-widest font-bold">
                RANK {profile.rank}
              </span>
            </div>
          </div>

          {/* XP Telemetry Readout */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <div className="flex items-center gap-1 font-mono">
                <span className="text-[#F5F5F7] font-bold">
                  {profile.currentXp.toLocaleString()}
                </span>
                <span className="text-[#9290A0]">
                  / {profile.xpToNextLevel.toLocaleString()} XP
                </span>
                <span className="text-[#9290A0] ml-1">[{xpPercentage}%]</span>
              </div>
              <span className="text-[11px] text-[#B45CFF] font-semibold tracking-wide">
                +{xpRemaining} XP to Level {profile.level + 1}
              </span>
            </div>

            {/* XP Conduit Progress Track */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#0D0E14] p-[1px] border border-[#29233A]">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] transition-all duration-700 ease-out"
                style={{ width: `${Math.max(4, xpPercentage)}%` }}
              >
                {/* Leading Energy Glint */}
                <div className="absolute right-0 top-0 bottom-0 w-2 rounded-full bg-white shadow-[0_0_10px_#FFFFFF,0_0_16px_#B45CFF]" />
              </div>
            </div>
          </div>

          {/* Footer Micro-Telemetry */}
          <div className="flex items-center justify-between pt-1 text-[10px] text-[#9290A0] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#8B3DFF]" />
              Resonance Multiplier:{' '}
              <strong className="text-[#F5F5F7] font-mono">
                {profile.resonanceMultiplier.toFixed(2)}x
              </strong>
            </span>
            <span className="uppercase tracking-widest text-[#4D8DFF] font-semibold">
              TARGET: {profile.targetClass}
            </span>
          </div>
        </div>
      </section>

      {/* Performance Summary Dual Companion Cards */}
      <section className="grid grid-cols-2 gap-2.5 mb-4">
        {/* Companion Card 1: Streak / Momentum */}
        <div className="relative overflow-hidden rounded-xl bg-[#14151D] p-3.5 border border-[#29233A] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              Momentum
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2a292e] text-amber-400">
              <span className="material-symbols-outlined text-[18px]">
                local_fire_department
              </span>
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-[#F5F5F7] leading-tight block">
              {profile.streakDays} Days
            </span>
            <span className="text-xs text-[#9290A0] flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />{' '}
              Active Streak
            </span>
          </div>
        </div>

        {/* Companion Card 2: Objective Pace / Efficiency */}
        <div className="relative overflow-hidden rounded-xl bg-[#14151D] p-3.5 border border-[#29233A] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              Efficiency
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2a292e] text-[#4D8DFF]">
              <span className="material-symbols-outlined text-[18px]">
                task_alt
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#F5F5F7] leading-tight">
                {completedCount} of {totalCount}
              </span>
              <span className="text-xs text-[#9290A0]">Done</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-[#9290A0]">{completionPercentage}% Complete</span>
              <span className="text-[11px] font-bold text-[#3DDB8B] font-mono">
                +{earnedXpToday} XP
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Header: Today's Quests */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4D8DFF] shadow-[0_0_8px_rgba(77,141,255,0.7)]" />
          <h2 className="text-sm font-bold tracking-tight text-[#F5F5F7] uppercase">
            Today's Quests
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#2a292e] text-[10px] font-semibold text-[#9290A0] uppercase tracking-wider">
          {completedCount} / {totalCount} Resolved
        </span>
      </div>

      {/* Quests Stream */}
      <div className="flex flex-col gap-2.5 mb-4">
        {dailyQuests.map((quest) => {
          const isCompleted = quest.status === 'completed';
          const isRare = quest.isRare;

          return (
            <article
              key={quest.id}
              onClick={() => openQuestDetail(quest.id)}
              className={`relative flex items-center justify-between rounded-lg p-3.5 border transition-all cursor-pointer active:scale-[0.99] ${
                isCompleted
                  ? 'bg-[#14151D]/70 border-[#29233A] opacity-75'
                  : isRare
                  ? 'bg-[#14151D] border-[#8B3DFF]/40 shadow-[0_0_18px_rgba(139,61,255,0.18)] hover:border-[#8B3DFF]'
                  : 'bg-[#14151D] border-[#29233A] hover:border-[#4D8DFF]/60'
              }`}
            >
              {/* Left Accent Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 rounded-l ${
                  isCompleted
                    ? 'bg-[#3DDB8B]'
                    : isRare
                    ? 'bg-[#B45CFF] shadow-[0_0_8px_#B45CFF]'
                    : 'bg-[#4D8DFF]'
                }`}
              />

              {/* Main Content Area */}
              <div className="flex items-start gap-3 min-w-0 pl-1">
                {/* Status Toggle Checkbox */}
                <button
                  type="button"
                  aria-label={isCompleted ? 'Mark Incomplete' : 'Complete Quest'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCompleted) {
                      completeQuest(quest.id);
                    }
                  }}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors focus:outline-none ${
                    isCompleted
                      ? 'bg-[#3DDB8B] text-[#07070B] shadow-[0_0_8px_rgba(61,219,139,0.5)]'
                      : 'bg-[#0D0E14] border border-[#29233A] text-transparent hover:border-[#4D8DFF]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] font-bold">
                    check
                  </span>
                </button>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 ${
                        isCompleted
                          ? 'text-[#3DDB8B]'
                          : isRare
                          ? 'text-[#B45CFF]'
                          : 'text-[#4D8DFF]'
                      }`}
                    >
                      {isRare && (
                        <span className="material-symbols-outlined text-[12px]">
                          auto_awesome
                        </span>
                      )}
                      [{quest.category}]
                    </span>
                    <span className="text-[10px] text-[#9290A0]">
                      · {quest.categoryLabel}
                    </span>
                  </div>

                  <p
                    className={`text-sm font-medium truncate ${
                      isCompleted ? 'line-through text-[#9290A0]' : 'text-[#F5F5F7]'
                    }`}
                  >
                    {quest.title}
                  </p>

                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#9290A0]">
                      {quest.subtitle}
                    </span>
                    {quest.statRewards && Object.entries(quest.statRewards).map(([key, val]) => (
                      <span
                        key={key}
                        className="px-1.5 py-0.2 rounded bg-[#8B3DFF]/20 text-[9px] font-bold text-[#B45CFF]"
                      >
                        +{val} {key}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Action / XP Badge */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold font-mono tracking-wider ${
                    isCompleted
                      ? 'bg-[#2a292e] text-[#3DDB8B]'
                      : isRare
                      ? 'bg-[#8B3DFF]/20 text-[#B45CFF]'
                      : 'bg-[#0361d1]/20 text-[#4D8DFF]'
                  }`}
                >
                  +{quest.xpReward} XP
                </span>

                {isCompleted ? (
                  <span className="material-symbols-outlined text-[#3DDB8B] text-[20px]">
                    verified
                  </span>
                ) : isRare ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br from-[#8B3DFF] to-[#B45CFF] text-white shadow-[0_0_12px_rgba(139,61,255,0.4)]">
                    <span className="material-symbols-outlined text-[18px]">
                      arrow_forward
                    </span>
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded bg-[#4D8DFF] text-[#07070B] shadow-[0_0_12px_rgba(77,141,255,0.3)] hover:bg-[#F5F5F7] transition-colors">
                    <span className="material-symbols-outlined text-[18px]">
                      play_arrow
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Daily System Notice Warning Box */}
      <aside className="relative flex items-center gap-3 rounded-lg bg-[#93000a]/20 border border-[#93000a]/40 p-3.5 mb-4 text-[#FF5263]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#93000a]/40 text-[#FF5263]">
          <span className="material-symbols-outlined text-[20px]">warning</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-widest font-bold">
            Protocol Strict Notice
          </span>
          <p className="text-xs text-[#FF5263]/90 leading-tight mt-0.5">
            Incomplete directives at cycle reset trigger an automated penalty (-50 XP deduction).
          </p>
        </div>
      </aside>

      {/* Interactive System Event Simulation Trigger */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowSimMenu(!showSimMenu)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#1b1b20] hover:bg-[#1f1f24] border border-[#29233A] transition-colors shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#8B3DFF]/20 text-[#B45CFF] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">
                upgrade
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
                Simulation Mode
              </span>
              <span className="text-xs text-[#F5F5F7] font-bold">
                Preview Level Up Awakening
              </span>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-[#9290A0] group-hover:text-[#B45CFF] transition-transform ${showSimMenu ? 'rotate-90' : ''}`} />
        </button>

        {/* Expandable Menu for all 6 System Event Overlays */}
        {showSimMenu && (
          <div className="p-3 bg-[#0D0E14] rounded-xl border border-[#29233A] grid grid-cols-2 gap-2 animate-fadeIn">
            <button
              type="button"
              onClick={() => triggerSimulationEvent('LEVEL_UP')}
              className="p-2.5 rounded-lg bg-[#14151D] hover:bg-[#8B3DFF]/20 border border-[#8B3DFF]/30 text-left flex items-center gap-2 text-xs font-semibold text-[#F5F5F7] transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#B45CFF]" />
              <span>Level Up (LVL 18)</span>
            </button>
            <button
              type="button"
              onClick={() => triggerSimulationEvent('RANK_UP')}
              className="p-2.5 rounded-lg bg-[#14151D] hover:bg-[#8B3DFF]/20 border border-[#8B3DFF]/30 text-left flex items-center gap-2 text-xs font-semibold text-[#F5F5F7] transition-all"
            >
              <Award className="w-4 h-4 text-[#B45CFF]" />
              <span>Rank Up (RANK C)</span>
            </button>
            <button
              type="button"
              onClick={() => triggerSimulationEvent('BOSS_DEFEATED')}
              className="p-2.5 rounded-lg bg-[#14151D] hover:bg-[#8B3DFF]/20 border border-[#8B3DFF]/30 text-left flex items-center gap-2 text-xs font-semibold text-[#F5F5F7] transition-all"
            >
              <Trophy className="w-4 h-4 text-[#3DDB8B]" />
              <span>Boss Defeated (10K)</span>
            </button>
            <button
              type="button"
              onClick={() => triggerSimulationEvent('QUEST_FAILED')}
              className="p-2.5 rounded-lg bg-[#14151D] hover:bg-[#93000a]/20 border border-[#93000a]/30 text-left flex items-center gap-2 text-xs font-semibold text-[#FF5263] transition-all"
            >
              <Skull className="w-4 h-4 text-[#FF5263]" />
              <span>Quest Failed (-50 XP)</span>
            </button>
            <button
              type="button"
              onClick={() => triggerSimulationEvent('QUEST_COMPLETE')}
              className="p-2.5 rounded-lg bg-[#14151D] hover:bg-[#3DDB8B]/20 border border-[#3DDB8B]/30 text-left flex items-center gap-2 text-xs font-semibold text-[#3DDB8B] transition-all"
            >
              <Check className="w-4 h-4 text-[#3DDB8B]" />
              <span>Quest Complete</span>
            </button>
            <button
              type="button"
              onClick={() => triggerSimulationEvent('ACHIEVEMENT_UNLOCKED')}
              className="p-2.5 rounded-lg bg-[#14151D] hover:bg-[#4D8DFF]/20 border border-[#4D8DFF]/30 text-left flex items-center gap-2 text-xs font-semibold text-[#4D8DFF] transition-all"
            >
              <Award className="w-4 h-4 text-[#4D8DFF]" />
              <span>Achievement Unlock</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
