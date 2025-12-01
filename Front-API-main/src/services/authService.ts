import apiClient, { handleApiError } from './apiClient';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  nombre_completo: string;
  rol?: 'admin' | 'docente' | 'estudiante';
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    nombre_completo: string;
    rol: string;
    is_active: boolean;
    created_at: string;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

class AuthService {
  /**
   * Login user with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // FastAPI OAuth2 expects form data
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Store tokens
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      // Get user profile
      const userProfile = await this.getProfile();
      
      return {
        ...response.data,
        user: userProfile,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/register', data);

      // Store tokens
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      // Get user profile after registration
      const userProfile = await this.getProfile();

      return {
        ...response.data,
        user: userProfile,
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get current user profile
   */
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const response = await apiClient.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      localStorage.setItem('access_token', response.data.access_token);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('currentUser');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
}

export default new AuthService();
