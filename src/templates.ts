import { SavedProject, Layer } from "./types";
import { SOPREMA_MATERIALS } from "./data";
function layer(id: string, order: number): Layer {
  return {
    id: `template-${id}-${order}`,
    material: SOPREMA_MATERIALS.find((m) => m.id === id)!,
    order,
  };
}
// Conceptual starting points only. Attachment, compatibility, flashing, and approvals need project review.
export const ROOF_TEMPLATES: SavedProject[] = [
  {
    schemaVersion: 2,
    id: "tpl-sbs",
    name: "SBS concept — verify system approval",
    date: "2026-09-15",
    thumbnail: "",
    params: {
      area: 10000,
      pitch: 0.25,
      areaBasis: "plan",
      location: "",
      wasteFactor: 0.1,
      unitSystem: "imperial",
      projectNotes:
        "Concept assembly: verify approved deck, attachment, primers, flashing, fasteners and local requirements before procurement.",
    },
    layers: [
      "sopravapr",
      "sopra-iso-plus-2in-4x8",
      "sopraboard-quarter-4x8",
      "sopralene-flam-180",
      "sopralene-flam-180-fr-plus-gr",
    ].map(layer),
  },
  {
    schemaVersion: 2,
    id: "tpl-pvc",
    name: "PVC concept — enter net membrane coverage",
    date: "2026-09-15",
    thumbnail: "",
    params: {
      area: 10000,
      pitch: 0.25,
      areaBasis: "plan",
      location: "",
      wasteFactor: 0.1,
      unitSystem: "imperial",
      projectNotes:
        "Concept assembly: enter net PVC roll coverage after laps and layout, and verify manufacturer-approved substrate and attachments.",
    },
    layers: ["sopravapr", "sopra-iso-plus-2in-4x8", "sentinel-p150"].map(layer),
  },
];
