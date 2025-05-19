// src/components/ui/AudioToggle.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { Button } from "~/components/ui/Button"; 
import { toast } from "react-hot-toast"; 

interface AudioToggleProps {
  audioSrc?: string; 
  initiallyPlaying?: boolean; 
}

export const AudioToggle = ({
  audioSrc = "/sounds/ambient-nature.mp3", 
  initiallyPlaying = false, 
}: AudioToggleProps) => {
  const [isPlaying, setIsPlaying] = useState(initiallyPlaying);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); 
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioElement = new Audio(audioSrc);
    audioElement.loop = true;
    audioElement.preload = "auto"; 

    audioElement.oncanplaythrough = () => {
      setIsAudioReady(true);
      if (initiallyPlaying && hasInteracted && audioRef.current && audioRef.current.paused) {
        // Only attempt to play if it's supposed to be playing and is currently paused
        audioRef.current.play().catch(e => {
          console.error("Initial audio play failed after canplaythrough:", e);
          setIsPlaying(false);
        });
      }
    };

    audioElement.onerror = (e) => {
      // Improved error logging:
      let errorDetails = "Unknown audio error.";
      if (audioElement.error) {
        switch (audioElement.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorDetails = "Audio playback aborted by the user or script.";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorDetails = `A network error caused the audio download to fail. Path: ${audioSrc}`;
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorDetails = "The audio playback was aborted due to a corruption problem or because the audio used features your browser did not support.";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorDetails = `The audio source was not suitable. Path: ${audioSrc}. Check if the file exists and the format is supported.`;
            break;
          default:
            errorDetails = `An unknown error occurred with the audio element. Code: ${audioElement.error.code}. Message: ${audioElement.error.message}`;
        }
      }
      console.error("Error loading audio. Event:", e, "AudioElement Error:", errorDetails);
      toast.error(`Failed to load ambient sound: ${errorDetails.substring(0,100)}...`); // Show a more specific part of error
      setIsAudioReady(false);
    };

    audioRef.current = audioElement;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src'); // Release the source
        audioRef.current.load(); // Abort pending loads
        audioRef.current.oncanplaythrough = null; // Remove listeners
        audioRef.current.onerror = null;
        audioRef.current = null;
      }
    };
  }, [audioSrc, initiallyPlaying, hasInteracted]); // Dependencies

  const toggleAudio = useCallback(async () => {
    if (!audioRef.current) {
      toast.error("Audio element not initialized.");
      return;
    }
    if (!isAudioReady && audioRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        // If not ready, try to load it. Useful if preload="none" or error occurred.
        try {
            audioRef.current.load(); // Attempt to load/reload
            await audioRef.current.play(); // Then try to play
            setIsPlaying(true);
            if (!hasInteracted) setHasInteracted(true);
        } catch (error) {
            toast.error("Ambient sound is not ready yet or failed to play.");
            console.error("Audio not ready / play failed on toggle:", error);
            setIsPlaying(false);
        }
        return;
    }


    if (!hasInteracted) {
      setHasInteracted(true); 
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Audio play/pause toggle failed:", error);
      toast.error("Could not toggle ambient sound.");
      // Attempt to sync state if an error occurred during play/pause
      if (audioRef.current) {
        setIsPlaying(!audioRef.current.paused);
      }
    }
  }, [isPlaying, isAudioReady, hasInteracted]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleAudio}
      disabled={!isAudioReady && !hasInteracted} // Slightly more lenient disabled state initially, allows first click to attempt load/play
      aria-label={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
      title={isPlaying ? "Mute ambient sound" : "Play ambient sound"}
    >
      {isPlaying ? (
        <FaVolumeUp className="h-5 w-5 text-primary transition-all group-hover:text-primary-dark dark:text-primary-light dark:group-hover:text-primary" />
      ) : (
        <FaVolumeMute className="h-5 w-5 text-muted-foreground transition-all group-hover:text-foreground" />
      )}
      <span className="sr-only">{isPlaying ? "Mute ambient sound" : "Play ambient sound"}</span>
    </Button>
  );
};
