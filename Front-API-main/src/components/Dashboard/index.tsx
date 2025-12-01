import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import SpacesList from '../Spaces/SpacesList';
import SpaceForm from '../Spaces/SpaceForm';
import AIAssistant from '../AI/AIAssistant';
import UserProfile from '../User/UserProfile';
import Reservations from '../Reservations';
import Chatbot from '../AI/Chatbot';
import { MessageSquare } from 'lucide-react';

export type DashboardView = 'spaces' | 'add-space' | 'ai' | 'profile' | 'reservations';

const Dashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>('spaces');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleSpaceSelect = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setCurrentView('add-space'); // Reuse add-space view for editing
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentView={currentView} 
          openMobileSidebar={() => setIsMobileSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {currentView === 'spaces' && (
            <SpacesList onSpaceSelect={handleSpaceSelect} />
          )}
          
          {currentView === 'add-space' && (
            <SpaceForm 
              spaceId={selectedSpaceId} 
              onComplete={() => {
                setCurrentView('spaces');
                setSelectedSpaceId(null);
              }} 
            />
          )}
          
          {currentView === 'ai' && <AIAssistant />}
          
          {currentView === 'profile' && <UserProfile />}

          {currentView === 'reservations' && <Reservations />}
        </main>
      </div>

      {/* Chatbot Floating Button */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          title="Abrir Asistente IA"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-2 -right-2 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-violet-500 items-center justify-center text-[10px] font-bold">IA</span>
          </span>
        </button>
      )}

      {/* Chatbot Component */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
    </div>
  );
};

export default Dashboard;