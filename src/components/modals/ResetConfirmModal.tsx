import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ResetConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetConfirmModal({ onClose, onConfirm }: ResetConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-panel rounded-lg shadow-2xl max-w-sm w-full p-6 text-text-main border border-border-main">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Reset Workspace?</h3>
        </div>
        <p className="text-sm text-text-muted mb-6">
          Are you sure you want to clear all layers and parameters? This action cannot be undone unless you have saved your project.
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-page hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
