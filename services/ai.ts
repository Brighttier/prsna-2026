import { ExtendedCandidate, Job } from './store';
import { httpsCallable, functions } from './firebase';

/**
 * AI-POWERED RECRUITMENT INTELLIGENCE
 * 
 * Uses Firebase Cloud Functions v2 for scalable, secure AI processing.
 */

export const generateCandidateReport = async (candidate: ExtendedCandidate, job: Job): Promise<Partial<ExtendedCandidate>> => {
    console.log(`[AI SERVICE] Triggering Cloud Function for: ${candidate.id}`);

    try {
        const generateReportFn = httpsCallable(functions, 'generateCandidateReport');
        // Call the V2 Cloud Function
        const result = await generateReportFn({ candidate, job });
        const analysis = result.data as any;

        return {
            aiVerdict: analysis.technicalScore > 80 ? 'Proceed' : (analysis.technicalScore > 60 ? 'Review' : 'Reject'),
            matchReason: analysis.matchReason,
            summary: analysis.summary,
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

export const screenResume = async (resumeText: string, jobDescription: string) => {
    try {
        const screenFn = httpsCallable(functions, 'screenResume');
        const result = await screenFn({ resumeText, jobDescription });
        return result.data;
    } catch (error) {
        console.error("Resume Screening Failed:", error);
        throw error;
    }
};

export const generateInterviewQuestions = async (candidate: ExtendedCandidate, job: Job, type: string) => {
    try {
        const questionsFn = httpsCallable(functions, 'generateInterviewQuestions');
        const result = await questionsFn({ candidate, job, type });
        return result.data;
    } catch (error) {
        console.error("Question Generation Failed:", error);
        throw error;
    }
};

export const analyzeInterview = async (transcript: any[], jobTitle: string) => {
    try {
        const analyzeFn = httpsCallable(functions, 'analyzeInterview');
        const result = await analyzeFn({ transcript, jobTitle });
        return result.data;
    } catch (error) {
        console.error("Interview Analysis Failed:", error);
        throw error;
    }
};

export const startInterviewSession = async (candidate: ExtendedCandidate, job: Job) => {
    try {
        const startFn = httpsCallable(functions, 'startInterviewSession');
        const result = await startFn({ candidate, job });
        return result.data;
    } catch (error) {
        console.error("Failed to Start Lumina Session:", error);
        throw error;
    }
};
