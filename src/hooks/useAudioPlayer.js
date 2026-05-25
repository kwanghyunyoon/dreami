import { useRef, useEffect, useCallback, useState } from 'react';
import { Audio } from 'expo-av';

/**
 * Manages a single ambient sound: load → play → loop → timer stop → unload.
 * Only one sound plays at a time. Handles background playback and silent-mode on iOS.
 */
export default function useAudioPlayer() {
  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);

  // Configure audio session once on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,   // keep playing when app is backgrounded
      playsInSilentModeIOS: true,      // respect sleep use-case on iOS
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      _cleanup();
    };
  }, []);

  /** Internal: unload sound and clear timer without touching state */
  const _cleanup = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_) {
        // Ignore errors on cleanup (e.g. already unloaded)
      }
      soundRef.current = null;
    }
  };

  /** Stop the current sound and clear state */
  const stopAll = useCallback(async () => {
    await _cleanup();
    setPlayingId(null);
  }, []);

  /**
   * Play a sound by id.
   * @param {string} soundId   - identifier string (e.g. 'rain')
   * @param {object} source    - expo-av source: require() or { uri: '...' }
   * @param {number} timerMs   - auto-stop after this many ms; 0 = never
   */
  const play = useCallback(async (soundId, source, timerMs = 0) => {
    setIsLoading(true);
    try {
      // Unload whatever was playing first
      await _cleanup();

      const { sound } = await Audio.Sound.createAsync(
        source,
        { isLooping: true, volume, shouldPlay: true },
      );
      soundRef.current = sound;
      setPlayingId(soundId);

      if (timerMs > 0) {
        timerRef.current = setTimeout(async () => {
          await _cleanup();
          setPlayingId(null);
        }, timerMs);
      }
    } catch (err) {
      console.warn('[useAudioPlayer] playback error:', err);
      setPlayingId(null);
    } finally {
      setIsLoading(false);
    }
  }, [volume]);

  /**
   * Change playback volume (0–1). Applies immediately if a sound is loaded.
   */
  const changeVolume = useCallback(async (v) => {
    setVolume(v);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(v);
      } catch (_) {}
    }
  }, []);

  return { playingId, isLoading, volume, play, stopAll, changeVolume };
}
