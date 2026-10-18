import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { AttributeKey } from '../../types';
import { ATTRIBUTE_DEFINITIONS } from '../../game/progression';
import { Plus, Award, ChevronRight, Zap } from 'lucide-react';

export const StatsView: React.FC<{ onOpenAchievements?: () => void }> = ({ onOpenAchievements }) => {
  const { profile, allocateAttribute } = useSystem();

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(5); // Default to SAT (index 5)

  const selectedRecord = profile.history[selectedDayIdx] || profile.history[profile.history.length - 1];

  const maxHistoryXp = Math.max(...profile.history.map((h) => h.xp), 900);

  const attributeKeys: AttributeKey[] = ['STR', 'VIT', 'INT', 'FOC', 'DISC', 'SOC'];

  const xpPercentage = Math.min(
    100,
    Number(((profile.currentXp / profile.xpToNextLevel) * 100).toFixed(1))
  );

  return (
    <div className="flex flex-col w-full pb-8 select-none animate-fadeIn">
      {/* Top Header Breadcrumb */}
      <div className="flex items-center justify-between py-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0D0E14] border border-[#29233A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D8DFF] animate-pulse" />
            <span className="text-[10px] font-bold text-[#9290A0] uppercase tracking-wider">
              SYSTEM
            </span>
          </div>
          <span className="text-[#9290A0] text-xs">/</span>
          <h1 className="text-sm font-bold text-[#F5F5F7] uppercase tracking-wider">
            Stats
          </h1>
        </div>

        {onOpenAchievements && (
          <button
            type="button"
            onClick={onOpenAchievements}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14151D] border border-[#8B3DFF]/30 text-xs font-bold text-[#B45CFF] hover:bg-[#8B3DFF]/20 transition-all"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Achievements</span>
          </button>
        )}
      </div>

      {/* Hero Player Card */}
      <section className="relative overflow-hidden rounded-xl bg-[#14151D] p-5 border border-[#29233A] shadow-lg mb-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              Player
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#F5F5F7] uppercase mt-0.5">
              {profile.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded bg-[#1f1f24] text-xs font-bold text-[#F5F5F7] tracking-wider font-mono">
              LEVEL {profile.level}
            </span>
            <span className="px-2.5 py-1 rounded bg-[#8B3DFF]/20 border border-[#8B3DFF]/40 text-xs font-bold text-[#B45CFF] tracking-wider">
              RANK {profile.rank}
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-mono text-[#F5F5F7] font-bold">
              {profile.currentXp.toLocaleString()} / {profile.xpToNextLevel.toLocaleString()} XP
            </span>
            <span className="text-[11px] text-[#B45CFF] font-semibold">
              +{Math.max(0, profile.xpToNextLevel - profile.currentXp)} XP to Level {profile.level + 1}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#0D0E14] overflow-hidden p-[1px] border border-[#29233A]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] transition-all duration-500"
              style={{ width: `${Math.max(4, xpPercentage)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Unallocated Points Alert */}
      {profile.unallocatedPoints > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-[#8B3DFF]/25 to-[#B45CFF]/20 border border-[#B45CFF]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#B45CFF] animate-bounce" />
            <span className="text-xs font-bold text-[#F5F5F7]">
              {profile.unallocatedPoints} Attribute Point{profile.unallocatedPoints > 1 ? 's' : ''} Available
            </span>
          </div>
          <span className="text-[10px] text-[#B45CFF] font-semibold uppercase tracking-wider">
            Upgrade below
          </span>
        </div>
      )}

      {/* ATTRIBUTES Matrix */}
      <section className="flex flex-col gap-2.5 mb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#9290A0] px-1">
          ATTRIBUTES
        </span>

        <div className="bg-[#14151D] rounded-xl border border-[#29233A] p-2 divide-y divide-[#29233A]/40">
          {attributeKeys.map((key) => {
            const def = ATTRIBUTE_DEFINITIONS[key];
            const val = profile.attributes[key] || 10;
            const maxStat = 100;
            const statPct = Math.min(100, Math.round((val / maxStat) * 100));

            return (
              <div key={key} className="py-2.5 px-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono tracking-wider text-[#F5F5F7]">
                      {def.name}
                    </span>
                    <span className="text-xs text-[#9290A0]">
                      {def.fullName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-[#F5F5F7]">
                      {val}
                    </span>
                    {profile.unallocatedPoints > 0 && (
                      <button
                        type="button"
                        onClick={() => allocateAttribute(key)}
                        className="w-5 h-5 rounded bg-[#8B3DFF] hover:bg-[#B45CFF] text-white flex items-center justify-center transition-all active:scale-90"
                        title={`Add 1 point to ${def.fullName}`}
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stat Bar */}
                <div className="w-full h-1.5 rounded-full bg-[#0D0E14] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF]"
                    style={{ width: `${statPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROGRESSION SUMMARY */}
      <section className="flex flex-col gap-2.5 mb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#9290A0] px-1">
          PROGRESSION SUMMARY
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-4 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              Quests Completed
            </span>
            <span className="text-2xl font-bold font-mono text-[#F5F5F7] mt-1">
              {profile.totalQuestsCompleted}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              Completion Rate
            </span>
            <span className="text-2xl font-bold font-mono text-[#3DDB8B] mt-1">
              {profile.streakDays > 0 ? '83%' : '0%'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              Current Streak
            </span>
            <span className="text-xl font-bold text-[#F5F5F7] flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-amber-400 text-[20px]">
                local_fire_department
              </span>
              {profile.streakDays} DAYS
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
              Total XP
            </span>
            <span className="text-2xl font-bold font-mono text-[#B45CFF] mt-1">
              {profile.totalXp.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* XP EARNED (Past 7 days) Chart */}
      <section className="p-4 rounded-xl bg-[#14151D] border border-[#29233A]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
            XP Earned
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
            Past 7 days
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xs font-semibold text-[#F5F5F7]">
            {selectedRecord.fullDay}
          </span>
          <span className="text-sm font-mono font-bold text-[#B45CFF]">
            {selectedRecord.xp} XP
          </span>
        </div>

        {/* Bar Chart Columns */}
        <div className="flex items-end justify-between h-28 gap-2 pt-2 px-1">
          {profile.history.map((record, idx) => {
            const isSelected = selectedDayIdx === idx;
            const barHeightPct = Math.max(12, Math.round((record.xp / maxHistoryXp) * 100));

            return (
              <div
                key={record.day}
                onClick={() => setSelectedDayIdx(idx)}
                className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-full flex items-end justify-center h-20">
                  <div
                    className={`w-full max-w-[28px] rounded-t transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-t from-[#8B3DFF] to-[#B45CFF] shadow-[0_0_14px_rgba(180,92,255,0.7)]'
                        : 'bg-[#2a292e] group-hover:bg-[#353439]'
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-mono tracking-wider ${
                    isSelected ? 'text-white font-bold' : 'text-[#9290A0]'
                  }`}
                >
                  {record.day}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
