import React, { createContext, useContext, useState, useEffect } from 'react';
import { Space, SpaceType } from '../types';
import spaceService from '../services/spaceService';
import { useAuth } from './AuthContext';

interface SpaceContextType {
  spaces: Space[];
  loading: boolean;
  addSpace: (spaceData: Omit<Space, 'id' | 'createdBy' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateSpace: (id: string, spaceData: Partial<Space>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  getSpaceById: (id: string) => Space | undefined;
  getSpacesByType: (type: SpaceType) => Space[];
  searchSpaces: (query: string) => Space[];
  refreshSpaces: () => Promise<void>;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export const useSpaces = () => {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error('useSpaces must be used within a SpaceProvider');
  }
  return context;
};

export const SpaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Helper function to parse caracteristicas from backend
  const parseFeatures = (caracteristicas: any): string[] => {
    if (!caracteristicas) return [];
    if (Array.isArray(caracteristicas)) return caracteristicas;
    if (typeof caracteristicas === 'string') {
      try {
        const parsed = JSON.parse(caracteristicas);
        if (Array.isArray(parsed)) return parsed;
        // If it's an object like {"key": "value"}, convert to array of strings
        if (typeof parsed === 'object') {
          return Object.entries(parsed).map(([key, value]) => 
            typeof value === 'boolean' ? (value ? key : null) : `${key}: ${value}`
          ).filter(Boolean);
        }
        return [];
      } catch {
        return [];
      }
    }
    // If it's an object like {"key": "value"}, convert to array of strings
    if (typeof caracteristicas === 'object') {
      return Object.entries(caracteristicas).map(([key, value]) => 
        typeof value === 'boolean' ? (value ? key : null) : `${key}: ${value}`
      ).filter(Boolean) as string[];
    }
    return [];
  };

  const refreshSpaces = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const apiSpaces = await spaceService.getAll();
      
      // Transform API data to match frontend Space interface
      const transformedSpaces: Space[] = apiSpaces.map(apiSpace => ({
        id: apiSpace.id.toString(),
        name: apiSpace.nombre,
        type: apiSpace.tipo as SpaceType,
        capacity: apiSpace.capacidad,
        location: apiSpace.ubicacion,
        description: apiSpace.descripcion || '',
        features: parseFeatures(apiSpace.caracteristicas),
        availability: apiSpace.estado === 'disponible',
        image: apiSpace.imagen_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800',
        createdBy: currentUser.id,
        createdAt: apiSpace.created_at || new Date().toISOString(),
        lastModified: apiSpace.updated_at || new Date().toISOString(),
      }));
      
      setSpaces(transformedSpaces);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSpaces();
  }, [currentUser]);

  const addSpace = async (spaceData: Omit<Space, 'id' | 'createdBy' | 'createdAt' | 'lastModified'>) => {
    if (!currentUser) return;
    
    try {
      const newSpace = await spaceService.create({
        nombre: spaceData.name,
        tipo: spaceData.type,
        capacidad: spaceData.capacity,
        ubicacion: spaceData.location,
        descripcion: spaceData.description,
        caracteristicas: spaceData.features,
        estado: spaceData.availability ? 'disponible' : 'ocupado',
        imagen_url: spaceData.image,
      });
      
      // Add to local state
      const transformedSpace: Space = {
        id: newSpace.id.toString(),
        name: newSpace.nombre,
        type: newSpace.tipo as SpaceType,
        capacity: newSpace.capacidad,
        location: newSpace.ubicacion,
        description: newSpace.descripcion || '',
        features: parseFeatures(newSpace.caracteristicas),
        availability: newSpace.estado === 'disponible',
        image: newSpace.imagen_url || spaceData.image,
        createdBy: currentUser.id,
        createdAt: newSpace.created_at || new Date().toISOString(),
        lastModified: newSpace.updated_at || new Date().toISOString(),
      };
      
      setSpaces(prevSpaces => [...prevSpaces, transformedSpace]);
    } catch (error) {
      console.error('Error adding space:', error);
      throw error;
    }
  };

  const updateSpace = async (id: string, spaceData: Partial<Space>) => {
    try {
      const updateData: any = {};
      if (spaceData.name) updateData.nombre = spaceData.name;
      if (spaceData.type) updateData.tipo = spaceData.type;
      if (spaceData.capacity) updateData.capacidad = spaceData.capacity;
      if (spaceData.location) updateData.ubicacion = spaceData.location;
      if (spaceData.description) updateData.descripcion = spaceData.description;
      if (spaceData.features) updateData.caracteristicas = spaceData.features;
      if (spaceData.availability !== undefined) {
        updateData.estado = spaceData.availability ? 'disponible' : 'ocupado';
      }
      if (spaceData.image) updateData.imagen_url = spaceData.image;
      
      const updated = await spaceService.update(parseInt(id), updateData);
      
      // Update local state
      setSpaces(prevSpaces => 
        prevSpaces.map(space => 
          space.id === id 
            ? { 
                ...space,
                name: updated.nombre,
                type: updated.tipo as SpaceType,
                capacity: updated.capacidad,
                location: updated.ubicacion,
                description: updated.descripcion || '',
                features: parseFeatures(updated.caracteristicas),
                availability: updated.estado === 'disponible',
                image: updated.imagen_url || space.image,
                lastModified: updated.updated_at || new Date().toISOString(),
              } 
            : space
        )
      );
    } catch (error) {
      console.error('Error updating space:', error);
      throw error;
    }
  };

  const deleteSpace = async (id: string) => {
    try {
      await spaceService.delete(parseInt(id));
      setSpaces(prevSpaces => prevSpaces.filter(space => space.id !== id));
    } catch (error) {
      console.error('Error deleting space:', error);
      throw error;
    }
  };

  const getSpaceById = (id: string) => {
    return spaces.find(space => space.id === id);
  };

  const getSpacesByType = (type: SpaceType) => {
    return spaces.filter(space => space.type === type);
  };

  const searchSpaces = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return spaces.filter(space => 
      space.name.toLowerCase().includes(lowerQuery) ||
      space.location.toLowerCase().includes(lowerQuery) ||
      space.description.toLowerCase().includes(lowerQuery) ||
      space.features.some(feature => feature.toLowerCase().includes(lowerQuery))
    );
  };

  const value = {
    spaces,
    loading,
    addSpace,
    updateSpace,
    deleteSpace,
    getSpaceById,
    getSpacesByType,
    searchSpaces,
    refreshSpaces,
  };

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
};