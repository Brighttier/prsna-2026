
import { GoogleGenAI } from "@google/genai";
import * as logger from "firebase-functions/logger";

/**
 * Generates a vector embedding for the provided text using Gemini.
 * Uses the 'text-embedding-004' model by default.
 */
export async function generateEmbedding(apiKey: string, text: string): Promise<number[]> {
    if (!text || text.length < 5) {
        logger.warn("Text too short for embedding generation.");
        return [];
    }

    try {
        const genAI = new GoogleGenAI({ apiKey });

        // Clean text to avoid token limits or noise
        // Truncate if necessary (text-embedding-004 has a 2048 token limit, roughly 8000 chars)
        const cleanText = text.replace(/\s+/g, ' ').substring(0, 8000);

        const result = await genAI.models.embedContent({
            model: "text-embedding-004",
            contents: [{
                parts: [{ text: cleanText }]
            }]
        });

        if (!result || !result.embeddings || !result.embeddings[0] || !result.embeddings[0].values) {
            throw new Error("No embedding returned from Gemini API");
        }

        return result.embeddings[0].values;
    } catch (error) {
        logger.error("Error generating embedding", error);
        return [];
    }
}

/**
 * Calculates the cosine similarity between two vectors.
 * Returns a score between -1 and 1 (usually 0 to 1 for text embeddings).
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
