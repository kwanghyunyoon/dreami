import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Easing, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as storage from '../utils/storage';
import { calcStreak } from '../utils/streak';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { colors, typography, spacing, radius, shadow } from '../theme';
import Card from '../components/Card';
import { useLanguage } from '../LanguageContext';
import { useHelp } from '../context/HelpContext';
import BreathingModal from '../components/BreathingModal';
import WakeQualityModal from '../components/WakeQualityModal';
import InfoTooltip from '../components/InfoTooltip';

// Curated Korean sleep / guided-imagery sessions.
// Sources: 요가소년 channel, Korean ASMR creators (verified May 2026).
const GUIDED_SESSIONS = [
  { id: 'sleep-meditation', youtubeId: 'qWDJVbyX25A', durationLabel: '~30분', icon: 'moon-outline',           accentColor: '#7C74FF' },
  { id: 'guided-deep',      youtubeId: '4qlWzK75NrQ', durationLabel: '~20분', icon: 'body-outline',           accentColor: '#4CAF82' },
  { id: 'asmr-dream',       youtubeId: '9kQzWtosAxo', durationLabel: '~45분', icon: 'sparkles-outline',       accentColor: '#F6A623' },
  { id: 'sleep-music',      youtubeId: 'K_LEbhHLCbk', durationLabel: '30분',  icon: 'musical-notes-outline',  accentColor: '#3ABEFF' },
];

