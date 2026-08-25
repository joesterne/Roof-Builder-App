import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Visualizer from './components/Visualizer';
import BOMExport from './components/BOMExport';
import CodeAnalysis from './components/CodeAnalysis';
import { RoofParams, Layer } from './types';
import { Layers, FileText, ShieldAlert, Save, FolderOpen, RotateCcw, AlertTriangle, Share, X, Download } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import html2canvas from 'html2canvas';
import { SOPREMA_MATERIALS } from './data';

interface SavedProject {
  id: string;
  name: string;
  date: string;
  params: RoofParams;
  layers: Layer[];
  thumbnail: string;
}

// Security: Helper to sanitize and re-hydrate project data to prevent XSS and prototype pollution
function sanitizeProjectData(decoded: any): { params: RoofParams, layers: Layer[] } | null {
  if (!decoded || !decoded.params || !Array.isArray(decoded.layers)) {
    return null;
  }

  const safeParams: RoofParams = {
    area: typeof decoded.params.area === 'number' ? decoded.params.area : 5000,
    pitch: typeof decoded.params.pitch === 'number' ? decoded.params.pitch : 2,
    location: typeof decoded.params.location === 'string' ? decoded.params.location.slice(0, 100) : '',
    wasteFactor: typeof decoded.params.wasteFactor === 'number' ? decoded.params.wasteFactor : 0.1,
    unitSystem: decoded.params.unitSystem === 'metric' ? 'metric' : 'imperial',
    projectNotes: typeof decoded.params.projectNotes === 'string' ? decoded.params.projectNotes.slice(0, 500) : undefined,
    coordinates: decoded.params.coordinates && typeof decoded.params.coordinates.lat === 'number' && typeof decoded.params.coordinates.lng === 'number' 
      ? { lat: decoded.params.coordinates.lat, lng: decoded.params.coordinates.lng } 
      : undefined,
    climateData: decoded.params.climateData && typeof decoded.params.climateData.temperature === 'number' && typeof decoded.params.climateData.conditions === 'string'
      ? { temperature: decoded.params.climateData.temperature, conditions: String(decoded.params.climateData.conditions).slice(0, 50) }
      : undefined
  };

  const safeLayers: Layer[] = [];
  decoded.layers.forEach((layer: any) => {
    if (layer && layer.material && typeof layer.material.id === 'string') {
      const knownMaterial = SOPREMA_MATERIALS.find(m => m.id === layer.material.id);
      if (knownMaterial) {
        safeLayers.push({
          id: typeof layer.id === 'string' ? layer.id : Math.random().toString(),
          material: knownMaterial,
          order: typeof layer.order === 'number' ? layer.order : safeLayers.length
        });
      }
    }
  });

  return { params: safeParams, layers: safeLayers };
}

