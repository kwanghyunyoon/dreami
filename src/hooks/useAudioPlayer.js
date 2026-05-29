import { useRef, useEffect, useCallback, useState } from 'react';
import { Audio } from 'expo-av';

/**
 * Manages up to two layered ambient sounds: primary + optional layer.
 * Tapping an active sound stops its slot; tapping a third sound replaces the layer.
 * Both sounds share the same volume level.
 */
export default function useAudioPlayer() {
  const refs    = useRef({ primary: null, layer: null });
  const timerRef = useRef(null);

  const [primaryId, setPrimaryId] = useState(null);
  const [layerId,   setLayerId]   = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [volume,    setVolume]    = useState(0.8);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return () => {
      _clearTimer();
      _unloadSlot('primary');
      _unloadSlot('layer');
    };
  }, []);

  // ── Internal helpers ────────────────────────────────────────────────────────

  const _clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const _unloadSlot = async (slot) => {
    const snd = refs.current[slot];
    if (!snd) return;
    try { await snd.stopAsync(); await snd.unloadAsync(); } catch (_) {}
    refs.current[slot] = null;
  };

  const _armTimer = (timerMs) => {
    _clearTimer();
    if (timerMs > 0) {
      timerRef.current = setTimeout(async () => {
        await _unloadSlot('primary');
        await _unloadSlot('layer');
        setPrimaryId(null);
        setLayerId(null);
      }, timerMs);
    }
  };

  const _loadSlot = async (slot, id, source, vol) => {
    setLoadingId(id);
    try {
      await _unloadSlot(slot);
      const { sound } = await Audio.Sound.createAsync(
        source,
        { isLooping: true, volume: vol, shouldPlay: true },
      );
      refs.current[slot] = sound;
      if (slot === 'primary') setPrimaryId(id);
      else setLayerId(id);
    } catch (err) {
      console.warn('[useAudioPlayer] load error:', err);
    } finally {
      setLoadingId(null);
    }
  };

  // ── Public API ──────────────────────────────────────────────────────────────

  const stopAll = useCallback(async () => {
    _clearTimer();
    await Promise.all([_unloadSlot('primary'), _unloadSlot('layer')]);
    setPrimaryId(null);
    setLayerId(null);
  }, []);

  /**
   * Toggle a sound:
   *   - Already primary  → stop primary; promote layer to primary if present
   *   - Already layer    → stop layer
   *   - No primary       → load as primary
   *   - Primary, no layer → load as layer
   *   - Both full        → replace layer
   */
  const toggle = useCallback(async (id, source, timerMs = 0) => {
    const curPrimary = primaryId;
    const curLayer   = layerId;

    if (id === curPrimary) {
      await _unloadSlot('primary');
      if (curLayer) {
        // promote layer → primary (audio object keeps playing, just move the ref)
        refs.current.primary = refs.current.layer;
        refs.current.layer   = null;
        setPrimaryId(curLayer);
        setLayerId(null);
      } else {
        setPrimaryId(null);
      }
      _armTimer(timerMs);
      return;
    }

    if (id === curLayer) {
      await _unloadSlot('layer');
      setLayerId(null);
      _armTimer(timerMs);
      return;
    }

    const slot = curPrimary ? 'layer' : 'primary';
    await _loadSlot(slot, id, source, volume);
    _armTimer(timerMs);
  }, [primaryId, layerId, volume]);

  /** Reset the auto-stop timer without reloading audio. */
  const updateTimer = useCallback((timerMs) => {
    _armTimer(timerMs);
  }, []);

  /** Change volume for all active slots. */
  const changeVolume = useCallback(async (v) => {
    setVolume(v);
    for (const slot of ['primary', 'layer']) {
      if (refs.current[slot]) {
        try { await refs.current[slot].setVolumeAsync(v); } catch (_) {}
      }
    }
  }, []);

  const isActive = useCallback(
    (id) => id === primaryId || id === layerId,
    [primaryId, layerId],
  );

  return {
    primaryId,
    layerId,
    playingId: primaryId,        // kept for banner backward-compat
    loadingId,
    isLoading: loadingId !== null,
    isActive,
    volume,
    toggle,
    stopAll,
    changeVolume,
    updateTimer,
  };
}
