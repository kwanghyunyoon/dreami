import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

export default function SoundInfoModal({ visible, sound, soundMeta, onClose }) {
  if (!sound || !soundMeta) return null;

  const pills = soundMeta.bestFor
    ? soundMeta.bestFor.split(',').map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: sound.bg }]}>
            <Ionicons name={sound.icon} size={26} color={sound.color} />
          </View>
          <Text style={styles.soundName} numberOfLines={1}>
            {soundMeta.label}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* What it does */}
          {soundMeta.about ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What it does</Text>
              <Text style={styles.bodyText}>{soundMeta.about}</Text>
            </View>
          ) : null}

          {/* Best for */}
          {pills.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Best for</Text>
              <View style={styles.pillRow}>
                {pills.map((pill) => (
                  <View
                    key={pill}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: sound.bg,
                        borderColor: sound.color + '60',
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: sound.color }]}>
                      {pill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>

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
    maxHeight: '75%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundName: {
    ...typography.h3,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  bodyText: {
    ...typography.body,
    lineHeight: 24,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
