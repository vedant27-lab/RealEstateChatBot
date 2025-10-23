// In /lib/data-loader.ts

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Define the structure of a project object based on your CSV columns
export interface Project {
  // Example fields - you'll need to update these to match your CSV!
  projectId: string;
  projectName: string;
  city: string;
  locality: string;
  price: number;
  bhk: number;
  possessionStatus: 'Ready' | 'Under Construction';
  // ... add all other relevant fields from your CSVs
}

// This will hold our "database" in memory
let projects: Project[] = [];

export const loadProjects = async (): Promise<Project[]> => {
  // If we've already loaded the data, don't do it again.
  if (projects.length > 0) {
    return projects;
  }

  // Find the absolute path to the CSV file
  const csvFilePath = path.join(process.cwd(), 'data', 'project.csv');
  
  // A promise is used to handle the asynchronous nature of file reading
  return new Promise((resolve, reject) => {
    const results: Project[] = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // Here, you would transform the raw CSV row `data` into your `Project` type.
        // This might involve converting strings to numbers, etc.
        // For now, we'll assume a direct mapping.
        results.push(data); 
      })
      .on('end', () => {
        console.log('CSV data loaded and processed successfully.');
        projects = results; // Cache the results in our `projects` variable
        resolve(projects);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// You'll also need a function to get the loaded data
export const getProjects = (): Project[] => {
    return projects;
}