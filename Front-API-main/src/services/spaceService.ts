import apiClient, { handleApiError } from './apiClient';

export interface Space {
  id: number;
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion: string;
  descripcion?: string;
  caracteristicas?: string[];
  estado: string;
  imagen_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSpaceData {
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion: string;
  descripcion?: string;
  caracteristicas?: string[];
  estado?: string;
  imagen_url?: string;
}

export interface UpdateSpaceData extends Partial<CreateSpaceData> {}

export interface SpaceAvailable {
  id: number;
  nombre: string;
  tipo: string;
  capacidad: number;
  ubicacion: string;
  disponible: boolean;
}

class SpaceService {
  /**
   * Get all spaces with pagination
   */
  async getAll(skip: number = 0, limit: number = 100): Promise<Space[]> {
    try {
      const response = await apiClient.get('/spaces', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get available spaces
   */
  async getAvailable(): Promise<SpaceAvailable[]> {
    try {
      const response = await apiClient.get('/spaces/available');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get space by ID
   */
  async getById(id: number): Promise<Space> {
    try {
      const response = await apiClient.get(`/spaces/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a new space
   */
  async create(data: CreateSpaceData): Promise<Space> {
    try {
      const response = await apiClient.post('/spaces', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update a space
   */
  async update(id: number, data: UpdateSpaceData): Promise<Space> {
    try {
      const response = await apiClient.put(`/spaces/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete a space
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/spaces/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search spaces by query
   */
  async search(query: string): Promise<Space[]> {
    try {
      const response = await apiClient.get('/spaces/search', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get spaces by type
   */
  async getByType(tipo: string): Promise<Space[]> {
    try {
      const spaces = await this.getAll();
      return spaces.filter(space => space.tipo === tipo);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new SpaceService();
