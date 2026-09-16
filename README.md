# RoofStudio — SOPREMA roof assembly planner

RoofStudio is a React and TypeScript application for selecting SOPREMA roofing materials, arranging an assembly, and preparing material quantities and a project budget. It includes a visual layer diagram, local project storage, PDF bills of materials, and source-linked climate and requirement screening.

This is an independent planning application. Product selection and preliminary checks require review against the manufacturer’s approved system and the project’s governing requirements before procurement or installation.

## GitHub description

> SOPREMA roof assembly planner with reorderable layer visualization, quantity and cost estimates, PDF BOM export, product comparison, saved projects, and location-based climate screening.

Suggested topics: `roofing`, `soprema`, `construction`, `bill-of-materials`, `react`, `typescript`, `vite`, `estimating`.

## Features

| Area | Included behavior |
| --- | --- |
| Project parameters | Roof area, plan or measured surface basis, pitch, waste allowance, project name, client, location, and project notes. |
| Product catalog | Search by keyword or category, manufacturer product links, technical snippets on hover, expandable specifications, composition information, and source documents. |
| Product comparison | Select two products for a side-by-side comparison of specifications, coverage, environmental evidence, and illustrative price allowances. |
| Assembly studio | Exploded layer diagram, drag-and-drop reordering, zoom, spacing, rotation, and decorative rain or snow. Installation order is preserved in saved projects and estimates. Select multiple layers to duplicate or delete them together. |
| Units | Imperial and Metric display for supported dimensional inputs, quantities, thickness, thermal resistance, and load criteria. Package counts stay the same when units change. |
| Bill of materials | Whole-package estimates, layer-specific coverage and price inputs, detail areas, waste, optional labor, freight, and material tax. Missing inputs remain visible. |
| PDF | Formatted project summary, assembly, notes, material quantities, cost estimate, and assumptions in a printable PDF. |
| Save and restore | Named device saves with diagram thumbnails, an automatically restored working copy, duplicate/delete controls, and JSON import/export. |
| Reset | Confirmation dialog clears current layers and restores default parameters while retaining named saves. |
| Sharing | Encoded project links, QR codes, and an email draft with a summary and a link to reopen the BOM and download its PDF. |
| Location | Optional Google Maps click/drag pin plus manual coordinate entry and an external Maps link. |
| Climate | Five complete years of ERA5 daily historical data from Open-Meteo, with catalog candidate suggestions and visible data gaps. |
| Requirements | Source-linked Ohio code references and comparisons against entered thermal, additional dead load, and VOC criteria. Material definitions distinguish disclosures from certifications. |
| Optional cloud | Firebase authentication and owner-filtered Firestore project synchronization alongside device saves. |
| Appearance | Responsive workspace, dark mode, and SOPREMA-inspired blue `#0072CE`, grey `#7C878E`, and black `#212322`. |

## Run locally

Use Node.js 22 or newer and npm. The workspace and device saves work without API keys; external map, climate, and cloud features depend on their respective services.

```bash
npm ci
cp .env.example .env
npm run dev
```

