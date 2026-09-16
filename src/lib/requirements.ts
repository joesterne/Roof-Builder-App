import type { Layer, Material, RoofParams } from '../types';

export type ReviewStatus = 'Needs data' | 'Review' | 'Meets entered criterion';
export interface ReviewSource { label: string; url: string }
export interface RequirementReview {
  id: string;
  title: string;
  status: ReviewStatus;
  detail: string;
  sources: ReviewSource[];
}
export interface MaterialDefinition {
  material: string;
  description: string;
  environmentalImpact: string;
  sources: ReviewSource[];
}
export interface RequirementsReport {
  systemOverview: string;
  jurisdiction: string;
  checkedAt: string;
  requirements: RequirementReview[];
  localRegulations: string[];
  materialDefinitions: MaterialDefinition[];
}
export interface Coordinates { lat: number; lng: number }
export interface ClimateSummary {
  status: 'ready' | 'needs-data';
  startDate: string;
  endDate: string;
  source: string;
  sourceUrl: string;
  model: 'ERA5';
  expectedDays: number;
  validDays: number;
  years: number;
  freezeDaysPerYear: number | null;
  hotDaysPerYear: number | null;
  annualPrecipitationMm: number | null;
  lowestDailyMinimumC: number | null;
  highestDailyMaximumC: number | null;
  message: string;
}
export interface ClimateSuggestion {
  category: string;
  material: string;
  reason: string;
  productUrl?: string;
}

const OHIO_ROOF: ReviewSource = {
  label: 'Ohio roof assemblies rule — effective March 1, 2024',
  url: 'https://codes.ohio.gov/ohio-administrative-code/rule-4101:1-15-01',
};
const OHIO_ENERGY: ReviewSource = {
  label: 'U.S. Department of Energy — Ohio code status',
  url: 'https://www.energycodes.gov/status/states/ohio',
};
export const CLIMATE_SOURCE_URL = 'https://open-meteo.com/en/docs/historical-weather-api';

export function safeSourceUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch { return undefined; }
}
export function validCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') return false;
  const { lat, lng } = value as Coordinates;
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90
    && typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
