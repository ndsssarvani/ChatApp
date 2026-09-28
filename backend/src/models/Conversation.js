import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: '',
      trim: true,
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    groupDescription: {
      type: String,
      default: '',
      trim: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    inviteToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    inviteEnabled: {
      type: Boolean,
      default: true,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    inviteCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    inviteCreatedAt: {
      type: Date,
      default: Date.now,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    temporaryTimerHours: {
      type: Number,
      default: 24, // default 24 hours if temporary
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ inviteToken: 1 }, { sparse: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
