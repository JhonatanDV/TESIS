import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="h-12 w-12 text-blue-600 animate-spin dark:text-blue-400" />
      <h3 className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">Loading...</h3>
    </div>
  );
};

export default LoadingScreen;