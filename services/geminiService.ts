import { functions, httpsCallable } from './firebase';
import { GoogleGenAI } from "@google/genai";

export const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is missing. AI features cannot be initialized.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export const screenResume = async (resumeText: string, jobDescription: string): Promise<string> => {
  // Check global kill switch via store
  const { store } = await import('./store');
  if (!store.isAiAllowed('resume')) {
    throw new Error("AI Services are currently disabled by Platform Admin.");
  }

  try {
    const screenResumeFn = httpsCallable(functions, 'screenResume');
    // Call the Cloud Function
    const result = await screenResumeFn({ resumeText, jobDescription });

    // The function returns the parsed object, but the frontend expects a JSON string based on current usage
    // So we stringify it back to match the existing contract until we refactor the frontend component.
    return JSON.stringify(result.data);
  } catch (error: any) {
    console.error("Error screening resume:", error);
    throw error;
  }
};

// ... keep existing helpers ...

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
