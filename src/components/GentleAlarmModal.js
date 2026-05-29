import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

// Bundled forest sound — gentle enough for waking
const WAKE_SOURCE = require('../../assets/sounds/forest.m4a');

const TICK_MS     = 1000; // volume update every second

/**
 * Full-screen alarm modal with gradual volume ramp.
 * rampMinutes: 3 | 5 | 10
 */
export default function GentleAlarmModal({ visible, rampMinutes = 5, strings, onDismiss }) {
  const soundRef   = useRef(null);
  const tickRef    = useRef(null);
  const [volume,   setVolume]   = useState(0);
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  // Start pulsing ring animation
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  // Load sound and start ramp when modal opens
  useEffect(() => {
    if (!visible) return;

    let active = true;
    let currentVolume = 0.02;
    const rampSeconds = rampMinutes * 60;
    const increment   = (1.0 - currentVolume) / rampSeconds;

    async function start() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        if (!active) return;
        const { sound } = await Audio.Sound.createAsync(
          WAKE_SOURCE,
          { isLooping: true, volume: currentVolume, shouldPlay: true },
        );
        if (!active) {
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
        setVolume(currentVolume);

        tickRef.current = setInterval(async () => {
          currentVolume = Math.min(currentVolume + increment, 1.0);
          setVolume(currentVolume);
          if (soundRef.current) {
            try { await soundRef.current.setVolumeAsync(currentVolume); } catch (_) {}
          }
          if (currentVolume >= 1.0 && tickRef.current) {
            clearInterval(tickRef.current);
            tickRef.current = null;
          }
        }, TICK_MS);
      } catch (err) {
        console.warn('[GentleAlarmModal] audio error:', err);
      }
    }

    start();

    return () => {
      active = false;
      clearInterval(tickRef.current);
      tickRef.current = null;
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setVolume(0);
    };
  }, [visible, rampMinutes]);

  const handleDismiss = async () => {
    clearInterval(tickRef.current);
    tickRef.current = null;
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch (_) {}
      soundRef.current = null;
    }
    setVolume(0);
    onDismiss();
  };

  const pct = Math.round(volume * 100);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.root}>
        {/* Pulse ring */}
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />

        {/* Moon icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="sunny" size={56} color={colors.warning} />
        </View>

        <Text style={styles.greeting}>{strings.goodMorning}</Text>
        <Text style={styles.subtitle}>{strings.alarmRinging}</Text>

        {/* Volume ramp indicator */}
        <View style={styles.rampWrap}>
          <View style={styles.rampTrack}>
            <View style={[styles.rampBar, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.rampPct}>{pct}%</Text>
        </View>

        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} activeOpacity={0.85}>
          <Ionicons name="sunny-outline" size={18} color={colors.background} style={{ marginRight: 8 }} />
          <Text style={styles.dismissText}>{strings.dismiss}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: colors.primaryLight,
    opacity: 0.6,
  },
  iconWrap: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  greeting: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
  subtitle:  { ...typography.body, color: colors.subtext, textAlign: 'center', marginBottom: spacing.xl * 2 },
  rampWrap:  { width: '100%', marginBottom: spacing.xl * 2, gap: spacing.sm },
  rampTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  rampBar:   { height: '100%', backgroundColor: colors.warning, borderRadius: 4 },
  rampPct:   { ...typography.caption, fontWeight: '700', color: colors.warning, textAlign: 'right' },
  dismissBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 40, paddingVertical: 16,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  dismissText: { ...typography.body, fontWeight: '700', color: colors.background },
});
