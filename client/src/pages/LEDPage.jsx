import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

const BACKEND_URL = import.meta.env.DEV 
  ? `http://${window.location.hostname}:5000` 
  : import.meta.env.VITE_BACKEND_URL;

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling']
});

export default function LEDPage() {
  const [status, setStatus] = useState('IDLE');
  const [displayText, setDisplayText] = useState('');
  const [progress, setProgress] = useState(1); // 1 = full circle, 0 = empty
  const [timeOffset, setTimeOffset] = useState(0); 
  const [launchParams, setLaunchParams] = useState({ startTime: null, duration: 11000 });

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
        const totalDuration = launchParams.duration || 11000;
        const remainingMs = (launchParams.startTime + totalDuration) - syncedNow;
        
        // Calculate seconds left
        const secondsLeft = Math.ceil(remainingMs / 1000);

        // Calculate progress ratio (1.0 down to 0.0) for the circle
        const currentProgress = Math.max(0, Math.min(1, remainingMs / totalDuration));
        setProgress(currentProgress);

        if (secondsLeft > 10) {
          setDisplayText('10');
        } else if (secondsLeft > 0) {
          setDisplayText(secondsLeft.toString());
        } else {
          setDisplayText('0');
        }
      }, 50);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [status, launchParams, timeOffset]);

  const isCountingDown = status === 'COUNTDOWN';
  const isLaunched = status === 'LAUNCHED';
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  if (isLaunched) {
    return (
      <div className="page-container led-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
        <h1 style={{ fontSize: '3vw', color: '#00ffcc', letterSpacing: '2px' }}>LAUNCHING VULCANPREP...</h1>
      </div>
    );
  }

  return (
    <div className="page-container led-screen" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      color: '#fff',
      transition: 'all 0.4s ease'
    }}>
      <h1 style={{ 
        fontSize: '2.5vw', 
        marginBottom: isCountingDown ? '0.8rem' : '2rem', 
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>
        {isCountingDown ? 'Launch in Progress...' : 'Scan to Launch'}
      </h1>
      
      {/* QR Code Container - Slightly larger during countdown (scale 0.85 instead of 0.75) */}
      <div style={{ 
        background: 'white', 
        padding: isCountingDown ? '1.5rem' : '2.5rem', 
        borderRadius: '24px', 
        boxShadow: '0 0 50px rgba(255,255,255,0.15)',
        transform: isCountingDown ? 'scale(0.85)' : 'scale(1)',
        transition: 'transform 0.4s ease, padding 0.4s ease'
      }}>
        <QRCodeSVG 
          value={launchUrl} 
          size={isCountingDown ? 280 : 360} 
          bgColor="#ffffff"
          fgColor="#0a0a0a"
          level="H" 
        />
      </div>

      {/* Circular Progress Timer Displayed Right Below the QR Code */}
      <div style={{ 
        marginTop: isCountingDown ? '0.5rem' : '1rem', 
        height: '130px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {isCountingDown && (
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
              {/* Background Track Circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#222222"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress Circle that shrinks */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#00ffcc"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
            {/* Countdown Number Inside the Circle */}
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#00ffcc', fontFamily: 'monospace', zIndex: 2 }}>
              {displayText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}