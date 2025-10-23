// In /app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { loadProjects, getProjects, Project } from '@/lib/data-loader';
import { parseUserQuery, generateSummary, QueryFilters } from '@/lib/gemini';

// Ensure data is loaded once when the server starts
await loadProjects();

export async function POST(request: Request) {
  try {
    // 1. Get the user's natural language message
    const body = await request.json();
    const userMessage: string = body.message;

    if (!userMessage) {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
    }

    console.log("Received message:", userMessage);

    // 2. Call Gemini to parse the message into filters
    const filters: QueryFilters = await parseUserQuery(userMessage);
    console.log("Parsed filters:", filters);

    // 3. Use the filters to search our data (same logic as Day 1)
    const allProjects = getProjects();

    const filteredProjects = allProjects.filter(project => {
      let isMatch = true;

      // We need to be careful here, as fields might be missing
      if (filters.city && project.city.toLowerCase() !== filters.city.toLowerCase()) {
        isMatch = false;
      }
      if (filters.bhk && project.bhk !== filters.bhk) {
        isMatch = false;
      }
      if (filters.budget && project.price > filters.budget) {
        isMatch = false;
      }
      if (filters.possessionStatus && project.possessionStatus !== filters.possessionStatus) {
        isMatch = false;
      }
      if (filters.locality && !project.locality.toLowerCase().includes(filters.locality.toLowerCase())) {
        isMatch = false;
      }
      // ... add more filter conditions as needed

      return isMatch;
    });

    // 4. Call Gemini to generate a summary of the results
    const summary = await generateSummary(userMessage, filteredProjects);

    // 5. Return the full response
    return NextResponse.json({
      summary: summary,
      properties: filteredProjects, // You can still slice this, e.g., .slice(0, 5)
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}