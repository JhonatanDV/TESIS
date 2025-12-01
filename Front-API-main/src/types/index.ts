export interface User {
  id: string;
  email: string;
  password: string; // Note: In a real app, we would never store passwords in plain text
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  photoUrl?: string;
}

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  capacity: number;
  location: string;
  description: string;
  features: string[];
  availability: boolean;
  image: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export type SpaceType = 
  | 'classroom' 
  | 'laboratory' 
  | 'parking' 
  | 'office' 
  | 'conference' 
  | 'auditorium'
  | 'outdoor'
  | 'other';

export interface AIRecommendation {
  spaceId: string;
  score: number;
  reason: string;
}