import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SpaceProvider } from './context/SpaceContext';
import { AIProvider } from './context/AIContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SpaceProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </SpaceProvider>
    </AuthProvider>
  </StrictMode>
);