import { SOPREMA_MATERIALS } from "../data";
import type { Layer, RoofParams, SavedProject } from "../types";

export const DEFAULT_PARAMS: RoofParams = {
  area: 10000,
  pitch: 0.25,
  location: "",
  wasteFactor: 0.1,
  unitSystem: "imperial",
  name: "Untitled roof project",
  client: "",
  projectNotes: "",
  areaBasis: "plan",
  projectType: "commercial",
  deck: "",
  useSamplePrices: false,
  freight: 0,
  taxPercent: 0,
};
const LIMIT = 120000;
type RecordValue = Record<string, unknown>;
function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object.`);
  return value as RecordValue;
}
function number(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error(`${label} must be between ${min} and ${max}.`);
  return value;
}
function string(value: unknown, label: string, limit: number): string {
  if (typeof value !== "string" || value.length > limit)
    throw new Error(`${label} must be text of at most ${limit} characters.`);
  return value;
}
function enumValue<T extends string>(
  value: unknown,
  choices: readonly T[],
  label: string,
): T {
  if (!choices.includes(value as T)) throw new Error(`Invalid ${label}.`);
  return value as T;
}
export function parseProject(value: unknown): {
  schemaVersion: 2;
  params: RoofParams;
  layers: Layer[];
} {
  const root = record(value, "Project");
  if (root.schemaVersion !== undefined && root.schemaVersion !== 2)
    throw new Error("Unsupported project version.");
  const raw = record(root.params, "Project parameters");
  const unitSystem = enumValue(
    raw.unitSystem ?? "imperial",
    ["imperial", "metric"] as const,
    "unit system",
  );
  const factor =
    root.schemaVersion === undefined && unitSystem === "metric"
      ? 1 / 0.09290304
      : 1;
  const params: RoofParams = {
    ...DEFAULT_PARAMS,
    area: number(raw.area, "Roof area", 0.001, 100000000) * factor,
    pitch: number(raw.pitch ?? 0.25, "Pitch", 0, 24),
    wasteFactor: number(raw.wasteFactor ?? 0.1, "Waste factor", 0, 1),
    location: string(raw.location ?? "", "Location", 500),
    unitSystem,
  };
  for (const key of [
    "name",
    "client",
    "projectNotes",
    "state",
    "country",
    "deck",
    "climateZone",
  ] as const) {
    if (raw[key] !== undefined)
      params[key] = string(raw[key], key, key === "projectNotes" ? 20000 : 500);
  }
  if (raw.areaBasis !== undefined)
    params.areaBasis = enumValue(
      raw.areaBasis,
      ["plan", "surface"] as const,
      "area basis",
    );
  if (raw.projectType !== undefined)
    params.projectType = enumValue(
      raw.projectType,
      ["commercial", "residential"] as const,
      "project type",
    );
  if (raw.useSamplePrices !== undefined) {
    if (typeof raw.useSamplePrices !== "boolean")
      throw new Error("Sample pricing must be a boolean.");
    params.useSamplePrices = raw.useSamplePrices;
  }
  for (const key of [
    "laborPerSqFt",
    "freight",
    "taxPercent",
    "targetRValue",
    "allowableDeadLoadKgM2",
    "vocLimit",
  ] as const) {
    if (raw[key] !== undefined)
      params[key] =
        raw[key] === null
          ? null
          : number(raw[key], key, 0, key === "taxPercent" ? 100 : 10000000);
  }
  if (raw.coordinates !== undefined) {
    const point = record(raw.coordinates, "Coordinates");
    params.coordinates = {
      lat: number(point.lat, "Latitude", -90, 90),
      lng: number(point.lng, "Longitude", -180, 180),
    };
  }
  if (raw.visualizer !== undefined) {
    const view = record(raw.visualizer, "Visualizer");
    params.visualizer = {
      zoom: number(view.zoom ?? 1, "Zoom", 0.1, 5),
      explosion: number(view.explosion ?? 1, "Explosion", 0, 200),
      rotation: number(view.rotation ?? 0, "Rotation", -360, 360),
      weather: enumValue(
        view.weather ?? "none",
        ["none", "rain", "snow"] as const,
        "weather",
      ),
      weatherIntensity: number(
        view.weatherIntensity ?? 0.5,
        "Weather intensity",
        0,
        100,
      ),
    };
  }
  if (!Array.isArray(root.layers) || root.layers.length > 100)
    throw new Error("Project must have at most 100 layers.");
  const ids = new Set<string>();
  const layers: Layer[] = root.layers
    .map((value, index) => {
      const rawLayer = record(value, "Layer");
      const id = string(rawLayer.id, "Layer ID", 150);
      if (!id || ids.has(id))
        throw new Error("Each layer must have a unique ID.");
      ids.add(id);
      const materialId =
        rawLayer.materialId ?? record(rawLayer.material, "Material").id;
      const material = SOPREMA_MATERIALS.find((item) => item.id === materialId);
      if (!material) throw new Error(`Unknown product in layer ${index + 1}.`);
      const layer: Layer = {
        id,
        material,
        order: number(rawLayer.order ?? index, "Layer order", 0, 10000),
      };
      for (const key of [
        "coverageOverride",
        "priceOverride",
        "areaOverride",
      ] as const) {
        if (rawLayer[key] !== undefined)
          layer[key] =
            rawLayer[key] === null
              ? null
              : number(
                  rawLayer[key],
                  key,
                  key === "priceOverride" ? 0 : 0.000001,
                  100000000,
                );
      }
      if (rawLayer.coats !== undefined) {
        layer.coats = number(rawLayer.coats, "Coats", 1, 20);
        if (!Number.isInteger(layer.coats)) throw new Error('Coats must be a whole number.');
      }
      return layer;
    })
    .sort((a, b) => a.order - b.order)
    .map((layer, order) => ({ ...layer, order }));
  return { schemaVersion: 2, params, layers };
}
export function encodeProject(params: RoofParams, layers: Layer[]): string {
  const project = parseProject({ schemaVersion: 2, params, layers });
  const json = JSON.stringify({
    ...project,
    layers: project.layers.map(({ material, ...layer }) => ({
      ...layer,
      materialId: material.id,
    })),
  });
  const bytes = new TextEncoder().encode(json);
  if (bytes.length > LIMIT * 0.75)
    throw new Error(
      "Project is too large for a share link. Export the project JSON instead.",
    );
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
export function decodeProject(encoded: string) {
  if (encoded.length > LIMIT || !/^[A-Za-z0-9_-]+$/.test(encoded))
    throw new Error("Invalid or oversized project link.");
  try {
    const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (ch) => ch.charCodeAt(0)),
    );
    return parseProject(JSON.parse(text));
  } catch (error) {
    throw new Error(
      `Cannot load project link: ${error instanceof Error ? error.message : "Invalid data."}`,
    );
  }
}
export function parseSavedProject(value: unknown): SavedProject {
  const raw = record(value, "Saved project");
  const project = parseProject(raw);
  const id = string(raw.id, "Project ID", 150);
  if (!/^[A-Za-z0-9_-]+$/.test(id))
    throw new Error("Invalid saved project ID.");
  const date = string(raw.date, "Save date", 100);
  if (!Number.isFinite(Date.parse(date))) throw new Error("Invalid save date.");
  const thumbnail = string(raw.thumbnail ?? "", "Thumbnail", 500000);
  if (
    thumbnail &&
    !/^data:image\/(?:svg\+xml|png|jpeg);(?:base64,|charset=utf-8,)/.test(
      thumbnail,
    )
  )
    throw new Error("Invalid thumbnail format.");
  return {
    ...project,
    id,
    name: string(raw.name, "Project name", 500),
    date,
    thumbnail,
  };
}
