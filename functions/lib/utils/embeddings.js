"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmbedding = generateEmbedding;
exports.calculateCosineSimilarity = calculateCosineSimilarity;
const genai_1 = require("@google/genai");
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Generates a vector embedding for the provided text using Gemini.
 * Uses the 'gemini-embedding-001' model.
 */
async function generateEmbedding(apiKey, text) {
    if (!text || text.length < 5) {
        logger.warn("Text too short for embedding generation.");
        return [];
    }
    try {
        const genAI = new genai_1.GoogleGenAI({ apiKey });
        // Clean text to avoid token limits or noise
        const cleanText = text.replace(/\s+/g, ' ').substring(0, 8000);
        const result = await genAI.models.embedContent({
            model: "gemini-embedding-001",
            contents: [{
                    parts: [{ text: cleanText }]
                }]
        });
        if (!result || !result.embeddings || !result.embeddings[0] || !result.embeddings[0].values) {
            throw new Error("No embedding returned from Gemini API");
        }
        return result.embeddings[0].values;
    }
    catch (error) {
        logger.error("Error generating embedding", error);
        return [];
    }
}
/**
 * Calculates the cosine similarity between two vectors.
 * Returns a score between -1 and 1 (usually 0 to 1 for text embeddings).
 */
function calculateCosineSimilarity(vecA, vecB) {
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
    if (normA === 0 || normB === 0)
        return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
//# sourceMappingURL=embeddings.js.map