function to24h(hour12, isPM) {
  if (!isPM) return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function formatTime12(h24, minute) {
  const isPM = h24 >= 12;
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
}

function getGreeting(t) {
  const hour = new Date().getHours();
  if (hour < 12) return { text: t.greetings.morning, icon: '☀️' };
  if (hour < 17) return { text: t.greetings.afternoon, icon: '🌤️' };
  if (hour < 21) return { text: t.greetings.evening, icon: '🌙' };
  return { text: t.greetings.night, icon: '✨' };
}

function formatDuration(ms) {
  if (!ms || ms < 60_000) return '—';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HomeScreen({ navigation }) {
  const { t } = useLanguage();
  const { setShowHelp } = useHelp();
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStart, setSleepStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [lastSleep, setLastSleep] = useState(null);
  const [streak, setStreak] = useState(0);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [bedtimeSuggestion, setBedtimeSuggestion] = useState(null);
  const [reminderSet, setReminderSet] = useState(false);
  const [breathingVisible, setBreathingVisible] = useState(false);
  const [pendingEntry, setPendingEntry] = useState(null);
  const lastSuggestionKey = useRef(null); // tracks 'HH:MM' of current suggestion
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const greeting = getGreeting(t);

  // Load state from storage
  useEffect(() => {
    (async () => {
      const stored = await storage.getItem('sleepStart');
      const last = await storage.getItem('lastSleep');
      const logRaw = await storage.getItem('sleepLog');
      if (stored) {
        setIsSleeping(true);
        setSleepStart(stored);
      }
      if (last) setLastSleep(JSON.parse(last));
      if (logRaw) setStreak(calcStreak(JSON.parse(logRaw)));
      const goal = await storage.getItem('sleepGoal');
      if (goal) setSleepGoal(parseFloat(goal));
    })();
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!isSleeping || !sleepStart) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - new Date(sleepStart).getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [isSleeping, sleepStart]);

  // Pulse animation when sleeping
  useEffect(() => {
    if (isSleeping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isSleeping]);

  // Recompute bedtime suggestion whenever Home gains focus (e.g. after setting alarm)
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const alarmRaw = await storage.getItem('alarm');
        const logRaw = await storage.getItem('sleepLog');

        if (!alarmRaw) {
          setBedtimeSuggestion(null);
          lastSuggestionKey.current = null;
          return;
        }
        const alarm = JSON.parse(alarmRaw);
        if (!alarm.on) {
          setBedtimeSuggestion(null);
          lastSuggestionKey.current = null;
          return;
        }

        const log = logRaw ? JSON.parse(logRaw) : [];
        const isDefault = log.length === 0;
        const avgMs = isDefault
          ? 8 * 3_600_000
          : log.reduce((s, e) => s + e.duration, 0) / log.length;

        const h24 = to24h(alarm.hour, alarm.isPM);
        const alarmTotalMin = h24 * 60 + alarm.minute;
        const avgMin = Math.round(avgMs / 60_000);
        const bedMin = ((alarmTotalMin - avgMin) % (24 * 60) + 24 * 60) % (24 * 60);

        const newKey = `${Math.floor(bedMin / 60)}:${bedMin % 60}`;
        // Only reset "Remind me" if the suggested bedtime actually changed
        if (newKey !== lastSuggestionKey.current) {
          lastSuggestionKey.current = newKey;
          setReminderSet(false);
        }

        setBedtimeSuggestion({
          hour: Math.floor(bedMin / 60),
          minute: bedMin % 60,
          avgHours: (avgMs / 3_600_000).toFixed(1),
          alarmLabel: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')} ${alarm.isPM ? 'PM' : 'AM'}`,
          isDefault,
        });
      })();
    }, []),
  );

  const handleSetBedtimeReminder = useCallback(async () => {
    if (!bedtimeSuggestion) return;
    if (Platform.OS === 'web') { setReminderSet(true); return; } // web: no native notifications

    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === 'granted';
    if (!granted) {
      const { status: s } = await Notifications.requestPermissionsAsync();
      granted = s === 'granted';
    }
    if (!granted) return;

    const now = new Date();
    const bedtime = new Date();
    bedtime.setHours(bedtimeSuggestion.hour, bedtimeSuggestion.minute, 0, 0);
    if (bedtime <= now) bedtime.setDate(bedtime.getDate() + 1); // schedule for tomorrow if already past

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.home.bedtimeReminderTitle,
        body: t.home.bedtimeReminderBody,
        data: { source: 'sleep-app-bedtime-suggestion' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: bedtime,
      },
    });
    setReminderSet(true);
  }, [bedtimeSuggestion, t]);

  const handleOpenSession = useCallback((session) => {
    Linking.openURL(`https://youtu.be/${session.youtubeId}`);
  }, []);

  const handleToggle = async () => {
    if (!isSleeping) {
      const now = new Date().toISOString();
      setIsSleeping(true);
      setSleepStart(now);
      setElapsed(0);
      await storage.setItem('sleepStart', now);
    } else {
      const end = new Date().toISOString();
      const duration = Date.now() - new Date(sleepStart).getTime();
      const entry = { start: sleepStart, end, duration, quality: null };

      const raw = await storage.getItem('sleepLog');
      const log = raw ? JSON.parse(raw) : [];
      log.unshift(entry);
      await storage.setItem('sleepLog', JSON.stringify(log));
      await storage.setItem('lastSleep', JSON.stringify(entry));
      await storage.removeItem('sleepStart');

      setIsSleeping(false);
      setSleepStart(null);
      setElapsed(0);
      setLastSleep(entry);
      setStreak(calcStreak(log));
      setPendingEntry(entry);
    }
  };

  const handleQualitySave = useCallback(async (quality) => {
    if (!pendingEntry) return;
    const raw = await storage.getItem('sleepLog');
    const log = raw ? JSON.parse(raw) : [];
    if (log.length > 0) {
      log[0] = { ...log[0], quality };
      await storage.setItem('sleepLog', JSON.stringify(log));
      await storage.setItem('lastSleep', JSON.stringify(log[0]));
      setLastSleep(log[0]);
    }
    setPendingEntry(null);
  }, [pendingEntry]);

  const handleQualitySkip = useCallback(() => {
    setPendingEntry(null);
  }, []);

  return (
    <View style={styles.screenRoot}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting.icon} {greeting.text}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString(t.locale, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Main Sleep Button */}
      <View style={styles.buttonWrapper}>
        <Animated.View style={[styles.pulseRing, isSleeping && styles.pulseRingActive, { transform: [{ scale: pulseAnim }] }]} />
        <TouchableOpacity
          style={[styles.sleepButton, isSleeping && styles.sleepButtonActive]}
          onPress={handleToggle}
          activeOpacity={0.85}
        >
          <Ionicons name={isSleeping ? 'moon' : 'moon-outline'} size={40} color={isSleeping ? colors.white : colors.primary} />
          <Text style={[styles.sleepButtonLabel, isSleeping && styles.sleepButtonLabelActive]}>
            {isSleeping ? t.home.tapToWake : t.home.startSleep}
          </Text>
          {isSleeping && (
            <Text style={styles.elapsedText}>{formatDuration(elapsed)}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Getting Started Checklist — only shown before first sleep is logged */}
      {lastSleep === null && !isSleeping && (
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>{t.home.gettingStarted.title}</Text>
          {t.home.gettingStarted.steps.map((step, i) => (
            <View key={i} style={[styles.stepRow, i === 0 && styles.stepRowFirst]}>
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Last Sleep Card */}
      {lastSleep && (
        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>{t.home.lastNight}</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDuration(lastSleep.duration)}</Text>
              <Text style={styles.statLabel}>{t.home.duration}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatTime(lastSleep.start)}</Text>
              <Text style={styles.statLabel}>{t.home.fellAsleep}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatTime(lastSleep.end)}</Text>
              <Text style={styles.statLabel}>{t.home.wokeUp}</Text>
            </View>
          </View>
          {/* Goal progress bar */}
          {(() => {
            const pct = Math.min(lastSleep.duration / (sleepGoal * 3_600_000), 1);
            const met = pct >= 1;
            const barColor = met ? colors.success : pct >= 0.85 ? colors.warning : colors.primary;
            return (
              <View style={styles.goalWrap}>
                <View style={styles.goalTrack}>
                  <View style={[styles.goalBar, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={[styles.goalLabel, { color: barColor }]}>
                  {met ? '✓ Goal met' : `${Math.round(pct * 100)}% of ${sleepGoal % 1 === 0 ? sleepGoal : sleepGoal.toFixed(1)}h goal`}
                </Text>
              </View>
            );
          })()}
        </Card>
      )}

      {/* Streak card */}
      {!isSleeping && (
        <Card style={styles.card}>
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>{streak >= 3 ? '🔥' : '🌙'}</Text>
            <View style={{ flex: 1 }}>
              {streak >= 1 ? (
                <>
                  <Text style={styles.streakCount}>
                    {streak} {streak === 1 ? t.home.streak.night : t.home.streak.nights}
                  </Text>
                  <Text style={styles.streakSub}>{t.home.streak.keep}</Text>
                </>
              ) : (
                <Text style={styles.streakSub}>{t.home.streak.start}</Text>
              )}
            </View>
          </View>
        </Card>
      )}

      {/* Smart Bedtime Suggestion */}
      {bedtimeSuggestion && !isSleeping && (
        <Card style={styles.card}>
          <View style={styles.suggRow}>
            <View style={[styles.quickIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="bed-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md }}>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t.home.suggestedBedtime}</Text>
                <InfoTooltip text={t.tooltips.bedtimeSuggestion} />
              </View>
              <Text style={styles.suggTime}>
                {formatTime12(bedtimeSuggestion.hour, bedtimeSuggestion.minute)}
              </Text>
              <Text style={styles.suggSub}>
                {bedtimeSuggestion.isDefault
                  ? t.home.suggestionSubDefault(bedtimeSuggestion.alarmLabel)
                  : t.home.suggestionSub(bedtimeSuggestion.avgHours, bedtimeSuggestion.alarmLabel)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.remindBtn, reminderSet && styles.remindBtnDone]}
            onPress={handleSetBedtimeReminder}
            disabled={reminderSet}
            activeOpacity={0.75}
          >
            <Ionicons
              name={reminderSet ? 'checkmark-circle' : 'notifications-outline'}
              size={15}
              color={reminderSet ? colors.success : colors.primary}
            />
            <Text style={[styles.remindBtnText, reminderSet && styles.remindBtnTextDone]}>
              {reminderSet ? t.home.reminderSet : t.home.remindMe}
            </Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Guided Sessions */}
      {!isSleeping && (
        <Card style={styles.card}>
          <View style={styles.sessionHeader}>
            <Ionicons name="play-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionLabel}>{t.home.tonightSession}</Text>
          </View>
          {GUIDED_SESSIONS.map((session, index) => {
            const meta = t.sessionList[session.id];
            return (
              <TouchableOpacity
                key={session.id}
                style={[styles.sessionRow, index === 0 && styles.sessionRowFirst]}
                onPress={() => handleOpenSession(session)}
                activeOpacity={0.7}
              >
                <View style={[styles.sessionIcon, { backgroundColor: session.accentColor + '22' }]}>
                  <Ionicons name={session.icon} size={20} color={session.accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{meta.title}</Text>
                  <Text style={styles.sessionSub}>{session.durationLabel} · {meta.type}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>{t.home.windDown}</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Sounds')} activeOpacity={0.75}>
          <View style={[styles.quickIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="musical-notes" size={22} color={colors.primary} />
          </View>
          <Text style={styles.quickLabel}>{t.home.sounds}</Text>
          <Text style={styles.quickSub}>{t.home.soundsSub}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Alarm')} activeOpacity={0.75}>
          <View style={[styles.quickIcon, { backgroundColor: '#2C1F06' }]}>
            <Ionicons name="alarm" size={22} color={colors.warning} />
          </View>
          <Text style={styles.quickLabel}>{t.home.alarm}</Text>
          <Text style={styles.quickSub}>{t.home.alarmSub}</Text>
        </TouchableOpacity>
      </View>

      {/* Breathing Exercise */}
      <TouchableOpacity onPress={() => setBreathingVisible(true)} activeOpacity={0.8}>
        <Card variant="tinted" style={styles.breathCard}>
          <View style={styles.breathRow}>
            <Ionicons name="leaf-outline" size={20} color={colors.primary} />
            <Text style={styles.breathTitle}>  {t.home.breathing}</Text>
            <InfoTooltip text={t.tooltips.breathing} title={t.home.breathing} />
            <Ionicons name="chevron-forward" size={16} color={colors.primaryMid} style={{ marginLeft: 'auto' }} />
          </View>
          <Text style={styles.breathText}>{t.home.breathingText}</Text>
        </Card>
      </TouchableOpacity>

      {/* Help Button */}
      <TouchableOpacity
        style={styles.helpBtn}
        onPress={() => setShowHelp(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.helpBtnText}>{t.home.helpBtn} ❓</Text>
      </TouchableOpacity>

    </ScrollView>

    <BreathingModal
      visible={breathingVisible}
      onClose={() => setBreathingVisible(false)}
    />
    <WakeQualityModal
      visible={!!pendingEntry}
      strings={t.home.wakeQuality}
      onSave={handleQualitySave}
      onSkip={handleQualitySkip}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.xl },
  greeting: { ...typography.h1 },
  date: { ...typography.caption, marginTop: 4 },

  buttonWrapper: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.sm },
  pulseRing: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: colors.primaryLight, opacity: 0,
  },
  pulseRingActive: { opacity: 1 },
  sleepButton: {
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.soft,
    borderWidth: 2, borderColor: colors.border,
  },
  sleepButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sleepButtonLabel: { ...typography.caption, marginTop: 6, color: colors.subtext },
  sleepButtonLabelActive: { color: 'rgba(255,255,255,0.8)' },
  elapsedText: { fontSize: 22, fontWeight: '700', color: colors.white, marginTop: 4 },

  card: { marginBottom: spacing.md },
  sectionLabel: { ...typography.label, marginBottom: spacing.md },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },

  sectionTitle: { ...typography.h3, marginBottom: spacing.md, marginTop: spacing.sm },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  quickCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, ...shadow.card,
  },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickLabel: { ...typography.body, fontWeight: '600' },
  quickSub: { ...typography.caption, marginTop: 2 },

  breathCard: { marginTop: spacing.sm },
  breathRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  breathTitle: { ...typography.body, fontWeight: '600', color: colors.primary },
  breathText: { ...typography.caption, lineHeight: 20 },

  // Guided sessions card
  sessionHeader:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  sessionRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  sessionRowFirst: { borderTopWidth: 0 },
  sessionIcon:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionTitle:    { ...typography.body, fontWeight: '600' },
  sessionSub:      { ...typography.caption, marginTop: 2 },

  // Getting started steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  stepRowFirst: { borderTopWidth: 0 },
  stepEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  stepLabel: { ...typography.body, fontWeight: '600' },
  stepSub: { ...typography.caption, marginTop: 2, lineHeight: 18 },

  // Help button
  helpBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  helpBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },

  // Goal progress
  goalWrap: { marginTop: spacing.md, gap: 6 },
  goalTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  goalBar: { height: '100%', borderRadius: 3 },
  goalLabel: { ...typography.caption, fontWeight: '600' },

  // Streak
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  streakEmoji: { fontSize: 28 },
  streakCount: { ...typography.h3, color: colors.primary },
  streakSub: { ...typography.caption, marginTop: 2 },

  // Smart bedtime suggestion
  suggRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  suggTime: { fontSize: 28, fontWeight: '800', color: colors.primary, letterSpacing: -1, marginTop: 2 },
  suggSub: { ...typography.caption, marginTop: 3 },
  remindBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  remindBtnDone: { borderColor: colors.success, backgroundColor: colors.success + '1A' },
  remindBtnText: { ...typography.caption, fontWeight: '700', color: colors.primary },
  remindBtnTextDone: { color: colors.success },
});
