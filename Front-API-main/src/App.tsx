import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import LoadingScreen from './components/common/LoadingScreen';

function App() {
  const { currentUser, loading } = useAuth();
  const [appLoaded, setAppLoaded] = useState(false);

  // Simulate initial app loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !appLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {currentUser ? <Dashboard /> : <Auth />}
    </div>
  );
}

export default App;