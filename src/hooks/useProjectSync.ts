import { useState, useCallback, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import type { SavedProject } from '../types';
import { parseSavedProject } from '../lib/project';
import { toast } from 'sonner';

const KEY = 'soprema_projects';
function readLocal(): SavedProject[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const old = localStorage.getItem('soprema-roof-config');
    if (!old) return [];
    const value = JSON.parse(old);
    return [parseSavedProject({...value, id: 'legacy', name: 'Legacy project', date: new Date().toISOString(), thumbnail: ''})];
  }
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Saved project data is invalid.');
  return value.map(parseSavedProject);
}
function message(error: unknown) { return error instanceof Error ? error.message : 'Storage is unavailable.'; }
export function useProjectSync(user: User | null) {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const fetchProjects = useCallback(async () => {
    setIsSyncing(true);
    const projects = new Map<string, SavedProject>();
    try { readLocal().forEach(project => projects.set(project.id, project)); }
    catch (error) { toast.error(`Could not read device saves: ${message(error)} Existing data was preserved.`); }
    if (user && db) {
      try {
        const result = await getDocs(query(collection(db, 'projects'), where('userId', '==', user.uid)));
        result.forEach(snapshot => {
          try {
            const project = parseSavedProject({...snapshot.data(), id: snapshot.id});
            const local = projects.get(project.id);
            if (!local || Date.parse(project.date) > Date.parse(local.date)) projects.set(project.id, project);
          } catch { toast.error('A cloud project could not be read; its stored data was preserved.'); }
        });
      } catch { toast.error('Cloud sync is unavailable. Device saves remain available.'); }
    }
    setSavedProjects([...projects.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)));
    setIsSyncing(false);
  }, [user]);
  useEffect(() => { void fetchProjects(); }, [fetchProjects]);

  const saveProject = useCallback(async (input: SavedProject): Promise<boolean> => {
    let project: SavedProject;
    try {
      project = parseSavedProject(input);
      const existing = readLocal();
      const updated = [...existing.filter(item => item.id !== project.id), project];
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch (error) {
      toast.error(`Project was not saved: ${message(error)} Export JSON to keep a copy.`);
      return false;
    }
    toast.success('Project saved on this device.');
    if (user && db) {
      try {
        // Firestore rejects undefined properties; JSON also strips incidental React state.
        await setDoc(doc(db, 'projects', project.id), JSON.parse(JSON.stringify({...project, userId: user.uid})));
        toast.success('Cloud copy synchronized.');
      } catch { toast.error('Cloud sync failed. Your device copy is saved.'); }
    }
    await fetchProjects();
    return true;
  }, [user, fetchProjects]);
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const existing = readLocal();
      if (user && db) await deleteDoc(doc(db, 'projects', id));
      localStorage.setItem(KEY, JSON.stringify(existing.filter(project => project.id !== id)));
      // Prevent deleted migrated legacy data from appearing again.
      if (id === 'legacy') localStorage.removeItem('soprema-roof-config');
      await fetchProjects();
      toast.success('Saved project deleted.');
      return true;
    } catch (error) {
      toast.error(`Could not delete saved project: ${message(error)}`);
      return false;
    }
  }, [user, fetchProjects]);
  return {savedProjects, isSyncing, saveProject, deleteProject, fetchProjects};
}
