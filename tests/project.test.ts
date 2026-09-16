import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PARAMS, parseProject, encodeProject, decodeProject, parseSavedProject } from '../src/lib/project';
import { SOPREMA_MATERIALS } from '../src/data';

const layers = [{id: 'layer-a', order: 0, material: SOPREMA_MATERIALS[0]}];
const project = () => ({schemaVersion: 2, params: {...DEFAULT_PARAMS}, layers});
test('Unicode project links preserve notes, numeric overrides and separate instances', () => {
  const params = {...DEFAULT_PARAMS, projectNotes: 'Client: José — 屋根 🏠', unitSystem: 'metric' as const};
  const input = [{...layers[0], priceOverride: 0}, {...layers[0], id: 'layer-b', order: 1, coverageOverride: 200}];
  const decoded = decodeProject(encodeProject(params, input));
  assert.equal(decoded.params.projectNotes, params.projectNotes);
  assert.equal(decoded.params.area, params.area);
  assert.equal(decoded.layers.length, 2);
  assert.equal(decoded.layers[0].priceOverride, 0);
  assert.equal(decoded.layers[1].coverageOverride, 200);
});
test('legacy metric area migrates once', () => {
  const old = {params: {...DEFAULT_PARAMS, area: 100, unitSystem: 'metric'}, layers};
  const migrated = parseProject(old);
  assert.ok(Math.abs(migrated.params.area - 100 / 0.09290304) < 1e-9);
  assert.equal(parseProject(migrated).params.area, migrated.params.area);
});
test('external product claims are replaced with catalog data', () => {
  const raw = project();
  raw.layers = [{...layers[0], material: {...layers[0].material, name: 'FAKE', productUrl: 'javascript:alert(1)'}}];
  assert.equal(parseProject(raw).layers[0].material.name, SOPREMA_MATERIALS[0].name);
});
test('invalid dimensions, enums, coordinates, versions and unknown products are rejected', () => {
  for (const area of [-1, 0, Infinity, NaN]) assert.throws(() => parseProject({...project(), params: {...DEFAULT_PARAMS, area}}));
  assert.throws(() => parseProject({...project(), params: {...DEFAULT_PARAMS, unitSystem: 'furlongs'}}));
  assert.throws(() => parseProject({...project(), params: {...DEFAULT_PARAMS, coordinates: {lat: 91, lng: 0}}}));
  assert.throws(() => parseProject({...project(), schemaVersion: 3}));
  assert.throws(() => parseProject({...project(), layers: [{id: 'unknown', order: 0, materialId: 'unknown'}]}));
  assert.throws(() => parseProject({...project(), layers: [layers[0], layers[0]]}));
});
test('malformed and oversized share payloads fail safely', () => {
  for (const value of ['not json', 'a'.repeat(120001), 'e30', '_w']) assert.throws(() => decodeProject(value));
});
test('saved projects reject remote thumbnails and unsafe document IDs', () => {
  const saved = {...project(), id: 'safe-id', name: 'A roof', date: '2026-09-15T00:00:00Z', thumbnail: ''};
  assert.equal(parseSavedProject(saved).id, 'safe-id');
  assert.throws(() => parseSavedProject({...saved, id: '../bad'}));
  assert.throws(() => parseSavedProject({...saved, thumbnail: 'https://example.com/tracking.png'}));
});
