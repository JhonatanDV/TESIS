import React from 'react';
import { Building2, Plus, BrainCircuit, User, LogOut, X, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { DashboardView } from './index';

interface SidebarProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { logout } = useAuth();

  const navItems = [
    { id: 'spaces', label: 'Espacios', icon: <Building2 className="h-5 w-5" /> },
    { id: 'add-space', label: 'Agregar Espacio', icon: <Plus className="h-5 w-5" /> },
    { id: 'reservations', label: 'Reservas', icon: <CalendarCheck className="h-5 w-5" /> },
    { id: 'ai', label: 'Asistente IA', icon: <BrainCircuit className="h-5 w-5" /> },
    { id: 'profile', label: 'Perfil', icon: <User className="h-5 w-5" /> },
  ];

  const handleNavClick = (view: DashboardView) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Base sidebar content
  const sidebarContent = (
    <>
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg dark:bg-blue-900">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <h1 className="ml-3 text-xl font-bold text-slate-800 dark:text-white">SpaceIQ</h1>
        </div>
        
        <button 
          className="absolute right-4 top-4 md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <div className="mt-6 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id as DashboardView)}
            className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
              currentView === item.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-auto px-3 mb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden dark:bg-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {sidebarContent}
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:bg-white md:border-r border-slate-200 dark:bg-slate-800 dark:border-slate-700">
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;