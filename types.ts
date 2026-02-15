
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
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  description?: string;
  // New: Workflow Configuration
  workflow?: {
    screening?: string; // ID of the screening questionnaire
    technical?: string; // ID of the technical challenge
    cultural?: string; // ID of the cultural fit questions
  };
}

// New: Offer Details
// New: Offer Details
export interface OfferDetails {
  id: string; // Unique ID for the offer version
  status: 'Draft' | 'Pending_Approval' | 'Sent' | 'Viewed' | 'Negotiating' | 'Accepted' | 'Signed' | 'Rejected' | 'Declined';
  token: string; // Secure access token

  // Compensation
  salary: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'INR';
  equity: string;
  signOnBonus?: string;
  performanceBonus?: string;

  // Benefits
  benefits?: string;

  // Logistics
  startDate: string;
  expirationDate?: string;
  location?: string;

  // Meta
  offerLetterContent?: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  documentUrl: string;
  signedDocumentUrl?: string;

  // DocuSign Specific
  docusignStatus?: 'Draft' | 'Sent' | 'Delivered' | 'Completed' | 'Declined' | 'Voided';
  docusignEnvelopeId?: string;
  envelopeId?: string; // Keep for backward compatibility/simplicity
}

// New: Onboarding Tasks
export type OnboardingCategory = 'Legal & Compliance' | 'IT & Equipment' | 'Culture & Orientation';
export type OnboardingTaskType = 'checkbox' | 'upload';

export interface OnboardingTask {
  id: string;
  category: OnboardingCategory;
  task: string;
  type: OnboardingTaskType;
  completed: boolean;
  assignee: 'IT' | 'HR' | 'Manager';
  fileUrl?: string; // If type is upload
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  jobId?: string;
  resumeUrl?: string;
  videoUrl?: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected'; // Added Hired
  score: number;
  match?: number;
  matchReason?: string;
  source?: string; // New: Source of application
  analysis?: {
    matchScore?: number;
    verdict?: string;
    metrics?: any;
    missingSkills?: string[];
    sentimentScore?: number; // New
  };
  // New Fields
  offer?: OfferDetails;
  onboarding?: {
    hrisSyncStatus: 'Not_Synced' | 'Syncing' | 'Synced' | 'Error'; // Renamed from sageSyncStatus
    hrisId?: string;
    tasks: OnboardingTask[];
  };
  folders?: {
    id: string;
    name: string;
    color: string;
    icon: string;
    fileCount: number;
    size: string;
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
    category: 'Resume' | 'Offer' | 'Legal' | 'Identification' | 'Other';
    url: string;
  }[];
}

export interface ScreeningResult {
  score: number;
  verdict: 'Proceed' | 'Reject' | 'Review';
  reasoning: string;
  matchReason?: string;
  missingSkills: string[];
}

export interface LiveConnectionState {
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
}

// --- Assessment Library Types ---

export type AssessmentType = 'QuestionBank' | 'CodingChallenge' | 'SystemDesign';

export interface Question {
  id: string;
  text: string;
  timeLimit?: number; // seconds
  aiEvaluationCriteria?: string; // What the AI should look for
}

export interface CodingConfig {
  language: 'javascript' | 'python' | 'go' | 'java';
  problemStatement: string;
  starterCode: string;
  testCases: { input: string; expectedOutput: string; hidden: boolean }[];
}

export interface CaseStudyConfig {
  scenario: string;
  keyDiscussionPoints: string[]; // Topics the AI must hit
  documents?: string[]; // URLs to mock docs
}

export interface KnowledgeBaseConfig {
  content: string; // The raw text or extracted text from file
  fileName?: string;
}

export interface AssessmentModule {
  id: string;
  name: string;
  type: AssessmentType;
  description: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Expert';
  estimatedDuration: number; // in minutes
  tags: string[];
  itemsCount: number;

  // Question Bank Specific
  sourceMode?: 'manual' | 'knowledgeBase'; // New field to determine logic
  questions?: Question[];
  knowledgeBase?: KnowledgeBaseConfig;

  // Other Types
  codingConfig?: CodingConfig;
  caseStudyConfig?: CaseStudyConfig;
}
