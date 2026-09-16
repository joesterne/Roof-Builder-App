import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from '../server';

async function withServer(app: ReturnType<typeof createApp>, run: (origin: string) => Promise<void>) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
const post = (origin: string, route: string, body: unknown) => fetch(`${origin}${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
function archive(start: string, end: string) {
  const first = Date.parse(`${start}T00:00:00Z`), last = Date.parse(`${end}T00:00:00Z`);
  const time = Array.from({ length: (last - first) / 86400000 + 1 }, (_, index) => new Date(first + index * 86400000).toISOString().slice(0, 10));
  return { daily_units: { temperature_2m_min: '°C', temperature_2m_max: '°C', precipitation_sum: 'mm' }, daily: { time, temperature_2m_min: time.map(() => -5), temperature_2m_max: time.map(() => 31), precipitation_sum: time.map(() => 2) } };
}

test('climate endpoint validates input before calling provider and requests five complete ERA5 years', async () => {
  const calls: URL[] = [];
  const app = createApp({ now: () => new Date('2026-09-16T12:00:00Z'), fetchImplementation: async (input, init) => {
    const url = new URL(String(input)); calls.push(url);
    assert.equal(init?.redirect, 'error');
    assert.equal(url.searchParams.get('models'), 'era5');
    assert.equal(url.searchParams.get('start_date'), '2021-01-01');
    assert.equal(url.searchParams.get('end_date'), '2025-12-31');
    return Response.json(archive('2021-01-01', '2025-12-31'));
  } });
  await withServer(app, async origin => {
    const invalid = await post(origin, '/api/climate', { lat: '41', lng: -81 });
    assert.equal(invalid.status, 400);
    assert.equal(calls.length, 0);
    const valid = await post(origin, '/api/climate', { lat: 41.3, lng: -81.4 });
    assert.equal(valid.status, 200);
    const result = await valid.json();
    assert.equal(result.climate.status, 'ready');
    assert.equal(result.climate.expectedDays, 1826);
    assert.equal(result.climate.years, 5);
    assert.equal(result.suggestions.length, 2);
    await post(origin, '/api/climate', { lat: 41.3, lng: -81.4 });
    assert.equal(calls.length, 1, 'a repeat request uses cached complete historical records');
  });
});

test('incomplete climate records produce unknown assessment and provider errors cannot expose secrets', async () => {
  const previous = process.env.OPEN_METEO_API_KEY;
  process.env.OPEN_METEO_API_KEY = 'test-server-only-secret';
  let calls = 0;
  const app = createApp({ now: () => new Date('2026-09-16T12:00:00Z'), fetchImplementation: async input => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'customer-archive-api.open-meteo.com');
    assert.equal(url.searchParams.get('apikey'), 'test-server-only-secret');
    calls += 1;
    if (calls === 2) throw new Error(`upstream: ${url}`);
    const incomplete = archive('2021-01-01', '2025-12-31');
    incomplete.daily.temperature_2m_min[0] = null as unknown as number;
    return Response.json(incomplete);
  } });
  try {
    await withServer(app, async origin => {
      const response = await post(origin, '/api/climate', { lat: 41, lng: -81 });
      const data = await response.json();
      assert.equal(data.climate.status, 'needs-data');
      assert.deepEqual(data.suggestions, []);
      const failed = await post(origin, '/api/climate', { lat: 41, lng: -81 });
      assert.equal(failed.status, 502);
      const message = await failed.text();
      assert.doesNotMatch(message, /test-server-only-secret|customer-archive-api/);
      assert.match(message, /No climate assessment/);
    });
  } finally {
    if (previous === undefined) delete process.env.OPEN_METEO_API_KEY;
    else process.env.OPEN_METEO_API_KEY = previous;
  }
});

test('analysis endpoint rehydrates verified catalog properties and rejects malformed JSON and unknown products', async () => {
  await withServer(createApp(), async origin => {
    const malformed = await fetch(`${origin}/api/analyze-materials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{ broken' });
    assert.equal(malformed.status, 400);
    assert.match((await malformed.json()).error, /valid JSON/);
    assert.equal((await post(origin, '/api/analyze-materials', { materials: [{ id: 'invented-product' }] })).status, 400);
    const review = await post(origin, '/api/analyze-materials', { params: { area: 1000, state: 'OH', country: 'US', targetRValue: 20, allowableDeadLoadKgM2: 100 }, materials: [{ id: 'sopra-iso-2in-4x8', rValue: 1000, weightKgM2: 1 }] });
    assert.equal(review.status, 200);
    const data = await review.json();
    assert.equal(data.requirements.find((item: { id: string }) => item.id === 'thermal').status, 'Review');
    assert.equal(data.requirements.find((item: { id: string }) => item.id === 'dead-load').status, 'Needs data');
    const missing = await fetch(`${origin}/api/not-real`);
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get('content-type') || '', /application\/json/);
  });
});
