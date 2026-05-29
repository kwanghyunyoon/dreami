import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as storage from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius, shadow } from '../theme';
import Card from '../components/Card';
import { useLanguage } from '../LanguageContext';
import InfoTooltip from '../components/InfoTooltip';
import CrisisModal from '../components/CrisisModal';

function formatDuration(ms) {
  if (!ms || ms < 60_000) return '—';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(dateStr, locale) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getSleepScore(ms, t, goalHours = 8) {
  const hours = ms / 3600000;
  if (hours >= goalHours) return { score: t.log.scoreGreat, color: colors.success, icon: 'checkmark-circle' };
  if (hours >= goalHours * 0.85) return { score: t.log.scoreOK, color: colors.warning, icon: 'alert-circle' };
  return { score: t.log.scoreShort, color: '#FF7E7E', icon: 'close-circle' };
}

function QualityStars({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Ionicons
            name={value >= n ? 'star' : 'star-outline'}
            size={18}
            color={value >= n ? colors.warning : colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Simple bar chart without external library
function WeekChart({ data, goalHours }) {
  const max = Math.max(...data.map(d => d.hours), goalHours);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  function barColor(hours, isToday) {
    if (hours === 0) return colors.border;
    if (hours >= goalHours) return colors.success;
    if (hours >= goalHours * 0.85) return colors.warning;
    return isToday ? colors.primary : colors.primaryMid;
  }

  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.barCol}>
          <Text style={chartStyles.barValue}>{d.hours > 0 ? `${d.hours}h` : ''}</Text>
          <View style={chartStyles.barTrack}>
            <View
              style={[
                chartStyles.bar,
                {
                  height: `${(d.hours / max) * 100}%`,
                  backgroundColor: barColor(d.hours, d.isToday),
                },
              ]}
            />
          </View>
          <Text style={[chartStyles.dayLabel, d.isToday && chartStyles.dayLabelToday]}>{days[i]}</Text>
        </View>
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6, marginVertical: spacing.md },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: colors.subtext, fontWeight: '600' },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.primaryMid, borderRadius: 4, minHeight: 4 },
  barToday: { backgroundColor: colors.primary },
  dayLabel: { ...typography.caption, fontSize: 11 },
  dayLabelToday: { color: colors.primary, fontWeight: '700' },
});

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function entryColor(entry, goalHours) {
  if (!entry) return null;
  const h = entry.duration / 3_600_000;
  if (h >= goalHours)        return colors.success;
  if (h >= goalHours * 0.85) return colors.warning;
  return '#FF7E7E';
}

