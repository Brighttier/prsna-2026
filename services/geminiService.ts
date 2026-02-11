import { GoogleGenAI, Type, Schema, LiveServerMessage, Modality } from "@google/genai";

const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    // Original warning was: console.warn("VITE_GEMINI_API_KEY is missing. AI features will fail.");
    // The instruction implies a stricter check, so changing to throw an error.
    throw new Error("VITE_GEMINI_API_KEY is missing. AI features cannot be initialized.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// --- Resume Screening Service ---

export const screenResume = async (resumeText: string, jobDescription: string): Promise<string> => {
  // Check global kill switch via store
  // We import it here to avoid top-level circular dependency if possible
  const { store } = await import('./store');
  if (!store.isAiAllowed('resume')) {
    throw new Error("AI Services are currently disabled by Platform Admin.");
  }

  try {
    const ai = getAiClient(); // getAiClient now throws if API key is missing.
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
         "missingSkills": ["skill1", "skill2"]
 }
      
      Do not include markdown formatting(like \`\`\`json). Just the raw JSON string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    console.log("Gemini Response:", response);

    // Model getter returns text directly
    const text = response.text;

    return text || "{}";
  } catch (error) {
    console.error("Error screening resume:", error);
    throw error;
  }
};

// --- Live API Helpers (Audio/Video Processing) ---

export const createPcmBlob = (data: Float32Array): Blob => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return new Blob([int16], { type: 'audio/pcm;rate=16000' });
};

export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const decodeAudioData = async (
  base64String: string,
  ctx: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const sampleRate = 24000;

  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};
export const summarizeInterview = async (transcript: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      You are an expert HR analyst. Review the following interview transcript and provide a structured summary.
      
      Transcript:
      ${transcript}
      
      Output JSON structure:
      {
        "score": number(0-10),
        "sentiment": "Positive" | "Neutral" | "Negative",
        "summary": "Key takeaways from the interview.",
        "technicalSkills": ["skill1", "skill2"],
        "softSkills": ["skill1", "skill2"],
        "highlights": [
          { "timestamp": number, "type": "Insight" | "Flag", "text": "description" }
        ]
      }
      
      Return only raw JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Error summarizing interview:", error);
    return "{}";
  }
};
