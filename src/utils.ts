import { Layer } from './types';

export const getCategoryPriority = (category: string) => {
  switch (category) {
    case 'Vapor Barrier': return 10;
    case 'Insulation': return 20;
    case 'Coverboard': return 30;
    case 'Base Ply': return 40;
    case 'Cap Sheet': return 50;
    case 'Adhesive/Primer': return -1;
    default: return 100;
  }
};

export const isValidOrder = (layers: Layer[]) => {
  let highestPriority = -1;
  for (const layer of layers) {
    const priority = getCategoryPriority(layer.material.category);
    if (priority === -1) continue;
    if (priority < highestPriority) return false;
    highestPriority = priority;
  }
  return true;
};

export const parseThickness = (thicknessStr?: string): number => {
  if (!thicknessStr) return 0;
  const lower = thicknessStr.toLowerCase();
  const val = parseFloat(lower);
  if (isNaN(val)) return 0;
  
  if (lower.includes('mm')) return val * 0.0393701;
  if (lower.includes('mil')) return val * 0.001;
  return val; // assume inches if 'inch' or no unit
};

export const parseRValue = (rValueStr?: string, thicknessInches: number = 0): number => {
  if (!rValueStr) return 0;
  const lower = rValueStr.toLowerCase();
  const val = parseFloat(lower);
  if (isNaN(val)) return 0;
  
  if (lower.includes('per inch')) {
    return val * thicknessInches;
  }
  return val;
};
