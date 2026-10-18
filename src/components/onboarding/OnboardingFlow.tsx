import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  Dumbbell,
  Brain,
  Briefcase,
  Bolt,
  Users,
  Calendar,
  CheckCircle,
  Radio,
  Sliders,
  X,
} from 'lucide-react';

export const OnboardingFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { completeOnboarding } = useSystem();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Identity
  const [operatorName, setOperatorName] = useState('Myron');

  // Step 2: Paths
  const [selectedPaths, setSelectedPaths] = useState<string[]>([
    'BODY',
    'MIND',
    'CAREER',
    'DISCIPLINE',
  ]);

  // Step 3: Difficulty & Quotas
  const [difficulty, setDifficulty] = useState<'Casual' | 'Normal' | 'Hard' | 'Insane'>('Normal');
  const [dailyQuests, setDailyQuests] = useState(5);
  const [timeCommitment, setTimeCommitment] = useState('30–60 min');

  const togglePath = (path: string) => {
    if (selectedPaths.includes(path)) {
      if (selectedPaths.length > 1) {
        setSelectedPaths(selectedPaths.filter((p) => p !== path));
      }
    } else {
      setSelectedPaths([...selectedPaths, path]);
    }
  };

  const handleFinish = () => {
    completeOnboarding({
      name: operatorName.trim() || 'Myron',
      paths: selectedPaths,
      difficulty,
      dailyQuests,
      timeCommitment,
    });
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F5F7] flex flex-col justify-between max-w-md mx-auto px-4 py-6 select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#8B3DFF]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#4D8DFF]/10 blur-3xl" />

      {/* STEP 1: INITIAL IDENTITY */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between animate-fadeIn">
          {/* Top Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B3DFF] shadow-[0_0_8px_#8B3DFF] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#9290A0]">
                  SYSTEM // PROTOCOL
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#9290A0]">
                01 / 04
              </span>
            </div>
            {/* Step Progress Bar */}
            <div className="w-full h-1 bg-[#14151D] rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] w-1/4 transition-all duration-300" />
            </div>

            {/* Central Infinite Loop Icon */}
            <div className="flex justify-center mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-[#14151D] border border-[#8B3DFF]/40 shadow-[0_0_24px_rgba(139,61,255,0.3)] flex items-center justify-center text-[#B45CFF]">
                <span className="material-symbols-outlined text-[32px]">all_inclusive</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F5F7] uppercase mb-2">
                YOUR JOURNEY BEGINS HERE.
              </h1>
              <p className="text-xs text-[#9290A0] leading-relaxed max-w-xs mx-auto">
                The System is ready. Build discipline. Complete quests. Become stronger every day.
              </p>
            </div>

            {/* Synapse Link Telemetry Card */}
            <div className="bg-[#14151D] border border-[#29233A] rounded-xl p-4 mb-6 shadow-inner">
              <div className="flex items-center justify-between text-[10px] mb-2 font-mono">
                <span className="text-[#3DDB8B] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3DDB8B] animate-ping" />
                  SYNAPSE LINK
                </span>
                <span className="text-[#9290A0]">LATENCY: 0.12ms</span>
              </div>

              {/* Waveform Visualization SVG */}
              <div className="py-2">
                <svg className="w-full h-8 text-[#8B3DFF]" viewBox="0 0 300 40" fill="none">
                  <path
                    d="M 0 20 L 70 20 L 85 10 L 100 28 L 115 15 L 130 24 L 145 20 L 175 20 L 190 7 L 205 32 L 220 20 L 300 20"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_#8B3DFF]"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-[#9290A0] tracking-wider uppercase border-t border-[#29233A]/60 pt-2 mt-1">
                <span>GRID ID: 0x992B</span>
                <span className="text-[#B45CFF]">STANDBY FOR IDENTIFICATION</span>
              </div>
            </div>

            {/* Input field */}
            <div className="flex flex-col gap-1.5 mb-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold">
                  WHAT SHOULD WE CALL YOU?
                </label>
                <span className="text-[10px] text-[#9290A0] font-mono">max 14 chars</span>
              </div>

              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[#9290A0] text-[20px]">
                  fingerprint
                </span>
                <input
                  type="text"
                  maxLength={14}
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Enter callsign..."
                  className="w-full h-12 pl-11 pr-10 rounded-xl bg-[#14151D] border border-[#29233A] text-base font-bold text-[#F5F5F7] tracking-wider focus:border-[#8B3DFF] focus:outline-none focus:shadow-[0_0_16px_rgba(139,61,255,0.25)] transition-all"
                />
                {operatorName && (
                  <button
                    type="button"
                    onClick={() => setOperatorName('')}
                    className="absolute right-3.5 text-[#9290A0] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#9290A0] flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[14px]">info</span>
                Your designation will synchronize across all System ranks.
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-6">
            <button
              type="button"
              disabled={!operatorName.trim()}
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-[#F5F5F7] text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(139,61,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>BEGIN AWAKENING</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#9290A0]/70 text-center mt-3">
              ENCRYPTED TELEMETRY PIPELINE // NODE 01
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: PATH SELECTION */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-between animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-[#9290A0] hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col text-center">
                <span className="text-[9px] uppercase tracking-widest text-[#9290A0]">
                  SYSTEM // CALIBRATION
                </span>
                <span className="text-xs font-bold text-[#F5F5F7]">Path Selection</span>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#9290A0]">
                02 / 04
              </span>
            </div>

            <div className="w-full h-1 bg-[#14151D] rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] w-2/4 transition-all duration-300" />
            </div>

            <div className="mb-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#F5F5F7] uppercase">
                CHOOSE YOUR PATH
              </h1>
              <p className="text-xs text-[#9290A0] mt-0.5">
                What do you want to improve?
              </p>
            </div>

            {/* Path choices list */}
            <div className="flex flex-col gap-2.5">
              {[
                {
                  id: 'BODY',
                  title: 'BODY',
                  desc: 'Fitness, strength and running.',
                  icon: 'fitness_center',
                },
                {
                  id: 'MIND',
                  title: 'MIND',
                  desc: 'Learning, reading and problem-solving.',
                  icon: 'psychology',
                },
                {
                  id: 'CAREER',
                  title: 'CAREER',
                  desc: 'Programming, projects and profession...',
                  icon: 'code',
                },
                {
                  id: 'DISCIPLINE',
                  title: 'DISCIPLINE',
                  desc: 'Consistency, routines and personal habits.',
                  icon: 'bolt',
                },
                {
                  id: 'SOCIAL',
                  title: 'SOCIAL',
                  desc: 'Communication and meaningful relationships.',
                  icon: 'group',
                },
                {
                  id: 'LIFE',
                  title: 'LIFE',
                  desc: 'Personal organization and responsibilities.',
                  icon: 'calendar_month',
                },
              ].map((path) => {
                const isSelected = selectedPaths.includes(path.id);
                return (
                  <div
                    key={path.id}
                    onClick={() => togglePath(path.id)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#14151D] border-[#8B3DFF]/50 shadow-[0_0_16px_rgba(139,61,255,0.2)]'
                        : 'bg-[#14151D]/60 border-[#29233A] opacity-75'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B3DFF] rounded-l" />
                    )}

                    <div className="flex items-center gap-3 pl-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#8B3DFF]/25 text-[#B45CFF]'
                            : 'bg-[#0D0E14] text-[#9290A0]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {path.icon}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold tracking-wider text-[#F5F5F7]">
                          {path.title}
                        </span>
                        <span className="text-xs text-[#9290A0] truncate">
                          {path.desc}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#8B3DFF] text-white shadow-[0_0_8px_#8B3DFF]'
                          : 'border border-[#4b4456] text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        check
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-[#9290A0] flex items-center gap-1.5 mt-3">
              <span className="material-symbols-outlined text-[14px] text-[#3DDB8B]">
                verified
              </span>
              Select at least one path to calibrate daily quests.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 h-12 rounded-xl bg-[#14151D] border border-[#29233A] text-xs font-bold uppercase tracking-wider text-[#9290A0] hover:text-white"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-2 h-12 rounded-xl bg-[#8B3DFF] hover:bg-[#B45CFF] text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(139,61,255,0.4)] flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DIFFICULTY CALIBRATION */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-between animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1 text-[#9290A0] hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col text-center">
                <span className="text-[9px] uppercase tracking-widest text-[#9290A0]">
                  SYSTEM // CALIBRATION
                </span>
                <span className="text-xs font-bold text-[#F5F5F7]">Difficulty Calibration</span>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#9290A0]">
                03 / 04
              </span>
            </div>

            <div className="w-full h-1 bg-[#14151D] rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] w-3/4 transition-all duration-300" />
            </div>

            <div className="mb-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#F5F5F7] uppercase">
                SET YOUR DIFFICULTY
              </h1>
              <p className="text-xs text-[#9290A0] mt-0.5">
                Choose a challenge that fits your life.
              </p>
            </div>

            {/* 1. Baseline Difficulty */}
            <div className="flex flex-col gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9290A0]">
                1. BASELINE DIFFICULTY
              </span>
              <div className="flex flex-col gap-1.5">
                {[
                  { key: 'Casual', label: 'Casual', desc: 'A lighter workload with flexible expectations.' },
                  { key: 'Normal', label: 'Normal', desc: 'A balanced daily challenge.' },
                  { key: 'Hard', label: 'Hard', desc: 'A demanding workload requiring consistency.' },
                  { key: 'Insane', label: 'Insane', desc: 'An ambitious challenge with a higher workload.' },
                ].map((item) => {
                  const isSelected = difficulty === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setDifficulty(item.key as any)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#14151D] border-[#8B3DFF] shadow-[0_0_12px_rgba(139,61,255,0.25)]'
                          : 'bg-[#14151D]/60 border-[#29233A]'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#F5F5F7] tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-[#9290A0] mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isSelected
                            ? 'border-2 border-[#8B3DFF] bg-[#8B3DFF]'
                            : 'border border-[#4b4456]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Daily Quests Picker */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#9290A0]">
                  2. DAILY QUESTS
                </span>
                <span className="text-[10px] font-mono text-[#8B3DFF] font-bold">
                  {dailyQuests} ASSIGNED
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {[3, 4, 5, 6, 7, 8].map((num) => {
                  const isSelected = dailyQuests === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDailyQuests(num)}
                      className={`h-11 rounded-lg font-mono text-sm font-bold transition-all ${
                        isSelected
                          ? 'bg-[#8B3DFF] text-white shadow-[0_0_12px_rgba(139,61,255,0.5)]'
                          : 'bg-[#14151D] border border-[#29233A] text-[#9290A0] hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-[#9290A0]">
                Number of mandatory progression tasks assigned each day.
              </span>
            </div>

            {/* 3. Daily Time Commitment */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9290A0]">
                3. DAILY TIME COMMITMENT
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['15–30 min', '30–60 min', '1–2 hours', '2+ hours'].map((time) => {
                  const isSelected = timeCommitment === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setTimeCommitment(time)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#8B3DFF] text-white shadow-[0_0_12px_rgba(139,61,255,0.4)]'
                          : 'bg-[#14151D] border border-[#29233A] text-[#9290A0] hover:text-white'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 h-12 rounded-xl bg-[#14151D] border border-[#29233A] text-xs font-bold uppercase tracking-wider text-[#9290A0] hover:text-white"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex-2 h-12 rounded-xl bg-[#8B3DFF] hover:bg-[#B45CFF] text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(139,61,255,0.4)] flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SYSTEM INITIALIZATION & AWAKENING READY */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-between animate-fadeIn">
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-1 text-[#9290A0] hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col text-center">
                <span className="text-[9px] uppercase tracking-widest text-[#9290A0]">
                  SYSTEM // CALIBRATION
                </span>
                <span className="text-xs font-bold text-[#F5F5F7]">System Initialization</span>
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#9290A0]">
                PHASE 04 / 04
              </span>
            </div>

            <div className="w-full h-1 bg-[#14151D] rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] w-full transition-all duration-300" />
            </div>

            {/* Sparkle Pill & Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B3DFF]/20 border border-[#8B3DFF]/40 text-[#B45CFF] text-[10px] font-bold uppercase tracking-widest mb-2 shadow-[0_0_12px_rgba(139,61,255,0.3)]">
                <Sparkles className="w-3 h-3" />
                <span>CONVERGENCE ACHIEVED</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F5F7] uppercase">
                AWAKENING READY
              </h1>
              <p className="text-xs text-[#9290A0] mt-1 max-w-xs mx-auto">
                All neural vectors mapped. Autonomous directive standing by for player sovereignty.
              </p>
            </div>

            {/* Center Rank Box */}
            <div className="flex justify-center mb-4">
              <div className="w-28 h-28 rounded-2xl bg-[#14151D] border border-[#8B3DFF]/60 shadow-[0_0_30px_rgba(139,61,255,0.35)] flex flex-col items-center justify-center relative p-3">
                <span className="absolute top-2 left-2.5 text-[9px] font-mono text-[#9290A0]">01</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#B45CFF]">
                  RANK
                </span>
                <span className="text-4xl font-extrabold text-[#F5F5F7] tracking-tight leading-none my-0.5">
                  E
                </span>
                <span className="absolute bottom-2 right-2.5 text-[9px] font-mono text-[#9290A0]">INIT</span>
              </div>
            </div>

            {/* Matrix Data Summary */}
            <div className="bg-[#14151D] border border-[#29233A] rounded-xl p-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#0D0E14] border border-[#29233A]">
                  <span className="text-[9px] uppercase tracking-widest text-[#9290A0] font-semibold block">
                    SOVEREIGN IDENT
                  </span>
                  <span className="text-sm font-bold text-[#F5F5F7] uppercase truncate mt-0.5 block">
                    {operatorName || 'MYRON'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0D0E14] border border-[#29233A]">
                  <span className="text-[9px] uppercase tracking-widest text-[#9290A0] font-semibold block">
                    STARTING POWER
                  </span>
                  <span className="text-sm font-mono font-bold text-[#B45CFF] mt-0.5 block">
                    LVL 1 · 0 XP
                  </span>
                </div>
              </div>

              {/* Baseline Attributes */}
              <div className="p-2.5 rounded-lg bg-[#0D0E14] border border-[#29233A]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-[#9290A0] font-semibold">
                    BASELINE ATTRIBUTES
                  </span>
                  <span className="text-[9px] text-[#3DDB8B] font-mono font-bold">
                    SYNCHRONIZED
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-center font-mono">
                  {['STR', 'AGI', 'INT', 'VIT', 'FOC', 'SOC'].map((stat) => (
                    <div key={stat} className="flex flex-col">
                      <span className="text-[9px] text-[#9290A0]">{stat}</span>
                      <span className="text-xs font-bold text-[#F5F5F7]">10</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quota & Difficulty */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[#0D0E14] border border-[#29233A] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-[#9290A0]">
                      DAILY QUESTS
                    </span>
                    <span className="font-bold text-[#F5F5F7]">{dailyQuests} Tasks / cycle</span>
                  </div>
                  <span className="material-symbols-outlined text-[#4D8DFF] text-[18px]">
                    assignment
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#0D0E14] border border-[#29233A] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-[#9290A0]">
                      DIFFICULTY
                    </span>
                    <span className="font-bold text-[#3DDB8B] uppercase">{difficulty}</span>
                  </div>
                  <span className="material-symbols-outlined text-[#3DDB8B] text-[18px]">
                    security
                  </span>
                </div>
              </div>

              {/* Aligned Domains */}
              <div className="pt-1">
                <span className="text-[9px] uppercase tracking-widest text-[#9290A0] font-semibold block mb-1.5">
                  ALIGNED DOMAINS
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPaths.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded bg-[#8B3DFF]/20 text-[10px] font-bold text-[#B45CFF] border border-[#8B3DFF]/30 uppercase"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#9290A0] text-center mt-3">
              Quests will generate automatically at next dawn interval based on calibrated vectors.
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleFinish}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-[#F5F5F7] text-sm font-bold uppercase tracking-wider shadow-[0_0_24px_rgba(139,61,255,0.5)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>[ AWAKEN ]</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-mono uppercase tracking-wider text-[#9290A0] hover:text-white text-center py-1"
            >
              Adjust Calibration Matrix
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
