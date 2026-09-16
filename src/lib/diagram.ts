import { computeEstimate } from './estimate';
import type { Layer, RoofParams } from '../types';
import { areaUnit, displayArea, displayThickness, formatNumber } from '../utils';

export interface VisualizerView {
  zoom: number;
  explosion: number;
  rotation: number;
  weather: 'none' | 'rain' | 'snow';
  weatherIntensity: number;
}

export const DEFAULT_VISUALIZER: VisualizerView = {
  zoom: 1,
  explosion: 32,
  rotation: 35,
  weather: 'none',
  weatherIntensity: 50,
};

const finite = (value: number | undefined, fallback: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value as number)) : fallback;

export function getVisualizerView(params: RoofParams): VisualizerView {
  const view = params.visualizer;
  return {
    zoom: finite(view?.zoom, DEFAULT_VISUALIZER.zoom, 0.5, 2),
    explosion: finite(view?.explosion, DEFAULT_VISUALIZER.explosion, 0, 96),
    rotation: finite(view?.rotation, DEFAULT_VISUALIZER.rotation, -180, 180),
    weather: view?.weather === 'rain' || view?.weather === 'snow' ? view.weather : 'none',
    weatherIntensity: finite(view?.weatherIntensity, DEFAULT_VISUALIZER.weatherIntensity, 0, 100),
  };
}

// SVG colors come from this palette, never from imported project text or CSS.
const palette: Record<string, { face: string; edge: string }> = {
  Deck: { face: '#B4BCC8', edge: '#718096' },
  'Vapor Barrier': { face: '#8291A6', edge: '#4B5C72' },
  Insulation: { face: '#EAD7A4', edge: '#B69C5F' },
  Coverboard: { face: '#D4D3C6', edge: '#A4A495' },
  'Base Ply': { face: '#6384A2', edge: '#36546F' },
  'Cap Sheet': { face: '#3C526D', edge: '#21354C' },
  'PVC Membrane': { face: '#CFDCE6', edge: '#7A98B1' },
  Flashing: { face: '#94B9C2', edge: '#527984' },
  'Adhesive/Primer': { face: '#86B9D7', edge: '#477C9C' },
};

export function layerColor(category: string): string {
  return palette[category]?.face ?? '#9BACBE';
}

