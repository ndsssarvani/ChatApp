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
    // 9. CALL SIGNALING & REAL-TIME WEBRTC (1-TO-1 & GROUP)
    // ==========================================

    // Map of conversationId (string) -> { callId, conversationId, callType, callerId, caller, groupName, participants: Map<userId, { user, isMuted, isVideoOff, joinedAt }>, startTime }
    const activeGroupCalls = new Map();

    // ─── 9A. 1-to-1 Call Signaling ───

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

    // Receiver accepts 1-to-1 call
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

    // Receiver rejects 1-to-1 call
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

    // Caller cancels 1-to-1 call before receiver answers
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

    // End active 1-to-1 call
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

    // WebRTC 1-to-1 Offer
    socket.on('call:offer', ({ targetUserId, offer }) => {
      if (!targetUserId || !offer) return;
      io.to(targetUserId.toString()).emit('call:offer', {
        offer,
        senderId: currentUserId,
      });
    });

    // WebRTC 1-to-1 Answer
    socket.on('call:answer', ({ targetUserId, answer }) => {
      if (!targetUserId || !answer) return;
      io.to(targetUserId.toString()).emit('call:answer', {
        answer,
        senderId: currentUserId,
      });
    });

    // WebRTC 1-to-1 ICE Candidate
    socket.on('call:ice-candidate', ({ targetUserId, candidate }) => {
      if (!targetUserId || !candidate) return;
      io.to(targetUserId.toString()).emit('call:ice-candidate', {
        candidate,
        senderId: currentUserId,
      });
    });

    // ─── 9B. Group Call Signaling ───

    // 1. Check if group call is active in conversation
    socket.on('group-call:get-active', ({ conversationId }) => {
      if (!conversationId) return;
      const convIdStr = conversationId.toString();
      const activeCall = activeGroupCalls.get(convIdStr);
      if (activeCall) {
        socket.emit('group-call:active-changed', {
          conversationId: convIdStr,
          active: true,
          callId: activeCall.callId,
          callType: activeCall.callType,
          groupName: activeCall.groupName,
          participantCount: activeCall.participants.size,
          participants: Array.from(activeCall.participants.values()).map(p => p.user),
        });
      } else {
        socket.emit('group-call:active-changed', {
          conversationId: convIdStr,
          active: false,
        });
      }
    });

    // 2. Initiate a new group call
    socket.on('group-call:initiate', async ({ conversationId, callType, caller }) => {
      if (!conversationId || !caller || !currentUserId) return;
      const convIdStr = conversationId.toString();
      const callerIdStr = currentUserId.toString();

      try {
        const conversation = await Conversation.findById(convIdStr).populate('participants', 'name username avatar phoneNumber');
        if (!conversation || !conversation.isGroup) {
          socket.emit('group-call:error', { message: 'Group conversation not found.' });
          return;
        }

        // Verify caller is a group member
        const isMember = conversation.participants.some(p => p._id.toString() === callerIdStr);
        if (!isMember) {
          socket.emit('group-call:error', { message: 'You are not a member of this group.' });
          return;
        }

        // If a call is already active, return the existing active call so user can join
        if (activeGroupCalls.has(convIdStr)) {
          const existing = activeGroupCalls.get(convIdStr);
          socket.emit('group-call:already-active', {
            callId: existing.callId,
            conversationId: convIdStr,
            callType: existing.callType,
          });
          return;
        }

        // Create group call record in database
        const callRecord = await Call.create({
          caller: callerIdStr,
          isGroup: true,
          conversation: convIdStr,
          callType: callType || 'audio',
          status: 'active',
          participants: [callerIdStr],
          startTime: new Date(),
          duration: 0,
        });

        const callerInfo = {
          _id: callerIdStr,
          name: caller.name || user?.name || 'User',
          username: caller.username,
          avatar: caller.avatar,
        };

        const participantsMap = new Map();
        participantsMap.set(callerIdStr, {
          user: callerInfo,
          isMuted: false,
          isVideoOff: callType === 'audio',
          joinedAt: new Date(),
        });

        const groupCallSession = {
          callId: callRecord._id.toString(),
          conversationId: convIdStr,
          callType: callType || 'audio',
          callerId: callerIdStr,
          caller: callerInfo,
          groupName: conversation.groupName,
          participants: participantsMap,
          startTime: new Date(),
        };

        activeGroupCalls.set(convIdStr, groupCallSession);
        userActiveCalls.set(callerIdStr, { isGroup: true, conversationId: convIdStr, callId: callRecord._id.toString() });

        // Confirm to the caller that the session has started
        socket.emit('group-call:started', {
          callId: callRecord._id.toString(),
          conversationId: convIdStr,
          callType: callType || 'audio',
          groupName: conversation.groupName,
          participants: Array.from(participantsMap.values()),
        });

        // Broadcast active status banner to the entire conversation room
        io.to(convIdStr).emit('group-call:active-changed', {
          conversationId: convIdStr,
          active: true,
          callId: callRecord._id.toString(),
          callType: callType || 'audio',
          groupName: conversation.groupName,
          participantCount: 1,
          participants: [callerInfo],
        });

        // Notify other eligible group members who are online with an incoming group call invite
        for (const member of conversation.participants) {
          const memberIdStr = member._id.toString();
          if (memberIdStr !== callerIdStr) {
            io.to(memberIdStr).emit('group-call:incoming', {
              callId: callRecord._id.toString(),
              conversationId: convIdStr,
              callType: callType || 'audio',
              groupName: conversation.groupName,
              caller: callerInfo,
              timestamp: new Date(),
            });
          }
        }
      } catch (err) {
        console.error('[Socket Group Call] Error initiating group call:', err);
        socket.emit('group-call:error', { message: 'Failed to start group call' });
      }
    });

    // 3. Join an active group call
    socket.on('group-call:join', async ({ conversationId, user: joiningUser }) => {
      if (!conversationId || !currentUserId) return;
      const convIdStr = conversationId.toString();
      const userIdStr = currentUserId.toString();

      try {
        const session = activeGroupCalls.get(convIdStr);
        if (!session) {
          socket.emit('group-call:error', { message: 'No active group call found.' });
          return;
        }

        const conversation = await Conversation.findById(convIdStr);
        if (!conversation || !conversation.participants.some(p => p.toString() === userIdStr)) {
          socket.emit('group-call:error', { message: 'You are not authorized to join this group call.' });
          return;
        }

        const participantData = {
          user: {
            _id: userIdStr,
            name: joiningUser?.name || 'User',
            username: joiningUser?.username,
            avatar: joiningUser?.avatar,
          },
          isMuted: false,
          isVideoOff: session.callType === 'audio',
          joinedAt: new Date(),
        };

        // Existing participants list to return to the new joiner
        const existingParticipants = Array.from(session.participants.values());

        // Add joining user to the session
        session.participants.set(userIdStr, participantData);
        userActiveCalls.set(userIdStr, { isGroup: true, conversationId: convIdStr, callId: session.callId });

        // Update DB call record with new participant
        await Call.findByIdAndUpdate(session.callId, {
          $addToSet: { participants: userIdStr },
          status: 'active',
        });

        // Send existing participants to the joiner
        socket.emit('group-call:joined-success', {
          callId: session.callId,
          conversationId: convIdStr,
          callType: session.callType,
          groupName: session.groupName,
          existingParticipants,
        });

        // Notify other participants that someone joined
        for (const [pId] of session.participants) {
          if (pId !== userIdStr) {
            io.to(pId).emit('group-call:participant-joined', {
              participant: participantData,
              callId: session.callId,
              conversationId: convIdStr,
            });
          }
        }

        // Broadcast active banner update
        io.to(convIdStr).emit('group-call:active-changed', {
          conversationId: convIdStr,
          active: true,
          callId: session.callId,
          callType: session.callType,
          groupName: session.groupName,
          participantCount: session.participants.size,
          participants: Array.from(session.participants.values()).map(p => p.user),
        });
      } catch (err) {
        console.error('[Socket Group Call] Error joining group call:', err);
        socket.emit('group-call:error', { message: 'Failed to join group call' });
      }
    });

    // 4. WebRTC Group Offer
    socket.on('group-call:offer', ({ targetUserId, offer, conversationId, callId }) => {
      if (!targetUserId || !offer) return;
      io.to(targetUserId.toString()).emit('group-call:offer', {
        senderId: currentUserId,
        offer,
        conversationId,
        callId,
      });
    });

    // 5. WebRTC Group Answer
    socket.on('group-call:answer', ({ targetUserId, answer, conversationId, callId }) => {
      if (!targetUserId || !answer) return;
      io.to(targetUserId.toString()).emit('group-call:answer', {
        senderId: currentUserId,
        answer,
        conversationId,
        callId,
      });
    });

    // 6. WebRTC Group ICE Candidate
    socket.on('group-call:ice-candidate', ({ targetUserId, candidate, conversationId, callId }) => {
      if (!targetUserId || !candidate) return;
      io.to(targetUserId.toString()).emit('group-call:ice-candidate', {
        senderId: currentUserId,
        candidate,
        conversationId,
        callId,
      });
    });

    // 7. Toggle Mute in Group Call
    socket.on('group-call:toggle-mute', ({ conversationId, isMuted }) => {
      if (!conversationId || !currentUserId) return;
      const convIdStr = conversationId.toString();
      const userIdStr = currentUserId.toString();
      const session = activeGroupCalls.get(convIdStr);
      if (session && session.participants.has(userIdStr)) {
        session.participants.get(userIdStr).isMuted = isMuted;
        for (const [pId] of session.participants) {
          if (pId !== userIdStr) {
            io.to(pId).emit('group-call:participant-mute-changed', {
              userId: userIdStr,
              isMuted,
              conversationId: convIdStr,
            });
          }
        }
      }
    });

    // 8. Toggle Camera in Group Call
    socket.on('group-call:toggle-camera', ({ conversationId, isVideoOff }) => {
      if (!conversationId || !currentUserId) return;
      const convIdStr = conversationId.toString();
      const userIdStr = currentUserId.toString();
      const session = activeGroupCalls.get(convIdStr);
      if (session && session.participants.has(userIdStr)) {
        session.participants.get(userIdStr).isVideoOff = isVideoOff;
        for (const [pId] of session.participants) {
          if (pId !== userIdStr) {
            io.to(pId).emit('group-call:participant-camera-changed', {
              userId: userIdStr,
              isVideoOff,
              conversationId: convIdStr,
            });
          }
        }
      }
    });

    // Helper to handle leaving a group call
    const handleLeaveGroupCall = async (userIdStr, convIdStr) => {
      const session = activeGroupCalls.get(convIdStr);
      if (!session) return;

      session.participants.delete(userIdStr);
      userActiveCalls.delete(userIdStr);

      // Notify remaining participants
      for (const [pId] of session.participants) {
        io.to(pId).emit('group-call:participant-left', {
          userId: userIdStr,
          conversationId: convIdStr,
          callId: session.callId,
        });
      }

      // Check if any participants remain
      if (session.participants.size === 0) {
        // Last person left -> call session ends
        const durationSec = Math.max(0, Math.floor((Date.now() - session.startTime.getTime()) / 1000));
        activeGroupCalls.delete(convIdStr);

        try {
          await Call.findByIdAndUpdate(session.callId, {
            status: 'completed',
            endTime: new Date(),
            duration: durationSec,
          });
        } catch (err) {
          console.error('[Socket Group Call] Error finalizing group call record:', err);
        }

        io.to(convIdStr).emit('group-call:active-changed', {
          conversationId: convIdStr,
          active: false,
          callId: session.callId,
        });
      } else {
        // Still has participants -> update count
        io.to(convIdStr).emit('group-call:active-changed', {
          conversationId: convIdStr,
          active: true,
          callId: session.callId,
          callType: session.callType,
          groupName: session.groupName,
          participantCount: session.participants.size,
          participants: Array.from(session.participants.values()).map(p => p.user),
        });
      }
    };

    // 9. Leave Group Call
    socket.on('group-call:leave', async ({ conversationId }) => {
      if (!conversationId || !currentUserId) return;
      await handleLeaveGroupCall(currentUserId.toString(), conversationId.toString());
    });

    // 10. Reject incoming group call invitation (local dismiss)
    socket.on('group-call:reject', ({ conversationId }) => {
      // No server state changes needed, incoming modal dismisses on client
    });

    // 11. Disconnect handling
    socket.on('disconnect', async () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);

        // If user was in an active 1-to-1 or group call, handle cleanup
        if (userActiveCalls.has(currentUserId)) {
          const callData = userActiveCalls.get(currentUserId);
          if (callData?.isGroup) {
            await handleLeaveGroupCall(currentUserId, callData.conversationId);
          } else if (callData?.peerId) {
            io.to(callData.peerId).emit('call:ended', {
              callId: callData.callId,
              reason: 'User disconnected',
            });
            userActiveCalls.delete(callData.peerId);
            userActiveCalls.delete(currentUserId);
          }
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
