import { useEffect, useState } from 'react';
import { analyticsService, aiService } from '../../services';
import { TrendingUp, Users, Calendar, Award, Brain, Zap } from 'lucide-react';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard = ({ className = '' }: AnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load usage analytics
      const usageData = await analyticsService.getUsageAnalytics();
      setAnalytics(usageData);

      // Load efficiency metrics
      const efficiencyData = await analyticsService.getEfficiencyMetrics();
      setEfficiency(efficiencyData);

      // Get AI-powered insights
      try {
        const predictions = await aiService.generatePredictions({
          data: { type: 'insights' }
        });
        setAiInsights(predictions.insights || []);
      } catch (aiError) {
        console.warn('AI insights not available:', aiError);
        setAiInsights(['Connect to backend API for AI-powered insights']);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-300">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 ${className}`}>
        <p className="text-center text-slate-600 dark:text-slate-300">
          No analytics data available. Make sure the backend API is running.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spaces */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Spaces
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {analytics.total_spaces || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Active
            </span>
          </div>
        </div>

        {/* Total Resources */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Resources
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {analytics.total_resources || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Available for assignment
            </span>
          </div>
        </div>

        {/* Active Assignments */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Active Assignments
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {analytics.active_assignments || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Current period
            </span>
          </div>
        </div>

        {/* Utilization Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Utilization Rate
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {analytics.utilization_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xs font-medium ${
              (analytics.utilization_rate || 0) > 70 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {(analytics.utilization_rate || 0) > 70 ? '↑ Optimal' : '↓ Below target'}
            </span>
          </div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      {efficiency && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center mb-4">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Efficiency Metrics
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Space Efficiency</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {(efficiency.space_efficiency * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Resource Efficiency</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {(efficiency.resource_efficiency * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Allocation Efficiency</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {(efficiency.allocation_efficiency * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Recommendations */}
          {efficiency.recommendations && efficiency.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Recommendations
              </h4>
              {efficiency.recommendations.map((rec: string, index: number) => (
                <div 
                  key={index}
                  className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 p-6">
          <div className="flex items-center mb-4">
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              AI-Powered Insights
            </h3>
            <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
              Gemini AI
            </span>
          </div>

          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div 
                key={index}
                className="flex items-start p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{insight}</p>
              </div>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            className="mt-4 w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Refresh AI Insights
          </button>
        </div>
      )}

      {/* Usage by Category */}
      {analytics.usage_by_category && Object.keys(analytics.usage_by_category).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Usage by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.usage_by_category).map(([category, count]: [string, any]) => (
              <div key={category} className="flex items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-32">
                  {category}
                </span>
                <div className="flex-1 mx-4">
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                      style={{ 
                        width: `${(count / analytics.total_spaces) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white w-12 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
