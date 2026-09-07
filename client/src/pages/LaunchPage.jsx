import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

// Automatically detect the correct Wi-Fi IP address instead of using localhost
const BACKEND_URL = import.meta.env.DEV 
  ? `http://${window.location.hostname}:5000` 
  : import.meta.env.VITE_BACKEND_URL;

// Allow polling fallback in production for maximum reliability
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling']
});

export default function LaunchPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [systemState, setSystemState] = useState('CONNECTING'); 
  const hasTriggered = useRef(false);

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('sync-state', (data) => setSystemState(data.state));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sync-state');
    };
  }, []);

  useEffect(() => {
    if (isConnected && systemState === 'IDLE' && !hasTriggered.current) {
      hasTriggered.current = true;
      socket.emit('trigger-launch');
    }
  }, [isConnected, systemState]);

  if (systemState === 'COUNTDOWN' || systemState === 'LAUNCHED' || hasTriggered.current) {
    return (
      <div className="page-container">
        <h1 style={{ color: 'var(--accent-color)', fontSize: '2.5rem', lineHeight: '1.2' }}>
          Thank you for launching our website!
        </h1>
        <h2 style={{ marginTop: '2rem', fontSize: '1.25rem' }}>
          Please look at the main screen.
        </h2>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 style={{ fontSize: '2rem' }}>Authenticating...</h1>
      <h2 style={{ color: 'var(--text-secondary)' }}>Connecting to secure server</h2>
    </div>
  );
}