export default function App() {
  const [params, setParams] = useState<RoofParams>({
    area: 5000,
    pitch: 2,
    location: '',
    wasteFactor: 0.1,
    unitSystem: 'imperial',
  });

  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'bom' | 'code'>('visualizer');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest');

  const paramsRef = useRef(params);
  const layersRef = useRef(layers);

  useEffect(() => {
    paramsRef.current = params;
    layersRef.current = layers;
  }, [params, layers]);

  // Auto-save effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (layersRef.current.length > 0) {
        const data = {
          params: paramsRef.current,
          layers: layersRef.current,
          timestamp: Date.now()
        };
        localStorage.setItem('soprema_autosave', JSON.stringify(data));
      }
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load shared state from URL on mount
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const stateParam = query.get('state');
    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(stateParam)));
        const sanitized = sanitizeProjectData(decoded);
        if (sanitized) {
          setParams(sanitized.params);
          setLayers(sanitized.layers);
          setStatusMessage('Shared project loaded!');
          setTimeout(() => setStatusMessage(''), 3000);
        }
      } catch (e) {
        console.error('Failed to parse shared state from URL', e);
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Try to load autosave
      const autosaveStr = localStorage.getItem('soprema_autosave');
      if (autosaveStr) {
        try {
          const parsed = JSON.parse(autosaveStr);
          const sanitized = sanitizeProjectData(parsed);
          if (sanitized && sanitized.layers.length > 0) {
            setParams(sanitized.params);
            setLayers(sanitized.layers);
            setStatusMessage('Autosave recovered');
            setTimeout(() => setStatusMessage(''), 3000);
          }
        } catch (e) {
          console.error('Failed to parse autosave', e);
        }
      }
    }
  }, []);

  const confirmReset = useCallback(() => {
    setLayers([]);
    setParams({
      area: 5000,
      pitch: 2,
      location: '',
      wasteFactor: 0.1,
      unitSystem: 'imperial',
      projectNotes: ''
    });
    localStorage.removeItem('soprema_autosave');
    setShowResetConfirm(false);
    setStatusMessage('Workspace Reset');
    setTimeout(() => setStatusMessage(''), 2000);
  }, []);

  const toggleUnitSystem = useCallback(() => {
    setParams(prev => {
      if (prev.unitSystem === 'imperial') {
        // Imperial (Sq Ft) to Metric (Sq M): multiply by 0.092903
        return { ...prev, unitSystem: 'metric', area: Math.round(prev.area * 0.092903) };
      } else {
        // Metric (Sq M) to Imperial (Sq Ft): multiply by 10.7639
        return { ...prev, unitSystem: 'imperial', area: Math.round(prev.area * 10.7639) };
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    const name = prompt('Enter a name for this configuration:', 'My Roof Config');
    if (!name) return;

    let thumbnail = '';
    const visualizerEl = document.getElementById('visualizer-capture');
    
    if (visualizerEl) {
      const toastId = toast.loading('Capturing visualizer preview...');
      try {
        const canvas = await html2canvas(visualizerEl, { scale: 0.5 });
        thumbnail = canvas.toDataURL('image/jpeg', 0.6);
        toast.dismiss(toastId);
      } catch (e) {
        console.error('Failed to capture thumbnail', e);
        toast.dismiss(toastId);
      }
    }

    const newProject: SavedProject = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString(),
      params,
      layers,
      thumbnail
    };

    const existingStr = localStorage.getItem('soprema_projects');
    const existing: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Check old save format for backward compatibility
    const oldSave = localStorage.getItem('soprema-roof-config');
    if (oldSave && existing.length === 0) {
       try {
         const parsed = JSON.parse(oldSave);
         existing.push({
           id: 'legacy',
           name: 'Legacy Project',
           date: new Date().toISOString(),
           params: parsed.params,
           layers: parsed.layers,
           thumbnail: ''
         });
       } catch (e) {}
    }
    
    existing.push(newProject);
    localStorage.setItem('soprema_projects', JSON.stringify(existing));
    
    toast.success('Project saved successfully!');
  }, [params, layers]);

  const handleLoadClick = useCallback(() => {
    const existingStr = localStorage.getItem('soprema_projects');
    const existing: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Check old save format for backward compatibility
    const oldSave = localStorage.getItem('soprema-roof-config');
    if (oldSave && existing.length === 0) {
       try {
         const parsed = JSON.parse(oldSave);
         existing.push({
           id: 'legacy',
           name: 'Legacy Project',
           date: new Date().toISOString(),
           params: parsed.params,
           layers: parsed.layers,
           thumbnail: ''
         });
       } catch (e) {}
    }
    
    if (existing.length === 0) {
      toast.info('No saved projects found.');
      return;
    }
    
    setSavedProjects(existing.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowLoadModal(true);
  }, []);

  const loadProject = useCallback((project: SavedProject) => {
    const sanitized = sanitizeProjectData(project);
    if (sanitized) {
      setParams(sanitized.params);
      setLayers(sanitized.layers);
      setShowLoadModal(false);
      toast.success(`Project "${project.name}" loaded!`);
    } else {
      toast.error('Failed to load project: invalid data.');
    }
  }, []);

  const deleteProject = useCallback((id: string) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('soprema_projects', JSON.stringify(updated));
    if (updated.length === 0) {
      setShowLoadModal(false);
    }
  }, [savedProjects]);

  const duplicateProject = useCallback((project: SavedProject) => {
    const duplicated: SavedProject = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      date: new Date().toISOString()
    };
    const existingStr = localStorage.getItem('soprema_projects');
    const existing: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Check old save format for backward compatibility
    const oldSave = localStorage.getItem('soprema-roof-config');
    if (oldSave && existing.length === 0) {
       try {
         const parsed = JSON.parse(oldSave);
         existing.push({
           id: 'legacy',
           name: 'Legacy Project',
           date: new Date().toISOString(),
           params: parsed.params,
           layers: parsed.layers,
           thumbnail: ''
         });
       } catch (e) {}
    }
    
    existing.push(duplicated);
    localStorage.setItem('soprema_projects', JSON.stringify(existing));
    setSavedProjects(existing.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast.success(`Project "${project.name}" duplicated!`);
  }, []);

  const handleExport = useCallback(() => {
    const data = {
      params,
      layers,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soprema-project-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setStatusMessage('Project Exported');
    setTimeout(() => setStatusMessage(''), 2000);
  }, [params, layers]);

  const handleShare = useCallback(() => {
    try {
      const stateStr = encodeURIComponent(btoa(JSON.stringify({ params, layers })));
      // Ensure the URL matches the current domain so the hash/path works properly
      const shareUrl = `${window.location.origin}${window.location.pathname}?state=${stateStr}`;
      
      const subject = encodeURIComponent("Soprema Roof Configuration Project");
      
      let body = `Project Summary:\n`;
      body += `- Area: ${params.area} sq ${params.unitSystem === 'imperial' ? 'ft' : 'm'}\n`;
      body += `- Location: ${params.location || 'Not specified'}\n`;
      body += `- Pitch: ${params.pitch}/12\n\n`;
      
      body += `System Layers (${layers.length}):\n`;
      [...layers].sort((a,b) => a.order - b.order).forEach((l, i) => {
        body += `${i + 1}. ${l.material.name} (${l.material.category})\n`;
      });
      
      body += `\nYou can view and edit this configuration here:\n${shareUrl}\n\n`;
      body += `Note: If you need the full Bill of Materials, please find the exported PDF attached.\n`;
      
      window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
      
      setStatusMessage('Mail client opened');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (e) {
      console.error('Error generating share link:', e);
      setStatusMessage('Failed to create share link');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  }, [params, layers]);

  const sortedProjects = [...savedProjects].sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
    return 0;
  });

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <Toaster position="bottom-right" richColors />
      <Sidebar params={params} setParams={setParams} layers={layers} setLayers={setLayers} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-soprema-black text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-soprema-blue rounded-md flex items-center justify-center font-bold text-lg">
                R
              </div>
              <h1 className="text-xl font-bold tracking-wider hidden md:block">ROOF SYSTEM BUILDER</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleUnitSystem}
                className="text-xs font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
              >
                Units: {params.unitSystem === 'imperial' ? 'Imperial (ft)' : 'Metric (m)'}
              </button>
              
              <div className="h-4 w-px bg-gray-700 mx-1"></div>
              
              <button 
                onClick={handleExport}
                title="Export Project to JSON"
                className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              
              <div className="h-4 w-px bg-gray-700 mx-1"></div>
              
              <button 
                onClick={handleShare}
                title="Share Project"
                className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-soprema-blue hover:bg-blue-600 px-3 py-1.5 rounded border border-blue-500 transition-colors"
              >
                <Share className="w-3.5 h-3.5" /> Share
              </button>
              
              <button 
                onClick={handleSave}
                title="Save Project"
                className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button 
                onClick={handleLoadClick}
                title="Load Project"
                className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Load
              </button>
              <button 
                onClick={() => setShowResetConfirm(true)}
                title="Reset Workspace"
                className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-red-900/50 hover:bg-red-800/80 text-red-100 px-3 py-1.5 rounded border border-red-800 transition-colors ml-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>

              {statusMessage && (
                <span className="text-xs font-medium text-soprema-blue animate-pulse ml-2">
                  {statusMessage}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('visualizer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'visualizer' ? 'bg-soprema-blue text-white' : 'text-gray-300 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" />
              Visualizer
            </button>
            <button 
              onClick={() => setActiveTab('bom')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'bom' ? 'bg-soprema-blue text-white' : 'text-gray-300 hover:text-white'}`}
            >
              <FileText className="w-4 h-4" />
              Bill of Materials
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'code' ? 'bg-soprema-blue text-white' : 'text-gray-300 hover:text-white'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              Code & Specs
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'visualizer' && <Visualizer layers={layers} setLayers={setLayers} params={params} />}
          {activeTab === 'bom' && <BOMExport params={params} layers={layers} />}
          {activeTab === 'code' && <CodeAnalysis params={params} layers={layers} />}
        </main>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 text-gray-900 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Reset Workspace?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to clear all layers and parameters? This action cannot be undone unless you have saved your project.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmReset}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Project Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-soprema-black flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-soprema-blue" /> Saved Projects
              </h3>
              <div className="flex items-center gap-4">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-soprema-blue"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
                <button onClick={() => setShowLoadModal(false)} className="text-gray-500 hover:text-gray-900 p-1 rounded-md hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
              {sortedProjects.map(proj => (
                <div key={proj.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center hover:bg-blue-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    {proj.thumbnail ? (
                      <img src={proj.thumbnail} alt="Preview" className="w-24 h-16 object-cover rounded border border-gray-300 shadow-sm" />
                    ) : (
                      <div className="w-24 h-16 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-400 font-medium shadow-sm">
                        No Preview
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{proj.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(proj.date).toLocaleString()} • <span className="font-medium text-soprema-blue">{proj.layers?.length || 0} Layers</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => duplicateProject(proj)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-soprema-blue hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Duplicate
                    </button>
                    <button 
                      onClick={() => deleteProject(proj.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => loadProject(proj)}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-soprema-blue hover:bg-blue-600 rounded shadow-sm transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
