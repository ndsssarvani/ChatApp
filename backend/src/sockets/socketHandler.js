import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';

export const setupSocketHandlers = (io) => {
  // Map of userId -> Set of socketIds
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    let currentUserId = null;

    // 1. User setup & presence
    socket.on('setup', async (userId) => {
      if (!userId) return;
      currentUserId = userId;
      socket.join(userId);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      } catch (err) {
        console.error('[Socket] Error updating online status:', err.message);
      }

      // Broadcast to all clients that this user is online
      io.emit('user_status_changed', {
        userId,
        isOnline: true,
        lastSeen: new Date(),
      });

      // Send list of all currently online user IDs to this client
      const onlineIds = Array.from(onlineUsers.keys());
      socket.emit('connected_users', onlineIds);
    });

    // 2. Join conversation room
    socket.on('join_chat', (conversationId) => {
      if (!conversationId) return;
      socket.join(conversationId);
    });

    // 3. Leave conversation room
    socket.on('leave_chat', (conversationId) => {
      if (!conversationId) return;
      socket.leave(conversationId);
    });

    // 4. Typing indicators
    socket.on('typing', ({ conversationId, userName, userId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('typing', { conversationId, userName, userId });
    });

    socket.on('stop_typing', ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('stop_typing', { conversationId, userId });
    });

    // 5. New message delivery & broadcast
    socket.on('send_message', async (message) => {
      if (!message || !message.conversationId) return;

      const convId = typeof message.conversationId === 'object'
        ? message.conversationId._id
        : message.conversationId;

      // Broadcast message to everyone in the conversation room
      socket.to(convId.toString()).emit('message_received', message);

      // Create in-app notification for participants not currently active
      try {
        const conversation = await Conversation.findById(convId);
        if (conversation) {
          const senderId = message.sender._id || message.sender;
          const senderName = message.sender.name || 'Someone';

          for (const participantId of conversation.participants) {
            if (participantId.toString() !== senderId.toString()) {
              // Send direct notification to participant's personal room
              const notification = await Notification.create({
                recipient: participantId,
                sender: senderId,
                type: 'message',
                message: conversation.isGroup
                  ? `${senderName} in ${conversation.groupName}: ${message.text || 'sent an attachment'}`
                  : `${senderName}: ${message.text || 'sent an attachment'}`,
                conversation: convId,
              });

              const populatedNotif = await Notification.findById(notification._id)
                .populate('sender', 'name username avatar')
                .populate('conversation', 'groupName isGroup');

              io.to(participantId.toString()).emit('notification_received', populatedNotif);
            }
          }
        }
      } catch (err) {
        console.error('[Socket] Error creating message notification:', err.message);
      }
    });

    // 6. Message Read Receipt
    socket.on('message_read', ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;
      socket.to(conversationId).emit('messages_read', { conversationId, userId });
    });

    // 7. Message Edited or Deleted
    socket.on('message_updated', ({ conversationId, message }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('message_updated', message);
    });

    socket.on('message_deleted', ({ conversationId, messageId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('message_deleted', { messageId });
    });

    // 8. Group updates
    socket.on('group_updated', (groupData) => {
      if (!groupData || !groupData._id) return;
      io.to(groupData._id.toString()).emit('group_updated', groupData);
    });

    // 9. Disconnect handling
    socket.on('disconnect', async () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);
          const now = new Date();
          try {
            await User.findByIdAndUpdate(currentUserId, { isOnline: false, lastSeen: now });
          } catch (err) {
            console.error('[Socket] Error updating offline status:', err.message);
          }

          io.emit('user_status_changed', {
            userId: currentUserId,
            isOnline: false,
            lastSeen: now,
          });
        }
      }
    });
  });
};
