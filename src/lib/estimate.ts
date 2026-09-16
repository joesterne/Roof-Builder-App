import type { Layer, RoofParams } from "../types";
export interface EstimateLine {
  layer: Layer;
  material: Layer["material"];
  order: number;
  requiredArea: number | null;
  coverage: number | null;
  packages: number | null;
  orderedArea: number | null;
  surplus: number | null;
  unitPrice: number | null;
  total: number | null;
  isSample: boolean;
  issues: string[];
}
const valid = (n: unknown, min = 0): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= min;
const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function computeEstimate(params: RoofParams, layers: Layer[]) {
  const issues: string[] = [];
  const area =
    valid(params.area, Number.MIN_VALUE) && params.area <= 1e9
      ? params.area
      : 0;
  const pitch = valid(params.pitch) && params.pitch <= 24 ? params.pitch : 0;
  const waste =
    valid(params.wasteFactor) && params.wasteFactor <= 1
      ? params.wasteFactor
      : 0;
  if (!area) issues.push("Enter a valid positive roof area.");
  if (pitch !== params.pitch)
    issues.push("Pitch must be between 0 and 24 in 12.");
  if (waste !== params.wasteFactor)
    issues.push("Waste must be between 0% and 100%.");
  const slopeFactor = Math.sqrt(1 + (pitch / 12) ** 2);
  const surfaceArea =
    params.areaBasis === "surface" ? area : area * slopeFactor;
  const planArea = params.areaBasis === "surface" ? area / slopeFactor : area;
  const designArea = surfaceArea * (1 + waste);
  const lines: EstimateLine[] = [...layers]
    .sort((a, b) => a.order - b.order)
    .map((layer, index) => {
      const m = layer.material,
        warnings: string[] = [];
      let coverage = layer.coverageOverride ?? m.coveragePerUnit;
      if (!valid(coverage, Number.MIN_VALUE)) {
        coverage = null;
        warnings.push("Enter verified net coverage per package.");
      }
      const detail = m.estimateScope === "detail";
      if (detail && !valid(layer.areaOverride, Number.MIN_VALUE))
        warnings.push("Enter measured detail area.");
      if (
        m.estimateScope === "interface" &&
        !valid(layer.coverageOverride, Number.MIN_VALUE)
      ) {
        coverage = null;
        warnings.push("Specify coverage for the approved adhesive spacing.");
      }
      let base = layer.areaOverride ?? surfaceArea;
      if (!valid(base, Number.MIN_VALUE)) {
        base = 0;
        warnings.push("Invalid measured layer area.");
      }
      const coats = layer.coats ?? 1;
      if (!Number.isInteger(coats) || coats < 1 || coats > 20)
        warnings.push("Coats must be a whole number from 1 to 20.");
      if (m.coverageBasis !== "per-coat" && coats !== 1)
        warnings.push(
          "Coverage already represents the complete system; coats are not multiplied.",
        );
      const quantityInputsValid = base > 0 && Number.isInteger(coats) && coats >= 1 && coats <= 20
        && !(detail && !valid(layer.areaOverride, Number.MIN_VALUE)) && area > 0
        && pitch === params.pitch && waste === params.wasteFactor;
      const requiredArea = quantityInputsValid ? base *
        (1 + waste) *
        (m.coverageBasis === "per-coat" ? coats : 1) : null;
      const q = coverage && requiredArea != null ? requiredArea / coverage : 0;
      const packages =
        coverage && requiredArea != null
          ? Math.ceil(q - 8 * Number.EPSILON * Math.max(1, q))
          : null;
      const isSample =
        layer.priceOverride == null &&
        m.pricePerUnit == null &&
        !!params.useSamplePrices &&
        valid(m.samplePricePerUnit);
      let unitPrice =
        layer.priceOverride ??
        m.pricePerUnit ??
        (isSample ? m.samplePricePerUnit : null);
      if (!valid(unitPrice)) {
        unitPrice = null;
        warnings.push("Supplier price has not been entered.");
      }
      if (m.legacyOnly)
        warnings.push(
          "Legacy product: verify current specifications and availability.",
        );
      const orderedArea =
        packages != null && coverage != null ? packages * coverage : null;
      return {
        layer,
        material: m,
        order: index,
        requiredArea,
        coverage,
        packages,
        orderedArea,
        surplus:
          orderedArea == null || requiredArea == null ? null : Math.max(0, orderedArea - requiredArea),
        unitPrice: unitPrice ?? null,
        total:
          packages != null && unitPrice != null
            ? cents(packages * unitPrice)
            : null,
        isSample,
        issues: warnings,
      };
    });
  const materialSubtotal = cents(
    lines.reduce((sum, l) => sum + (l.total ?? 0), 0),
  );
  const labor = valid(params.laborPerSqFt)
    ? cents(surfaceArea * params.laborPerSqFt)
    : 0;
  const freight = valid(params.freight) ? cents(params.freight) : 0;
  const tax = cents(
    (materialSubtotal *
      (valid(params.taxPercent) && params.taxPercent <= 100
        ? params.taxPercent
        : 0)) /
      100,
  );
  if (!layers.length) issues.push("Add materials to calculate an estimate.");
  if (!valid(params.laborPerSqFt))
    issues.push(
      "Labor is excluded until a rate is entered; enter 0 for materials-only scope.",
    );
  if (params.freight != null && !valid(params.freight))
    issues.push("Freight must be a nonnegative amount.");
  if (
    params.taxPercent != null &&
    (!valid(params.taxPercent) || params.taxPercent > 100)
  )
    issues.push("Tax rate must be between 0% and 100%.");
  if (lines.some((l) => l.isSample))
    issues.push(
      "Sample allowances are illustrative and require supplier quotes.",
    );
  const isComplete =
    layers.length > 0 &&
    !issues.length &&
    lines.every((l) => l.total != null && !l.issues.length);
  return {
    surfaceArea,
    planArea,
    designArea,
    slopeFactor,
    lines,
    materialSubtotal,
    labor,
    freight,
    tax,
    total: cents(materialSubtotal + labor + freight + tax),
    isComplete,
    issues,
  };
}
