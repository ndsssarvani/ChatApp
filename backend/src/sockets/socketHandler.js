import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import Call from '../models/Call.js';

export const setupSocketHandlers = (io) => {
  // Map of userId (string) -> Set of socketIds
  const onlineUsers = new Map();
  // Map of userId (string) -> current active call details { callId, peerId, callType }
  const userActiveCalls = new Map();

  io.on('connection', (socket) => {
    let currentUserId = null;

    // 1. User setup & presence
    socket.on('setup', async (userId) => {
      if (!userId) return;
      currentUserId = userId.toString();
      socket.join(currentUserId);

      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      try {
        await User.findByIdAndUpdate(currentUserId, { isOnline: true, lastSeen: new Date() });
      } catch (err) {
        console.error('[Socket] Error updating online status:', err.message);
      }

      // Broadcast to all clients that this user is online
      io.emit('user_status_changed', {
        userId: currentUserId,
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
      socket.join(conversationId.toString());
    });

    // 3. Leave conversation room
    socket.on('leave_chat', (conversationId) => {
      if (!conversationId) return;
      socket.leave(conversationId.toString());
    });

    // 4. Typing indicators
    socket.on('typing', ({ conversationId, userName, userId }) => {
      if (!conversationId) return;
      socket.to(conversationId.toString()).emit('typing', { conversationId, userName, userId });
    });

    socket.on('stop_typing', ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.to(conversationId.toString()).emit('stop_typing', { conversationId, userId });
    });

    // 5. New message delivery & broadcast
    socket.on('send_message', async (message) => {
      if (!message || !message.conversationId) return;

      const convId = typeof message.conversationId === 'object'
        ? message.conversationId._id
        : message.conversationId;

      // Broadcast message to everyone in the conversation room
      socket.to(convId.toString()).emit('message_received', message);

      // Create in-app notification for participants
      try {
        const conversation = await Conversation.findById(convId);
        if (conversation) {
          const senderId = (message.sender?._id || message.sender)?.toString();
          const senderName = message.sender?.name || 'Someone';

          for (const participantId of conversation.participants) {
            const pIdStr = participantId.toString();
            if (pIdStr !== senderId) {
              const previewText = message.messageType === 'voice'
                ? '🎤 Sent a voice message'
                : message.text || (message.attachments?.length ? '📎 Sent an attachment' : 'Sent a message');

              const notification = await Notification.create({
                recipient: participantId,
                sender: senderId,
                type: 'message',
                message: conversation.isGroup
                  ? `${senderName} in ${conversation.groupName}: ${previewText}`
                  : `${senderName}: ${previewText}`,
                conversation: convId,
              });

              const populatedNotif = await Notification.findById(notification._id)
                .populate('sender', 'name username avatar phoneNumber')
                .populate('conversation', 'groupName isGroup');

              io.to(pIdStr).emit('notification_received', populatedNotif);
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
      socket.to(conversationId.toString()).emit('messages_read', { conversationId, userId });
    });

    // 7. Message Edited or Deleted
    socket.on('message_updated', ({ conversationId, message }) => {
      if (!conversationId) return;
      socket.to(conversationId.toString()).emit('message_updated', message);
    });

    socket.on('message_deleted', ({ conversationId, messageId }) => {
      if (!conversationId) return;
      socket.to(conversationId.toString()).emit('message_deleted', { messageId });
    });

    // 8. Group updates
    socket.on('group_updated', (groupData) => {
      if (!groupData || !groupData._id) return;
      io.to(groupData._id.toString()).emit('group_updated', groupData);
    });

    // ==========================================
    // 9. CALL SIGNALING & REAL-TIME WEBRTC
    // ==========================================

    // Initiate call (User A calling User B)
    socket.on('call:initiate', async (data) => {
      const { receiverId, callType, caller, conversationId } = data;
      if (!receiverId || !caller || !caller._id) return;

      const receiverIdStr = receiverId.toString();
      const callerIdStr = caller._id.toString();

      // Check if blocked
      try {
        const [callerUser, receiverUser] = await Promise.all([
          User.findById(callerIdStr).select('blockedUsers'),
          User.findById(receiverIdStr).select('blockedUsers'),
        ]);

        if (callerUser?.blockedUsers?.some((id) => id.toString() === receiverIdStr)) {
          socket.emit('call:unavailable', {
            receiverId: receiverIdStr,
            reason: 'You have blocked this user.',
          });
          return;
        }

        if (receiverUser?.blockedUsers?.some((id) => id.toString() === callerIdStr)) {
          socket.emit('call:unavailable', {
            receiverId: receiverIdStr,
            reason: 'User is unavailable.',
          });
          return;
        }
      } catch (err) {
        console.error('[Socket Call] Error checking blocked users:', err);
      }

      // Check if receiver is online
      const isReceiverOnline = onlineUsers.has(receiverIdStr) && onlineUsers.get(receiverIdStr).size > 0;

      if (!isReceiverOnline) {
        // Receiver is offline
        socket.emit('call:unavailable', {
          receiverId: receiverIdStr,
          reason: 'User is currently offline',
        });

        // Create a missed call record and notification
        try {
          const callRecord = await Call.create({
            caller: callerIdStr,
            receiver: receiverIdStr,
            callType: callType || 'audio',
            status: 'missed',
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
          });

          const notif = await Notification.create({
            recipient: receiverIdStr,
            sender: callerIdStr,
            type: 'missed_call',
            message: `Missed ${callType === 'video' ? 'video' : 'audio'} call from ${caller.name || 'someone'}`,
            conversation: conversationId || null,
          });

          const populatedNotif = await Notification.findById(notif._id)
            .populate('sender', 'name username avatar phoneNumber')
            .populate('conversation', 'groupName isGroup');

          io.to(receiverIdStr).emit('notification_received', populatedNotif);
        } catch (e) {
          console.error('[Socket Call] Error logging offline missed call:', e);
        }
        return;
      }

      // Check if receiver is already in a call
      if (userActiveCalls.has(receiverIdStr)) {
        socket.emit('call:busy', {
          receiverId: receiverIdStr,
          reason: 'User is on another call',
        });
        return;
      }

      // Create a pending call record in DB
      let callRecordId = null;
      try {
        const callRecord = await Call.create({
          caller: callerIdStr,
          receiver: receiverIdStr,
          callType: callType || 'audio',
          status: 'missed', // will update to completed on answer/end
          startTime: new Date(),
          duration: 0,
        });
        callRecordId = callRecord._id;
      } catch (err) {
        console.error('[Socket Call] Error creating initial call log:', err);
      }

      // Register active call session
      userActiveCalls.set(callerIdStr, { callId: callRecordId, peerId: receiverIdStr, callType, role: 'caller' });
      userActiveCalls.set(receiverIdStr, { callId: callRecordId, peerId: callerIdStr, callType, role: 'receiver' });

      // Emit incoming call directly to receiver's personal room
      io.to(receiverIdStr).emit('call:incoming', {
        callId: callRecordId,
        caller: {
          _id: callerIdStr,
          name: caller.name,
          username: caller.username,
          avatar: caller.avatar,
          phoneNumber: caller.phoneNumber,
        },
        callType: callType || 'audio',
        conversationId,
        timestamp: new Date(),
      });
    });

    // Receiver accepts call
    socket.on('call:accept', async ({ callerId, callId }) => {
      const callerIdStr = callerId?.toString();
      if (!callerIdStr) return;

      // Update call status in database to completed/in-progress
      if (callId) {
        try {
          await Call.findByIdAndUpdate(callId, { status: 'completed', startTime: new Date() });
        } catch (err) {
          console.error('[Socket Call] Error updating accepted call status:', err);
        }
      }

      // Notify caller that receiver accepted
      io.to(callerIdStr).emit('call:accepted', {
        callId,
        receiverId: currentUserId,
      });
    });

    // Receiver rejects call
    socket.on('call:reject', async ({ callerId, callId, reason }) => {
      const callerIdStr = callerId?.toString();
      if (!callerIdStr) return;

      if (callId) {
        try {
          await Call.findByIdAndUpdate(callId, { status: 'rejected', endTime: new Date(), duration: 0 });
        } catch (err) {
          console.error('[Socket Call] Error updating rejected call:', err);
        }
      }

      // Clear active call state
      userActiveCalls.delete(callerIdStr);
      if (currentUserId) userActiveCalls.delete(currentUserId);

      // Notify caller that call was rejected
      io.to(callerIdStr).emit('call:rejected', {
        callId,
        reason: reason || 'Call declined',
      });
    });

    // Caller cancels before receiver answers
    socket.on('call:cancel', async ({ receiverId, callId, callType, callerName }) => {
      const receiverIdStr = receiverId?.toString();
      if (!receiverIdStr) return;

      if (callId) {
        try {
          await Call.findByIdAndUpdate(callId, { status: 'missed', endTime: new Date(), duration: 0 });
          // Create missed call notification for receiver
          if (currentUserId) {
            const notif = await Notification.create({
              recipient: receiverIdStr,
              sender: currentUserId,
              type: 'missed_call',
              message: `Missed ${callType === 'video' ? 'video' : 'audio'} call from ${callerName || 'someone'}`,
            });
            const populatedNotif = await Notification.findById(notif._id)
              .populate('sender', 'name username avatar phoneNumber');
            io.to(receiverIdStr).emit('notification_received', populatedNotif);
          }
        } catch (err) {
          console.error('[Socket Call] Error cancelling call:', err);
        }
      }

      // Clear active call state
      if (currentUserId) userActiveCalls.delete(currentUserId);
      userActiveCalls.delete(receiverIdStr);

      // Notify receiver that caller hung up
      io.to(receiverIdStr).emit('call:cancelled', { callId });
    });

    // End active call
    socket.on('call:ended', async ({ targetUserId, callId, duration }) => {
      const targetStr = targetUserId?.toString();

      if (callId) {
        try {
          await Call.findByIdAndUpdate(callId, {
            status: 'completed',
            endTime: new Date(),
            duration: duration || 0,
          });
        } catch (err) {
          console.error('[Socket Call] Error finalizing ended call:', err);
        }
      }

      // Clear active call state
      if (currentUserId) userActiveCalls.delete(currentUserId);
      if (targetStr) userActiveCalls.delete(targetStr);

      if (targetStr) {
        io.to(targetStr).emit('call:ended', { callId, duration });
      }
    });

    // WebRTC Offer
    socket.on('call:offer', ({ targetUserId, offer }) => {
      if (!targetUserId || !offer) return;
      io.to(targetUserId.toString()).emit('call:offer', {
        offer,
        senderId: currentUserId,
      });
    });

    // WebRTC Answer
    socket.on('call:answer', ({ targetUserId, answer }) => {
      if (!targetUserId || !answer) return;
      io.to(targetUserId.toString()).emit('call:answer', {
        answer,
        senderId: currentUserId,
      });
    });

    // WebRTC ICE Candidate
    socket.on('call:ice-candidate', ({ targetUserId, candidate }) => {
      if (!targetUserId || !candidate) return;
      io.to(targetUserId.toString()).emit('call:ice-candidate', {
        candidate,
        senderId: currentUserId,
      });
    });

    // 10. Disconnect handling
    socket.on('disconnect', async () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);

        // If user was in an active call, notify the other peer
        if (userActiveCalls.has(currentUserId)) {
          const callData = userActiveCalls.get(currentUserId);
          if (callData?.peerId) {
            io.to(callData.peerId).emit('call:ended', {
              callId: callData.callId,
              reason: 'User disconnected',
            });
            userActiveCalls.delete(callData.peerId);
          }
          userActiveCalls.delete(currentUserId);
        }

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
