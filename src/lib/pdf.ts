import { jsPDF } from 'jspdf';
import type { Layer, RoofParams } from '../types';
import { computeEstimate } from './estimate';
import { diagramDataUri } from './diagram';
import { areaUnit, displayArea, displayWeight, formatNumber, money } from '../utils';

const BLUE: [number, number, number] = [0, 114, 206];
const INK: [number, number, number] = [33, 35, 34];
const MUTED: [number, number, number] = [91, 106, 117];
const MM_PER_PT = 25.4 / 72;
const unicode = /[^\u0020-\u00ff\n]/;
const clean = (value: unknown): string => String(value ?? '').replace(/[\u2010-\u2015]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2026/g, '...').replace(/\u2022/g, '-').replace(/\r\n?/g, '\n').replace(/\t/g, ' ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const safeUrl = (value?: string): string | undefined => {
  try { return value && ['https:', 'http:'].includes(new URL(value).protocol) ? value : undefined; }
  catch { return undefined; }
};

/** Text remains searchable. Browser glyph rendering preserves scripts absent from Helvetica. */
class PdfLayout {
  readonly pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  readonly left = 15;
  readonly width = 180;
  readonly bottom = 274;
  y = 32;

  constructor(private readonly issued: string) { this.header(); }

  private header() {
    this.pdf.setFillColor(...BLUE);
    this.pdf.rect(0, 0, 210, 3, 'F');
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...BLUE);
    this.pdf.text('SOPREMA', this.left, 14);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...MUTED);
    this.pdf.text('ROOFSTUDIO / PROJECT BILL OF MATERIALS', this.left, 20);
    this.pdf.setDrawColor(224, 229, 235);
    this.pdf.line(this.left, 24, this.left + this.width, 24);
  }

  page() { this.pdf.addPage(); this.y = 32; this.header(); }
  ensure(height: number) { if (this.y + height > this.bottom) this.page(); }

  private context(size: number, bold: boolean) {
    if (typeof document === 'undefined') throw new Error('A browser is required to export project text in this writing system.');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The browser could not render project text.');
    context.font = `${bold ? '700' : '400'} ${size * MM_PER_PT * 8}px Arial, sans-serif`;
    return { canvas, context };
  }

  wrap(value: unknown, width = this.width, size = 9, bold = false): string[] {
    const text = clean(value);
    if (!unicode.test(text)) {
      this.pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      this.pdf.setFontSize(size);
      return this.pdf.splitTextToSize(text || ' ', width) as string[];
    }
    const { context } = this.context(size, bold);
    const lines: string[] = [];
    for (const paragraph of text.split('\n')) {
      let line = '';
      for (const character of Array.from(paragraph)) {
        if (line && context.measureText(line + character).width > width * 8) { lines.push(line); line = ''; }
        line += character;
      }
      lines.push(line || ' ');
    }
    return lines;
  }

  draw(value: string, x: number, y: number, size = 9, bold = false, color = INK) {
    const text = clean(value);
    if (unicode.test(text)) {
      const { canvas, context } = this.context(size, bold);
      const font = context.font;
      canvas.width = Math.max(1, Math.ceil(context.measureText(text).width + 4));
      canvas.height = Math.ceil(size * MM_PER_PT * 8 * 1.5);
      context.font = font;
      context.fillStyle = `rgb(${color.join(',')})`;
      context.textBaseline = 'top';
      context.fillText(text, 0, 0);
      this.pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y - size * MM_PER_PT, canvas.width / 8, canvas.height / 8);
    } else {
      this.pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      this.pdf.setFontSize(size);
      this.pdf.setTextColor(...color);
      this.pdf.text(text, x, y);
    }
  }

  text(value: unknown, options: { size?: number; bold?: boolean; color?: [number, number, number]; after?: number; url?: string } = {}) {
    const size = options.size ?? 9;
    const height = size * MM_PER_PT * 1.5;
    for (const line of this.wrap(value, this.width, size, options.bold)) {
      this.ensure(height);
      this.draw(line, this.left, this.y, size, options.bold, options.color);
      if (options.url) this.pdf.link(this.left, this.y - size * MM_PER_PT, this.width, height, { url: options.url });
      this.y += height;
    }
    this.y += options.after ?? 2;
  }

  heading(value: string) {
    this.ensure(18);
    this.y += 4;
    this.text(value, { size: 12, bold: true, color: BLUE, after: 3 });
  }

  finish() {
    const total = this.pdf.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      this.pdf.setPage(page);
      this.pdf.setDrawColor(224, 229, 235);
      this.pdf.line(this.left, 281, this.left + this.width, 281);
      this.draw('PRELIMINARY ESTIMATE / USD', this.left, 286, 7, false, MUTED);
      this.draw(this.issued, this.left, 290, 7, false, MUTED);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(7);
      this.pdf.text(`Page ${page} of ${total}`, this.left + this.width, 286, { align: 'right' });
    }
    return this.pdf;
  }
}

