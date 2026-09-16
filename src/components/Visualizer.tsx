import { computeEstimate } from '../lib/estimate';
import React, { useEffect, useMemo, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { ArrowDown, ArrowUp, Copy, ExternalLink, GripVertical, Info, Layers3, RotateCcw, RotateCw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import type { Layer, RoofParams } from '../types';
import { areaUnit, displayArea, displayThickness, displayWeight, formatNumber, money } from '../utils';
import { DEFAULT_VISUALIZER, diagramDataUri, getVisualizerView, layerColor } from '../lib/diagram';
import type { VisualizerView } from '../lib/diagram';

interface VisualizerProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  params: RoofParams;
  setParams?: React.Dispatch<React.SetStateAction<RoofParams>>;
}

interface LayerRowProps {
  layer: Layer;
  position: number;
  count: number;
  selected: boolean;
  checked: boolean;
  onToggleChecked: () => void;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onDragEnd: () => void;
}

const buttonClass = 'rounded-lg border border-border-main bg-bg-panel p-2 text-text-secondary transition-colors hover:border-soprema-blue hover:text-soprema-blue disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soprema-blue';

function LayerRow({ layer, position, count, selected, checked, onToggleChecked, onSelect, onMove, onRemove, onDragEnd }: LayerRowProps) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item value={layer.id} dragListener={false} dragControls={dragControls} onDragEnd={onDragEnd}
      className={`relative rounded-xl border bg-bg-panel p-3 shadow-sm ${selected ? 'border-soprema-blue ring-1 ring-soprema-blue/15' : 'border-border-main'}`}>
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={checked} onChange={onToggleChecked}
          aria-label={`Select application ${count - position}: ${layer.material.name} for bulk actions`}
          className="mt-2 h-4 w-4 shrink-0 cursor-pointer accent-soprema-blue" />
        <button type="button" onPointerDown={event => dragControls.start(event)}
          onKeyDown={event => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault();
              onMove(event.key === 'ArrowUp' ? -1 : 1);
            }
          }}
          className="mt-0.5 touch-none cursor-grab rounded p-1 text-text-muted active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-soprema-blue"
          aria-label={`Reorder ${layer.material.name}. Use up and down arrows to move.`} title="Drag to move; arrow keys also move this layer">
          <GripVertical size={17} aria-hidden="true" />
        </button>
        <button type="button" onClick={onSelect} aria-pressed={selected}
          className="min-w-0 flex-1 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soprema-blue">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: layerColor(layer.material.category) }} />
            {layer.material.category}
          </span>
          <span className="block break-words text-sm font-semibold text-text-main">{layer.material.name}</span>
          <span className="mt-1 block text-[11px] text-text-muted">Application {count - position}</span>
        </button>
      </div>
      <div className="mt-2 flex justify-end gap-1 border-t border-border-main/60 pt-2">
        <button type="button" disabled={position === 0} onClick={() => onMove(-1)} className="rounded p-1.5 text-text-muted hover:bg-bg-page hover:text-soprema-blue disabled:opacity-25"
          aria-label={`Move ${layer.material.name} toward roof exterior`} title="Move toward exterior"><ArrowUp size={15} /></button>
        <button type="button" disabled={position === count - 1} onClick={() => onMove(1)} className="rounded p-1.5 text-text-muted hover:bg-bg-page hover:text-soprema-blue disabled:opacity-25"
          aria-label={`Move ${layer.material.name} toward roof support`} title="Move toward support"><ArrowDown size={15} /></button>
        <button type="button" onClick={onRemove} className="ml-1 rounded p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600"
          aria-label={`Remove ${layer.material.name}`} title="Remove this layer"><Trash2 size={15} /></button>
      </div>
    </Reorder.Item>
  );
}

