// In /app/api/chat/route.ts

import { NextResponse } from 'next/server';
import { loadProjects, getProjects, FullProperty } from '@/lib/data-loader';
import { parseUserQuery, generateSummary, QueryFilters } from '@/lib/ai';

// Turn this on to see *why* properties are failing the filter
const DEBUG_FILTER = true;

// Ensure data is loaded once
await (async () => {
  try {
    await loadProjects();
  } catch (err) {
    console.error("Failed to load projects on server start:", err);
  }
})();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userMessage: string = body.message;

    if (!userMessage) {
      return NextResponse.json({ error: 'No message provided.' }, { status: 400 });
    }

    console.log("Received message:", userMessage);

    const filters: QueryFilters = await parseUserQuery(userMessage);
    console.log("Parsed filters:", filters);

    const allProjects = getProjects();

    // --- NEW: Robust Filtering Logic ---

    // 1. Clean the filters from the AI one time
    const cityFilter = filters.city ? filters.city.toLowerCase().trim() : null;
    const bhkFilter = filters.bhk ? String(filters.bhk) : null;
    const budgetFilter = filters.budget || null;
    const statusFilter = filters.possessionStatus ? filters.possessionStatus.toLowerCase().trim() : null;
    const localityFilter = filters.locality ? filters.locality.toLowerCase().trim() : null;

    const filteredProjects = allProjects.filter(project => {
      // 2. Clean the data for *each* project
      // We trim() to remove spaces and toLowerCase() for case-insensitive matching
      const projectAddress = project.fullAddress.toLowerCase();
      const projectBHK = project.bhk.trim();
      const projectStatus = project.status.toLowerCase().trim();

      // --- DEBUG LOGIC ---
      if (DEBUG_FILTER) {
        console.log(`\n--- Checking Project: ${project.projectName} ---`);
      }
      
      // 3. Run the checks
      if (cityFilter) {
        const match = projectAddress.includes(cityFilter);
        if (DEBUG_FILTER) console.log(`City Check: ${match} (Looking for '${cityFilter}' in '${projectAddress}')`);
        if (!match) return false;
      }
      
      if (bhkFilter) {
        // Use startsWith() to match "4BHK" or "4 BHK" from a "4"
        const match = projectBHK.startsWith(bhkFilter);
        if (DEBUG_FILTER) console.log(`BHK Check: ${match} (Does '${projectBHK}' start with '${bhkFilter}')`);
        if (!match) return false;
      }
      
      if (budgetFilter) {
        const match = project.price <= budgetFilter;
        if (DEBUG_FILTER) console.log(`Budget Check: ${match} (${project.price} <= ${budgetFilter})`);
        if (!match) return false;
      }
      
      if (statusFilter) {
        const match = projectStatus === statusFilter;
        if (DEBUG_FILTER) console.log(`Status Check: ${match} ('${projectStatus}' === '${statusFilter}')`);
        if (!match) return false;
      }

      if (localityFilter) {
        const match = projectAddress.includes(localityFilter);
        if (DEBUG_FILTER) console.log(`Locality Check: ${match} (Looking for '${localityFilter}' in '${projectAddress}')`);
        if (!match) return false;
      }

      // If it passed all checks, it's a match!
      if (DEBUG_FILTER) console.log(">>> MATCH FOUND <<<");
      return true;
    });

    // --- End of Filtering Logic ---

    console.log(`Found ${filteredProjects.length} matching properties.`);

    const summary = await generateSummary(userMessage, filteredProjects);

    return NextResponse.json({
      summary: summary,
      properties: filteredProjects.slice(0, 10),
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}