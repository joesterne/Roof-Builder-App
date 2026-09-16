import assert from "node:assert/strict";
import test from "node:test";
import { computeEstimate } from "../src/lib/estimate";
import { displayArea, inputArea } from "../src/utils";
import { DEFAULT_PARAMS } from "../src/lib/project";
import type { Layer, Material, RoofParams } from "../src/types";
const material: Material = {
  id: "test",
  name: "Test board",
  category: "Insulation",
  description: "Test fixture",
  unit: "board",
  coveragePerUnit: 32,
  pricePerUnit: 100,
};
const layer = (patch: Partial<Layer> = {}): Layer => ({
  id: "one",
  order: 0,
  material,
  ...patch,
});
const params = (patch: Partial<RoofParams> = {}): RoofParams => ({
  ...DEFAULT_PARAMS,
  laborPerSqFt: 0,
  ...patch,
});
test("pitch applies to footprint once, while waste applies to procurement only", () => {
  const r = computeEstimate(
    params({ area: 7200, pitch: 5, wasteFactor: 0.1 }),
    [layer()],
  );
  assert.equal(r.planArea, 7200);
  assert.ok(Math.abs(r.surfaceArea - 7800) < 1e-9);
  assert.ok(Math.abs(r.designArea - 8580) < 1e-9);
  assert.ok(Math.abs(displayArea(r.designArea, "metric") - 797.1080832) < 1e-9);
  assert.equal(
    computeEstimate(
      params({ area: 7800, areaBasis: "surface", pitch: 5, wasteFactor: 0.1 }),
      [layer()],
    ).surfaceArea,
    7800,
  );
});
test("whole packages round up per installation layer without floating point overcount", () => {
  const p = params({ area: 7800, areaBasis: "surface", wasteFactor: 0.05 });
  const r = computeEstimate(p, [layer(), layer({ id: "two", order: 1 })]);
  assert.deepEqual(
    r.lines.map((l) => l.packages),
    [256, 256],
  );
  const roll = layer({ coverageOverride: 10 });
  assert.equal(
    computeEstimate(params({ area: 100, pitch: 0, wasteFactor: 0.1 }), [roll])
      .lines[0].packages,
    11,
  );
  assert.equal(
    computeEstimate(params({ area: 110.01, pitch: 0, wasteFactor: 0 }), [roll])
      .lines[0].packages,
    12,
  );
});
test("metric entry and unit display switches keep package counts and costs invariant", () => {
  const p = params({
    area: inputArea(100, "metric"),
    pitch: 0,
    wasteFactor: 0.1,
  });
  const l = layer({
    coverageOverride: inputArea(8.865, "metric"),
    priceOverride: 125.5,
  });
  const a = computeEstimate(p, [l]);
  const b = computeEstimate({ ...p, unitSystem: "metric" }, [l]);
  assert.equal(a.lines[0].packages, 13);
  assert.equal(a.total, 1631.5);
  assert.equal(b.total, a.total);
  for (let i = 0; i < 100; i++)
    p.unitSystem = p.unitSystem === "metric" ? "imperial" : "metric";
  assert.equal(computeEstimate(p, [l]).total, a.total);
});
test("unknown coverage or price stays incomplete; explicit zero quote is valid", () => {
  const m = {
    ...material,
    pricePerUnit: null,
    coveragePerUnit: null,
    samplePricePerUnit: 12,
  };
  let r = computeEstimate(params(), [layer({ material: m })]);
  assert.equal(r.isComplete, false);
  assert.equal(r.lines[0].packages, null);
  assert.equal(r.lines[0].unitPrice, null);
  r = computeEstimate(params(), [
    layer({ material: m, coverageOverride: 32, priceOverride: 0 }),
  ]);
  assert.equal(r.lines[0].total, 0);
  assert.equal(r.lines[0].isSample, false);
});
test("detail scope requires measured area; adhesive needs project coverage", () => {
  const detail = {
    ...material,
    estimateScope: "detail" as const,
    coverageBasis: "system" as const,
  };
  assert.equal(
    computeEstimate(params(), [layer({ material: detail })]).lines[0].packages,
    null,
  );
  const r = computeEstimate(params({ pitch: 12, wasteFactor: 0.1 }), [
    layer({ material: detail, areaOverride: 100, coats: 2 }),
  ]);
  assert.ok(Math.abs(r.lines[0].requiredArea - 110) < 1e-10);
  assert.equal(r.lines[0].packages, 4);
  assert.equal(
    computeEstimate(params(), [
      layer({ material: { ...material, estimateScope: "interface" } }),
    ]).lines[0].packages,
    null,
  );
});
test("coats only multiply per-coat quantities; tax is materials and labor excludes waste", () => {
  const r = computeEstimate(
    params({
      area: 100,
      pitch: 0,
      wasteFactor: 0.1,
      laborPerSqFt: 2,
      freight: 30,
      taxPercent: 10,
    }),
    [
      layer({
        material: { ...material, coverageBasis: "per-coat" },
        coverageOverride: 100,
        coats: 2,
      }),
    ],
  );
  assert.equal(r.lines[0].packages, 3);
  assert.equal(r.materialSubtotal, 300);
  assert.equal(r.labor, 200);
  assert.equal(r.tax, 30);
  assert.equal(r.total, 560);
});