function numberKnown(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function productSources(material: Material): ReviewSource[] {
  const sources: ReviewSource[] = [];
  const product = safeSourceUrl(material.productUrl);
  const dataSheet = safeSourceUrl(material.dataSheetUrl);
  if (product) sources.push({ label: 'Manufacturer product information', url: product });
  if (dataSheet) sources.push({ label: 'Product data sheet', url: dataSheet });
  return sources;
}

/** Deterministic preliminary review. No status asserts code or engineering approval. */
export function reviewRequirements(params: RoofParams, layers: Layer[], now = new Date()): RequirementsReport {
  const requirements: RequirementReview[] = [];
  const country = (params.country || '').trim().toUpperCase();
  const state = (params.state || '').trim().toUpperCase();
  const isUS = ['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(country);
  const ohio = isUS && ['OH', 'OHIO'].includes(state);
  const jurisdiction = ohio ? 'Ohio, United States' : 'No configured jurisdiction';
  const add = (id: string, title: string, status: ReviewStatus, detail: string, sources: ReviewSource[] = []) => {
    requirements.push({ id, title, status, detail, sources });
  };
  add('jurisdiction', 'Applicable jurisdiction', 'Needs data', ohio
    ? 'Ohio source records are available. Confirm the municipality, occupancy, permit date, project scope, and applicable amendments with the authority having jurisdiction. A map pin alone does not establish the governing code.'
    : 'Enter country and state explicitly. Source records are currently configured for Ohio only. Other jurisdictions require verified local sources before any regional rule can be evaluated.', ohio ? [OHIO_ROOF, OHIO_ENERGY] : []);
  if (ohio) {
    add('roof-code', 'Roof assembly code reference', 'Review', 'Ohio rule 4101:1-15-01 incorporates 2021 IBC Chapter 15 with modifications. Confirm that the building is within this code’s scope and review the selected assembly, attachments, drainage, fire classification, and reroofing provisions.', [OHIO_ROOF]);
    add('energy-code', 'Energy code reference', 'Review', params.projectType === 'residential'
      ? 'DOE lists Ohio’s residential energy code as the 2018 IECC with amendments, effective July 1, 2019. Verify project scope and applicable insulation requirements before entering a target.'
      : params.projectType === 'commercial'
        ? 'DOE lists Ohio’s commercial energy code as the 2021 IECC / ASHRAE 90.1-2019 with amendments, effective March 1, 2024. Verify the compliance path, climate zone, and roof construction before entering a target.'
        : 'Select the building type. DOE lists different commercial and residential energy code editions for Ohio; the correct insulation target also depends on project scope and the compliance path.', [OHIO_ENERGY]);
  }
  const pitchValid = numberKnown(params.pitch) && params.pitch <= 24;
  const factor = pitchValid ? Math.hypot(1, params.pitch / 12) : 1;
  const areaValid = numberKnown(params.area) && params.area > 0 && params.area <= 1e9;
  const surfaceArea = areaValid ? params.area * (params.areaBasis === 'surface' ? 1 : factor) : 0;
  const planArea = surfaceArea / factor;
  const thermalLayers = layers.filter(layer => ['Insulation', 'Coverboard'].includes(layer.material.category));
  const thermalKnown = thermalLayers.filter(layer => numberKnown(layer.material.rValue) && productSources(layer.material).length > 0
    && (layer.areaOverride == null || (areaValid && Math.abs(layer.areaOverride - surfaceArea) < 0.001))
    && (layer.coats == null || layer.coats === 1));
  const rValue = thermalKnown.reduce((sum, layer) => sum + layer.material.rValue!, 0);
  const target = params.targetRValue;
  const thermalUnit = params.unitSystem === 'metric' ? 'RSI (m²·K/W)' : 'R (h·ft²·°F/Btu)';
  const thermalDisplay = (value: number) => (params.unitSystem === 'metric' ? value / 5.678263 : value).toFixed(2);
  add('thermal', 'Entered insulation target',
    !areaValid || !pitchValid || !numberKnown(target) || target === 0 || thermalLayers.length === 0 || thermalKnown.length !== thermalLayers.length
      ? 'Needs data' : rValue >= target ? 'Meets entered criterion' : 'Review',
    `Known insulation and coverboard subtotal: ${thermalDisplay(rValue)} ${thermalUnit}. ${thermalLayers.length - thermalKnown.length} selected thermal layer(s) lack a sourced, fixed-thickness R-value over the full roof area. ${numberKnown(target) && target > 0 ? `Entered target: ${thermalDisplay(target)} ${thermalUnit}.` : 'Enter a project-specific target from the approved design.'} This sum excludes air films, thermal bridging, fasteners, and changes in insulation performance with temperature.`,
    thermalKnown.flatMap(layer => productSources(layer.material)));

  // Area overrides represent installed surface area. Detail/interface loads require explicit area.
  // The result is average added mass per plan area, not a local or point-load capacity check.
  const weighted = layers.filter(layer => {
    if (!areaValid || !pitchValid || !numberKnown(layer.material.weightKgM2) || !productSources(layer.material).length) return false;
    if (layer.coats != null && layer.coats !== 1) return false; // Mass per coat is not defined in the schema.
    if (layer.areaOverride != null) return numberKnown(layer.areaOverride) && layer.areaOverride > 0 && layer.areaOverride <= 1e9;
    return !layer.material.estimateScope || layer.material.estimateScope === 'field';
  });
  const mass = weighted.reduce((sum, layer) => sum + layer.material.weightKgM2! * (layer.areaOverride ?? surfaceArea) / planArea, 0);
  const allowance = params.allowableDeadLoadKgM2;
  const massUnit = params.unitSystem === 'metric' ? 'kg/m²' : 'lb/ft²';
  const massDisplay = (value: number) => (params.unitSystem === 'metric' ? value : value * 0.2048161436).toFixed(2);
  const exceedsMass = numberKnown(allowance) && mass > allowance;
  add('dead-load', 'Entered additional dead load allowance', exceedsMass ? 'Review'
    : !areaValid || !pitchValid || layers.length === 0 || weighted.length !== layers.length || !numberKnown(allowance)
      ? 'Needs data' : 'Meets entered criterion',
    `Known selected-layer dry mass: ${massDisplay(mass)} ${massUnit} of horizontal plan area; ${layers.length - weighted.length} layer(s) lack verified mass, installed area, or coat basis. ${numberKnown(allowance) ? `Entered allowance: ${massDisplay(allowance)} ${massUnit}.` : 'Enter the project engineer’s additional dead load allowance.'} This average includes slope and installed area overrides; procurement waste is excluded. Local concentrated loads require separate checks. Retained roofing, unlisted deck/attachments, equipment, snow, live loads, and ponding remain separate design inputs. This comparison does not establish structural capacity.`, weighted.flatMap(layer => productSources(layer.material)));

  const chemicals = layers.filter(layer => ['Adhesive/Primer', 'Flashing', 'Liquid Membrane'].includes(layer.material.category));
  const knownVOC = chemicals.filter(layer => numberKnown(layer.material.vocGramsPerLiter) && productSources(layer.material).length > 0);
  const vocLimit = params.vocLimit;
  const aboveVOC = numberKnown(vocLimit) ? knownVOC.filter(layer => layer.material.vocGramsPerLiter! > vocLimit) : [];
  add('voc', 'Entered VOC product limit', aboveVOC.length ? 'Review'
    : chemicals.length === 0 || !numberKnown(vocLimit) || knownVOC.length !== chemicals.length ? 'Needs data' : 'Meets entered criterion',
    `${knownVOC.length} of ${chemicals.length} selected liquid/adhesive product(s) have sourced VOC values. ${numberKnown(vocLimit) ? `Entered limit: ${vocLimit} g/L. ${aboveVOC.length ? `Above that limit: ${aboveVOC.map(layer => layer.material.name).join(', ')}.` : ''}` : 'Enter a verified project-specific limit in g/L.'} Regional product classifications, test methods, exemptions, and installation restrictions require local review; this app does not infer a legal VOC limit from a location.`, knownVOC.flatMap(layer => productSources(layer.material)));
  add('system', 'Assembly, wind, fire, and moisture design', 'Needs data', 'Confirm the manufacturer’s tested assembly and attachment pattern for this deck, roof zones, building height, wind exposure, fire classification, drainage, and interior moisture conditions. Product names and layer order alone do not establish system approval.');
  add('environment', 'Regional environmental requirements', 'Needs data', 'Local cool-roof rules, product restrictions, stormwater requirements, disposal rules, and procurement certifications need verified jurisdiction-specific records. Environmental declarations describe products; they do not establish compliance or certify an assembled roof.');
  const unique = [...new Map(layers.map(layer => [layer.material.id, layer.material])).values()];
  const materialDefinitions = unique.map(material => {
    const evidence = (material.environmentalEvidence || []).filter(item => safeSourceUrl(item.url));
    const expired = evidence.filter(item => item.validUntil && (!Number.isFinite(Date.parse(item.validUntil)) || Date.parse(item.validUntil) + 86400000 <= now.getTime()));
    return {
      material: material.name,
      description: material.composition || material.description || 'Composition and manufacturing information have not been verified for this product.',
      environmentalImpact: evidence.length
        ? `${evidence.map(item => `${item.kind}: ${item.label}${item.validUntil ? ` (valid through ${item.validUntil})` : ' (validity not recorded)'}`).join('; ')}. ${expired.length ? 'Expired or invalid dated evidence requires an updated document. ' : ''}Confirm the covered product, manufacturing location, version, and project acceptance criteria.`
        : 'No verified environmental declaration or certification is recorded for this product. Request the current EPD, HPD, emissions certificate, and safety data sheet as applicable; no recycled content or impact advantage is assumed.',
      sources: [...productSources(material), ...evidence.map(item => ({ label: item.label, url: safeSourceUrl(item.url)! }))],
    };
  });
  return {
    systemOverview: 'Preliminary design review compares sourced material properties with the criteria you enter. Missing inputs remain visible. Code applicability, assembly approval, and engineering design require project-specific verification.',
    jurisdiction,
    checkedAt: '2026-09-15',
    requirements,
    localRegulations: requirements.map(item => `${item.title}: ${item.status}. ${item.detail}`),
    materialDefinitions,
  };
}

/** Aggregate only complete, internally consistent daily historical records in Celsius/mm. */
export function summarizeClimate(raw: unknown, startDate: string, endDate: string): ClimateSummary {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const expectedDays = Math.round((end - start) / 86400000) + 1;
  if (!Number.isFinite(expectedDays) || expectedDays < 1 || expectedDays > 2200
    || !/^\d{4}-01-01$/.test(startDate) || !/^\d{4}-12-31$/.test(endDate)) {
    throw new Error('A complete calendar-year period is required.');
  }
  const years = Number(endDate.slice(0, 4)) - Number(startDate.slice(0, 4)) + 1;
  const base: ClimateSummary = {
    status: 'needs-data', startDate, endDate, source: 'Open-Meteo historical weather / ECMWF ERA5',
    sourceUrl: CLIMATE_SOURCE_URL, model: 'ERA5', expectedDays, validDays: 0, years,
    freezeDaysPerYear: null, hotDaysPerYear: null, annualPrecipitationMm: null,
    lowestDailyMinimumC: null, highestDailyMaximumC: null,
    message: 'Historical records are incomplete or invalid. Climate recommendations are unavailable.',
  };
  if (!raw || typeof raw !== 'object') return base;
  const data = raw as Record<string, unknown>;
  const daily = data.daily as Record<string, unknown> | undefined;
  const units = data.daily_units as Record<string, unknown> | undefined;
  if (!daily || !units || units.temperature_2m_min !== '°C' || units.temperature_2m_max !== '°C' || units.precipitation_sum !== 'mm') return base;
  const dates = daily.time;
  const lows = daily.temperature_2m_min;
  const highs = daily.temperature_2m_max;
  const rain = daily.precipitation_sum;
  if (!Array.isArray(dates) || !Array.isArray(lows) || !Array.isArray(highs) || !Array.isArray(rain)) return base;
  const uniqueDates = new Set<string>();
  let freezing = 0, hot = 0, precipitation = 0, lowest = Infinity, highest = -Infinity, validDays = 0;
  for (let i = 0; i < expectedDays; i += 1) {
    const expectedDate = new Date(start + i * 86400000).toISOString().slice(0, 10);
    const low = lows[i], high = highs[i], wet = rain[i];
    if (dates[i] !== expectedDate || uniqueDates.has(dates[i]) || typeof low !== 'number' || !Number.isFinite(low)
      || typeof high !== 'number' || !Number.isFinite(high) || low < -100 || high > 70 || low > high
      || typeof wet !== 'number' || !Number.isFinite(wet) || wet < 0 || wet > 3000) continue;
    uniqueDates.add(dates[i]);
    validDays += 1;
    if (low < 0) freezing += 1;
    if (high >= 30) hot += 1;
    precipitation += wet;
    lowest = Math.min(lowest, low);
    highest = Math.max(highest, high);
  }
  if (validDays !== expectedDays || [dates, lows, highs, rain].some(values => values.length !== expectedDays)) return { ...base, validDays };
  return {
    ...base, status: 'ready', validDays,
    freezeDaysPerYear: freezing / years, hotDaysPerYear: hot / years,
    annualPrecipitationMm: precipitation / years, lowestDailyMinimumC: lowest, highestDailyMaximumC: highest,
    message: `${years}-year historical screening uses modeled daily air temperatures and precipitation. It is not a 30-year climate normal, roof-surface temperature, or a design wind/snow load.`,
  };
}

/** Explicit screening heuristics; candidate products still require a compatible approved assembly. */
export function getClimateSuggestions(climate: ClimateSummary, catalog: Material[]): ClimateSuggestion[] {
  if (climate.status !== 'ready') return [];
  const suggestions: ClimateSuggestion[] = [];
  const supported = catalog.filter(material => safeSourceUrl(material.productUrl));
  if (climate.freezeDaysPerYear !== null && climate.freezeDaysPerYear >= 30) {
    const product = supported.find(material => ['Base Ply', 'Cap Sheet'].includes(material.category)
      && /\bSBS\b/i.test(`${material.composition || ''} ${material.description}`));
    if (product) suggestions.push({ category: product.category, material: product.name, productUrl: product.productUrl,
      reason: `Screening trigger: ${climate.freezeDaysPerYear.toFixed(0)} days/year below 0 °C (threshold: 30). This SBS membrane is a candidate for review of the manufacturer’s low-temperature performance and application limits. Confirm the complete system, installation temperature, and attachment method.` });
  }
  if (climate.hotDaysPerYear !== null && climate.hotDaysPerYear >= 30) {
    const product = supported.find(material => ['Cap Sheet', 'PVC Membrane'].includes(material.category)
      && (/reflective|cool.roof|soprastar/i.test(`${material.name} ${material.description}`)
        || Number(material.techSpecs?.['Aged SRI']) >= 64));
    if (product) suggestions.push({ category: product.category, material: product.name, productUrl: product.productUrl,
      reason: `Screening trigger: ${climate.hotDaysPerYear.toFixed(0)} days/year at or above 30 °C (threshold: 30). Catalog screening uses aged SRI ≥ 64 or a documented reflective product description. Review this reflective membrane option, its current aged reflectance/emittance evidence, and whole-building energy performance. This threshold is a design heuristic, not a code requirement.` });
  }
  return suggestions;
}
