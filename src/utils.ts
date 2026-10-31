import { Layer } from "./types";

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
