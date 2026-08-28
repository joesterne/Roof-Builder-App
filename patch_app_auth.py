import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Imports
content = content.replace(
    "import QRCodeModal from './components/modals/QRCodeModal';",
    "import QRCodeModal from './components/modals/QRCodeModal';\nimport AuthModal from './components/modals/AuthModal';\nimport { auth, db } from './lib/firebase';\nimport { onAuthStateChanged, signOut } from 'firebase/auth';\nimport { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';"
)

# States
content = content.replace(
    "const [showLoadModal, setShowLoadModal] = useState(false);",
    "const [showLoadModal, setShowLoadModal] = useState(false);\n  const [showAuthModal, setShowAuthModal] = useState(false);\n  const [user, setUser] = useState<any>(null);"
)

# Auth Effect
auth_effect = """
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
"""
content = content.replace("  const paramsRef = useRef(params);", auth_effect + "\n  const paramsRef = useRef(params);")

# handleSave
old_save = """    const existingStr = localStorage.getItem('soprema_projects');
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
    
    toast.success('Project saved successfully!');"""

new_save = """    if (user) {
      try {
        await setDoc(doc(db, 'projects', newProject.id), {
          ...newProject,
          userId: user.uid,
          isPublic: false
        });
        toast.success('Project saved to cloud successfully!');
      } catch (err) {
        console.error('Error saving to cloud', err);
        toast.error('Failed to save to cloud.');
      }
    } else {
      const existingStr = localStorage.getItem('soprema_projects');
      const existing: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
      
      existing.push(newProject);
      localStorage.setItem('soprema_projects', JSON.stringify(existing));
      toast.success('Project saved locally! (Sign in to save to cloud)');
    }"""
content = content.replace(old_save, new_save)

# handleLoadClick
old_load = """    const existingStr = localStorage.getItem('soprema_projects');
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
    setShowLoadModal(true);"""

new_load = """    if (user) {
      const toastId = toast.loading('Loading cloud projects...');
      try {
        const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const cloudProjects: SavedProject[] = [];
        querySnapshot.forEach((doc) => {
          cloudProjects.push(doc.data() as SavedProject);
        });
        toast.dismiss(toastId);
        if (cloudProjects.length === 0) {
          toast.info('No cloud projects found.');
        }
        setSavedProjects(cloudProjects.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setShowLoadModal(true);
      } catch (err) {
        console.error(err);
        toast.dismiss(toastId);
        toast.error('Failed to load cloud projects.');
      }
    } else {
      const existingStr = localStorage.getItem('soprema_projects');
      const existing: SavedProject[] = existingStr ? JSON.parse(existingStr) : [];
      
      if (existing.length === 0) {
        toast.info('No saved projects found locally.');
        return;
      }
      
      setSavedProjects(existing.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setShowLoadModal(true);
    }"""

content = content.replace(old_load, new_load)
content = content.replace("const handleLoadClick = useCallback(() => {", "const handleLoadClick = useCallback(async () => {")

# deleteProject
old_delete = """    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('soprema_projects', JSON.stringify(updated));
    if (updated.length === 0) {
      setShowLoadModal(false);
    }"""
new_delete = """    if (user) {
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
    }"""
content = content.replace(old_delete, new_delete)

# Header props
content = content.replace(
    "statusMessage={statusMessage}",
    "statusMessage={statusMessage}\n          user={user}\n          onAuthClick={() => setShowAuthModal(true)}\n          onSignOut={() => signOut(auth)}"
)

# Auth modal render
auth_modal = """
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
"""
content = content.replace("{showLoadModal && (", auth_modal + "\n      {showLoadModal && (")

with open('src/App.tsx', 'w') as f:
    f.write(content)
