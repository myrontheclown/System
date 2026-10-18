import React, { useState } from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { QuestListView } from './components/quests/QuestListView';
import { QuestDetailView } from './components/quests/QuestDetailView';
import { StatsView } from './components/stats/StatsView';
import { AchievementsView } from './components/achievements/AchievementsView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { SystemEventOverlays } from './components/overlays/SystemEventOverlays';

const AppContent: React.FC = () => {
  const { profile, currentTab, selectedQuestId } = useSystem();
  const [showOnboarding, setShowOnboarding] = useState(!profile.hasCompletedOnboarding);
  const [showAchievements, setShowAchievements] = useState(false);

  // If onboarding is active, render full-screen onboarding experience
  if (showOnboarding || !profile.hasCompletedOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07070B] text-[#F5F5F7] flex flex-col antialiased selection:bg-[#8B3DFF] selection:text-white relative">
      {/* Fixed Top Status & Telemetry Header */}
      <Header />

      {/* Main View Container */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 max-w-md mx-auto px-4">
        {selectedQuestId ? (
          <QuestDetailView />
        ) : showAchievements ? (
          <AchievementsView onBack={() => setShowAchievements(false)} />
        ) : (
          <>
            {currentTab === 'system' && <DashboardView />}
            {currentTab === 'quests' && <QuestListView />}
            {currentTab === 'stats' && (
              <StatsView onOpenAchievements={() => setShowAchievements(true)} />
            )}
            {currentTab === 'profile' && (
              <ProfileSettingsView
                onRestartOnboarding={() => setShowOnboarding(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Navigation Deck */}
      <BottomNav />

      {/* System Event Overlays (Level Up, Rank Up, Boss Victory, Quest Complete, Penalty) */}
      <SystemEventOverlays />
    </div>
  );
};

export default function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}
