import React, { useEffect, useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { AttributeKey } from '../../types';
import { ArrowLeft, Check, AlertCircle, Play, CheckCircle2 } from 'lucide-react';
import { formatTimeRemaining } from '../../game/progression';

export const QuestDetailView: React.FC = () => {
  const {
    quests,
    selectedQuestId,
    closeQuestDetail,
    toggleObjective,
    completeQuest,
    failQuest,
    startQuest,
  } = useSystem();

  const quest = quests.find((q) => q.id === selectedQuestId);

  // Live countdown state
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (!quest) return 4 * 3600 + 17 * 60 + 26;
    const diff = Math.floor((quest.deadlineTimestamp - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-[#9290A0]">Directive not found.</p>
        <button
          type="button"
          onClick={closeQuestDetail}
          className="mt-4 px-4 py-2 bg-[#14151D] border border-[#29233A] rounded-lg text-xs font-semibold"
        >
          Return to Matrix
        </button>
      </div>
    );
  }

  const completedObjectivesCount = quest.objectives.filter((o) => o.completed).length;
  const totalObjectivesCount = quest.objectives.length;
  const isCompleted = quest.status === 'completed';
  const isFailed = quest.status === 'failed';
  const isReadyToComplete = completedObjectivesCount === totalObjectivesCount;

  return (
    <div className="flex flex-col w-full pb-10 select-none animate-fadeIn">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between py-2 mb-4">
        <button
          type="button"
          onClick={closeQuestDetail}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#14151D] border border-[#29233A] text-[#F5F5F7] hover:bg-[#1b1b20] active:scale-95 transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#F5F5F7]" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D0E14] border border-[#29233A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8B3DFF] shadow-[0_0_8px_#8B3DFF]" />
          <span className="text-[10px] tracking-widest uppercase font-bold text-[#9290A0]">
            SYSTEM
          </span>
        </div>
      </div>

      {/* Category & Status Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold tracking-widest uppercase text-[#9290A0]">
          {quest.category}
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${
            isCompleted
              ? 'bg-[#3DDB8B]/20 text-[#3DDB8B] border border-[#3DDB8B]/40'
              : isFailed
              ? 'bg-[#93000a]/20 text-[#FF5263] border border-[#93000a]/40'
              : 'bg-[#8B3DFF]/20 text-[#B45CFF] border border-[#8B3DFF]/40'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isCompleted
                ? 'bg-[#3DDB8B]'
                : isFailed
                ? 'bg-[#FF5263]'
                : 'bg-[#B45CFF] animate-pulse'
            }`}
          />
          {isCompleted
            ? 'Completed'
            : isFailed
            ? 'Failed'
            : quest.status === 'active'
            ? 'Active Quest'
            : 'Available'}
        </span>
      </div>

      {/* Quest Title & Description */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F5F7] tracking-tight leading-tight mb-2">
        {quest.title}
      </h1>
      <p className="text-sm text-[#9290A0] leading-relaxed mb-6">
        {quest.description}
      </p>

      {/* Objectives Section */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between border-b border-[#29233A] pb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#9290A0]">
            OBJECTIVES
          </span>
          <span className="text-xs font-mono font-semibold text-[#F5F5F7]">
            {completedObjectivesCount} / {totalObjectivesCount}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {quest.objectives.map((obj) => (
            <div
              key={obj.id}
              onClick={() => {
                if (!isCompleted && !isFailed) {
                  toggleObjective(quest.id, obj.id);
                }
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                obj.completed
                  ? 'bg-[#14151D]/80 border-[#3DDB8B]/30'
                  : 'bg-[#14151D] border-[#29233A] hover:border-[#4D8DFF]/50'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    obj.completed
                      ? 'bg-[#3DDB8B] text-[#07070B] shadow-[0_0_8px_rgba(61,219,139,0.5)]'
                      : 'border-2 border-[#9290A0]/40 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-sm font-semibold truncate ${
                      obj.completed ? 'text-[#F5F5F7]' : 'text-[#F5F5F7]'
                    }`}
                  >
                    {obj.text}
                  </span>
                  <span className="text-xs text-[#9290A0] mt-0.5">
                    {obj.note}
                  </span>
                </div>
              </div>

              <span
                className={`text-xs font-mono shrink-0 font-medium ${
                  obj.completed ? 'text-[#3DDB8B]' : 'text-[#9290A0]'
                }`}
              >
                {obj.current} / {obj.target} {obj.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards Section */}
      <div className="flex flex-col gap-2.5 mb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#9290A0]">
          REWARDS
        </span>
        <div className="grid grid-cols-3 gap-2">
          {/* XP Reward */}
          <div className="p-3 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col items-center justify-center text-center">
            <span className="text-base font-bold text-[#B45CFF] font-mono">
              +{quest.xpReward} XP
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#9290A0] mt-0.5">
              Account
            </span>
          </div>

          {/* Stat Rewards */}
          {quest.statRewards &&
            Object.entries(quest.statRewards).map(([key, val]) => (
              <div
                key={key}
                className="p-3 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col items-center justify-center text-center"
              >
                <span className="text-base font-bold text-[#F5F5F7] font-mono">
                  +{val} {key}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#9290A0] mt-0.5">
                  {key === 'STR'
                    ? 'Strength'
                    : key === 'VIT'
                    ? 'Vitality'
                    : key === 'INT'
                    ? 'Intelligence'
                    : key === 'FOC'
                    ? 'Focus'
                    : key === 'DISC'
                    ? 'Discipline'
                    : 'Social'}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Penalty Warning Box */}
      <div className="p-3.5 rounded-xl bg-[#93000a]/15 border border-[#93000a]/30 flex items-start gap-3 mb-6">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[#FF5263] shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4 text-[#FF5263]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#FF5263] uppercase tracking-wider">
            PENALTY -{quest.penaltyXp} XP
          </span>
          <p className="text-xs text-[#FF5263]/90 mt-0.5 leading-relaxed">
            Failure to complete the quest before the deadline will reduce your XP by {quest.penaltyXp}.
          </p>
        </div>
      </div>

      {/* Deadline & Live Time Remaining */}
      <div className="flex items-center justify-between border-t border-[#29233A] pt-4 mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
            DEADLINE
          </span>
          <span className="text-sm font-semibold text-[#F5F5F7] mt-0.5">
            {quest.deadlineTime}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
            TIME REMAINING
          </span>
          <span className="text-sm font-mono font-bold text-[#4D8DFF] mt-0.5">
            {formatTimeRemaining(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-col gap-2 mt-auto">
        {isCompleted ? (
          <div className="w-full h-12 rounded-xl bg-[#3DDB8B]/20 border border-[#3DDB8B]/40 flex items-center justify-center gap-2 text-sm font-bold text-[#3DDB8B]">
            <CheckCircle2 className="w-5 h-5 text-[#3DDB8B]" />
            <span>DIRECTIVE RESOLVED</span>
          </div>
        ) : isFailed ? (
          <div className="w-full h-12 rounded-xl bg-[#93000a]/20 border border-[#93000a]/40 flex items-center justify-center gap-2 text-sm font-bold text-[#FF5263]">
            <span>PENALTY RECORDED (-{quest.penaltyXp} XP)</span>
          </div>
        ) : isReadyToComplete ? (
          <button
            type="button"
            onClick={() => completeQuest(quest.id)}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-[#F5F5F7] text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(139,61,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 text-white" />
            <span>CLAIM XP & REWARDS</span>
          </button>
        ) : quest.status === 'available' ? (
          <button
            type="button"
            onClick={() => startQuest(quest.id)}
            className="w-full h-12 rounded-xl bg-[#4D8DFF] text-[#07070B] text-sm font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(77,141,255,0.35)] hover:bg-[#F5F5F7] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>INITIALIZE QUEST</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              // Complete current quest
              completeQuest(quest.id);
            }}
            className="w-full h-12 rounded-xl bg-[#4D8DFF] text-[#07070B] text-sm font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(77,141,255,0.35)] hover:bg-[#F5F5F7] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>CONTINUE QUEST</span>
          </button>
        )}

        {/* Forfeit / Test Failure Button if quest is active */}
        {!isCompleted && !isFailed && (
          <button
            type="button"
            onClick={() => failQuest(quest.id)}
            className="w-full py-2.5 text-xs text-[#9290A0] hover:text-[#FF5263] uppercase tracking-wider font-semibold transition-colors text-center"
          >
            Forfeit Directive (Trigger -50 XP Penalty)
          </button>
        )}
      </div>
    </div>
  );
};
