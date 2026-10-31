import { useState, useCallback, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import type { SavedProject } from '../types';
import { parseSavedProject } from '../lib/project';
import { toast } from 'sonner';

const KEY = 'soprema_projects';

// Corrupt saved data used to brick EVERY future save and delete: readLocal
// threw on malformed JSON, and save/delete call it before writing, so one
// bad entry made "Project was not saved" permanent. Unreadable data is now
// quarantined — the raw copy is preserved under a .corrupt-backup key,
// individual entries that fail validation are skipped with a warning, and
// only a failed WRITE can fail a save.
function quarantine(sourceKey: string, raw: string) {
  try { localStorage.setItem(`${sourceKey}.corrupt-backup`, raw); } catch { /* storage unavailable */ }
  console.warn(`Unreadable saved data from ${sourceKey} was quarantined to ${sourceKey}.corrupt-backup.`);
}

function readLocal(): SavedProject[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const old = localStorage.getItem('soprema-roof-config');
    if (!old) return [];
    try {
      const value = JSON.parse(old);
      return [parseSavedProject({...value, id: 'legacy', name: 'Legacy project', date: new Date().toISOString(), thumbnail: ''})];
    } catch {
      quarantine('soprema-roof-config', old);
      return [];
    }
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    quarantine(KEY, raw);
    return [];
  }
  if (!Array.isArray(value)) {
    quarantine(KEY, raw);
    return [];
  }
  const projects: SavedProject[] = [];
  let skipped = 0;
  for (const entry of value) {
    try { projects.push(parseSavedProject(entry)); }
    catch { skipped++; }
  }
  if (skipped > 0) {
    quarantine(KEY, raw);
    console.warn(`${skipped} saved project(s) could not be read and were skipped; the original data is preserved in the quarantine backup.`);
  }
  return projects;
}
function message(error: unknown) { return error instanceof Error ? error.message : 'Storage is unavailable.'; }
export function useProjectSync(user: User | null) {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const fetchProjects = useCallback(async () => {
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
    // Local delete first: the cloud deleteDoc used to be awaited BEFORE the
    // local removal, so an offline/permission failure blocked deleting the
    // device copy at all — asymmetric with saveProject, where the device
    // copy is authoritative and cloud failure only warns.
    try {
      const existing = readLocal();
      localStorage.setItem(KEY, JSON.stringify(existing.filter(project => project.id !== id)));
      // Prevent deleted migrated legacy data from appearing again.
      if (id === 'legacy') localStorage.removeItem('soprema-roof-config');
    } catch (error) {
      toast.error(`Could not delete saved project: ${message(error)}`);
      return false;
    }
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch {
        toast.error('Device copy deleted. The cloud delete failed, so the cloud copy may reappear on the next sync.');
      }
    }
    await fetchProjects();
    toast.success('Saved project deleted.');
    return true;
  }, [user, fetchProjects]);
  return {savedProjects, saveProject, deleteProject, fetchProjects};
}
