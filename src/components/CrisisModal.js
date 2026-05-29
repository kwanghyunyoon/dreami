import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';

export default function CrisisModal({ visible, onClose, t }) {
  const crisis = t.log.crisis;

  const handleLine = (action) => {
    Linking.openURL(action).catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero */}
            <View style={styles.heroArea}>
              <Text style={styles.heroEmoji}>💙</Text>
              <Text style={styles.heroTitle}>{crisis.title}</Text>
            </View>

            {/* Body text */}
            <Text style={styles.bodyText}>{crisis.body}</Text>

            {/* Helpline rows */}
            <View style={styles.linesContainer}>
              {crisis.lines.map((line, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.lineRow}
                  onPress={() => handleLine(line.action)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.lineEmoji}>{line.emoji}</Text>
                  <View style={styles.lineText}>
                    <Text style={styles.lineTitle}>{line.title}</Text>
                    <Text style={styles.lineSub}>{line.sub}</Text>
                  </View>
                  <Text style={styles.lineArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>{crisis.closeBtn}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '88%',
    ...shadow.soft,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  heroArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h2,
    textAlign: 'center',
  },

  bodyText: {
    ...typography.body,
    color: colors.subtext,
    lineHeight: 24,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  linesContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  lineEmoji: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  lineText: {
    flex: 1,
  },
  lineTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  lineSub: {
    ...typography.caption,
    marginTop: 2,
  },
  lineArrow: {
    fontSize: 20,
    color: colors.subtext,
    fontWeight: '300',
  },

  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  closeBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
