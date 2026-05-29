import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

const STARS = [1, 2, 3, 4, 5];

export default function WakeQualityModal({ visible, strings, onSave, onSkip }) {
  const [selected, setSelected] = useState(0);

  const handleSave = () => {
    onSave(selected || null);
    setSelected(0);
  };

  const handleSkip = () => {
    setSelected(0);
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleSkip} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Ionicons name="moon" size={32} color={colors.primary} style={styles.icon} />
        <Text style={styles.title}>{strings.title}</Text>
        <Text style={styles.subtitle}>{strings.subtitle}</Text>

        <View style={styles.starsRow}>
          {STARS.map((n) => (
            <TouchableOpacity key={n} onPress={() => setSelected(n)} hitSlop={8}>
              <Ionicons
                name={selected >= n ? 'star' : 'star-outline'}
                size={40}
                color={selected >= n ? colors.warning : colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !selected && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{strings.save}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.6}>
          <Text style={styles.skipText}>{strings.skip}</Text>
        </TouchableOpacity>

        <SafeAreaView edges={['bottom']} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  icon: { marginBottom: spacing.md },
  title: { ...typography.h2, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.caption, textAlign: 'center', marginBottom: spacing.xl },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  saveBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { ...typography.body, fontWeight: '700', color: colors.white },
  skipBtn: { paddingVertical: spacing.sm },
  skipText: { ...typography.caption, color: colors.subtext, fontWeight: '600' },
});
