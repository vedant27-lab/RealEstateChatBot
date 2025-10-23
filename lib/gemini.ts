// In /lib/gemini.ts

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.GOOGLE_API_KEY || ""; // Fallback to empty string

// We initialize the client here
const genAI = new GoogleGenerativeAI(API_KEY);

// These are safety settings to control what content the model blocks
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// --- Function 1: Query Parser ---

// This is the structure we want the AI to return
export interface QueryFilters {
  city?: string;
  bhk?: number;
  budget?: number; // We'll ask the AI to convert Cr/L to a number
  possessionStatus?: 'Ready' | 'Under Construction';
  locality?: string;
}

export const parseUserQuery = async (userQuery: string): Promise<QueryFilters> => {
  const generationConfig = {
    temperature: 0.2, // Low temperature for deterministic, factual output
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
    // We force the model to output JSON
    responseMimeType: "application/json", 
  };

  // This is the "system prompt" or instruction set for the model.
  // It's the most important piece of "prompt engineering".
  const prompt = `
    You are an expert real estate query parser. Your job is to extract filter criteria 
    from a user query and return them as a JSON object.

    The user query is: "${userQuery}"

    Please extract the following fields:
    - city (string): The city name.
    - bhk (number): The number of bedrooms (e.S., 2BHK -> 2).
    - budget (number): The budget. IMPORTANT: Convert all budgets to a single integer in Indian Rupees. 
      For example: '1.2 Cr' becomes 12000000, '50 L' becomes 5000000, '90 Lakhs' becomes 9000000.
    - possessionStatus (string): Either 'Ready' or 'Under Construction'. 
      Infer this from terms like 'ready to move' or 'under construction'.
    - locality (string): Any specific neighborhoods or areas mentioned.

    Rules:
    1. If a field is not mentioned, do not include it in the JSON.
    2. The output MUST be a single, valid JSON object and nothing else.
    3. If no filters are found, return an empty JSON object {}.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });
    
    const responseText = result.response.text();
    console.log("Gemini Parse Response:", responseText); // Good for debugging
    
    // Parse the JSON string into an object
    return JSON.parse(responseText) as QueryFilters;

  } catch (error) {
    console.error("Error parsing query with Gemini:", error);
    // In case of AI error, return empty filters so the app doesn't crash
    return {};
  }
};


// --- Function 2: Summary Generator ---

import { Project } from './data-loader'; // Import the Project type from Day 1

export const generateSummary = async (query: string, properties: Project[]): Promise<string> => {
  const generationConfig = {
    temperature: 0.5, // A bit more creative, but still factual
    topK: 1,
    topP: 1,
    maxOutputTokens: 1024,
  };

  // If we found no properties, we don't need to call the AI
  if (properties.length === 0) {
    return "No properties matched your criteria. You could try expanding your search, for example, by increasing your budget or looking in a nearby locality.";
  }

  // We'll pass a stringified, simplified version of the properties
  // We don't want to overwhelm the AI with too much data
  const simplifiedProperties = properties.map(p => ({
    name: p.projectName,
    city: p.city,
    locality: p.locality,
    bhk: p.bhk,
    price: p.price,
    status: p.possessionStatus,
  }));

  // Another carefully crafted prompt!
  const prompt = `
    You are a helpful real estate assistant. I have just run a search for a user
    who asked: "${query}"

    I found the following properties (as a JSON array):
    ${JSON.stringify(simplifiedProperties)}

    Please generate a short, 2-4 sentence summary of these results. 
    
    Rules:
    1. Be helpful and professional.
    2. The summary MUST be grounded *only* in the data provided. 
    3. DO NOT hallucinate or make up any details, amenities, or property names.
    4. If the results look good, highlight a key trend (e.g., "I found 5 properties, 
       most of which are in the Wakad area and are ready to move.").
    5. Do not just list the properties. Summarize them.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });
    
    return result.response.text();

  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    return "I found some properties for you, but I'm having trouble summarizing them at the moment.";
  }
};