import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { NavigationTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentTab, navigateTo } = useSystem();

  const navItems: { tab: NavigationTab; label: string; icon: string }[] = [
    { tab: 'system', label: 'SYSTEM', icon: 'token' },
    { tab: 'quests', label: 'QUESTS', icon: 'adjust' },
    { tab: 'stats', label: 'STATS', icon: 'analytics' },
    { tab: 'profile', label: 'PROFILE', icon: 'account_circle' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#0D0E14]/95 backdrop-blur-xl border-t border-[#29233A]/60 shadow-[0_-8px_24px_rgba(7,7,11,0.8)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => navigateTo(item.tab)}
              className={`flex flex-col items-center justify-center gap-0.5 w-18 h-14 transition-colors duration-200 select-none relative ${
                isActive
                  ? 'text-[#4D8DFF]'
                  : 'text-[#9290A0] hover:text-[#F5F5F7]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>
              <span className="text-[10px] tracking-widest uppercase font-bold font-mono">
                {item.label}
              </span>

              {/* Glowing active pip indicator underneath */}
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 bg-[#4D8DFF] rounded-full shadow-[0_0_8px_#4D8DFF]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
