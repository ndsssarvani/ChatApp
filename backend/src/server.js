import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

// Load env
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

