import React, { useState, useRef, useEffect } from 'react';
import { getMediaUrl } from '../utils/mediaUrl';

const VoiceMessagePlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  const fullUrl = getMediaUrl(audioUrl);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!totalDuration || isNaN(totalDuration) || totalDuration === 0)) {
      setTotalDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="voice-message-bubble-player">
      <audio
        ref={audioRef}
        src={fullUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        className={`voice-bubble-play-btn ${isPlaying ? 'playing' : ''}`}
        onClick={togglePlay}
        title={isPlaying ? 'Pause' : 'Play Voice Message'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="voice-bubble-track-area">
        {/* Waveform bars simulation */}
        <div className="voice-waveform-preview">
          {[40, 75, 55, 90, 30, 80, 60, 100, 45, 70, 85, 40, 65, 90, 50, 75, 30, 60].map(
            (height, idx) => {
              const barPercent = (idx / 18) * 100;
              const isActive = barPercent <= progressPercent;
              return (
                <span
                  key={idx}
                  className={`waveform-bar ${isActive ? 'active' : ''}`}
                  style={{ height: `${height}%` }}
                />
              );
            }
          )}
        </div>

        {/* Hidden scrubbable range input */}
        <input
          type="range"
          min="0"
          max={totalDuration || 1}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="voice-bubble-seek-slider"
        />

        <div className="voice-bubble-meta-line">
          <span className="voice-bubble-timer">
            {formatTime(isPlaying ? currentTime : totalDuration || currentTime)}
          </span>
          <button
            type="button"
            className="voice-speed-pill"
            onClick={cyclePlaybackRate}
            title="Playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessagePlayer;
