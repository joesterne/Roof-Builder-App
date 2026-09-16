import { Layer, RoofParams } from "../types";
import {
  areaUnit,
  displayArea,
  displayThickness,
  formatNumber,
  money,
} from "../utils";
import { computeEstimate } from "../lib/estimate";
export default function ProjectStatistics({
  params,
  layers,
}: {
  params: RoofParams;
  layers: Layer[];
}) {
  const estimate = computeEstimate(params, layers);
  const thickness = layers.reduce(
    (n, l) => n + (l.material.thicknessMm || 0),
    0,
  );
  const resistance = layers.reduce((n, l) => n + (l.material.rValue || 0), 0);
  const allThickness =
    layers.length > 0 && layers.every((l) => l.material.thicknessMm != null);
  return (
    <section className="p-5 bg-bg-panel-hover space-y-3">
      <h2 className="font-bold">Assembly at a glance</h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          [
            "Surface area",
            `${formatNumber(displayArea(estimate.surfaceArea, params.unitSystem))} ${areaUnit(params.unitSystem)}`,
          ],
          ["Selected layers", String(layers.length)],
          [
            allThickness ? "Total thickness" : "Known thickness only",
            displayThickness(thickness, params.unitSystem),
          ],
          [
            "Known " + (params.unitSystem === "metric" ? "RSI" : "R-value"),
            formatNumber(
              params.unitSystem === "metric"
                ? resistance / 5.678263337
                : resistance,
            ),
          ],
          [
            estimate.isComplete ? "Estimated total" : "Priced subtotal",
            money(estimate.total),
          ],
        ].map(([label, value]) => (
          <div
            className="border border-border-main bg-bg-panel rounded-lg p-3"
            key={label}
          >
            <p className="text-xs text-text-muted">{label}</p>
            <p className="font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Thermal resistance sums documented layers only. Unknown properties are
        excluded; this is not a whole-roof U-factor calculation.
      </p>
    </section>
  );
}
