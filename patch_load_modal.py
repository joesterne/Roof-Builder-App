import re

with open('src/components/modals/LoadProjectModal.tsx', 'r') as f:
    content = f.read()

# Make sure ROOF_TEMPLATES is imported
content = content.replace("import { SavedProject } from '../../types';", "import { SavedProject } from '../../types';\nimport { ROOF_TEMPLATES } from '../../templates';\nimport { useState } from 'react';")

# Add a state for tabs
content = content.replace("export default function LoadProjectModal({", "export default function LoadProjectModal({\n  sortOrder,\n  setSortOrder,\n  sortedProjects,\n  onClose,\n  onDuplicate,\n  onDelete,\n  onLoad\n}: LoadProjectModalProps) {\n  const [activeTab, setActiveTab] = useState<'saved' | 'templates'>('templates');\n\n  return (\n    <div className=\"fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4\">\n      <div className=\"bg-bg-panel rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh] overflow-hidden\">\n        <div className=\"p-4 border-b border-border-main flex justify-between items-center bg-bg-panel-hover\">\n          <h3 className=\"text-lg font-bold text-soprema-black flex items-center gap-4\">\n            <div className=\"flex items-center gap-2\">\n              <FolderOpen className=\"w-5 h-5 text-soprema-blue\" />\n              Projects & Templates\n            </div>\n            <div className=\"flex bg-gray-200 dark:bg-gray-800 p-1 rounded-md ml-4\">\n              <button\n                onClick={() => setActiveTab('templates')}\n                className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === 'templates' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}\n              >\n                Templates\n              </button>\n              <button\n                onClick={() => setActiveTab('saved')}\n                className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === 'saved' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}\n              >\n                Saved\n              </button>\n            </div>\n          </h3>")

# Delete old function signature & opening divs
content = re.sub(r'export default function LoadProjectModal\(\{\n(?:.*?)<h3 className="text-lg font-bold text-soprema-black flex items-center gap-2">\s*<FolderOpen className="w-5 h-5 text-soprema-blue" \/> Saved Projects\s*<\/h3>', '', content, flags=re.DOTALL)

# Modify the logic for showing templates or saved projects
content = content.replace("          <div className=\"flex items-center gap-4\">\n            <select", "          <div className=\"flex items-center gap-4\">\n            {activeTab === 'saved' && (<select")
content = content.replace("            </select>\n            <button onClick={onClose}", "            </select>)}\n            <button onClick={onClose}")

list_render_logic = """
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-bg-panel">
          {activeTab === 'templates' ? (
            ROOF_TEMPLATES.map(proj => (
              <div key={proj.id} className="border border-border-main rounded-lg p-3 flex justify-between items-center hover:bg-blue-50/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-16 bg-blue-100 dark:bg-blue-900 rounded border border-blue-200 flex items-center justify-center text-xs text-soprema-blue font-bold shadow-sm text-center px-2">
                    Template
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-base">{proj.name}</h4>
                    <p className="text-xs text-text-muted mt-1">
                      Pre-built Configuration • <span className="font-medium text-soprema-blue">{proj.layers?.length || 0} Layers</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onLoad(proj)}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-soprema-blue hover:bg-blue-600 rounded shadow-sm transition-colors"
                  >
                    Start with Template
                  </button>
                </div>
              </div>
            ))
          ) : (
            sortedProjects.length === 0 ? (
"""
content = content.replace("        <div className=\"p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-bg-panel\">\n          {sortedProjects.length === 0 ? (", list_render_logic)

content = content.replace("          )}\n        </div>", "          )}\n        </div>")

with open('src/components/modals/LoadProjectModal.tsx', 'w') as f:
    f.write(content)

