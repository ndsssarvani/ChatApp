import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPreviewRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  const startRecording = async () => {
    try {
      setPermissionError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('[VoiceRecorder] Permission error:', err);
      setPermissionError('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      onSendVoice(audioFile, recordingTime);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder-bar">
      {permissionError ? (
        <div className="voice-recorder-error">
          <span>⚠️ {permissionError}</span>
          <button type="button" className="voice-cancel-btn" onClick={onCancel}>
            Dismiss
          </button>
        </div>
      ) : isRecording ? (
        <div className="voice-recording-active">
          <div className="recording-indicator">
            <span className="recording-red-dot"></span>
            <span className="recording-timer">{formatTime(recordingTime)}</span>
          </div>

          <div className="recording-wave-animation">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="voice-recording-controls">
            <button
              type="button"
              className="voice-cancel-btn"
              onClick={onCancel}
              title="Cancel Recording"
            >
              ✕ Cancel
            </button>
            <button
              type="button"
              className="voice-stop-btn"
              onClick={stopRecording}
              title="Stop & Review"
            >
              ⏹ Done
            </button>
          </div>
        </div>
      ) : (
        <div className="voice-preview-container">
          <audio
            ref={audioPreviewRef}
            src={audioUrl}
            onEnded={() => setIsPlayingPreview(false)}
          />
          <button
            type="button"
            className="voice-preview-play-btn"
            onClick={togglePreviewPlay}
            title={isPlayingPreview ? 'Pause' : 'Play'}
          >
            {isPlayingPreview ? '⏸' : '▶'}
          </button>

          <div className="voice-preview-info">
            <span className="voice-preview-label">Voice note</span>
            <span className="voice-preview-duration">{formatTime(recordingTime)}</span>
          </div>

          <button
            type="button"
            className="voice-cancel-btn"
            onClick={onCancel}
            title="Discard"
          >
            🗑️ Discard
          </button>

          <button
            type="button"
            className="voice-send-btn"
            onClick={handleSend}
            title="Send Voice Message"
          >
            ➤ Send
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
