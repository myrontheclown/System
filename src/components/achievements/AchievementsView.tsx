import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { ArrowLeft, Lock, CheckCircle2, Award, Sparkles } from 'lucide-react';

export const AchievementsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { profile, achievements } = useSystem();

  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const lockedCount = achievements.filter((a) => !a.unlocked).length;
  const totalCount = achievements.length;

  const unlockedPercentage = Math.round((unlockedCount / totalCount) * 100);

  const filteredList = achievements.filter((a) => {
    if (filter === 'UNLOCKED') return a.unlocked;
    if (filter === 'LOCKED') return !a.unlocked;
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-8 select-none animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 py-2 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#9290A0] hover:text-[#F5F5F7] font-semibold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Stats</span>
        </button>
      </div>

      {/* Main Title & Operator Info */}
      <div className="flex items-baseline justify-between mb-3">
        <h1 className="text-2xl font-bold tracking-tight text-[#F5F5F7] uppercase">
          ACHIEVEMENTS
        </h1>
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <span className="text-[#9290A0]">{profile.name}</span>
          <span className="text-[#9290A0]">·</span>
          <span className="text-[#B45CFF] font-bold">LVL {profile.level}</span>
          <span className="text-[#9290A0]">·</span>
          <span className="text-[#4D8DFF] font-bold">RANK {profile.rank}</span>
        </div>
      </div>

      {/* Unlock Ratio Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-[#1b1b20] overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF]"
          style={{ width: `${unlockedPercentage}%` }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#14151D] border border-[#29233A] rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'ALL'
              ? 'bg-[#1b1b20] text-[#F5F5F7] shadow'
              : 'text-[#9290A0] hover:text-white'
          }`}
        >
          ALL ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNLOCKED')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'UNLOCKED'
              ? 'bg-[#1b1b20] text-[#B45CFF] shadow'
              : 'text-[#9290A0] hover:text-white'
          }`}
        >
          UNLOCKED ({unlockedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('LOCKED')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'LOCKED'
              ? 'bg-[#1b1b20] text-[#F5F5F7] shadow'
              : 'text-[#9290A0] hover:text-white'
          }`}
        >
          LOCKED ({lockedCount})
        </button>
      </div>

      {/* Achievements List */}
      <div className="flex flex-col gap-3">
        {filteredList.map((item) => {
          if (item.unlocked) {
            return (
              <div
                key={item.id}
                className="relative rounded-xl bg-[#14151D] border border-[#8B3DFF]/40 p-4 shadow-[0_0_20px_rgba(139,61,255,0.14)]"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B45CFF]">
                    <span>◇</span>
                    <span>{item.tierLabel}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#8B3DFF]/20 text-[10px] font-bold font-mono text-[#B45CFF]">
                    +{item.xpReward} XP
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <h3 className="text-base font-bold tracking-tight text-[#F5F5F7]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#9290A0] mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#8B3DFF]/20 flex items-center justify-center text-[#B45CFF] shrink-0">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#29233A]/60 pt-2.5 mt-3 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3DDB8B] shadow-[0_0_6px_#3DDB8B]" />
                    <span className="text-[#3DDB8B] font-bold tracking-wider uppercase">
                      RECORDED
                    </span>
                  </div>
                  <span className="text-[#9290A0] font-mono">
                    {item.unlockedDate || '07.10.2026'}
                  </span>
                </div>
              </div>
            );
          }

          // Locked achievement card
          return (
            <div
              key={item.id}
              className="rounded-xl bg-[#14151D]/60 border border-[#29233A] p-4 opacity-75"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#9290A0]">
                  <Lock className="w-3.5 h-3.5 text-[#9290A0]" />
                  <span className="text-[#F5F5F7] font-bold">{item.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#1f1f24] text-[10px] font-bold font-mono text-[#9290A0]">
                  +{item.xpReward} XP
                </span>
              </div>

              <p className="text-xs text-[#9290A0] mt-0.5">{item.description}</p>

              {item.progress && (
                <div className="flex items-center justify-end mt-2">
                  <span className="text-xs font-mono font-semibold text-[#9290A0]">
                    {item.progress.current} / {item.progress.max}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
