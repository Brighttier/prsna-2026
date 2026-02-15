import { ExtendedCandidate, Job, VideoHighlight } from './store';
import { httpsCallable, functions } from './firebase';

/**
 * AI-POWERED RECRUITMENT INTELLIGENCE
 * 
 * Uses Firebase Cloud Functions v2 for scalable, secure AI processing.
 */

interface AnalysisResult {
    strengths: string[];
    weaknesses: string[];
    technicalScore: number;
    culturalScore: number;
    communicationScore: number;
    matchReason?: string;
    summary?: string;
}

export const generateCandidateReport = async (candidate: ExtendedCandidate, job: Job): Promise<Partial<ExtendedCandidate>> => {
    console.log(`[AI SERVICE] Triggering Cloud Function for: ${candidate.id}`);

    try {
        const generateReportFn = httpsCallable<any, AnalysisResult>(functions, 'generateCandidateReport');
        // Call the V2 Cloud Function
        const result = await generateReportFn({ candidate, job });
        const analysis = result.data;

        return {
            aiVerdict: (analysis as any).technicalScore > 80 ? 'Proceed' : ((analysis as any).technicalScore > 60 ? 'Review' : 'Reject'),
            matchReason: analysis.matchReason,
            summary: analysis.summary,
            skills: (analysis as any).skills,
            experience: (analysis as any).experience,
            education: (analysis as any).education,
            analysis: {
                strengths: analysis.strengths || [],
                weaknesses: analysis.weaknesses || [],
                technicalScore: analysis.technicalScore || 0,
                culturalScore: analysis.culturalScore || 0,
                communicationScore: analysis.communicationScore || 0
            }
        };

    } catch (error) {
        console.error("Cloud Function Generation Failed:", error);
        throw error;
    }
};

export const screenResume = async (resumeText: string, jobDescription: string, autoReportThreshold?: number) => {
    try {
        const screenFn = httpsCallable<any, any>(functions, 'screenResume');
        const result = await screenFn({ resumeText, jobDescription, autoReportThreshold });
        return result.data;
    } catch (error) {
        console.error("Resume Screening Failed:", error);
        throw error;
    }
};

export const generateInterviewQuestions = async (candidate: ExtendedCandidate, job: Job, type: string) => {
    try {
        const questionsFn = httpsCallable<any, any>(functions, 'generateInterviewQuestions');
        const result = await questionsFn({ candidate, job, type });
        return result.data;
    } catch (error) {
        console.error("Question Generation Failed:", error);
        throw error;
    }
};

interface InterviewAnalysisResponse {
    score: number;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    summary: string;
    highlights: VideoHighlight[];
}

export const analyzeInterview = async (transcript: any[], jobTitle: string): Promise<InterviewAnalysisResponse> => {
    try {
        const analyzeFn = httpsCallable<any, InterviewAnalysisResponse>(functions, 'analyzeInterview');
        const result = await analyzeFn({ transcript, jobTitle });
        return result.data;
    } catch (error) {
        console.error("Interview Analysis Failed:", error);
        throw error;
    }
};

interface StartSessionResponse {
    systemInstruction: string;
}

export const startInterviewSession = async (candidate: ExtendedCandidate, job: Job, persona?: any): Promise<StartSessionResponse> => {
    try {
        const startFn = httpsCallable<any, StartSessionResponse>(functions, 'startInterviewSession');
        const result = await startFn({ candidate, job, persona });
        return result.data;
    } catch (error) {
        console.error("Failed to Start Lumina Session:", error);
        throw error;
    }
};

export const generateJobDescription = async (title: string, department?: string, location?: string) => {
    try {
        const genFn = httpsCallable<any, { description: string }>(functions, 'generateJobDescription');
        const result = await genFn({ title, department, location });
        return result.data.description;
    } catch (error) {
        console.error("Job Description Generation Failed:", error);
        throw error;
    }
};
