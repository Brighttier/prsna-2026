
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

initializeApp();

// Define Secrets (Best Practice: Use Google Secret Manager)
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Configuration for scalable V2 functions
const functionConfig = {
    cors: true,
    region: "us-central1",
    maxInstances: 10,  // Cost control: prevent runaway scaling
    concurrency: 80,   // Performance: handle multiple concurrent requests per instance (I/O bound)
    memory: "512MiB" as const,  // Resource optimization
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

// --- HELPER: Analyze Resume Logic (Shared) ---
async function analyzeResumeContent(resumeText: string, jobDescription: string, autoReportThreshold: number = 80) {
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
        "matchReason": "A one sentence summary of the match.",
        "skills": ["skillA", "skillB"],
        "experience": [{"company": "...", "role": "...", "duration": "...", "description": "..."}],
        "education": [{"school": "...", "degree": "...", "year": "..."}]
      }
      
      Do not include markdown formatting(like \`\`\`json). Just the raw JSON string.
    `;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
        }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    // --- AUTO-REPORT GENERATION LOGIC ---
    if (autoReportThreshold && typeof result.score === 'number' && result.score >= autoReportThreshold) {
        logger.info(`Score ${result.score} >= ${autoReportThreshold}. Generating Deep Report.`);
        const reportPrompt = `
                You are an expert HR AI Assistant. Generate a detailed analysis report based on the resume and job description.
                
                JOB DESCRIPTION: ${jobDescription}
                RESUME CONTENT: ${resumeText}

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

        try {
            const reportResponse = await genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: reportPrompt,
                config: { responseMimeType: 'application/json' }
            });
            result.report = JSON.parse(reportResponse.text || "{}");
        } catch (e) {
            logger.error("Error generating auto-report", e);
        }
    }

    return result;
}

/**
 * 1. AI-POWERED RESUME SCREENING (Manual Trigger)
 */
export const screenResume = onCall(functionConfig as any, async (request) => {
    const { resumeText, jobDescription, autoReportThreshold } = request.data;

    if (!resumeText || !jobDescription) {
        throw new HttpsError('invalid-argument', 'The function must be called with "resumeText" and "jobDescription".');
    }

    logger.info("Screening resume (Manual Trigger)", { resumeLength: resumeText.length });

    try {
        return await analyzeResumeContent(resumeText, jobDescription, autoReportThreshold);
    } catch (error: any) {
        logger.error("Error screening resume", error);
        throw new HttpsError('internal', error.message || 'Failed to screen resume');
    }
});

/**
 * 1.5 AUTOMATIC RESUME PARSER (Storage Trigger)
 * 
 * Triggered when a file is uploaded to: organizations/{orgId}/candidates/{candidateId}/resume_*
 * 1. Parses PDF to Text.
 * 2. Updates Candidate Doc.
 * 3. Runs AI Analysis automatically.
 */
export const onNewResumeUpload = onObjectFinalized({
    memory: "1GiB",
    timeoutSeconds: 300,
    bucket: "persona-recruit-new.firebasestorage.app"
}, async (event) => {
    const filePath = event.data.name; // organization/orgId/candidates/candidateId/resume_name
    const contentType = event.data.contentType;
    const isPdf = contentType?.includes('pdf') || filePath.toLowerCase().endsWith('.pdf');
    const isDocx = contentType?.includes('officedocument.wordprocessingml.document') || filePath.toLowerCase().endsWith('.docx');
    const isDoc = contentType?.includes('application/msword') || filePath.toLowerCase().endsWith('.doc');

    // 1. Validation: Must be a resume in the candidate path and a supported format
    if (!filePath.match(/.*\/candidates\/.*\/resume_.*/) || (!isPdf && !isDocx && !isDoc)) {
        return; // Ignore
    }

    const fileBucket = event.data.bucket;
    const segments = filePath.split('/');
    const orgId = segments[1];
    const candidateId = segments[3];

    logger.info(`Processing new resume for Candidate: ${candidateId} in Org: ${orgId}`);

    try {
        // 2. Download File to Memory
        const bucket = getStorage().bucket(fileBucket);
        const [fileBuffer] = await bucket.file(filePath).download();

        // 3. Extract Text based on format
        let resumeText = '';

        if (isPdf) {
            logger.info("Parsing PDF resume...");
            const data = await pdf(fileBuffer);
            resumeText = data.text;
        } else if (isDocx) {
            logger.info("Parsing DOCX resume...");
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            resumeText = result.value;
        } else if (isDoc) {
            logger.info("Parsing DOC resume...");
            const extractor = new WordExtractor();
            const doc = await extractor.extract(fileBuffer);
            resumeText = doc.getBody();
        }

        if (!resumeText || resumeText.length < 50) {
            logger.warn("Resume text empty or too short.");
            return;
        }

        // 4. Update Candidate with Text (so manual trigger works too)
        const db = getFirestore();
        const candidateRef = db.collection('organizations').doc(orgId).collection('candidates').doc(candidateId);

        await candidateRef.update({
            resumeText: resumeText,
            parsedAt: new Date().toISOString()
        });

        // 5. Fetch Job Description for Analysis
        // We need to know WHICH job this candidate applied for.
        // The candidate doc has 'jobId'.
        const candidateSnap = await candidateRef.get();
        const candidateData = candidateSnap.data();

        if (!candidateData || !candidateData.jobId) {
            logger.warn("Candidate data missing or no jobId found.");
            return;
        }

        const jobRef = db.collection('organizations').doc(orgId).collection('jobs').doc(candidateData.jobId);
        const jobSnap = await jobRef.get();
        const jobData = jobSnap.data();

        if (!jobData || (!jobData.description && !jobData.title)) {
            logger.warn("Job data missing.");
            return;
        }

        const jobDescription = jobData.description || jobData.title; // Fallback

        // 6. Auto-Score (Run AI)
        logger.info("Auto-scoring resume...");
        const result = await analyzeResumeContent(resumeText, jobDescription, 80);

        // 7. Save Results
        const updateData: any = {
            score: result.score,
            matchReason: result.reasoning,
            aiVerdict: result.verdict,
            skills: result.skills || [],
            experience: result.experience || [],
            education: result.education || [],
            summary: result.reasoning, // Use reasoning as initial summary
            analysis: {
                matchScore: result.score,
                verdict: result.verdict,
                metrics: {},
                missingSkills: result.missingSkills || []
            }
        };

        if (result.report) {
            updateData.analysis = {
                ...updateData.analysis,
                technicalScore: result.report.technicalScore,
                culturalScore: result.report.culturalScore,
                communicationScore: result.report.communicationScore,
                strengths: result.report.strengths,
                weaknesses: result.report.weaknesses,
                summary: result.report.summary
            };
        }

        await candidateRef.update(updateData);
        logger.info("Auto-scoring complete!", { score: result.score });

    } catch (error) {
        logger.error("Error processing resume upload", error);
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
        const db = getFirestore();
        const segments = (candidate.resumeUrl || "").split('?')[0].split('/');
        // Ensure path parsing logic is clean

        let resumeText = candidate.resumeText;

        // 1. If resumeText is missing, try to fetch the latest from DB
        if (!resumeText && candidate.jobId) {
            const candidateSnap = await db.collection('organizations').doc(request.data.orgId || "").collection('candidates').doc(candidate.id).get();
            resumeText = candidateSnap.data()?.resumeText;
        }

        // 2. If still missing, try to parse the file from Storage
        if (!resumeText && candidate.resumeUrl) {
            try {
                logger.info("Resume text missing. Attempting to parse from Storage...");
                const bucket = getStorage().bucket();
                // Extract path from URL (rough)
                const pathMatch = candidate.resumeUrl.match(/o\/(.*)\?alt/);
                if (pathMatch) {
                    const storagePath = decodeURIComponent(pathMatch[1]);
                    const [fileBuffer] = await bucket.file(storagePath).download();
                    const contentType = storagePath.toLowerCase();
                    if (contentType.endsWith('.pdf')) {
                        const data = await pdf(fileBuffer);
                        resumeText = data.text;
                    } else if (contentType.endsWith('.docx')) {
                        const result = await mammoth.extractRawText({ buffer: fileBuffer });
                        resumeText = result.value;
                    }

                    if (resumeText) {
                        // Cache it for next time
                        await db.collection('organizations').doc(request.data.orgId || "").collection('candidates').doc(candidate.id).update({
                            resumeText: resumeText
                        });
                    }
                }
            } catch (storageError) {
                logger.error("Failed to recover resume text from storage", storageError);
            }
        }

        const genAI = getGenAIClient();

        // Construct a rich prompt based on available data
        const prompt = `
    You are an expert HR AI Assistant. Your task is to evaluate a candidate's resume against a specific Job Description.
    You must be objective, fair, and consistent. Use the RAW RESUME TEXT as your primary source of truth.

    JOB TITLE: ${job.title}
    DEPARTMENT: ${job.department}
    JOB DESCRIPTION: 
    ${job.description || "Refer to Title"}

    CANDIDATE: ${candidate.name}
    ROLE: ${candidate.role}
    RAW RESUME TEXT: 
    ${resumeText || "NOT PROVIDED - Evaluate based on available summary only."}

    SCORING RUBRIC (0-100):
    - 90-100: Exceptional match. Exceeds requirements.
    - 80-89:  Strong match. Meets all core requirements.
    - 70-79:  Good match. Meets most requirements but has gaps.
    - < 70:   Weak or no match.

    OUTPUT SCHEMA (JSON ONLY):
    {
      "technicalScore": number, 
      "culturalScore": number, 
      "communicationScore": number, 
      "strengths": string[], 
      "weaknesses": string[], 
      "summary": string, 
      "matchReason": string,
      "skills": string[],
      "skillsMatrix": [
        { "skill": "Core Skill", "proficiency": number(0-100), "years": number }
      ],
      "experience": any[],
      "education": any[]
    }
    `;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
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
            model: 'gemini-2.0-flash',
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
            model: 'gemini-2.0-flash',
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
            model: 'gemini-2.0-flash',
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
        const { persona } = request.data;
        const intensity = persona?.intensity || 30;
        const introduction = persona?.introduction || `Welcome ${candidate.name} and asking them to introduce themselves.`;
        const outro = persona?.outro || "Thank you for your time today. Our team will review the session and get back to you soon!";
        const timeLimit = persona?.interviewTimeLimit || 30;

        const systemInstruction = `
        You are Lumina, a professional recruiter for ${job.department} at ${job.company || 'the company'}.
        
        STRESS LEVEL: ${intensity}/100 (0=Casual, 100=Technical Grill). Adjust your tone and follow-up strictness accordingly.
        TIME LIMIT: ${timeLimit} minutes. Start wrapping up politey 3 minutes before the end.
        
        YOUR OBJECTIVE:
        Assess the candidate for the ${job.title} role using the questions below.
        
        INTERVIEW GUIDE:
        ${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}
        
        RULES:
        1. START the interview with exactly this introduction: "${introduction}"
        2. Move naturally to the questions above.
        3. If they struggle, offer small hints if intensity is low, but be more rigorous if intensity is high.
        4. Keep your responses concise (under 30s).
        5. Be conversational. Listen 80% of the time.
        6. END the interview with exactly this outro: "${outro}"
        
        Wait for the user to speak first after your introduction.
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
/**
 * 6. GENERATE JOB DESCRIPTION
 * 
 * Generates a comprehensive and professional job description based on title and department.
 */
export const generateJobDescription = onCall(functionConfig as any, async (request) => {
    const { title, department, location } = request.data;

    if (!title) {
        throw new HttpsError('invalid-argument', 'The function must be called with "title".');
    }

    try {
        const genAI = getGenAIClient();
        const prompt = `
        You are an expert Executive Recruiter and Job Description Writer.
        Your task is to create a comprehensive, professional, and compelling job description for the following role:
        
        ROLE TITLE: ${title}
        DEPARTMENT: ${department || 'General'}
        LOCATION: ${location || 'Remote'}

        The job description should include the following sections:
        1. **Role Overview**: A high-level summary of the position and its impact on the company.
        2. **Key Responsibilities**: A detailed list of what the person will do daily (6-8 bullets).
        3. **Technical Requirements**: Specific skills, tools, and experience levels required (5-7 bullets).
        4. **Soft Skills & Cultural Fit**: Desired behavioral traits (3-4 bullets).
        5. **What We Offer**: Generic but professional benefits and growth opportunities.

        TONE: Professional, modern, and high-standard (Fortune 500 level).
        FORMAT: Markdown.
        
        Return ONLY the job description text. No preamble or JSON wrapping.
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        const description = (response.text || "Failed to generate description.")
            .replace(/^```markdown\s*/, '')
            .replace(/^```\s*/, '')
            .replace(/```$/, '')
            .trim();

        return { description };
    } catch (error: any) {
        logger.error("Error generating job description", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 7. INVITE TEAM MEMBER (Callable)
 * 
 * Creates a Firebase Auth user (if needed), sets custom claims, and records the invitation.
 * The Client is responsible for triggering the "Reset Password" email to notify the user.
 */
export const inviteTeamMember = onCall(functionConfig as any, async (request) => {
    const { email, role, orgId } = request.data;

    if (!email || !role || !orgId) {
        throw new HttpsError('invalid-argument', 'Missing email, role, or orgId.');
    }

    const auth = getAuth();
    const db = getFirestore();
    let uid;
    let isNewUser = false;

    try {
        // 1. Check if user exists
        try {
            const userRecord = await auth.getUserByEmail(email);
            uid = userRecord.uid;
            logger.info(`User ${email} already exists with UID: ${uid}`);
        } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
                // 2. Create new user
                logger.info(`Creating new user for ${email}`);
                const newUser = await auth.createUser({
                    email: email,
                    emailVerified: true // Trusting the admin invite
                });
                uid = newUser.uid;
                isNewUser = true;
            } else {
                throw e;
            }
        }

        // 3. Set Custom Claims (Org ID and Role)
        await auth.setCustomUserClaims(uid, { orgId, role });

        // 4. Create/Update Invitation Record in Firestore
        // Use set with merge to avoiding duplicates if re-inviting
        const inviteId = btoa(email).replace(/=/g, ''); // Simple deterministic ID
        await db.collection('organizations').doc(orgId).collection('invitations').doc(inviteId).set({
            email,
            role,
            status: isNewUser ? 'pending_signup' : 'active',
            invitedAt: new Date().toISOString(),
            uid: uid
        }, { merge: true });

        // 5. Add to Users collection for easier querying
        await db.collection('users').doc(uid).set({
            email,
            role,
            orgId,
            createdAt: new Date().toISOString()
        }, { merge: true });

        return { success: true, isNewUser, uid };

    } catch (error: any) {
        logger.error("Error inviting team member", error);
        throw new HttpsError('internal', error.message);
    }
});