function MonthCalendar({ log, goalHours, locale }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // O(1) day-of-month → entry lookup for the visible month
  const entryMap = useMemo(() => {
    const map = {};
    log.forEach((e) => {
      const d = new Date(e.start);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = e;
      }
    });
    return map;
  }, [log, year, month]);

  const firstWeekday  = new Date(year, month, 1).getDay();
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const todayDate     = now.getDate();

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Date(year, month, 1).toLocaleDateString(locale, {
    month: 'long', year: 'numeric',
  });

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <Card style={calStyles.card}>
      {/* Month navigation */}
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prevMonth} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={8} disabled={isCurrentMonth}>
          <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? colors.border : colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={calStyles.row}>
        {DAY_HEADERS.map((d, i) => (
          <Text key={i} style={calStyles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={calStyles.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`blank-${i}`} style={calStyles.cell} />;
          const entry  = entryMap[day];
          const color  = entryColor(entry, goalHours);
          const isToday = isCurrentMonth && day === todayDate;
          return (
            <View key={day} style={calStyles.cell}>
              <View style={[
                calStyles.bubble,
                color  && { backgroundColor: color + '28' },
                isToday && calStyles.todayBubble,
              ]}>
                <Text style={[
                  calStyles.dayNum,
                  color   && { color, fontWeight: '700' },
                  isToday && calStyles.todayNum,
                ]}>
                  {day}
                </Text>
                {color && <View style={[calStyles.dot, { backgroundColor: color }]} />}
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={calStyles.legend}>
        {[
          { color: colors.success, label: 'Goal met' },
          { color: colors.warning, label: 'Close' },
          { color: '#FF7E7E',      label: 'Short' },
        ].map(({ color, label }) => (
          <View key={label} style={calStyles.legendItem}>
            <View style={[calStyles.legendDot, { backgroundColor: color }]} />
            <Text style={calStyles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const calStyles = StyleSheet.create({
  card:        { marginBottom: spacing.lg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  monthLabel:  { ...typography.body, fontWeight: '700' },
  row:         { flexDirection: 'row', marginBottom: 4 },
  dayHeader:   { flex: 1, textAlign: 'center', ...typography.caption, fontWeight: '700', color: colors.subtext },
  grid:        { flexDirection: 'row', flexWrap: 'wrap' },
  cell:        { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  bubble:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayBubble: { borderWidth: 1.5, borderColor: colors.primary },
  dayNum:      { ...typography.caption, fontSize: 12 },
  todayNum:    { color: colors.primary, fontWeight: '700' },
  dot:         { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 4 },
  legend:      { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, justifyContent: 'center' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendText:  { ...typography.caption },
});

export default function LogScreen() {
  const { t } = useLanguage();
  const [log, setLog] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [crisisVisible, setCrisisVisible] = useState(false);
  const debounceTimers = useRef({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [raw, goalRaw] = await Promise.all([
          storage.getItem('sleepLog'),
          storage.getItem('sleepGoal'),
        ]);
        const data = raw ? JSON.parse(raw) : [];
        const goal = goalRaw ? parseFloat(goalRaw) : 8;
        setLog(data);
        setSleepGoal(goal);

        // Build week chart
        const today = new Date();
        const todayDay = today.getDay();
        const week = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - todayDay + i);
          const dayStr = d.toDateString(); // keep English for matching
          const entry = data.find(e => new Date(e.start).toDateString() === dayStr);
          return {
            hours: entry ? Math.round(entry.duration / 3600000 * 10) / 10 : 0,
            isToday: i === todayDay,
          };
        });
        setWeekData(week);
      })();
    }, [])
  );

  const updateQuality = async (index, quality) => {
    const updated = [...log];
    updated[index] = { ...updated[index], quality };
    setLog(updated);
    await storage.setItem('sleepLog', JSON.stringify(updated));
  };

  const updateNotes = (index, text) => {
    // Update state immediately for responsive UI
    const updated = [...log];
    updated[index] = { ...updated[index], notes: text };
    setLog(updated);

    // Crisis keyword detection
    const keywords = t.log.crisisKeywords || [];
    if (keywords.some((kw) => text.toLowerCase().includes(kw))) {
      setCrisisVisible(true);
    }

    // Debounced save to storage (300ms)
    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index]);
    }
    debounceTimers.current[index] = setTimeout(async () => {
      await storage.setItem('sleepLog', JSON.stringify(updated));
    }, 300);
  };

  const avgHours = log.length
    ? (log.reduce((s, e) => s + e.duration, 0) / log.length / 3600000).toFixed(1)
    : null;

  const listHeader = (
    <>
      <Text style={styles.title}>{t.log.title}</Text>
      <Text style={styles.subtitle}>{t.log.subtitle}</Text>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{avgHours ? `${avgHours}h` : '—'}</Text>
          <Text style={styles.statLabel}>{t.log.avgNight}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{log.length}</Text>
          <Text style={styles.statLabel}>{t.log.nightsLogged}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>
            {log.filter(e => e.duration >= sleepGoal * 3_600_000).length}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.statLabel}>{t.log.goodNights}</Text>
            <InfoTooltip text={t.tooltips.goodNights} />
          </View>
        </Card>
      </View>

      {/* Week Chart */}
      {weekData.length > 0 && (
        <Card style={styles.chartCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t.log.thisWeek}</Text>
            <InfoTooltip text={t.tooltips.weekChart} />
          </View>
          <WeekChart data={weekData} goalHours={sleepGoal} />
          <View style={styles.chartLegend}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{t.log.today}</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.primaryMid, marginLeft: 12 }]} />
            <Text style={styles.legendText}>{t.log.otherNights}</Text>
          </View>
        </Card>
      )}

      {/* Month Calendar */}
      {log.length > 0 && (
        <MonthCalendar log={log} goalHours={sleepGoal} locale={t.locale} />
      )}

      <Text style={styles.sectionTitle}>{t.log.history}</Text>
    </>
  );

  const renderEntry = useCallback(({ item: entry, index: i }) => {
    const score = getSleepScore(entry.duration, t, sleepGoal);
    return (
      <Card style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatDate(entry.start, t.locale)}</Text>
          <View style={[styles.scorePill, { backgroundColor: score.color + '1A' }]}>
            <Ionicons name={score.icon} size={12} color={score.color} />
            <Text style={[styles.scoreText, { color: score.color }]}> {score.score}</Text>
          </View>
        </View>
        <View style={styles.entryRow}>
          <View style={styles.entryItem}>
            <Text style={styles.entryValue}>{formatDuration(entry.duration)}</Text>
            <Text style={styles.entryLabel}>{t.log.duration}</Text>
          </View>
          <View style={styles.entryItem}>
            <Text style={styles.entryValue}>{formatTime(entry.start)}</Text>
            <Text style={styles.entryLabel}>{t.log.bedtime}</Text>
          </View>
          <View style={styles.entryItem}>
            <Text style={styles.entryValue}>{formatTime(entry.end)}</Text>
            <Text style={styles.entryLabel}>{t.log.wakeUp}</Text>
          </View>
        </View>
        <View style={styles.qualityRow}>
          <Text style={styles.qualityLabel}>{t.log.quality}</Text>
          <QualityStars value={entry.quality || 0} onChange={(q) => updateQuality(i, q)} />
        </View>
        <View style={styles.notesRow}>
          <Text style={styles.notesLabel}>{t.log.notes}</Text>
          <TextInput
            style={styles.notesInput}
            value={entry.notes || ''}
            onChangeText={(text) => updateNotes(i, text)}
            placeholder={t.log.notesPlaceholder}
            placeholderTextColor={colors.subtext}
            multiline
            numberOfLines={2}
          />
        </View>
      </Card>
    );
  }, [t, sleepGoal, updateQuality, updateNotes]);

  return (
    <View style={styles.screenRoot}>
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      data={log}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderEntry}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        <Card variant="tinted" style={styles.emptyCard}>
          <Ionicons name="moon-outline" size={32} color={colors.primaryMid} />
          <Text style={styles.emptyText}>{t.log.empty}</Text>
        </Card>
      }
    />
    <CrisisModal
      visible={crisisVisible}
      onClose={() => setCrisisVisible(false)}
      t={t}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: { ...typography.h2, marginBottom: 4 },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: spacing.md },
  statValue: { ...typography.h3, color: colors.primary },
  statLabel: { ...typography.caption, marginTop: 2, textAlign: 'center' },

  chartCard: { marginBottom: spacing.lg },
  sectionLabel: { ...typography.label },
  chartLegend: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...typography.caption, marginLeft: 4 },

  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { ...typography.caption, textAlign: 'center', lineHeight: 20 },

  entryCard: { marginBottom: spacing.md },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  entryDate: { ...typography.body, fontWeight: '600' },
  scorePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  scoreText: { fontSize: 12, fontWeight: '600' },
  entryRow: { flexDirection: 'row', marginBottom: spacing.md },
  entryItem: { flex: 1, alignItems: 'center' },
  entryValue: { ...typography.body, fontWeight: '700', color: colors.text },
  entryLabel: { ...typography.caption, marginTop: 2 },
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  qualityLabel: { ...typography.caption, fontWeight: '600' },

  notesRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm },
  notesLabel: { ...typography.caption, fontWeight: '600', marginBottom: spacing.xs },
  notesInput: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 48,
    textAlignVertical: 'top',
  },
});
