import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { Building2 } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-violet-600 px-4 sm:px-6">
      <div className="max-w-md w-full overflow-hidden bg-white rounded-xl shadow-xl dark:bg-slate-800 animate-fade-in">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-100 rounded-full mb-4 dark:bg-blue-900">
              <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-300" />
            </div>
            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white">
              SpaceIQ
            </h1>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-1">
              Gestión Inteligente de Espacios Físicos con IA
            </p>
          </div>

          {isLogin ? <Login /> : <Register />}

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;