export type Category = 'Deck' | 'Vapor Barrier' | 'Insulation' | 'Coverboard' | 'Base Ply' | 'Cap Sheet' | 'Adhesive/Primer';

export interface Material {
  id: string;
  name: string;
  category: Category;
  description: string;
  unit: string;
  coveragePerUnit: number; // e.g. sq ft per roll/bucket/board
  pricePerUnit: number;
  colorHex?: string;
  techSpecs?: Record<string, string>;
  certifications?: string[];
  productUrl?: string;
}

export interface Layer {
  id: string;
  material: Material;
  order: number;
}

export interface RoofParams {
  area: number;
  pitch: number; // e.g., 2 for 2/12
  location: string;
  coordinates?: { lat: number; lng: number };
  climateData?: { temperature: number; conditions: string };
  wasteFactor: number; // percentage, e.g., 0.1 for 10%
  projectNotes?: string;
  unitSystem: 'imperial' | 'metric';
}

export interface BOMItem {
  material: Material;
  quantity: number;
  totalCost: number;
}

export interface CodeAnalysis {
  systemOverview: string;
  localRegulations: string[];
  materialDefinitions: {
    material: string;
    description: string;
    environmentalImpact: string;
  }[];
}
