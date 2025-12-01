import apiClient, { handleApiError } from './apiClient';

export interface Notification {
  id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leido: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

class NotificationService {
  /**
   * Get user notifications
   */
  async getAll(skip: number = 0, limit: number = 50): Promise<Notification[]> {
    try {
      const response = await apiClient.get('/notifications', {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get unread notifications
   */
  async getUnread(): Promise<Notification[]> {
    try {
      const response = await apiClient.get('/notifications/unread');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<Notification> {
    try {
      const response = await apiClient.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.put('/notifications/read-all');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete a notification
   */
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const unread = await this.getUnread();
      return unread.length;
    } catch (error) {
      return 0;
    }
  }
}

export default new NotificationService();
