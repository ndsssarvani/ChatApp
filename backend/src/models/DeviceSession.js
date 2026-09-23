import mongoose from 'mongoose';

const deviceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    device: {
      type: String,
      default: 'Desktop Browser',
    },
    browser: {
      type: String,
      default: 'Chrome',
    },
    os: {
      type: String,
      default: 'Windows',
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    token: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const DeviceSession = mongoose.model('DeviceSession', deviceSessionSchema);
export default DeviceSession;
