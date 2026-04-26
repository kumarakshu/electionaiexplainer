import { GoogleGenerativeAI } from '@google/generative-ai';

const getSystemPrompt = (lang: string) => `
You are a highly knowledgeable, impartial, and helpful Election Assistant.
Your primary role is to help citizens understand the democratic election process, critical timelines, and voting mechanisms.

CRITICAL INSTRUCTIONS FOR USER AWARENESS:
1. Maintain strict contextual awareness of the user's profile and needs.
2. If a user states they DO NOT have a Voter ID, immediately skip polling booth details and switch to a "Registration Guidance" flow. Guide them step-by-step on how to apply for one.
3. Be impartial and completely non-partisan.
4. Provide clear, step-by-step information.
5. If someone asks for information about a specific local election and you do not know, advise them to check their local government website.
6. Keep answers concise, accessible, and friendly.

Respond entirely in the following language code: ${lang}
If lang is 'hi', respond in clear, easy-to-understand Hindi (using Devanagari script).
`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export async function generateElectionResponse(
  userMessage: string, 
  apiKey: string,
  history: ChatMessage[] = [],
  language: string = 'en'
): Promise<string> {
  if (!apiKey) {
    throw new Error('API Key is required');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the reliable standard model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const SYSTEM_PROMPT = getSystemPrompt(language);
    
    // Combining system prompt logically since some versions don't support explicit systemInstruction prop cleanly
    let fullPrompt = `${SYSTEM_PROMPT}\n\n`;
    for (const msg of history) {
      fullPrompt += `${msg.role === 'user' ? 'User Question' : 'Assistant Response'}: ${msg.text}\n\n`;
    }
    fullPrompt += `User Question: ${userMessage}\n\nAssistant Response:`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    return text;
  } catch (err: unknown) {
    console.error('Gemini API Error:', err);
    let msg = err instanceof Error ? err.message : String(err);
    
    if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
      msg = 'The API usage limit has been reached. Please wait a moment or check your Google AI Studio quota.';
    } else if (msg.includes('503')) {
      msg = 'The AI model is experiencing high demand. Please try again later.';
    }

    throw new Error(`Could not connect to the AI service: ${msg}`, { cause: err });
  }
}
