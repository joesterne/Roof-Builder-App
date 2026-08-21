import { Material } from './types';

export const SOPREMA_MATERIALS: Material[] = [
  // Vapor Barriers
  {
    id: 'vb-01',
    name: "SOPRAVAP'R",
    productUrl: 'https://soprema.us/products/sopravap-r',
    category: 'Vapor Barrier',
    description: 'Self-adhesive vapor barrier membrane composed of a tri-laminated woven polyethylene.',
    unit: 'Roll',
    coveragePerUnit: 400,
    pricePerUnit: 115.00,
    colorHex: '#60a5fa', // blue-400
    techSpecs: { Thickness: '31 mils', 'Permeance': '< 0.02 perm', 'Tensile Strength': '45 lbf/in' },
    certifications: ['FM Approved', 'UL Classified']
  },
  {
    id: 'vb-02',
    name: 'SOPRAVAP® STICK SARKING',
    productUrl: 'https://soprema.us/products/sopravap-stick-sarking',
    category: 'Vapor Barrier',
    description: 'Self-adhesive SBS elastomeric bitumen water vapour control layer.',
    unit: 'Roll',
    coveragePerUnit: 200,
    pricePerUnit: 125.00,
    colorHex: '#3b82f6', // blue-500
    techSpecs: { Thickness: '1.5 mm', 'Tensile Strength': '300 N/50mm', 'Elongation': '2%' },
    certifications: ['CE Marked', 'FM Approved']
  },
  {
    id: 'vb-03',
    name: 'ELASTOPHENE® SP 3.0',
    productUrl: 'https://soprema.us/products/elastophene-sp-3-0',
    category: 'Vapor Barrier',
    description: 'SBS-modified bitumen membrane with a glass mat reinforcement used as a vapor barrier.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 85.00,
    colorHex: '#1e3a8a', // blue-900
    techSpecs: { Thickness: '3.0 mm', 'Tensile Strength': '85 lbf/in', 'Tear Resistance': '110 lbf' },
    certifications: ['UL Classified', 'Miami-Dade NOA']
  },
  {
    id: 'vb-04',
    name: "SOPRAVAP'R LITE",
    productUrl: 'https://soprema.us/products/sopravap-r-lite',
    category: 'Vapor Barrier',
    description: 'Lightweight self-adhesive vapor barrier with an aluminum foil face.',
    unit: 'Roll',
    coveragePerUnit: 500,
    pricePerUnit: 105.00,
    colorHex: '#93c5fd', // blue-300
    techSpecs: { Thickness: '16 mils', 'Permeance': '< 0.01 perm', 'Elongation': '20%' },
    certifications: ['FM Approved']
  },

  // Insulation
  {
    id: 'in-01',
    name: 'SOPRA-ISO® Polyiso Board',
    productUrl: 'https://soprema.us/products/sopra-iso-polyiso-board',
    category: 'Insulation',
    description: 'Rigid thermal insulation board with closed-cell polyisocyanurate foam core.',
    unit: 'Board (4x8)',
    coveragePerUnit: 32,
    pricePerUnit: 45.00,
    colorHex: '#fef08a', // yellow-200
    techSpecs: { 'R-Value': '5.7 per inch', 'Compressive Strength': '20 psi', Thickness: '2.0 inch' },
    certifications: ['GREENGUARD', 'LEED Eligible']
  },
  {
    id: 'in-02',
    name: 'SOPRA-ISO® PLUS',
    productUrl: 'https://soprema.us/products/sopra-iso-plus',
    category: 'Insulation',
    description: 'Premium closed-cell polyisocyanurate foam core bonded to glass fiber-reinforced facers.',
    unit: 'Board (4x8)',
    coveragePerUnit: 32,
    pricePerUnit: 50.00,
    colorHex: '#facc15', // yellow-400
    techSpecs: { 'R-Value': '6.0 per inch', 'Compressive Strength': '25 psi', Thickness: '2.0 inch' },
    certifications: ['GREENGUARD', 'FM Approved', 'UL Classified']
  },
  {
    id: 'in-03',
    name: 'SOPRA-XPS® 20',
    productUrl: 'https://soprema.us/products/sopra-xps-20',
    category: 'Insulation',
    description: 'Extruded polystyrene (XPS) rigid foam insulation board, 20 psi.',
    unit: 'Board (4x8)',
    coveragePerUnit: 32,
    pricePerUnit: 52.00,
    colorHex: '#bfdbfe', // blue-200
    techSpecs: { 'R-Value': '5.0 per inch', 'Compressive Strength': '20 psi', 'Water Absorption': '< 0.3%' },
    certifications: ['Energy Star', 'LEED Eligible']
  },
  {
    id: 'in-04',
    name: 'SOPRA-XPS® 40',
    productUrl: 'https://soprema.us/products/sopra-xps-40',
    category: 'Insulation',
    description: 'High-density extruded polystyrene (XPS) rigid foam insulation board, 40 psi.',
    unit: 'Board (4x8)',
    coveragePerUnit: 32,
    pricePerUnit: 68.00,
    colorHex: '#60a5fa', // blue-400
    techSpecs: { 'R-Value': '5.0 per inch', 'Compressive Strength': '40 psi', 'Water Absorption': '< 0.3%' },
    certifications: ['Energy Star', 'LEED Eligible']
  },
  {
    id: 'in-05',
    name: 'SOPRA-XPS® 60',
    productUrl: 'https://soprema.us/products/sopra-xps-60',
    category: 'Insulation',
    description: 'Heavy-duty high-density extruded polystyrene (XPS), 60 psi for heavy traffic areas.',
    unit: 'Board (4x8)',
    coveragePerUnit: 32,
    pricePerUnit: 85.00,
    colorHex: '#3b82f6', // blue-500
    techSpecs: { 'R-Value': '5.0 per inch', 'Compressive Strength': '60 psi', 'Water Absorption': '< 0.3%' },
    certifications: ['Energy Star', 'LEED Eligible']
  },

  // Coverboards
  {
    id: 'cb-01',
    name: 'SOPRABOARD®',
    productUrl: 'https://soprema.us/products/sopraboard',
    category: 'Coverboard',
    description: 'Semi-rigid, asphaltic roofing substrate board.',
    unit: 'Board (4x4)',
    coveragePerUnit: 16,
    pricePerUnit: 22.00,
    colorHex: '#4b5563', // gray-600
    techSpecs: { Thickness: '1/8 inch', Weight: '1.2 lb/sq ft', 'Fire Rating': 'Class A' },
    certifications: ['UL Classified', 'FM Approved']
  },
  {
    id: 'cb-02',
    name: "PROTECT'R®",
    productUrl: 'https://soprema.us/products/protect-r',
    category: 'Coverboard',
    description: 'High-density polyisocyanurate coverboard for increased impact resistance.',
    unit: 'Board (4x8)',
    coveragePerUnit: 32,
    pricePerUnit: 35.00,
    colorHex: '#9ca3af', // gray-400
    techSpecs: { Thickness: '0.5 inch', 'Compressive Strength': '100 psi', 'R-Value': '2.5' },
    certifications: ['FM Approved', 'UL Class A']
  },
  {
    id: 'cb-03',
    name: 'SOPRA-CELLULOSE CB',
    productUrl: 'https://soprema.us/products/sopra-cellulose-cb',
    category: 'Coverboard',
    description: 'High-density cellulose fiber coverboard for acoustic dampening.',
    unit: 'Board (4x8)',
    coveragePerUnit: 32,
    pricePerUnit: 30.00,
    colorHex: '#6b7280', // gray-500
    techSpecs: { Thickness: '0.5 inch', 'Density': '18 lb/ft3', 'Acoustic Rating': 'STC 50+' },
    certifications: ['EcoLogo', 'FSC Certified']
  },

  // Base Plys
  {
    id: 'bp-01',
    name: 'ELASTOPHENE® Base Sheet',
    productUrl: 'https://soprema.us/products/elastophene-base-sheet',
    category: 'Base Ply',
    description: 'SBS-modified bitumen base ply membrane with a glass mat reinforcement.',
    unit: 'Roll',
    coveragePerUnit: 150,
    pricePerUnit: 85.00,
    colorHex: '#1f2937', // gray-800
    techSpecs: { Thickness: '2.2 mm', Reinforcement: 'Glass Mat', 'Tensile Strength': '85 lbf/in' },
    certifications: ['FM Approved', 'UL Classified']
  },
  {
    id: 'bp-02',
    name: 'SOPRALENE® FLAM 180',
    productUrl: 'https://soprema.us/products/sopralene-flam-180',
    category: 'Base Ply',
    description: 'SBS-modified bitumen membrane reinforced with non-woven polyester.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 95.00,
    colorHex: '#111827', // gray-900
    techSpecs: { Thickness: '3.0 mm', Reinforcement: 'Non-woven Polyester', 'Tensile Strength': '110 lbf/in' },
    certifications: ['FM Approved', 'Miami-Dade NOA']
  },
  {
    id: 'bp-03',
    name: 'ELASTOPHENE® 180 PS',
    productUrl: 'https://soprema.us/products/elastophene-180-ps',
    category: 'Base Ply',
    description: 'SBS-modified bitumen membrane, self-adhesive, with polyolephine film.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 105.00,
    colorHex: '#374151', // gray-700
    techSpecs: { Thickness: '3.0 mm', Reinforcement: 'Polyester', 'Application': 'Self-Adhered' },
    certifications: ['UL Classified', 'CRRC Listed']
  },
  {
    id: 'bp-04',
    name: 'COLPHENE® 3000',
    productUrl: 'https://soprema.us/products/colphene-3000',
    category: 'Base Ply',
    description: 'Self-adhesive SBS-modified waterproofing membrane for foundation and plaza decks.',
    unit: 'Roll',
    coveragePerUnit: 150,
    pricePerUnit: 135.00,
    colorHex: '#0f172a', // slate-900
    techSpecs: { Thickness: '60 mils', 'Tensile Strength': '40 lbf/in', 'Elongation': '200%' },
    certifications: ['ICC-ES Listed']
  },
  {
    id: 'bp-05',
    name: 'SOPRAFIX® BASE 611',
    productUrl: 'https://soprema.us/products/soprafix-base-611',
    category: 'Base Ply',
    description: 'Mechanically fastened SBS-modified bitumen base ply.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 90.00,
    colorHex: '#1e293b', // slate-800
    techSpecs: { Thickness: '3.0 mm', Reinforcement: 'Polyester/Glass Composite', 'Fastener Spacing': '12 inches' },
    certifications: ['FM 1-90', 'UL Classified']
  },

  // Cap Sheets
  {
    id: 'cs-01',
    name: 'SOPRALENE® FLAM 180 FR GR',
    productUrl: 'https://soprema.us/products/sopralene-flam-180-fr-gr',
    category: 'Cap Sheet',
    description: 'Fire retardant, granulated SBS-modified bitumen cap sheet.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 110.00,
    colorHex: '#f3f4f6', // Light gray with granules
    techSpecs: { Thickness: '4.0 mm', Surface: 'Ceramic Granules', 'Fire Resistance': 'Class A' },
    certifications: ['UL Class A', 'FM Approved', 'CRRC Listed']
  },
  {
    id: 'cs-02',
    name: 'SOPRALENE® FLAM 250 FR GR',
    productUrl: 'https://soprema.us/products/sopralene-flam-250-fr-gr',
    category: 'Cap Sheet',
    description: 'Heavy-duty fire retardant, granulated SBS-modified bitumen cap sheet for high traffic.',
    unit: 'Roll',
    coveragePerUnit: 75,
    pricePerUnit: 130.00,
    colorHex: '#e5e7eb', // gray-200
    techSpecs: { Thickness: '4.5 mm', 'Tear Resistance': '140 lbf', 'Fire Resistance': 'Class A' },
    certifications: ['UL Class A', 'FM Approved', 'Miami-Dade NOA']
  },
  {
    id: 'cs-03',
    name: 'ELASTOPHENE® FLAM FR GR',
    productUrl: 'https://soprema.us/products/elastophene-flam-fr-gr',
    category: 'Cap Sheet',
    description: 'SBS-modified bitumen cap sheet reinforced with a glass mat and covered in granules.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 95.00,
    colorHex: '#d1d5db', // gray-300
    techSpecs: { Thickness: '3.5 mm', Reinforcement: 'Glass Mat', 'Fire Resistance': 'Class A' },
    certifications: ['UL Class A', 'FM Approved']
  },
  {
    id: 'cs-04',
    name: 'SOPRASTAR® FLAM',
    productUrl: 'https://soprema.us/products/soprastar-flam',
    category: 'Cap Sheet',
    description: 'Highly reflective SBS-modified bitumen cap sheet with a brilliant white aluminum foil face.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 145.00,
    colorHex: '#ffffff', // white
    techSpecs: { Thickness: '3.0 mm', 'Solar Reflectance': '0.84', 'Thermal Emittance': '0.88' },
    certifications: ['Energy Star', 'CRRC Listed', 'LEED Eligible']
  },
  {
    id: 'cs-05',
    name: 'FLAGON® SR (PVC)',
    productUrl: 'https://soprema.us/products/flagon-sr-pvc',
    category: 'Cap Sheet',
    description: 'Synthetic single-ply PVC membrane, UV resistant.',
    unit: 'Roll',
    coveragePerUnit: 400,
    pricePerUnit: 320.00,
    colorHex: '#f8fafc', // slate-50
    techSpecs: { Thickness: '60 mil', 'Tear Resistance': '250 N', 'Solar Reflectance': '0.86' },
    certifications: ['Energy Star', 'CRRC Listed', 'LEED Eligible']
  },
  {
    id: 'cs-06',
    name: 'FLAGON® EP/PR (TPO)',
    productUrl: 'https://soprema.us/products/flagon-ep-pr-tpo',
    category: 'Cap Sheet',
    description: 'Synthetic single-ply TPO membrane, eco-friendly and highly reflective.',
    unit: 'Roll',
    coveragePerUnit: 400,
    pricePerUnit: 340.00,
    colorHex: '#f9fafb', // gray-50
    techSpecs: { Thickness: '60 mil', 'Elongation': '600%', 'Solar Reflectance': '0.88' },
    certifications: ['Energy Star', 'FM Approved']
  },
  {
    id: 'cs-07',
    name: 'ALSAN® RS 230 Field',
    productUrl: 'https://soprema.us/products/alsan-rs-230-field',
    category: 'Cap Sheet',
    description: 'Rapid-setting PMMA liquid-applied membrane.',
    unit: 'Pail (5 Gal)',
    coveragePerUnit: 50,
    pricePerUnit: 215.00,
    colorHex: '#cbd5e1', // slate-300
    techSpecs: { 'Cure Time': '2 Hours', 'Elongation': '250%', 'Tensile Strength': '3.5 MPa' },
    certifications: ['BBA Approved', 'FM Approved']
  },
  {
    id: 'cs-08',
    name: 'ALSAN® RS 280 Field',
    productUrl: 'https://soprema.us/products/alsan-rs-280-field',
    category: 'Cap Sheet',
    description: 'High-performance, rapid-setting PMMA liquid-applied membrane for extreme durability.',
    unit: 'Pail (5 Gal)',
    coveragePerUnit: 50,
    pricePerUnit: 245.00,
    colorHex: '#94a3b8', // slate-400
    techSpecs: { 'Cure Time': '1 Hour', 'Traffic': 'Heavy Pedestrian/Vehicular', 'Tensile Strength': '4.0 MPa' },
    certifications: ['FM Approved', 'UL Class A']
  },
  {
    id: 'cs-09',
    name: 'ALSAN® COATING SIL 402',
    productUrl: 'https://soprema.us/products/alsan-coating-sil-402',
    category: 'Cap Sheet',
    description: 'High solids silicone roof coating providing superior weatherproofing and UV protection.',
    unit: 'Pail (5 Gal)',
    coveragePerUnit: 250,
    pricePerUnit: 180.00,
    colorHex: '#ffffff', // white
    techSpecs: { 'Solids by Volume': '92%', 'Elongation': '200%', 'Solar Reflectance': '0.89' },
    certifications: ['Energy Star', 'CRRC Listed']
  },
  {
    id: 'cs-10',
    name: 'SOPRANATURE® FLAM',
    productUrl: 'https://soprema.us/products/sopranature-flam',
    category: 'Cap Sheet',
    description: 'Root-resistant SBS-modified bitumen cap sheet specifically designed for vegetative green roofs.',
    unit: 'Roll',
    coveragePerUnit: 100,
    pricePerUnit: 135.00,
    colorHex: '#a3e635', // lime-400
    techSpecs: { Thickness: '4.0 mm', 'Root Resistance': 'FLL Certified', 'Reinforcement': 'Polyester' },
    certifications: ['FLL Certified', 'FM Approved']
  },

  // Adhesives/Primers
  {
    id: 'ad-01',
    name: 'ELASTOCOL® 500 Primer',
    productUrl: 'https://soprema.us/products/elastocol-500-primer',
    category: 'Adhesive/Primer',
    description: 'Asphalt primer used to prepare surfaces before applying heat-welded membranes.',
    unit: 'Pail (5 Gal)',
    coveragePerUnit: 500,
    pricePerUnit: 75.00,
    colorHex: '#000000', // black
    techSpecs: { 'VOC Content': '< 350 g/L', 'Drying Time': '2-4 Hours', 'Solids by Weight': '45%' },
    certifications: ['SCAQMD Compliant']
  },
  {
    id: 'ad-02',
    name: 'ELASTOCOL® 350 Primer',
    productUrl: 'https://soprema.us/products/elastocol-350-primer',
    category: 'Adhesive/Primer',
    description: 'Premium elastomeric asphalt primer with quick drying time.',
    unit: 'Pail (5 Gal)',
    coveragePerUnit: 500,
    pricePerUnit: 85.00,
    colorHex: '#18181b', // zinc-900
    techSpecs: { 'VOC Content': '< 250 g/L', 'Drying Time': '1-2 Hours', 'Solids by Weight': '50%' },
    certifications: ['SCAQMD Compliant']
  },
  {
    id: 'ad-03',
    name: 'DUOTACK® Insulation Adhesive',
    productUrl: 'https://soprema.us/products/duotack-insulation-adhesive',
    category: 'Adhesive/Primer',
    description: 'Low-rise, two-component polyurethane adhesive for securing insulation and coverboards.',
    unit: 'Cartridge',
    coveragePerUnit: 200,
    pricePerUnit: 65.00,
    colorHex: '#fcd34d', // amber
    techSpecs: { 'Cure Time': '15-30 Minutes', 'Application Temp': '0°C to 35°C', 'VOC Content': '0 g/L' },
    certifications: ['GREENGUARD', 'Low VOC']
  },
  {
    id: 'ad-04',
    name: 'DUOTACK® 365',
    productUrl: 'https://soprema.us/products/duotack-365',
    category: 'Adhesive/Primer',
    description: 'All-weather, two-component polyurethane adhesive. Can be applied in freezing temperatures.',
    unit: 'Cartridge',
    coveragePerUnit: 200,
    pricePerUnit: 72.00,
    colorHex: '#fbbf24', // amber-400
    techSpecs: { 'Cure Time': '15-30 Minutes', 'Application Temp': '-10°C to 35°C', 'VOC Content': '0 g/L' },
    certifications: ['GREENGUARD Gold', 'Low VOC']
  },
  {
    id: 'ad-05',
    name: 'COLPLY® EF Adhesive',
    productUrl: 'https://soprema.us/products/colply-ef-adhesive',
    category: 'Adhesive/Primer',
    description: 'Polymeric roofing adhesive for SBS-modified bitumen membranes.',
    unit: 'Pail (5 Gal)',
    coveragePerUnit: 150,
    pricePerUnit: 110.00,
    colorHex: '#27272a', // zinc-800
    techSpecs: { 'Cure Time': '24-48 Hours', 'VOC Content': '< 250 g/L', 'Application': 'Squeegee or Trowel' },
    certifications: ['FM Approved']
  },
  {
    id: 'ad-06',
    name: 'ALSAN® RS 222 PRIMER',
    productUrl: 'https://soprema.us/products/alsan-rs-222-primer',
    category: 'Adhesive/Primer',
    description: 'Rapid-curing PMMA primer for asphalt and concrete surfaces.',
    unit: 'Pail (5 Gal)',
    coveragePerUnit: 250,
    pricePerUnit: 195.00,
    colorHex: '#e2e8f0', // slate-200
    techSpecs: { 'Cure Time': '30 Minutes', 'VOC Content': '< 100 g/L', 'Application Temp': '-5°C to 35°C' },
    certifications: ['Low VOC', 'BBA Approved']
  }
];
