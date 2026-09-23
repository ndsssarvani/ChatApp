import mongoose from 'mongoose';

let isConnecting = false;

export const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatapp', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    isConnecting = false;
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}. Retrying in 5 seconds...`);
    isConnecting = false;
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected. Reconnecting in 5s...');
  setTimeout(() => {
    connectDB();
  }, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection event error:', err.message);
});
