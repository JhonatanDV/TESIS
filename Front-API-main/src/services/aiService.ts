import apiClient, { handleApiError } from './apiClient';

export interface AIPrediction {
  entity_type: string;
  entity_id: number;
  predicted_usage: number;
  period: string;
  factors: string[];
}

export interface PredictionsResponse {
  predictions: AIPrediction[];
  confidence: number;
  insights: string[];
  model_used: string;
  generated_at: string;
}

export interface OptimizationResponse {
  optimization_score: number;
  recommendations: Array<{
    space_id: number;
    space_name: string;
    resource_id: number;
    resource_name: string;
    reason: string;
    priority: string;
  }>;
  estimated_improvement: number;
  model_used: string;
  generated_at: string;
}

export interface UsagePattern {
  pattern_type: string;
  description: string;
  frequency: string;
  impact: string;
}

export interface UsagePatternsResponse {
  patterns: UsagePattern[];
  trends: string[];
  anomalies: string[];
  recommendations: string[];
  model_used: string;
  generated_at: string;
}

export interface ScenarioSimulation {
  scenario_description: string;
  estimated_impact: string;
  viability_score: number;
  recommendations: string[];
  risks: string[];
  benefits: string[];
  model_used: string;
  generated_at: string;
}

class AIService {
  /**
   * Generate predictions for space/resource usage
   */
  async generatePredictions(data: { data: any }): Promise<PredictionsResponse> {
    try {
      const response = await apiClient.post('/analytics/predictions', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get optimization recommendations
   */
  async optimizeSpaceAllocation(data: {
    spaces: any[];
    resources: any[];
  }): Promise<OptimizationResponse> {
    try {
      const response = await apiClient.post('/assignments/optimize', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Analyze usage patterns
   */
  async analyzeUsagePatterns(data: { usage_data: any[] }): Promise<UsagePatternsResponse> {
    try {
      const response = await apiClient.post('/analytics/usage-patterns', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Simulate a scenario
   */
  async simulateScenario(data: { scenario: any }): Promise<ScenarioSimulation> {
    try {
      const response = await apiClient.post('/analytics/simulate', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get space recommendations based on query
   */
  async getSpaceRecommendations(query: string, limit: number = 5) {
    try {
      // This could be enhanced with a dedicated backend endpoint
      const predictions = await this.generatePredictions({
        data: { query, limit },
      });
      return predictions;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

export default new AIService();
