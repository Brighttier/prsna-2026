
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

initializeApp();

// Define Secrets (Best Practice: Use Google Secret Manager)
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");

import { sendSecureLinkEmail } from './utils/email';
import { generateEmbedding, calculateCosineSimilarity } from './utils/embeddings';

// Configuration for scalable V2 functions
const functionConfig = {
    cors: true,
    region: "us-central1",
    maxInstances: 10,  // Cost control: prevent runaway scaling
    concurrency: 80,   // Performance: handle multiple concurrent requests per instance (I/O bound)
    memory: "512MiB" as const,  // Resource optimization
    timeoutSeconds: 120, // GenAI can be slow
    secrets: [geminiApiKey, resendApiKey] // Secure access to API key
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

// --- HELPER: Extract text from any document using Gemini multimodal ---
const MIME_MAP: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword'
};

async function extractTextFromFile(fileBuffer: Buffer, filePath: string): Promise<string> {
    const ext = '.' + filePath.toLowerCase().split('.').pop();
    const mimeType = MIME_MAP[ext];
    if (!mimeType) return '';

    const genAI = getGenAIClient();
    const base64 = fileBuffer.toString('base64');

    const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: 'Extract ALL text content from this document verbatim. Return only the raw text, preserving structure. Do not summarize or interpret.' }
                ]
            }
        ]
    });

    return response.text?.trim() || '';
}

// --- HELPER: Analyze Resume Logic (Shared) ---
async function analyzeResumeContent(resumeText: string, jobDescription: string) {
    const genAI = getGenAIClient();
    logger.info(`Analyzing resume with text length: ${resumeText?.length || 0}`);

    const prompt = `
      You are an expert technical recruiter and AI analyst. 
      Analyze the provided resume against the job description.

      JOB DESCRIPTION:
      ${jobDescription}

      CANDIDATE RESUME CONTENT:
      ${resumeText}

      INSTRUCTIONS:
      1. Extract candidate details (name, email, skills, experience, education).
      2. Evaluate Match: Calculate scores (0-100) for Technical, Cultural, and Communication alignment.
      3. Overall Score: Provide a single "score" (0-100) representing the overall match.
      4. Verdict: One of "Proceed", "Review", or "Reject".
      5. Reasoning: A concise match reason and professional summary.

      OUTPUT SCHEMA (JSON ONLY):
      {
        "name": "Candidate Name",
        "email": "candidate@email.com",
        "score": number(0-100), 
        "verdict": "Proceed" | "Review" | "Reject",
        "matchReason": "A one sentence summary of the match.",
        "summary": "A high-level professional summary of the candidate.",
        "skills": ["skill1", "skill2"],
        "skillsMatrix": [
          { "skill": "Core Skill", "proficiency": number(0-100), "years": number }
        ],
        "experience": [{"company": "...", "role": "...", "duration": "...", "description": "..."}],
        "education": [{"school": "...", "degree": "...", "year": "..."}],
        "intelligence": {
          "technicalScore": number,
          "culturalScore": number,
          "communicationScore": number,
          "strengths": string[],
          "weaknesses": string[],
          "missingSkills": string[]
        }
      }

      Return ONLY the JSON. No markdown backticks.
    `;

    try {
        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const result = JSON.parse(text);

        // Ensure overall score is present
        if (result && !result.score && result.intelligence?.technicalScore) {
            result.score = result.intelligence.technicalScore;
        }

        return result;
    } catch (error: any) {
        logger.error("Gemini analysis error", error);
        throw error;
    }
}

/**
 * 1. MANUAL RESUME SCREENING (IMMEDIATE)
 * 
 * Used for the "Resume Screener" dashboard and "Verification" after candidate upload.
 * Can handle raw text OR a Storage URL.
 */
