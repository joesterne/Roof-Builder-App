export type Category =
  | "Deck"
  | "Vapor Barrier"
  | "Insulation"
  | "Coverboard"
  | "Base Ply"
  | "Cap Sheet"
  | "Adhesive/Primer"
  | "Flashing"
  | "PVC Membrane";
export type UnitSystem = "imperial" | "metric";
export interface Evidence {
  label: string;
  url: string;
  kind: "disclosure" | "certification";
  validUntil?: string;
}
export interface Material {
  id: string;
  name: string;
  category: Category;
  description: string;
  unit: string;
  coveragePerUnit: number | null;
  pricePerUnit: number | null;
  samplePricePerUnit?: number;
  colorHex?: string;
  techSpecs?: Record<string, string>;
  certifications?: string[];
  productUrl?: string;
  dataSheetUrl?: string;
  sourceDate?: string;
  composition?: string;
  coverageNote?: string;
  coverageBasis?: "per-coat" | "system";
  estimateScope?: "field" | "detail" | "interface";
  legacyOnly?: boolean;
  thicknessMm?: number | null;
  rValue?: number | null;
  weightKgM2?: number | null;
  vocGramsPerLiter?: number | null;
  environmentalEvidence?: Evidence[];
}
export interface Layer {
  id: string;
  material: Material;
  order: number;
  coverageOverride?: number | null;
  priceOverride?: number | null;
  areaOverride?: number | null;
  coats?: number;
}
export interface ClimateData {
  temperature: number;
  conditions: string;
}
export interface RoofParams {
  area: number;
  pitch: number;
  location: string;
  coordinates?: { lat: number; lng: number };
  climateData?: ClimateData;
  wasteFactor: number;
  projectNotes?: string;
  unitSystem: UnitSystem;
  name?: string;
  client?: string;
  areaBasis?: "plan" | "surface";
  state?: string;
  country?: string;
  projectType?: "commercial" | "residential";
  deck?: string;
  climateZone?: string;
  laborPerSqFt?: number | null;
  freight?: number;
  taxPercent?: number;
  useSamplePrices?: boolean;
  targetRValue?: number | null;
  allowableDeadLoadKgM2?: number | null;
  vocLimit?: number | null;
  visualizer?: {
    zoom: number;
    explosion: number;
    rotation: number;
    weather: "none" | "rain" | "snow";
    weatherIntensity: number;
  };
}
export interface BOMItem {
  material: Material;
  quantity: number | null;
  totalCost: number | null;
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
export interface SavedProject {
  schemaVersion?: 2;
  id: string;
  name: string;
  date: string;
  params: RoofParams;
  layers: Layer[];
  thumbnail: string;
}
