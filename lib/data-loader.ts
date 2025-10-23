// In /lib/data-loader.ts

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// --- Define all our data structures ---
// These interfaces must match your CSV columns *exactly*

interface Project {
  id: string; // The key
  projectName: string;
  projectType: string;
  projectCategory: string;
  status: string;
  possessionDate: string;
  cityId: string; // We'll need to map this to a city name if you have a city.csv
}

interface ProjectAddress {
  id: string;
  projectId: string; // Foreign key to Project
  fullAddress: string;
  pincode: string;
  landmark: string;
}

interface ProjectConfiguration {
  id: string; // The key
  projectId: string; // Foreign key to Project
  type: string; // This is probably the BHK (e.g., "3BHK")
  customBHK: string;
}

interface ProjectConfigurationVariant {
  id: string;
  configurationId: string; // Foreign key to ProjectConfiguration
  bathrooms: string;
  floorPlanImage: string;
  carpetArea: string;
  price: string;
  propertyImages: string; // This is probably a comma-separated list of URLs
  aboutProperty: string;
}

export interface FullProperty {

  id: string; // We'll use the Variant ID as the unique key
  projectId: string;
  projectName: string;
  status: string;
  possessionDate: string;
  
  fullAddress: string;
  pincode: string;

  bhk: string; // e.g., "3BHK"

  price: number;
  bathrooms: number;
  carpetArea: string;
  aboutProperty: string;
  floorPlanImage: string;
  propertyImages: string[]; // We will split the string into an array
}

async function loadCSV<T>(filename: string): Promise<T[]> {
  const csvFilePath = path.join(process.cwd(), 'data', filename);
  const results: T[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}


let fullProperties: FullProperty[] = [];

export const loadProjects = async (): Promise<FullProperty[]> => {
  if (fullProperties.length > 0) {
    return fullProperties;
  }

  console.log('Loading and merging all 4 CSVs...');

  try {
    const [projects, addresses, configs, variants] = await Promise.all([
      loadCSV<Project>('project.csv'),
      loadCSV<ProjectAddress>('ProjectAddress.csv'),
      loadCSV<ProjectConfiguration>('ProjectConfiguration.csv'),
      loadCSV<ProjectConfigurationVariant>('ProjectConfigurationVariant.csv')
    ]);

    const projectMap = new Map(projects.map(p => [p.id, p]));
    const addressMap = new Map(addresses.map(a => [a.projectId, a]));
    const configMap = new Map(configs.map(c => [c.id, c]));

    const mergedProperties: FullProperty[] = [];
    
    for (const variant of variants) {
      const config = configMap.get(variant.configurationId);
      if (!config) continue; // Skip if no parent config

      const project = projectMap.get(config.projectId);
      if (!project) continue; // Skip if no parent project
      
      const address = addressMap.get(config.projectId);
      if (!address) continue; // Skip if no parent address

      mergedProperties.push({
        id: variant.id, // Use variant ID as the unique key
        projectId: project.id,
        projectName: project.projectName,
        status: project.status,
        possessionDate: project.possessionDate,
        fullAddress: address.fullAddress,
        pincode: address.pincode,
        bhk: config.type, // Assuming 'type' is the BHK
        
        price: parseInt(variant.price, 10) || 0,
        bathrooms: parseInt(variant.bathrooms, 10) || 0,
        carpetArea: variant.carpetArea,
        aboutProperty: variant.aboutProperty,
        floorPlanImage: variant.floorPlanImage,
        propertyImages: variant.propertyImages ? JSON.parse(variant.propertyImages) : [],      });
    }

    fullProperties = mergedProperties;
    console.log(`Successfully loaded and merged ${fullProperties.length} properties.`);
    return fullProperties;

  } catch (error) {
    console.error("Error loading or merging CSV data:", error);
    return []; // Return empty on error
  }
};

export const getProjects = (): FullProperty[] => {
  return fullProperties;
};