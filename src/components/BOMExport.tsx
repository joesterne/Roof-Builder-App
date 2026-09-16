import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, ExternalLink, FileText, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import type { Layer, RoofParams } from '../types';
import { computeEstimate } from '../lib/estimate';
import { exportBOMPdf } from '../lib/pdf';
import { areaUnit, displayArea, formatNumber, inputArea, money } from '../utils';

interface BOMExportProps {
  params: RoofParams;
  layers: Layer[];
  setLayers?: React.Dispatch<React.SetStateAction<Layer[]>>;
  setParams?: React.Dispatch<React.SetStateAction<RoofParams>>;
  thumbnail?: string;
}

/** Preserve an in-progress decimal while committing valid values immediately. */
function NumberField({ label, value, onChange, suffix, placeholder, minimum = 0, integer = false, disabled = false }: {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  suffix?: string;
  placeholder?: string;
  minimum?: number;
  integer?: boolean;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(Number(value.toFixed(6))));
  const [invalid, setInvalid] = useState(false);
  const focused = useRef(false);
  const lastSuffix = useRef(suffix);
  useEffect(() => {
    if (!focused.current || lastSuffix.current !== suffix) {
      setDraft(value == null ? '' : String(Number(value.toFixed(6))));
      setInvalid(false);
    }
    lastSuffix.current = suffix;
  }, [value, suffix]);
  return <label className="block text-xs font-medium text-text-secondary">
    <span>{label}</span>
    <span className="mt-1 flex overflow-hidden rounded-md border border-border-main bg-bg-panel focus-within:ring-2 focus-within:ring-soprema-blue">
      <input type="number" step={integer ? 1 : 'any'} min={minimum} value={draft} disabled={disabled} placeholder={placeholder} aria-invalid={invalid}
        className="min-w-0 w-full bg-transparent px-2.5 py-2 text-sm text-text-main outline-none disabled:opacity-60"
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; setDraft(value == null ? '' : String(Number(value.toFixed(6)))); setInvalid(false); }}
        onChange={event => {
          const raw = event.target.value;
          setDraft(raw);
          if (raw === '') { setInvalid(false); onChange(null); return; }
          const parsed = Number(raw);
          const valid = Number.isFinite(parsed) && parsed >= minimum && (!integer || Number.isInteger(parsed));
          setInvalid(!valid);
          if (valid) onChange(parsed);
        }}
      />
      {suffix && <span className="shrink-0 self-center pr-2 text-text-muted">{suffix}</span>}
    </span>
    {invalid && <span className="mt-1 block text-red-600">Enter {integer ? 'a whole number' : 'a number'} of at least {minimum}.</span>}
  </label>;
}

function safeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try { return ['https:', 'http:'].includes(new URL(url).protocol) ? url : undefined; }
  catch { return undefined; }
}

