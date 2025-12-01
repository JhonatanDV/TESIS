import React from 'react';
import { Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { DashboardView } from './index';

interface HeaderProps {
  currentView: DashboardView;
  openMobileSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, openMobileSidebar }) => {
  const { currentUser } = useAuth();
  
  const titles = {
    'spaces': 'Espacios',
    'add-space': 'Agregar Espacio',
    'ai': 'Asistente IA',
    'profile': 'Perfil de Usuario',
    'reservations': 'Mis Reservas'
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <button
          onClick={openMobileSidebar}
          className="mr-3 md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">
          {titles[currentView]}
        </h1>
      </div>
      
      <div className="flex items-center">
        <div className="mr-4 relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar espacios..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white w-64"
          />
        </div>
        
        <div className="flex items-center">
          <div className="hidden md:block mr-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {currentUser?.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentUser?.role}
            </div>
          </div>
          <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center">
            {currentUser?.photoUrl ? (
              <img 
                src={currentUser.photoUrl} 
                alt={currentUser.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-blue-600 flex items-center justify-center text-white font-medium">
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;