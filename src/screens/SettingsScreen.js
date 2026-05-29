import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../LanguageContext';
import { colors, spacing, shadow } from '../theme';
import * as storage from '../utils/storage';
const { exportData, clearAllData } = storage;
import LanguagePicker from '../components/LanguagePicker';
import SecurityModal from '../components/SecurityModal';
import SleepGoalPicker from '../components/SleepGoalPicker';

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color={colors.subtext} style={styles.sectionHeaderIcon} />
      <Text style={styles.sectionHeaderText}>{label}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  iconColor,
  iconBg,
  label,
  sublabel,
  onPress,
  showChevron = true,
  labelStyle,
  isFirst = false,
  isLast = false,
  isOnly = false,
}) {
  const radiusStyle = {
    borderTopLeftRadius: isFirst || isOnly ? 12 : 0,
    borderTopRightRadius: isFirst || isOnly ? 12 : 0,
    borderBottomLeftRadius: isLast || isOnly ? 12 : 0,
    borderBottomRightRadius: isLast || isOnly ? 12 : 0,
  };

  return (
    <TouchableOpacity
      style={[styles.row, radiusStyle]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      {/* Left icon badge */}
      <View style={[styles.iconBadge, iconBg && { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor || colors.primary} />
      </View>

      {/* Label block */}
      <View style={styles.rowTextBlock}>
        <Text style={[styles.rowLabel, labelStyle]}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>

      {/* Right chevron */}
      {showChevron && (
        <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
      )}
    </TouchableOpacity>
  );
}

function RowDivider() {
  return (
    <View style={styles.dividerWrap}>
      <View style={styles.divider} />
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t, lang, languages } = useLanguage();
  const s = t.settings;
  const insets = useSafeAreaInsets();

  const [langPickerVisible, setLangPickerVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [sleepGoal, setSleepGoal] = useState(8);

  useEffect(() => {
    storage.getItem('sleepGoal').then((v) => {
      if (v) setSleepGoal(parseFloat(v));
    });
  }, []);

  // Derive the current language object from context
  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleExportData = async () => {
    try {
      const result = await exportData();
      const sleepLog = Array.isArray(result.data?.sleepLog) ? result.data.sleepLog : [];
      const sleepCount = sleepLog.length;
      const hasAlarm = result.data?.alarm != null;
      const summary = [
        `Sleep entries: ${sleepCount}`,
        `Alarm configured: ${hasAlarm ? 'Yes' : 'No'}`,
        `Language: ${result.data?.language || 'en'}`,
        `Exported at: ${new Date(result.timestamp).toLocaleString()}`,
      ].join('\n');

      Alert.alert(s.exportData, summary, [{ text: 'OK' }]);
    } catch {
      Alert.alert(s.exportData, 'Export failed. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleClearData = () => {
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
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleOpenNotificationSettings = () => {
    Linking.openSettings();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title */}
        <Text style={styles.screenTitle}>{s.title}</Text>

        {/* ── Section 1: Language ───────────────────────────────────────── */}
        <SectionHeader icon="earth" label={s.language} />

        <View style={styles.group}>
          <SettingsRow
            isOnly
            icon="language"
            iconBg={colors.primaryLight}
            iconColor={colors.primary}
            label={s.language}
            sublabel={`${currentLang.flag}  ${currentLang.nativeName}`}
            onPress={() => setLangPickerVisible(true)}
          />
        </View>

        {/* ── Section 2: Sleep ──────────────────────────────────────────── */}
        <SectionHeader icon="moon-outline" label="Sleep" />

        <View style={styles.group}>
          <SettingsRow
            isOnly
            icon="time-outline"
            iconBg={colors.primaryLight}
            iconColor={colors.primary}
            label={s.sleepGoal}
            sublabel={s.sleepGoalSub(sleepGoal % 1 === 0 ? sleepGoal : sleepGoal.toFixed(1))}
            onPress={() => setGoalPickerVisible(true)}
          />
        </View>

        {/* ── Section 3: Privacy & Security ─────────────────────────────── */}
        <SectionHeader icon="shield-checkmark-outline" label={s.security} />

        <View style={styles.group}>
          <SettingsRow
            isFirst
            icon="shield-checkmark"
            iconBg={colors.primaryLight}
            iconColor={colors.primary}
            label={s.security}
            sublabel={s.securitySub}
            onPress={() => setSecurityModalVisible(true)}
          />
          <RowDivider />
          <SettingsRow
            isLast
            icon="notifications"
            iconBg={`${colors.warning}22`}
            iconColor={colors.warning}
            label={s.notifications}
            sublabel={s.notificationsSub}
            onPress={handleOpenNotificationSettings}
          />
        </View>

        {/* ── Section 3: Data Management ────────────────────────────────── */}
        <SectionHeader icon="server-outline" label="Data Management" />

        <View style={styles.group}>
          <SettingsRow
            isFirst
            icon="download-outline"
            iconBg={`${colors.success}22`}
            iconColor={colors.success}
            label={s.exportData}
            sublabel="Download a copy of your sleep data"
            onPress={handleExportData}
          />
          <RowDivider />
          <SettingsRow
            isLast
            icon="trash-outline"
            iconBg="rgba(255,80,80,0.12)"
            iconColor="#FF5050"
            label={s.clearData}
            sublabel={s.clearConfirm.slice(0, 48) + '…'}
            onPress={handleClearData}
            labelStyle={styles.destructiveLabel}
          />
        </View>

        {/* ── Section 4: About ──────────────────────────────────────────── */}
        <SectionHeader icon="information-circle-outline" label={s.about} />

        <View style={styles.group}>
          {/* App identity row */}
          <View style={[styles.row, styles.aboutRow]}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="moon" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowTextBlock}>
              <Text style={styles.rowLabel}>Dreami</Text>
              <Text style={styles.rowSublabel}>
                {s.version} 1.0.0 · Your sleep companion
              </Text>
            </View>
          </View>

          <RowDivider />

          <SettingsRow
            isLast
            icon="code-slash"
            iconBg={colors.surface}
            iconColor={colors.subtext}
            label={s.openSource}
            sublabel="Third-party packages and licenses"
            onPress={() => {}}
          />
        </View>
      </ScrollView>

      {/* Modals */}
      <LanguagePicker
        visible={langPickerVisible}
        onClose={() => setLangPickerVisible(false)}
      />
      <SecurityModal
        visible={securityModalVisible}
        onClose={() => setSecurityModalVisible(false)}
      />
      <SleepGoalPicker
        visible={goalPickerVisible}
        current={sleepGoal}
        title={s.sleepGoalTitle}
        cancelLabel={s.sleepGoalCancel}
        onSelect={async (h) => {
          setSleepGoal(h);
          await storage.setItem('sleepGoal', String(h));
        }}
        onClose={() => setGoalPickerVisible(false)}
      />
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // Screen title
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginLeft: 4,
    marginTop: spacing.lg,
  },
  sectionHeaderIcon: {
    marginRight: spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.subtext,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Group container (wraps rows, provides the grouped card look)
  group: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadow.card,
  },

  // Individual row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    minHeight: 60,
  },
  aboutRow: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  // Icon badge
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Text
  rowTextBlock: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  rowSublabel: {
    fontSize: 12,
    color: colors.subtext,
    lineHeight: 17,
  },
  destructiveLabel: {
    color: '#FF5050',
  },

  // Divider
  dividerWrap: {
    backgroundColor: colors.card,
    paddingLeft: 52 + spacing.md, // icon badge width + row padding
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
