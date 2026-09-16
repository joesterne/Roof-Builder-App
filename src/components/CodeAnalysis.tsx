import React, { useMemo } from 'react';
import { ClipboardCheck, ExternalLink, Leaf, MapPin } from 'lucide-react';
import { Layer, RoofParams } from '../types';
import { reviewRequirements, type ReviewSource, type ReviewStatus } from '../lib/requirements';

interface CodeAnalysisProps {
  layers: Layer[];
  params: RoofParams;
  setParams?: (params: RoofParams) => void;
}
const statusClasses: Record<ReviewStatus, string> = {
  'Needs data': 'border-slate-200 bg-slate-100 text-slate-700',
  Review: 'border-amber-200 bg-amber-50 text-amber-800',
  'Meets entered criterion': 'border-emerald-200 bg-emerald-50 text-emerald-800',
};
function Sources({ sources }: { sources: ReviewSource[] }) {
  const unique = [...new Map(sources.map(source => [source.url, source])).values()];
  return unique.length > 0 ? <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
    {unique.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-soprema-blue underline underline-offset-2">{source.label}<ExternalLink className="h-3 w-3 shrink-0" /></a>)}
  </div> : null;
}

export default React.memo(function CodeAnalysis({ layers, params, setParams }: CodeAnalysisProps) {
  const report = useMemo(() => reviewRequirements(params, layers), [params, layers]);
  const update = (changes: Partial<RoofParams>) => setParams?.({ ...params, ...changes });
  const inputClass = 'mt-1 block w-full rounded-md border border-border-main bg-bg-panel px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-soprema-blue/25';
  const metric = params.unitSystem === 'metric';
  const rFactor = metric ? 1 / 5.678263 : 1;
  const massFactor = metric ? 1 : 0.2048161436;
  const optionalNumber = (text: string, factor = 1): number | undefined => {
    const value = Number(text);
    return text.trim() && Number.isFinite(value) && value >= 0 ? value / factor : undefined;
  };
  const displayOptional = (value: number | undefined, factor: number) => typeof value === 'number' && Number.isFinite(value) ? Number((value * factor).toFixed(3)) : '';

  return <section className="h-full overflow-y-auto bg-bg-panel px-4 py-6 text-text-main sm:px-6 lg:px-8" aria-labelledby="review-heading">
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-border-main pb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-soprema-blue">Project review</p>
        <h2 id="review-heading" className="flex items-center gap-2 text-xl font-bold text-soprema-black"><ClipboardCheck className="h-6 w-6 text-soprema-blue" /> Codes, criteria & materials</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">{report.systemOverview}</p>
        <p className="mt-2 text-xs text-text-muted">Jurisdiction: {report.jurisdiction} · Source records checked {report.checkedAt}</p>
      </header>

      <fieldset className="rounded-xl border border-border-main bg-bg-page p-4" disabled={!setParams}>
        <legend className="px-2 text-sm font-semibold text-text-main"><MapPin className="mr-1 inline h-4 w-4 text-soprema-blue" /> Jurisdiction & design criteria</legend>
        <p className="mb-4 text-xs leading-relaxed text-text-muted">Use the project’s approved design and local authority records for these values. The map pin supplies climate history; confirm the governing country and state here.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-medium text-text-secondary">Country
            <input aria-label="Code review country" value={params.country || ''} onChange={event => update({ country: event.target.value })} placeholder="US" maxLength={80} className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">State / province
            <input aria-label="Code review state" value={params.state || ''} onChange={event => update({ state: event.target.value })} placeholder="OH" maxLength={80} className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">Building type
            <select aria-label="Building type" value={params.projectType || ''} onChange={event => update({ projectType: event.target.value as RoofParams['projectType'] })} className={inputClass}>
              <option value="">Select building type</option><option value="commercial">Commercial</option><option value="residential">Residential</option>
            </select>
          </label>
          <label className="text-xs font-medium text-text-secondary">Verified climate zone
            <input aria-label="Verified climate zone" value={params.climateZone || ''} onChange={event => update({ climateZone: event.target.value })} placeholder="From adopted energy code" maxLength={80} className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">Insulation target {metric ? '(RSI · m²·K/W)' : '(R · h·ft²·°F/Btu)'}
            <input aria-label="Insulation target" type="number" min="0" max={200 * rFactor} step="any" value={displayOptional(params.targetRValue, rFactor)} onChange={event => update({ targetRValue: optionalNumber(event.target.value, rFactor) })} placeholder="Unknown" className={inputClass} />
          </label>
          <label className="text-xs font-medium text-text-secondary">Additional dry load allowance {metric ? '(kg/m²)' : '(lb/ft²)'}
            <input aria-label="Additional dry load allowance" type="number" min="0" max={10000 * massFactor} step="any" value={displayOptional(params.allowableDeadLoadKgM2, massFactor)} onChange={event => update({ allowableDeadLoadKgM2: optionalNumber(event.target.value, massFactor) })} placeholder="Unknown" className={inputClass} />
            <span className="mt-1 block text-[11px] font-normal text-text-muted">Per horizontal plan area; provided by the project engineer.</span>
          </label>
          <label className="text-xs font-medium text-text-secondary">Verified VOC product limit (g/L)
            <input aria-label="VOC product limit" type="number" min="0" max="10000" step="any" value={params.vocLimit ?? ''} onChange={event => update({ vocLimit: optionalNumber(event.target.value) })} placeholder="Unknown" className={inputClass} />
          </label>
        </div>
      </fieldset>

      <div className="space-y-3" aria-live="polite">
        {report.requirements.map(requirement => <article key={requirement.id} className="rounded-xl border border-border-main p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-text-main">{requirement.title}</h3>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses[requirement.status]}`}>{requirement.status}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{requirement.detail}</p>
          <Sources sources={requirement.sources} />
        </article>)}
      </div>

      <section aria-labelledby="definitions-heading" className="border-t border-border-main pt-6">
        <h3 id="definitions-heading" className="mb-4 flex items-center gap-2 text-lg font-bold"><Leaf className="h-5 w-5 text-soprema-green" /> Material definitions & environmental evidence</h3>
        {report.materialDefinitions.length === 0 ? <p className="rounded-lg bg-bg-page p-4 text-sm text-text-muted">Add roofing materials to review their composition and available manufacturer documents.</p>
          : <div className="space-y-3">{report.materialDefinitions.map(definition => <article key={definition.material} className="rounded-xl border border-border-main bg-bg-page p-4">
            <h4 className="font-bold text-soprema-blue">{definition.material}</h4>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{definition.description}</p>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">{definition.environmentalImpact}</p>
            <Sources sources={definition.sources} />
          </article>)}</div>}
      </section>
    </div>
  </section>;
});
