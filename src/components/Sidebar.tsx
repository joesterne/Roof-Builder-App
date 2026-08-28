import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Reorder } from 'motion/react';
import { RoofParams, Layer, Category, Material } from '../types';
import { SOPREMA_MATERIALS } from '../data';
import { Plus, Trash2, Settings, List, MapPin, Search, X, ExternalLink, ChevronUp, ChevronDown, GripVertical, Calculator } from 'lucide-react';
import ProjectStatistics from './ProjectStatistics';
import LocationPicker from './LocationPicker';
import { getCategoryPriority, parseThickness, parseRValue } from '../utils';

interface SidebarProps {
  params: RoofParams;
  setParams: (params: RoofParams) => void;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
}

const CATEGORIES: Category[] = [
  'Adhesive/Primer',
  'Vapor Barrier',
  'Insulation',
  'Coverboard',
  'Base Ply',
  'Cap Sheet'
];

// Memoize the Sidebar component to prevent re-renders when activeTab changes in App.tsx
export default React.memo(function Sidebar({ params, setParams, layers, setLayers }: SidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('Cap Sheet');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredMaterial, setHoveredMaterial] = useState<Material | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [compareList, setCompareList] = useState<Material[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const [localLayers, setLocalLayers] = useState([...layers].sort((a, b) => a.order - b.order));

  useEffect(() => {
    setLocalLayers([...layers].sort((a, b) => a.order - b.order));
  }, [layers]);

  const handleReorder = useCallback((newItems: Layer[]) => {
    setLocalLayers(newItems);
    setLayers(newItems.map((item, index) => ({
      ...item,
      order: index
    })));
  }, [setLayers]);

  const filteredMaterials = useMemo(() => {
    return SOPREMA_MATERIALS.filter(m => {
      const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const addLayer = useCallback((material: Material) => {
    setLayers(prev => {
      const priority = getCategoryPriority(material.category);
      
      // If it's an adhesive/primer, or if there are no layers, append to top
      if (priority === -1 || prev.length === 0) {
        return [...prev, { id: Math.random().toString(36).substr(2, 9), material, order: prev.length }];
      }
      
      // Find the right insertion index from top to bottom
      let insertIndex = prev.length;
      for (let i = prev.length - 1; i >= 0; i--) {
         const p = getCategoryPriority(prev[i].material.category);
         if (p !== -1 && p > priority) {
           insertIndex = i;
         } else if (p !== -1 && p <= priority) {
           break;
         }
      }
      
      const newLayers = [...prev];
      newLayers.splice(insertIndex, 0, { id: Math.random().toString(36).substr(2, 9), material, order: 0 });
      
      // re-assign order
      return newLayers.map((l, idx) => ({ ...l, order: idx }));
    });
  }, [setLayers]);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== id);
      return filtered.map((l, i) => ({ ...l, order: i }));
    });
  }, [setLayers]);

  const moveLayer = useCallback((index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === layers.length - 1)) return;
    
    setLayers(prev => {
      const newLayers = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newLayers[index];
      newLayers[index] = newLayers[swapIndex];
      newLayers[swapIndex] = temp;
      
      // Update order
      return newLayers.map((l, i) => ({ ...l, order: i }));
    });
  }, [layers.length, setLayers]);

  const stats = useMemo(() => {
    let totalThickness = 0;
    let totalRValue = 0;
    let totalCostPerSqFt = 0;
    let rValueLayerCount = 0;

    const categoryDataMap: Record<string, { name: string, value: number, cost: number, color: string }> = {};

    layers.forEach(layer => {
      const thickness = parseThickness(layer.material.techSpecs?.Thickness);
      totalThickness += thickness;
      
      const rValueStr = layer.material.techSpecs?.['R-Value'];
      if (rValueStr) {
        const rValue = parseRValue(rValueStr, thickness);
        totalRValue += rValue;
        rValueLayerCount += 1;
      }

      let layerCost = 0;
      if (layer.material.coveragePerUnit > 0) {
        layerCost = layer.material.pricePerUnit / layer.material.coveragePerUnit;
        totalCostPerSqFt += layerCost;
      }

      const cat = layer.material.category;
      if (!categoryDataMap[cat]) {
        categoryDataMap[cat] = {
           name: cat,
           value: 0,
           cost: 0,
           color: layer.material.colorHex || '#9ca3af'
        };
      }
      categoryDataMap[cat].value += 1; // Count ratio
      categoryDataMap[cat].cost += layerCost; // Cost ratio
    });

    const avgRValue = rValueLayerCount > 0 ? (totalRValue / rValueLayerCount) : 0;
    
    // Sort by cost for a consistent chart display
    const compositionData = Object.values(categoryDataMap).sort((a, b) => b.cost - a.cost);

    return { totalThickness, avgRValue, totalCostPerSqFt, compositionData };
  }, [layers]);

  return (
    <div className="w-80 bg-bg-panel border-r border-border-main h-full flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-border-main">
        <h2 className="text-lg font-bold text-soprema-black flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-soprema-blue" />
          Project Parameters
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-text-secondary">
                Roof Size ({params.unitSystem === 'metric' ? 'Sq M' : 'Sq Ft'})
              </label>
              <button 
                onClick={() => {
                  if (params.unitSystem === 'imperial') {
                    setParams({ ...params, unitSystem: 'metric', area: Math.round(params.area * 0.092903) });
                  } else {
                    setParams({ ...params, unitSystem: 'imperial', area: Math.round(params.area * 10.7639) });
                  }
                }}
                className="text-xs bg-bg-panel hover:bg-bg-panel-hover border border-border-main px-2 py-0.5 rounded text-text-muted hover:text-text-main transition-colors"
                title="Toggle unit system"
              >
                Switch to {params.unitSystem === 'imperial' ? 'Metric' : 'Imperial'}
              </button>
            </div>
            <input 
              type="number" 
              value={params.area || ''}
              onChange={e => setParams({ ...params, area: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soprema-blue"
              placeholder="e.g. 5000"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Pitch (x/12)</label>
              <input 
                type="number" 
                value={params.pitch || ''}
                onChange={e => setParams({ ...params, pitch: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soprema-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Waste Factor (%)</label>
              <input 
                type="number" 
                value={params.wasteFactor * 100}
                onChange={e => setParams({ ...params, wasteFactor: Number(e.target.value) / 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soprema-blue"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-text-muted" /> Project Location
            </label>
            <LocationPicker 
              onLocationSelect={(lat, lng) => {
                setParams({ ...params, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, coordinates: { lat, lng } });
              }} 
            />
          </div>
        </div>
      </div>

      <ProjectStatistics stats={stats} unitSystem={params.unitSystem} />

      <div className="p-6 flex-1 flex flex-col">
        <h2 className="text-lg font-bold text-soprema-black flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-soprema-blue" />
          Build Assembly
        </h2>

        {/* Current Layers */}
        <div className="space-y-2 mb-6">
          {localLayers.length === 0 ? (
            <p className="text-sm text-text-muted italic">No layers added yet. Start building your assembly below.</p>
          ) : (
            <Reorder.Group axis="y" values={localLayers} onReorder={handleReorder} className="flex flex-col gap-2">
              {localLayers.map((layer, index) => (
                <Reorder.Item 
                  key={layer.id}
                  value={layer}
                  className="flex items-center justify-between bg-bg-panel p-3 rounded-md border border-border-main shadow-sm cursor-grab active:cursor-grabbing group hover:border-soprema-blue transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-gray-400 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-soprema-blue uppercase tracking-wider truncate">{layer.material.category}</span>
                      <span className="text-sm font-medium text-text-main truncate">{layer.material.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col gap-0.5">
                      <button 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={() => moveLayer(index, 'up')} 
                        disabled={index === 0} 
                        className="text-gray-400 hover:text-soprema-blue disabled:opacity-30 disabled:hover:text-gray-400 transition-colors p-0.5 bg-bg-panel-hover hover:bg-blue-50 rounded"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onPointerDown={(e) => e.stopPropagation()} 
                        onClick={() => moveLayer(index, 'down')} 
                        disabled={index === localLayers.length - 1} 
                        className="text-gray-400 hover:text-soprema-blue disabled:opacity-30 disabled:hover:text-gray-400 transition-colors p-0.5 bg-bg-panel-hover hover:bg-blue-50 rounded"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button 
                      onPointerDown={(e) => e.stopPropagation()} 
                      onClick={() => removeLayer(layer.id)} 
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                      title="Remove Layer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>

        {/* Add Material */}
        <div className="mt-auto pt-4 border-t border-border-main">
          <label className="block text-sm font-medium text-text-secondary mb-2">Add Material</label>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soprema-blue text-sm"
            />
          </div>

          <select 
            className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-soprema-blue text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as Category | 'All')}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredMaterials.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-2">No materials found.</p>
            ) : (
              filteredMaterials.map(material => {
                const isComparing = compareList.some(m => m.id === material.id);
                return (
                  <div
                    key={material.id}
                    className="w-full flex justify-between items-center px-3 py-2 border border-border-main rounded-md hover:border-soprema-blue hover:bg-blue-50 transition-colors group"
                    onMouseMove={(e) => {
                      setHoveredMaterial(material);
                      setMousePos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredMaterial(null)}
                  >
                    <div className="flex flex-col flex-1 cursor-pointer" onClick={() => addLayer(material)}>
                      <span className="text-sm font-medium text-text-main">{material.name}</span>
                      <span className="text-xs text-text-muted">${material.pricePerUnit.toFixed(2)} / {material.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {material.productUrl && (
                        <a 
                          href={material.productUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-soprema-blue transition-colors"
                          title="View product on Soprema website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <input 
                        type="checkbox"
                        checked={isComparing}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (compareList.length < 2) {
                              setCompareList([...compareList, material]);
                            }
                          } else {
                            setCompareList(compareList.filter(m => m.id !== material.id));
                          }
                        }}
                        className="w-4 h-4 text-soprema-blue border-gray-300 rounded focus:ring-soprema-blue cursor-pointer"
                        title={isComparing ? "Remove from comparison" : "Add to comparison (Max 2)"}
                      />
                      <button onClick={() => addLayer(material)} className="p-1 rounded hover:bg-blue-100 text-soprema-blue opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {compareList.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
              <span className="text-xs font-medium text-soprema-blue">{compareList.length} / 2 selected for comparison</span>
              <button 
                onClick={() => setShowCompareModal(true)}
                disabled={compareList.length < 2}
                className="text-xs bg-soprema-blue text-white px-2 py-1 rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
              >
                Compare
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hover Tooltip Portal */}
      {hoveredMaterial && !showCompareModal && (
        <div 
          className="fixed z-[100] w-64 bg-soprema-black text-white text-xs rounded-md p-3 shadow-xl pointer-events-none"
          style={{ 
            left: mousePos.x + 15, 
            top: mousePos.y + 15 > window.innerHeight - 120 ? mousePos.y - 100 : mousePos.y + 15 
          }}
        >
          <p className="font-bold text-sm mb-1">{hoveredMaterial.name}</p>
          <p className="text-gray-300 mb-2 leading-relaxed">{hoveredMaterial.description}</p>
          <div className="flex justify-between items-center text-gray-400 border-t border-gray-700 pt-2 mt-2">
            <span>Coverage:</span>
            <span className="font-medium text-white">
              {params.unitSystem === 'metric' 
                ? `${(hoveredMaterial.coveragePerUnit * 0.092903).toFixed(1)} sq m` 
                : `${hoveredMaterial.coveragePerUnit} sq ft`} / {hoveredMaterial.unit}
            </span>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showCompareModal && compareList.length === 2 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-bg-panel rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-panel-hover">
              <h3 className="text-lg font-bold text-soprema-black">Product Comparison</h3>
              <button onClick={() => setShowCompareModal(false)} className="text-text-muted hover:text-text-main p-1 rounded-md hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-8">
                {/* Product 1 */}
                <div className="flex flex-col">
                  <div className="mb-4">
                    <span className="text-xs font-bold text-soprema-blue uppercase tracking-wider">{compareList[0].category}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <h4 className="text-xl font-bold text-text-main">{compareList[0].name}</h4>
                      {compareList[0].productUrl && (
                        <a href={compareList[0].productUrl} target="_blank" rel="noopener noreferrer" className="text-soprema-blue hover:text-blue-700 bg-blue-50 p-1 rounded transition-colors" title="View product page">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mt-2">{compareList[0].description}</p>
                  </div>
                  
                  <div className="bg-bg-panel-hover p-4 rounded-md border border-border-main mb-6">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border-main">
                      <span className="text-sm font-medium text-text-secondary">Price</span>
                      <span className="text-sm font-bold text-text-main">${compareList[0].pricePerUnit.toFixed(2)} / {compareList[0].unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-text-secondary">Coverage</span>
                      <span className="text-sm font-bold text-text-main">
                        {params.unitSystem === 'metric' 
                          ? `${(compareList[0].coveragePerUnit * 0.092903).toFixed(1)} sq m` 
                          : `${compareList[0].coveragePerUnit} sq ft`} / {compareList[0].unit}
                      </span>
                    </div>
                  </div>

                  <h5 className="font-semibold text-text-main mb-3 border-b border-border-main pb-1">Technical Specifications</h5>
                  <div className="space-y-2 mb-6">
                    {compareList[0].techSpecs ? Object.entries(compareList[0].techSpecs).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-text-muted">{key}:</span>
                        <span className="font-medium text-text-main">{val}</span>
                      </div>
                    )) : <p className="text-sm text-text-muted italic">No technical specs available.</p>}
                  </div>

                  <h5 className="font-semibold text-text-main mb-3 border-b border-border-main pb-1">Certifications</h5>
                  <div className="flex flex-wrap gap-2">
                    {compareList[0].certifications ? compareList[0].certifications.map(cert => (
                      <span key={cert} className="px-2 py-1 bg-blue-50 text-soprema-blue text-xs font-medium rounded border border-blue-100">
                        {cert}
                      </span>
                    )) : <span className="text-sm text-text-muted italic">None</span>}
                  </div>
                </div>

                {/* Product 2 */}
                <div className="flex flex-col">
                  <div className="mb-4">
                    <span className="text-xs font-bold text-soprema-blue uppercase tracking-wider">{compareList[1].category}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <h4 className="text-xl font-bold text-text-main">{compareList[1].name}</h4>
                      {compareList[1].productUrl && (
                        <a href={compareList[1].productUrl} target="_blank" rel="noopener noreferrer" className="text-soprema-blue hover:text-blue-700 bg-blue-50 p-1 rounded transition-colors" title="View product page">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-text-muted mt-2">{compareList[1].description}</p>
                  </div>
                  
                  <div className="bg-bg-panel-hover p-4 rounded-md border border-border-main mb-6">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-border-main">
                      <span className="text-sm font-medium text-text-secondary">Price</span>
                      <span className="text-sm font-bold text-text-main">${compareList[1].pricePerUnit.toFixed(2)} / {compareList[1].unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-text-secondary">Coverage</span>
                      <span className="text-sm font-bold text-text-main">
                        {params.unitSystem === 'metric' 
                          ? `${(compareList[1].coveragePerUnit * 0.092903).toFixed(1)} sq m` 
                          : `${compareList[1].coveragePerUnit} sq ft`} / {compareList[1].unit}
                      </span>
                    </div>
                  </div>

                  <h5 className="font-semibold text-text-main mb-3 border-b border-border-main pb-1">Technical Specifications</h5>
                  <div className="space-y-2 mb-6">
                    {compareList[1].techSpecs ? Object.entries(compareList[1].techSpecs).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-text-muted">{key}:</span>
                        <span className="font-medium text-text-main">{val}</span>
                      </div>
                    )) : <p className="text-sm text-text-muted italic">No technical specs available.</p>}
                  </div>

                  <h5 className="font-semibold text-text-main mb-3 border-b border-border-main pb-1">Certifications</h5>
                  <div className="flex flex-wrap gap-2">
                    {compareList[1].certifications ? compareList[1].certifications.map(cert => (
                      <span key={cert} className="px-2 py-1 bg-blue-50 text-soprema-blue text-xs font-medium rounded border border-blue-100">
                        {cert}
                      </span>
                    )) : <span className="text-sm text-text-muted italic">None</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
