import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# 1. Imports: Make sure we have CheckSquare and Copy and Trash2 (Trash2 is already there)
# Let's just find lucide-react import and add Copy, CheckSquare, Square if not there.
# We will use simple standard HTML checkbox or a custom one.
lucide_pattern = r"import \{ (.*?) \} from 'lucide-react';"
def replacer(match):
    imports = [i.strip() for i in match.group(1).split(',')]
    for icon in ['Copy', 'CheckSquare', 'Square', 'Check']:
        if icon not in imports:
            imports.append(icon)
    return f"import {{ {', '.join(imports)} }} from 'lucide-react';"

content = re.sub(lucide_pattern, replacer, content)

# 2. Add state inside the component
state_insertion = """  const [compareList, setCompareList] = useState<Material[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [localLayers, setLocalLayers] = useState([...layers].sort((a, b) => a.order - b.order));
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());"""

content = content.replace("""  const [compareList, setCompareList] = useState<Material[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [localLayers, setLocalLayers] = useState([...layers].sort((a, b) => a.order - b.order));""", state_insertion)

# 3. Add bulk actions logic near removeLayer
remove_layer_code = """  const removeLayer = useCallback((id: string) => {
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== id);
      return filtered.map((l, i) => ({ ...l, order: i }));
    });
  }, [setLayers]);"""

bulk_actions_code = """  const removeLayer = useCallback((id: string) => {
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== id);
      return filtered.map((l, i) => ({ ...l, order: i }));
    });
    setSelectedLayerIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [setLayers]);

  const toggleLayerSelection = useCallback((id: string, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    setSelectedLayerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const deleteSelectedLayers = useCallback(() => {
    setLayers(prev => {
      const filtered = prev.filter(l => !selectedLayerIds.has(l.id));
      return filtered.map((l, i) => ({ ...l, order: i }));
    });
    setSelectedLayerIds(new Set());
  }, [selectedLayerIds, setLayers]);

  const duplicateSelectedLayers = useCallback(() => {
    setLayers(prev => {
      const toDuplicate = prev.filter(l => selectedLayerIds.has(l.id));
      const newItems = toDuplicate.map(layer => ({
        ...layer,
        id: Math.random().toString(36).substr(2, 9),
      }));
      const newLayers = [...prev, ...newItems];
      return newLayers.map((l, i) => ({ ...l, order: i }));
    });
    setSelectedLayerIds(new Set());
  }, [selectedLayerIds, setLayers]);

  const toggleSelectAll = useCallback(() => {
    if (selectedLayerIds.size === localLayers.length && localLayers.length > 0) {
      setSelectedLayerIds(new Set());
    } else {
      setSelectedLayerIds(new Set(localLayers.map(l => l.id)));
    }
  }, [localLayers, selectedLayerIds]);
"""

content = content.replace(remove_layer_code, bulk_actions_code)

# 4. Add the Bulk actions UI and the checkbox inside the list items
# Wait, let's find the Build Assembly header:
build_assembly_header = """        <h2 className="text-lg font-bold text-soprema-black flex items-center gap-2 mb-4">
          <List className="w-5 h-5 text-soprema-blue" />
          Build Assembly
        </h2>"""

bulk_ui = """        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-soprema-black flex items-center gap-2">
            <List className="w-5 h-5 text-soprema-blue" />
            Build Assembly
          </h2>
          {localLayers.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-soprema-blue hover:text-blue-700 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
            >
              {selectedLayerIds.size === localLayers.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        
        {selectedLayerIds.size > 0 && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-soprema-blue pl-2">{selectedLayerIds.size} selected</span>
            <div className="flex gap-2">
              <button 
                onClick={duplicateSelectedLayers}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-soprema-black hover:text-soprema-blue text-sm font-medium rounded border border-gray-200 shadow-sm transition-colors hover:border-blue-300"
                title="Duplicate Selected"
              >
                <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Duplicate</span>
              </button>
              <button 
                onClick={deleteSelectedLayers}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 hover:text-red-700 text-sm font-medium rounded border border-gray-200 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        )}"""

content = content.replace(build_assembly_header, bulk_ui)


# 5. Add checkbox to the Reorder.Item
list_item = """                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-gray-400 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-soprema-blue uppercase tracking-wider truncate">{layer.material.category}</span>
                      <span className="text-sm font-medium text-text-main truncate">{layer.material.name}</span>
                    </div>
                  </div>"""

list_item_with_checkbox = """                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="w-4 h-4 text-gray-400 shrink-0 cursor-grab opacity-50 group-hover:opacity-100 transition-opacity" />
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => toggleLayerSelection(layer.id, e)}
                      className="shrink-0 flex items-center justify-center w-5 h-5 rounded border bg-white focus:outline-none focus:ring-2 focus:ring-soprema-blue transition-colors"
                      style={{ 
                        borderColor: selectedLayerIds.has(layer.id) ? 'var(--color-soprema-blue)' : '#d1d5db',
                        backgroundColor: selectedLayerIds.has(layer.id) ? 'var(--color-soprema-blue)' : 'white'
                      }}
                    >
                      {selectedLayerIds.has(layer.id) && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-soprema-blue uppercase tracking-wider truncate">{layer.material.category}</span>
                      <span className="text-sm font-medium text-text-main truncate">{layer.material.name}</span>
                    </div>
                  </div>"""

content = content.replace(list_item, list_item_with_checkbox)

# Check for success
with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)

