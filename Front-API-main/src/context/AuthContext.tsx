import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import authService from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  updateUserRole: (userId: string, newRole: 'admin' | 'user') => Promise<void>;
  updateUserPhoto: (userId: string, photoUrl: string) => Promise<void>;
  getAllUsers: () => User[];
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if a user is already logged in
    const checkAuth = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const profile = await authService.getProfile();
          const user: User = {
            id: profile.id.toString(),
            email: profile.email,
            password: '', // Not stored on frontend
            name: profile.nombre_completo || profile.username,
            role: profile.rol === 'admin' ? 'admin' : 'user',
            createdAt: profile.created_at,
          };
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (err) {
          // Token invalid, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('currentUser');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const register = async (name: string, email: string, password: string) => {
    setError(null);
    try {
      // Extract username from email (before @)
      const username = email.split('@')[0];
      
      const response = await authService.register({
        username,
        email,
        password,
        nombre_completo: name,
        rol: 'estudiante', // Default role
      });
      
      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      
      const user: User = {
        id: response.user.id.toString(),
        email: response.user.email,
        password: '',
        name: response.user.nombre_completo,
        role: response.user.rol === 'admin' ? 'admin' : 'user',
        createdAt: response.user.created_at,
      };
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      // Extract username from email (before @)
      const username = email.split('@')[0];
      
      const response = await authService.login({ username, password });
      
      const user: User = {
        id: response.user.id.toString(),
        email: response.user.email,
        password: '',
        name: response.user.nombre_completo,
        role: response.user.rol === 'admin' ? 'admin' : 'user',
        createdAt: response.user.created_at,
      };
      
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can update user roles');
    }
    // TODO: Implement API call to update user role
    console.warn('updateUserRole not yet implemented with API');
  };

  const updateUserPhoto = async (userId: string, photoUrl: string) => {
    if (currentUser?.id !== userId && currentUser?.role !== 'admin') {
      throw new Error('Unauthorized to update user photo');
    }
    // TODO: Implement API call to update user photo
    const updatedUser = { ...currentUser, photoUrl };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const deleteUser = async (userId: string) => {
    if (currentUser?.role !== 'admin') {
      throw new Error('Only admins can delete users');
    }

    if (userId === currentUser.id) {
      throw new Error('Cannot delete your own account');
    }
    // TODO: Implement API call to delete user
    console.warn('deleteUser not yet implemented with API');
  };

  const getAllUsers = () => {
    // TODO: Implement API call to get all users
    console.warn('getAllUsers not yet implemented with API');
    return [];
  };

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    error,
    updateUserRole,
    updateUserPhoto,
    getAllUsers,
    deleteUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};