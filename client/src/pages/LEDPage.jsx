import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// Automatically detect the correct Wi-Fi IP address instead of using localhost
const BACKEND_URL = import.meta.env.DEV 
  ? `http://${window.location.hostname}:5000` 
  : import.meta.env.VITE_BACKEND_URL;

const socket = io(BACKEND_URL, {
  transports: ['websocket']
});
export default function LEDPage() {
  const [status, setStatus] = useState('IDLE');
  const [displayText, setDisplayText] = useState('');
  const [timeOffset, setTimeOffset] = useState(0); 
  const [launchParams, setLaunchParams] = useState({ startTime: null, duration: 11000 });

  // Dynamically get the current IP address so the phone can reach the server over Wi-Fi
  const launchUrl = `${window.location.protocol}//${window.location.host}/launch`;

  useEffect(() => {
    socket.on('sync-state', (data) => {
      const currentClientTime = Date.now();
      const offset = data.serverTime - currentClientTime;
      setTimeOffset(offset);
      setLaunchParams({ startTime: data.startTime, duration: data.duration });
      setStatus(data.state);
    });

    return () => socket.off('sync-state');
  }, []);

  useEffect(() => {
    if (status === 'LAUNCHED') {
      window.location.replace('https://vulcanprep.com');
    }
  }, [status]);

  useEffect(() => {
    let intervalId;
    if (status === 'COUNTDOWN' && launchParams.startTime) {
      intervalId = setInterval(() => {
        const syncedNow = Date.now() + timeOffset;
        const remainingMs = (launchParams.startTime + launchParams.duration) - syncedNow;
        const secondsLeft = Math.ceil(remainingMs / 1000);

        if (secondsLeft > 10) {
          setDisplayText('GET READY');
        } else if (secondsLeft > 0) {
          setDisplayText(secondsLeft.toString());
        } else {
          setDisplayText('');
        }
      }, 50);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, launchParams, timeOffset]);

  if (status === 'IDLE') {
    return (
      <div className="page-container led-screen">
        <h1 style={{ fontSize: '4vw', marginBottom: '3rem' }}>SCAN TO LAUNCH</h1>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '30px', boxShadow: '0 0 50px rgba(255,255,255,0.2)' }}>
          <QRCodeSVG 
            value={launchUrl} 
            size={400} 
            bgColor="#ffffff"
            fgColor="#0a0a0a"
            level="H" 
          />
        </div>
      </div>
    );
  }

  if (status === 'COUNTDOWN') {
    return (
      <div className="page-container led-screen">
        <div key={displayText} className={displayText === 'GET READY' ? 'countdown-get-ready' : 'countdown-display'}>
          {displayText}
        </div>
      </div>
    );
  }

  if (status === 'LAUNCHED') {
    return (
      <div className="page-container led-screen led-launched">
        <h1>LOADING LIVE SITE...</h1>
      </div>
    );
  }

  return null;
}