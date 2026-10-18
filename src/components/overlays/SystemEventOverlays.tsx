import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { AttributeKey } from '../../types';
import { ATTRIBUTE_DEFINITIONS } from '../../game/progression';
import { ArrowRight, Check, Trophy, AlertTriangle, Sparkles, Award } from 'lucide-react';

export const SystemEventOverlays: React.FC = () => {
  const { systemEvent, closeSystemEvent, allocateAttribute, profile } = useSystem();
  const [allocatedStat, setAllocatedStat] = useState<AttributeKey | null>(null);

  if (!systemEvent || !systemEvent.type) return null;

  const handleAllocateInModal = (key: AttributeKey) => {
    allocateAttribute(key);
    setAllocatedStat(key);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07070B]/85 backdrop-blur-md animate-fadeIn select-none">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute w-[360px] h-[360px] rounded-full bg-[#8B3DFF]/20 blur-3xl animate-pulse" />

      {/* OVERLAY 1: LEVEL UP (Matches Image 9) */}
      {systemEvent.type === 'LEVEL_UP' && (
        <div className="relative w-full max-w-sm rounded-2xl bg-[#0D0E14] border border-[#8B3DFF]/40 p-6 shadow-[0_0_50px_rgba(139,61,255,0.45)] flex flex-col items-center text-center overflow-hidden animate-scaleUp">
          {/* Subtle concentric background lines */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-64 h-64 rounded-full border border-[#8B3DFF]/30" />
            <div className="w-48 h-48 rounded-full border border-[#B45CFF]/30" />
            <div className="w-32 h-32 rounded-full border border-[#8B3DFF]/40" />
          </div>

          <span className="text-[10px] uppercase tracking-[0.25em] text-[#9290A0] font-bold mb-1">
            SYSTEM
          </span>
          <h2 className="text-xs uppercase tracking-widest text-[#B45CFF] font-bold mb-4">
            LEVEL UP
          </h2>

          {/* Giant Level Number */}
          <div className="relative my-2">
            <span className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_35px_rgba(180,92,255,0.8)]">
              {systemEvent.levelReached || profile.level}
            </span>
          </div>

          <span className="text-xs uppercase tracking-widest text-[#F5F5F7] font-bold mt-2 mb-4">
            NEW LEVEL REACHED
          </span>

          <div className="flex items-center justify-between w-full px-4 py-2 rounded-lg bg-[#14151D] border border-[#29233A] mb-5 text-xs font-mono">
            <span className="text-[#9290A0] uppercase font-bold tracking-wider">
              Next Level
            </span>
            <span className="text-[#F5F5F7] font-bold">
              0 / {profile.xpToNextLevel.toLocaleString()} XP
            </span>
          </div>

          {/* +1 Attribute Point Selection */}
          <div className="w-full bg-[#14151D] border border-[#8B3DFF]/40 rounded-xl p-3.5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-5 w-5 rounded-full bg-[#8B3DFF] items-center justify-center text-white text-xs font-bold">
                +
              </span>
              <div>
                <span className="text-xs font-bold text-[#F5F5F7] block">
                  +1 ATTRIBUTE POINT
                </span>
                <span className="text-[11px] text-[#9290A0]">
                  Choose an attribute to improve:
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {(['STR', 'VIT', 'INT', 'FOC', 'DISC', 'SOC'] as AttributeKey[]).map((key) => {
                const isChosen = allocatedStat === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAllocateInModal(key)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1 ${
                      isChosen
                        ? 'bg-[#3DDB8B] text-[#07070B] shadow-[0_0_8px_#3DDB8B]'
                        : 'bg-[#0D0E14] border border-[#29233A] text-[#F5F5F7] hover:border-[#8B3DFF]'
                    }`}
                  >
                    <span>+{key}</span>
                    {isChosen && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={closeSystemEvent}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-[#F5F5F7] text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(139,61,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>CONTINUE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OVERLAY 2: RANK UP (Matches Image 15) */}
      {systemEvent.type === 'RANK_UP' && (
        <div className="relative w-full max-w-sm rounded-2xl bg-[#0D0E14] border border-[#8B3DFF]/40 p-6 shadow-[0_0_50px_rgba(139,61,255,0.45)] flex flex-col items-center text-center overflow-hidden animate-scaleUp">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#9290A0] font-bold mb-1">
            SYSTEM
          </span>
          <h2 className="text-xs uppercase tracking-widest text-[#B45CFF] font-bold mb-4">
            RANK UP
          </h2>

          {/* Giant Rank Letter */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-[#8B3DFF]/40 flex items-center justify-center shadow-[0_0_30px_rgba(139,61,255,0.3)]">
              <span className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_35px_rgba(180,92,255,0.9)]">
                {systemEvent.newRank || 'C'}
              </span>
            </div>
          </div>

          <span className="text-xs uppercase tracking-widest text-[#F5F5F7] font-bold mb-5">
            NEW RANK ACHIEVED
          </span>

          <div className="w-full text-left mb-6 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B45CFF] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45CFF]" />
              NEW FEATURES UNLOCKED
            </span>

            <div className="p-3 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
              <span className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                <span className="text-[#B45CFF]">◆</span> SPECIAL QUESTS
              </span>
              <span className="text-[11px] text-[#9290A0] mt-0.5">
                Unlock new quest types and challenges.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
              <span className="text-xs font-bold text-[#F5F5F7] flex items-center gap-1.5">
                <span className="text-[#B45CFF]">◆</span> ADVANCED REWARDS
              </span>
              <span className="text-[11px] text-[#9290A0] mt-0.5">
                Higher-value rewards become available.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSystemEvent}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-[#F5F5F7] text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(139,61,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>CONTINUE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* OVERLAY 3: BOSS DEFEATED (Matches Image 17) */}
      {systemEvent.type === 'BOSS_DEFEATED' && (
        <div className="relative w-full max-w-sm rounded-2xl bg-[#0D0E14] border border-[#8B3DFF]/60 p-6 shadow-[0_0_55px_rgba(139,61,255,0.5)] flex flex-col items-center text-center overflow-hidden animate-scaleUp">
          <header className="flex flex-col items-center text-center mb-4">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#9290A0] font-bold mb-1">
              SYSTEM
            </span>
            <h1 className="text-xl font-bold tracking-[0.15em] text-[#F5F5F7] drop-shadow-[0_0_14px_rgba(212,187,255,0.4)] uppercase">
              BOSS DEFEATED
            </h1>
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#8B3DFF] to-transparent mt-1" />
          </header>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1f1f24] border border-[#B45CFF]/30 shadow-[0_0_16px_rgba(139,61,255,0.3)] mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B45CFF] animate-ping" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#dfb7ff] font-bold">
              VICTORY
            </span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#F5F5F7] drop-shadow-[0_0_24px_rgba(216,180,255,0.45)] mb-1">
            {systemEvent.bossReward?.title || 'THE 10K'}
          </h2>
          <p className="text-xs text-[#9290A0] max-w-xs mb-5">
            {systemEvent.bossReward?.description || 'Complete a 10 km run.'}
          </p>

          <div className="flex flex-col gap-2.5 w-full mb-6">
            <div className="relative bg-[#14151D] rounded-xl p-3.5 border border-[#29233A] flex items-center justify-between overflow-hidden text-left">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#8B3DFF] via-[#B45CFF] to-[#dfb7ff]" />
              <div className="flex flex-col pl-1">
                <span className="text-[9px] uppercase tracking-wider text-[#9290A0] font-semibold">
                  EXPERIENCE GAIN
                </span>
                <span className="text-xl font-bold text-[#F5F5F7] font-mono">
                  +{systemEvent.bossReward?.xp || 1500}{' '}
                  <span className="text-xs text-[#dfb7ff] font-bold">XP</span>
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-wider text-[#9290A0] font-semibold">
                  STAT MATRIX
                </span>
                <span className="text-base font-bold text-[#B45CFF] font-mono">
                  {systemEvent.bossReward?.statGain || '+10 VIT'}
                </span>
              </div>
            </div>

            <div className="bg-[#1f1f24]/80 rounded-xl p-3 border border-[#8B3DFF]/30 flex items-start gap-3 text-left">
              <div className="w-7 h-7 rounded-lg bg-[#2a292e] border border-[#B45CFF]/40 flex items-center justify-center shrink-0 text-[#dfb7ff]">
                <span>◆</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5F5F7]">
                  SPECIAL REWARD UNLOCKED
                </span>
                <p className="text-xs text-[#9290A0] mt-0.5 truncate">
                  {systemEvent.bossReward?.specialUnlock ||
                    'Title: Endurance Sovereign + Special Quest Line'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSystemEvent}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-[#F5F5F7] text-sm font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(139,61,255,0.45)] hover:shadow-[0_0_32px_rgba(180,92,255,0.7)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>[ CLAIM REWARDS → ]</span>
          </button>
        </div>
      )}

      {/* OVERLAY 4: QUEST COMPLETE */}
      {systemEvent.type === 'QUEST_COMPLETE' && (
        <div className="relative w-full max-w-sm rounded-2xl bg-[#0D0E14] border border-[#3DDB8B]/40 p-6 shadow-[0_0_40px_rgba(61,219,139,0.3)] flex flex-col items-center text-center overflow-hidden animate-scaleUp">
          <div className="w-14 h-14 rounded-full bg-[#3DDB8B]/20 border border-[#3DDB8B]/40 flex items-center justify-center text-[#3DDB8B] mb-3 shadow-[0_0_20px_rgba(61,219,139,0.4)]">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>

          <span className="text-[10px] uppercase tracking-widest text-[#3DDB8B] font-bold mb-1">
            System Directive Cleared
          </span>
          <h2 className="text-xl font-bold text-[#F5F5F7] tracking-tight mb-1">
            {systemEvent.quest?.title || 'PROTOCOL RESOLVED'}
          </h2>
          <p className="text-xs text-[#9290A0] mb-5">
            Parameters confirmed. Telemetry updated in player core matrix.
          </p>

          <div className="w-full grid grid-cols-2 gap-2 mb-6">
            <div className="p-3 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[#9290A0]">
                XP Harvest
              </span>
              <span className="text-lg font-bold font-mono text-[#3DDB8B] mt-0.5">
                +{systemEvent.quest?.xpReward || 180} XP
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#14151D] border border-[#29233A] flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-[#9290A0]">
                Resonance
              </span>
              <span className="text-lg font-bold font-mono text-[#B45CFF] mt-0.5">
                {profile.resonanceMultiplier.toFixed(2)}x
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSystemEvent}
            className="w-full h-12 rounded-xl bg-[#3DDB8B] text-[#07070B] text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(61,219,139,0.4)] hover:bg-white active:scale-[0.98] transition-all"
          >
            Acknowledge & Resume
          </button>
        </div>
      )}

      {/* OVERLAY 5: QUEST FAILED (PENALTY) */}
      {systemEvent.type === 'QUEST_FAILED' && (
        <div className="relative w-full max-w-sm rounded-2xl bg-[#0D0E14] border border-[#FF5263]/50 p-6 shadow-[0_0_40px_rgba(255,82,99,0.35)] flex flex-col items-center text-center overflow-hidden animate-scaleUp">
          <div className="w-14 h-14 rounded-full bg-[#93000a]/30 border border-[#FF5263]/40 flex items-center justify-center text-[#FF5263] mb-3 shadow-[0_0_20px_rgba(255,82,99,0.4)]">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <span className="text-[10px] uppercase tracking-widest text-[#FF5263] font-bold mb-1">
            System Protocol Breached
          </span>
          <h2 className="text-xl font-bold text-[#F5F5F7] tracking-tight mb-1">
            DIRECTIVE FAILED
          </h2>
          <p className="text-xs text-[#FF5263]/90 mb-5 leading-relaxed">
            Incomplete directive triggered automatic cycle penalty. XP deduction has been enforced.
          </p>

          <div className="w-full p-3.5 rounded-xl bg-[#93000a]/20 border border-[#93000a]/40 flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-[#FF5263] uppercase tracking-wider">
              XP Deduction
            </span>
            <span className="text-xl font-bold font-mono text-[#FF5263]">
              -{systemEvent.penaltyXp || 50} XP
            </span>
          </div>

          <button
            type="button"
            onClick={closeSystemEvent}
            className="w-full h-12 rounded-xl bg-[#FF5263] text-[#07070B] text-sm font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(255,82,99,0.4)] hover:bg-white active:scale-[0.98] transition-all"
          >
            Acknowledge Penalty
          </button>
        </div>
      )}

      {/* OVERLAY 6: ACHIEVEMENT UNLOCKED */}
      {systemEvent.type === 'ACHIEVEMENT_UNLOCKED' && (
        <div className="relative w-full max-w-sm rounded-2xl bg-[#0D0E14] border border-[#8B3DFF]/40 p-6 shadow-[0_0_45px_rgba(139,61,255,0.4)] flex flex-col items-center text-center overflow-hidden animate-scaleUp">
          <div className="w-14 h-14 rounded-full bg-[#8B3DFF]/20 border border-[#8B3DFF]/40 flex items-center justify-center text-[#B45CFF] mb-3 shadow-[0_0_20px_rgba(139,61,255,0.4)]">
            <Award className="w-7 h-7" />
          </div>

          <span className="text-[10px] uppercase tracking-widest text-[#B45CFF] font-bold mb-1">
            System Milestone Cleared
          </span>
          <h2 className="text-xl font-bold text-[#F5F5F7] tracking-tight mb-1">
            {systemEvent.achievement?.title || 'IRON WILL'}
          </h2>
          <p className="text-xs text-[#9290A0] mb-5">
            {systemEvent.achievement?.description ||
              'Complete 30 quests without abandoning one.'}
          </p>

          <div className="w-full p-3.5 rounded-xl bg-[#14151D] border border-[#29233A] flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-[#9290A0] uppercase tracking-wider">
              Bonus Reward
            </span>
            <span className="text-lg font-bold font-mono text-[#B45CFF]">
              +{systemEvent.achievement?.xpReward || 250} XP
            </span>
          </div>

          <button
            type="button"
            onClick={closeSystemEvent}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-[#F5F5F7] text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(139,61,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Acknowledge & Record
          </button>
        </div>
      )}
    </div>
  );
};
