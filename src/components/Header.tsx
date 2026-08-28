import React from 'react';
import { Sun, Moon, Download, FileText, Share, Save, FolderOpen, RotateCcw, QrCode, User, LogOut } from 'lucide-react';
import { RoofParams } from '../types';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  params: RoofParams;
  toggleUnitSystem: () => void;
  handleExport: () => void;
  openNotesModal: () => void;
  handleShare: () => void;
  handleShareQR: () => void;
  handleSave: () => void;
  handleLoadClick: () => void;
  openResetConfirm: () => void;
  statusMessage: string;
  user: any;
  onAuthClick: () => void;
  onSignOut: () => void;
}

export default function Header({
  isDarkMode,
  setIsDarkMode,
  params,
  toggleUnitSystem,
  handleExport,
  openNotesModal,
  handleShare,
  handleShareQR,
  handleSave,
  handleLoadClick,
  openResetConfirm,
  statusMessage,
  user,
  onAuthClick,
  onSignOut
}: HeaderProps) {
  return (
    <header className="bg-soprema-black text-white p-4 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-soprema-blue rounded-md flex items-center justify-center font-bold text-lg">
            R
          </div>
          <h1 className="text-xl font-bold tracking-wider hidden md:block">ROOF SYSTEM BUILDER</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          <button 
            onClick={toggleUnitSystem}
            className="text-xs font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
          >
            Units: {params.unitSystem === 'imperial' ? 'Imperial (ft)' : 'Metric (m)'}
          </button>
          
          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          
          <button 
            onClick={handleExport}
            title="Export Project to JSON"
            className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          
          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          
          <button 
            onClick={openNotesModal}
            title="Project Notes"
            className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Notes
          </button>

          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          
          <button 
            onClick={handleShare}
            title="Share Project"
            className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-soprema-blue hover:bg-blue-600 px-3 py-1.5 rounded border border-blue-500 transition-colors"
          >
            <Share className="w-3.5 h-3.5" /> Share
          </button>
          
          <button 
            onClick={handleShareQR}
            title="Share via QR Code"
            className="text-xs flex items-center justify-center bg-gray-800 hover:bg-gray-700 px-2 py-1.5 rounded border border-gray-600 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
          
          <button 
            onClick={handleSave}
            title="Save Project"
            className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>

          <button 
            onClick={handleLoadClick}
            title="Load Project"
            className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Load
          </button>

          <button 
            onClick={openResetConfirm}
            title="Reset Workspace"
            className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-red-900/50 hover:bg-red-800/80 text-red-100 px-3 py-1.5 rounded border border-red-800 transition-colors ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          {statusMessage && (
            <span className="text-xs font-medium text-soprema-blue animate-pulse ml-2">
              {statusMessage}
            </span>
          )}

          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 ml-1">{user.email}</span>
              <button 
                onClick={onSignOut}
                title="Sign Out"
                className="text-xs flex items-center justify-center bg-gray-800 hover:bg-gray-700 p-1.5 rounded border border-gray-600 transition-colors text-gray-300 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              title="Sign In / Register"
              className="text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded border border-gray-600 transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
