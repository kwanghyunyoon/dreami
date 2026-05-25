import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Platform, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as storage from '../utils/storage';
import * as Notifications from 'expo-notifications';
import { colors, typography, spacing, radius, shadow } from '../theme';
import Card from '../components/Card';
import { useLanguage } from '../LanguageContext';
import InfoTooltip from '../components/InfoTooltip';

// ─── Notification handler (show banner even when app is foregrounded) ─────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert 12-h picker values to a 24-h hour */
function to24h(hour12, isPM) {
  // 12 AM → 0, 12 PM → 12, 1–11 PM → 13–23
  if (!isPM) return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

// Scheduled local notifications are not supported on web
const supportsNotifications = Platform.OS !== 'web';

/** Cancel all notifications that were created by this screen */
async function cancelAlarmNotifications() {
  if (!supportsNotifications) return;
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const ours = all.filter((n) => n.content.data?.source === 'sleep-app-alarm');
  await Promise.all(
    ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Schedule weekly wake-up alarm for each selected day */
async function scheduleWakeAlarms(h24, minute, days, label) {
  if (!supportsNotifications) return;
  await cancelAlarmNotifications();
  for (const dayIndex of days) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: label,
        body: '⏰',
        sound: true,
        data: { source: 'sleep-app-alarm', kind: 'wake' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: dayIndex + 1, // expo-notifications: 1 = Sun, 7 = Sat
        hour: h24,
        minute,
        repeats: true,
      },
    });
  }
}

/** Schedule bedtime reminder (fires alarmTime - 8 h - offsetMinutes, weekly) */
async function scheduleBedtimeReminders(h24, minute, days, offsetMinutes, label, body) {
  if (!supportsNotifications) return;
  // Cancel any existing bedtime reminders
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const ours = all.filter((n) => n.content.data?.kind === 'bedtime');
  await Promise.all(
    ours.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  // Compute bedtime: (alarm - 8 h - offset)
  const totalMin = h24 * 60 + minute - 8 * 60 - offsetMinutes;
  const normalMin = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const bdH = Math.floor(normalMin / 60);
  const bdM = normalMin % 60;

  for (const dayIndex of days) {
    // Bedtime is the day before the alarm day
    const bdDay = ((dayIndex - 1 + 7) % 7) + 1;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: label,
        body: body,
        sound: false,
        data: { source: 'sleep-app-alarm', kind: 'bedtime' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: bdDay,
        hour: bdH,
        minute: bdM,
        repeats: true,
      },
    });
  }
}

