import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_delete = """  const deleteProject = useCallback((id: string) => {
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
  }, [savedProjects]);"""

content = content.replace(old_delete, "")
with open('src/App.tsx', 'w') as f:
    f.write(content)
