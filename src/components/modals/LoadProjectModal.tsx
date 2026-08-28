import React, { useState } from 'react';
import { FolderOpen, X } from 'lucide-react';
import { SavedProject } from '../../types';
import { ROOF_TEMPLATES } from '../../templates';

interface LoadProjectModalProps {
  sortOrder: string;
  setSortOrder: (order: string) => void;
  sortedProjects: SavedProject[];
  onClose: () => void;
  onDuplicate: (proj: SavedProject) => void;
  onDelete: (id: string) => void;
  onLoad: (proj: SavedProject) => void;
}

export default function LoadProjectModal({
  sortOrder,
  setSortOrder,
  sortedProjects,
  onClose,
  onDuplicate,
  onDelete,
  onLoad
}: LoadProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'saved' | 'templates'>('templates');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-panel rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-panel-hover">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-soprema-black flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-soprema-blue" /> Projects & Templates
            </h3>
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-md ml-4">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === 'templates' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 text-sm font-medium rounded-sm transition-colors ${activeTab === 'saved' ? 'bg-white dark:bg-gray-600 text-soprema-blue shadow-sm' : 'text-text-muted hover:text-text-main'}`}
              >
                Saved
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'saved' && (
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-soprema-blue bg-bg-panel text-text-main"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            )}
            <button onClick={onClose} className="text-text-muted hover:text-text-main p-1 rounded-md hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
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
                    onClick={() => {
                      onLoad({ ...proj, id: Date.now().toString(), name: `${proj.name} (Copy)` });
                    }}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-soprema-blue hover:bg-blue-600 rounded shadow-sm transition-colors"
                  >
                    Start with Template
                  </button>
                </div>
              </div>
            ))
          ) : (
            sortedProjects.length === 0 ? (
              <p className="text-sm text-text-muted italic text-center mt-4">No saved projects found.</p>
            ) : (
              sortedProjects.map(proj => (
                <div key={proj.id} className="border border-border-main rounded-lg p-3 flex justify-between items-center hover:bg-blue-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    {proj.thumbnail ? (
                      <img src={proj.thumbnail} alt="Preview" className="w-24 h-16 object-cover rounded border border-gray-300 shadow-sm" />
                    ) : (
                      <div className="w-24 h-16 bg-bg-page rounded border border-gray-300 flex items-center justify-center text-xs text-gray-400 font-medium shadow-sm">
                        No Preview
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-text-main text-base">{proj.name}</h4>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(proj.date).toLocaleString()} • <span className="font-medium text-soprema-blue">{proj.layers?.length || 0} Layers</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onDuplicate(proj)}
                      className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-soprema-blue hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-colors opacity-0 group-hover:opacity-100 dark:hover:bg-blue-900/30"
                    >
                      Duplicate
                    </button>
                    <button 
                      onClick={() => onDelete(proj.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors opacity-0 group-hover:opacity-100 dark:hover:bg-red-900/30"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => onLoad(proj)}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-soprema-blue hover:bg-blue-600 rounded shadow-sm transition-colors"
                    >
                      Load
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
