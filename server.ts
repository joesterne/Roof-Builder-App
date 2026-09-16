import express, { type Request, type Response, type ErrorRequestHandler } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { ACTIVE_MATERIALS, SOPREMA_MATERIALS } from './src/data';
import { getClimateSuggestions, reviewRequirements, summarizeClimate, validCoordinates, type ClimateSummary } from './src/lib/requirements';
import type { Layer, RoofParams } from './src/types';

dotenv.config();

interface ServerOptions {
  fetchImplementation?: typeof fetch;
  now?: () => Date;
}
class ClimateServiceError extends Error {}
const DAY_MS = 86400000;

export function createApp(options: ServerOptions = {}) {
  const app = express();
  const fetchProvider = options.fetchImplementation || fetch;
  const clock = options.now || (() => new Date());
  const cache = new Map<string, { expires: number; climate: ClimateSummary }>();
  const rateLimits = new Map<string, { count: number; expires: number }>();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb', strict: true }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  const loadClimate = async (lat: number, lng: number): Promise<ClimateSummary> => {
    const now = clock();
    // ERA5 can lag by five days: early January uses the preceding fully available year.
    const available = new Date(now.getTime() - 7 * DAY_MS);
    const endYear = available.getUTCFullYear() - 1;
    const startDate = `${endYear - 4}-01-01`;
    const endDate = `${endYear}-12-31`;
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${endYear}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > now.getTime()) return cached.climate;
    const key = process.env.OPEN_METEO_API_KEY?.trim();
    const url = new URL(key ? 'https://customer-archive-api.open-meteo.com/v1/archive' : 'https://archive-api.open-meteo.com/v1/archive');
    url.search = new URLSearchParams({
      latitude: String(lat), longitude: String(lng), start_date: startDate, end_date: endDate,
      daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum',
      temperature_unit: 'celsius', precipitation_unit: 'mm', timezone: 'auto', models: 'era5',
      ...(key ? { apikey: key } : {}),
    }).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetchProvider(url, { signal: controller.signal, redirect: 'error', headers: { Accept: 'application/json' } });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new ClimateServiceError();
      const declaredLength = Number(response.headers.get('content-length') || 0);
      if (declaredLength > 2_000_000) throw new ClimateServiceError();
      const text = await response.text();
      if (text.length > 2_000_000) throw new ClimateServiceError();
      const climate = summarizeClimate(JSON.parse(text), startDate, endDate);
      if (climate.status === 'ready') {
        if (cache.size >= 100) cache.delete(cache.keys().next().value!);
        cache.set(cacheKey, { climate, expires: now.getTime() + DAY_MS });
      }
      return climate;
    } catch { throw new ClimateServiceError(); }
    finally { clearTimeout(timeout); }
  };

  const climateHandler = async (req: Request, res: Response) => {
    if (!validCoordinates(req.body)) {
      return res.status(400).json({ error: 'Provide finite numeric lat (−90 to 90) and lng (−180 to 180).' });
    }
    const now = clock().getTime();
    const client = req.ip || 'unknown';
    const limit = rateLimits.get(client);
    if (limit && limit.expires > now && limit.count >= 30) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ error: 'Too many climate requests. Retry in one minute.' });
    }
    if (!limit || limit.expires <= now) {
      if (rateLimits.size > 2000) rateLimits.clear();
      rateLimits.set(client, { count: 1, expires: now + 60000 });
    } else limit.count += 1;
    try {
      const climate = await loadClimate(req.body.lat, req.body.lng);
      return res.json({ climate, suggestions: getClimateSuggestions(climate, ACTIVE_MATERIALS) });
    } catch {
      return res.status(502).json({ error: 'Historical climate provider is unavailable. No climate assessment was produced.' });
    }
  };
  app.post('/api/climate', climateHandler);
  // Compatibility routes now require coordinates and use historical data, never a single observation.
  app.post('/api/weather', climateHandler);
  app.post('/api/suggest-materials', climateHandler);

  app.post('/api/analyze-materials', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Provide project parameters and a materials array.' });
    const input = body.params && typeof body.params === 'object' && !Array.isArray(body.params) ? body.params : body;
    const materials = body.materials;
    if (!Array.isArray(materials) || materials.length > 100) return res.status(400).json({ error: 'Provide at most 100 catalog materials.' });
    const stringFields = ['location', 'country', 'state', 'projectType', 'climateZone'];
    if (stringFields.some(field => input[field] !== undefined && (typeof input[field] !== 'string' || input[field].length > 500))) return res.status(400).json({ error: 'Invalid project text field.' });
    const limits = { area: 1e9, pitch: 24, targetRValue: 200, allowableDeadLoadKgM2: 10000, vocLimit: 10000 };
    for (const [field, maximum] of Object.entries(limits)) {
      const value = input[field];
      if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > maximum)) return res.status(400).json({ error: `Invalid ${field}.` });
    }
    if (input.coordinates !== undefined && !validCoordinates(input.coordinates)) return res.status(400).json({ error: 'Invalid project coordinates.' });
    const layers: Layer[] = [];
    for (const [index, item] of materials.entries()) {
      if (!item || typeof item !== 'object' || (typeof item.id !== 'string' && typeof item.name !== 'string')) return res.status(400).json({ error: 'Each material must identify a catalog product.' });
      const material = SOPREMA_MATERIALS.find(product => typeof item.id === 'string' ? product.id === item.id : product.name === item.name);
      if (!material) return res.status(400).json({ error: 'A selected product is not in the verified catalog.' });
      layers.push({ id: `api-${index}`, material, order: index });
    }
    const params: RoofParams = {
      area: input.area ?? 0, pitch: input.pitch ?? 0, wasteFactor: 0,
      location: input.location || '', country: input.country || '', state: input.state || '',
      unitSystem: input.unitSystem === 'metric' ? 'metric' : 'imperial',
      projectType: input.projectType, climateZone: input.climateZone,
      targetRValue: input.targetRValue, allowableDeadLoadKgM2: input.allowableDeadLoadKgM2, vocLimit: input.vocLimit,
    };
    return res.json(reviewRequirements(params, layers, clock()));
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route.' }));
  const apiError: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = error?.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'Request body is too large.' : status === 400 ? 'Request body must be valid JSON.' : 'The request could not be completed.' });
  };
  app.use(apiError);
  return app;
}

export async function startServer() {
  const portText = process.env.PORT || '3000';
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  const app = createApp();
  const production = process.env.NODE_ENV === 'production' || path.basename(process.argv[1] || '').endsWith('.cjs');
  if (production) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  return app.listen(port, '0.0.0.0', () => console.log(`RoofStudio is listening on port ${port}.`));
}

if (/^server\.(?:ts|js|cjs)$/.test(path.basename(process.argv[1] || ''))) {
  startServer().catch(() => { console.error('RoofStudio could not start. Check PORT, the build output, and server configuration.'); process.exitCode = 1; });
}
