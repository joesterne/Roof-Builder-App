import React, { useEffect, useState } from 'react';
import { motion, Reorder } from 'motion/react';
import { Layer, RoofParams } from '../types';
import { GripVertical, ZoomIn, ZoomOut, Trash2, ExternalLink, Info, CloudRain, Snowflake } from 'lucide-react';
import WeatherOverlay from './WeatherOverlay';
import { isValidOrder } from '../utils';
import { toast } from 'sonner';

interface VisualizerProps {
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  params: RoofParams;
}

export default React.memo(function Visualizer({ layers, setLayers, params }: VisualizerProps) {
  // Local state for smooth framer-motion reordering
  const [items, setItems] = useState([...layers].sort((a, b) => a.order - b.order));
  const [zoom, setZoom] = useState(0.8);

  const [hoveredLayer, setHoveredLayer] = useState<Layer | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showWeatherControls, setShowWeatherControls] = useState(false);
  const [weatherDisplayEnabled, setWeatherDisplayEnabled] = useState(false);
  const [weatherType, setWeatherType] = useState<'rain' | 'snow'>('rain');
  const [weatherIntensity, setWeatherIntensity] = useState(50);

  // Sync when props change from other tabs or sidebar
  useEffect(() => {
    setItems([...layers].sort((a, b) => a.order - b.order));
  }, [layers]);

  const handleReorder = (newItems: Layer[]) => {
    if (!isValidOrder(newItems)) {
      toast.error('Invalid layer order. Please follow standard assembly hierarchy.');
      // Revert to current valid order
      setItems([...layers].sort((a, b) => a.order - b.order));
      return;
    }

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

  const getEstimatedWeightPerSqFt = (category: string) => {
    switch (category) {
      case 'Vapor Barrier': return 0.1;
      case 'Insulation': return 0.2;
      case 'Coverboard': return 0.5;
      case 'Base Ply': return 0.7;
      case 'Cap Sheet': return 1.0;
      case 'Adhesive/Primer': return 0.05;
      default: return 0.5;
    }
  };

  const totalWeightPerSqFt = items.reduce((acc, layer) => acc + getEstimatedWeightPerSqFt(layer.material.category), 0);
  const totalWeight = totalWeightPerSqFt * params.area;

  return (
    <div id="visualizer-capture" className="w-full h-full min-h-[400px] flex items-center justify-center bg-bg-panel-hover overflow-hidden relative border-b border-border-main" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
      
      {weatherDisplayEnabled && <WeatherOverlay type={weatherType} intensity={weatherIntensity} />}
      
      {/* Drag and Drop Panel */}
      <div className="absolute left-6 top-6 w-72 bg-bg-panel/90 backdrop-blur-md rounded-xl shadow-lg border border-border-main flex flex-col z-10 max-h-[90%]">
        <div className="p-4 border-b border-border-main">
          <h3 className="font-bold text-soprema-black text-sm uppercase tracking-wide">Assembly Layers</h3>
          <p className="text-xs text-text-muted mt-1">Drag to reorder layers (bottom to top)</p>
        </div>
        
        <div className="p-2 overflow-y-auto flex-1">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-text-muted text-center">No layers added.</div>
          ) : (
            <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="flex flex-col gap-2">
              {items.map((layer) => (
                <Reorder.Item 
                  key={layer.id} 
                  value={layer}
                  className="bg-bg-panel border border-border-main rounded-lg p-3 flex items-center gap-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-soprema-blue transition-colors group"
                  onMouseMove={(e) => {
                    setHoveredLayer(layer);
                    setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredLayer(null)}
                >
                  <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-soprema-blue uppercase tracking-wider">{layer.material.category}</span>
                    <span className="text-sm font-medium text-text-main truncate">{layer.material.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {layer.material.productUrl && (
                      <a 
                        href={layer.material.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 text-gray-400 hover:text-soprema-blue hover:bg-blue-50 rounded transition-colors"
                        title="View product on Soprema website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLayers(prev => {
                          const filtered = prev.filter(l => l.id !== layer.id);
                          return filtered.map((l, i) => ({ ...l, order: i }));
                        });
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                      title="Remove layer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                className="bg-bg-panel/80 px-2 py-1 rounded text-xs font-bold text-text-main backdrop-blur-sm pointer-events-none"
                style={{ transform: 'rotateZ(45deg) rotateX(-60deg)' }}
              >
                {layer.material.name}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Weather Controls */}
      <div className="absolute top-20 right-6 bg-bg-panel/90 backdrop-blur-md rounded-lg shadow-sm border border-border-main z-10 p-4 w-72">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-soprema-black text-sm uppercase tracking-wide flex items-center gap-2">
            {weatherType === 'rain' ? <CloudRain className="w-4 h-4 text-soprema-blue" /> : <Snowflake className="w-4 h-4 text-blue-300" />}
            Weather Simulation
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={showWeatherControls} onChange={(e) => setShowWeatherControls(e.target.checked)} />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-soprema-blue"></div>
          </label>
        </div>
        
        {showWeatherControls && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-md">
              <button
                onClick={() => setWeatherType('rain')}
                className={`flex-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${weatherType === 'rain' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Rain
              </button>
              <button
                onClick={() => setWeatherType('snow')}
                className={`flex-1 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors ${weatherType === 'snow' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Snow
              </button>
            </div>
            
            <div>
              <div className="flex justify-between text-xs text-text-muted font-medium mb-1">
                <span>Intensity</span>
                <span>{weatherIntensity}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={weatherIntensity}
                onChange={(e) => setWeatherIntensity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-soprema-blue dark:bg-gray-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Visualizer Header Toolbar */}
      <div className="absolute top-6 right-6 bg-bg-panel/90 backdrop-blur-md rounded-lg shadow-sm border border-border-main flex items-center z-10 p-1">
        <button 
          onClick={() => setWeatherDisplayEnabled(!weatherDisplayEnabled)}
          className={`p-1.5 rounded-md transition-colors flex items-center gap-1.5 px-2 text-xs font-bold uppercase tracking-wider ${weatherDisplayEnabled ? 'bg-soprema-blue text-white' : 'text-text-secondary hover:bg-bg-page'}`}
          title="Toggle Weather Display"
        >
          {weatherType === 'rain' ? <CloudRain className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
          Weather
        </button>
        <div className="w-px h-5 bg-border-main mx-1"></div>
        <button 
          onClick={handleZoomOut}
          disabled={zoom <= 0.4}
          className="p-1.5 hover:bg-bg-page rounded-md text-text-secondary disabled:opacity-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="w-12 text-center text-xs font-bold text-text-muted">
          {Math.round(zoom * 100)}%
        </span>
        <button 
          onClick={handleZoomIn}
          disabled={zoom >= 2.0}
          className="p-1.5 hover:bg-bg-page rounded-md text-text-secondary disabled:opacity-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Legend / Helper */}
      <div className="absolute bottom-4 right-4 bg-bg-panel/90 p-4 rounded-lg shadow-sm border border-border-main text-sm z-10">
        <h3 className="font-bold text-soprema-black mb-2">Assembly View</h3>
        <p className="text-text-muted text-xs">Layers are stacked bottom to top.</p>
        <p className="text-text-muted text-xs">Deck is shown as base reference.</p>
      </div>

      {/* Summary Card */}
      <div className="absolute bottom-4 left-6 bg-bg-panel/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-border-main z-10 w-72">
        <h3 className="font-bold text-soprema-black text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-soprema-blue" /> Project Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted font-medium">Total Area</span>
            <span className="text-sm font-bold text-text-main">{params.area.toLocaleString()} sq ft</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted font-medium">System Layers</span>
            <span className="text-sm font-bold text-text-main">{items.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted font-medium">Estimated Weight</span>
            <span className="text-sm font-bold text-text-main">{totalWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs</span>
          </div>
        </div>
      </div>
      {/* Hover Tooltip Portal */}
      {hoveredLayer && (
        <div 
          className="fixed z-[100] w-72 bg-soprema-black text-white text-xs rounded-md p-3 shadow-xl pointer-events-none"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y + 15 > window.innerHeight - 150 ? mousePos.y - 120 : mousePos.y + 15 
          }}
        >
          <p className="font-bold text-sm mb-1">{hoveredLayer.material.name}</p>
          <p className="text-gray-300 mb-2 leading-relaxed">{hoveredLayer.material.description}</p>
          
          <div className="text-gray-300 space-y-1 mt-2 border-t border-gray-700 pt-2">
            {hoveredLayer.material.techSpecs && Object.keys(hoveredLayer.material.techSpecs).length > 0 ? (
              Object.entries(hoveredLayer.material.techSpecs).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{k}:</span>
                  <span className="font-medium text-white">{v}</span>
                </div>
              ))
            ) : (
              <p className="italic text-text-muted">No tech specs available</p>
            )}
            
            {hoveredLayer.material.certifications && hoveredLayer.material.certifications.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-gray-400 block mb-1">Certifications:</span>
                <div className="flex flex-wrap gap-1">
                  {hoveredLayer.material.certifications.map(c => (
                    <span key={c} className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
