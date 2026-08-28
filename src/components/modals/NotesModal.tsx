import React from 'react';
import { FileText, X } from 'lucide-react';

interface NotesModalProps {
  tempNotes: string;
  setTempNotes: (notes: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function NotesModal({ tempNotes, setTempNotes, onClose, onSave }: NotesModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-panel rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-panel-hover">
          <h3 className="text-lg font-bold text-soprema-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-soprema-blue" /> Project Notes
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1 rounded-md hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-text-secondary mb-3">
            Add client requirements, specific site conditions, or custom configuration notes here. These will be saved alongside your project configuration.
          </p>
          <textarea
            value={tempNotes}
            onChange={e => setTempNotes(e.target.value)}
            className="w-full h-64 p-3 border border-border-main rounded-md focus:outline-none focus:ring-2 focus:ring-soprema-blue resize-y bg-bg-panel text-text-main"
            placeholder="Enter long-form notes..."
          ></textarea>
        </div>
        <div className="p-4 border-t border-border-main flex justify-end gap-3 bg-bg-panel-hover">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-page hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-soprema-blue hover:bg-blue-600 rounded-md transition-colors shadow-sm"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
