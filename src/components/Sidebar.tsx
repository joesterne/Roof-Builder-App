import React, { useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  ExternalLink,
  X,
  Layers3,
  SlidersHorizontal,
} from "lucide-react";
import { RoofParams, Layer, Material } from "../types";
import { ACTIVE_MATERIALS } from "../data";
import {
  areaUnit,
  displayArea,
  inputArea,
  displayThickness,
  money,
  formatNumber,
} from "../utils";
import LocationPicker from "./LocationPicker";
import ProjectStatistics from "./ProjectStatistics";

interface Props {
  params: RoofParams;
  setParams: (params: RoofParams) => void;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
}
const inputClass =
  "w-full mt-1 rounded-lg border border-border-main bg-bg-panel px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-soprema-blue";
export default function Sidebar({
  params,
  setParams,
  layers,
  setLayers,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const compare = useRef<HTMLDialogElement>(null);
  const unit = areaUnit(params.unitSystem);
  const filtered = useMemo(
    () =>
      ACTIVE_MATERIALS.filter(
        (m) =>
          (category === "All" || m.category === category) &&
          `${m.name} ${m.category} ${m.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, category],
  );
  const products = selected.map((id) =>
    ACTIVE_MATERIALS.find((m) => m.id === id)!,
  );
  const patch = (value: Partial<RoofParams>) =>
    setParams({ ...params, ...value });
  const coverage = (m: Material) =>
    m.coveragePerUnit == null
      ? "Project input required"
      : `${formatNumber(displayArea(m.coveragePerUnit, params.unitSystem))} ${unit} / ${m.unit}`;
  const add = (material: Material) =>
    setLayers((prev) =>
      [
        ...prev.slice().sort((a, b) => a.order - b.order),
        { id: crypto.randomUUID(), material, order: prev.length },
      ].map((l, order) => ({ ...l, order })),
    );
  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
          ? [...prev, id]
          : prev,
    );
  return (
    <aside className="w-full h-full overflow-y-auto bg-bg-panel border-r border-border-main text-text-main">
      <section className="p-5 border-b border-border-main space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-soprema-blue" />
          <h2 className="font-bold">Project parameters</h2>
        </div>
        <label className="block text-xs font-semibold">
          Project name
          <input
            className={inputClass}
            value={params.name || ""}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Untitled roofing project"
            maxLength={150}
          />
        </label>
        <label className="block text-xs font-semibold">
          Client
          <input
            className={inputClass}
            value={params.client || ""}
            onChange={(e) => patch({ client: e.target.value })}
            maxLength={150}
            placeholder="Client or organization"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold">
            Roof area ({unit})
            <input
              type="number"
              min="0.01"
              max="100000000"
              step="any"
              className={inputClass}
              value={Number(
                displayArea(params.area, params.unitSystem).toFixed(6),
              )}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n) && n > 0)
                  patch({ area: inputArea(n, params.unitSystem) });
              }}
            />
          </label>
          <label className="text-xs font-semibold">
            Area measurement
            <select
              className={inputClass}
              value={params.areaBasis || "plan"}
              onChange={(e) =>
                patch({ areaBasis: e.target.value as "plan" | "surface" })
              }
            >
              <option value="plan">Plan footprint</option>
              <option value="surface">Measured surface</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Pitch (rise / 12)
            <input
              type="number"
              min="0"
              max="24"
              step="0.25"
              className={inputClass}
              value={params.pitch}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n) && n >= 0 && n <= 24)
                  patch({ pitch: n });
              }}
            />
          </label>
          <label className="text-xs font-semibold">
            Waste (%)
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className={inputClass}
              value={Number((params.wasteFactor * 100).toFixed(4))}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isFinite(n) && n >= 0 && n <= 100)
                  patch({ wasteFactor: n / 100 });
              }}
            />
          </label>
        </div>
        <p className="text-xs text-text-muted">
          Slope {formatNumber((params.pitch / 12) * 100)}% ·{" "}
          {formatNumber((Math.atan(params.pitch / 12) * 180) / Math.PI)}°. Pitch
          adjusts plan area only.
        </p>
        <label className="block text-xs font-semibold">
          Project address
          <input
            className={inputClass}
            value={params.location}
            onChange={(e) => patch({ location: e.target.value })}
            placeholder="Street, city, state"
            maxLength={300}
          />
        </label>
        <LocationPicker
          coordinates={params.coordinates}
          unitSystem={params.unitSystem}
          onLocationSelect={(lat, lng) => patch({ coordinates: { lat, lng } })}
        />
        <label className="block text-xs font-semibold">
          Project notes & client requirements
          <textarea id="project-notes"
            className={inputClass}
            rows={4}
            maxLength={20000}
            value={params.projectNotes || ""}
            onChange={(e) => patch({ projectNotes: e.target.value })}
            placeholder="Access constraints, finish preferences, installation requirements…"
          />
        </label>
      </section>
      <section className="p-5 border-b border-border-main space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex gap-2 items-center">
            <Layers3 size={18} className="text-soprema-blue" />
            Material library
          </h2>
          <span className="text-xs text-text-muted">
            {ACTIVE_MATERIALS.length} products
          </span>
        </div>
        <a
          href="https://www.soprema.us/products/market-segment/roofing/all-roofing-products"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-soprema-blue inline-flex items-center gap-1"
        >
          Full SOPREMA catalog <ExternalLink size={12} />
        </a>
        <p className="text-xs text-text-muted">
          Curated product variants with source links. Add in installation order,
          then arrange layers in the visualizer. Attachments and accessories
          require separate review.
        </p>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-text-muted" />
          <input
            aria-label="Search materials by category or keyword"
            className={inputClass + " pl-9 !mt-0"}
            placeholder="Search products or categories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Product category"
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All</option>
          {[...new Set(ACTIVE_MATERIALS.map((m) => m.category))].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={selected.length !== 2}
          onClick={() => compare.current?.showModal()}
          className="w-full border border-soprema-blue text-soprema-blue rounded-lg py-2 text-xs font-bold disabled:opacity-40"
        >
          Compare selected products ({selected.length}/2)
        </button>
        {filtered.length === 0 && (
          <p className="text-sm py-5 text-text-muted">
            No matching products. Try another category or keyword.
          </p>
        )}
        {filtered.map((m) => (
          <article
            key={m.id}
            className="rounded-xl border border-border-main p-3 space-y-2 hover:border-soprema-blue transition-colors"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-text-muted">
                  {m.category}
                </span>
                <a
                  className="block text-sm font-bold text-soprema-blue hover:underline"
                  href={m.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={`${m.description} Thickness: ${displayThickness(m.thicknessMm, params.unitSystem)}. Coverage: ${coverage(m)}. ${Object.entries(
                    m.techSpecs || {},
                  )
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("; ")}`}
                >
                  {m.name} ↗
                </a>
              </div>
              <button
                onClick={() => add(m)}
                type="button"
                aria-label={`Add ${m.name}`} disabled={layers.length >= 100}
                className="shrink-0 bg-soprema-blue text-white rounded-lg p-2 hover:opacity-80"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-text-muted">{coverage(m)}</p>
            <div className="flex justify-between gap-2 text-xs">
              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(m.id)}
                  disabled={selected.length === 2 && !selected.includes(m.id)}
                  onChange={() => toggle(m.id)}
                />
                Compare
              </label>
              <span>
                {params.useSamplePrices
                  ? `${money(m.samplePricePerUnit)} sample`
                  : "Supplier quote required"}
              </span>
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer text-text-muted">
                Technical specifications
              </summary>
              <div className="pt-2 space-y-1">
                <p>{m.description}</p>
                <p>
                  Thickness:{" "}
                  {displayThickness(m.thicknessMm, params.unitSystem)}
                </p>
                {Object.entries(m.techSpecs || {}).map(([k, v]) => (
                  <p key={k}>
                    {k}: {v}
                  </p>
                ))}
                <p>{m.coverageNote}</p>
                <a
                  href={m.dataSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-soprema-blue underline"
                >
                  Manufacturer data sheet
                </a>
              </div>
            </details>
          </article>
        ))}
      </section>
      <ProjectStatistics params={params} layers={layers} />
      <dialog
        ref={compare}
        className="m-auto w-[min(900px,95vw)] max-h-[90vh] overflow-auto rounded-2xl p-6 bg-bg-panel text-text-main backdrop:bg-black/50"
        aria-labelledby="compare-title"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="compare-title" className="font-bold text-lg">
            Product comparison
          </h2>
          <button
            autoFocus
            aria-label="Close comparison"
            onClick={() => compare.current?.close()}
          >
            <X />
          </button>
        </div>
        <p className="text-xs text-text-muted mb-4">
          Product-level attributes do not establish complete roof assembly
          approval. EPD and HPD are disclosures, not certifications.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3">Specification</th>
                {products.map((m) => (
                  <th className="text-left p-3" key={m.id}>
                    <a
                      href={m.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-soprema-blue underline"
                    >
                      {m.name}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Category", (m: Material) => m.category],
                [
                  "Composition",
                  (m: Material) => m.composition || "Not documented",
                ],
                [
                  "Thickness",
                  (m: Material) =>
                    displayThickness(m.thicknessMm, params.unitSystem),
                ],
                ["Coverage", (m: Material) => coverage(m)],
                [
                  "Thermal resistance",
                  (m: Material) =>
                    m.rValue == null
                      ? "Not documented"
                      : params.unitSystem === "metric"
                        ? `RSI ${formatNumber(m.rValue / 5.678263337)}`
                        : `R ${formatNumber(m.rValue)}`,
                ],
                ["Supplier price", () => "Quote required"],
                [
                  "Sample allowance",
                  (m: Material) =>
                    `${money(m.samplePricePerUnit)} / ${m.unit} (illustrative)`,
                ],
                [
                  "Technical details",
                  (m: Material) =>
                    Object.entries(m.techSpecs || {})
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("; ") || "See data sheet",
                ],
                [
                  "Coverage assumptions",
                  (m: Material) =>
                    m.coverageNote || "Published net package coverage",
                ],
              ].map(([label, value]) => (
                <tr
                  key={label as string}
                  className="border-t border-border-main"
                >
                  <th className="text-left p-3 align-top font-medium">
                    {label as string}
                  </th>
                  {products.map((m) => (
                    <td className="p-3 align-top" key={m.id}>
                      {(value as (m: Material) => string)(m)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-border-main">
                <th className="p-3 text-left align-top">
                  Environmental evidence
                </th>
                {products.map((m) => (
                  <td key={m.id} className="p-3 align-top">
                    {m.environmentalEvidence?.length
                      ? m.environmentalEvidence.map((e) => (
                          <p key={e.url}>
                            <a
                              href={e.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-soprema-blue underline"
                            >
                              {e.label}
                            </a>{" "}
                            ({e.kind})
                            {e.validUntil && ` · expires ${e.validUntil}`}
                          </p>
                        ))
                      : "No certification verified in this catalog; review manufacturer documents."}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </dialog>
    </aside>
  );
}
