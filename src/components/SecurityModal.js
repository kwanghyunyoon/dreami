import React from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../LanguageContext';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { DATA_INVENTORY, exportData, clearAllData } from '../utils/storage';

export default function SecurityModal({ visible, onClose }) {
  const { t } = useLanguage();
  const s = t.settings;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleExport() {
    try {
      await exportData();
      Alert.alert(
        s.exportData,
        'Your data export is ready. (Clipboard copy coming soon.)',
        [{ text: 'OK', style: 'default' }],
      );
    } catch (e) {
      console.warn('[SecurityModal] Export failed:', e);
      Alert.alert('Export failed', String(e));
    }
  }

  function handleClear() {
    Alert.alert(
      s.clearData,
      s.clearConfirm,
      [
        { text: s.clearCancel, style: 'cancel' },
        {
          text: s.clearConfirmBtn,
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            onClose();
          },
        },
      ],
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>

        {/* ── Top safe area + nav bar ────────────────────────────────────── */}
        <SafeAreaView edges={['top']}>
          <View style={styles.navBar}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.navCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="chevron-down" size={26} color={colors.subtext} />
            </TouchableOpacity>
            {/* spacer keeps title area clear */}
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Shield hero ─────────────────────────────────────────────────── */}
          <View style={styles.heroArea}>
            <View style={styles.shieldRing}>
              <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{s.securityTitle}</Text>
            <Text style={styles.heroBody}>{s.securityBody}</Text>
          </View>

          {/* ── What we store ────────────────────────────────────────────── */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>{s.dataStoredTitle}</Text>

            {DATA_INVENTORY.map((item, index) => {
              // Prefer translated label from t.settings.dataItems when index aligns
              const translatedItem =
                Array.isArray(s.dataItems) && s.dataItems[index];
              const displayLabel = translatedItem
                ? translatedItem.key
                : item.label;

              return (
                <View key={item.key}>
                  <View style={styles.dataRow}>
                    {/* Label + description */}
                    <View style={styles.dataText}>
                      <Text style={styles.dataLabel}>{displayLabel}</Text>
                      <Text style={styles.dataDesc}>{item.description}</Text>
                    </View>

                    {/* Storage badge */}
                    <View
                      style={[
                        styles.badge,
                        item.encrypted
                          ? styles.badgeEncrypted
                          : styles.badgeStandard,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.encrypted
                            ? styles.badgeTextEncrypted
                            : styles.badgeTextStandard,
                        ]}
                      >
                        {item.encrypted ? '🔐 Encrypted' : '📦 Standard'}
                      </Text>
                    </View>
                  </View>

                  {/* Separator — skip after last item */}
                  {index < DATA_INVENTORY.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              );
            })}
          </View>

          {/* ── No tracking ──────────────────────────────────────────────── */}
          <View style={styles.noTrackCard}>
            <View style={styles.noTrackIcon}>
              <Ionicons name="eye-off" size={22} color={colors.primaryMid} />
            </View>
            <Text style={styles.noTrackText}>
              No analytics. No accounts. No servers.
            </Text>
          </View>

          {/* ── Footer buttons ────────────────────────────────────────────── */}
          <View style={styles.footerArea}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleExport}
              activeOpacity={0.75}
            >
              <Ionicons name="download-outline" size={18} color={colors.primary} />
              <Text style={styles.btnSecondaryText}>{s.exportData}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDanger}
              onPress={handleClear}
              activeOpacity={0.75}
            >
              <Ionicons name="trash-outline" size={18} color={colors.warning} />
              <Text style={styles.btnDangerText}>{s.clearData}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>Done</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        <SafeAreaView edges={['bottom']} />
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Nav bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  navCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Hero
  heroArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  shieldRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  heroTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroBody: {
    ...typography.body,
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },

  // Data inventory card
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.subtext,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dataText: {
    flex: 1,
    marginRight: spacing.xs,
  },
  dataLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  dataDesc: {
    ...typography.caption,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeEncrypted: {
    backgroundColor: 'rgba(76, 175, 130, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 130, 0.35)',
  },
  badgeStandard: {
    backgroundColor: 'rgba(246, 166, 35, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(246, 166, 35, 0.30)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextEncrypted: {
    color: colors.success,
  },
  badgeTextStandard: {
    color: colors.warning,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  // No-tracking card
  noTrackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  noTrackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTrackText: {
    ...typography.body,
    flex: 1,
    fontWeight: '600',
  },

  // Footer buttons
  footerArea: {
    gap: spacing.sm,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  btnPrimaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.primary + '60',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.warning + '50',
  },
  btnDangerText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.warning,
  },
});
