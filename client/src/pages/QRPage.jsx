import { QRCodeSVG } from 'qrcode.react';

export default function QRPage() {
  // Use the environment variable to ensure the QR code points to the right place
  // Defaults to localhost for local testing
  const launchUrl = import.meta.env.VITE_LAUNCH_URL || 'http://localhost:5173/launch';

  return (
    <div className="page-container">
      <h1>Scan to Launch</h1>
      <h2>Authorized personnel only</h2>
      
      <div className="qr-container">
        <QRCodeSVG 
          value={launchUrl} 
          size={300} 
          bgColor="#ffffff"
          fgColor="#0a0a0a"
          level="H" // High error correction, better for screens
        />
      </div>

      <p style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>
        Target URL: {launchUrl}
      </p>
    </div>
  );
}