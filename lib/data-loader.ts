
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';


interface Project {
  id: string; // The key
  projectName: string;
  projectType: string;
  projectCategory: string;
  status: string;
  possessionDate: string;
  cityId: string;  
}

interface ProjectAddress {
  id: string;
  projectId: string;
  fullAddress: string;
  pincode: string;
  landmark: string;
}

interface ProjectConfiguration {
  id: string; 
  projectId: string; 
  type: string; 
  customBHK: string;
}

interface ProjectConfigurationVariant {
  id: string;
  configurationId: string; 
  bathrooms: string;
  floorPlanImage: string;
  carpetArea: string;
  price: string;
  propertyImages: string; 
  aboutProperty: string;
}

export interface FullProperty {

  id: string; 
  projectId: string;
  projectName: string;
  status: string;
  possessionDate: string;
  
  fullAddress: string;
  pincode: string;

  bhk: string;
  price: number;
  bathrooms: number;
  carpetArea: string;
  aboutProperty: string;
  floorPlanImage: string;
  propertyImages: string[]; 
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
      if (!config) continue; 

      const project = projectMap.get(config.projectId);
      if (!project) continue; 
      
      const address = addressMap.get(config.projectId);
      if (!address) continue; 

      mergedProperties.push({
        id: variant.id, 
        projectId: project.id,
        projectName: project.projectName,
        status: project.status,
        possessionDate: project.possessionDate,
        fullAddress: address.fullAddress,
        pincode: address.pincode,
        bhk: config.type, 
        
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
    return []; 
  }
};

export const getProjects = (): FullProperty[] => {
  return fullProperties;
};