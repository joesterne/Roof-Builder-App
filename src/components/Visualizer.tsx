import React, { useEffect, useState } from 'react';
import { motion, Reorder } from 'motion/react';
import { Layer } from '../types';
import { GripVertical, ZoomIn, ZoomOut } from 'lucide-react';

interface VisualizerProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
}

export default React.memo(function Visualizer({ layers, setLayers }: VisualizerProps) {
  // Local state for smooth framer-motion reordering
  const [items, setItems] = useState([...layers].sort((a, b) => a.order - b.order));
  const [zoom, setZoom] = useState(0.8);

  // Sync when props change from other tabs or sidebar
  useEffect(() => {
    setItems([...layers].sort((a, b) => a.order - b.order));
  }, [layers]);

  const handleReorder = (newItems: Layer[]) => {
    setItems(newItems);
    // Update global layers with new order
    const updatedLayers = newItems.map((item, index) => ({
      ...item,
      order: index
    }));
    setLayers(updatedLayers);
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2.0));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.4));

  return (
    <div id="visualizer-capture" className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-50 overflow-hidden relative border-b border-gray-200">
      
      {/* Drag and Drop Panel */}
      <div className="absolute left-6 top-6 w-72 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 flex flex-col z-10 max-h-[90%]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-soprema-black text-sm uppercase tracking-wide">Assembly Layers</h3>
          <p className="text-xs text-gray-500 mt-1">Drag to reorder layers (bottom to top)</p>
        </div>
        
        <div className="p-2 overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No layers added.</div>
          ) : (
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="flex flex-col gap-2">
              {items.map((layer) => (
                <Reorder.Item 
                  key={layer.id} 
                  value={layer}
                  className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-soprema-blue transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-soprema-blue uppercase tracking-wider">{layer.material.category}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{layer.material.name}</span>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>

      <div 
        className="relative ml-48 transition-transform duration-300 ease-out" 
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(60deg) rotateZ(-45deg) scale(${zoom})`,
          width: '300px',
          height: '300px',
        }}
      >
        {/* Base Roof Deck (Always present as visual base) */}
        <div 
          className="absolute w-full h-full bg-orange-100 border-2 border-orange-200 shadow-xl"
          style={{ transform: 'translateZ(-20px)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-30 text-orange-800 font-bold tracking-widest" style={{ transform: 'rotateZ(45deg)' }}>
            WOOD DECK
          </div>
        </div>

        {items.map((layer, index) => {
          // Calculate Z offset to stack them up based on current index
          const zOffset = (index + 1) * 40;
          
          return (
            <motion.div
              key={layer.id}
              initial={{ opacity: 0, z: zOffset + 200 }}
              animate={{ opacity: 1, z: zOffset }}
              exit={{ opacity: 0, z: zOffset + 200 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="absolute w-full h-full border border-white/20 shadow-lg flex items-center justify-center"
              style={{
                backgroundColor: layer.material.colorHex || '#ccc',
                opacity: 0.9,
              }}
            >
              <div 
                className="bg-white/80 px-2 py-1 rounded text-xs font-bold text-gray-800 backdrop-blur-sm pointer-events-none"
                style={{ transform: 'rotateZ(45deg) rotateX(-60deg)' }}
              >
                {layer.material.name}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-gray-200 flex items-center z-10 p-1">
        <button 
          onClick={handleZoomOut}
          disabled={zoom <= 0.4}
          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 disabled:opacity-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="w-12 text-center text-xs font-bold text-gray-600">
          {Math.round(zoom * 100)}%
        </span>
        <button 
          onClick={handleZoomIn}
          disabled={zoom >= 2.0}
          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 disabled:opacity-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Legend / Helper */}
      <div className="absolute bottom-4 right-4 bg-white/90 p-4 rounded-lg shadow-sm border border-gray-200 text-sm z-10">
        <h3 className="font-bold text-soprema-black mb-2">Assembly View</h3>
        <p className="text-gray-600 text-xs">Layers are stacked bottom to top.</p>
        <p className="text-gray-600 text-xs">Deck is shown as base reference.</p>
      </div>
    </div>
  );
});
