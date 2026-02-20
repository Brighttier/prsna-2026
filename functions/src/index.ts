
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

initializeApp();

// Define Secrets (Best Practice: Use Google Secret Manager)
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");

// Google Meet — Service Account JSON (base64 encoded) for Calendar API
const googleServiceAccountKey = defineSecret("GOOGLE_SERVICE_ACCOUNT_KEY");

// DocuSign — ISV Connector / JWT Grant secrets
const docusignIntegrationKey = defineSecret("DOCUSIGN_INTEGRATION_KEY");
const docusignUserId = defineSecret("DOCUSIGN_USER_ID");
const docusignAccountId = defineSecret("DOCUSIGN_ACCOUNT_ID");
const docusignPrivateKey = defineSecret("DOCUSIGN_RSA_PRIVATE_KEY"); // PEM, base64 encoded

// Microsoft Teams — Azure AD / Entra ID app registration
const msTeamsTenantId = defineSecret("MS_TEAMS_TENANT_ID");
const msTeamsClientId = defineSecret("MS_TEAMS_CLIENT_ID");
const msTeamsClientSecret = defineSecret("MS_TEAMS_CLIENT_SECRET");
const msTeamsOrganizerId = defineSecret("MS_TEAMS_ORGANIZER_ID");

import { sendSecureLinkEmail } from './utils/email';
import { generateEmbedding, calculateCosineSimilarity } from './utils/embeddings';

