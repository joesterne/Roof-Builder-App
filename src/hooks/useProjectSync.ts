import { useState, useCallback, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SavedProject, RoofParams, Layer } from '../types';
import { toast } from 'sonner';

export function useProjectSync(user: any) {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsSyncing(true);
    let projects: SavedProject[] = [];

    if (user) {
      try {
        const q = query(collection(db, 'projects'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.userId === user.uid) {
            projects.push(data as SavedProject);
          }
        });
      } catch (err) {
        console.error('Failed to load cloud projects', err);
        toast.error('Failed to sync projects from cloud.');
      }
    }

    // Always fetch local projects as a fallback/addition
    const localStr = localStorage.getItem('soprema_projects');
    const localProjects: SavedProject[] = localStr ? JSON.parse(localStr) : [];
    
    // Check old save format
    const oldSave = localStorage.getItem('soprema-roof-config');
    if (oldSave && localProjects.length === 0) {
       try {
         const parsed = JSON.parse(oldSave);
         localProjects.push({
           id: 'legacy',
           name: 'Legacy Project',
           date: new Date().toISOString(),
           params: parsed.params,
           layers: parsed.layers,
           thumbnail: ''
         });
       } catch (e) {}
    }

    // Merge logic: prefer cloud if logged in, but we can just combine them for simplicity, avoiding dupes by ID
    const merged = [...projects];
    localProjects.forEach(lp => {
      if (!merged.find(p => p.id === lp.id)) {
        merged.push(lp);
      }
    });

    setSavedProjects(merged.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsSyncing(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const saveProject = useCallback(async (project: SavedProject) => {
    if (user) {
      try {
        await setDoc(doc(db, 'projects', project.id), {
          ...project,
          userId: user.uid
        });
        toast.success('Project saved to cloud!');
      } catch (err) {
        console.error('Cloud save failed', err);
        toast.error('Failed to save to cloud, saving locally instead.');
        saveLocally(project);
      }
    } else {
      saveLocally(project);
      toast.success('Project saved locally!');
    }
    await fetchProjects();
  }, [user, fetchProjects]);

  const saveLocally = (project: SavedProject) => {
    const existingStr = localStorage.getItem('soprema_projects');
    const existing: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
    const index = existing.findIndex(p => p.id === project.id);
    if (index >= 0) existing[index] = project;
    else existing.push(project);
    localStorage.setItem('soprema_projects', JSON.stringify(existing));
  };

  const deleteProject = useCallback(async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'projects', id));
        toast.success('Project deleted from cloud.');
      } catch (err) {
        console.error('Cloud delete failed', err);
      }
    }
    
    const existingStr = localStorage.getItem('soprema_projects');
    if (existingStr) {
      const existing: SavedProject[] = JSON.parse(existingStr);
      const filtered = existing.filter(p => p.id !== id);
      localStorage.setItem('soprema_projects', JSON.stringify(filtered));
    }
    
    await fetchProjects();
  }, [user, fetchProjects]);

  return {
    savedProjects,
    isSyncing,
    saveProject,
    deleteProject,
    fetchProjects
  };
}
