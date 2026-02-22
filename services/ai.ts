import { ExtendedCandidate, Job, VideoHighlight } from './store';
import { httpsCallable, functions } from './firebase';

/**
 * AI-POWERED RECRUITMENT INTELLIGENCE
 * 
 * Uses Firebase Cloud Functions v2 for scalable, secure AI processing.
 */

interface AnalysisResult {
    score: number;
    verdict: 'Proceed' | 'Review' | 'Reject';
    matchReason?: string;
    summary?: string;
    skills?: string[];
    skillsMatrix?: any[];
    experience?: any[];
    education?: any[];
    intelligence?: {
        strengths: string[];
        weaknesses: string[];
        technicalScore: number;
        culturalScore: number;
        communicationScore: number;
        missingSkills?: string[];
    };
}

export const generateCandidateReport = async (candidate: ExtendedCandidate, job: Job, orgId?: string): Promise<Partial<ExtendedCandidate>> => {
    console.log(`[AI SERVICE] Triggering Cloud Function for: ${candidate.id}`);

    try {
        const generateReportFn = httpsCallable<any, AnalysisResult>(functions, 'generateCandidateReport');
        // Call the V2 Cloud Function
        const result = await generateReportFn({ candidate, job, orgId });
        const analysis = result.data;

        return {
            score: analysis.score || 0,
            aiVerdict: analysis.verdict || 'Review',
            matchReason: analysis.matchReason,
            summary: analysis.summary,
            skills: analysis.skills || [],
            experience: analysis.experience || [],
            education: analysis.education || [],
            analysis: {
                strengths: analysis.intelligence?.strengths || [],
                weaknesses: analysis.intelligence?.weaknesses || [],
                technicalScore: analysis.intelligence?.technicalScore || analysis.score || 0,
                culturalScore: analysis.intelligence?.culturalScore || 0,
                communicationScore: analysis.intelligence?.communicationScore || 0,
                skillsMatrix: analysis.skillsMatrix || [],
                matchScore: analysis.score || 0,
                missingSkills: analysis.intelligence?.missingSkills || []
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
    voice?: string;
}

export const startInterviewSession = async (candidate: ExtendedCandidate, job: Job, persona?: any, orgId?: string, assessmentId?: string): Promise<StartSessionResponse> => {
    try {
        const startFn = httpsCallable<any, StartSessionResponse>(functions, 'startInterviewSession');
        const result = await startFn({ candidate, job, persona, orgId, assessmentId });
        return result.data;
    } catch (error) {
        console.error("Failed to Start Lumina Session:", error);
        throw error;
    }
};

export const aiSearchCandidates = async (query: string, orgId: string) => {
    try {
        const searchFn = httpsCallable<any, any>(functions, 'aiSearchCandidates');
        const result = await searchFn({ query, orgId });
        return result.data;
    } catch (error) {
        console.error("AI Search Failed:", error);
        throw error;
    }
};

export const deleteTenantData = async (orgId: string) => {
    try {
        const deleteFn = httpsCallable<any, any>(functions, 'deleteTenantData');
        const result = await deleteFn({ orgId });
        return result.data;
    } catch (error) {
        console.error("Tenant Deletion Failed:", error);
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
