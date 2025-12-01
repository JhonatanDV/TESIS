import React, { createContext, useContext, useState } from 'react';
import { Space, AIRecommendation } from '../types';
import { useSpaces } from './SpaceContext';
import aiService from '../services/aiService';
import analyticsService from '../services/analyticsService';
import apiClient from '../services/apiClient';

interface AIContextType {
  getSpaceRecommendations: (query: string, limit?: number) => Promise<AIRecommendation[]>;
  analyzeSpaceUsage: (spaceId: string) => Promise<string>;
  getOptimizationSuggestions: () => Promise<string[]>;
  isProcessing: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { spaces } = useSpaces();

  // AI recommendation using real API
  const getSpaceRecommendations = async (query: string, limit = 5): Promise<AIRecommendation[]> => {
    setIsProcessing(true);
    
    try {
      // Call the real AI service
      const response = await aiService.generatePredictions({
        data: {
          query,
          spaces: spaces.map(s => ({
            id: parseInt(s.id),
            nombre: s.name,
            tipo: s.type,
            capacidad: s.capacity,
            ubicacion: s.location,
            disponible: s.availability,
          })),
          limit,
        },
      });
      
      // Transform predictions to recommendations
      const recommendations: AIRecommendation[] = response.predictions.map(pred => ({
        spaceId: pred.entity_id.toString(),
        score: pred.predicted_usage,
        reason: `Predicted usage: ${pred.predicted_usage}% - ${pred.factors.join(', ')}`,
      }));
      
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      
      // Fallback to local scoring if API fails
      return getFallbackRecommendations(query, spaces, limit);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Analyze space usage using real API
  const analyzeSpaceUsage = async (spaceId: string): Promise<string> => {
    setIsProcessing(true);
    const space = spaces.find(s => s.id === spaceId);
    
    if (!space) {
      setIsProcessing(false);
      return "Space not found";
    }
    
    try {
      // Call analytics API
      const analytics = await analyticsService.getUsageAnalytics();
      
      // Generate analysis based on real data
      const utilizationRate = analytics.utilization_rate || 0;
      const analysis = `Space "${space.name}" is part of a system with ${utilizationRate.toFixed(1)}% overall utilization. `;
      
      let recommendation = '';
      if (utilizationRate < 30) {
        recommendation = "The system is underutilized. Consider promoting space availability or adjusting capacity.";
      } else if (utilizationRate < 70) {
        recommendation = "The system has moderate usage. It's functioning well with capacity for growth.";
      } else {
        recommendation = "The system is heavily utilized. Consider optimizing scheduling or expanding capacity.";
      }
      
      return analysis + recommendation;
    } catch (error) {
      console.error('Error analyzing space usage:', error);
      
      // Fallback analysis
      const randomUtilization = Math.floor(Math.random() * 100);
      return `Space "${space.name}" has an estimated ${randomUtilization}% utilization rate. This is a simulated estimate.`;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Get optimization suggestions using real AI API
  const getOptimizationSuggestions = async (): Promise<string[]> => {
    setIsProcessing(true);
    
    try {
      // Call the AI optimization endpoint directly
      const response = await apiClient.get('/chatbot/optimize-suggestions');
      const data = response.data;
      
      if (data.success && data.suggestions && data.suggestions.length > 0) {
        const suggestions = [...data.suggestions];
        
        // Add detailed analysis if available
        if (data.detailed_analysis && data.detailed_analysis.length > 0) {
          data.detailed_analysis.forEach((analysis: any) => {
            if (analysis.area && analysis.recommendation) {
              suggestions.push(
                `📊 ${analysis.area}: ${analysis.recommendation} (Prioridad: ${analysis.priority || 'media'})`
              );
            }
          });
        }
        
        // Add optimization score info
        if (data.optimization_score !== undefined) {
          suggestions.unshift(
            `🎯 Puntuación de optimización actual: ${(data.optimization_score * 100).toFixed(1)}%`
          );
        }
        
        if (data.estimated_improvement > 0) {
          suggestions.push(
            `💡 Mejora potencial estimada: ${data.estimated_improvement.toFixed(1)}% si se implementan las recomendaciones`
          );
        }
        
        return suggestions;
      }
      
      // If no suggestions from AI, use fallback
      return getFallbackOptimizationSuggestions(spaces);
    } catch (error) {
      console.warn('Error getting AI optimization suggestions:', error);
      
      // Use fallback suggestions on any error
      return getFallbackOptimizationSuggestions(spaces);
    } finally {
      setIsProcessing(false);
    }
  };

  const value = {
    getSpaceRecommendations,
    analyzeSpaceUsage,
    getOptimizationSuggestions,
    isProcessing,
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

// Fallback function for recommendations when API is unavailable
function getFallbackRecommendations(query: string, spaces: Space[], limit: number): AIRecommendation[] {
  const keywords = query.toLowerCase().split(' ');
  
  const scoredSpaces = spaces.map(space => {
    let score = 0;
    
    keywords.forEach(keyword => {
      if (space.name.toLowerCase().includes(keyword)) score += 5;
      if (space.type.toLowerCase().includes(keyword)) score += 4;
      if (space.description.toLowerCase().includes(keyword)) score += 3;
      if (space.location.toLowerCase().includes(keyword)) score += 2;
      if (space.features.some(f => f.toLowerCase().includes(keyword))) score += 1;
    });
    
    if (query.includes('large') && space.capacity > 50) score += 3;
    if (query.includes('small') && space.capacity < 20) score += 3;
    if (space.availability) score += 2;
    
    let reason = '';
    if (score > 10) {
      reason = `Excellent match for your needs with ideal ${space.type} features`;
    } else if (score > 5) {
      reason = `Good match with appropriate space type and features`;
    } else if (score > 0) {
      reason = `Possible option but may not match all requirements`;
    } else {
      reason = `Limited match to your criteria but available as an alternative`;
    }
    
    return { spaceId: space.id, score, reason };
  });
  
  return scoredSpaces
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Fallback optimization suggestions
function getFallbackOptimizationSuggestions(spaces: Space[]): string[] {
  const suggestions: string[] = [];
  
  const typeCounts: Record<string, number> = {};
  spaces.forEach(space => {
    typeCounts[space.type] = (typeCounts[space.type] || 0) + 1;
  });
  
  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostCommonType && mostCommonType[1] > spaces.length * 0.5) {
    suggestions.push(
      `Tu inventario está muy concentrado en espacios tipo ${mostCommonType[0]} (${mostCommonType[1]} espacios). Considera diversificar los tipos de espacios.`
    );
  }
  
  const typesWithFewSpaces = Object.entries(typeCounts)
    .filter(([_, count]) => count === 1)
    .map(([type, _]) => type);
  
  if (typesWithFewSpaces.length > 0) {
    suggestions.push(
      `Tienes inventario limitado de: ${typesWithFewSpaces.join(', ')}. Considera agregar más si hay demanda.`
    );
  }
  
  const availableCount = spaces.filter(s => s.availability).length;
  const utilizationRate = ((spaces.length - availableCount) / spaces.length * 100).toFixed(1);
  suggestions.push(`Tasa de utilización actual: ${utilizationRate}%. ${Number(utilizationRate) < 50 ? 'Hay oportunidades para mejorar el uso de espacios.' : 'Buen nivel de utilización.'}`);
  
  suggestions.push("Las sugerencias de IA están temporalmente no disponibles. Intenta de nuevo más tarde.");
  
  return suggestions;
}