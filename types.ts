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
