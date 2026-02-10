
export enum JobStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  DRAFT = 'Draft'
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: JobStatus;
  applicants: number;
  postedDate: string;
  // New: Workflow Configuration
  workflow?: {
    screening?: string; // ID of the screening questionnaire
    technical?: string; // ID of the technical challenge
    cultural?: string; // ID of the cultural fit questions
  };
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
  score: number;
  matchReason?: string;
}

export interface ScreeningResult {
  score: number;
  verdict: 'Proceed' | 'Reject' | 'Review';
  reasoning: string;
  missingSkills: string[];
}

export interface LiveConnectionState {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
}

// --- Assessment Library Types ---

export type AssessmentType = 'QuestionBank' | 'CodingChallenge' | 'SystemDesign';

export interface AssessmentModule {
  id: string;
  name: string;
  type: AssessmentType;
  description: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Expert';
  estimatedDuration: number; // in minutes
  tags: string[];
  itemsCount: number;
}
