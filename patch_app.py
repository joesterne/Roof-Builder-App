import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace(
    "import LoadProjectModal from './components/modals/LoadProjectModal';",
    "import LoadProjectModal from './components/modals/LoadProjectModal';\nimport QRCodeModal from './components/modals/QRCodeModal';"
)

# Add states
content = content.replace(
    "const [showLoadModal, setShowLoadModal] = useState(false);",
    "const [showLoadModal, setShowLoadModal] = useState(false);\n  const [showQRCodeModal, setShowQRCodeModal] = useState(false);\n  const [shareUrlToGenerate, setShareUrlToGenerate] = useState('');"
)

# Add handleShareQR
handle_share_qr = """
  const handleShareQR = useCallback(() => {
    try {
      const stateStr = encodeURIComponent(btoa(JSON.stringify({ params, layers })));
      const shareUrl = `${window.location.origin}${window.location.pathname}?state=${stateStr}`;
      setShareUrlToGenerate(shareUrl);
      setShowQRCodeModal(true);
    } catch (e) {
      console.error('Error generating share QR link:', e);
      setStatusMessage('Failed to create QR link');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  }, [params, layers]);

  const handleShare = useCallback(() => {"""
content = content.replace("  const handleShare = useCallback(() => {", handle_share_qr)

# Pass handleShareQR to Header
content = content.replace(
    "handleShare={handleShare}",
    "handleShare={handleShare}\n          handleShareQR={handleShareQR}"
)

# Render QRCodeModal
qr_modal = """
      {showQRCodeModal && (
        <QRCodeModal
          url={shareUrlToGenerate}
          onClose={() => setShowQRCodeModal(false)}
        />
      )}
      
      {showNotesModal && ("""
content = content.replace("      {showNotesModal && (", qr_modal)

with open('src/App.tsx', 'w') as f:
    f.write(content)