Open [localhost:3000](http://localhost:3000). Edit `.env` only for integrations you intend to use. Restart the development server after changing environment values.

```bash
npm run lint
npm test
npm run build
npm start
```

`lint` performs TypeScript checking. The tests cover quantities and costs, project validation and sharing, climate data completeness, requirements screening, and API behavior. The build creates the browser bundle and an Express server in `dist/`; `npm start` serves both the application and its API. Deploy the server with its runtime dependencies, build output, and environment configuration. A static-only host cannot serve the climate API without a separate backend.

## Environment configuration

`.env` and other local environment files are excluded by `.gitignore`; `.env.example` contains empty placeholders. Never put private server credentials in a `VITE_` variable: Vite includes those values in the browser bundle. Changes to browser variables require a new production build.

| Variable | Purpose |
| --- | --- |
| `PORT` | Express listening port; defaults to `3000`. |
| `VITE_GOOGLE_MAPS_API_KEY` | Public browser Maps key, restricted to intended website referrers and the Maps JavaScript API. |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Maps map ID used by the interactive map and advanced marker. |
| `OPEN_METEO_API_KEY` | Optional private server credential for Open-Meteo’s customer archive endpoint. |
| `VITE_FIREBASE_API_KEY` | Firebase browser project configuration. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID. |
| `VITE_FIREBASE_APP_ID` | Firebase app ID. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional Firebase storage configuration. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional Firebase messaging configuration. |
| `VITE_FIREBASE_DATABASE_ID` | Firestore database ID; defaults to `(default)`. |

The map requires both Maps variables. Coordinate entry remains available without them. Enable the Maps JavaScript API and configure the key and map ID in your Google Cloud project.

Without `OPEN_METEO_API_KEY`, climate requests use the public archive endpoint. Arrange the appropriate Open-Meteo plan and customer key for commercial deployment. The key is read only by the Express server. No Gemini key is required.

Firebase initialization is optional. Configure its authentication providers and authorized domains, create the Firestore database, and deploy the supplied `firestore.rules` before enabling cloud use. Browser Firebase configuration identifies the project; authentication, API restrictions, and Firestore rules control access. Cloud failure does not remove a successfully saved device copy.

## Estimation model

All saved schema-version-2 areas and product coverage values use square feet internally. Display conversion uses exactly `1 ft² = 0.09290304 m²`. Switching units changes presentation rather than rewriting or rounding the stored area. Costs are in USD; Metric mode does not change currency.

For plan area, surface area is `plan area × sqrt(1 + (pitch / 12)²)`. A measured surface area already includes slope and is not adjusted again. Waste is applied to the resulting surface area or a layer’s measured detail area. Packages are rounded up separately for each layer using verified net package coverage, with floating-point tolerance at exact package boundaries.

Detail products require an entered detail area. Adhesive interface products require coverage appropriate to the approved spacing. Published full-system coverage is not multiplied by a coat count; per-coat coverage can account for multiple coats. Supplier price overrides accept a legitimate zero price. Unknown price or coverage produces an incomplete estimate rather than a fabricated quantity or price.

Labor uses surface area before waste. Freight is a separate amount. The entered tax percentage applies to the material subtotal; jurisdiction-specific tax treatment is not inferred. Totals exclude unlisted items and costs. Fasteners, laps beyond the entered net coverage, primers, catalysts, attachment patterns, edge details, disposal, equipment, and installation labor must be included explicitly where applicable.

## Catalog and evidence

The catalog is a curated set of product variants, not a live mirror of [all SOPREMA roofing products](https://www.soprema.us/products/market-segment/roofing/all-roofing-products). `src/data.ts` contains product and data-sheet links, source dates, coverage assumptions, and evidence. Current selections include SOPRAVAP’R, SOPRA-ISO, SOPRA-ISO PLUS, SOPRABOARD, SOPRALENE variants, SENTINEL P150, ALSAN RS 230 FLASH, and DUOTACK 365.

Supplier prices are unknown until entered. Sample allowances are illustrative and require explicit opt-in. EPDs and HPDs are disclosures; they are not environmental certifications. Certification scope and expiry remain visible where documented. Legacy product IDs are retained for existing projects with unverified fields flagged; they are excluded from new catalog selection. Imported projects resolve products against the local catalog rather than trusting imported claims or links.

Refresh product records from manufacturer documents when products, formulations, or certifications change. Do not infer assembly approval from individual product availability or the order shown in the diagram.

## Location, climate, and requirements

The pin supplies coordinates for climate retrieval. Country and state are entered separately; the app does not infer a legal jurisdiction or an energy-code climate zone from the pin.

The climate service requests five complete calendar years of ERA5 daily minimum/maximum temperatures and precipitation. It reports coverage, freeze days, hot days, annual precipitation, and period extrema. These are preliminary screening statistics, not long-term climate normals, design wind speeds, snow loads, or drainage design values. Missing or failed provider data remains unknown. Candidate suggestions require further system review. See the [Open-Meteo historical weather API](https://open-meteo.com/en/docs/historical-weather-api) for the source and service terms.

Jurisdiction records currently cover Ohio references only. The review links to [Ohio’s roof assembly rule](https://codes.ohio.gov/ohio-administrative-code/rule-4101:1-15-01) and [DOE’s Ohio energy-code status](https://www.energycodes.gov/status/states/ohio). Other locations require verified source records. Municipality amendments, applicability, environmental restrictions, and permit dates are not automatically resolved.

Thermal, weight, and VOC checks compare sourced known values with criteria entered by the user. “Meets entered criterion” does not mean code compliance or engineering approval. Unknown weights do not count as zero structural load. The system does not certify wind uplift, fire performance, compatibility, moisture control, structural capacity, or an assembled roof’s environmental compliance.

## Saved projects and sharing

Named saves use browser `localStorage` under `soprema_projects`; the working copy uses `soprema_autosave`. Named saves contain parameters, layers, notes, and a data URI of the current SVG diagram for the Load preview. Saves remain on that browser and origin unless exported or synchronized to configured Firebase. Export JSON for a transferable backup; browser data can be cleared or reach its storage limit.

Schema-version-2 files preserve canonical areas. Older Metric projects are converted from their legacy area representation on import, then saved in the new schema. Imports validate numeric ranges, coordinates, product IDs, layer IDs, and size limits. Unsupported or corrupt data produces an error.

Share links contain the project configuration in the URL fragment, including notes and client details. Anyone who receives the link can read that information. The email button opens the user’s email application; it does not send mail. The PDF link reopens the shared configuration in the BOM view for download. It is not a permanently hosted PDF file or an email attachment. Long configurations may exceed practical email or QR limits; use JSON export when needed.

## Source layout

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Workspace navigation, dialogs, sharing, import, and autosave. |
| `src/components/Sidebar.tsx` | Project inputs, search, notes, product details, and comparison. |
| `src/components/Visualizer.tsx` | Layer order and visual controls. |
| `src/lib/diagram.ts` | Shared diagram and thumbnail generation. |
| `src/components/BOMExport.tsx` | Estimator inputs and bill of materials. |
| `src/lib/estimate.ts` | Quantity and cost calculations. |
| `src/lib/project.ts` | Schema validation, legacy migration, and share encoding. |
| `src/hooks/useProjectSync.ts` | Device saves and optional cloud synchronization. |
| `src/components/LocationPicker.tsx` | Map, coordinates, and climate results. |
| `src/components/CodeAnalysis.tsx` | Requirement review and material definitions. |
| `src/lib/requirements.ts` | Source-linked criteria and climate screening rules. |
| `src/data.ts` | Curated catalog and supporting evidence. |
| `server.ts` | Express API, climate provider requests, and application hosting. |
| `tests/` | Automated behavior checks. |

## Development and deployment notes

Run type checking, behavior tests, and a production build before publishing. Confirm external integrations with keys restricted to the deployed domain. Browser Maps, provider availability, Firebase permissions, and email handlers also need checks in the target deployment environment.

The climate endpoint includes coordinate validation, provider timeout handling, an in-memory cache, and a per-process request limit. Production infrastructure should supply HTTPS and any shared rate limiting needed across server instances. Decorative weather and the exploded diagram are presentation tools, not physical simulations or fabrication drawings.

### Verification limits

Automated checks run in `.github/workflows/checks.yml`. Google Maps and Firebase need a deployment check with configured credentials. The development browser available during implementation blocked local addresses, so interactive browser checks were not completed. PDF diagram rendering and multilingual canvas text should be checked in the target browser; ordinary PDF text, pagination, and product links were checked locally.
