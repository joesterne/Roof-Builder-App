import React from 'react';
import QRCode from 'react-qr-code';
import { X, QrCode } from 'lucide-react';

interface QRCodeModalProps {
  url: string;
  onClose: () => void;
}

export default function QRCodeModal({ url, onClose }: QRCodeModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-bg-panel rounded-lg shadow-2xl max-w-sm w-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-panel-hover">
          <h3 className="text-lg font-bold text-soprema-black flex items-center gap-2">
            <QrCode className="w-5 h-5 text-soprema-blue" /> Share via QR
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-main p-1 rounded-md hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center justify-center bg-white">
          <QRCode value={url} size={256} className="w-full h-auto max-w-[256px]" />
          <p className="mt-6 text-sm text-center text-text-secondary">
            Scan this code with a mobile device to open the current project configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
