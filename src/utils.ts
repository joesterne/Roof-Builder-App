import { Layer } from "./types";

export const getCategoryPriority = (category: string) => {
  switch (category) {
    case "Vapor Barrier":
      return 10;
    case "Insulation":
      return 20;
    case "Coverboard":
      return 30;
    case "Base Ply":
      return 40;
    case "Cap Sheet":
      return 50;
    case "Adhesive/Primer":
      return -1;
    default:
      return 100;
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

  if (lower.includes("mm")) return val * 0.0393701;
  if (lower.includes("mil")) return val * 0.001;
  return val; // assume inches if 'inch' or no unit
};

export const parseRValue = (
  rValueStr?: string,
  thicknessInches: number = 0,
): number => {
  if (!rValueStr) return 0;
  const lower = rValueStr.toLowerCase();
  const val = parseFloat(lower);
  if (isNaN(val)) return 0;

  if (lower.includes("per inch")) {
    return val * thicknessInches;
  }
  return val;
};

export const FT2_TO_M2 = 0.09290304;
export const displayArea = (ft2: number, unit: "imperial" | "metric") =>
  unit === "metric" ? ft2 * FT2_TO_M2 : ft2;
export const inputArea = (value: number, unit: "imperial" | "metric") =>
  unit === "metric" ? value / FT2_TO_M2 : value;
export const areaUnit = (unit: "imperial" | "metric") =>
  unit === "metric" ? "m²" : "ft²";
export const formatNumber = (value: number | null | undefined, digits = 2) =>
  value == null || !Number.isFinite(value)
    ? "Unknown"
    : value.toLocaleString("en-US", { maximumFractionDigits: digits });
export const money = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? "Not quoted"
    : value.toLocaleString("en-US", { style: "currency", currency: "USD" });
export const displayThickness = (
  mm: number | null | undefined,
  unit: "imperial" | "metric",
) =>
  mm == null
    ? "Unknown"
    : `${formatNumber(unit === "metric" ? mm : mm / 25.4, 3)} ${unit === "metric" ? "mm" : "in"}`;
export const displayWeight = (
  kgm2: number | null | undefined,
  unit: "imperial" | "metric",
) =>
  kgm2 == null
    ? "Unknown"
    : `${formatNumber(unit === "metric" ? kgm2 : kgm2 * 0.204816144)} ${unit === "metric" ? "kg/m²" : "lb/ft²"}`;
