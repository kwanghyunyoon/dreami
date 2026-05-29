import React, { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

// 5h–10h in 30-minute steps
const GOAL_OPTIONS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

function formatGoal(h) {
  const whole = Math.floor(h);
  return h % 1 === 0 ? `${whole}h` : `${whole}h 30m`;
}

export default function SleepGoalPicker({ visible, current, title, cancelLabel, onSelect, onClose }) {
  const [selected, setSelected] = useState(current);

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {GOAL_OPTIONS.map((h) => {
            const active = selected === h;
            return (
              <TouchableOpacity
                key={h}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => setSelected(h)}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {formatGoal(h)}
                </Text>
                {active && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
            <Text style={styles.confirmText}>Set Goal</Text>
          </TouchableOpacity>
        </View>

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
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionActive: { /* highlight via text only */ },
  optionText: { ...typography.body, color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: { ...typography.body, fontWeight: '600', color: colors.subtext },
  confirmBtn: {
    flex: 1, paddingVertical: 13, borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmText: { ...typography.body, fontWeight: '700', color: colors.white },
});
