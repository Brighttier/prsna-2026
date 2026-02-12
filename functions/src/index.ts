
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase-admin/app";

initializeApp();

// Define Secrets (Best Practice: Use Google Secret Manager)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Configuration for scalable V2 functions
const functionConfig = {
    cors: true,
    region: "us-central1",
    maxInstances: 10,  // Cost control: prevent runaway scaling
    concurrency: 80,   // Performance: handle multiple concurrent requests per instance (I/O bound)
    memory: "512MiB",  // Resource optimization
    timeoutSeconds: 120, // GenAI can be slow
    secrets: [geminiApiKey] // Secure access to API key
};

// Lazy initialization pattern for the GenAI client
// We initialize it inside the function to ensure secrets are available
const getGenAIClient = () => {
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY secret is not set.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * 1. AI-POWERED RESUME SCREENING
 * 
 * Analyzes a candidate's resume against a job description.
 */
export const screenResume = onCall(functionConfig as any, async (request) => {
    // 1. Authentication Check (Optional, enabled for enterprise security)
    // if (!request.auth) {
    //     throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    const { resumeText, jobDescription } = request.data;

    if (!resumeText || !jobDescription) {
        throw new HttpsError('invalid-argument', 'The function must be called with "resumeText" and "jobDescription".');
    }

    logger.info("Screening resume", { resumeLength: resumeText.length });

    try {
        const genAI = getGenAIClient();

        const prompt = `
      You are an expert technical recruiter known as "The Gatekeeper".
      
      Job Description:
      ${jobDescription}

      Candidate Resume Content:
      ${resumeText}

 Task:
      Analyze the candidate's career trajectory and skill density relative to the job description.
      Provide a strict JSON output with the following structure:
 {
   "score": number(0 - 100),
     "verdict": "Proceed" | "Reject" | "Review",
       "reasoning": "A concise summary of why this score was given.",
         "missingSkills": ["skill1", "skill2"],
         "matchReason": "A one sentence summary of the match."
 }
      
      Do not include markdown formatting(like \`\`\`json). Just the raw JSON string.
    `;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text || "{}";
        return JSON.parse(text);

    } catch (error: any) {
        logger.error("Error screening resume", error);
        throw new HttpsError('internal', error.message || 'Failed to screen resume');
    }
});


/**
 * 2. GENERATE CANDIDATE REPORT (DEEP ANALYSIS)
 * 
 * Generates a detailed analysis report for a candidate.
 */
export const generateCandidateReport = onCall(functionConfig as any, async (request) => {
    const { candidate, job } = request.data;

    if (!candidate || !job) {
        throw new HttpsError('invalid-argument', 'Missing "candidate" or "job" data.');
    }

    logger.info(`Generating report for candidate ${candidate.id}`);

    try {
        const genAI = getGenAIClient();

        // Construct a rich prompt based on available data
        const prompt = `
    You are an expert HR AI Assistant. Your task is to evaluate a candidate's resume against a specific Job Description.
    You must be objective, fair, and consistent.

    JOB TITLE: ${job.title}
    DEPARTMENT: ${job.department}
    JOB DESCRIPTION: 
    ${job.description || "Refer to Title"}

    CANDIDATE: ${candidate.name}
    ROLE: ${candidate.role}
    SUMMARY: ${candidate.summary}
    SKILLS: ${candidate.skills?.join(', ')}
    EXPERIENCE: ${JSON.stringify(candidate.experience || [])}

    SCORING RUBRIC (0-100):
    - 90-100: Exceptional match. Exceeds requirements. "Hire immediately" signal.
    - 80-89:  Strong match. Meets all core requirements. "Move to interview" signal.
    - 70-79:  Good match. Meets most requirements but has minor gaps. "Screen needed".
    - 60-69:  Weak match. Missing key skills or experience. "Review with caution".
    - < 60:   No match. "Reject".

    OUTPUT SCHEMA (JSON ONLY):
    {
      "technicalScore": number, 
      "culturalScore": number, 
      "communicationScore": number, 
      "strengths": string[], 
      "weaknesses": string[], 
      "summary": string, 
      "matchReason": string 
    }
    `;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text || "{}";
        return JSON.parse(text);

    } catch (error: any) {
        logger.error("Error generating report", error);
        throw new HttpsError('internal', error.message || 'Failed to generate report');
    }
});

/**
 * 3. GENERATE INTERVIEW QUESTIONS (AI INTERVIEWER PREP)
 * 
 * Prepares a structured interview guide for the AI Voice Agent or Human Interviewer.
 */
export const generateInterviewQuestions = onCall(functionConfig as any, async (request) => {
    const { candidate, job, type = "Technical" } = request.data;

    if (!candidate || !job) {
        throw new HttpsError('invalid-argument', 'Missing "candidate" or "job" data.');
    }

    try {
        const genAI = getGenAIClient();
        const prompt = `
        JOB TITLE: ${job.title}
        DESCRIPTION: ${job.description}
        CANDIDATE SUMMARY: ${candidate.summary}
        INTERVIEW TYPE: ${type}

        Generate 5 high-impact interview questions.
        Structure:
        1. Icebreaker
        2. Technical Deep Dive (based on resume gaps or strengths)
        3. System Design / Problem Solving
        4. Cultural Fit / Soft Skills
        5. Closing / Candidate Questions

        OUTPUT JSON:
        {
            "questions": [
                { "id": "q1", "category": "Icebreaker", "text": "...", "expectedSignal": "..." },
                ...
            ],
            "focusAreas": ["area1", "area2"]
        }
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        return JSON.parse(response.text || "{}");
    } catch (error: any) {
        logger.error("Error generating interview questions", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 4. ANALYZE INTERVIEW (POST-MORTEM)
 * 
 * Processes the transcript from a voice/video interview to grade performance.
 */
export const analyzeInterview = onCall(functionConfig as any, async (request) => {
    const { transcript, jobTitle } = request.data;

    if (!transcript) {
        throw new HttpsError('invalid-argument', 'Missing "transcript".');
    }

    try {
        const genAI = getGenAIClient();
        const prompt = `
        ROLE: ${jobTitle}
        TRANSCRIPT: 
        ${JSON.stringify(transcript)}

        Analyze this interview.
        1. Calculate an overall score (0-10) based on quality of answers.
        2. Determine sentiment.
        3. Extract key highlights (positive signals, red flags).

        OUTPUT JSON:
        {
            "score": number, // 0-10 float
            "sentiment": "Positive" | "Neutral" | "Negative",
            "summary": "Executive summary of performance...",
            "highlights": [
                { "timestamp": number, "type": "Positive" | "Flag" | "Insight", "text": "..." }
            ]
        }
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        return JSON.parse(response.text || "{}");
    } catch (error: any) {
        logger.error("Error analyzing interview", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 5. START LUMINA SESSION (INTERVIEW ORCHESTRATOR)
 * 
 * Initializes the AI persona and context for the real-time voice session.
 * Moves the "Prompt Engineering" to the backend for security and updates.
 */
export const startInterviewSession = onCall(functionConfig as any, async (request) => {
    const { candidate, job } = request.data;

    if (!candidate || !job) {
        throw new HttpsError('invalid-argument', 'Missing "candidate" or "job".');
    }

    try {
        const genAI = getGenAIClient();

        // 1. Generate Questions dynamically
        const questionsPrompt = `
        JOB: ${job.title}
        CANDIDATE: ${candidate.name} (${candidate.role})
        SUMMARY: ${candidate.summary}

        Generate 3 distinct, high-signal interview questions. 
        Focus on: 1. Technical Depth 2. Problem Solving 3. Communication.
        Return ONLY the questions as a JSON array of strings.
        `;

        const qResponse = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: questionsPrompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = qResponse.text || "[]";
        let questions = [];
        try {
            questions = JSON.parse(text);
        } catch (e) {
            questions = ["Describe your background.", "What is your greatest technical challenge?", "Why this role?"];
        }

        // 2. Construct the System Instruction (Persona)
        const systemInstruction = `
        You are Lumina, a professional, empathetic, yet rigorous technical recruiter for ${job.department} at ${job.company || 'the company'}.
        You are interviewing ${candidate.name} for the ${job.title} role.
        
        YOUR OBJECTIVE:
        Assess the candidate on these key areas using the questions below as a guide.
        
        INTERVIEW GUIDE:
        ${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}
        
        RULES:
        1. Start by welcoming ${candidate.name} and asking them to introduce themselves.
        2. Move naturally to the questions above, but allow for follow-ups.
        3. If they struggle, offer a small hint.
        4. Keep your responses concise (under 30s).
        5. Be conversational, not robotic. Listen more than you speak.
        
        Wait for the user to speak first or initiate if there is silence.
        `;

        return {
            sessionId: `sess_${Date.now()}`,
            systemInstruction: systemInstruction.trim(),
            questions: questions
        };

    } catch (error: any) {
        logger.error("Error starting interview session", error);
        throw new HttpsError('internal', error.message);
    }
});