export default React.memo(function Visualizer({ layers, setLayers, params, setParams }: VisualizerProps) {
  const [localView, setLocalView] = useState<VisualizerView>(() => getVisualizerView(params));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [pendingBulk, setPendingBulk] = useState<{ type: 'duplicate' | 'delete'; ids: string[] } | null>(null);
  const effectiveParams = useMemo(() => setParams ? params : { ...params, visualizer: localView }, [params, setParams, localView]);
  const view = getVisualizerView(effectiveParams);
  const ordered = useMemo(() => [...layers].sort((a, b) => a.order - b.order), [layers]);
  const exteriorFirst = useMemo(() => ordered.slice().reverse(), [ordered]);
  const checkedLayers = ordered.filter(layer => checkedIds.has(layer.id));
  const canDuplicate = checkedLayers.length > 0 && layers.length + checkedLayers.length <= 100;

  useEffect(() => {
    const present = new Set(layers.map(layer => layer.id));
    setCheckedIds(previous => {
      const next = new Set([...previous].filter(id => present.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [layers]);

  useEffect(() => {
    // Inspect the committed result, including any concurrent catalog changes.
    if (!pendingBulk) return;
    const present = new Set(layers.map(layer => layer.id));
    const count = pendingBulk.ids.filter(id => pendingBulk.type === 'duplicate' ? present.has(id) : !present.has(id)).length;
    if (pendingBulk.type === 'duplicate') {
      setAnnouncement(count ? `${count} layer${count === 1 ? '' : 's'} duplicated. Application order updated.` : 'No layers duplicated. The assembly supports a maximum of 100 layers.');
    } else setAnnouncement(`${count} layer${count === 1 ? '' : 's'} removed. Application order updated.`);
    setPendingBulk(null);
  }, [layers, pendingBulk]);
  const selected = exteriorFirst.find(layer => layer.id === selectedId) ?? exteriorFirst[0];
  const estimate = useMemo(() => computeEstimate(params, layers), [params, layers]);
  const image = useMemo(() => diagramDataUri(effectiveParams, layers), [effectiveParams, layers]);
  const knownWeightCount = layers.filter(layer => typeof layer.material.weightKgM2 === 'number' && Number.isFinite(layer.material.weightKgM2) && layer.material.weightKgM2 >= 0).length;

  const updateView = (patch: Partial<VisualizerView>) => {
    if (setParams) {
      setParams(previous => ({ ...previous, visualizer: getVisualizerView({ ...previous, visualizer: { ...getVisualizerView(previous), ...patch } }) }));
    } else {
      setLocalView(previous => getVisualizerView({ ...params, visualizer: { ...previous, ...patch } }));
    }
  };

  const reorder = (ids: string[]) => {
    setLayers(previous => {
      const byId = new Map(previous.map(layer => [layer.id, layer]));
      // A sidebar update can arrive during a drag. Do not lose a newly added layer.
      if (ids.length !== previous.length || new Set(ids).size !== ids.length || ids.some(id => !byId.has(id))) return previous;
      return ids.slice().reverse().map((id, order) => ({ ...byId.get(id)!, order }));
    });
  };

  const move = (id: string, direction: -1 | 1) => {
    const ids = exteriorFirst.map(layer => layer.id);
    const index = ids.indexOf(id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= ids.length) return;
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    reorder(ids);
    setAnnouncement(`${exteriorFirst[index].material.name} moved ${direction < 0 ? 'toward the exterior' : 'toward the support'}. Application order updated.`);
  };

  const remove = (layer: Layer) => {
    setLayers(previous => previous.filter(item => item.id !== layer.id).sort((a, b) => a.order - b.order).map((item, order) => ({ ...item, order })));
    setAnnouncement(`${layer.material.name} removed from the assembly.`);
  };

  const toggleChecked = (id: string) => {
    setCheckedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const duplicateChecked = () => {
    if (!canDuplicate) return;
    // Generate IDs once per action: React may evaluate a state updater more than once.
    const duplicateIds = new Map(checkedLayers.map(layer => [layer.id, crypto.randomUUID()]));
    setLayers(previous => {
      const installationOrder = previous.slice().sort((a, b) => a.order - b.order);
      const count = installationOrder.filter(layer => duplicateIds.has(layer.id)).length;
      if (previous.length + count > 100) return previous;
      return installationOrder.flatMap(layer => duplicateIds.has(layer.id)
        ? [layer, { ...layer, id: duplicateIds.get(layer.id)! }]
        : [layer]).map((layer, order) => ({ ...layer, order }));
    });
    const copiedIds = [...duplicateIds.values()];
    setCheckedIds(new Set(copiedIds));
    setSelectedId(copiedIds[0] || null);
    setPendingBulk({ type: 'duplicate', ids: copiedIds });
  };

  const deleteChecked = () => {
    const ids = checkedLayers.map(layer => layer.id);
    if (!ids.length) return;
    const selectedIds = new Set(ids);
    setLayers(previous => previous.filter(layer => !selectedIds.has(layer.id)).sort((a, b) => a.order - b.order)
      .map((layer, order) => ({ ...layer, order })));
    setCheckedIds(new Set());
    if (selectedId && selectedIds.has(selectedId)) setSelectedId(null);
    setPendingBulk({ type: 'delete', ids });
  };

  const productUrl = selected?.material.productUrl;
  const productLink = productUrl && /^https:\/\/(?:www\.)?soprema\.us(?:\/|$)/i.test(productUrl) ? productUrl : undefined;

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-bg-page" aria-label="Roof assembly visualizer">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main bg-bg-panel px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-text-main"><Layers3 size={19} className="text-soprema-blue" /> Assembly explorer</h2>
          <p className="mt-0.5 text-xs text-text-muted">Build the application order and inspect each layer.</p>
        </div>
        <div className="flex items-center gap-1.5" aria-label="View controls">
          <button type="button" className={buttonClass} aria-label="Zoom out" title="Zoom out" disabled={view.zoom <= 0.5} onClick={() => updateView({ zoom: view.zoom - 0.1 })}><ZoomOut size={17} /></button>
          <span className="min-w-12 text-center text-xs font-semibold tabular-nums text-text-secondary" aria-live="polite">{Math.round(view.zoom * 100)}%</span>
          <button type="button" className={buttonClass} aria-label="Zoom in" title="Zoom in" disabled={view.zoom >= 2} onClick={() => updateView({ zoom: view.zoom + 0.1 })}><ZoomIn size={17} /></button>
          <button type="button" className={`${buttonClass} ml-2`} aria-label="Rotate view left" title="Rotate left" onClick={() => updateView({ rotation: view.rotation - 15 < -180 ? 165 : view.rotation - 15 })}><RotateCcw size={17} /></button>
          <button type="button" className={buttonClass} aria-label="Rotate view right" title="Rotate right" onClick={() => updateView({ rotation: view.rotation + 15 > 180 ? -165 : view.rotation + 15 })}><RotateCw size={17} /></button>
          <button type="button" className={`${buttonClass} ml-1 px-3 text-xs font-semibold`} onClick={() => updateView(DEFAULT_VISUALIZER)}>Reset view</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0 space-y-4">
            <div id="visualizer-capture" className="overflow-hidden rounded-2xl border border-border-main bg-white shadow-sm">
              <div className="max-h-[700px] min-h-[320px] overflow-auto" tabIndex={0} aria-label="Exploded roof diagram. Scroll to inspect a zoomed view.">
                <img src={image} alt={`Exploded roof assembly, exterior to support: ${exteriorFirst.map(layer => layer.material.name).join(', ') || 'no materials selected'}. Select a layer below for specifications.`}
                  className="block max-w-none" style={{ width: `${view.zoom * 100}%`, minWidth: `${560 * view.zoom}px` }} draggable={false} />
              </div>
              <div className="grid gap-4 border-t border-border-main bg-bg-panel px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-xs font-medium text-text-secondary">
                  <span className="mb-2 flex justify-between"><span>Layer separation</span><span className="text-text-muted">{Math.round(view.explosion)}</span></span>
                  <input type="range" min="0" max="96" step="4" value={view.explosion} onChange={event => updateView({ explosion: Number(event.target.value) })} className="w-full accent-soprema-blue" />
                </label>
                <label className="block text-xs font-medium text-text-secondary">Visual weather
                  <select className="mt-1.5 w-full rounded-lg border border-border-main bg-bg-panel px-2 py-1.5 text-text-main" value={view.weather} onChange={event => updateView({ weather: event.target.value as VisualizerView['weather'] })}>
                    <option value="none">Clear</option><option value="rain">Rain</option><option value="snow">Snow</option>
                  </select>
                </label>
                <label className="block text-xs font-medium text-text-secondary">
                  <span className="mb-2 flex justify-between"><span>Weather intensity</span><span className="text-text-muted">{view.weatherIntensity}%</span></span>
                  <input type="range" min="0" max="100" step="10" value={view.weatherIntensity} disabled={view.weather === 'none'} onChange={event => updateView({ weatherIntensity: Number(event.target.value) })} className="w-full accent-soprema-blue disabled:opacity-35" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Summary label="Roof surface area" value={`${formatNumber(displayArea(estimate.surfaceArea, params.unitSystem))} ${areaUnit(params.unitSystem)}`} />
              <Summary label={estimate.isComplete ? 'Estimated total' : 'Known cost subtotal'} value={money(estimate.total)} />
              <Summary label="Selected layers" value={String(layers.length)} />
              <Summary label="Layers with weight data" value={`${knownWeightCount} / ${layers.length}`} />
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border-main bg-bg-panel p-3 text-xs leading-relaxed text-text-muted">
              <Info size={16} className="mt-0.5 shrink-0 text-soprema-blue" />
              <p>Thickness, spacing, and roof proportions are illustrative. Rain and snow are visual effects. Verify the complete assembly and application sequence against manufacturer details. {knownWeightCount < layers.length ? 'Missing product weights prevent a complete load calculation.' : 'Product weights do not establish the structural capacity of the roof.'}</p>
            </div>
          </div>

          <aside className="min-w-0 space-y-4" aria-label="Assembly layers and selected product">
            <div className="rounded-2xl border border-border-main bg-bg-panel p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-text-main">Roof layers</h3><span className="rounded-full bg-soprema-blue/10 px-2 py-0.5 text-xs font-semibold text-soprema-blue">{layers.length}</span></div>
              <p className="mb-3 text-xs leading-relaxed text-text-muted">Drag the handle, use its arrow keys, or use the move buttons. Application 1 is installed first.</p>
              {layers.length > 0 && <div className="mb-3 rounded-xl border border-border-main bg-bg-page p-3" aria-label="Bulk layer actions">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-text-secondary">{checkedLayers.length} selected</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCheckedIds(new Set(layers.map(layer => layer.id)))}
                      disabled={checkedLayers.length === layers.length} className="font-semibold text-soprema-blue hover:underline disabled:opacity-40">Select all layers</button>
                    <button type="button" onClick={() => setCheckedIds(new Set())} disabled={!checkedLayers.length}
                      className="text-text-muted hover:text-soprema-blue disabled:opacity-40">Clear selection</button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={duplicateChecked} disabled={!canDuplicate}
                    className={`${buttonClass} flex items-center justify-center gap-1.5 px-2 text-xs font-semibold`} title="Insert a copy immediately after each selected layer in application order">
                    <Copy size={14} /> Duplicate selected
                  </button>
                  <button type="button" onClick={deleteChecked} disabled={!checkedLayers.length}
                    className={`${buttonClass} flex items-center justify-center gap-1.5 px-2 text-xs font-semibold hover:border-red-600 hover:text-red-600`}>
                    <Trash2 size={14} /> Delete selected
                  </button>
                </div>
                {checkedLayers.length > 0 && !canDuplicate && <p className="mt-2 text-xs text-amber-800" role="status">Maximum 100 layers. Select no more than {Math.max(0, 100 - layers.length)} to duplicate.</p>}
              </div>}
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Exterior / weather side</p>
              {exteriorFirst.length ? (
                <Reorder.Group axis="y" values={exteriorFirst.map(layer => layer.id)} onReorder={reorder} as="ol" className="space-y-2" aria-label="Layers from exterior to support">
                  {exteriorFirst.map((layer, index) => <LayerRow key={layer.id} layer={layer} position={index} count={layers.length} selected={selected?.id === layer.id}
                    checked={checkedIds.has(layer.id)} onToggleChecked={() => toggleChecked(layer.id)}
                    onSelect={() => setSelectedId(layer.id)} onMove={direction => move(layer.id, direction)} onRemove={() => remove(layer)}
                    onDragEnd={() => setAnnouncement('Application order updated. Review the assembly sequence against manufacturer details.')} />)}
                </Reorder.Group>
              ) : <p className="rounded-xl border border-dashed border-border-main p-5 text-center text-sm text-text-muted">Choose a material from the catalog to start.</p>}
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Support / first installed</p>
            </div>

            {selected && (
              <div className="rounded-2xl border border-border-main bg-bg-panel p-4 shadow-sm" aria-label="Selected layer details">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-soprema-blue">Selected material</p>
                <h3 className="break-words text-sm font-bold text-text-main">{selected.material.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-text-muted">{selected.material.description}</p>
                <dl className="mt-4 space-y-2 text-xs">
                  <Spec label="Recorded thickness" value={displayThickness(selected.material.thicknessMm, params.unitSystem)} />
                  <Spec label="Recorded weight / area" value={displayWeight(selected.material.weightKgM2, params.unitSystem)} />
                  <Spec label={params.unitSystem === 'metric' ? 'RSI (m²·K/W)' : 'R-value (ft²·°F·h/BTU)'} value={formatNumber(selected.material.rValue == null ? null : selected.material.rValue * (params.unitSystem === 'metric' ? 0.1761101838 : 1))} />
                </dl>
                {!!selected.material.techSpecs && Object.keys(selected.material.techSpecs).length > 0 && <details className="mt-3 border-t border-border-main pt-3 text-xs">
                  <summary className="cursor-pointer font-semibold text-text-secondary">Manufacturer specification text</summary>
                  <dl className="mt-3 space-y-2">{Object.entries(selected.material.techSpecs).map(([label, value]) => <Spec key={label} label={label} value={value} />)}</dl>
                </details>}
                {productLink && <a href={productLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-soprema-blue hover:underline">View product at SOPREMA <ExternalLink size={13} /></a>}
              </div>
            )}
          </aside>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    </section>
  );
});

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border-main bg-bg-panel p-3"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p><p className="text-base font-bold tabular-nums text-text-main">{value}</p></div>;
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><dt className="text-text-muted">{label}</dt><dd className="max-w-[60%] break-words text-right font-medium text-text-main">{value}</dd></div>;
}
