import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import callService from '../services/callService';

const CallContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // Call states
  // incomingCall: null | { callId, caller, callType, conversationId }
  const [incomingCall, setIncomingCall] = useState(null);

  // currentCall: null | { callId, peer, callType, status: 'calling' | 'connected' | 'reconnecting', role: 'caller' | 'receiver', seconds: 0 }
  const [currentCall, setCurrentCall] = useState(null);

  // Media controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callError, setCallError] = useState(null);

  // References
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);
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

  // Duration Timer
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

  // Clean up streams & peer connection
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
    remoteStreamRef.current = null;
  };

  // Format Duration MM:SS
  const formatDuration = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Initialize WebRTC Peer Connection ───
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Send local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
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

  // ─── Socket.IO Event Listeners ───
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming Call Invitation
    const handleIncomingCall = (data) => {
      // If already in a call, notify sender busy
      if (currentCall) {
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

    // 2. Caller receives Accepted signal from Receiver
    const handleCallAccepted = async ({ callId, receiverId }) => {
      stopRingtone();
      try {
        const pc = createPeerConnection(receiverId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('call:offer', {
          targetUserId: receiverId,
          offer,
        });

        setCurrentCall((prev) => (prev ? { ...prev, status: 'connected', callId } : null));
      } catch (err) {
        console.error('[WebRTC] Error initiating offer:', err);
        endCall('Failed to establish media stream');
      }
    };

    // 3. Receiver gets WebRTC Offer
    const handleCallOffer = async ({ offer, senderId }) => {
      try {
        let pc = peerConnectionRef.current;
        if (!pc) {
          pc = createPeerConnection(senderId);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('call:answer', {
          targetUserId: senderId,
          answer,
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    // 4. Caller gets WebRTC Answer
    const handleCallAnswer = async ({ answer }) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (err) {
        console.error('[WebRTC] Error setting remote description:', err);
      }
    };

    // 5. ICE Candidate
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

    // 6. Call Rejected
    const handleCallRejected = ({ reason }) => {
      stopRingtone();
      setCallError(reason || 'Call was declined');
      cleanupMedia();
      setTimeout(() => {
        setCurrentCall(null);
        setCallError(null);
      }, 2500);
    };

    // 7. Call Cancelled (caller hung up before answer)
    const handleCallCancelled = () => {
      stopRingtone();
      setIncomingCall(null);
    };

    // 8. Call Unavailable (receiver is offline)
    const handleCallUnavailable = ({ reason }) => {
      stopRingtone();
      setCallError(reason || 'User is currently offline');
      cleanupMedia();
      setTimeout(() => {
        setCurrentCall(null);
        setCallError(null);
      }, 2500);
    };

    // 9. Call Busy
    const handleCallBusy = ({ reason }) => {
      stopRingtone();
      setCallError(reason || 'User is on another call');
      cleanupMedia();
      setTimeout(() => {
        setCurrentCall(null);
        setCallError(null);
      }, 2500);
    };

    // 10. Call Ended by other user
    const handleCallEnded = () => {
      stopRingtone();
      cleanupMedia();
      setCurrentCall(null);
      setIncomingCall(null);
    };

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
    };
  }, [socket, currentCall, user?._id]);

  // ─── START CALL (Audio / Video) ───
  const startCall = async (targetUser, callType = 'audio', conversationId = null) => {
    if (!socket || !user || !targetUser) return;

    try {
      setCallError(null);
      setIsMuted(false);
      setIsVideoOff(false);

      // 1. Get user media (microphone & optionally camera)
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

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

      // 2. Emit call initiation to server
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

  // ─── ACCEPT INCOMING CALL ───
  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    stopRingtone();

    const { callId, caller, callType, conversationId } = incomingCall;

    try {
      const constraints = {
        audio: true,
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

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

      // Notify caller that receiver accepted
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

  // ─── REJECT INCOMING CALL ───
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

  // ─── CANCEL OR END CURRENT CALL ───
  const endCall = (customReason = null) => {
    stopRingtone();
    if (!currentCall && !incomingCall) return;

    if (currentCall) {
      const peerId = currentCall.peer?._id;
      if (currentCall.status === 'calling') {
        // Caller cancelling before answer
        if (socket && peerId) {
          socket.emit('call:cancel', {
            receiverId: peerId,
            callId: currentCall.callId,
            callType: currentCall.callType,
            callerName: user?.name,
          });
        }
      } else {
        // Ending connected call
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

  // ─── TOGGLE MUTE / CAMERA ───
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Ensure remote audio plays automatically
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

  return (
    <CallContext.Provider
      value={{
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        currentCall,
        incomingCall,
        isMuted,
        isVideoOff,
        callError,
        formatDuration,
      }}
    >
      {children}

      {/* Hidden audio element for remote WebRTC stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ─── 1. INCOMING CALL POPUP MODAL (Anywhere in App) ─── */}
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

      {/* ─── 2. ACTIVE CALL FULL OVERLAY / CARD ─── */}
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
