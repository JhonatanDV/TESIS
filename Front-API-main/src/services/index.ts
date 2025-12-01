// Re-export all services for easy importing
export { default as authService } from './authService';
export { default as spaceService } from './spaceService';
export { default as resourceService } from './resourceService';
export { default as assignmentService } from './assignmentService';
export { default as aiService } from './aiService';
export { default as analyticsService } from './analyticsService';
export { default as notificationService } from './notificationService';

// Re-export types
export type { LoginCredentials, RegisterData, AuthResponse } from './authService';
export type { Space, CreateSpaceData, UpdateSpaceData, SpaceAvailable } from './spaceService';
export type { Resource, CreateResourceData, UpdateResourceData } from './resourceService';
export type { Assignment, CreateAssignmentData, UpdateAssignmentData } from './assignmentService';
export type { 
  AIPrediction, 
  PredictionsResponse, 
  OptimizationResponse,
  UsagePattern,
  UsagePatternsResponse,
  ScenarioSimulation 
} from './aiService';
export type { UsageAnalytics, EfficiencyMetrics } from './analyticsService';
export type { Notification } from './notificationService';
