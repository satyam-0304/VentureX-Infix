import { useState, useRef, useCallback } from 'react';

export interface BackwardSeekRecord {
  timestamp: number; // Wall-clock timestamp (Date.now())
  landingPosition: number; // Video time in seconds landed at
  fromPosition: number; // Video time in seconds seeked from
}

export interface UseConfusionDetectOptions {
  windowMs?: number; // Default 60,000ms (60s)
  proximitySec?: number; // Default 25s
  cooldownMs?: number; // Default 180,000ms (3 mins)
  onConfusionTriggered?: (landingPosition: number) => void;
}

export function useConfusionDetect({
  windowMs = 60000,
  proximitySec = 25,
  cooldownMs = 180000,
  onConfusionTriggered
}: UseConfusionDetectOptions = {}) {
  const [isConfusionDetected, setIsConfusionDetected] = useState(false);
  const [detectedTimestamp, setDetectedTimestamp] = useState<number | null>(null);

  // In-memory rolling buffer of backward seeks
  const seekBufferRef = useRef<BackwardSeekRecord[]>([]);

  // Cooldown timestamp: until Date.now() reaches this, confusion detection is suppressed
  const cooldownUntilRef = useRef<number>(0);

  /**
   * Records a seek action.
   * If fromPosition > targetPosition, this is classified as a backward seek (rewind).
   */
  const recordSeek = useCallback(
    (fromPosition: number, targetPosition: number) => {
      // Must be a backward seek
      if (targetPosition >= fromPosition) {
        return;
      }

      const now = Date.now();

      // Check if within 3-minute cooldown
      if (now < cooldownUntilRef.current) {
        return;
      }

      // Add new backward seek event
      const newRecord: BackwardSeekRecord = {
        timestamp: now,
        landingPosition: targetPosition,
        fromPosition
      };

      // Filter out events older than the 60-second window
      const activeWindow = [...seekBufferRef.current, newRecord].filter(
        (rec) => now - rec.timestamp <= windowMs
      );
      seekBufferRef.current = activeWindow;

      // Heuristic: At least two backward seeks within window
      if (activeWindow.length >= 2) {
        // Compare pairs of backward seeks
        for (let i = 0; i < activeWindow.length; i++) {
          for (let j = i + 1; j < activeWindow.length; j++) {
            const seekA = activeWindow[i];
            const seekB = activeWindow[j];
            const positionDelta = Math.abs(seekA.landingPosition - seekB.landingPosition);

            if (positionDelta <= proximitySec) {
              // Confusion detected!
              setIsConfusionDetected(true);
              setDetectedTimestamp(seekB.landingPosition);
              onConfusionTriggered?.(seekB.landingPosition);
              return;
            }
          }
        }
      }
    },
    [windowMs, proximitySec, onConfusionTriggered]
  );

  /**
   * Student dismisses the confusion notification without action.
   * Starts a 3-minute cooldown.
   */
  const dismissConfusion = useCallback(() => {
    setIsConfusionDetected(false);
    cooldownUntilRef.current = Date.now() + cooldownMs;
    // Clear buffer after dismissal
    seekBufferRef.current = [];
  }, [cooldownMs]);

  /**
   * Student interacts with one of the explanation mode actions.
   * Starts a 3-minute cooldown and resets detection state.
   */
  const resolveConfusion = useCallback(() => {
    setIsConfusionDetected(false);
    cooldownUntilRef.current = Date.now() + cooldownMs;
    seekBufferRef.current = [];
  }, [cooldownMs]);

  /**
   * Resets cooldown manually (useful for testing).
   */
  const resetCooldown = useCallback(() => {
    cooldownUntilRef.current = 0;
    seekBufferRef.current = [];
    setIsConfusionDetected(false);
  }, []);

  return {
    isConfusionDetected,
    detectedTimestamp,
    recordSeek,
    dismissConfusion,
    resolveConfusion,
    resetCooldown,
    getSeekCount: () => seekBufferRef.current.length,
    isInCooldown: () => Date.now() < cooldownUntilRef.current
  };
}
