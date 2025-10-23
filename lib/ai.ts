// In /lib/ai.ts

import Groq from 'groq-sdk';
import { FullProperty } from './data-loader';

// 1. Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

// 2. Use a free, fast model
const MODEL_NAME = "llama-3.1-8b-instant";

// This interface is the same
export interface QueryFilters {
  city?: string;
  bhk?: number;
  budget?: number;
  possessionStatus?: 'Ready' | 'Under Construction';
  locality?: string;
}

// --- Function 1: Query Parser ---
export const parseUserQuery = async (userQuery: string): Promise<QueryFilters> => {
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
    1. **CRITICAL:** Only include a field in the JSON if the user explicitly mentions it.
    2. If a field is not mentioned, **DO NOT** include it in the JSON.
    3. **DO NOT** assume default values. If the user doesn't mention a budget, do not add a "budget" field. If the user doesn't mention "ready to move", do not add a "possessionStatus" field.
    4. The output MUST be a single, valid JSON object.
    5. If no filters are found, return an empty JSON object {}.
  `;
  try {
    // 3. This call is identical to OpenAI's
    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const responseText = response.choices[0].message.content;
    if (!responseText) {
      return {};
    }
    console.log("Groq Parse Response:", responseText);
    return JSON.parse(responseText) as QueryFilters;
  } catch (error) {
    console.error("Error parsing query with Groq:", error);
    return {};
  }
};

// --- Function 2: Summary Generator ---
export const generateSummary = async (query: string, properties: FullProperty[]): Promise<string> => {
  if (properties.length === 0) {
    return "No properties matched your criteria. You could try expanding your search, for example, by increasing your budget or looking in a nearby locality.";
  }

  const simplifiedProperties = properties.map(p => ({
    name: p.projectName,
    address: p.fullAddress,
    bhk: p.bhk,
    price: p.price,
    status: p.status,
  }));

  const prompt = `
    You are a helpful real estate assistant. I have just run a search for a user
    who asked: "${query}"
    I found the following properties (as a JSON array):
    ${JSON.stringify(simplifiedProperties)}
    Please generate a short, 2-4 sentence summary of these results.
    Rules:
    1. Be helpful and professional.
    2. The summary MUST be grounded *only* in the data provided.
    3. DO NOT hallucinate.
    4. Highlight a key trend (e.g., "I found 5 properties, most of which are in the Wakad area...").
  `;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: prompt }
      ],
      temperature: 0.5,
    });
    return response.choices[0].message.content || "I found some properties for you, but I'm having trouble summarizing them.";
  } catch (error) {
    console.error("Error generating summary with Groq:", error);
    return "I found some properties for you, but I'm having trouble summarizing them at the moment.";
  }
};