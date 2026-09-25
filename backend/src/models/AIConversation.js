import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  attachments: [
    {
      fileName: String,
      fileType: String,
      mimeType: String,
      base64Data: String,
      textContent: String,
      size: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
    },
    messages: [aiMessageSchema],
  },
  {
    timestamps: true,
  }
);

// Index for listing user's conversations quickly by latest update
aiConversationSchema.index({ user: 1, updatedAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);
export default AIConversation;