// Helper: Fetch org-specific email template override from Firestore
async function getEmailTemplateOverride(orgId: string | undefined, emailType: string) {
    if (!orgId) return undefined;
    try {
        const db = getFirestore();
        const orgDoc = await db.collection('organizations').doc(orgId).get();
        const data = orgDoc.data();
        return data?.settings?.emailTemplates?.[emailType] || undefined;
    } catch (e) {
        logger.warn(`Failed to fetch email template override for ${orgId}/${emailType}`, e);
        return undefined;
    }
}

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
const getGenAIClient = async () => {
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY secret is not set.");
    }
    const { GoogleGenAI } = await import("@google/genai");
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

    const genAI = await getGenAIClient();
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
    const genAI = await getGenAIClient();
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
        "phone": "extracted phone number or empty string",
        "linkedin": "LinkedIn profile URL or empty string",
        "github": "GitHub profile URL or empty string",
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
            phone: result.phone || candidateData.phone || '',
            linkedin: result.linkedin || candidateData.linkedin || '',
            github: result.github || candidateData.github || '',
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
        const genAI = await getGenAIClient();
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
        const genAI = await getGenAIClient();
        const prompt = `
        ROLE: ${jobTitle}
        TRANSCRIPT:
        ${JSON.stringify(transcript)}

        Analyze this interview thoroughly.
        1. Calculate an overall score (0-10) based on quality of answers.
        2. Determine sentiment.
        3. Extract key highlights (positive signals, red flags, insights).
        4. Proctoring analysis: Look for any signs in the transcript that suggest potential integrity concerns during the interview, such as:
           - The interviewer mentioning the candidate appeared distracted or was looking elsewhere
           - Signs of someone else providing answers (unnaturally perfect responses after pauses, sudden change in vocabulary/sophistication)
           - The interviewer noting background activity or other people present
           - Inconsistent response quality suggesting external help
           Rate integrity as "Clean", "Minor Concerns", or "Flagged" with specific observations.

        OUTPUT JSON:
        {
            "score": number, // 0-10 float
            "sentiment": "Positive" | "Neutral" | "Negative",
            "summary": "Executive summary of performance...",
            "highlights": [
                { "timestamp": number, "type": "Positive" | "Flag" | "Insight", "text": "..." }
            ],
            "proctoring": {
                "integrity": "Clean" | "Minor Concerns" | "Flagged",
                "observations": ["List of specific proctoring observations, empty if clean"]
            }
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
    const { candidate, job, orgId, assessmentId } = request.data;

    if (!candidate || !job) {
        throw new HttpsError('invalid-argument', 'Missing "candidate" or "job".');
    }

    try {
        const db = getFirestore();
        const genAI = await getGenAIClient();

        let knowledgeBaseContent = "";
        let manualQuestions: any[] = [];

        // 1. Fetch Assessment Context
        if (orgId) {
            // If a specific assessmentId is provided, use ONLY that assessment
            // Otherwise fall back to job-linked screening/technical assessments
            const assessmentIds = assessmentId
                ? [assessmentId]
                : [job.screening, job.technical].filter(Boolean);

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

        // 2. Build questions — use manual questions as-is, or generate from context
        let questions: string[] = [];

        if (manualQuestions.length > 0) {
            // Use the admin's questions verbatim — they defined them for a reason
            questions = manualQuestions.map(q => q.text);
        } else if (knowledgeBaseContent) {
            // Generate questions from knowledge base content
            const questionsPrompt = `
            JOB: ${job.title}
            DESCRIPTION: ${job.description || ''}
            CANDIDATE: ${candidate.name} (${candidate.role})

            KNOWLEDGE BASE CONTEXT:
            ${knowledgeBaseContent}

            Generate exactly 4 interview questions that specifically test the candidate's understanding of the knowledge base material above, appropriate for the ${job.title} role.
            Return ONLY the questions as a JSON array of strings.
            `;

            const qResponse = await genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: questionsPrompt,
                config: { responseMimeType: 'application/json' }
            });

            try {
                questions = JSON.parse(qResponse.text || "[]");
            } catch (e) {
                questions = ["Describe your background.", "What interests you about this role?", "Walk me through a relevant project."];
            }
        } else {
            // No assessment context — generate general questions for the role
            const questionsPrompt = `
            JOB: ${job.title}
            DESCRIPTION: ${job.description || ''}
            CANDIDATE: ${candidate.name} (${candidate.role})
            CANDIDATE SUMMARY: ${candidate.summary || ''}

            Generate exactly 4 interview questions focused on assessing this candidate for the ${job.title} role.
            Focus on: relevant experience, problem solving, and communication.
            Return ONLY the questions as a JSON array of strings.
            `;

            const qResponse = await genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: questionsPrompt,
                config: { responseMimeType: 'application/json' }
            });

            try {
                questions = JSON.parse(qResponse.text || "[]");
            } catch (e) {
                questions = ["Describe your background.", "What is your greatest technical challenge?", "Why this role?"];
            }
        }

        // 3. Construct the System Instruction (Persona)
        const { persona } = request.data;
        const intensity = persona?.intensity || 30;
        const introduction = persona?.introduction || `Welcome ${candidate.name} and asking them to introduce themselves.`;
        const outro = persona?.outro || "Thank you for your time today. Our team will review the session and get back to you soon!";
        const timeLimit = persona?.interviewTimeLimit || 30;

        const hasManualQuestions = manualQuestions.length > 0;
        const systemInstruction = `
        You are Lumina, a professional recruiter for ${job.department || 'the team'} at ${job.company || 'the company'}.

        STRESS LEVEL: ${intensity}/100 (0=Casual, 100=Technical Grill). Adjust your tone and follow-up strictness accordingly.
        TIME LIMIT: ${timeLimit} minutes. Start wrapping up politely 3 minutes before the end.

        YOUR OBJECTIVE:
        Assess the candidate for the ${job.title} role using the questions below.

        INTERVIEW QUESTIONS:
        ${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

        RULES:
        1. START the interview with exactly this introduction: "${introduction}"
        2. Ask each question above ${hasManualQuestions ? 'EXACTLY as written — do NOT rephrase or substitute them' : 'naturally, adapting your phrasing to keep the conversation flowing'}.
        3. After each answer, you may ask ONE brief follow-up before moving to the next question.
        4. If they struggle, offer small hints if intensity is low, but be more rigorous if intensity is high.
        5. Keep your responses concise (under 30s of speaking).
        6. Be conversational. Listen 80% of the time.
        7. END the interview with exactly this outro: "${outro}"
        8. Once you have finished the outro, do NOT continue the conversation. The interview is complete.

        PROCTORING:
        You can see the candidate's video feed. While conducting the interview, silently observe for:
        - Another person visible in the background or whispering answers
        - Candidate frequently looking away at another screen or device
        - Someone off-camera dictating or feeding answers
        - Unusual eye movements suggesting reading from hidden notes
        - Significant background activity or environment changes
        Do NOT confront the candidate about suspicious behavior. Simply continue the interview normally.
        If you notice anything, subtly mention it in your conversation (e.g. "I notice you seem distracted" or "take your time") so it appears in context.

        Begin the interview IMMEDIATELY with your introduction. Do NOT wait for the candidate to speak first.
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
        const genAI = await getGenAIClient();
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
            const templateOverride = await getEmailTemplateOverride(orgId, 'INVITATION');
            await sendSecureLinkEmail({
                to: email,
                link: link,
                type: 'INVITATION',
                role,
                apiKey: resendApiKey.value(),
                templateOverride
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
    const { email, jobTitle, companyName, offerUrl, orgId } = request.data;

    if (!email || !jobTitle) {
        throw new HttpsError('invalid-argument', 'Missing "email" or "jobTitle".');
    }

    try {
        if (resendApiKey.value()) {
            const templateOverride = await getEmailTemplateOverride(orgId, 'OFFER');
            await sendSecureLinkEmail({
                to: email,
                link: offerUrl,
                type: 'OFFER',
                jobTitle,
                companyName,
                apiKey: resendApiKey.value(),
                templateOverride
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
    const { email, jobTitle, interviewUrl, token, orgId, candidateId, candidateName, assessmentId } = request.data;

    if (!email || !jobTitle || !interviewUrl) {
        throw new HttpsError('invalid-argument', 'Missing "email", "jobTitle", or "interviewUrl".');
    }

    try {
        // Save interview invite mapping doc for token-based access (Admin SDK bypasses rules)
        if (token && orgId && candidateId) {
            const db = getFirestore();
            await db.collection('interviewInvites').doc(token).set({
                orgId,
                candidateId,
                assessmentId: assessmentId || null,
                candidateName: candidateName || '',
                jobTitle,
                email,
                createdAt: new Date().toISOString(),
            });
        }

        if (resendApiKey.value()) {
            const templateOverride = await getEmailTemplateOverride(orgId, 'INTERVIEW_INVITE');
            await sendSecureLinkEmail({
                to: email,
                link: interviewUrl,
                type: 'INTERVIEW_INVITE',
                jobTitle,
                apiKey: resendApiKey.value(),
                templateOverride
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
    const { email, jobTitle, candidateName, orgId } = request.data;

    if (!email || !jobTitle) {
        throw new HttpsError('invalid-argument', 'Missing "email" or "jobTitle".');
    }

    try {
        if (resendApiKey.value()) {
            const templateOverride = await getEmailTemplateOverride(orgId, 'APPLICATION_RECEIPT');
            await sendSecureLinkEmail({
                to: email,
                type: 'APPLICATION_RECEIPT',
                jobTitle,
                name: candidateName,
                apiKey: resendApiKey.value(),
                templateOverride
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
    const { email, jobTitle, candidateName, orgId } = request.data;

    if (!email || !jobTitle) {
        throw new HttpsError('invalid-argument', 'Missing "email" or "jobTitle".');
    }

    try {
        if (resendApiKey.value()) {
            const templateOverride = await getEmailTemplateOverride(orgId, 'REJECTION');
            await sendSecureLinkEmail({
                to: email,
                type: 'REJECTION',
                jobTitle,
                name: candidateName,
                apiKey: resendApiKey.value(),
                templateOverride
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
    const { email, jobTitle, candidateName, onboardingUrl, orgId } = request.data;

    if (!email || !jobTitle || !onboardingUrl) {
        throw new HttpsError('invalid-argument', 'Missing "email", "jobTitle", or "onboardingUrl".');
    }

    try {
        if (resendApiKey.value()) {
            const templateOverride = await getEmailTemplateOverride(orgId, 'ONBOARDING_INVITE');
            await sendSecureLinkEmail({
                to: email,
                link: onboardingUrl,
                type: 'ONBOARDING_INVITE',
                jobTitle,
                name: candidateName,
                apiKey: resendApiKey.value(),
                templateOverride
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

        // Fetch org settings (persona, branding) for the interview room
        const orgDoc = await db.collection('organizations').doc(invite.orgId).get();
        const orgData = orgDoc.exists ? orgDoc.data()! : {};
        const settings = orgData.settings || {};

        // Fetch job details if candidate has jobId
        let jobDetails = null;
        if (candidateData.jobId) {
            const jobDoc = await db
                .collection('organizations')
                .doc(invite.orgId)
                .collection('jobs')
                .doc(candidateData.jobId)
                .get();
            if (jobDoc.exists) {
                jobDetails = { id: jobDoc.id, ...jobDoc.data() };
            }
        }

        return {
            candidateId: invite.candidateId,
            candidateName: invite.candidateName,
            jobTitle: invite.jobTitle,
            orgId: invite.orgId,
            assessmentId: invite.assessmentId || session?.assessmentId || null,
            sessionId: session?.id || null,
            candidate: { id: invite.candidateId, ...candidateData },
            persona: settings.persona || null,
            branding: settings.branding || null,
            job: jobDetails,
        };
    } catch (error: any) {
        if (error.code) throw error; // Re-throw HttpsError
        logger.error("Error resolving interview token", error);
        throw new HttpsError('internal', 'Failed to resolve interview token.');
    }
});

/**
 * 16. SAVE INTERVIEW SESSION (Callable)
 *
 * Saves a completed interview session for token-based (unauthenticated) candidates.
 */
export const saveInterviewSession = onCall(functionConfig as any, async (request) => {
    const { orgId, candidateId, session, existingSessionId } = request.data;

    if (!orgId || !candidateId || !session) {
        throw new HttpsError('invalid-argument', 'Missing orgId, candidateId, or session.');
    }

    try {
        const db = getFirestore();
        const candidateRef = db.collection('organizations').doc(orgId).collection('candidates').doc(candidateId);
        const candidateDoc = await candidateRef.get();

        if (!candidateDoc.exists) {
            throw new HttpsError('not-found', 'Candidate not found.');
        }

        const data = candidateDoc.data()!;
        const interviews: any[] = data.interviews || [];

        // Replace the matching Upcoming session if it exists, otherwise append
        const matchId = existingSessionId || session.id;
        const matchIdx = interviews.findIndex((i: any) => i.id === matchId && i.status === 'Upcoming');
        if (matchIdx >= 0) {
            interviews[matchIdx] = session;
        } else {
            interviews.push(session);
        }

        await candidateRef.update({ interviews });
        return { success: true };
    } catch (error: any) {
        if (error.code) throw error;
        logger.error("Error saving interview session", error);
        throw new HttpsError('internal', 'Failed to save interview session.');
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE MEET INTEGRATION — Create real Google Calendar events with Meet links
// ═══════════════════════════════════════════════════════════════════════════════

const meetFunctionConfig = {
    cors: true,
    region: "us-central1",
    maxInstances: 10,
    concurrency: 80,
    memory: "256MiB" as const,
    timeoutSeconds: 30,
    secrets: [googleServiceAccountKey, resendApiKey]
};

/**
 * 17. CREATE GOOGLE MEET EVENT (Callable)
 *
 * Creates a real Google Calendar event with an auto-generated Google Meet link
 * using a Google Workspace service account.
 *
 * Setup requirements:
 * 1. Create a GCP service account with "Google Calendar API" enabled
 * 2. Grant the service account domain-wide delegation in Google Workspace Admin
 * 3. Store the JSON key as base64 in Firebase Secret Manager: GOOGLE_SERVICE_ACCOUNT_KEY
 */
export const createGoogleMeetEvent = onCall(meetFunctionConfig as any, async (request) => {
    const {
        candidateName,
        candidateEmail,
        jobTitle,
        date,          // ISO date: "2026-03-01"
        time,          // HH:mm: "10:00"
        timezone,      // e.g. "Asia/Kolkata"
        durationMinutes = 60,
        orgId,
        interviewerEmail  // Optional: org user who will host
    } = request.data;

    if (!candidateName || !candidateEmail || !date || !time) {
        throw new HttpsError('invalid-argument', 'Missing required fields: candidateName, candidateEmail, date, time.');
    }

    try {
        // 1. Parse the service account key from base64-encoded secret
        const keyBase64 = googleServiceAccountKey.value();
        if (!keyBase64) {
            throw new HttpsError('failed-precondition', 'Google service account key is not configured. Add GOOGLE_SERVICE_ACCOUNT_KEY secret.');
        }

        const keyJson = JSON.parse(Buffer.from(keyBase64, 'base64').toString('utf-8'));

        // 2. Authenticate with Google Calendar API using JWT
        const { calendar, auth: googleAuth } = await import('@googleapis/calendar');

        // Try with domain-wide delegation first, fall back to service account's own calendar
        let calendarClient;
        let hasDelegation = false;
        if (interviewerEmail) {
            try {
                const delegatedJwt = new googleAuth.JWT({
                    email: keyJson.client_email,
                    key: keyJson.private_key,
                    scopes: ['https://www.googleapis.com/auth/calendar'],
                    subject: interviewerEmail,
                });
                await delegatedJwt.authorize();
                calendarClient = calendar({ version: 'v3', auth: delegatedJwt });
                hasDelegation = true;
            } catch {
                logger.info('Domain-wide delegation not available, using service account calendar directly');
            }
        }

        if (!calendarClient) {
            const jwtClient = new googleAuth.JWT({
                email: keyJson.client_email,
                key: keyJson.private_key,
                scopes: ['https://www.googleapis.com/auth/calendar'],
            });
            calendarClient = calendar({ version: 'v3', auth: jwtClient });
        }

        // 3. Build the event
        const startDateTime = `${date}T${time}:00`;
        const startMoment = new Date(`${startDateTime}`);
        const endMoment = new Date(startMoment.getTime() + durationMinutes * 60 * 1000);

        const event: Record<string, unknown> = {
            summary: `Interview: ${candidateName} — ${jobTitle || 'Position'}`,
            description: `Scheduled interview with ${candidateName} for the ${jobTitle || 'open'} role.\n\nPowered by RecruiteAI`,
            start: {
                dateTime: startMoment.toISOString(),
                timeZone: timezone || 'UTC',
            },
            end: {
                dateTime: endMoment.toISOString(),
                timeZone: timezone || 'UTC',
            },
            conferenceData: {
                createRequest: {
                    requestId: `recruiteai-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        // Only add attendees if we have domain-wide delegation
        if (hasDelegation) {
            event.attendees = [
                { email: candidateEmail, displayName: candidateName },
                ...(interviewerEmail ? [{ email: interviewerEmail }] : []),
            ];
            event.reminders = {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 },
                ],
            };
        }

        // 4. Insert the event — try with Meet link first, fall back without
        let response;
        try {
            response = await calendarClient.events.insert({
                calendarId: 'primary',
                requestBody: event,
                conferenceDataVersion: 1,
                sendUpdates: hasDelegation ? 'all' : 'none',
            });
        } catch (meetErr: unknown) {
            // Meet conference creation may fail without Workspace — create event without it
            logger.warn('Meet conference creation failed, creating event without conference:', meetErr);
            delete event.conferenceData;
            response = await calendarClient.events.insert({
                calendarId: 'primary',
                requestBody: event,
                sendUpdates: hasDelegation ? 'all' : 'none',
            });
        }

        const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || '';
        const eventId = response.data.id || '';
        const calendarLink = response.data.htmlLink || '';

        logger.info(`Google Calendar event created: ${eventId}, meetLink: ${meetLink || 'none (no Workspace)'}, calendarLink: ${calendarLink}`);

        // 5. Send interview invite emails to candidate and interviewer via Resend
        const inviteLink = meetLink || calendarLink || '';
        if (resendApiKey.value() && orgId) {
            const templateOverride = await getEmailTemplateOverride(orgId, 'INTERVIEW_INVITE');
            // Send to candidate
            await sendSecureLinkEmail({
                to: candidateEmail,
                link: inviteLink,
                type: 'INTERVIEW_INVITE',
                name: candidateName,
                jobTitle,
                apiKey: resendApiKey.value(),
                templateOverride,
            });
            logger.info(`Interview invite email sent to candidate: ${candidateEmail}`);

            // Send to interviewer if provided
            if (interviewerEmail) {
                await sendSecureLinkEmail({
                    to: interviewerEmail,
                    link: inviteLink,
                    type: 'INTERVIEW_INVITE',
                    name: `Interviewer (re: ${candidateName})`,
                    jobTitle,
                    apiKey: resendApiKey.value(),
                    templateOverride,
                });
                logger.info(`Interview invite email sent to interviewer: ${interviewerEmail}`);
            }
        }

        return {
            success: true,
            meetLink,
            calendarLink,
            eventId,
            startTime: startMoment.toISOString(),
            endTime: endMoment.toISOString(),
            hasMeetLink: !!meetLink,
        };

    } catch (error: any) {
        logger.error("Error creating Google Meet event", error);
        // Provide helpful error messages for common setup issues
        if (error.message?.includes('invalid_grant') || error.message?.includes('JWT')) {
            throw new HttpsError('failed-precondition',
                'Google service account authentication failed. Ensure the service account has Calendar API access and domain-wide delegation is configured.');
        }
        throw new HttpsError('internal', error.message || 'Failed to create Google Meet event.');
    }
});


// ═══════════════════════════════════════════════════════════════════════════════
// DOCUSIGN INTEGRATION — ISV Connector with JWT Grant for offer signing
// ═══════════════════════════════════════════════════════════════════════════════

const docusignFunctionConfig = {
    cors: true,
    region: "us-central1",
    maxInstances: 10,
    concurrency: 80,
    memory: "512MiB" as const,
    timeoutSeconds: 60,
    secrets: [docusignIntegrationKey, docusignUserId, docusignAccountId, docusignPrivateKey, resendApiKey]
};

/**
 * Helper: Get a DocuSign access token via JWT Grant
 *
 * Setup requirements:
 * 1. Create a DocuSign developer account at developers.docusign.com
 * 2. Create an "Integration Key" (App) with RSA keypair
 * 3. Grant consent: https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id={INTEGRATION_KEY}&redirect_uri=https://localhost
 * 4. Store secrets in Firebase Secret Manager:
 *    - DOCUSIGN_INTEGRATION_KEY: The integration key (client ID)
 *    - DOCUSIGN_USER_ID: The User ID GUID of the account to impersonate
 *    - DOCUSIGN_ACCOUNT_ID: The DocuSign Account ID
 *    - DOCUSIGN_RSA_PRIVATE_KEY: Base64-encoded PEM private key
 */
async function getDocuSignAccessToken(): Promise<{ accessToken: string; basePath: string }> {
    const docusign = await import('docusign-esign');

    const integrationKey = docusignIntegrationKey.value();
    const userId = docusignUserId.value();
    const privateKeyB64 = docusignPrivateKey.value();

    if (!integrationKey || !userId || !privateKeyB64) {
        throw new Error('DocuSign credentials not configured. Set DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, and DOCUSIGN_RSA_PRIVATE_KEY secrets.');
    }

    const privateKey = Buffer.from(privateKeyB64, 'base64').toString('utf-8');

    const apiClient = new docusign.ApiClient();
    // Use demo/sandbox for development; switch to production when ready
    apiClient.setOAuthBasePath('account-d.docusign.com');

    const results = await apiClient.requestJWTUserToken(
        integrationKey,
        userId,
        ['signature', 'impersonation'],
        Buffer.from(privateKey),
        3600 // Token valid for 1 hour
    );

    const accessToken = results.body.access_token;

    // Get the user's base URI for API calls
    const userInfo = await apiClient.getUserInfo(accessToken);
    const account = userInfo.accounts?.find((a: any) => a.isDefault === 'true') || userInfo.accounts?.[0];
    const basePath = `${account?.baseUri}/restapi`;

    return { accessToken, basePath };
}

/**
 * 18. CREATE DOCUSIGN ENVELOPE (Callable)
 *
 * Creates a DocuSign envelope with the offer letter and sends it to the candidate for signing.
 * Uses JWT Grant authentication (ISV connector pattern).
 */
export const createDocuSignEnvelope = onCall(docusignFunctionConfig as any, async (request) => {
    const {
        candidateId,
        candidateName,
        candidateEmail,
        jobTitle,
        offerContent,   // HTML or plain text content of the offer letter
        orgId,
        companyName,
        salary,
        startDate,
        returnUrl       // URL to redirect after signing (optional, for embedded signing)
    } = request.data;

    if (!candidateEmail || !candidateName || !candidateId) {
        throw new HttpsError('invalid-argument', 'Missing required fields: candidateEmail, candidateName, candidateId.');
    }

    try {
        const accountId = docusignAccountId.value();
        if (!accountId) {
            throw new HttpsError('failed-precondition', 'DocuSign Account ID not configured. Set DOCUSIGN_ACCOUNT_ID secret.');
        }

        const { accessToken, basePath } = await getDocuSignAccessToken();
        const docusign = await import('docusign-esign');

        const apiClient = new docusign.ApiClient();
        apiClient.setBasePath(basePath);
        apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

        const envelopesApi = new docusign.EnvelopesApi(apiClient);

        // Build the offer letter document
        const offerHtml = offerContent || buildDefaultOfferHtml({
            candidateName,
            jobTitle: jobTitle || 'Team Member',
            companyName: companyName || 'Our Company',
            salary: salary || 'As discussed',
            startDate: startDate || 'TBD',
        });

        // Create the document (HTML → DocuSign renders it as PDF)
        const document = new docusign.Document();
        document.documentBase64 = Buffer.from(offerHtml).toString('base64');
        document.name = `Offer Letter - ${candidateName}`;
        document.fileExtension = 'html';
        document.documentId = '1';

        // Create the signer with tabs (signature fields)
        const signer = new docusign.Signer();
        signer.email = candidateEmail;
        signer.name = candidateName;
        signer.recipientId = '1';
        signer.routingOrder = '1';

        // Anchor-based signature tab — looks for the text "Candidate Signature:" in the document
        const signHere = new docusign.SignHere();
        signHere.anchorString = '/sig1/';
        signHere.anchorUnits = 'pixels';
        signHere.anchorXOffset = '20';
        signHere.anchorYOffset = '10';

        const dateSignedTab = new docusign.DateSigned();
        dateSignedTab.anchorString = '/date1/';
        dateSignedTab.anchorUnits = 'pixels';
        dateSignedTab.anchorXOffset = '20';
        dateSignedTab.anchorYOffset = '10';

        const tabs = new docusign.Tabs();
        tabs.signHereTabs = [signHere];
        tabs.dateSignedTabs = [dateSignedTab];
        signer.tabs = tabs;

        // Carbon copy to the org (notification when signed)
        const recipients = new docusign.Recipients();
        recipients.signers = [signer];

        // Build the envelope
        const envelopeDefinition = new docusign.EnvelopeDefinition();
        envelopeDefinition.emailSubject = `Offer Letter — ${jobTitle || 'Position'} at ${companyName || 'Our Company'}`;
        envelopeDefinition.emailBlurb = `Hi ${candidateName}, please review and sign your offer letter for the ${jobTitle || ''} position.`;
        envelopeDefinition.documents = [document];
        envelopeDefinition.recipients = recipients;
        envelopeDefinition.status = 'sent'; // Send immediately

        // Create the envelope
        const envelopeResult = await envelopesApi.createEnvelope(accountId, {
            envelopeDefinition,
        });

        const envelopeId = envelopeResult.envelopeId;
        logger.info(`DocuSign envelope created: ${envelopeId}`);

        // Update candidate offer in Firestore with DocuSign envelope ID
        if (orgId && candidateId && envelopeId) {
            const db = getFirestore();
            const candidateRef = db.collection('organizations').doc(orgId).collection('candidates').doc(candidateId);
            const candidateDoc = await candidateRef.get();

            if (candidateDoc.exists) {
                const data = candidateDoc.data()!;
                const offer = data.offer || {};
                await candidateRef.update({
                    offer: {
                        ...offer,
                        status: 'Sent',
                        docusignEnvelopeId: envelopeId,
                        docusignStatus: 'Sent',
                        sentAt: new Date().toISOString(),
                    }
                });
            }
        }

        // Optionally create an embedded signing URL (for in-app signing)
        let signingUrl = null;
        if (returnUrl) {
            const viewRequest = new docusign.RecipientViewRequest();
            viewRequest.returnUrl = returnUrl;
            viewRequest.authenticationMethod = 'none';
            viewRequest.email = candidateEmail;
            viewRequest.userName = candidateName;
            viewRequest.recipientId = '1';

            const viewResult = await envelopesApi.createRecipientView(accountId, envelopeId!, {
                recipientViewRequest: viewRequest,
            });
            signingUrl = viewResult.url;
        }

        return {
            success: true,
            envelopeId,
            signingUrl,
        };

    } catch (error: any) {
        logger.error("Error creating DocuSign envelope", error);
        if (error.message?.includes('consent_required')) {
            throw new HttpsError('failed-precondition',
                'DocuSign consent not granted. The admin must grant consent at: https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id={INTEGRATION_KEY}&redirect_uri=https://localhost');
        }
        throw new HttpsError('internal', error.message || 'Failed to create DocuSign envelope.');
    }
});

/**
 * 19. CHECK DOCUSIGN ENVELOPE STATUS (Callable)
 *
 * Checks the current status of a DocuSign envelope (e.g., sent, delivered, completed, declined).
 */
export const checkDocuSignStatus = onCall(docusignFunctionConfig as any, async (request) => {
    const { envelopeId, orgId, candidateId } = request.data;

    if (!envelopeId) {
        throw new HttpsError('invalid-argument', 'Missing "envelopeId".');
    }

    try {
        const accountId = docusignAccountId.value();
        if (!accountId) {
            throw new HttpsError('failed-precondition', 'DocuSign Account ID not configured.');
        }

        const { accessToken, basePath } = await getDocuSignAccessToken();
        const docusign = await import('docusign-esign');

        const apiClient = new docusign.ApiClient();
        apiClient.setBasePath(basePath);
        apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

        const envelopesApi = new docusign.EnvelopesApi(apiClient);
        const envelope = await envelopesApi.getEnvelope(accountId, envelopeId);

        const status = envelope.status; // 'sent' | 'delivered' | 'completed' | 'declined' | 'voided'
        const completedAt = envelope.completedDateTime;

        // Map DocuSign status to our internal status
        const statusMap: Record<string, string> = {
            'created': 'Draft',
            'sent': 'Sent',
            'delivered': 'Delivered',
            'completed': 'Completed',
            'declined': 'Declined',
            'voided': 'Voided',
        };

        const mappedStatus = statusMap[status || ''] || status;

        // Update Firestore if orgId and candidateId provided
        if (orgId && candidateId) {
            const db = getFirestore();
            const candidateRef = db.collection('organizations').doc(orgId).collection('candidates').doc(candidateId);
            const candidateDoc = await candidateRef.get();

            if (candidateDoc.exists) {
                const data = candidateDoc.data()!;
                const offer = data.offer || {};
                const updates: any = {
                    offer: {
                        ...offer,
                        docusignStatus: mappedStatus,
                    }
                };

                // If completed (signed), update the offer status
                if (status === 'completed') {
                    updates.offer.status = 'Signed';
                    updates.offer.signedAt = completedAt || new Date().toISOString();

                    // Attempt to get the signed document URL
                    try {
                        const docList = await envelopesApi.listDocuments(accountId, envelopeId);
                        if (docList.envelopeDocuments && docList.envelopeDocuments.length > 0) {
                            // Download the combined (signed) PDF
                            const pdfBytes = await envelopesApi.getDocument(accountId, envelopeId, 'combined');
                            // Upload to Firebase Storage
                            const storage = getStorage();
                            const bucket = storage.bucket();
                            const filePath = `${orgId}/candidates/${candidateId}/signed_offer_${envelopeId}.pdf`;
                            const file = bucket.file(filePath);
                            await file.save(Buffer.from(pdfBytes as any), { contentType: 'application/pdf' });
                            const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: '01-01-2030' });
                            updates.offer.signedDocumentUrl = signedUrl;
                        }
                    } catch (docErr) {
                        logger.warn("Could not retrieve signed document", docErr);
                    }
                }

                if (status === 'declined') {
                    updates.offer.status = 'Declined';
                    updates.offer.rejectedAt = new Date().toISOString();
                }

                await candidateRef.update(updates);
            }
        }

        return {
            success: true,
            status: mappedStatus,
            completedAt,
        };

    } catch (error: any) {
        logger.error("Error checking DocuSign status", error);
        throw new HttpsError('internal', error.message || 'Failed to check DocuSign status.');
    }
});

/**
 * 20. DOCUSIGN WEBHOOK (Connect) — HTTP endpoint
 *
 * DocuSign Connect sends real-time status updates to this endpoint.
 * Configure in DocuSign Admin > Connect > Add Configuration:
 *   URL: https://us-central1-{PROJECT_ID}.cloudfunctions.net/docuSignWebhook
 *   Events: Envelope Sent, Delivered, Completed, Declined, Voided
 */
import { onRequest } from "firebase-functions/v2/https";

export const docuSignWebhook = onRequest({
    cors: true,
    region: "us-central1",
    maxInstances: 10,
    memory: "256MiB" as const,
    timeoutSeconds: 30,
}, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const payload = req.body;
        const envelopeId = payload?.envelopeId || payload?.EnvelopeStatus?.EnvelopeID;
        const status = payload?.status || payload?.EnvelopeStatus?.Status;

        if (!envelopeId) {
            logger.warn("DocuSign webhook: missing envelopeId", payload);
            res.status(400).send('Missing envelopeId');
            return;
        }

        logger.info(`DocuSign webhook received: envelope=${envelopeId}, status=${status}`);

        // Look up which candidate has this envelope
        const db = getFirestore();
        const orgsSnapshot = await db.collectionGroup('candidates')
            .where('offer.docusignEnvelopeId', '==', envelopeId)
            .limit(1)
            .get();

        if (orgsSnapshot.empty) {
            logger.warn(`DocuSign webhook: no candidate found for envelope ${envelopeId}`);
            res.status(200).send('OK — no matching candidate');
            return;
        }

        const candidateDoc = orgsSnapshot.docs[0];
        const candidateData = candidateDoc.data();
        const offer = candidateData.offer || {};

        const statusMap: Record<string, string> = {
            'sent': 'Sent',
            'delivered': 'Delivered',
            'completed': 'Completed',
            'declined': 'Declined',
            'voided': 'Voided',
        };

        const normalizedStatus = (status || '').toLowerCase();
        const mappedStatus = statusMap[normalizedStatus] || status;

        const updates: any = {
            offer: {
                ...offer,
                docusignStatus: mappedStatus,
            }
        };

        if (normalizedStatus === 'completed') {
            updates.offer.status = 'Signed';
            updates.offer.signedAt = new Date().toISOString();
        }

        if (normalizedStatus === 'declined') {
            updates.offer.status = 'Declined';
            updates.offer.rejectedAt = new Date().toISOString();
        }

        await candidateDoc.ref.update(updates);
        logger.info(`DocuSign webhook: updated candidate ${candidateDoc.id} → ${mappedStatus}`);

        res.status(200).send('OK');
    } catch (error: any) {
        logger.error("DocuSign webhook error", error);
        res.status(500).send('Internal Server Error');
    }
});


// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Default offer letter HTML template for DocuSign
// ═══════════════════════════════════════════════════════════════════════════════

function buildDefaultOfferHtml(params: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    salary: string;
    startDate: string;
}): string {
    const { candidateName, jobTitle, companyName, salary, startDate } = params;
    return `<!DOCTYPE html>
<html>
<head><style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.8; padding: 60px; max-width: 800px; margin: 0 auto; }
    h1 { color: #0f172a; font-size: 28px; border-bottom: 3px solid #059669; padding-bottom: 12px; }
    .section { margin: 24px 0; padding: 20px; background: #f8fafc; border-left: 4px solid #059669; border-radius: 4px; }
    .signature-block { margin-top: 60px; display: flex; justify-content: space-between; }
    .sig-area { width: 45%; }
    .sig-line { border-top: 2px solid #334155; margin-top: 60px; padding-top: 8px; }
</style></head>
<body>
    <h1>Employment Offer Letter</h1>
    <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>Dear <strong>${candidateName}</strong>,</p>
    <p>We are pleased to offer you the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>. We believe your skills and experience will be a valuable asset to our team.</p>

    <div class="section">
        <h3>1. Position &amp; Compensation</h3>
        <p><strong>Title:</strong> ${jobTitle}<br>
        <strong>Annual Salary:</strong> ${salary}<br>
        <strong>Start Date:</strong> ${startDate}</p>
    </div>

    <div class="section">
        <h3>2. Benefits</h3>
        <p>You will be eligible for our comprehensive benefits package, including health, dental, and vision insurance, retirement plan matching, and paid time off.</p>
    </div>

    <div class="section">
        <h3>3. At-Will Employment</h3>
        <p>Your employment with ${companyName} is for no specific period of time and constitutes "at-will" employment. Either you or ${companyName} may terminate the employment relationship at any time.</p>
    </div>

    <p>Please indicate your acceptance of this offer by signing below.</p>

    <div class="signature-block">
        <div class="sig-area">
            <p><strong>${companyName}</strong></p>
            <div class="sig-line">
                <p>Authorized Representative</p>
            </div>
        </div>
        <div class="sig-area">
            <p><strong>Candidate Signature:</strong></p>
            <p>/sig1/</p>
            <div class="sig-line">
                <p>${candidateName}</p>
                <p>Date: /date1/</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================
// 21. CREATE MICROSOFT TEAMS MEETING (Callable)
// Uses Azure AD client credentials flow + Microsoft Graph API
// ============================================================
async function getMsTeamsAccessToken(): Promise<string> {
    const tenantId = msTeamsTenantId.value();
    const clientId = msTeamsClientId.value();
    const clientSecret = msTeamsClientSecret.value();

    if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Microsoft Teams credentials not configured. Set MS_TEAMS_TENANT_ID, MS_TEAMS_CLIENT_ID, MS_TEAMS_CLIENT_SECRET secrets.');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get MS Teams token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
}

exports.createTeamsMeeting = onCall({
    secrets: [msTeamsTenantId, msTeamsClientId, msTeamsClientSecret, msTeamsOrganizerId, resendApiKey],
    memory: '256MiB',
    timeoutSeconds: 30,
    maxInstances: 10,
}, async (request) => {
    const {
        candidateName,
        candidateEmail,
        date,
        time,
        durationMinutes = 30,
        jobTitle,
        orgId,
        interviewerEmail,
    } = request.data;

    // Use the organizer user from server-side secret (not client-provided)
    const organizerUserId = msTeamsOrganizerId.value();

    if (!candidateName || !candidateEmail || !date || !time) {
        throw new HttpsError('invalid-argument', 'Missing required fields: candidateName, candidateEmail, date, time.');
    }

    try {
        const accessToken = await getMsTeamsAccessToken();

        // Build meeting time
        const startDateTime = `${date}T${time}:00`;
        const startMoment = new Date(startDateTime);
        const endMoment = new Date(startMoment.getTime() + durationMinutes * 60 * 1000);

        // Create online meeting via Microsoft Graph API
        // If organizerUserId is provided, create on behalf of that user
        // Otherwise, create an application-level meeting
        const meetingPayload: Record<string, unknown> = {
            startDateTime: startMoment.toISOString(),
            endDateTime: endMoment.toISOString(),
            subject: `Interview: ${candidateName} — ${jobTitle || 'Position'}`,
            participants: {
                attendees: [
                    {
                        upn: candidateEmail,
                        role: 'attendee',
                    },
                    ...(interviewerEmail ? [{
                        upn: interviewerEmail,
                        role: 'presenter',
                    }] : []),
                ],
            },
            lobbyBypassSettings: {
                scope: 'everyone',
                isDialInBypassEnabled: true,
            },
            autoAdmittedUsers: 'everyone',
            isEntryExitAnnounced: false,
            allowedPresenters: 'organizer',
            recordAutomatically: true,
        };

        // Use user-delegated endpoint if organizer specified, otherwise use /communications
        const graphUrl = organizerUserId
            ? `https://graph.microsoft.com/v1.0/users/${organizerUserId}/onlineMeetings`
            : `https://graph.microsoft.com/v1.0/communications/onlineMeetings`;

        const meetingResponse = await fetch(graphUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(meetingPayload),
        });

        if (!meetingResponse.ok) {
            const errorText = await meetingResponse.text();
            logger.error('Teams meeting creation failed:', errorText);
            throw new HttpsError('internal', `Teams meeting creation failed: ${meetingResponse.status} ${errorText}`);
        }

        const meeting = await meetingResponse.json();
        const meetLink = meeting.joinWebUrl || meeting.joinUrl || '';
        const meetingId = meeting.id || '';

        logger.info(`Teams meeting created: ${meetingId}, link: ${meetLink}`);

        // Send invite emails via Resend
        if (resendApiKey.value() && orgId) {
            const templateOverride = await getEmailTemplateOverride(orgId, 'INTERVIEW_INVITE');
            // Send to candidate
            await sendSecureLinkEmail({
                to: candidateEmail,
                link: meetLink,
                type: 'INTERVIEW_INVITE',
                name: candidateName,
                jobTitle,
                apiKey: resendApiKey.value(),
                templateOverride,
            });
            logger.info(`Teams invite email sent to candidate: ${candidateEmail}`);

            // Send to interviewer if provided
            if (interviewerEmail) {
                await sendSecureLinkEmail({
                    to: interviewerEmail,
                    link: meetLink,
                    type: 'INTERVIEW_INVITE',
                    name: `Interviewer (re: ${candidateName})`,
                    jobTitle,
                    apiKey: resendApiKey.value(),
                    templateOverride,
                });
                logger.info(`Teams invite email sent to interviewer: ${interviewerEmail}`);
            }
        }

        return {
            success: true,
            meetLink,
            meetingId,
            startTime: startMoment.toISOString(),
            endTime: endMoment.toISOString(),
        };

    } catch (error: any) {
        logger.error('Error creating Teams meeting:', error);
        throw new HttpsError('internal', error.message || 'Failed to create Teams meeting.');
    }
});

// ============================================================
// 22. GET TEAMS MEETING RECORDINGS & TRANSCRIPTS (Callable)
// Fetches recording URLs and transcript content after interview
// ============================================================
exports.getTeamsMeetingArtifacts = onCall({
    secrets: [msTeamsTenantId, msTeamsClientId, msTeamsClientSecret, msTeamsOrganizerId],
    memory: '512MiB',
    timeoutSeconds: 60,
    maxInstances: 10,
}, async (request) => {
    const { meetingId, orgId, candidateId } = request.data;
    const organizerUserId = msTeamsOrganizerId.value();

    if (!meetingId) {
        throw new HttpsError('invalid-argument', 'Missing meetingId.');
    }

    try {
        const accessToken = await getMsTeamsAccessToken();
        const userPath = `users/${organizerUserId}`;

        // 1. Fetch recordings
        const recordingsRes = await fetch(
            `https://graph.microsoft.com/v1.0/${userPath}/onlineMeetings/${meetingId}/recordings`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        let recordings: any[] = [];
        if (recordingsRes.ok) {
            const recordingsData = await recordingsRes.json();
            recordings = (recordingsData.value || []).map((r: any) => ({
                id: r.id,
                createdDateTime: r.createdDateTime,
                contentUrl: r['content@odata.mediaContentUrl'] || null,
            }));
        }

        // 2. Fetch transcripts
        const transcriptsRes = await fetch(
            `https://graph.microsoft.com/v1.0/${userPath}/onlineMeetings/${meetingId}/transcripts`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        let transcripts: any[] = [];
        if (transcriptsRes.ok) {
            const transcriptsData = await transcriptsRes.json();
            const transcriptItems = transcriptsData.value || [];

            // Fetch actual transcript content for each
            for (const t of transcriptItems) {
                try {
                    const contentRes = await fetch(
                        `https://graph.microsoft.com/v1.0/${userPath}/onlineMeetings/${meetingId}/transcripts/${t.id}/content?$format=text/vtt`,
                        { headers: { 'Authorization': `Bearer ${accessToken}` } }
                    );
                    if (contentRes.ok) {
                        const vttContent = await contentRes.text();
                        transcripts.push({
                            id: t.id,
                            createdDateTime: t.createdDateTime,
                            content: vttContent,
                        });
                    }
                } catch (tErr) {
                    logger.warn(`Failed to fetch transcript ${t.id}:`, tErr);
                }
            }
        }

        // 3. Save artifacts to Firestore if orgId and candidateId are provided
        if (orgId && candidateId && (recordings.length > 0 || transcripts.length > 0)) {
            const db = getFirestore();
            await db.collection('organizations').doc(orgId)
                .collection('candidates').doc(candidateId)
                .update({
                    'teamsMeetingArtifacts': {
                        meetingId,
                        recordings: recordings.map(r => ({ id: r.id, createdAt: r.createdDateTime })),
                        transcriptText: transcripts.map(t => t.content).join('\n\n'),
                        fetchedAt: new Date().toISOString(),
                    }
                });
            logger.info(`Teams artifacts saved for candidate ${candidateId}`);
        }

        return {
            success: true,
            recordings,
            transcripts,
            recordingCount: recordings.length,
            transcriptCount: transcripts.length,
        };

    } catch (error: any) {
        logger.error('Error fetching Teams artifacts:', error);
        throw new HttpsError('internal', error.message || 'Failed to fetch Teams meeting artifacts.');
    }
});

// ======================== PORTAL TOKEN RESOLVER ========================
// Resolves an offer/onboarding token to candidate + org data for public portals
export const resolvePortalToken = onCall({ region: 'us-central1' }, async (request) => {
    const { token } = request.data;
    if (!token || typeof token !== 'string') {
        throw new HttpsError('invalid-argument', 'Token is required.');
    }

    const db = getFirestore();

    // Search across all orgs for a candidate with this offer token
    const snapshot = await db.collectionGroup('candidates')
        .where('offer.token', '==', token)
        .limit(1)
        .get();

    if (snapshot.empty) {
        throw new HttpsError('not-found', 'Invalid or expired token.');
    }

    const candidateDoc = snapshot.docs[0];
    const candidateData = candidateDoc.data();
    const candidateId = candidateDoc.id;

    // Extract orgId from the document path: organizations/{orgId}/candidates/{candidateId}
    const orgId = candidateDoc.ref.parent.parent?.id;

    // Fetch org branding
    let branding: any = {};
    if (orgId) {
        const orgDoc = await db.collection('organizations').doc(orgId).get();
        if (orgDoc.exists) {
            const orgData = orgDoc.data();
            branding = orgData?.branding || {};
        }
    }

    return {
        candidateId,
        name: candidateData.name || '',
        email: candidateData.email || '',
        role: candidateData.role || '',
        offer: candidateData.offer || null,
        onboarding: candidateData.onboarding || null,
        branding: {
            companyName: branding.companyName || 'RecruiteAI',
            primaryColor: branding.primaryColor || '#16a34a',
            logoUrl: branding.logoUrl || '',
        },
        orgId,
    };
});

