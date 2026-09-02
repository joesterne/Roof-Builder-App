import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_dup = """  const duplicateProject = useCallback((project: SavedProject) => {
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
  }, []);"""

new_dup = """  const duplicateProject = useCallback(async (project: SavedProject) => {
    const duplicated: SavedProject = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copy)`,
      date: new Date().toISOString()
    };
    await saveProject(duplicated);
  }, [saveProject]);"""

content = content.replace(old_dup, new_dup)

with open('src/App.tsx', 'w') as f:
    f.write(content)

