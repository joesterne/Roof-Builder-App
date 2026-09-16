import test from 'node:test';
import assert from 'node:assert/strict';
import { getClimateSuggestions, reviewRequirements, summarizeClimate, validCoordinates } from '../src/lib/requirements';
import { ACTIVE_MATERIALS } from '../src/data';
import type { Layer, Material, RoofParams } from '../src/types';

const params: RoofParams = { area: 1000, pitch: 0, wasteFactor: 0.1, unitSystem: 'imperial', location: 'Twinsburg', country: 'US', state: 'OH', projectType: 'commercial' };
const material: Material = { id: 'test-board', name: 'Test board', category: 'Insulation', unit: 'board', description: 'Test property fixture', coveragePerUnit: 32, pricePerUnit: 50, weightKgM2: 10, rValue: 11.4, estimateScope: 'field', productUrl: 'https://example.com/verified-product' };
const layer = (changes: Partial<Layer> = {}): Layer => ({ id: 'layer-one', order: 0, material, ...changes });
const requirement = (report: ReturnType<typeof reviewRequirements>, id: string) => report.requirements.find(item => item.id === id)!;
function weatherYear(low = -5, high = 31, precipitation = 2) {
  const time = Array.from({ length: 365 }, (_, index) => new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10));
  return { daily_units: { temperature_2m_min: '°C', temperature_2m_max: '°C', precipitation_sum: 'mm' }, daily: { time, temperature_2m_min: time.map(() => low), temperature_2m_max: time.map(() => high), precipitation_sum: time.map(() => precipitation) } };
}

test('Ohio jurisdiction requires explicit country and state; free-text address and unknown states do not imply verified codes', () => {
  const report = reviewRequirements({ ...params, country: '', state: '', location: 'Twinsburg, Ohio' }, [layer()]);
  assert.equal(report.jurisdiction, 'No configured jurisdiction');
  assert.equal(requirement(report, 'jurisdiction').status, 'Needs data');
  assert.equal(report.requirements.some(item => item.id === 'roof-code'), false);
  assert.equal(reviewRequirements({ ...params, state: 'CA' }, []).jurisdiction, 'No configured jurisdiction');
  const ohio = reviewRequirements(params, [layer()]);
  assert.match(requirement(ohio, 'roof-code').sources[0].url, /codes\.ohio\.gov/);
  assert.equal(requirement(ohio, 'jurisdiction').status, 'Needs data');
});

test('unknown weight cannot meet an entered structural allowance', () => {
  const unknown = layer({ material: { ...material, weightKgM2: undefined } });
  assert.equal(requirement(reviewRequirements({ ...params, allowableDeadLoadKgM2: 20 }, [unknown]), 'dead-load').status, 'Needs data');
  const unsourced = layer({ material: { ...material, productUrl: undefined } });
  assert.equal(requirement(reviewRequirements({ ...params, allowableDeadLoadKgM2: 20 }, [unsourced]), 'dead-load').status, 'Needs data');
});

test('dead load includes slope, ignores waste, and handles surface area input consistently', () => {
  const designed = { ...params, pitch: 12, allowableDeadLoadKgM2: 12 };
  const field = [layer()];
  assert.equal(requirement(reviewRequirements(designed, field), 'dead-load').status, 'Review');
  assert.equal(requirement(reviewRequirements({ ...designed, wasteFactor: 1 }, field), 'dead-load').detail, requirement(reviewRequirements(designed, field), 'dead-load').detail);
  const metric = requirement(reviewRequirements({ ...designed, unitSystem: 'metric' }, field), 'dead-load');
  assert.match(metric.detail, /14\.14 kg\/m²/);
  assert.equal(requirement(reviewRequirements({ ...designed, areaBasis: 'surface', area: 1000 * Math.SQRT2 }, field), 'dead-load').status, 'Review');
});

test('detail and interface weights require installed area and use the measured proportion', () => {
  const designed = { ...params, unitSystem: 'metric' as const, allowableDeadLoadKgM2: 2 };
  const detailMaterial = { ...material, category: 'Flashing' as const, estimateScope: 'detail' as const };
  const unmeasured = layer({ material: detailMaterial });
  assert.equal(requirement(reviewRequirements(designed, [unmeasured]), 'dead-load').status, 'Needs data');
  const measured = layer({ material: detailMaterial, areaOverride: 100 });
  const result = requirement(reviewRequirements(designed, [measured]), 'dead-load');
  assert.equal(result.status, 'Meets entered criterion');
  assert.match(result.detail, /1\.00 kg\/m²/);
  const interfaceLayer = layer({ material: { ...material, category: 'Adhesive/Primer', estimateScope: 'interface' } });
  assert.equal(requirement(reviewRequirements(designed, [interfaceLayer]), 'dead-load').status, 'Needs data');
  assert.equal(requirement(reviewRequirements(designed, [layer({ coats: 2 })]), 'dead-load').status, 'Needs data');
});

