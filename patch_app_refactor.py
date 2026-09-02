import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Import the new hook
content = content.replace(
    "import { auth, db } from './lib/firebase';",
    "import { auth, db } from './lib/firebase';\nimport { useProjectSync } from './hooks/useProjectSync';"
)

# 2. Add the hook inside App
content = content.replace(
    "const [user, setUser] = useState<any>(null);",
    "const [user, setUser] = useState<any>(null);\n  const { savedProjects, saveProject, deleteProject, fetchProjects } = useProjectSync(user);"
)

# 3. Remove manual savedProjects state
content = re.sub(r"const \[savedProjects, setSavedProjects\] = useState<SavedProject\[\]>\(\[\]\);\n", "", content)

# 4. Refactor handleSave
old_handle_save = """  const handleSave = useCallback(async () => {
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
  }, [params, layers]);"""

new_handle_save = """  const handleSave = useCallback(async () => {
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
    
    await saveProject(newProject);
  }, [params, layers, saveProject]);"""
content = content.replace(old_handle_save, new_handle_save)

# 5. Refactor handleLoadClick
old_handle_load = """  const handleLoadClick = useCallback(async () => {
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
  }, []);"""

new_handle_load = """  const handleLoadClick = useCallback(async () => {
    await fetchProjects();
    setShowLoadModal(true);
  }, [fetchProjects]);"""
content = content.replace(old_handle_load, new_handle_load)


# 6. Refactor deleteProject
old_delete_project = """  const deleteProject = useCallback((id: string) => {
    if (user) {
      deleteDoc(doc(db, 'projects', id)).then(() => {
        const updated = savedProjects.filter(p => p.id !== id);
        setSavedProjects(updated);
        toast.success('Project deleted from cloud.');
        if (updated.length === 0) setShowLoadModal(false);
      }).catch(err => {
        console.error(err);
        toast.error('Failed to delete cloud project.');
      });
    } else {
      const updated = savedProjects.filter(p => p.id !== id);
      setSavedProjects(updated);
      localStorage.setItem('soprema_projects', JSON.stringify(updated));
      toast.success('Project deleted locally.');
      if (updated.length === 0) setShowLoadModal(false);
    }
  }, [user, savedProjects]);"""

new_delete_project = """  const handleDeleteProject = useCallback(async (id: string) => {
    await deleteProject(id);
  }, [deleteProject]);"""
content = content.replace(old_delete_project, new_delete_project)

# Need to fix duplicateProject which uses setSavedProjects
old_duplicate = """  const duplicateProject = useCallback((project: SavedProject) => {
    const duplicated: SavedProject = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      date: new Date().toISOString()
    };
    const updated = [...savedProjects, duplicated];
    setSavedProjects(updated);
    
    if (user) {
      setDoc(doc(db, 'projects', duplicated.id), { ...duplicated, userId: user.uid }).then(() => {
         toast.success('Project duplicated to cloud.');
      });
    } else {
      localStorage.setItem('soprema_projects', JSON.stringify(updated));
      toast.success('Project duplicated locally.');
    }
  }, [savedProjects, user]);"""

new_duplicate = """  const duplicateProject = useCallback(async (project: SavedProject) => {
    const duplicated: SavedProject = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      date: new Date().toISOString()
    };
    await saveProject(duplicated);
  }, [saveProject]);"""
content = content.replace(old_duplicate, new_duplicate)

content = content.replace("onDelete={deleteProject}", "onDelete={handleDeleteProject}")

with open('src/App.tsx', 'w') as f:
    f.write(content)

