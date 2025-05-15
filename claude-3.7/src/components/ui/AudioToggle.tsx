// src/components/ui/AudioToggle.tsx
"use client"; // Required due to useState, useRef, useEffect and direct DOM manipulation (Audio object)

import { useState, useRef, useEffect, useCallback } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { Button } from "~/components/ui/Button"; // Assuming a Button component exists
import { toast } from "react-hot-toast"; // For user feedback

interface AudioToggleProps {
  audioSrc?: string; // Allow customizing audio source via prop
  initiallyPlaying?: boolean; // Allow setting initial play state (requires user interaction for first play)
}

export const AudioToggle = ({
  audioSrc = "/sounds/ambient.mp3", // Default audio source
  initiallyPlaying = false, // Default to not playing initially
}: AudioToggleProps) => {
  const [isPlaying, setIsPlaying] = useState(initiallyPlaying);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // Track first user interaction
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element only on the client side
    const audioElement = new Audio(audioSrc);
    audioElement.loop = true;
    audioElement.preload = "auto"; // Suggest browser to preload metadata or entire audio

    audioElement.oncanplaythrough = () => {
      setIsAudioReady(true);
      // Attempt to play if initiallyPlaying is true AND user has interacted
      // Browsers often block autoplay without prior user interaction.
      if (initiallyPlaying && hasInteracted && audioRef.current) {
        audioRef.current.play().catch(e => {
          console.error("Initial audio play failed:", e);
          // Potentially show a muted icon if autoplay fails
          setIsPlaying(false);
        });
      }
    };
    audioElement.onerror = (e) => {
      console.error("Error loading audio:", e);
      toast.error("Failed to load ambient sound.");
      setIsAudioReady(false); // Mark as not ready if there's an error
    };

    audioRef.current = audioElement;

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // Remove event listeners if any were added directly (not needed for oncanplaythrough here)
        audioRef.current = null;
      }
    };
  }, [audioSrc, initiallyPlaying, hasInteracted]); // Re-run if src or initial state changes (and hasInteracted allows initial play)

  const toggleAudio = useCallback(async () => {
    if (!audioRef.current || !isAudioReady) {
      toast.error("Ambient sound is not ready yet.");
      return;
    }

    if (!hasInteracted) {
      setHasInteracted(true); // Record first interaction
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Play requires user interaction on most modern browsers.
        // This explicit call on click should work.
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Audio play/pause failed:", error);
      toast.error("Could not play/pause ambient sound.");
      // If play failed, ensure isPlaying state is correct
      if (!audioRef.current.paused && isPlaying) { // it was supposed to pause but didn't
         // no state change needed
      } else if (audioRef.current.paused && !isPlaying) { // it was supposed to play but didn't
        setIsPlaying(false);
      }
    }
  }, [isPlaying, isAudioReady, hasInteracted]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleAudio}
      disabled={!isAudioReady} // Disable button until audio is ready
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
