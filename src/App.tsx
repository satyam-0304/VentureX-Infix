import React from 'react';
import { LearningProvider, useLearning } from './contexts/LearningContext';
import { SessionSidebar } from './components/Sidebar/SessionSidebar';
import { WorkspaceNavbar } from './components/Navbar/WorkspaceNavbar';
import { LearningWorkspace } from './pages/LearningWorkspace';
import { DashboardView } from './pages/DashboardView';
import { ProgressView } from './pages/ProgressView';
import { ProfileView } from './pages/ProfileView';
import { AITutorDrawer } from './components/AITutor/AITutorDrawer';

const AppContent: React.FC = () => {
  const { activeNavView } = useLearning();

  return (
    <div className="w-full max-w-[1440px] h-[920px] bg-white/90 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/60 flex overflow-hidden relative" data-purpose="desktop-app-container">
      {/* ChatGPT-style Collapsible Session Sidebar */}
      <SessionSidebar />

      {/* Main Workspace (Top Nav + Scrollable Canvas) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#faf9fe]" data-purpose="workspace-content">
        <WorkspaceNavbar />

        {/* View Switcher */}
        {activeNavView === 'practice' && <LearningWorkspace />}
        {activeNavView === 'dashboard' && <DashboardView />}
        {activeNavView === 'learning_hub' && <DashboardView />}
        {activeNavView === 'progress' && <ProgressView />}
        {activeNavView === 'profile' && <ProfileView />}

        {/* Floating AI Tutor Widget & Modal Drawer */}
        <AITutorDrawer />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <div className="p-2 sm:p-4 lg:p-6 flex items-center justify-center min-h-screen">
      <LearningProvider>
        <AppContent />
      </LearningProvider>
    </div>
  );
};

export default App;

