import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Volume2, VolumeX, Sparkles, RotateCcw } from 'lucide-react';

export const Header: React.FC = () => {
  const { profile, systemTime, updateAppearance, resetProgress, loadShowcaseState, navigateTo } = useSystem();

  const toggleSound = () => {
    updateAppearance({ soundEffects: !profile.appearance.soundEffects });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#0D0E14]/90 backdrop-blur-xl pt-safe border-b border-[#29233A]/60 shadow-[0_4px_20px_rgba(7,7,11,0.6)]">
      <div className="h-14 px-4 flex items-center justify-between max-w-md mx-auto w-full">
        {/* Left: Brand & Status */}
        <div 
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigateTo('system')}
        >
          {/* Hexagonal Emblem */}
          <div className="w-7 h-7 relative flex items-center justify-center">
            <svg className="w-7 h-7 text-[#4D8DFF]" viewBox="0 0 100 100" fill="none">
              <polygon
                points="50 5, 90 27, 90 73, 50 95, 10 73, 10 27"
                stroke="currentColor"
                strokeWidth="6"
                fill="#0D0E14"
              />
              <polygon
                points="50 20, 78 36, 78 64, 50 80, 22 64, 22 36"
                stroke="#8B3DFF"
                strokeWidth="4"
                fill="rgba(139, 61, 255, 0.2)"
              />
              <circle cx="50" cy="50" r="8" fill="#F5F5F7" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-[#F5F5F7] font-bold leading-none">
              SYSTEM
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DDB8B] shadow-[0_0_8px_rgba(61,219,139,0.8)] animate-pulse" />
              <span className="text-[9px] text-[#9290A0] uppercase tracking-widest leading-none font-semibold">
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Center: Real-time Live Telemetry Clock */}
        <div className="flex items-center justify-center px-2.5 py-0.5 bg-[#07070B]/80 rounded border border-[#29233A]">
          <span className="text-[11px] text-[#4D8DFF] tracking-widest font-mono font-bold">
            {systemTime}
          </span>
        </div>

        {/* Right: Sound toggle & Profile Avatar */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label="Toggle sound effects"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-[#14151D] text-[#9290A0] hover:text-[#F5F5F7] border border-[#29233A] transition-colors"
            title={profile.appearance.soundEffects ? 'Sound FX Enabled' : 'Sound FX Muted'}
          >
            {profile.appearance.soundEffects ? (
              <Volume2 className="w-3.5 h-3.5 text-[#4D8DFF]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-[#9290A0]" />
            )}
          </button>

          {/* Quick Profile / Avatar */}
          <button
            type="button"
            onClick={() => navigateTo('profile')}
            aria-label="Operator profile"
            className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#8B3DFF] to-[#B45CFF] flex items-center justify-center shadow-[0_0_12px_rgba(139,61,255,0.4)] hover:brightness-110 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-white text-[16px]">
              person
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