function xml(value: string | number): string {
  // Replace invalid XML control characters and lone UTF-16 surrogates before URI encoding.
  const text = Array.from(String(value), character => {
    const code = character.codePointAt(0) ?? 0;
    return code === 0 || (code < 32 && ![9, 10, 13].includes(code)) ||
      (code >= 0xd800 && code <= 0xdfff) || code === 0xfffe || code === 0xffff ? '\uFFFD' : character;
  }).join('');
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const short = (value: string, length = 34) =>
  Array.from(value).length > length ? Array.from(value).slice(0, length - 1).join('') + '…' : value;

interface Point { x: number; y: number }
const pointList = (points: Point[]) => points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

/**
 * One deterministic SVG is used by the live view and saved project thumbnails.
 * Stored order is installation order (bottom first); visual labels read top first.
 * Plate depths and gaps are schematic. Only the textual thickness is a product dimension.
 */
export function diagramSvg(params: RoofParams, layers: Layer[]): string {
  const view = getVisualizerView(params);
  const ordered = [...layers].sort((a, b) => a.order - b.order);
  const estimate = computeEstimate(params, layers);
  const angle = view.rotation * Math.PI / 180;
  const corners = [[-200, -140], [200, -140], [200, 140], [-200, 140]].map(([x, y]) => ({
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: (x * Math.sin(angle) + y * Math.cos(angle)) * 0.44,
  }));
  const minY = Math.min(...corners.map(p => p.y));
  const maxY = Math.max(...corners.map(p => p.y));
  const right = corners.reduce((best, p) => p.x > best.x ? p : best);
  const depth = 12;
  const step = depth + view.explosion;
  const labelStep = Math.max(48, step);
  const topY = 142 - minY;
  const baseY = topY + ordered.length * step;
  const height = Math.ceil(Math.max(540, baseY + maxY + 144, topY + ordered.length * labelStep + 105));
  const width = 1080;
  const centerX = 330;
  const hasDeck = ordered.some(layer => layer.material.category === 'Deck');
  const plate = (cy: number) => corners.map(p => ({ x: centerX + p.x, y: cy + p.y }));
  const parts: string[] = [];
  const labels: string[] = [];

  if (!hasDeck) {
    parts.push(`<polygon points="${pointList(plate(baseY))}" fill="#E5EBF2" stroke="#A6B5C5" stroke-width="1.5" stroke-dasharray="6 5"/>`);
  }
  ordered.forEach((layer, index) => {
    const cy = baseY - (index + 1) * step;
    const points = plate(cy);
    const colors = palette[layer.material.category] ?? { face: '#9BACBE', edge: '#687F98' };
    const sideFaces = points.map((point, edge) => {
      const next = points[(edge + 1) % points.length];
      if (next.x >= point.x) return '';
      return `<polygon points="${pointList([point, next, { x: next.x, y: next.y + depth }, { x: point.x, y: point.y + depth }])}" fill="${colors.edge}" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="0.8"/>`;
    }).join('');
    parts.push(`<g><title>${xml(`${index + 1}. ${layer.material.name}`)}</title>${sideFaces}<polygon points="${pointList(points)}" fill="${colors.face}" stroke="#FFFFFF" stroke-opacity="0.7" stroke-width="1.1"/><polygon points="${pointList(points)}" fill="url(#surface-grain)"/></g>`);
    const source = { x: centerX + right.x + 6, y: cy + right.y + depth / 2 };
    const labelY = topY + (ordered.length - 1 - index) * labelStep;
    labels.push(`<g><path d="M ${source.x.toFixed(2)} ${source.y.toFixed(2)} H 630 L 680 ${labelY.toFixed(2)} H 697" fill="none" stroke="#A6B5C5" stroke-width="1.2"/><circle cx="${source.x.toFixed(2)}" cy="${source.y.toFixed(2)}" r="3" fill="#0072CE"/><rect x="700" y="${labelY - 14}" width="28" height="28" rx="7" fill="#E5F1FC"/><text x="714" y="${labelY + 5}" text-anchor="middle" fill="#00589F" font-size="12" font-weight="700">${index + 1}</text><text x="739" y="${labelY - 2}" fill="#203349" font-size="14" font-weight="700">${xml(short(layer.material.name))}</text><text x="739" y="${labelY + 17}" fill="#62758B" font-size="11">${xml(short(`${layer.material.category} · ${displayThickness(layer.material.thicknessMm, params.unitSystem)}`, 43))}</text></g>`);
  });

  const weatherMarks = view.weather === 'none' ? '' : Array.from({ length: Math.round(view.weatherIntensity * 0.7) }, (_, index) => {
    const x = 70 + (index * 79 % 545);
    const y = 118 + (index * 43 % Math.max(100, Math.round(baseY + maxY - 140)));
    return view.weather === 'rain'
      ? `<path d="M ${x} ${y} l -5 15" stroke="#0072CE" stroke-width="1.2" stroke-opacity="0.24"/>`
      : `<g stroke="#0072CE" stroke-opacity="0.3" stroke-width="1"><path d="M ${x - 3} ${y} h 6 M ${x} ${y - 3} v 6"/></g>`;
  }).join('');
  const pitch = params.unitSystem === 'metric'
    ? `${formatNumber(params.pitch / 12 * 100, 1)}% slope`
    : `${formatNumber(params.pitch, 2)}:12 pitch`;
  const footerY = height - 60;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * view.zoom}" height="${height * view.zoom}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="roof-title roof-description">
<title id="roof-title">Exploded roofing assembly</title>
<desc id="roof-description">${xml(ordered.length ? ordered.slice().reverse().map(layer => layer.material.name).join(', ') : 'No materials selected')}. Labels read from exterior to support. Layer thickness and spacing are exaggerated.</desc>
<defs><pattern id="roof-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 H 0 V 28" fill="none" stroke="#DFE8F1" stroke-width="0.7"/></pattern><pattern id="surface-grain" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="0.55" fill="#FFFFFF" fill-opacity="0.23"/></pattern></defs>
<rect width="100%" height="100%" fill="#F8FAFD"/><rect x="24" y="100" width="632" height="${height - 206}" fill="url(#roof-grid)"/>
<g font-family="Arial, Helvetica, sans-serif"><text x="38" y="42" fill="#0072CE" font-size="11" font-weight="700" letter-spacing="2">ROOF ASSEMBLY</text><text x="38" y="70" fill="#203349" font-size="21" font-weight="700">${ordered.length ? `${ordered.length} installed ${ordered.length === 1 ? 'layer' : 'layers'}` : 'Start your assembly'}</text><text x="1042" y="43" text-anchor="end" fill="#62758B" font-size="12">${xml(`${formatNumber(displayArea(estimate.surfaceArea, params.unitSystem))} ${areaUnit(params.unitSystem)} surface · ${pitch}`)}</text><text x="1042" y="68" text-anchor="end" fill="#62758B" font-size="11">${xml(`View ${Math.round(view.zoom * 100)}% · Rotation ${Math.round(view.rotation)}°${view.weather === 'none' ? '' : ` · Visual ${view.weather} ${view.weatherIntensity}%`}`)}</text>
${parts.join('')}${weatherMarks}${labels.join('')}
${!ordered.length ? `<text x="330" y="230" text-anchor="middle" fill="#62758B" font-size="15">Select materials to build a roof system.</text>` : ''}
${!hasDeck ? `<text x="330" y="${baseY + maxY + 38}" text-anchor="middle" fill="#62758B" font-size="11">Support reference · excluded from estimate</text>` : ''}
<path d="M 38 ${footerY - 17} H 1042" stroke="#DBE4EE"/><text x="38" y="${footerY + 6}" fill="#203349" font-size="12" font-weight="700">APPLICATION ORDER: 1 = FIRST INSTALLED</text><text x="38" y="${footerY + 27}" fill="#62758B" font-size="11">Thickness and gaps are exaggerated. Product labels show recorded thickness; roof shape is illustrative.</text></g></svg>`;
}

export function diagramDataUri(params: RoofParams, layers: Layer[]): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(diagramSvg(params, layers))}`;
}
