/**
 * Recording Player Component
 * Modal audio player for call recordings stored in Twilio
 */
import React, { useState, useRef } from 'react';
import { Play, Pause, X, Headphones } from 'lucide-react';

const RecordingPlayer = ({ recordingUrl, phoneNumber, duration }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!recordingUrl) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
        title="Play recording"
      >
        <Play size={12} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => { setIsOpen(false); audioRef.current?.pause(); setIsPlaying(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative glass-card p-6 max-w-md w-full animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                  <Headphones size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-surface-100">Call Recording</h3>
                  <p className="text-xs text-surface-400">{phoneNumber}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsOpen(false); audioRef.current?.pause(); setIsPlaying(false); }}
                className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Audio Player */}
            <div className="bg-surface-800/60 rounded-xl p-4 space-y-3">
              <audio
                ref={audioRef}
                src={recordingUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                preload="metadata"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all shadow-lg shadow-emerald-500/25"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 60}
                    value={currentTime}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value);
                      setCurrentTime(t);
                      if (audioRef.current) audioRef.current.currentTime = t;
                    }}
                    className="w-full h-1.5 bg-surface-600 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 ${(currentTime / (duration || 60)) * 100}%, #334155 0%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-surface-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecordingPlayer;
