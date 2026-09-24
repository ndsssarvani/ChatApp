import mongoose from 'mongoose';

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    callType: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio',
    },
    status: {
      type: String,
      enum: ['completed', 'missed', 'rejected', 'cancelled', 'busy', 'failed'],
      default: 'completed',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

callSchema.index({ caller: 1, receiver: 1, createdAt: -1 });

const Call = mongoose.model('Call', callSchema);
export default Call;
