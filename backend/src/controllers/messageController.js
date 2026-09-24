import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
    }

    const now = new Date();

    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: req.user._id },
      $or: [
        { isTemporary: false },
        { isTemporary: true, expiresAt: { $gt: now } },
      ],
    })
      .populate('sender', 'name username email avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name username avatar' },
      })
      .sort({ createdAt: 1 });

    // Mark messages as read by current user
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id, deliveredTo: req.user._id },
        $set: { readAt: new Date() },
      }
    );

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a new message
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, attachments, replyToId, messageType } = req.body;

    if (!conversationId || (!text && (!attachments || attachments.length === 0))) {
      return res.status(400).json({ success: false, message: 'Message text or attachment is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
    }

    // Determine temporary expiration if enabled on conversation
    let isTemporary = conversation.isTemporary;
    let expiresAt = null;
    if (isTemporary) {
      const hours = conversation.temporaryTimerHours || 24;
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    let determinedType = messageType || 'text';
    if (!messageType) {
      if (attachments && attachments.length > 0) {
        const first = attachments[0];
        if (first.type && first.type.startsWith('audio/')) {
          determinedType = 'voice';
        } else if (first.type && first.type.startsWith('image/')) {
          determinedType = 'image';
        } else {
          determinedType = 'file';
        }
      }
    }

    const newMessage = await Message.create({
      conversationId,
      sender: req.user._id,
      messageType: determinedType,
      text: text || '',
      attachments: attachments || [],
      replyTo: replyToId || null,
      deliveredTo: [req.user._id],
      readBy: [req.user._id],
      isTemporary,
      expiresAt,
    });

    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name username email avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name username avatar' },
      });

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forward a message to another conversation
// @route   POST /api/messages/forward
export const forwardMessage = async (req, res) => {
  try {
    const { targetConversationId, messageId } = req.body;

    if (!targetConversationId || !messageId) {
      return res.status(400).json({ success: false, message: 'Target conversation and message ID required' });
    }

    const conversation = await Conversation.findById(targetConversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Target conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Not a member of target conversation' });
    }

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ success: false, message: 'Original message not found' });
    }

    const forwarded = await Message.create({
      conversationId: targetConversationId,
      sender: req.user._id,
      messageType: originalMessage.messageType,
      text: originalMessage.text,
      attachments: originalMessage.attachments,
      deliveredTo: [req.user._id],
      readBy: [req.user._id],
    });

    conversation.lastMessage = forwarded._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    const populated = await Message.findById(forwarded._id)
      .populate('sender', 'name username email avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name username avatar' },
      });

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload message attachment
// @route   POST /api/messages/upload
export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const attachment = {
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
    };

    res.status(200).json({ success: true, attachment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id
export const editMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages' });
    }

    if (message.isDeletedForEveryone) {
      return res.status(400).json({ success: false, message: 'Cannot edit deleted message' });
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const updated = await Message.findById(message._id)
      .populate('sender', 'name username email avatar')
      .populate('replyTo');

    res.status(200).json({ success: true, message: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const { deleteType } = req.query; // 'everyone' or 'me'
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (deleteType === 'everyone') {
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only sender can delete for everyone' });
      }
      message.isDeletedForEveryone = true;
      message.text = 'This message was deleted';
      message.attachments = [];
      await message.save();
    } else {
      // Delete for me
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    }

    res.status(200).json({ success: true, message: 'Message deleted', messageId: message._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle star on message
// @route   POST /api/messages/:id/star
export const toggleStarMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const userIdStr = req.user._id.toString();
    const isStarred = message.starredBy.some((id) => id.toString() === userIdStr);

    if (isStarred) {
      message.starredBy = message.starredBy.filter((id) => id.toString() !== userIdStr);
    } else {
      message.starredBy.push(req.user._id);
    }

    await message.save();
    res.status(200).json({ success: true, isStarred: !isStarred, starredBy: message.starredBy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all starred messages for user
// @route   GET /api/messages/starred
export const getStarredMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      starredBy: req.user._id,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name username email avatar')
      .populate('conversationId', 'groupName isGroup participants')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:id/react
export const addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        // Remove reaction
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Change reaction
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      // Add reaction
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('sender', 'name username email avatar')
      .populate('reactions.user', 'name avatar');

    res.status(200).json({ success: true, reactions: populated.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search messages
// @route   GET /api/messages/search
export const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    let filter = {
      text: { $regex: query, $options: 'i' },
      deletedFor: { $ne: req.user._id },
      isDeletedForEveryone: false,
    };

    if (conversationId) {
      filter.conversationId = conversationId;
    } else {
      // Only search conversations user is part of
      const userConvs = await Conversation.find({ participants: req.user._id }).select('_id');
      const convIds = userConvs.map((c) => c._id);
      filter.conversationId = { $in: convIds };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name username avatar')
      .populate('conversationId', 'groupName isGroup participants')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
