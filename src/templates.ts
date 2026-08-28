import { SavedProject } from './types';
import { SOPREMA_MATERIALS } from './data';
import { Layer, RoofParams } from './types';

function createLayer(materialName: string, order: number): Layer {
  const mat = SOPREMA_MATERIALS.find(m => m.name === materialName);
  if (!mat) throw new Error(`Material ${materialName} not found`);
  return { id: Math.random().toString(36).substr(2, 9), material: mat, order };
}

const defaultParams: RoofParams = {
  area: 10000,
  pitch: 2,
  location: '',
  wasteFactor: 0.1,
  unitSystem: 'imperial'
};

export const ROOF_TEMPLATES: SavedProject[] = [
  {
    id: 'tpl-1',
    name: 'Standard Commercial TPO System',
    date: new Date().toISOString(),
    thumbnail: '',
    params: { ...defaultParams },
    layers: [
      createLayer("SOPRAVAP'R", 0),
      createLayer("SOPRA-ISO® Polyiso Board", 1),
      createLayer("SOPRABOARD®", 2),
      createLayer("FLAGON® EP/PR (TPO)", 3)
    ]
  },
  {
    id: 'tpl-2',
    name: '2-Ply SBS Modified Bitumen',
    date: new Date().toISOString(),
    thumbnail: '',
    params: { ...defaultParams },
    layers: [
      createLayer("ELASTOCOL® 500 Primer", 0),
      createLayer("SOPRAVAP'R", 1),
      createLayer("SOPRA-ISO® PLUS", 2),
      createLayer("ELASTOPHENE® Base Sheet", 3),
      createLayer("SOPRALENE® FLAM 180 FR GR", 4)
    ]
  },
  {
    id: 'tpl-3',
    name: 'Liquid-Applied PMMA System',
    date: new Date().toISOString(),
    thumbnail: '',
    params: { ...defaultParams },
    layers: [
      createLayer("ALSAN® RS 222 PRIMER", 0),
      createLayer("SOPRABOARD®", 1),
      createLayer("ALSAN® RS 230 Field", 2)
    ]
  },
  {
    id: 'tpl-4',
    name: 'Vegetative / Green Roof Base',
    date: new Date().toISOString(),
    thumbnail: '',
    params: { ...defaultParams },
    layers: [
      createLayer("SOPRAVAP'R", 0),
      createLayer("SOPRA-XPS® 60", 1),
      createLayer("PROTECT'R®", 2),
      createLayer("ELASTOPHENE® 180 PS", 3),
      createLayer("SOPRANATURE® FLAM", 4)
    ]
  }
];