test('partial-area insulation and unknown thickness R-values cannot meet full-roof thermal target', () => {
  const designed = { ...params, targetRValue: 10 };
  assert.equal(requirement(reviewRequirements(designed, [layer()]), 'thermal').status, 'Meets entered criterion');
  assert.equal(requirement(reviewRequirements(designed, [layer({ areaOverride: 100 })]), 'thermal').status, 'Needs data');
  assert.equal(requirement(reviewRequirements(designed, [layer({ material: { ...material, rValue: undefined } })]), 'thermal').status, 'Needs data');
  assert.equal(requirement(reviewRequirements({ ...designed, unitSystem: 'metric' }, [layer()]), 'thermal').status, 'Meets entered criterion');
});

test('VOC values compare only with an explicit project limit and do not assume jurisdictional limits', () => {
  const adhesive = layer({ material: { ...material, category: 'Adhesive/Primer', vocGramsPerLiter: 5 } });
  assert.equal(requirement(reviewRequirements(params, [adhesive]), 'voc').status, 'Needs data');
  assert.equal(requirement(reviewRequirements({ ...params, vocLimit: 10 }, [adhesive]), 'voc').status, 'Meets entered criterion');
  assert.equal(requirement(reviewRequirements({ ...params, vocLimit: 0 }, [adhesive]), 'voc').status, 'Review');
});

test('historical aggregation counts every calendar day and precipitation without treating daily temperatures as current weather', () => {
  const result = summarizeClimate(weatherYear(), '2025-01-01', '2025-12-31');
  assert.equal(result.status, 'ready');
  assert.equal(result.expectedDays, 365);
  assert.equal(result.validDays, 365);
  assert.equal(result.freezeDaysPerYear, 365);
  assert.equal(result.hotDaysPerYear, 365);
  assert.equal(result.annualPrecipitationMm, 730);
  assert.equal(result.lowestDailyMinimumC, -5);
  assert.equal(result.highestDailyMaximumC, 31);
});

test('missing, duplicate, invalid, and incompatible-unit climate data never produces reassuring statistics', () => {
  const missing = weatherYear();
  missing.daily.temperature_2m_min[1] = null as unknown as number;
  const partial = summarizeClimate(missing, '2025-01-01', '2025-12-31');
  assert.equal(partial.status, 'needs-data');
  assert.equal(partial.validDays, 364);
  assert.equal(partial.freezeDaysPerYear, null);
  assert.deepEqual(getClimateSuggestions(partial, ACTIVE_MATERIALS), []);
  const duplicates = weatherYear();
  duplicates.daily.time[1] = duplicates.daily.time[0];
  assert.equal(summarizeClimate(duplicates, '2025-01-01', '2025-12-31').status, 'needs-data');
  const invalid = weatherYear();
  invalid.daily.precipitation_sum[0] = -1;
  assert.equal(summarizeClimate(invalid, '2025-01-01', '2025-12-31').status, 'needs-data');
  const fahrenheit = weatherYear();
  fahrenheit.daily_units.temperature_2m_min = '°F';
  assert.equal(summarizeClimate(fahrenheit, '2025-01-01', '2025-12-31').status, 'needs-data');
});

test('explicit freezing and heat thresholds return sourced SBS and reflective candidates; temperate data does not', () => {
  const extremes = summarizeClimate(weatherYear(), '2025-01-01', '2025-12-31');
  const suggestions = getClimateSuggestions(extremes, ACTIVE_MATERIALS);
  assert.equal(suggestions.length, 2);
  assert.match(suggestions[0].reason, /threshold: 30/);
  assert.ok(suggestions.some(item => item.material.includes('SENTINEL')));
  assert.ok(suggestions.every(item => item.productUrl?.startsWith('https://www.soprema.us/')));
  const temperate = summarizeClimate(weatherYear(10, 20), '2025-01-01', '2025-12-31');
  assert.deepEqual(getClimateSuggestions(temperate, ACTIVE_MATERIALS), []);
});

test('coordinates reject strings, missing values, non-finite values, and values outside geographic limits', () => {
  assert.equal(validCoordinates({ lat: 0, lng: 0 }), true);
  assert.equal(validCoordinates({ lat: -90, lng: 180 }), true);
  for (const point of [{ lat: '41', lng: -81 }, { lat: null, lng: 0 }, { lat: Infinity, lng: 0 }, { lat: 91, lng: 0 }, { lat: 0, lng: -181 }, null, []]) {
    assert.equal(validCoordinates(point), false);
  }
});
