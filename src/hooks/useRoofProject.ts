import { useState, useCallback, useEffect } from 'react';
import { RoofParams, Layer, SavedProject } from '../types';
import { SOPREMA_MATERIALS } from '../data';
import { toast } from 'sonner';

export function useRoofProject() {
  const [params, setParams] = useState<RoofParams>({
    area: 5000,
    pitch: 2,
    location: '',
    wasteFactor: 0.1,
    unitSystem: 'imperial'
  });
  const [layers, setLayers] = useState<Layer[]>([]);

  return {
    params, setParams,
    layers, setLayers
  };
}
