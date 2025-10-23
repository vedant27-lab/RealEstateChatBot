// In /app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { loadProjects, getProjects } from '@/lib/data-loader';

// Ensure data is loaded once when the server starts
// The `await` here works because this is a top-level operation in the module.
await loadProjects();

export async function POST(request: Request) {
  try {
    // Today, we expect a request body with specific filters, like:
    // { "bhk": 3, "city": "Pune", "budget": 12000000 }
    const filters = await request.json();

    console.log("Received filters:", filters);

    const allProjects = getProjects();

    // The core filtering logic. This is the "search engine".
    const filteredProjects = allProjects.filter(project => {
      let isMatch = true;

      if (filters.city && project.city.toLowerCase() !== filters.city.toLowerCase()) {
        isMatch = false;
      }
      if (filters.bhk && project.bhk !== filters.bhk) {
        isMatch = false;
      }
      if (filters.budget && project.price > filters.budget) {
        isMatch = false;
      }
      // ... you can add more filter conditions here

      return isMatch;
    });

    // We'll just return the raw data for now.
    // Tomorrow, we'll add the AI summary.
    return NextResponse.json({
      summary: `Found ${filteredProjects.length} matching properties.`, // A temporary summary
      properties: filteredProjects.slice(0, 5), // Return top 5 matches
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}