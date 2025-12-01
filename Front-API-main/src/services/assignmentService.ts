import apiClient, { handleApiError } from './apiClient';

export interface Assignment {
  id: number;
  espacio_id: number;
  recurso_id: number;
  usuario_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAssignmentData {
  espacio_id: number;
  recurso_id: number;
  usuario_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  notas?: string;
}

export interface UpdateAssignmentData extends Partial<CreateAssignmentData> {}

class AssignmentService {
  /**
   * Get all assignments
   */
  async getAll(skip: number = 0, limit: number = 100): Promise<Assignment[]> {
    try {
      const response = await apiClient.get('/assignments', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get active assignments
   */
  async getActive(): Promise<Assignment[]> {
    try {
      const response = await apiClient.get('/assignments/active');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get assignment by ID
   */
  async getById(id: number): Promise<Assignment> {
    try {
      const response = await apiClient.get(`/assignments/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create a new assignment
   */
  async create(data: CreateAssignmentData): Promise<Assignment> {
    try {
      const response = await apiClient.post('/assignments', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update an assignment
   */
  async update(id: number, data: UpdateAssignmentData): Promise<Assignment> {
    try {
      const response = await apiClient.put(`/assignments/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete an assignment
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/assignments/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get assignments by space
   */
  async getBySpace(spaceId: number): Promise<Assignment[]> {
    try {
      const response = await apiClient.get(`/assignments/space/${spaceId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get assignments by user
   */
  async getByUser(userId: number): Promise<Assignment[]> {
    try {
      const response = await apiClient.get(`/assignments/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new AssignmentService();
