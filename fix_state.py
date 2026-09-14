import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

# Replace it using regex or just find the line
content = content.replace("  const [localLayers, setLocalLayers] = useState([...layers].sort((a, b) => a.order - b.order));",
    "  const [localLayers, setLocalLayers] = useState([...layers].sort((a, b) => a.order - b.order));\n  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());")

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)