/** Explicitly rasterize SVG; never label SVG bytes as PNG. Only supplied data URIs are read. */
async function diagramImage(dataUri: string): Promise<{ data: string; width: number; height: number }> {
  if (!/^data:image\/(?:png|jpe?g|svg\+xml)[;,]/i.test(dataUri)) throw new Error('Unsupported diagram image format.');
  if (dataUri.length > 20_000_000) throw new Error('Diagram image exceeds the export size limit.');
  if (typeof document === 'undefined' || typeof Image === 'undefined') throw new Error('Diagram rendering requires a browser.');
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => { image.onload = null; image.onerror = null; reject(new Error('Diagram loading timed out.')); }, 10000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Diagram image could not be decoded.')); };
    image.src = dataUri;
  });
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('Diagram image has no dimensions.');
  const scale = Math.min(2, 2200 / image.naturalWidth, 1800 / image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Diagram canvas could not be created.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { data: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}

/** Build independently from download so the shared route and PDF checks use the same document. */
export async function createBOMPdf(params: RoofParams, layers: Layer[], thumbnail?: string): Promise<jsPDF> {
  if (layers.length === 0) throw new Error('Add a roofing material before exporting a bill of materials.');
  const estimate = computeEstimate(params, layers);
  const issued = `Prepared ${new Date().toISOString().slice(0, 10)} (UTC)`;
  const out = new PdfLayout(issued);
  const { pdf } = out;
  pdf.setProperties({ title: `${clean(params.name || 'Roofing project')} - Bill of Materials`, subject: 'Preliminary roofing quantities and project estimate', author: 'RoofStudio', creator: 'RoofStudio' });
  const area = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? 'Not entered' : `${formatNumber(displayArea(value, params.unitSystem))} ${areaUnit(params.unitSystem)}`;

  out.text(params.name || 'Untitled roofing project', { size: 22, bold: true, after: 4 });
  out.text(estimate.isComplete ? 'Estimate inputs complete / preliminary project budget' : 'PARTIAL ESTIMATE / missing inputs are excluded from known costs', { size: 9, bold: true, color: estimate.isComplete ? BLUE : [150, 85, 10], after: 4 });
  out.text(`Client: ${params.client || 'Not entered'}`);
  out.text(`Project location: ${[params.location, params.state, params.country].filter(Boolean).join(', ') || 'Not entered'}`);
  if (params.coordinates) out.text(`Pinned location: ${formatNumber(params.coordinates.lat, 6)}, ${formatNumber(params.coordinates.lng, 6)}`);
  out.text(`Project: ${params.projectType || 'Not entered'} | Deck: ${params.deck || 'Not entered'} | Climate zone: ${params.climateZone || 'Not entered'}`);
  out.text(`Units: ${params.unitSystem === 'metric' ? 'Metric' : 'Imperial'} | Entered area: ${area(params.area)} | Area basis: ${params.areaBasis === 'surface' ? 'measured roof surface' : 'horizontal plan'}`);
  out.text(`Pitch: ${formatNumber(params.pitch)}:12 (${formatNumber(params.pitch / 12 * 100)}% slope) | Slope factor: ${formatNumber(estimate.slopeFactor, 4)} | Waste allowance: ${formatNumber(params.wasteFactor * 100)}%`);
  out.text(`Horizontal plan: ${area(estimate.planArea)} | Roof surface: ${area(estimate.surfaceArea)} | Roof area with waste: ${area(estimate.designArea)}`);

  out.heading('Assembly diagram');
  if (thumbnail || typeof document !== 'undefined') {
    try {
      const image = await diagramImage(thumbnail || diagramDataUri(params, layers));
      const width = Math.min(out.width, 80 * image.width / image.height);
      const height = width * image.height / image.width;
      out.ensure(height + 8);
      pdf.addImage(image.data, 'PNG', out.left + (out.width - width) / 2, out.y, width, height);
      out.y += height + 6;
      out.text('Exploded assembly view. Layer spacing and perspective are illustrative; see the numbered installation schedule.', { size: 8, color: MUTED });
    } catch {
      out.text('Diagram unavailable: the supplied snapshot could not be rendered. The numbered material schedule records the complete selected layer order.', { size: 9, color: [150, 85, 10] });
    }
  } else {
    out.text('Assembly diagram was not attached to this export. Refer to the numbered material schedule for installation order.', { size: 8, color: MUTED });
  }

  out.heading('Material schedule / installation order');
  out.text('Layer 1 starts at the deck. Repeated products remain separate application layers. Package counts include waste and coats where applicable.', { size: 8, color: MUTED });
  const widths = [10, 62, 29, 23, 27, 29];
  const headers = ['No.', 'Material', 'Required area', 'Packages', 'USD / package', 'Line total USD'];
  const header = () => {
    out.ensure(12);
    pdf.setFillColor(...BLUE);
    pdf.rect(out.left, out.y - 4, out.width, 9, 'F');
    let x = out.left;
    headers.forEach((label, index) => { out.draw(label, x + 2, out.y + 1, 7.2, true, [255, 255, 255]); x += widths[index]; });
    out.y += 11;
  };
  header();
  for (let index = 0; index < estimate.lines.length; index += 1) {
    const line = estimate.lines[index];
    const cells = [String(index + 1), `${line.material.name}\n${line.material.category}`, area(line.requiredArea), line.packages == null ? 'TBD' : `${formatNumber(line.packages, 0)} x ${line.material.unit}`, money(line.unitPrice), money(line.total)];
    const wrapped = cells.map((cell, i) => out.wrap(cell, widths[i] - 4, 8, i === 1));
    const rowLines = Math.max(...wrapped.map(cell => cell.length));
    const source = line.isSample ? 'sample price' : line.layer.priceOverride != null ? 'entered price' : line.material.pricePerUnit != null ? 'published price' : 'price missing';
    const coverage = line.layer.coverageOverride != null ? 'entered coverage' : line.material.coveragePerUnit != null ? 'published coverage' : 'coverage missing';
    const detailLines = [
      `Net coverage: ${area(line.coverage)} / ${line.material.unit} (${line.material.coverageBasis === 'per-coat' ? 'per coat' : 'system'}); ${coverage}; ${source}.`,
      `Ordered coverage: ${area(line.orderedArea)}; surplus after required coverage: ${area(line.surplus)}.${line.material.coverageBasis === 'per-coat' ? ` Coats: ${line.layer.coats || 1}.` : ''}`,
    ].flatMap(detail => out.wrap(detail, out.width - 4, 7.5));
    const rowHeight = rowLines * 4.5 + detailLines.length * 4 + 6;
    // Keep ordinary rows with their assumptions; exceptionally long rows can still span pages.
    if (rowHeight < 220 && out.y + rowHeight > out.bottom) { out.page(); header(); }
    let written = 0;
    while (written < rowLines) {
      if (out.y + 6 > out.bottom) { out.page(); header(); }
      const count = Math.min(rowLines - written, Math.max(1, Math.floor((out.bottom - out.y - 2) / 4.5)));
      if (index % 2 === 0) { pdf.setFillColor(245, 248, 251); pdf.rect(out.left, out.y - 3.5, out.width, count * 4.5 + 2, 'F'); }
      let x = out.left;
      wrapped.forEach((cell, column) => {
        for (let offset = 0; offset < count; offset += 1) {
          const text = cell[written + offset];
          if (text) out.draw(text, x + 2, out.y + offset * 4.5, 8, column === 1);
        }
        const productUrl = safeUrl(line.material.productUrl);
        if (column === 1 && productUrl) pdf.link(x, out.y - 3, widths[column], count * 4.5, { url: productUrl });
        x += widths[column];
      });
      written += count;
      out.y += count * 4.5 + 3;
    }
    for (const detailLine of detailLines) {
      if (out.y + 4.5 > out.bottom) { out.page(); header(); }
      out.draw(detailLine, out.left + 2, out.y, 7.5, false, MUTED);
      out.y += 4;
    }
    out.y += 3;
    pdf.setDrawColor(224, 229, 235);
    pdf.line(out.left, out.y - 2, out.left + out.width, out.y - 2);
  }

  out.ensure(60);
  out.heading('Cost summary / USD');
  out.text(`Materials, known priced items: ${money(estimate.materialSubtotal)}`);
  out.text(`Labor: ${params.laborPerSqFt == null ? 'Not entered - excluded from subtotal' : money(estimate.labor)}${params.laborPerSqFt == null ? '' : ` (${money(params.laborPerSqFt / displayArea(1, params.unitSystem))} / ${areaUnit(params.unitSystem)} of roof surface)`}`);
  out.text(`Freight: ${money(estimate.freight)}`);
  out.text(`Material tax (${formatNumber(params.taxPercent ?? 0)}%): ${money(estimate.tax)}`);
  out.text(`${estimate.isComplete ? 'Estimated project total' : 'Known cost subtotal - PARTIAL ESTIMATE'}: ${money(estimate.total)}`, { size: 14, bold: true, color: BLUE, after: 4 });
  if (estimate.lines.some(line => line.isSample)) out.text('Sample prices are illustrative. Replace them with a supplier quote before budgeting or purchasing.', { size: 8, color: [150, 85, 10] });
  if (!estimate.isComplete) out.text('This subtotal excludes items with missing coverage or pricing and any unentered labor. It does not represent the complete project cost.', { size: 8, color: [150, 85, 10] });

  const issues = [...new Set([...estimate.issues, ...estimate.lines.flatMap(line => line.issues.map(issue => `${line.material.name}: ${issue}`))])];
  if (issues.length > 0) {
    out.heading('Missing inputs and estimate review');
    for (const issue of issues) out.text(`- ${issue}`, { size: 9 });
  }
  out.heading('Layer assumptions and product sources');
  for (let index = 0; index < estimate.lines.length; index += 1) {
    const line = estimate.lines[index];
    out.ensure(22);
    out.text(`${index + 1}. ${line.material.name}`, { size: 10, bold: true, after: 2 });
    out.text(`Scope: ${line.material.estimateScope || 'field'}. Measured application area before waste: ${line.layer.areaOverride == null ? line.material.estimateScope === 'detail' ? 'Not entered' : `${area(estimate.surfaceArea)} (full roof)` : area(line.layer.areaOverride)}.`, { size: 8 });
    out.text(line.material.coverageNote || 'Confirm net effective coverage for the selected installation method in the manufacturer instructions.', { size: 8 });
    if (line.material.composition) out.text(`Composition: ${line.material.composition}`, { size: 8 });
    if (line.material.sourceDate) out.text(`Product data reviewed: ${line.material.sourceDate}`, { size: 8, color: MUTED });
    const productUrl = safeUrl(line.material.productUrl);
    const dataUrl = safeUrl(line.material.dataSheetUrl);
    if (productUrl) out.text(`Product: ${productUrl}`, { size: 8, color: BLUE, url: productUrl });
    if (dataUrl) out.text(`Technical data: ${dataUrl}`, { size: 8, color: BLUE, url: dataUrl });
    if (!productUrl && !dataUrl) out.text('Manufacturer source link has not been supplied.', { size: 8, color: MUTED });
    out.y += 2;
  }

  out.heading('Project criteria');
  out.text(`Target insulation R-value (US): ${params.targetRValue == null ? 'Not entered' : formatNumber(params.targetRValue)}. Allowable roof dead load: ${params.allowableDeadLoadKgM2 == null ? 'Not entered' : displayWeight(params.allowableDeadLoadKgM2, params.unitSystem)}. VOC limit: ${params.vocLimit == null ? 'Not entered' : `${formatNumber(params.vocLimit)} g/L`}.`, { size: 9 });
  out.text('Location and environmental references support preliminary review. A qualified designer and the local authority must confirm adopted codes, structural capacity, wind uplift, fire classification, drainage, and the complete manufacturer-approved assembly.', { size: 8, color: MUTED });

  if (params.projectNotes) {
    out.heading('Project notes and client requirements');
    out.text(params.projectNotes, { size: 9, after: 4 });
  }
  out.heading('Calculation basis');
  for (const assumption of [
    'Plan area is converted to roof surface using sqrt(1 + (pitch / 12)^2). Measured surface area is not multiplied by the slope factor again.',
    'Waste is applied to each measured application area. Per-coat products multiply that area by the entered coat count. Required packages are rounded up separately for each application layer.',
    'Net package coverage must account for laps, application method, substrate, and the current product instructions. Ordered coverage is package count multiplied by net coverage; surplus is ordered coverage minus required coverage.',
    'Areas are stored in square feet and converted only for display. Switching units does not change package counts or USD costs. Labor uses roof surface before waste; tax applies to materials only.',
    'This is a preliminary material and cost estimate. Confirm accessory, attachment, flashing, edge, drainage, disposal, and labor scope with the installer; omitted items are not inferred. Product selection does not establish code or environmental compliance.',
  ]) out.text(`- ${assumption}`, { size: 8, color: MUTED });
  return out.finish();
}

export async function exportBOMPdf(params: RoofParams, layers: Layer[], thumbnail?: string): Promise<void> {
  const pdf = await createBOMPdf(params, layers, thumbnail);
  const project = (params.name || 'Roofing-project').normalize('NFKD').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'Roofing-project';
  await pdf.save(`${project}-BOM.pdf`, { returnPromise: true });
}