// ─── Time picker sub-component ───────────────────────────────────────────────
function TimeDisplay({ hour, minute, isPM, onHourUp, onHourDown, onMinUp, onMinDown, onToggleAMPM }) {
  return (
    <View style={timeStyles.wrapper}>
      <View style={timeStyles.col}>
        <TouchableOpacity onPress={onHourUp} style={timeStyles.arrow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="chevron-up" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={timeStyles.digit}>{String(hour).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={onHourDown} style={timeStyles.arrow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="chevron-down" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={timeStyles.colon}>:</Text>

      <View style={timeStyles.col}>
        <TouchableOpacity onPress={onMinUp} style={timeStyles.arrow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="chevron-up" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={timeStyles.digit}>{String(minute).padStart(2, '0')}</Text>
        <TouchableOpacity onPress={onMinDown} style={timeStyles.arrow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Ionicons name="chevron-down" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onToggleAMPM} style={timeStyles.ampm}>
        <Text style={[timeStyles.amLabel, !isPM && timeStyles.amLabelActive]}>AM</Text>
        <Text style={[timeStyles.amLabel,  isPM && timeStyles.amLabelActive]}>PM</Text>
      </TouchableOpacity>
    </View>
  );
}

const timeStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  col: { alignItems: 'center' },
  arrow: { padding: 8 },
  digit: {
    fontSize: 52,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -2,
    width: 70,
    textAlign: 'center',
  },
  colon: { fontSize: 44, fontWeight: '300', color: colors.primaryMid, marginBottom: 8 },
  ampm: { marginLeft: 8, gap: 6 },
  amLabel: { fontSize: 15, fontWeight: '600', color: colors.border },
  amLabelActive: { color: colors.primary },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AlarmScreen() {
  const { t } = useLanguage();

  const [alarmHour, setAlarmHour]       = useState(7);
  const [alarmMinute, setAlarmMinute]   = useState(0);
  const [isPM, setIsPM]                 = useState(false);
  const [alarmOn, setAlarmOn]           = useState(false);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon–Fri
  const [bedtimeReminder, setBedtimeReminder] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [permGranted, setPermGranted]   = useState(false);

  // Load persisted state
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem('alarm');
      if (saved) {
        const a = JSON.parse(saved);
        setAlarmHour(a.hour ?? 7);
        setAlarmMinute(a.minute ?? 0);
        setIsPM(a.isPM ?? false);
        setAlarmOn(a.on ?? false);
        setSelectedDays(a.days ?? [1, 2, 3, 4, 5]);
        setBedtimeReminder(a.bedtimeReminder ?? false);
        setReminderMinutes(a.reminderMinutes ?? 30);
      }
    })();
  }, []);

  // Request notification permissions once (no-op on web)
  useEffect(() => {
    if (!supportsNotifications) { setPermGranted(false); return; }
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setPermGranted(true);
      }
    })();
  }, []);

  const requestPermissions = useCallback(async () => {
    if (!supportsNotifications) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setPermGranted(granted);
    return granted;
  }, []);

  // Persist + reschedule whenever alarm config changes
  const saveAlarm = useCallback(async (overrides = {}) => {
    const state = {
      hour: alarmHour,
      minute: alarmMinute,
      isPM,
      on: alarmOn,
      days: selectedDays,
      bedtimeReminder,
      reminderMinutes,
      ...overrides,
    };
    await storage.setItem('alarm', JSON.stringify(state));

    if (state.on && state.days.length > 0) {
      const h24 = to24h(state.hour, state.isPM);
      await scheduleWakeAlarms(h24, state.minute, state.days, t.alarm.alarmLabel);

      if (state.bedtimeReminder) {
        await scheduleBedtimeReminders(
          h24, state.minute, state.days, state.reminderMinutes,
          t.alarm.bedtimeReminder,
          t.alarm.reminderBody(state.reminderMinutes),
        );
      } else {
        // Cancel any lingering bedtime reminders
        const all = await Notifications.getAllScheduledNotificationsAsync();
        await Promise.all(
          all
            .filter((n) => n.content.data?.kind === 'bedtime')
            .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
        );
      }
    } else {
      await cancelAlarmNotifications();
    }
  }, [alarmHour, alarmMinute, isPM, alarmOn, selectedDays, bedtimeReminder, reminderMinutes, t]);

  const toggleDay = (i) => {
    const next = selectedDays.includes(i)
      ? selectedDays.filter((d) => d !== i)
      : [...selectedDays, i];
    setSelectedDays(next);
    saveAlarm({ days: next });
  };

  const handleAlarmToggle = async (v) => {
    if (v && !permGranted) {
      const ok = await requestPermissions();
      if (!ok) {
        Alert.alert(
          t.alarm.alarmLabel,
          Platform.OS === 'ios'
            ? 'Please enable notifications in Settings → Notifications.'
            : 'Please enable notifications in your device settings.',
        );
        return;
      }
    }
    setAlarmOn(v);
    await saveAlarm({ on: v });
  };

  const handleBedtimeToggle = async (v) => {
    setBedtimeReminder(v);
    await saveAlarm({ bedtimeReminder: v });
  };

  const handleReminderMinutes = async (m) => {
    setReminderMinutes(m);
    await saveAlarm({ reminderMinutes: m });
  };

  /** Human-readable countdown to next alarm firing */
  const nextAlarmText = () => {
    if (selectedDays.length === 0) return '';
    const now = new Date();
    const h24 = to24h(alarmHour, isPM);
    const alarm = new Date();
    alarm.setHours(h24, alarmMinute, 0, 0);
    if (alarm <= now) alarm.setDate(alarm.getDate() + 1);
    // Walk forward until we land on a day the alarm is actually scheduled for
    for (let i = 0; i < 7; i++) {
      if (selectedDays.includes(alarm.getDay())) break;
      alarm.setDate(alarm.getDate() + 1);
    }
    const diff = alarm - now;
    const hLeft = Math.floor(diff / 3_600_000);
    const mLeft = Math.floor((diff % 3_600_000) / 60_000);
    return t.alarm.alarmIn(hLeft, mLeft);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{t.alarm.title}</Text>
      <Text style={styles.subtitle}>{t.alarm.subtitle}</Text>

      {/* Time picker */}
      <Card style={styles.timeCard}>
        <TimeDisplay
          hour={alarmHour}
          minute={alarmMinute}
          isPM={isPM}
          onHourUp={() => {
            const v = (alarmHour % 12) + 1;
            const next = v === 0 ? 12 : v;
            setAlarmHour(next);
            saveAlarm({ hour: next });
          }}
          onHourDown={() => {
            const next = ((alarmHour - 2 + 12) % 12) + 1;
            setAlarmHour(next);
            saveAlarm({ hour: next });
          }}
          onMinUp={() => {
            const next = (alarmMinute + 5) % 60;
            setAlarmMinute(next);
            saveAlarm({ minute: next });
          }}
          onMinDown={() => {
            const next = (alarmMinute - 5 + 60) % 60;
            setAlarmMinute(next);
            saveAlarm({ minute: next });
          }}
          onToggleAMPM={() => {
            const next = !isPM;
            setIsPM(next);
            saveAlarm({ isPM: next });
          }}
        />

        {/* Day selector */}
        <View style={styles.daysRow}>
          {t.alarm.days.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayPill, selectedDays.includes(i) && styles.dayPillActive]}
              onPress={() => toggleDay(i)}
            >
              <Text style={[styles.dayLabel, selectedDays.includes(i) && styles.dayLabelActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alarm toggle row */}
        <View style={styles.alarmToggleRow}>
          <View>
            <Text style={styles.toggleTitle}>{t.alarm.alarmLabel}</Text>
            {alarmOn && (
              <Text style={styles.nextAlarm}>{nextAlarmText()}</Text>
            )}
          </View>
          <Switch
            value={alarmOn}
            onValueChange={handleAlarmToggle}
            trackColor={{ false: colors.border, true: colors.primaryMid }}
            thumbColor={alarmOn ? colors.primary : colors.white}
          />
        </View>
      </Card>

      {/* Bedtime reminder */}
      <Card style={styles.reminderCard}>
        <View style={styles.reminderHeader}>
          <View style={styles.reminderIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.toggleTitle}>{t.alarm.bedtimeReminder}</Text>
              <InfoTooltip text={t.tooltips.bedtimeReminder} />
            </View>
            <Text style={styles.reminderSub}>{t.alarm.reminderSub}</Text>
          </View>
          <Switch
            value={bedtimeReminder}
            onValueChange={handleBedtimeToggle}
            trackColor={{ false: colors.border, true: colors.primaryMid }}
            thumbColor={bedtimeReminder ? colors.primary : colors.white}
          />
        </View>

        {bedtimeReminder && (
          <>
            <Text style={styles.reminderLabel}>{t.alarm.remindMe}</Text>
            <View style={styles.reminderPills}>
              {[15, 30, 45, 60].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.reminderPill,
                    reminderMinutes === m && styles.reminderPillActive,
                  ]}
                  onPress={() => handleReminderMinutes(m)}
                >
                  <Text
                    style={[
                      styles.reminderPillText,
                      reminderMinutes === m && styles.reminderPillTextActive,
                    ]}
                  >
                    {t.alarm.before(m)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </Card>

      {/* Tip card */}
      <Card variant="tinted">
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={styles.tipText}>
            <Text style={{ fontWeight: '600', color: colors.primary }}>
              {t.alarm.tipTitle}
            </Text>
            {t.alarm.tipText}
          </Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: { ...typography.h2, marginBottom: 4 },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },

  timeCard: { marginBottom: spacing.md, alignItems: 'center' },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.xl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dayPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayLabel: { fontSize: 12, fontWeight: '600', color: colors.subtext },
  dayLabelActive: { color: colors.white },

  alarmToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    width: '100%',
  },
  toggleTitle: { ...typography.body, fontWeight: '600' },
  nextAlarm: { ...typography.caption, color: colors.primary, marginTop: 2 },

  reminderCard: { marginBottom: spacing.md },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderSub: { ...typography.caption, marginTop: 2 },
  reminderLabel: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  reminderPills: { flexDirection: 'row', gap: spacing.sm },
  reminderPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  reminderPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  reminderPillText: { fontSize: 12, fontWeight: '600', color: colors.subtext },
  reminderPillTextActive: { color: colors.white },

  tipText: { ...typography.caption, flex: 1, lineHeight: 20 },
});
