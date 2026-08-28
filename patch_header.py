import re

with open('src/components/Header.tsx', 'r') as f:
    content = f.read()

# Add QrCode import
content = content.replace("FolderOpen, RotateCcw } from 'lucide-react';", "FolderOpen, RotateCcw, QrCode } from 'lucide-react';")

# Add handleShareQR to props
content = content.replace("handleShare: () => void;", "handleShare: () => void;\n  handleShareQR: () => void;")

# Add handleShareQR to destructured props
content = content.replace("handleShare,", "handleShare,\n  handleShareQR,")

# Add the button
button_html = """          <button 
            onClick={handleShareQR}
            title="Share via QR Code"
            className="text-xs flex items-center justify-center bg-gray-800 hover:bg-gray-700 px-2 py-1.5 rounded border border-gray-600 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
          
          <button """
content = content.replace("          <button \n            onClick={handleSave}", button_html)

with open('src/components/Header.tsx', 'w') as f:
    f.write(content)
