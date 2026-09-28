import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Helper to populate conversation consistently
const populateConversationQuery = (query) => {
  return query
    .populate('participants', 'name username email avatar isOnline lastSeen phoneNumber')
    .populate('admins', 'name username email avatar')
    .populate('groupOwner', 'name username email avatar')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'name avatar username',
      },
    });
};

// @desc    Get all conversations for current user
// @route   GET /api/conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await populateConversationQuery(
      Conversation.find({ participants: req.user._id })
    ).sort({ updatedAt: -1 });

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
    let conversation = await populateConversationQuery(
      Conversation.findOne({
        isGroup: false,
        participants: { $all: [req.user._id, recipientId], $size: 2 },
      })
    );

    if (!conversation) {
      const created = await Conversation.create({
        participants: [req.user._id, recipientId],
        isGroup: false,
      });

      conversation = await populateConversationQuery(Conversation.findById(created._id));
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

    // Ensure current user is in participants and validate member ids
    const validMemberIds = members.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const participants = Array.from(new Set([...validMemberIds, req.user._id.toString()]));

    const groupAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
    const inviteToken = crypto.randomBytes(16).toString('hex');

    let conversation = await Conversation.create({
      participants,
      isGroup: true,
      groupName: name.trim(),
      groupDescription: description ? description.trim() : '',
      groupAvatar,
      groupOwner: req.user._id,
      admins: [req.user._id],
      inviteToken,
      inviteEnabled: true,
      inviteCreatedBy: req.user._id,
      inviteCreatedAt: new Date(),
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

    conversation = await populateConversationQuery(Conversation.findById(conversation._id));

    // Emit socket event to all members
    const io = req.app.get('io');
    if (io) {
      participants.forEach((pId) => {
        io.to(pId.toString()).emit('group_updated', conversation);
      });
    }

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

    if (groupName) conversation.groupName = groupName.trim();
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription.trim();
    if (groupAvatar) conversation.groupAvatar = groupAvatar;

    await conversation.save();

    const updated = await populateConversationQuery(Conversation.findById(conversation._id));

    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('group_updated', updated);
    }

    res.status(200).json({ success: true, conversation: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add members to group
// @route   POST /api/conversations/:id/members
export const addGroupMembers = async (req, res) => {
  try {
    const userIdsToAdd = req.body.userIds || req.body.members;

    if (!userIdsToAdd || !Array.isArray(userIdsToAdd) || userIdsToAdd.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide user IDs to add' });
    }

    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Permission check: Owner or Admin
    const isOwner = conversation.groupOwner
      ? conversation.groupOwner.toString() === req.user._id.toString()
      : conversation.admins[0]?.toString() === req.user._id.toString();
    const isAdmin = conversation.admins?.some((a) => a.toString() === req.user._id.toString());

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins or owner can add members' });
    }

    // Filter valid MongoDB ObjectIds
    const validIds = userIdsToAdd.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid user IDs provided' });
    }

    // Verify all users exist in the database
    const foundUsers = await User.find({ _id: { $in: validIds } }).select('name username avatar email isOnline lastSeen phoneNumber');
    if (foundUsers.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid users found to add' });
    }

    // Prevent duplicate members
    const currentParticipantSet = new Set(conversation.participants.map((p) => p.toString()));
    const newUsersToAdd = foundUsers.filter((u) => !currentParticipantSet.has(u._id.toString()));

    if (newUsersToAdd.length === 0) {
      const currentPopulated = await populateConversationQuery(Conversation.findById(conversation._id));
      return res.status(200).json({
        success: true,
        message: 'All selected users are already members of this group',
        conversation: currentPopulated,
      });
    }

    // Add unique non-existing members
    newUsersToAdd.forEach((u) => {
      conversation.participants.push(u._id);
    });

    // Create system message
    const addedNames = newUsersToAdd.map((u) => u.name).join(', ');
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      messageType: 'system',
      text: `${req.user.name} added ${addedNames} to the group`,
    });

    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    const populatedUpdated = await populateConversationQuery(Conversation.findById(conversation._id));
    const populatedSystemMsg = await Message.findById(systemMessage._id).populate('sender', 'name avatar username');

    // Realtime Socket.IO notifications
    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('group_updated', populatedUpdated);
      io.to(conversation._id.toString()).emit('message_received', populatedSystemMsg);
      // Notify newly added users to refresh their conversation list immediately
      newUsersToAdd.forEach((u) => {
        io.to(u._id.toString()).emit('group_updated', populatedUpdated);
      });
    }

    res.status(200).json({
      success: true,
      message: `Added ${newUsersToAdd.length} member(s) successfully`,
      conversation: populatedUpdated,
    });
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
    const isOwner = conversation.groupOwner
      ? conversation.groupOwner.toString() === req.user._id.toString()
      : conversation.admins[0]?.toString() === req.user._id.toString();
    const isAdmin = conversation.admins?.some((a) => a.toString() === req.user._id.toString());

    if (!isSelfLeaving && !isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Only group admins or owner can remove other members' });
    }

    // Owner cannot be removed
    const targetIsOwner = conversation.groupOwner
      ? conversation.groupOwner.toString() === userId
      : conversation.admins[0]?.toString() === userId;

    if (!isSelfLeaving && targetIsOwner) {
      return res.status(403).json({ success: false, message: 'The group owner cannot be removed' });
    }

    // An admin cannot remove another admin unless they are the owner
    const targetIsAdmin = conversation.admins?.some((a) => a.toString() === userId);
    if (!isSelfLeaving && targetIsAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Only the group owner can remove an admin' });
    }

    const userToRemove = await User.findById(userId).select('name');
    const removedName = userToRemove?.name || 'A member';

    conversation.participants = conversation.participants.filter((p) => p.toString() !== userId);
    conversation.admins = conversation.admins.filter((a) => a.toString() !== userId);

    // If owner left and there are still members, assign new owner
    if (isSelfLeaving && targetIsOwner && conversation.participants.length > 0) {
      conversation.groupOwner = conversation.participants[0];
      if (!conversation.admins.some((a) => a.toString() === conversation.participants[0].toString())) {
        conversation.admins.push(conversation.participants[0]);
      }
    }

    // If no admins left and members exist, promote the first member to admin
    if (conversation.admins.length === 0 && conversation.participants.length > 0) {
      conversation.admins.push(conversation.participants[0]);
    }

    // Create system message
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      messageType: 'system',
      text: isSelfLeaving
        ? `${req.user.name} left the group`
        : `${req.user.name} removed ${removedName} from the group`,
    });

    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    const updated = await populateConversationQuery(Conversation.findById(conversation._id));
    const populatedSystemMsg = await Message.findById(systemMessage._id).populate('sender', 'name avatar username');

    // Realtime Socket.IO emit
    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('group_updated', updated);
      io.to(conversation._id.toString()).emit('message_received', populatedSystemMsg);
      io.to(userId.toString()).emit('group_removed', { conversationId: conversation._id });
    }

    res.status(200).json({ success: true, message: 'Member removed successfully', conversation: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get or generate invite link
// @route   GET /api/conversations/:id/invite
export const getOrCreateInviteLink = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOwner = conversation.groupOwner
      ? conversation.groupOwner.toString() === req.user._id.toString()
      : conversation.admins[0]?.toString() === req.user._id.toString();
    const isAdmin = conversation.admins?.some((a) => a.toString() === req.user._id.toString());
    const isParticipant = conversation.participants.some((p) => p.toString() === req.user._id.toString());

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins or owner can access invite links' });
    }

    if (!conversation.inviteToken) {
      conversation.inviteToken = crypto.randomBytes(16).toString('hex');
      conversation.inviteEnabled = true;
      conversation.inviteCreatedBy = req.user._id;
      conversation.inviteCreatedAt = new Date();
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      inviteToken: conversation.inviteToken,
      inviteEnabled: conversation.inviteEnabled !== false,
      inviteExpiresAt: conversation.inviteExpiresAt,
      inviteCreatedAt: conversation.inviteCreatedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Regenerate invite link (invalidates previous token)
// @route   POST /api/conversations/:id/invite/regenerate
export const regenerateInviteLink = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOwner = conversation.groupOwner
      ? conversation.groupOwner.toString() === req.user._id.toString()
      : conversation.admins[0]?.toString() === req.user._id.toString();
    const isAdmin = conversation.admins?.some((a) => a.toString() === req.user._id.toString());

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins or owner can regenerate invite links' });
    }

    // Generate fresh cryptographically secure token
    conversation.inviteToken = crypto.randomBytes(16).toString('hex');
    conversation.inviteEnabled = true;
    conversation.inviteCreatedBy = req.user._id;
    conversation.inviteCreatedAt = new Date();
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Invite link regenerated successfully',
      inviteToken: conversation.inviteToken,
      inviteEnabled: conversation.inviteEnabled,
      inviteExpiresAt: conversation.inviteExpiresAt,
      inviteCreatedAt: conversation.inviteCreatedAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle or update invite status (enable/disable)
// @route   PUT /api/conversations/:id/invite/status
export const toggleInviteStatus = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isOwner = conversation.groupOwner
      ? conversation.groupOwner.toString() === req.user._id.toString()
      : conversation.admins[0]?.toString() === req.user._id.toString();
    const isAdmin = conversation.admins?.some((a) => a.toString() === req.user._id.toString());

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins or owner can manage invite link status' });
    }

    const { enabled } = req.body;
    conversation.inviteEnabled = enabled !== undefined ? !!enabled : !conversation.inviteEnabled;
    await conversation.save();

    res.status(200).json({
      success: true,
      inviteEnabled: conversation.inviteEnabled,
      message: conversation.inviteEnabled ? 'Invite link enabled' : 'Invite link disabled',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get group invitation information by token (Public / semi-authenticated)
// @route   GET /api/conversations/invite/:token
export const getInviteInfo = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invite token is required' });
    }

    const conversation = await Conversation.findOne({ inviteToken: token, isGroup: true })
      .populate('participants', 'name username avatar')
      .populate('groupOwner', 'name username avatar');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: 'This invitation link is invalid or no longer exists.',
      });
    }

    const isExpired = conversation.inviteExpiresAt && new Date() > conversation.inviteExpiresAt;
    if (isExpired) {
      return res.status(200).json({
        success: true,
        isValid: false,
        isExpired: true,
        message: 'This invitation link has expired.',
        group: {
          groupName: conversation.groupName,
          groupAvatar: conversation.groupAvatar,
        },
      });
    }

    if (!conversation.inviteEnabled) {
      return res.status(200).json({
        success: true,
        isValid: false,
        isEnabled: false,
        message: 'This invitation link is no longer active.',
        group: {
          groupName: conversation.groupName,
          groupAvatar: conversation.groupAvatar,
        },
      });
    }

    // Check optional authentication to detect if user is already a member
    let isMember = false;
    let loggedInUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const tokenStr = authHeader.split(' ')[1];
        const decoded = jwt.verify(tokenStr, process.env.JWT_SECRET || 'secret');
        loggedInUserId = decoded.id || decoded.userId || decoded._id;
        if (loggedInUserId) {
          isMember = conversation.participants.some(
            (p) => (p._id || p).toString() === loggedInUserId.toString()
          );
        }
      } catch (e) {
        // Token invalid or expired - ignore for public query
      }
    }

    res.status(200).json({
      success: true,
      isValid: true,
      isEnabled: true,
      isExpired: false,
      isMember,
      group: {
        _id: conversation._id,
        groupName: conversation.groupName,
        groupAvatar: conversation.groupAvatar,
        groupDescription: conversation.groupDescription || '',
        memberCount: conversation.participants.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join group via invite token
// @route   POST /api/conversations/invite/:token/join
export const joinGroupViaInvite = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invite token is required' });
    }

    const conversation = await Conversation.findOne({ inviteToken: token, isGroup: true });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Invalid or non-existent invitation link' });
    }

    if (!conversation.inviteEnabled) {
      return res.status(400).json({ success: false, message: 'This invitation link is no longer active' });
    }

    if (conversation.inviteExpiresAt && new Date() > conversation.inviteExpiresAt) {
      return res.status(400).json({ success: false, message: 'This invitation link has expired' });
    }

    // Check if user is already a member
    const isAlreadyMember = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (isAlreadyMember) {
      const populatedConv = await populateConversationQuery(Conversation.findById(conversation._id));
      return res.status(200).json({
        success: true,
        alreadyMember: true,
        message: "You're already a member of this group.",
        conversation: populatedConv,
      });
    }

    // Add user to participants
    conversation.participants.push(req.user._id);

    // Create system message
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      messageType: 'system',
      text: `${req.user.name} joined the group via invite link`,
    });

    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    const populatedConv = await populateConversationQuery(Conversation.findById(conversation._id));
    const populatedSystemMsg = await Message.findById(systemMessage._id).populate('sender', 'name avatar username');

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io) {
      io.to(conversation._id.toString()).emit('group_updated', populatedConv);
      io.to(conversation._id.toString()).emit('message_received', populatedSystemMsg);
      io.to(req.user._id.toString()).emit('group_updated', populatedConv);
    }

    res.status(200).json({
      success: true,
      alreadyMember: false,
      message: `Welcome to ${conversation.groupName}!`,
      conversation: populatedConv,
    });
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
