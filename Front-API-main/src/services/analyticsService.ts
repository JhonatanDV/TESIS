import apiClient, { handleApiError } from './apiClient';

export interface UsageAnalytics {
  total_spaces: number;
  total_resources: number;
  active_assignments: number;
  utilization_rate: number;
  usage_by_category: Record<string, number>;
  peak_usage_times: string[];
  period: string;
}

export interface EfficiencyMetrics {
  space_efficiency: number;
  resource_efficiency: number;
  allocation_efficiency: number;
  recommendations: string[];
  bottlenecks: string[];
}

class AnalyticsService {
  /**
   * Get usage analytics
   */
  async getUsageAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<UsageAnalytics> {
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await apiClient.get('/analytics/usage', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get efficiency metrics
   */
  async getEfficiencyMetrics(): Promise<EfficiencyMetrics> {
    try {
      const response = await apiClient.get('/analytics/efficiency');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get space utilization report
   */
  async getSpaceUtilization(spaceId?: number) {
    try {
      const params = spaceId ? { space_id: spaceId } : {};
      const response = await apiClient.get('/analytics/space-utilization', { params });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new AnalyticsService();
