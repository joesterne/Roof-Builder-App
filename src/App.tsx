import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Visualizer from './components/Visualizer';
import BOMExport from './components/BOMExport';
import CodeAnalysis from './components/CodeAnalysis';
import { RoofParams, Layer, SavedProject } from './types';
import { Layers, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import html2canvas from 'html2canvas';
import { SOPREMA_MATERIALS } from './data';
import Header from './components/Header';
import NotesModal from './components/modals/NotesModal';
import ResetConfirmModal from './components/modals/ResetConfirmModal';
import LoadProjectModal from './components/modals/LoadProjectModal';
import QRCodeModal from './components/modals/QRCodeModal';
import AuthModal from './components/modals/AuthModal';
import { auth, db } from './lib/firebase';
import { useProjectSync } from './hooks/useProjectSync';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';


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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { savedProjects, saveProject, deleteProject, fetchProjects } = useProjectSync(user);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [shareUrlToGenerate, setShareUrlToGenerate] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('soprema_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const paramsRef = useRef(params);
  const layersRef = useRef(layers);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('soprema_dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

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

  const handleLoadClick = useCallback(async () => {
    await fetchProjects();
    setShowLoadModal(true);
  }, [fetchProjects]);

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



  const duplicateProject = useCallback(async (project: SavedProject) => {
    const duplicated: SavedProject = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      date: new Date().toISOString()
    };
    await saveProject(duplicated);
  }, [saveProject]);

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


  const handleShareQR = useCallback(() => {
    try {
      const stateStr = encodeURIComponent(btoa(JSON.stringify({ params, layers })));
      const shareUrl = `${window.location.origin}${window.location.pathname}?state=${stateStr}`;
      setShareUrlToGenerate(shareUrl);
      setShowQRCodeModal(true);
    } catch (e) {
      console.error('Error generating share QR link:', e);
      setStatusMessage('Failed to create QR link');
      setTimeout(() => setStatusMessage(''), 2000);
    }
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
    <div className="flex h-screen bg-bg-page overflow-hidden font-sans">
      <Toaster position="bottom-right" richColors />
      <Sidebar params={params} setParams={setParams} layers={layers} setLayers={setLayers} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          params={params}
          toggleUnitSystem={toggleUnitSystem}
          handleExport={handleExport}
          openNotesModal={() => { setTempNotes(params.projectNotes || ''); setShowNotesModal(true); }}
          handleShare={handleShare}
          handleShareQR={handleShareQR}
          handleSave={handleSave}
          handleLoadClick={handleLoadClick}
          openResetConfirm={() => setShowResetConfirm(true)}
          statusMessage={statusMessage}
          user={user}
          onAuthClick={() => setShowAuthModal(true)}
          onSignOut={() => signOut(auth)}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {activeTab === 'visualizer' && <Visualizer layers={layers} setLayers={setLayers} params={params} />}
          {activeTab === 'bom' && <BOMExport params={params} layers={layers} />}
          {activeTab === 'code' && <CodeAnalysis params={params} layers={layers} />}
        </main>
      </div>


      {showQRCodeModal && (
        <QRCodeModal
          url={shareUrlToGenerate}
          onClose={() => setShowQRCodeModal(false)}
        />
      )}
      
      {showNotesModal && (
        <NotesModal
          tempNotes={tempNotes}
          setTempNotes={setTempNotes}
          onClose={() => setShowNotesModal(false)}
          onSave={() => {
            setParams(prev => ({ ...prev, projectNotes: tempNotes }));
            setShowNotesModal(false);
            toast.success('Project notes updated');
          }}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ResetConfirmModal
          onClose={() => setShowResetConfirm(false)}
          onConfirm={confirmReset}
        />
      )}

      {/* Load Project Modal */}
      
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {showLoadModal && (
        <LoadProjectModal
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          sortedProjects={sortedProjects}
          onClose={() => setShowLoadModal(false)}
          onDuplicate={duplicateProject}
          onDelete={handleDeleteProject}
          onLoad={loadProject}
        />
      )}
    </div>
  );
}
