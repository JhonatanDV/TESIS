import apiClient, { handleApiError } from './apiClient';

export interface Resource {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  cantidad_disponible: number;
  estado: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateResourceData {
  nombre: string;
  tipo: string;
  descripcion?: string;
  cantidad_disponible: number;
  estado?: string;
}

export interface UpdateResourceData extends Partial<CreateResourceData> {}

class ResourceService {
  /**
   * Get all resources
   */
  async getAll(skip: number = 0, limit: number = 100): Promise<Resource[]> {
    try {
      const response = await apiClient.get('/resources', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get resource by ID
   */
  async getById(id: number): Promise<Resource> {
    try {
      const response = await apiClient.get(`/resources/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a new resource
   */
  async create(data: CreateResourceData): Promise<Resource> {
    try {
      const response = await apiClient.post('/resources', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update a resource
   */
  async update(id: number, data: UpdateResourceData): Promise<Resource> {
    try {
      const response = await apiClient.put(`/resources/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete a resource
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/resources/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get available resources
   */
  async getAvailable(): Promise<Resource[]> {
    try {
      const response = await apiClient.get('/resources/available');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new ResourceService();
