import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import callService from '../services/callService';

const CallContext = createContext();

// Dynamic ICE servers with TURN support via environment variables
const getIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env?.VITE_TURN_SERVER_URL;
  const turnUsername = import.meta.env?.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env?.VITE_TURN_CREDENTIAL;

  if (turnUrl) {
    const turnConfig = { urls: turnUrl };
    if (turnUsername) turnConfig.username = turnUsername;
    if (turnCredential) turnConfig.credential = turnCredential;
    servers.push(turnConfig);
  }

  return { iceServers: servers };
};

// Sub-component for rendering a remote participant in a group call
const GroupParticipantTile = ({ participant, isSelf = false, localStream, isLocalMuted, isLocalVideoOff }) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const stream = isSelf ? localStream : participant?.stream;
  const isMuted = isSelf ? isLocalMuted : participant?.isMuted;
  const isVideoOff = isSelf ? isLocalVideoOff : (participant?.isVideoOff || !stream);
  const user = isSelf ? participant?.user : participant?.user;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!isSelf && audioRef.current && stream) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }
  }, [stream, isSelf]);

  return (
    <div className={`group-participant-tile ${isVideoOff ? 'video-off' : ''} ${isSelf ? 'self-tile' : ''}`}>
      {!isSelf && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video display */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf}
        className={`participant-video-element ${isVideoOff ? 'hidden' : ''}`}
      />

      {/* Avatar placeholder when video is off */}
      {isVideoOff && (
        <div className="participant-placeholder">
          <div className={`participant-avatar-wrapper ${!isMuted ? 'speaking-pulse' : ''}`}>
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
              alt={user?.name || 'Participant'}
              className="participant-avatar"
            />
          </div>
        </div>
      )}

      {/* Participant info pill */}
      <div className="participant-info-badge">
        <span className="participant-name">
          {isSelf ? `${user?.name || 'You'} (You)` : user?.name || 'Participant'}
        </span>
        <span className={`participant-mic-status ${isMuted ? 'muted' : 'unmuted'}`}>
          {isMuted ? '🔇' : '🎤'}
        </span>
      </div>

      {/* Connection status overlay if reconnecting */}
      {participant?.connectionState === 'reconnecting' && (
        <div className="participant-reconnecting-badge">
          <span>🔄 Reconnecting...</span>
        </div>
      )}
    </div>
  );
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // ─── 1-to-1 Call States ───
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);

  // ─── Group Call States ───
  const [groupIncomingCall, setGroupIncomingCall] = useState(null);
  const [currentGroupCall, setCurrentGroupCall] = useState(null);
  // groupParticipants: { [userId]: { user: { _id, name, avatar }, isMuted: boolean, isVideoOff: boolean, stream: MediaStream | null, connectionState: string } }
  const [groupParticipants, setGroupParticipants] = useState({});
  // activeGroupCallsMap: { [conversationId]: { active: boolean, callId, callType, groupName, participantCount, participants } }
  const [activeGroupCallsMap, setActiveGroupCallsMap] = useState({});

  // ─── Media Controls ───
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callError, setCallError] = useState(null);

  // ─── 1-to-1 References ───
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // ─── Group Call References ───
  const groupPeerConnectionsRef = useRef({}); // { [userId]: RTCPeerConnection }
  const groupRemoteStreamsRef = useRef({}); // { [userId]: MediaStream }

  // ─── Timers & Audio Refs ───
  const timerRef = useRef(null);
  const groupTimerRef = useRef(null);
  const ringtoneRef = useRef(null);

  // ─── Sound Generator (Web Audio API) ───
  const startRingtone = (type = 'ring') => {
    try {
      if (ringtoneRef.current) stopRingtone();
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'ring' ? 440 : 480, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      // Pulse ringtone
      let isBeeping = true;
      const interval = setInterval(() => {
        if (!gain.gain) return;
        gain.gain.setValueAtTime(isBeeping ? 0.15 : 0.0001, ctx.currentTime);
        isBeeping = !isBeeping;
      }, type === 'ring' ? 1200 : 500);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      ringtoneRef.current = { ctx, osc, gain, interval };
    } catch (e) {
      console.warn('[Ringtone] Web Audio initialization prevented:', e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      try {
        clearInterval(ringtoneRef.current.interval);
        ringtoneRef.current.osc?.stop();
        ringtoneRef.current.ctx?.close();
      } catch (e) {}
      ringtoneRef.current = null;
    }
  };

  // 1-to-1 Call Duration Timer
  useEffect(() => {
    if (currentCall && currentCall.status === 'connected') {
      timerRef.current = setInterval(() => {
        setCurrentCall((prev) => (prev ? { ...prev, seconds: prev.seconds + 1 } : null));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentCall?.status]);

  // Group Call Duration Timer
  useEffect(() => {
    if (currentGroupCall && currentGroupCall.status === 'connected') {
      groupTimerRef.current = setInterval(() => {
        setCurrentGroupCall((prev) => (prev ? { ...prev, seconds: prev.seconds + 1 } : null));
      }, 1000);
    } else {
      if (groupTimerRef.current) clearInterval(groupTimerRef.current);
    }
    return () => {
      if (groupTimerRef.current) clearInterval(groupTimerRef.current);
    };
  }, [currentGroupCall?.status]);

  // Clean up media streams & peer connections
  const cleanupMedia = () => {
    stopRingtone();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    // Close group peer connections
    Object.values(groupPeerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    groupPeerConnectionsRef.current = {};
    groupRemoteStreamsRef.current = {};
    remoteStreamRef.current = null;
  };

  // Format Duration MM:SS
  const formatDuration = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Initialize 1-to-1 WebRTC Peer Connection ───
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(getIceServers());
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        stopRingtone();
        setCurrentCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setCurrentCall((prev) => (prev ? { ...prev, status: 'reconnecting' } : null));
      }
    };

    return pc;
  };

  // ─── Initialize Group Call WebRTC Peer Connection for a specific remote peer ───
  const createGroupPeerConnection = async (targetUserId, conversationId, callId, isInitiator = false) => {
    const pc = new RTCPeerConnection(getIceServers());
    groupPeerConnectionsRef.current[targetUserId] = pc;

    // Add local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote track received
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      groupRemoteStreamsRef.current[targetUserId] = stream;
      setGroupParticipants((prev) => {
        const existing = prev[targetUserId];
        if (!existing) return prev;
        return {
          ...prev,
          [targetUserId]: {
            ...existing,
            stream,
            connectionState: 'connected',
          },
        };
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('group-call:ice-candidate', {
          targetUserId,
          candidate: event.candidate,
          conversationId,
          callId,
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      setGroupParticipants((prev) => {
        const existing = prev[targetUserId];
        if (!existing) return prev;
        return {
          ...prev,
          [targetUserId]: {
            ...existing,
            connectionState: pc.connectionState,
          },
        };
      });
    };

    // If this side is initiating the offer to the target peer
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socket) {
          socket.emit('group-call:offer', {
            targetUserId,
            offer,
            conversationId,
            callId,
          });
        }
      } catch (err) {
        console.error('[WebRTC Group] Error creating offer for peer', targetUserId, err);
      }
    }

    return pc;
  };

  // ─── Acquire Local Media Stream with Adaptive Fallback ───
  const acquireMediaStream = async (callType) => {
    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    let stream = null;
    if (callType === 'video') {
      try {
        // Try HD video first
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        });
      } catch (err) {
        console.warn('[Call] HD video not supported, falling back to standard video/audio:', err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: true,
          });
        } catch (videoErr) {
          console.warn('[Call] Video camera access failed, falling back to audio only:', videoErr);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints,
            video: false,
          });
          setIsVideoOff(true);
        }
      }
    } else {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });
    }

    localStreamRef.current = stream;
    return stream;
  };

  // ─── Socket.IO Event Listeners ───
  useEffect(() => {
    if (!socket) return;

    // ── 1-to-1 Call Events ──
    const handleIncomingCall = (data) => {
      if (currentCall || currentGroupCall) {
        socket.emit('call:reject', {
          callerId: data.caller._id,
          callId: data.callId,
          reason: 'User is busy on another call',
        });
        return;
      }
      setIncomingCall(data);
      startRingtone('ring');
    };

    const handleCallAccepted = async ({ callId, receiverId }) => {
      stopRingtone();
      try {
        const pc = createPeerConnection(receiverId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:offer', { targetUserId: receiverId, offer });
        setCurrentCall((prev) => (prev ? { ...prev, status: 'connected', callId } : null));
      } catch (err) {
        console.error('[WebRTC] Error initiating offer:', err);
        endCall('Failed to establish media stream');
      }
    };

    const handleCallOffer = async ({ offer, senderId }) => {
      try {
        let pc = peerConnectionRef.current;
        if (!pc) pc = createPeerConnection(senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', { targetUserId: senderId, answer });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    const handleCallAnswer = async ({ answer }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('[WebRTC] Error setting remote description:', err);
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    const handleCallRejected = ({ reason }) => {
      stopRingtone();
      setCallError(reason || 'Call was declined');
      cleanupMedia();
      setTimeout(() => {
        setCurrentCall(null);
        setCallError(null);
      }, 2500);
    };

    const handleCallCancelled = () => {
      stopRingtone();
      setIncomingCall(null);
    };

    const handleCallUnavailable = ({ reason }) => {
      stopRingtone();
      setCallError(reason || 'User is currently offline');
      cleanupMedia();
      setTimeout(() => {
        setCurrentCall(null);
        setCallError(null);
      }, 2500);
    };

    const handleCallBusy = ({ reason }) => {
      stopRingtone();
      setCallError(reason || 'User is on another call');
      cleanupMedia();
      setTimeout(() => {
        setCurrentCall(null);
        setCallError(null);
      }, 2500);
    };

    const handleCallEnded = () => {
      stopRingtone();
      cleanupMedia();
      setCurrentCall(null);
      setIncomingCall(null);
    };

    // ── Group Call Socket Events ──

    // 1. Incoming Group Call Invitation
    const handleGroupIncoming = (data) => {
      if (currentCall || currentGroupCall) return; // Busy
      setGroupIncomingCall(data);
      startRingtone('ring');
    };

    // 2. Active status changed banner in conversation
    const handleGroupActiveChanged = (data) => {
      const { conversationId, active, callId, callType, groupName, participantCount, participants } = data;
      setActiveGroupCallsMap((prev) => ({
        ...prev,
        [conversationId]: {
          active,
          callId,
          callType,
          groupName,
          participantCount: participantCount || 0,
          participants: participants || [],
        },
      }));
    };

    // 3. Initiator successfully started group call
    const handleGroupStarted = ({ callId, conversationId, callType, groupName, participants }) => {
      stopRingtone();
      const partsObj = {};
      participants?.forEach((p) => {
        const pId = p.user?._id || p._id;
        if (pId !== user?._id) {
          partsObj[pId] = {
            user: p.user || p,
            isMuted: p.isMuted || false,
            isVideoOff: p.isVideoOff || false,
            stream: null,
            connectionState: 'connecting',
          };
        }
      });
      setGroupParticipants(partsObj);
      setCurrentGroupCall({
        callId,
        conversationId,
        groupName,
        callType,
        status: 'connected',
        seconds: 0,
      });
    };

    // 4. Joiner successfully joined active group call
    const handleGroupJoinedSuccess = async ({ callId, conversationId, callType, groupName, existingParticipants }) => {
      stopRingtone();
      const partsObj = {};
      setCurrentGroupCall({
        callId,
        conversationId,
        groupName,
        callType,
        status: 'connected',
        seconds: 0,
      });

      // Connect WebRTC to all existing participants (as offerer)
      for (const p of existingParticipants) {
        const pId = p.user?._id || p._id;
        if (pId !== user?._id) {
          partsObj[pId] = {
            user: p.user || p,
            isMuted: p.isMuted || false,
            isVideoOff: p.isVideoOff || false,
            stream: null,
            connectionState: 'connecting',
          };
          // Create peer connection and send offer
          await createGroupPeerConnection(pId, conversationId, callId, true);
        }
      }
      setGroupParticipants(partsObj);
    };

    // 5. Another participant joined the active group call
    const handleGroupParticipantJoined = ({ participant }) => {
      const pId = participant.user?._id || participant._id;
      if (!pId || pId === user?._id) return;
      setGroupParticipants((prev) => ({
        ...prev,
        [pId]: {
          user: participant.user || participant,
          isMuted: participant.isMuted || false,
          isVideoOff: participant.isVideoOff || false,
          stream: null,
          connectionState: 'connecting',
        },
      }));
    };

    // 6. Group WebRTC Offer received
    const handleGroupOffer = async ({ senderId, offer, conversationId, callId }) => {
      try {
        let pc = groupPeerConnectionsRef.current[senderId];
        if (!pc) {
          pc = await createGroupPeerConnection(senderId, conversationId, callId, false);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('group-call:answer', {
          targetUserId: senderId,
          answer,
          conversationId,
          callId,
        });
      } catch (err) {
        console.error('[WebRTC Group] Error handling offer from sender', senderId, err);
      }
    };

    // 7. Group WebRTC Answer received
    const handleGroupAnswer = async ({ senderId, answer }) => {
      try {
        const pc = groupPeerConnectionsRef.current[senderId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('[WebRTC Group] Error handling answer from sender', senderId, err);
      }
    };

    // 8. Group WebRTC ICE Candidate received
    const handleGroupIceCandidate = async ({ senderId, candidate }) => {
      try {
        const pc = groupPeerConnectionsRef.current[senderId];
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('[WebRTC Group] Error adding ICE candidate from sender', senderId, err);
      }
    };

    // 9. Participant Mute State Changed
    const handleGroupParticipantMuteChanged = ({ userId, isMuted: mutedState }) => {
      setGroupParticipants((prev) => {
        if (!prev[userId]) return prev;
        return {
          ...prev,
          [userId]: { ...prev[userId], isMuted: mutedState },
        };
      });
    };

    // 10. Participant Camera State Changed
    const handleGroupParticipantCameraChanged = ({ userId, isVideoOff: videoState }) => {
      setGroupParticipants((prev) => {
        if (!prev[userId]) return prev;
        return {
          ...prev,
          [userId]: { ...prev[userId], isVideoOff: videoState },
        };
      });
    };

    // 11. Participant Left the Call
    const handleGroupParticipantLeft = ({ userId }) => {
      if (groupPeerConnectionsRef.current[userId]) {
        try {
          groupPeerConnectionsRef.current[userId].close();
        } catch (e) {}
        delete groupPeerConnectionsRef.current[userId];
      }
      delete groupRemoteStreamsRef.current[userId];
      setGroupParticipants((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    // 12. Group Call Error
    const handleGroupError = ({ message }) => {
      stopRingtone();
      setCallError(message || 'Group call error');
      setTimeout(() => setCallError(null), 3500);
    };

    // Register all socket listeners
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:offer', handleCallOffer);
    socket.on('call:answer', handleCallAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:cancelled', handleCallCancelled);
    socket.on('call:unavailable', handleCallUnavailable);
    socket.on('call:busy', handleCallBusy);
    socket.on('call:ended', handleCallEnded);

    socket.on('group-call:incoming', handleGroupIncoming);
    socket.on('group-call:active-changed', handleGroupActiveChanged);
    socket.on('group-call:started', handleGroupStarted);
    socket.on('group-call:joined-success', handleGroupJoinedSuccess);
    socket.on('group-call:participant-joined', handleGroupParticipantJoined);
    socket.on('group-call:offer', handleGroupOffer);
    socket.on('group-call:answer', handleGroupAnswer);
    socket.on('group-call:ice-candidate', handleGroupIceCandidate);
    socket.on('group-call:participant-mute-changed', handleGroupParticipantMuteChanged);
    socket.on('group-call:participant-camera-changed', handleGroupParticipantCameraChanged);
    socket.on('group-call:participant-left', handleGroupParticipantLeft);
    socket.on('group-call:error', handleGroupError);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:offer', handleCallOffer);
      socket.off('call:answer', handleCallAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:cancelled', handleCallCancelled);
      socket.off('call:unavailable', handleCallUnavailable);
      socket.off('call:busy', handleCallBusy);
      socket.off('call:ended', handleCallEnded);

      socket.off('group-call:incoming', handleGroupIncoming);
      socket.off('group-call:active-changed', handleGroupActiveChanged);
      socket.off('group-call:started', handleGroupStarted);
      socket.off('group-call:joined-success', handleGroupJoinedSuccess);
      socket.off('group-call:participant-joined', handleGroupParticipantJoined);
      socket.off('group-call:offer', handleGroupOffer);
      socket.off('group-call:answer', handleGroupAnswer);
      socket.off('group-call:ice-candidate', handleGroupIceCandidate);
      socket.off('group-call:participant-mute-changed', handleGroupParticipantMuteChanged);
      socket.off('group-call:participant-camera-changed', handleGroupParticipantCameraChanged);
      socket.off('group-call:participant-left', handleGroupParticipantLeft);
      socket.off('group-call:error', handleGroupError);
    };
  }, [socket, currentCall, currentGroupCall, user?._id]);

  // Request active call state when a chat is viewed
  const requestActiveGroupCall = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('group-call:get-active', { conversationId });
    }
  };

  // ─── START 1-TO-1 CALL ───
  const startCall = async (targetUser, callType = 'audio', conversationId = null) => {
    if (!socket || !user || !targetUser) return;

    try {
      setCallError(null);
      setIsMuted(false);
      setIsVideoOff(false);

      const stream = await acquireMediaStream(callType);
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      setCurrentCall({
        peer: targetUser,
        callType,
        status: 'calling',
        role: 'caller',
        seconds: 0,
        conversationId,
      });

      startRingtone('dial');

      socket.emit('call:initiate', {
        receiverId: targetUser._id,
        callType,
        caller: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber,
        },
        conversationId,
      });
    } catch (err) {
      console.error('[Call] Error accessing media devices:', err);
      alert('Could not access microphone/camera. Please check permissions.');
      cleanupMedia();
      setCurrentCall(null);
    }
  };

  // ─── ACCEPT 1-TO-1 CALL ───
  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    stopRingtone();

    const { callId, caller, callType, conversationId } = incomingCall;

    try {
      const stream = await acquireMediaStream(callType);
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      setCurrentCall({
        callId,
        peer: caller,
        callType,
        status: 'connected',
        role: 'receiver',
        seconds: 0,
        conversationId,
      });

      setIncomingCall(null);

      socket.emit('call:accept', {
        callerId: caller._id,
        callId,
      });
    } catch (err) {
      console.error('[Call] Error accepting call media:', err);
      alert('Could not access microphone/camera. Please check permissions.');
      rejectCall();
    }
  };

  // ─── REJECT 1-TO-1 CALL ───
  const rejectCall = () => {
    if (!incomingCall || !socket) return;
    stopRingtone();

    socket.emit('call:reject', {
      callerId: incomingCall.caller._id,
      callId: incomingCall.callId,
      reason: 'Call declined',
    });

    setIncomingCall(null);
  };

  // ─── END 1-TO-1 CALL ───
  const endCall = (customReason = null) => {
    stopRingtone();
    if (!currentCall && !incomingCall) return;

    if (currentCall) {
      const peerId = currentCall.peer?._id;
      if (currentCall.status === 'calling') {
        if (socket && peerId) {
          socket.emit('call:cancel', {
            receiverId: peerId,
            callId: currentCall.callId,
            callType: currentCall.callType,
            callerName: user?.name,
          });
        }
      } else {
        if (socket && peerId) {
          socket.emit('call:ended', {
            targetUserId: peerId,
            callId: currentCall.callId,
            duration: currentCall.seconds,
          });
        }
      }
    }

    cleanupMedia();
    setCurrentCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  // ─── START GROUP CALL ───
  const startGroupCall = async (groupConversation, callType = 'audio') => {
    if (!socket || !user || !groupConversation) return;

    try {
      setCallError(null);
      setIsMuted(false);
      setIsVideoOff(callType === 'audio');

      const stream = await acquireMediaStream(callType);

      setCurrentGroupCall({
        conversationId: groupConversation._id,
        groupName: groupConversation.groupName || 'Group Call',
        callType,
        status: 'connected',
        seconds: 0,
      });

      socket.emit('group-call:initiate', {
        conversationId: groupConversation._id,
        callType,
        caller: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      console.error('[Group Call] Error starting group call media:', err);
      alert('Could not access microphone/camera. Please check permissions.');
      cleanupMedia();
      setCurrentGroupCall(null);
    }
  };

  // ─── JOIN ACTIVE GROUP CALL ───
  const joinGroupCall = async (conversationId, callType = 'video', groupName = 'Group Call') => {
    if (!socket || !user || !conversationId) return;

    try {
      setCallError(null);
      setIsMuted(false);
      setIsVideoOff(callType === 'audio');

      const stream = await acquireMediaStream(callType);

      setCurrentGroupCall({
        conversationId,
        groupName,
        callType,
        status: 'connecting',
        seconds: 0,
      });

      socket.emit('group-call:join', {
        conversationId,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        },
      });
    } catch (err) {
      console.error('[Group Call] Error joining group call:', err);
      alert('Could not access microphone/camera. Please check permissions.');
      cleanupMedia();
      setCurrentGroupCall(null);
    }
  };

  // ─── ACCEPT INCOMING GROUP CALL ───
  const acceptGroupCall = async () => {
    if (!groupIncomingCall || !socket) return;
    stopRingtone();
    const { conversationId, callType, groupName } = groupIncomingCall;
    setGroupIncomingCall(null);
    await joinGroupCall(conversationId, callType, groupName);
  };

  // ─── REJECT INCOMING GROUP CALL ───
  const rejectGroupCall = () => {
    if (!groupIncomingCall || !socket) return;
    stopRingtone();
    socket.emit('group-call:reject', { conversationId: groupIncomingCall.conversationId });
    setGroupIncomingCall(null);
  };

  // ─── LEAVE GROUP CALL ───
  const leaveGroupCall = () => {
    stopRingtone();
    if (currentGroupCall && socket) {
      socket.emit('group-call:leave', { conversationId: currentGroupCall.conversationId });
    }
    cleanupMedia();
    setCurrentGroupCall(null);
    setGroupParticipants({});
    setIsMuted(false);
    setIsVideoOff(false);
  };

  // ─── TOGGLE MUTE (1-to-1 & Group) ───
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextMuted = audioTrack.enabled; // If enabled, toggles to disabled (muted)
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);

        if (currentGroupCall && socket) {
          socket.emit('group-call:toggle-mute', {
            conversationId: currentGroupCall.conversationId,
            isMuted: nextMuted,
          });
        }
      }
    }
  };

  // ─── TOGGLE CAMERA (1-to-1 & Group) ───
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextVideoOff = videoTrack.enabled; // If enabled, toggles to disabled (video off)
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);

        if (currentGroupCall && socket) {
          socket.emit('group-call:toggle-camera', {
            conversationId: currentGroupCall.conversationId,
            isVideoOff: nextVideoOff,
          });
        }
      }
    }
  };

  // Ensure 1-to-1 remote audio plays automatically
  useEffect(() => {
    if (remoteStreamRef.current) {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [currentCall?.status]);

  // Compute total group participants count (self + remote peers)
  const remoteParticipantsList = Object.values(groupParticipants);
  const totalGroupParticipantsCount = remoteParticipantsList.length + 1;

  // Compute video grid layout class
  const getGridClass = () => {
    if (totalGroupParticipantsCount === 1) return 'grid-1';
    if (totalGroupParticipantsCount === 2) return 'grid-2';
    if (totalGroupParticipantsCount <= 4) return 'grid-4';
    if (totalGroupParticipantsCount <= 6) return 'grid-6';
    return 'grid-many';
  };

  return (
    <CallContext.Provider
      value={{
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        startGroupCall,
        joinGroupCall,
        leaveGroupCall,
        requestActiveGroupCall,
        activeGroupCallsMap,
        toggleMute,
        toggleVideo,
        currentCall,
        incomingCall,
        currentGroupCall,
        groupIncomingCall,
        groupParticipants,
        isMuted,
        isVideoOff,
        callError,
        formatDuration,
      }}
    >
      {children}

      {/* Hidden audio element for 1-to-1 remote WebRTC stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ─── 1. 1-TO-1 INCOMING CALL POPUP MODAL ─── */}
      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-card">
            <div className="incoming-pulse-ring"></div>
            <img
              src={
                incomingCall.caller.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${incomingCall.caller.name || 'User'}`
              }
              alt={incomingCall.caller.name}
              className="incoming-avatar"
            />
            <h2 className="incoming-caller-name">{incomingCall.caller.name}</h2>
            <p className="incoming-call-type">
              Incoming {incomingCall.callType === 'video' ? '📹 Video' : '📞 Audio'} Call...
            </p>

            <div className="incoming-actions">
              <button
                type="button"
                className="incoming-btn-decline"
                onClick={rejectCall}
                title="Decline Call"
              >
                <span>✕</span> Decline
              </button>
              <button
                type="button"
                className="incoming-btn-accept"
                onClick={acceptCall}
                title="Accept Call"
              >
                <span>{incomingCall.callType === 'video' ? '📹' : '📞'}</span> Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. GROUP INCOMING CALL POPUP MODAL ─── */}
      {groupIncomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-card group-incoming-card">
            <div className="incoming-pulse-ring group-pulse"></div>
            <div className="group-incoming-badge">
              <span>👥 Group {groupIncomingCall.callType === 'video' ? 'Video' : 'Audio'} Call</span>
            </div>
            <h2 className="incoming-caller-name">{groupIncomingCall.groupName || 'Group Chat'}</h2>
            <p className="incoming-call-type">
              Started by <strong>{groupIncomingCall.caller?.name || 'A group member'}</strong>
            </p>

            <div className="incoming-actions">
              <button
                type="button"
                className="incoming-btn-decline"
                onClick={rejectGroupCall}
                title="Decline Call"
              >
                <span>✕</span> Decline
              </button>
              <button
                type="button"
                className="incoming-btn-accept"
                onClick={acceptGroupCall}
                title="Join Group Call"
              >
                <span>{groupIncomingCall.callType === 'video' ? '📹' : '📞'}</span> Join Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. 1-TO-1 ACTIVE CALL FULL OVERLAY ─── */}
      {currentCall && (
        <div className="active-call-overlay">
          <div
            className={`active-call-container ${
              currentCall.callType === 'video' ? 'video-mode' : 'audio-mode'
            }`}
          >
            {/* Call Header */}
            <div className="active-call-header">
              <div className="call-security-badge">
                <span>🔒</span> End-to-End Encrypted WebRTC
              </div>
              <div className="call-duration-timer">
                {currentCall.status === 'calling'
                  ? 'Calling...'
                  : currentCall.status === 'reconnecting'
                  ? 'Reconnecting...'
                  : formatDuration(currentCall.seconds)}
              </div>
            </div>

            {/* Main Media View */}
            {currentCall.callType === 'video' ? (
              <div className="video-streams-area">
                {/* Remote Video Stream (Main) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="remote-video-element"
                />
                {(!remoteStreamRef.current || currentCall.status === 'calling') && (
                  <div className="video-connecting-placeholder">
                    <img
                      src={
                        currentCall.peer.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${currentCall.peer.name || 'User'}`
                      }
                      alt={currentCall.peer.name}
                      className="placeholder-avatar"
                    />
                    <h3>{currentCall.peer.name}</h3>
                    <p>{currentCall.status === 'calling' ? 'Ringing...' : 'Connecting video...'}</p>
                  </div>
                )}

                {/* Local Video Stream (PIP preview) */}
                <div className="local-video-pip">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="local-video-element"
                  />
                  {isVideoOff && <div className="pip-camera-off">Camera Off</div>}
                </div>
              </div>
            ) : (
              /* Audio Mode UI */
              <div className="audio-call-main">
                <div className="audio-avatar-wrapper">
                  <div className={`audio-pulse-ring ${currentCall.status === 'connected' ? 'active' : ''}`}></div>
                  <img
                    src={
                      currentCall.peer.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${currentCall.peer.name || 'User'}`
                    }
                    alt={currentCall.peer.name}
                    className="audio-peer-avatar"
                  />
                </div>
                <h2 className="audio-peer-name">{currentCall.peer.name}</h2>
                <p className="audio-call-status">
                  {callError
                    ? callError
                    : currentCall.status === 'calling'
                    ? 'Calling...'
                    : 'HD Voice Connected'}
                </p>

                {currentCall.status === 'connected' && (
                  <div className="audio-waveform-bars">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
            )}

            {/* Error banner if any */}
            {callError && <div className="call-error-banner">{callError}</div>}

            {/* Call Action Controls Bar */}
            <div className="active-call-controls">
              {/* Mute Button */}
              <button
                type="button"
                className={`call-control-btn ${isMuted ? 'active-danger' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🎤'}
                <span className="btn-label">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* Video Camera Toggle Button */}
              {currentCall.callType === 'video' && (
                <button
                  type="button"
                  className={`call-control-btn ${isVideoOff ? 'active-danger' : ''}`}
                  onClick={toggleVideo}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? '🚫' : '📹'}
                  <span className="btn-label">{isVideoOff ? 'Cam Off' : 'Cam On'}</span>
                </button>
              )}

              {/* End Call Button */}
              <button
                type="button"
                className="call-control-btn btn-end-call"
                onClick={() => endCall()}
                title="End Call"
              >
                📞
                <span className="btn-label">End</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. GROUP ACTIVE CALL OVERLAY ─── */}
      {currentGroupCall && (
        <div className="active-call-overlay group-active-overlay">
          <div
            className={`active-call-container group-call-container ${
              currentGroupCall.callType === 'video' ? 'video-mode' : 'audio-mode'
            }`}
          >
            {/* Group Call Header */}
            <div className="active-call-header group-header">
              <div className="group-header-info">
                <span className="live-call-badge">🔴 LIVE GROUP {currentGroupCall.callType.toUpperCase()}</span>
                <h3 className="group-call-title">{currentGroupCall.groupName}</h3>
              </div>
              <div className="group-header-meta">
                <span className="group-members-pill">👥 {totalGroupParticipantsCount} active</span>
                <div className="call-duration-timer">
                  {currentGroupCall.status === 'connecting'
                    ? 'Connecting...'
                    : formatDuration(currentGroupCall.seconds)}
                </div>
              </div>
            </div>

            {/* Media Area: Responsive Grid */}
            <div className={`group-video-grid ${getGridClass()} ${currentGroupCall.callType === 'audio' ? 'audio-grid-mode' : ''}`}>
              {/* 1. Self Tile */}
              <GroupParticipantTile
                isSelf={true}
                participant={{ user }}
                localStream={localStreamRef.current}
                isLocalMuted={isMuted}
                isLocalVideoOff={isVideoOff}
              />

              {/* 2. Remote Participant Tiles */}
              {remoteParticipantsList.map((participant) => (
                <GroupParticipantTile
                  key={participant.user?._id || Math.random().toString()}
                  participant={participant}
                />
              ))}
            </div>

            {/* Error banner if any */}
            {callError && <div className="call-error-banner">{callError}</div>}

            {/* Group Call Action Controls Bar */}
            <div className="active-call-controls group-controls">
              {/* Mute Button */}
              <button
                type="button"
                className={`call-control-btn ${isMuted ? 'active-danger' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? '🔇' : '🎤'}
                <span className="btn-label">{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* Video Camera Toggle Button */}
              {currentGroupCall.callType === 'video' && (
                <button
                  type="button"
                  className={`call-control-btn ${isVideoOff ? 'active-danger' : ''}`}
                  onClick={toggleVideo}
                  title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isVideoOff ? '🚫' : '📹'}
                  <span className="btn-label">{isVideoOff ? 'Cam Off' : 'Cam On'}</span>
                </button>
              )}

              {/* Leave Call Button */}
              <button
                type="button"
                className="call-control-btn btn-end-call"
                onClick={leaveGroupCall}
                title="Leave Group Call"
              >
                📞
                <span className="btn-label">Leave</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export default CallContext;
