/**
 * InfoTooltip — small inline `?` button that opens an animated popover overlay.
 *
 * Usage:
 *   <InfoTooltip text="Explanation of this field." />
 *   <InfoTooltip title="Sleep quality" text="Rated 1–5 based on duration and timing." />
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '../theme';

// ── Animation constants ───────────────────────────────────────────────────────
const ENTER_DURATION = 180;
const EXIT_DURATION  = 140;

export default function InfoTooltip({ text, title }) {
  const [visible, setVisible] = useState(false);

  // Shared animated values — driven together for enter / exit
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  function open() {
    setVisible(true);
    // Reset to initial values before animating in
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ENTER_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: ENTER_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function close() {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: EXIT_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: EXIT_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }

  return (
    <>
      {/* ── Trigger button ────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={open}
        style={styles.trigger}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="More information"
        accessibilityRole="button"
      >
        <Text style={styles.triggerText}>?</Text>
      </TouchableOpacity>

      {/* ── Overlay modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        {/* Backdrop — tapping it dismisses the tooltip */}
        <Pressable style={styles.backdrop} onPress={close} />

        {/* Animated card */}
        <View style={styles.centeredOuter} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.card,
              shadow.soft,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Optional title row */}
            {title ? (
              <View style={styles.titleRow}>
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={styles.titleText}>{title}</Text>
              </View>
            ) : null}

            {/* Body text */}
            <Text style={styles.bodyText}>{text}</Text>

            {/* Close button */}
            <TouchableOpacity
              onPress={close}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close-circle" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Trigger
  trigger: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 14,
    textAlign: 'center',
    // Nudge slightly up for optical centering on both platforms
    marginTop: -1,
  },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  // Centering wrapper — sits above backdrop but passes through pointer events
  centeredOuter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tooltip card
  card: {
    width: 280,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    // Close button sits in top-right corner inside the card
    position: 'relative',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleText: {
    ...typography.h3,
    fontSize: 16,
    flex: 1,
  },

  bodyText: {
    ...typography.body,
    color: colors.subtext,
    lineHeight: 22,
    // Leave room so text doesn't collide with close button when there's no title
    paddingRight: spacing.lg,
  },

  // Absolute close button in card corner
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
