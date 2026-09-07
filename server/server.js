import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// --- LAUNCH STATE MACHINE ---
let launchState = 'IDLE'; // 'IDLE' | 'COUNTDOWN' | 'LAUNCHED'
let launchStartTime = null;
const COUNTDOWN_DURATION = 11000; // 1s for "GET READY", 10s for numbers
let countdownTimeout = null;

// Helper to broadcast current state to a specific socket or all clients
const broadcastState = (target = io) => {
  target.emit('sync-state', {
    state: launchState,
    startTime: launchStartTime,
    duration: COUNTDOWN_DURATION,
    serverTime: Date.now(),
  });
};

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Immediately send the current server state to the new client
  broadcastState(socket);

  socket.on('trigger-launch', () => {
    console.log(`[Socket] Launch triggered by ${socket.id}`);
    
    // Prevent multiple launches: only start if currently IDLE
    if (launchState === 'IDLE') {
      launchState = 'COUNTDOWN';
      launchStartTime = Date.now();
      
      console.log('[Server] Transition -> COUNTDOWN');
      broadcastState(); // Broadcast the start to all clients (LEDs)

      // Schedule the transition to LAUNCHED state
      countdownTimeout = setTimeout(() => {
        launchState = 'LAUNCHED';
        console.log('[Server] Transition -> LAUNCHED');
        broadcastState(); // Broadcast final state
      }, COUNTDOWN_DURATION);
    } else {
      console.log('[Server] Ignored launch trigger. System not IDLE.');
      // Update the requesting phone just in case it's out of sync
      broadcastState(socket); 
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// --- DEVELOPMENT RESET ENDPOINT ---
// POST /api/reset-launch resets the server state back to IDLE
app.post('/api/reset-launch', (req, res) => {
  launchState = 'IDLE';
  launchStartTime = null;
  if (countdownTimeout) clearTimeout(countdownTimeout);
  
  console.log('[Server] System RESET to IDLE via API');
  broadcastState(); // Tell all connected screens to reset
  
  res.json({ message: 'Launch state reset successfully', state: launchState });
});

app.get('/', (req, res) => {
  res.send('VulcanPrep Launch Server is running.');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});