// src/components/ui/AudioToggle.tsx
import { useState, useRef, useEffect } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

export const AudioToggle = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element on client side
    audioRef.current = new Audio("/sounds/ambient.mp3");
    audioRef.current.loop = true;
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <button
      onClick={toggleAudio}
      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      aria-label={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
    >
      {isPlaying ? (
        <FaVolumeUp className="h-5 w-5 text-primary" />
      ) : (
        <FaVolumeMute className="h-5 w-5 text-primary" />
      )}
    </button>
  );
};