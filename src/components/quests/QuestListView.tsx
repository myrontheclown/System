import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Quest, QuestCategory } from '../../types';
import { Plus, Check, Play, Timer, Sparkles, Trophy, Filter, X } from 'lucide-react';

export const QuestListView: React.FC = () => {
  const { quests, openQuestDetail, completeQuest, addNewQuest } = useSystem();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'BOSS'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New quest form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<QuestCategory>('TRAINING');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newXp, setNewXp] = useState(100);
  const [newStatKey, setNewStatKey] = useState<'STR' | 'VIT' | 'INT' | 'FOC' | 'DISC' | 'SOC'>('DISC');

  const filteredQuests = quests.filter((q) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ACTIVE') return q.status === 'active' || q.status === 'available';
    if (activeFilter === 'COMPLETED') return q.status === 'completed';
    if (activeFilter === 'BOSS') return q.isBoss;
    return true;
  });

  const handleCreateQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addNewQuest({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Custom Protocol',
      category: newCategory,
      categoryLabel: newCategory === 'TRAINING' ? 'Physical' : 'Cognition',
      xpReward: Number(newXp) || 100,
      statRewards: { [newStatKey]: 1 },
      status: 'active',
      objectives: [
        {
          id: `custom-obj-${Date.now()}`,
          text: newTitle.trim(),
          note: newSubtitle.trim() || 'Target parameters verified',
          current: 0,
          target: 1,
          unit: 'task',
          completed: false,
        },
      ],
    });

    setNewTitle('');
    setNewSubtitle('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col w-full pb-8 select-none">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-[#F5F5F7] tracking-tight">
            QUEST MATRIX
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-[#9290A0]">
            Autonomous Daily Directives
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4D8DFF] text-[#07070B] text-xs font-bold uppercase tracking-wider hover:bg-[#F5F5F7] shadow-[0_0_12px_rgba(77,141,255,0.3)] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>NEW QUEST</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#14151D] border border-[#29233A] rounded-xl mb-4 overflow-x-auto">
        {(['ALL', 'ACTIVE', 'COMPLETED', 'BOSS'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${
                isActive
                  ? 'bg-[#8B3DFF] text-white shadow-[0_0_12px_rgba(139,61,255,0.4)]'
                  : 'text-[#9290A0] hover:text-[#F5F5F7]'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Quests Stream */}
      <div className="flex flex-col gap-2.5">
        {filteredQuests.map((quest) => {
          const isCompleted = quest.status === 'completed';
          const isBoss = quest.isBoss;
          const isRare = quest.isRare;

          return (
            <div
              key={quest.id}
              onClick={() => openQuestDetail(quest.id)}
              className={`relative rounded-xl p-4 border transition-all cursor-pointer active:scale-[0.99] ${
                isBoss
                  ? 'bg-gradient-to-r from-[#14151D] via-[#1b1b20] to-[#14151D] border-[#8B3DFF] shadow-[0_0_24px_rgba(139,61,255,0.3)]'
                  : isCompleted
                  ? 'bg-[#14151D]/60 border-[#29233A] opacity-75'
                  : isRare
                  ? 'bg-[#14151D] border-[#8B3DFF]/40 shadow-[0_0_16px_rgba(139,61,255,0.15)]'
                  : 'bg-[#14151D] border-[#29233A] hover:border-[#4D8DFF]/60'
              }`}
            >
              {/* Left Color Indicator */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l ${
                  isBoss
                    ? 'bg-gradient-to-b from-[#8B3DFF] via-[#B45CFF] to-[#3DDB8B]'
                    : isCompleted
                    ? 'bg-[#3DDB8B]'
                    : isRare
                    ? 'bg-[#B45CFF]'
                    : 'bg-[#4D8DFF]'
                }`}
              />

              <div className="flex items-start justify-between gap-3 pl-1">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                        isBoss
                          ? 'text-[#B45CFF]'
                          : isCompleted
                          ? 'text-[#3DDB8B]'
                          : isRare
                          ? 'text-[#B45CFF]'
                          : 'text-[#4D8DFF]'
                      }`}
                    >
                      {isBoss && <Trophy className="w-3 h-3 text-[#B45CFF]" />}
                      [{quest.category}]
                    </span>
                    <span className="text-[10px] text-[#9290A0]">
                      · {quest.categoryLabel}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold tracking-tight ${
                      isCompleted ? 'line-through text-[#9290A0]' : 'text-[#F5F5F7]'
                    }`}
                  >
                    {quest.title}
                  </h3>
                  <p className="text-xs text-[#9290A0] mt-0.5 line-clamp-1">
                    {quest.description || quest.subtitle}
                  </p>

                  {/* Objective status pill */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-mono text-[#9290A0]">
                      {quest.objectives.filter((o) => o.completed).length} /{' '}
                      {quest.objectives.length} Objectives
                    </span>
                    {quest.specialReward && (
                      <span className="px-1.5 py-0.5 rounded bg-[#8B3DFF]/20 text-[9px] font-bold text-[#B45CFF] truncate max-w-[180px]">
                        ★ Special Title
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Rewards & Action */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                      isBoss
                        ? 'bg-[#8B3DFF]/30 text-[#B45CFF] border border-[#8B3DFF]/50'
                        : isCompleted
                        ? 'bg-[#2a292e] text-[#3DDB8B]'
                        : 'bg-[#4D8DFF]/20 text-[#4D8DFF]'
                    }`}
                  >
                    +{quest.xpReward} XP
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCompleted) {
                        completeQuest(quest.id);
                      }
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-[#3DDB8B]/20 text-[#3DDB8B]'
                        : isBoss
                        ? 'bg-gradient-to-r from-[#8B3DFF] to-[#B45CFF] text-white shadow-[0_0_12px_rgba(139,61,255,0.4)]'
                        : 'bg-[#4D8DFF] text-[#07070B] hover:bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredQuests.length === 0 && (
          <div className="text-center py-12 bg-[#14151D] rounded-xl border border-[#29233A]">
            <p className="text-sm text-[#9290A0]">No directives found in this sector.</p>
          </div>
        )}
      </div>

      {/* Add Custom Quest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07070B]/85 backdrop-blur-md">
          <div className="bg-[#14151D] border border-[#29233A] rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#F5F5F7] uppercase tracking-wide">
                Calibrate New Quest
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#9290A0] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuest} className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold block mb-1">
                  Quest Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5K Recovery Run or Write 500 words"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0D0E14] border border-[#29233A] text-sm text-[#F5F5F7] placeholder-[#9290A0]/50 focus:border-[#4D8DFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold block mb-1">
                  Category Domain
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['TRAINING', 'INTELLIGENCE', 'LEARNING', 'DISCIPLINE', 'CAREER', 'LIFE'] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewCategory(cat)}
                        className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                          newCategory === cat
                            ? 'bg-[#8B3DFF] text-white shadow-[0_0_8px_rgba(139,61,255,0.4)]'
                            : 'bg-[#0D0E14] text-[#9290A0] border border-[#29233A]'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold block mb-1">
                  Subtext / Routine Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zone 2 aerobic pacing"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0D0E14] border border-[#29233A] text-sm text-[#F5F5F7] placeholder-[#9290A0]/50 focus:border-[#4D8DFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold block mb-1">
                    XP Yield
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="1000"
                    step="10"
                    value={newXp}
                    onChange={(e) => setNewXp(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg bg-[#0D0E14] border border-[#29233A] text-sm font-mono text-[#F5F5F7] focus:border-[#4D8DFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#9290A0] font-semibold block mb-1">
                    Stat Upgrade
                  </label>
                  <select
                    value={newStatKey}
                    onChange={(e) => setNewStatKey(e.target.value as any)}
                    className="w-full h-10 px-2 rounded-lg bg-[#0D0E14] border border-[#29233A] text-xs font-bold text-[#F5F5F7] focus:border-[#4D8DFF] focus:outline-none"
                  >
                    <option value="STR">+1 STR (Strength)</option>
                    <option value="VIT">+1 VIT (Vitality)</option>
                    <option value="INT">+1 INT (Intelligence)</option>
                    <option value="FOC">+1 FOC (Focus)</option>
                    <option value="DISC">+1 DISC (Discipline)</option>
                    <option value="SOC">+1 SOC (Social)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-lg bg-[#1b1b20] text-xs font-semibold text-[#9290A0] hover:text-white uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-[#4D8DFF] text-xs font-bold text-[#07070B] uppercase tracking-wider hover:bg-white shadow-[0_0_12px_rgba(77,141,255,0.4)]"
                >
                  Deploy Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
