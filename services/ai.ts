
import { ExtendedCandidate, Job } from './store';
import { Analysis } from '../types';

/**
 * AI-POWERED RECRUITMENT INTELLIGENCE
 * 
 * This service mimics the logic of a Google Cloud Function (2nd Gen).
 * In production, this would be a serverless function triggered by Firestore/Storage events.
 */

// 1. DETERMINISTIC SYSTEM PROMPT
// This is the "Secret Sauce" for consistency. Every candidate is evaluated against this EXACT rubric.
const SYSTEM_PROMPT = `
You are an expert HR AI Assistant. Your task is to evaluate a candidate's resume against a specific Job Description.
You must be objective, fair, and consistent.

INPUTS:
1. Job Description (JD): The requirements for the role.
2. Candidate Resume: The text extracted from the candidate's application.

SCORING RUBRIC (0-100):
- 90-100: Exceptional match. Exceeds requirements. "Hire immediately" signal.
- 80-89:  Strong match. Meets all core requirements. "Move to interview" signal.
- 70-79:  Good match. Meets most requirements but has minor gaps. "Screen needed".
- 60-69:  Weak match. Missing key skills or experience. "Review with caution".
- < 60:   No match. "Reject".

OUTPUT SCHEMA (JSON ONLY):
{
  "technicalScore": number, // 0-100 based on hard skills match
  "culturalScore": number, // 0-100 based on soft skills/values match
  "communicationScore": number, // 0-100 based on clarity and presentation
  "strengths": string[], // Top 3-5 strong points
  "weaknesses": string[], // Top 3-5 gaps or areas of concern
  "summary": string, // A concise 2-3 sentence executive summary
  "matchReason": string // One sentence justifying the verdict
}
`;

// Simulated "Cloud Function" execution
// In a real app, this would call Vertex AI (Gemini Pro)
export const generateCandidateReport = async (candidate: ExtendedCandidate, job: Job): Promise<Partial<ExtendedCandidate>> => {
    console.log(`[AI SERVICE] Triggered for Candidate: ${candidate.id} | Job: ${job.id}`);
    console.log(`[AI SERVICE] Fetching Job Description: ${job.title}...`);
    console.log(`[AI SERVICE] Loading Analysis Model (Gemini Pro - Temp: 0.1)...`);

    // Simulate Network/Processing Latency (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // MOCK RESPONSE
    // In reality, this would be the parsed JSON from Gemini
    const mockAnalysis = generateMockAnalysis(candidate, job);

    return {
        aiVerdict: mockAnalysis.technicalScore > 80 ? 'Proceed' : (mockAnalysis.technicalScore > 60 ? 'Review' : 'Reject'),
        matchReason: mockAnalysis.matchReason,
        summary: mockAnalysis.summary,
        analysis: {
            strengths: mockAnalysis.strengths,
            weaknesses: mockAnalysis.weaknesses,
            technicalScore: mockAnalysis.technicalScore,
            culturalScore: mockAnalysis.culturalScore,
            communicationScore: mockAnalysis.communicationScore
        }
    };
};

// Helper to generate "realistic" mock data based on the candidate's role to simulate AI intelligence
const generateMockAnalysis = (candidate: ExtendedCandidate, job: Job) => {
    const isTech = job.department === 'Engineering' || job.title.includes('Engineer') || job.title.includes('Developer');

    if (isTech) {
        return {
            technicalScore: 88 + Math.floor(Math.random() * 10),
            culturalScore: 85 + Math.floor(Math.random() * 10),
            communicationScore: 80 + Math.floor(Math.random() * 15),
            strengths: [
                'Strong match for required tech stack (React, Node.js)',
                'Demonstrates rapid learning variance in past roles',
                'Experience with scalable architecture aligned with our usage'
            ],
            weaknesses: [
                'Limited experience with our specific cloud provider (GCP)',
                'Resume lacks explicit mention of team leadership size'
            ],
            summary: `Candidate shows exceptional promise for the ${job.title} role. Their technical foundation is solid with specific strength in frontend architecture. Cultural fit appears high based on project descriptions emphasizing collaboration.`,
            matchReason: 'High technical overlap and strong trajectory.'
        };
    } else {
        return {
            technicalScore: 82 + Math.floor(Math.random() * 10),
            culturalScore: 90 + Math.floor(Math.random() * 8),
            communicationScore: 92 + Math.floor(Math.random() * 5),
            strengths: [
                'Excellent communication skills evident in presentation',
                'Strong stakeholder management experience',
                'Aligned with company values on transparency'
            ],
            weaknesses: [
                'May need upskilling on specific internal tools',
                'Industry experience is adjacent, not direct'
            ],
            summary: `A precise fit for the ${job.title} position driven by strong soft skills and adaptability. While direct industry experience is partial, their transferable skills in project management are elite.`,
            matchReason: 'Strong cultural add and sufficient core competencies.'
        };
    }
}