export default React.memo(function BOMExport({ params, layers, setLayers, setParams, thumbnail }: BOMExportProps) {
  const estimate = useMemo(() => computeEstimate(params, layers), [params, layers]);
  const [isExporting, setIsExporting] = useState(false);
  const unit = areaUnit(params.unitSystem);
  const area = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? 'Not entered' : `${formatNumber(displayArea(value, params.unitSystem))} ${unit}`;
  const updateLayer = (id: string, changes: Partial<Layer>) => setLayers?.(current => current.map(layer => layer.id === id ? { ...layer, ...changes } : layer));
  const sampleCount = estimate.lines.filter(line => line.isSample).length;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try { await exportBOMPdf(params, layers, thumbnail); toast.success('Project bill of materials downloaded.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'The PDF could not be generated. Please retry.'); }
    finally { setIsExporting(false); }
  };

  return <section className="flex h-full min-h-0 flex-col bg-bg-panel text-text-main" aria-labelledby="bom-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
      <div>
        <h2 id="bom-title" className="flex items-center gap-2 text-lg font-bold"><ReceiptText className="h-5 w-5 text-soprema-blue" /> Bill of materials</h2>
        <p className="mt-1 text-xs text-text-muted">Installation order, whole packages, and project costs.</p>
      </div>
      <button type="button" onClick={handleExportPDF} disabled={isExporting || layers.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-soprema-blue px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
        <Download className="h-4 w-4" />{isExporting ? 'Creating PDF…' : 'Export PDF'}
      </button>
    </div>
    {layers.length === 0 ? <div className="m-auto max-w-sm px-6 py-16 text-center">
      <FileText className="mx-auto mb-4 h-10 w-10 text-soprema-blue" />
      <h3 className="text-lg font-semibold">Build your material schedule</h3>
      <p className="mt-2 text-sm text-text-muted">Add a material to calculate coverage, package quantities, and estimated costs.</p>
    </div> : <div className="flex-1 overflow-y-auto p-5 sm:p-6"><div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-soprema-blue">Project estimate</p>
          <h3 className="mt-1 break-words text-2xl font-bold">{params.name || 'Untitled roofing project'}</h3>
          <p className="mt-1 break-words text-sm text-text-muted">{[params.client, params.location].filter(Boolean).join(' · ') || 'Client and project location have not been entered.'}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estimate.isComplete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{estimate.isComplete ? 'All estimate inputs supplied' : 'Partial estimate'}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Roof surface', area(estimate.surfaceArea)], ['Roof area with waste', area(estimate.designArea)],
          ['Pitch / waste', `${formatNumber(params.pitch)}:12 / ${formatNumber(params.wasteFactor * 100)}%`],
          ['Area measurement', params.areaBasis === 'surface' ? 'Measured surface' : 'Horizontal plan'],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-border-main bg-bg-panel-hover p-4"><p className="text-xs text-text-muted">{label}</p><p className="mt-1 text-sm font-semibold sm:text-base">{value}</p></div>)}
      </div>
      <div className="rounded-xl border border-border-main bg-bg-panel-hover p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Pricing basis: USD per package</p>
          <label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={!!params.useSamplePrices} disabled={!setParams} onChange={event => setParams?.(current => ({ ...current, useSamplePrices: event.target.checked }))} className="h-4 w-4 accent-soprema-blue" />Use sample prices where available</label>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-text-muted">Enter supplier prices and net coverage for the selected installation method. Missing values remain unpriced. {sampleCount > 0 ? `${sampleCount} line${sampleCount === 1 ? ' uses' : 's use'} illustrative sample pricing; obtain a supplier quote before ordering.` : 'Sample prices are illustrative and are identified separately from entered prices.'}</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border-main">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Materials in application order, starting at the deck. Required area includes waste and coat count where applicable.</caption>
          <thead className="bg-bg-panel-hover text-xs text-text-muted"><tr><th className="px-4 py-3">Layer / material</th><th className="px-4 py-3">Required area</th><th className="px-4 py-3">Package order</th><th className="px-4 py-3 text-right">USD / package</th><th className="px-4 py-3 text-right">Line total</th></tr></thead>
          <tbody>{estimate.lines.map((line, index) => {
            const url = safeUrl(line.material.productUrl);
            return <tr key={line.layer.id} className="border-t border-border-main align-top">
              <td className="max-w-xs px-4 py-4"><div className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-soprema-blue/10 text-xs font-bold text-soprema-blue">{index + 1}</span><div className="min-w-0">
                {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-soprema-blue hover:underline">{line.material.name}<ExternalLink className="ml-1 inline h-3 w-3" /></a> : <span className="break-words font-semibold">{line.material.name}</span>}
                <p className="mt-1 text-xs text-text-muted">{line.material.category} · {line.material.estimateScope || 'field'} area</p>
              </div></div></td>
              <td className="px-4 py-4"><p className="font-medium">{area(line.requiredArea)}</p><p className="mt-1 text-xs text-text-muted">{line.material.coverageBasis === 'per-coat' ? `${line.layer.coats || 1} coat(s) included` : 'System coverage'}</p></td>
              <td className="px-4 py-4"><p className="font-medium">{line.packages == null ? 'Coverage required' : `${formatNumber(line.packages, 0)} × ${line.material.unit}`}</p><p className="mt-1 text-xs text-text-muted">Ordered: {area(line.orderedArea)}</p><p className="mt-1 text-xs text-text-muted">Surplus: {area(line.surplus)}</p></td>
              <td className="px-4 py-4 text-right"><p>{money(line.unitPrice)}</p><p className={`mt-1 text-xs ${line.isSample ? 'text-amber-700' : 'text-text-muted'}`}>{line.isSample ? 'Sample' : line.layer.priceOverride != null ? 'Entered' : line.material.pricePerUnit != null ? 'Published' : 'Quote required'}</p></td>
              <td className="px-4 py-4 text-right font-semibold">{money(line.total)}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold">Coverage and quantity assumptions</h3>
        <p className="mb-4 text-xs text-text-muted">Measured areas exclude waste. Detail products need a measured application area; interface products need verified coverage for the attachment pattern. Net coverage must account for laps and installation method.</p>
        <div className="space-y-3">{estimate.lines.map((line, index) => <details key={line.layer.id} className="rounded-xl border border-border-main bg-bg-panel-hover" open={line.issues.length > 0 || undefined}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">{index + 1}. {line.material.name}<span className="ml-2 text-xs font-normal text-text-muted">{line.layer.coverageOverride != null ? 'Entered coverage' : line.material.coveragePerUnit != null ? 'Published coverage' : 'Coverage needed'}{line.issues.length > 0 ? ' · Review needed' : ''}</span></summary>
          <div className="space-y-3 border-t border-border-main p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <NumberField label="Net coverage / package" suffix={unit} minimum={0.000001} value={line.coverage == null ? null : displayArea(line.coverage, params.unitSystem)} onChange={value => updateLayer(line.layer.id, { coverageOverride: value == null ? null : inputArea(value, params.unitSystem) })} placeholder="Effective coverage" disabled={!setLayers} />
              <NumberField label="Supplier price / package" suffix="USD" value={line.layer.priceOverride ?? null} onChange={value => updateLayer(line.layer.id, { priceOverride: value })} placeholder={line.unitPrice == null ? 'Quote required' : money(line.unitPrice)} disabled={!setLayers} />
              <NumberField label="Measured application area" suffix={unit} value={line.layer.areaOverride == null ? null : displayArea(line.layer.areaOverride, params.unitSystem)} onChange={value => updateLayer(line.layer.id, { areaOverride: value == null ? null : inputArea(value, params.unitSystem) })} placeholder={line.material.estimateScope === 'detail' ? 'Measured area required' : 'Full roof by default'} minimum={0.000001} disabled={!setLayers} />
              {line.material.coverageBasis === 'per-coat' && <NumberField label="Number of coats" value={line.layer.coats || 1} minimum={1} integer onChange={value => updateLayer(line.layer.id, { coats: value ?? 1 })} disabled={!setLayers} />}
            </div>
            <p className="text-xs leading-relaxed text-text-muted">{line.material.coverageNote || 'Confirm net effective package coverage in the current manufacturer installation instructions.'}</p>
            {line.layer.coverageOverride != null && setLayers && <button type="button" onClick={() => updateLayer(line.layer.id, { coverageOverride: null })} className="text-xs font-semibold text-soprema-blue hover:underline">Use published coverage</button>}
            {line.issues.length > 0 && <ul className="space-y-1 text-xs text-amber-800">{line.issues.map((issue, i) => <li key={i} className="flex items-start gap-1.5"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />{issue}</li>)}</ul>}
          </div>
        </details>)}</div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border-main p-4">
          <h3 className="mb-4 text-sm font-bold">Additional project costs</h3>
          <div className="space-y-3">
            <NumberField label={`Labor per ${unit} of roof surface`} suffix={`USD / ${unit}`} value={params.laborPerSqFt == null ? null : params.laborPerSqFt / displayArea(1, params.unitSystem)} onChange={value => setParams?.(current => ({ ...current, laborPerSqFt: value == null ? null : value * displayArea(1, params.unitSystem) }))} placeholder="Enter 0 if excluded" disabled={!setParams} />
            <NumberField label="Freight" suffix="USD" value={params.freight ?? 0} onChange={value => setParams?.(current => ({ ...current, freight: value ?? 0 }))} disabled={!setParams} />
            <NumberField label="Tax on materials" suffix="%" value={params.taxPercent ?? 0} onChange={value => setParams?.(current => ({ ...current, taxPercent: value ?? 0 }))} disabled={!setParams} />
          </div>
          <p className="mt-3 text-xs text-text-muted">Labor uses measured roof surface before waste. Tax applies to materials only; confirm project tax treatment.</p>
        </div>
        <div className="rounded-xl border border-border-main bg-bg-panel-hover p-5">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Material subtotal</dt><dd className="font-semibold">{money(estimate.materialSubtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Labor</dt><dd>{params.laborPerSqFt == null ? 'Not entered; excluded' : money(estimate.labor)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Freight</dt><dd>{money(estimate.freight)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Material tax ({formatNumber(params.taxPercent ?? 0)}%)</dt><dd>{money(estimate.tax)}</dd></div>
            <div className="border-t border-border-main pt-4"><dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{estimate.isComplete ? 'Estimated project total (USD)' : 'Known cost subtotal (USD)'}</dt><dd className="mt-1 text-3xl font-bold text-soprema-blue" aria-live="polite">{money(estimate.total)}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-text-muted">{estimate.isComplete ? 'Required estimating inputs are present. Quantities, price availability, and installation scope require project review.' : 'Incomplete or unpriced items are excluded. Resolve missing inputs before using this subtotal as a project budget.'}</p>
        </div>
      </div>
      {estimate.issues.length > 0 && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900"><h3 className="flex items-center gap-2 text-sm font-semibold"><AlertCircle className="h-4 w-4" /> Estimate review</h3><ul className="mt-2 space-y-1 text-xs leading-relaxed">{Array.from(new Set(estimate.issues)).map((issue, i) => <li key={i}>{issue}</li>)}</ul></div>}
      {params.projectNotes && <div className="rounded-xl border border-border-main p-4"><h3 className="mb-2 text-sm font-bold">Project notes and client requirements</h3><p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">{params.projectNotes}</p></div>}
      <p className="text-xs leading-relaxed text-text-muted">Preliminary estimate. Package quantities are rounded up per application layer. The selected assembly and location criteria require manufacturer, structural, and local authority review before procurement.</p>
    </div></div>}
  </section>;
});
