import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';
import { verifyEmailTransport } from './services/emailService.js';
import { checkGeminiConfig } from './services/geminiService.js';

// Load env
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Verify Email transport
verifyEmailTransport();

// Verify Gemini AI configuration
checkGeminiConfig();

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.includes('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      const allowed = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        process.env.CLIENT_URL,
      ].filter(Boolean);
      if (allowed.some((a) => origin.startsWith(a) || a.startsWith(origin))) {
        return callback(null, true);
      }
      callback(new Error(`Socket CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
});

setupSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`[Server] ChatApp Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Guard against unexpected crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server Error] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server Error] Uncaught Exception:', err);
});