export const screenResume = onCall(functionConfig as any, async (request) => {
    let { resumeText, jobDescription } = request.data;

    if (!resumeText || !jobDescription) {
        throw new HttpsError('invalid-argument', 'The function must be called with "resumeText" and "jobDescription".');
    }

    // Support for URL instead of raw text (Handles immediate verification after upload)
    if (resumeText.startsWith('http') || resumeText.startsWith('gs://')) {
        logger.info(`Screening from URL: ${resumeText}`);
        try {
            const urlObj = new URL(resumeText);
            const bucketName = urlObj.pathname.split('/b/')[1]?.split('/o/')[0];
            const bucket = bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();
            const pathWithMedia = urlObj.pathname.split('/o/')[1];

            if (pathWithMedia) {
                const storagePath = decodeURIComponent(pathWithMedia).split('?')[0];
                const [fileBuffer] = await bucket.file(storagePath).download();

                resumeText = await extractTextFromFile(fileBuffer, storagePath);
            }
        } catch (e) {
            logger.error("Failed to recover text from URL during screening", e);
            throw new HttpsError('internal', 'Could not extract text from the provided resume file.');
        }
    }

    if (!resumeText || resumeText.length < 50) {
        throw new HttpsError('invalid-argument', 'Resume text is too short or could not be extracted.');
    }

    logger.info("Screening resume (Manual Trigger)", { resumeLength: resumeText.length });

    try {
        return await analyzeResumeContent(resumeText, jobDescription);
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
    secrets: [geminiApiKey]
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
    const segments = filePath.split('/').filter(s => s.length > 0);
    let orgId = '';
    let candidateId = '';

    // Robust ID Extraction: Look for 'candidates' segment
    // Path examples: 
    // 1. organizations/ORG_ID/candidates/CAND_ID/resume_...
    // 2. ORG_ID/candidates/CAND_ID/resume_...
    const candIndex = segments.findIndex(s => s.toLowerCase() === 'candidates');
    if (candIndex >= 1) {
        candidateId = segments[candIndex + 1];
        orgId = segments[candIndex - 1]; // Works for both formats
    }

    if (!orgId || !candidateId) {
        logger.error(`Failed to extract IDs from path: ${filePath}`, { segments });
        return;
    }

    logger.info(`Processing Resume: Org=${orgId}, Candidate=${candidateId}`);

    try {
        const db = getFirestore();

        // 2. Fetch Org Settings for Auto-Reporting
        const orgSnap = await db.collection('organizations').doc(orgId).get();
        const settings = orgSnap.data()?.settings?.persona || { autoReportThreshold: 80, autoReportEnabled: true };

        // 3. Download File to Memory
        const bucket = getStorage().bucket(fileBucket);
        const [fileBuffer] = await bucket.file(filePath).download();
        logger.info(`Downloaded ${fileBuffer.length} bytes`);

        // 4. Extract Text (Gemini Document AI for PDFs, mammoth/word-extractor for Office)
        const fileName = filePath.split('/').pop() || filePath;
        logger.info(`Parsing file: ${fileName}`);
        let resumeText = await extractTextFromFile(fileBuffer, fileName);

        resumeText = resumeText.trim();

        if (!resumeText || resumeText.length < 50) {
            logger.warn(`Insufficient text: ${resumeText.length} chars.`);
            await db.collection('organizations').doc(orgId).collection('candidates').doc(candidateId).update({
                resumeText: 'FAILED_TO_PARSE: Unreadable file.',
                parsedAt: new Date().toISOString()
            });
            return;
        }

        const candidateRef = db.collection('organizations').doc(orgId).collection('candidates').doc(candidateId);
        const candidateSnap = await candidateRef.get();
        const candidateData = candidateSnap.data();

        if (!candidateData) {
            logger.warn("Candidate doc missing.");
            return;
        }

        // 5. Fetch Job Description
        let jobData = null;
        if (candidateData.jobId) {
            const jobSnap = await db.collection('organizations').doc(orgId).collection('jobs').doc(candidateData.jobId).get();
            jobData = jobSnap.data();
        }
        if (!jobData && candidateData.role) {
            const jobsSnap = await db.collection('organizations').doc(orgId).collection('jobs').where('title', '==', candidateData.role).limit(1).get();
            if (!jobsSnap.empty) jobData = jobsSnap.docs[0].data();
        }

        if (!jobData) {
            logger.warn("No matching job found. Saving parsed text only — no AI analysis without a job.");
            await candidateRef.update({
                resumeText,
                parsedAt: new Date().toISOString()
            });
            return;
        }

        // 6. AI Analysis
        logger.info(`Analyzing with Gemini... (Text: ${resumeText.length} chars)`);
        const result = await analyzeResumeContent(resumeText, jobData.description || jobData.title);
        const finalScore = result.score || result.intelligence?.technicalScore || 0;

        // 6b. Vector Embeddings & Similarity Matching
        let vectorScore = 0;
        let resumeEmbedding: number[] = [];
        try {
            const apiKey = geminiApiKey.value();
            if (apiKey) {
                // Generate Resume Embedding
                // We construct a rich representation for the embedding
                const textToEmbed = `
                Candidate: ${result.name || candidateData.name || 'Unknown'}
                Role: ${candidateData.role || 'Unknown'}
                Skills: ${(result.skills || []).join(', ')}
                Summary: ${result.summary || ''}
                Experience: ${(result.experience || []).map((e: any) => `${e.role} at ${e.company}`).join('; ')}
                EXTRACT: ${resumeText.substring(0, 4000)}
                `.trim();

                resumeEmbedding = await generateEmbedding(apiKey, textToEmbed);

                // Check/Generate Job Embedding
                if (jobData && (!jobData.embedding || jobData.embedding.length === 0)) {
                    logger.info(`Generating missing embedding for Job ${candidateData.jobId || 'Unknown'}`);
                    const jobText = `
                    Title: ${jobData.title}
                    Description: ${jobData.description}
                    Requirements: ${(jobData.requirements || []).join(', ')}
                    `.trim();

                    const jobEmbedding = await generateEmbedding(apiKey, jobText);

                    if (jobEmbedding.length > 0 && candidateData.jobId) {
                        // Update Job Doc - do this in background to not block too long, but await for this flow
                        await db.collection('organizations').doc(orgId).collection('jobs').doc(candidateData.jobId).update({
                            embedding: jobEmbedding
                        });
                        jobData.embedding = jobEmbedding;
                    }
                }

                if (jobData && jobData.embedding) {
                    const cosine = calculateCosineSimilarity(resumeEmbedding, jobData.embedding);
                    vectorScore = Math.round(cosine * 100);
                    logger.info(`Vector Match Score: ${vectorScore}`);
                }
            }
        } catch (embedError) {
            logger.error("Embedding generation failed", embedError);
        }

        // Threshold Logic
        const meetsThreshold = settings.autoReportEnabled && finalScore >= (settings.autoReportThreshold || 80);

        // 7. Dynamic Map & Save
        const updateData: any = {
            resumeText,
            name: candidateData.name && !candidateData.name.includes('...') ? candidateData.name : (result.name || candidateData.name),
            email: candidateData.email || result.email || '',
            score: finalScore,
            skills: result.skills || [],
            experience: (result.experience || []).map((exp: any, i: number) => ({ id: `exp_${i}`, ...exp })),
            education: (result.education || []).map((edu: any, i: number) => ({ id: `edu_${i}`, ...edu })),
            parsedAt: new Date().toISOString(),
            embedding: resumeEmbedding,
            vectorMatchScore: vectorScore
        };

        // Only save "Report" fields if threshold met
        if (meetsThreshold) {
            logger.info(`Auto-generating report for score: ${finalScore}`);
            updateData.matchReason = result.matchReason || result.summary;
            updateData.aiVerdict = result.verdict || 'Review';
            updateData.summary = result.summary;
            updateData.analysis = {
                matchScore: finalScore,
                verdict: result.verdict || 'Review',
                technicalScore: result.intelligence?.technicalScore || finalScore,
                culturalScore: result.intelligence?.culturalScore || 0,
                communicationScore: result.intelligence?.communicationScore || 0,
                strengths: result.intelligence?.strengths || [],
                weaknesses: result.intelligence?.weaknesses || [],
                missingSkills: result.intelligence?.missingSkills || [],
                skillsMatrix: result.skillsMatrix || []
            };
        } else {
            logger.info(`Score ${finalScore} below threshold. Report withheld.`);
            // Clear old report if any, or just don't set
            updateData.summary = "Resume parsed. Full AI report available on request.";
            updateData.matchReason = "Match score generated. High-depth analysis withheld due to organization settings.";
        }

        await candidateRef.update(updateData);
        logger.info(`Sync complete for ${candidateId}. Auto-Report: ${meetsThreshold}`);

    } catch (error) {
        logger.error("Global processing error in onNewResumeUpload", error);
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
        let orgId = request.data.orgId;

        logger.info(`Report Request for Candidate: ${candidate.id}, Org: ${orgId}`);

        // Extract orgId from resumeUrl if missing (Handles: .../o/ORG_ID/candidates/...)
        if (!orgId && candidate.resumeUrl) {
            try {
                const url = new URL(candidate.resumeUrl);
                const path = decodeURIComponent(url.pathname.split('/o/')[1]);
                const segments = path.split('/');
                logger.info(`Storage Path Segments: ${segments.join(' | ')}`);

                if (segments[0] === 'organizations') {
                    orgId = segments[1];
                } else {
                    orgId = segments[0];
                }
                logger.info(`Extracted orgId from URL: ${orgId}`);
            } catch (e) {
                logger.error("Failed to extract orgId from resumeUrl", e);
            }
        }

        let resumeText = candidate.resumeText;

        // 1. If resumeText is missing, try to fetch the latest from DB
        if (!resumeText && orgId) {
            try {
                const candidateSnap = await db.collection('organizations').doc(orgId).collection('candidates').doc(candidate.id).get();
                const freshData = candidateSnap.data();
                resumeText = freshData?.resumeText;

                // If still missing, check if we have the URL in the fresh data
                if (!resumeText && freshData?.resumeUrl) {
                    candidate.resumeUrl = freshData.resumeUrl;
                }
            } catch (snapError) {
                logger.warn(`Failed to fetch fresh candidate data: ${snapError}`);
            }
        }

        // 2. If still missing, try to parse the file from Storage
        if (!resumeText && candidate.resumeUrl) {
            try {
                logger.info(`Attempting Storage Recovery from: ${candidate.resumeUrl}`);
                const urlObj = new URL(candidate.resumeUrl);

                // Extract bucket name (Handles: firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/...)
                const bucketName = urlObj.pathname.split('/b/')[1]?.split('/o/')[0];
                const bucket = bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();

                const pathWithMedia = urlObj.pathname.split('/o/')[1];

                if (pathWithMedia) {
                    const storagePath = decodeURIComponent(pathWithMedia).split('?')[0];
                    logger.info(`Bucket: ${bucket.name}, Path: ${storagePath}`);

                    const [fileBuffer] = await bucket.file(storagePath).download();
                    resumeText = await extractTextFromFile(fileBuffer, storagePath);

                    if (resumeText && orgId) {
                        logger.info(`Success! Parsed ${resumeText.length} chars. Caching to DB...`);
                        await db.collection('organizations').doc(orgId).collection('candidates').doc(candidate.id).update({
                            resumeText: resumeText,
                            parsedAt: new Date().toISOString()
                        });
                    }
                }
            } catch (storageError) {
                logger.error("Storage Recovery Failed", storageError);
            }
        }

        if (!resumeText || resumeText.length < 50) {
            logger.warn("CRITICAL: No resume text recovered or text too short.");
            // We can't really analyze, but lets provide a graceful failure message 
            // instead of letting the AI hallucinate.
            return {
                score: 0,
                verdict: 'Review',
                matchReason: 'Resume data could not be extracted for analysis. Please check the file format.',
                summary: 'Analysis incomplete due to missing resume data.',
                intelligence: {
                    technicalScore: 0,
                    culturalScore: 0,
                    communicationScore: 0,
                    strengths: ["Unknown (Resume missing)"],
                    weaknesses: ["Parsing Failed"],
                    missingSkills: []
                }
            };
        }

        const jobDescription = job.description || job.title;
        return await analyzeResumeContent(resumeText, jobDescription);

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
    const { candidate, job, orgId } = request.data;

    if (!candidate || !job) {
        throw new HttpsError('invalid-argument', 'Missing "candidate" or "job".');
    }

    try {
        const db = getFirestore();
        const genAI = getGenAIClient();

        let knowledgeBaseContent = "";
        let manualQuestions: any[] = [];

        // 1. Fetch Assessment Context if available
        if (orgId && (job.screening || job.technical)) {
            const assessmentIds = [job.screening, job.technical].filter(Boolean);
            for (const id of assessmentIds) {
                const assessSnap = await db.collection('organizations').doc(orgId).collection('assessments').doc(id).get();
                if (assessSnap.exists) {
                    const data = assessSnap.data();
                    if (data?.sourceMode === 'knowledgeBase' && data?.knowledgeBase?.content) {
                        knowledgeBaseContent += `\n--- SOURCE: ${data.name} ---\n${data.knowledgeBase.content}\n`;
                    }
                    if (data?.questions && data.questions.length > 0) {
                        manualQuestions = [...manualQuestions, ...data.questions];
                    }
                }
            }
        }

        // 2. Generate Questions dynamically with Context
        const questionsPrompt = `
        JOB: ${job.title}
        DESCRIPTION: ${job.description}
        CANDIDATE: ${candidate.name} (${candidate.role})
        CANDIDATE SUMMARY: ${candidate.summary}

        ${knowledgeBaseContent ? `KNOWLEDGE BASE CONTEXT:\n${knowledgeBaseContent}\n` : ''}
        ${manualQuestions.length > 0 ? `PRE-DEFINED QUESTIONS:\n${manualQuestions.map(q => `- ${q.text} (Eval: ${q.criteria || q.aiEvaluationCriteria})`).join('\n')}\n` : ''}

        INSTRUCTIONS:
        Generate exactly 4 distinct, high-signal interview questions for this session.
        1. If manual questions are provided, use or adapt them.
        2. If knowledge base content is provided, generate questions specifically testing understanding of that material.
        3. If no specific context is present, focus on general Technical Depth, Problem Solving, and Communication.
        
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

        // 3. Construct the System Instruction (Persona)
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
 * Sends a secure invitation link via Resend.
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

        // 6. Generate Password Reset Link (Secure Link)
        const link = await auth.generatePasswordResetLink(email);

        // 7. Send Invitation Email via Resend
        if (resendApiKey.value()) {
            await sendSecureLinkEmail({
                to: email,
                link: link,
                type: 'INVITATION',
                role,
                apiKey: resendApiKey.value()
            });
            logger.info(`Invitation email sent to ${email}`);
        } else {
            logger.warn("RESEND_API_KEY not set. Email not sent.");
        }

        return { success: true, isNewUser, uid };


    } catch (error: any) {
        logger.error("Error inviting team member", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 8. REQUEST PASSWORD RESET (Callable)
 * 
 * Generates a password reset link and sends it via Resend.
 * Replaces the default Firebase client-side email trigger.
 */
// 8. REQUEST PASSWORD RESET
export const requestPasswordReset = onCall(functionConfig as any, async (request) => {
    const { email } = request.data;

    if (!email) {
        throw new HttpsError('invalid-argument', 'The function must be called with "email".');
    }

    try {
        const auth = getAuth();
        const link = await auth.generatePasswordResetLink(email);

        if (resendApiKey.value()) {
            await sendSecureLinkEmail({
                to: email,
                link: link,
                type: 'RESET_PASSWORD',
                apiKey: resendApiKey.value()
            });
            return { success: true };
        } else {
            logger.warn("RESEND_API_KEY not set. Email not sent.");
            return { success: false, error: 'Email service not configured.' };
        }
    } catch (error: any) {
        logger.error("Error sending password reset email", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 9. SEND OFFER LETTER EMAIL (Callable)
 * 
 * Sends an offer letter email to the candidate.
 */
export const sendOfferLetter = onCall(functionConfig as any, async (request) => {
    const { email, jobTitle, companyName, offerUrl } = request.data;

    if (!email || !jobTitle) {
        throw new HttpsError('invalid-argument', 'Missing "email" or "jobTitle".');
    }

    try {
        if (resendApiKey.value()) {
            await sendSecureLinkEmail({
                to: email,
                link: offerUrl, // This should point to the public offer page
                type: 'OFFER',
                jobTitle,
                companyName,
                apiKey: resendApiKey.value()
            });
            return { success: true };
        } else {
            logger.warn("RESEND_API_KEY not set. Email not sent.");
            return { success: false, error: 'Email service not configured.' };
        }
    } catch (error: any) {
        logger.error("Error sending offer email", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 10. SEND AI INTERVIEW INVITE (Callable)
 * 
 * Sends an AI interview invitation email to the candidate.
 */
export const sendAiInterviewInvite = onCall(functionConfig as any, async (request) => {
    const { email, jobTitle, interviewUrl } = request.data;

    if (!email || !jobTitle || !interviewUrl) {
        throw new HttpsError('invalid-argument', 'Missing "email", "jobTitle", or "interviewUrl".');
    }

    try {
        if (resendApiKey.value()) {
            await sendSecureLinkEmail({
                to: email,
                link: interviewUrl,
                type: 'INTERVIEW_INVITE',
                jobTitle,
                apiKey: resendApiKey.value()
            });
            return { success: true };
        } else {
            logger.warn("RESEND_API_KEY not set. Email not sent.");
            return { success: false, error: 'Email service not configured.' };
        }
    } catch (error: any) {
        logger.error("Error sending interview invite", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 11. SEND APPLICATION RECEIPT (Callable)
 * 
 * Sends a confirmation email to the candidate after they apply.
 */
export const sendApplicationReceipt = onCall(functionConfig as any, async (request) => {
    const { email, jobTitle, candidateName } = request.data;

    if (!email || !jobTitle) {
        throw new HttpsError('invalid-argument', 'Missing "email" or "jobTitle".');
    }

    try {
        if (resendApiKey.value()) {
            await sendSecureLinkEmail({
                to: email,
                type: 'APPLICATION_RECEIPT',
                jobTitle,
                name: candidateName,
                apiKey: resendApiKey.value()
            });
            return { success: true };
        } else {
            logger.warn("RESEND_API_KEY not set. Email not sent.");
            return { success: false, error: 'Email service not configured.' };
        }
    } catch (error: any) {
        logger.error("Error sending application receipt", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 12. SEND REJECTION EMAIL (Callable)
 * 
 * Sends a polite rejection email to the candidate.
 */
export const sendRejectionEmail = onCall(functionConfig as any, async (request) => {
    const { email, jobTitle, candidateName } = request.data;

    if (!email || !jobTitle) {
        throw new HttpsError('invalid-argument', 'Missing "email" or "jobTitle".');
    }

    try {
        if (resendApiKey.value()) {
            await sendSecureLinkEmail({
                to: email,
                type: 'REJECTION',
                jobTitle,
                name: candidateName,
                apiKey: resendApiKey.value()
            });
            return { success: true };
        } else {
            logger.warn("RESEND_API_KEY not set. Email not sent.");
            return { success: false, error: 'Email service not configured.' };
        }
    } catch (error: any) {
        logger.error("Error sending rejection email", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 13. SEND ONBOARDING INVITE (Callable)
 * 
 * Sends an onboarding invitation to a hired candidate.
 */
export const sendOnboardingInvite = onCall(functionConfig as any, async (request) => {
    const { email, jobTitle, candidateName, onboardingUrl } = request.data;

    if (!email || !jobTitle || !onboardingUrl) {
        throw new HttpsError('invalid-argument', 'Missing "email", "jobTitle", or "onboardingUrl".');
    }

    try {
        if (resendApiKey.value()) {
            await sendSecureLinkEmail({
                to: email,
                link: onboardingUrl,
                type: 'ONBOARDING_INVITE',
                jobTitle,
                name: candidateName,
                apiKey: resendApiKey.value()
            });
            return { success: true };
        } else {
            logger.warn("RESEND_API_KEY not set. Email not sent.");
            return { success: false, error: 'Email service not configured.' };
        }
    } catch (error: any) {
        logger.error("Error sending onboarding invite", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * 15. RESOLVE INTERVIEW TOKEN (Callable)
 *
 * Resolves an interview invite token to candidate/session data.
 * Does NOT require authentication — candidates access this without login.
 */
export const resolveInterviewToken = onCall(functionConfig as any, async (request) => {
    const { token } = request.data;

    if (!token) {
        throw new HttpsError('invalid-argument', 'Missing "token".');
    }

    try {
        const db = getFirestore();
        const inviteDoc = await db.collection('interviewInvites').doc(token).get();

        if (!inviteDoc.exists) {
            throw new HttpsError('not-found', 'Invalid or expired interview link.');
        }

        const invite = inviteDoc.data()!;

        // Fetch the candidate doc to get the upcoming AI interview session
        const candidateDoc = await db
            .collection('organizations')
            .doc(invite.orgId)
            .collection('candidates')
            .doc(invite.candidateId)
            .get();

        if (!candidateDoc.exists) {
            throw new HttpsError('not-found', 'Candidate not found.');
        }

        const candidateData = candidateDoc.data()!;
        const interviews = candidateData.interviews || [];
        const session = interviews.find((i: any) => i.token === token && i.status === 'Upcoming');

        return {
            candidateId: invite.candidateId,
            candidateName: invite.candidateName,
            jobTitle: invite.jobTitle,
            orgId: invite.orgId,
            assessmentId: invite.assessmentId || session?.assessmentId || null,
            sessionId: session?.id || null,
        };
    } catch (error: any) {
        if (error.code) throw error; // Re-throw HttpsError
        logger.error("Error resolving interview token", error);
        throw new HttpsError('internal', 'Failed to resolve interview token.');
    }
});

