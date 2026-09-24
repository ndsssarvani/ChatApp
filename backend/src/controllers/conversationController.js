import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get all conversations for current user
// @route   GET /api/conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name username email avatar isOnline lastSeen phoneNumber')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name avatar',
        },
      })
      .populate('admins', 'name username email avatar')
      .sort({ updatedAt: -1 });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
          deletedFor: { $ne: req.user._id },
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        return convObj;
      })
    );

    res.status(200).json({ success: true, conversations: conversationsWithUnread });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get or create 1-to-1 conversation
// @route   POST /api/conversations/one-to-one
export const getOrCreateOneToOne = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot create conversation with yourself' });
    }

    // Check if recipient has blocked user or vice versa
    const currentUser = await User.findById(req.user._id);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient user not found' });
    }

    if (currentUser.blockedUsers.includes(recipientId)) {
      return res.status(400).json({ success: false, message: 'You have blocked this user' });
    }

    if (recipient.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You cannot message this user' });
    }

    // Find existing 1-on-1 conversation
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, recipientId], $size: 2 },
    })
      .populate('participants', 'name username email avatar isOnline lastSeen phoneNumber')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
        isGroup: false,
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'name username email avatar isOnline lastSeen phoneNumber'
      );
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create group conversation
// @route   POST /api/conversations/group
export const createGroup = async (req, res) => {
  try {
    const { name, members, description, avatar } = req.body;

    if (!name || !members || !Array.isArray(members) || members.length < 1) {
      return res.status(400).json({ success: false, message: 'Please provide group name and at least 1 member' });
    }

    // Ensure current user is in participants
    const participants = Array.from(new Set([...members, req.user._id.toString()]));

    const groupAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;

    let conversation = await Conversation.create({
      participants,
      isGroup: true,
      groupName: name,
      groupDescription: description || '',
      groupAvatar,
      admins: [req.user._id],
    });

    // Create system message
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      messageType: 'system',
      text: `${req.user.name} created the group "${name}"`,
    });

    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name username email avatar isOnline lastSeen phoneNumber')
      .populate('admins', 'name username email avatar')
      .populate('lastMessage');

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update group conversation details
// @route   PUT /api/conversations/:id/group
export const updateGroup = async (req, res) => {
  try {
    const { groupName, groupDescription, groupAvatar } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is participant or admin
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    if (groupName) conversation.groupName = groupName;
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription;
    if (groupAvatar) conversation.groupAvatar = groupAvatar;

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'name username email avatar isOnline lastSeen phoneNumber')
      .populate('admins', 'name username email avatar')
      .populate('lastMessage');

    res.status(200).json({ success: true, conversation: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add members to group
// @route   POST /api/conversations/:id/members
export const addGroupMembers = async (req, res) => {
  try {
    const { members } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    if (!conversation.admins.some((a) => a.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'Only group admins can add members' });
    }

    const currentParticipants = conversation.participants.map((p) => p.toString());
    const newMembers = members.filter((m) => !currentParticipants.includes(m));

    conversation.participants.push(...newMembers);
    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'name username email avatar isOnline lastSeen phoneNumber')
      .populate('admins', 'name username email avatar');

    res.status(200).json({ success: true, conversation: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove member or leave group
// @route   DELETE /api/conversations/:id/members/:userId
export const removeGroupMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isSelfLeaving = req.user._id.toString() === userId;
    const isAdmin = conversation.admins.some((a) => a.toString() === req.user._id.toString());

    if (!isSelfLeaving && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can remove other members' });
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== userId);
    conversation.admins = conversation.admins.filter((a) => a.toString() !== userId);

    // If no admins left and members exist, promote the first member
    if (conversation.admins.length === 0 && conversation.participants.length > 0) {
      conversation.admins.push(conversation.participants[0]);
    }

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'name username email avatar isOnline lastSeen phoneNumber')
      .populate('admins', 'name username email avatar');

    res.status(200).json({ success: true, conversation: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Configure temporary chat timer
// @route   PUT /api/conversations/:id/temporary
export const setTemporaryTimer = async (req, res) => {
  try {
    const { isTemporary, timerHours } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    conversation.isTemporary = !!isTemporary;
    if (timerHours) conversation.temporaryTimerHours = timerHours;
    await conversation.save();

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a specific conversation
// @route   DELETE /api/conversations/:id
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId: conversation._id });

    // Delete the conversation record
    await Conversation.findByIdAndDelete(conversation._id);

    res.status(200).json({ success: true, message: 'Chat deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

