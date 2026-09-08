import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.DEV 
  ? `http://${window.location.hostname}:5000` 
  : import.meta.env.VITE_BACKEND_URL;

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling']
});

export default function LaunchPage() {
  const [status, setStatus] = useState('IDLE');
  const [displayText, setDisplayText] = useState('');
  const [progress, setProgress] = useState(1);
  const [timeOffset, setTimeOffset] = useState(0);
  const [launchParams, setLaunchParams] = useState({ startTime: null, duration: 11000 });

  useEffect(() => {
    // When a user opens the phone page, trigger the launch sequence on the server
    socket.emit('trigger-launch');

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
    let intervalId;
    if (status === 'COUNTDOWN' && launchParams.startTime) {
      intervalId = setInterval(() => {
        const syncedNow = Date.now() + timeOffset;
        const totalDuration = launchParams.duration || 11000;
        const remainingMs = (launchParams.startTime + totalDuration) - syncedNow;
        
        const secondsLeft = Math.ceil(remainingMs / 1000);
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

  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: '#0a0a0a', 
      color: '#fff', 
      textAlign: 'center', 
      padding: '2rem' 
    }}>
      {status === 'IDLE' || status === 'COUNTDOWN' ? (
        <>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Launching VulcanPrep
          </h1>

          {/* Circular Progress Timer on Mobile */}
          <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <svg width="150" height="150" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
              <circle
                cx="75"
                cy="75"
                r={radius}
                stroke="#222222"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="75"
                cy="75"
                r={radius}
                stroke="#00ffcc"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
            <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#00ffcc', fontFamily: 'monospace', zIndex: 2 }}>
              {displayText || '10'}
            </div>
          </div>

          <p style={{ fontSize: '1rem', color: '#777', marginTop: '2rem' }}>
            Keep your eyes on the big screen!
          </p>
        </>
      ) : (
        <>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#fff' }}>
            You have successfully launched the website!
          </h1>
          <p style={{ fontSize: '1rem', color: '#aaa' }}>
            Look at the LED screen to see the live reveal.
          </p>
        </>
      )}
    </div>
  );
}