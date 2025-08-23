// services/ai.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../config/apiKeys';

const API_KEY = GEMINI_API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

const AI_PROMPT = `You are a concise career counselor. Given the user’s normalized skills, matched roles (with overlaps/missing skills), an optional location, and an optional target job, respond in 3 compact sections using markdown bullet points: (1) **Top Roles** (2-3 roles max) (2) **Why You Fit** (focus on overlaps) (3) **Skill Gaps (Learn Next)** with 3–5 missing skills. Be factual, avoid hallucinations, and do NOT invent company names or specific open roles. Total response must be <= 120 words.`;

const FALLBACK_MESSAGE = "AI advice is unavailable in offline mode. Based on your skills, we've identified roles where you have the strongest overlap.";

/**
 * Generates career advice using the Gemini AI model.
 * @param {{
 * userSkills: string[];
 * matches: Array<{ job: string; overlap: string[]; missing: string[]; score: number }>;
 * location?: string;
 * targetJob?: string;
 * }} params - The input parameters for generating advice.
 * @returns {Promise<string>} The generated career advice as a string.
 */
export async function getAIAdvice(params) {
  if (!model || !API_KEY || API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
    return FALLBACK_MESSAGE;
  }

  const content = `
    User Skills: ${params.userSkills.join(', ')}
    Matched Roles: ${params.matches.map(m => `${m.job} (score: ${m.score.toFixed(2)})`).join(', ')}
    ${params.location ? `Location: ${params.location}` : ''}
    ${params.targetJob ? `Target Job: ${params.targetJob}` : ''}
  `;

  let retries = 2;
  while (retries > 0) {
    try {
      const result = await model.generateContent([AI_PROMPT, content]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI API Error:', error);
      retries--;
      if (retries === 0) {
        return `We're having trouble reaching our AI assistant. Please try again later. For now, here are your top matches based on our local catalog.`;
      }
      await new Promise(res => setTimeout(res, 1000 * (3 - retries))); // Exponential backoff
    }
  }
  return FALLBACK_MESSAGE;
}