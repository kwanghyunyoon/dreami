import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as storage from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, radius, shadow } from '../theme';
import Card from '../components/Card';
import { useLanguage } from '../LanguageContext';
import InfoTooltip from '../components/InfoTooltip';

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

function getSleepScore(ms, t) {
  const hours = ms / 3600000;
  if (hours >= 7 && hours <= 9) return { score: t.log.scoreGreat, color: colors.success, icon: 'checkmark-circle' };
  if (hours >= 6) return { score: t.log.scoreOK, color: colors.warning, icon: 'alert-circle' };
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
function WeekChart({ data }) {
  const max = Math.max(...data.map(d => d.hours), 8);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <View style={chartStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={chartStyles.barCol}>
          <Text style={chartStyles.barValue}>{d.hours > 0 ? `${d.hours}h` : ''}</Text>
          <View style={chartStyles.barTrack}>
            <View
              style={[
                chartStyles.bar,
                { height: `${(d.hours / max) * 100}%` },
                d.isToday && chartStyles.barToday,
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

export default function LogScreen() {
  const { t } = useLanguage();
  const [log, setLog] = useState([]);
  const [weekData, setWeekData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const raw = await storage.getItem('sleepLog');
        const data = raw ? JSON.parse(raw) : [];
        setLog(data);

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

  const avgHours = log.length
    ? (log.reduce((s, e) => s + e.duration, 0) / log.length / 3600000).toFixed(1)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            {log.filter(e => e.duration >= 7 * 3600000).length}
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
          <WeekChart data={weekData} />
          <View style={styles.chartLegend}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{t.log.today}</Text>
            <View style={[styles.legendDot, { backgroundColor: colors.primaryMid, marginLeft: 12 }]} />
            <Text style={styles.legendText}>{t.log.otherNights}</Text>
          </View>
        </Card>
      )}

      {/* Log Entries */}
      <Text style={styles.sectionTitle}>{t.log.history}</Text>
      {log.length === 0 ? (
        <Card variant="tinted" style={styles.emptyCard}>
          <Ionicons name="moon-outline" size={32} color={colors.primaryMid} />
          <Text style={styles.emptyText}>{t.log.empty}</Text>
        </Card>
      ) : (
        log.map((entry, i) => {
          const score = getSleepScore(entry.duration, t);
          return (
            <Card key={i} style={styles.entryCard}>
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
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
