import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { useLanguage } from '../LanguageContext';
import useAudioPlayer from '../hooks/useAudioPlayer';
import * as storage from '../utils/storage';
import { SOUNDS, CATEGORIES } from '../data/soundCatalogue';
import SoundInfoModal from '../components/SoundInfoModal';

// Timer options: [display index → milliseconds]. 0 = never auto-stop.
const TIMER_MS = [15 * 60_000, 30 * 60_000, 60 * 60_000, 0];

// Volume levels shown as icon-steps
const VOLUME_STEPS = [
  { value: 0.25, icon: 'volume-mute-outline' },
  { value: 0.5,  icon: 'volume-low-outline' },
  { value: 0.8,  icon: 'volume-medium-outline' },
  { value: 1.0,  icon: 'volume-high-outline' },
];

// ─── Playing indicator bars ───────────────────────────────────────────────────
function PlayingBars({ color }) {
  const anims = useRef([
    new Animated.Value(0.5),
    new Animated.Value(0.8),
    new Animated.Value(0.35),
  ]).current;

  useEffect(() => {
    const loops = anims.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1,   duration: 360 + i * 90, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.2, duration: 360 + i * 90, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => {
      loops.forEach((l) => l.stop());
      anims.forEach((v) => v.setValue(0.5));
    };
  }, []);

  return (
    <View style={barStyles.container}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[barStyles.bar, { backgroundColor: color, transform: [{ scaleY: anim }] }]}
        />
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 3, alignItems: 'center', height: 16, marginTop: 10 },
  bar: { width: 3, height: 14, borderRadius: 2, opacity: 0.85 },
});

// ─── Volume strip ─────────────────────────────────────────────────────────────
function VolumeStrip({ volume, onChangeVolume }) {
  return (
    <View style={volStyles.row}>
      <Ionicons name="volume-low-outline" size={16} color={colors.subtext} />
      <View style={volStyles.track}>
        {VOLUME_STEPS.map(({ value }) => (
          <TouchableOpacity
            key={value}
            style={[volStyles.segment, volume >= value - 0.05 && volStyles.segmentFilled]}
            onPress={() => onChangeVolume(value)}
          />
        ))}
      </View>
      <Ionicons name="volume-high-outline" size={16} color={colors.subtext} />
      <Text style={volStyles.pct}>{Math.round(volume * 100)}%</Text>
    </View>
  );
}

const volStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  track: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  segmentFilled: { backgroundColor: colors.primary },
  pct: { ...typography.caption, fontWeight: '600', color: colors.primary, minWidth: 34 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SoundsScreen() {
  const { t } = useLanguage();
  const {
    primaryId, layerId, loadingId, isActive,
    volume, toggle, stopAll, changeVolume, updateTimer,
  } = useAudioPlayer();
  const playingId = primaryId; // used by banner & category dot logic
  const [timerIndex, setTimerIndex] = useState(1); // default: 30 min
  const [activeCategoryId, setActiveCategoryId] = useState('nature');
  const [infoSound, setInfoSound] = useState(null);

  // Restore persisted timer and category on mount
  useEffect(() => {
    (async () => {
      const savedTimer    = await storage.getItem('soundsTimer');
      const savedCategory = await storage.getItem('soundsCategory');
      if (savedTimer    != null) setTimerIndex(Number(savedTimer));
      if (savedCategory != null) setActiveCategoryId(savedCategory);
    })();
  }, []);

  // Sounds visible in the current category tab
  const visibleSounds = SOUNDS.filter(s => s.category === activeCategoryId);

  // Press-scale animations — initialised once over the full catalogue
  const scaleAnims = useRef(
    SOUNDS.reduce((acc, s) => ({ ...acc, [s.id]: new Animated.Value(1) }), {}),
  ).current;

  const handleToggle = useCallback(
    (sound) => {
      if (sound.locked) return;

      Animated.sequence([
        Animated.timing(scaleAnims[sound.id], { toValue: 0.93, duration: 80,  useNativeDriver: true }),
        Animated.timing(scaleAnims[sound.id], { toValue: 1,    duration: 120, useNativeDriver: true }),
      ]).start();

      toggle(sound.id, sound.source, TIMER_MS[timerIndex]);
    },
    [timerIndex, toggle],
  );

  // Find playing sound meta (may be in a different category than what's visible)
  const activeSoundMeta  = SOUNDS.find(s => s.id === primaryId);
  const activeSoundI18n  = primaryId ? t.soundList[primaryId] : null;
  const layerSoundMeta   = SOUNDS.find(s => s.id === layerId);
  const layerSoundI18n   = layerId ? t.soundList[layerId] : null;

  return (
    <View style={styles.screenRoot}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{t.sounds.title}</Text>
      <Text style={styles.subtitle}>{t.sounds.subtitle}</Text>

      {/* ── Category tabs ───────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategoryId === cat.id;
          // If a sound from this category is playing, show a coloured dot on the tab
          const hasPlaying = playingId && SOUNDS.find(s => s.id === playingId)?.category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryPill, active && styles.categoryPillActive]}
              onPress={async () => {
                setActiveCategoryId(cat.id);
                await storage.setItem('soundsCategory', cat.id);
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={active ? colors.white : colors.subtext}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                {t.sounds.categories[cat.id]}
              </Text>
              {hasPlaying && !active && (
                <View style={[styles.playingDotSmall, { backgroundColor: cat.color }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Now-playing banner ──────────────────────────────────────────────── */}
      {primaryId && activeSoundMeta && (
        <View style={[styles.playingBanner, { borderColor: activeSoundMeta.color + '40' }]}>
          <View style={[styles.playingDot, { backgroundColor: activeSoundMeta.color }]} />
          <Text style={[styles.playingText, { color: activeSoundMeta.color }]} numberOfLines={1}>
            {t.sounds.nowPlaying} {activeSoundI18n?.label}
            {layerId && layerSoundI18n ? ` + ${layerSoundI18n.label}` : ''}
          </Text>
          <TouchableOpacity onPress={stopAll} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="close-circle" size={20} color={activeSoundMeta.color} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Volume strip ────────────────────────────────────────────────────── */}
      {playingId && (
        <VolumeStrip volume={volume} onChangeVolume={changeVolume} />
      )}

      {/* ── Sound grid ──────────────────────────────────────────────────────── */}
      <View style={styles.grid}>
        {visibleSounds.map((sound) => {
          const active   = isActive(sound.id);
          const isLayer  = sound.id === layerId;
          const loading  = loadingId === sound.id;
          const soundI18n = t.soundList[sound.id] ?? { label: sound.id, desc: '' };

          return (
            <Animated.View
              key={sound.id}
              style={[
                { transform: [{ scale: scaleAnims[sound.id] }], width: '47%', position: 'relative' },
                sound.locked && styles.lockedWrapper,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.soundCard,
                  active && { borderColor: sound.color, borderWidth: 2 },
                ]}
                onPress={() => handleToggle(sound)}
                activeOpacity={sound.locked ? 1 : undefined}
                disabled={sound.locked || (loadingId !== null && loadingId !== sound.id)}
                accessibilityRole="button"
                accessibilityLabel={soundI18n.label}
                accessibilityState={{ selected: active, disabled: !!sound.locked }}
              >
                {/* Icon badge */}
                <View style={[styles.iconWrap, { backgroundColor: active ? sound.color : sound.bg }]}>
                  <Ionicons
                    name={sound.icon}
                    size={26}
                    color={sound.locked ? colors.subtext : (active ? '#fff' : sound.color)}
                  />
                  {/* Lock badge */}
                  {sound.locked && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed-outline" size={11} color={colors.subtext} />
                    </View>
                  )}
                  {/* Layer badge */}
                  {isLayer && (
                    <View style={[styles.layerBadge, { backgroundColor: sound.color }]}>
                      <Text style={styles.layerBadgeText}>+</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.soundLabel, active && { color: sound.color }]}>
                  {soundI18n.label}
                </Text>
                <Text style={styles.soundDesc}>
                  {sound.locked ? t.sounds.comingSoon : soundI18n.desc}
                </Text>

                {/* Animated bars (active) or loading dots */}
                {!sound.locked && (
                  loading ? (
                    <View style={barStyles.container}>
                      <Ionicons name="ellipsis-horizontal" size={14} color={sound.color} />
                    </View>
                  ) : active ? (
                    <PlayingBars color={sound.color} />
                  ) : null
                )}
              </TouchableOpacity>

              {/* Info button — only on unlocked sounds */}
              {!sound.locked && (
                <TouchableOpacity
                  style={styles.infoBtn}
                  onPress={() => setInfoSound(sound)}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Ionicons name="information-circle-outline" size={17} color={colors.subtext} />
                </TouchableOpacity>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* ── Sleep timer ─────────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>{t.sounds.timer}</Text>
      <Text style={styles.sectionSub}>{t.sounds.timerSub}</Text>
      <View style={styles.timerRow}>
        {TIMER_MS.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.timerPill, timerIndex === index && styles.timerPillActive]}
            onPress={async () => {
              setTimerIndex(index);
              await storage.setItem('soundsTimer', String(index));
              if (primaryId || layerId) updateTimer(TIMER_MS[index]);
            }}
          >
            <Text style={[styles.timerLabel, timerIndex === index && styles.timerLabelActive]}>
              {t.timers[index]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>

    <SoundInfoModal
      visible={!!infoSound}
      sound={infoSound}
      soundMeta={infoSound ? t.soundList[infoSound.id] : null}
      onClose={() => setInfoSound(null)}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 100 },
  title: { ...typography.h2, marginBottom: 4 },
  subtitle: { ...typography.caption, marginBottom: spacing.md },

  // ── Category tabs ──────────────────────────────────────────────────────────
  categoryScroll: { marginBottom: spacing.md },
  categoryRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border,
  },
  categoryPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryLabel: { ...typography.caption, fontWeight: '600', color: colors.subtext },
  categoryLabelActive: { color: colors.white },
  playingDotSmall: { width: 6, height: 6, borderRadius: 3, marginLeft: 5 },

  // ── Now-playing banner ─────────────────────────────────────────────────────
  playingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md, borderWidth: 1.5,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  playingDot: { width: 8, height: 8, borderRadius: 4 },
  playingText: { ...typography.body, flex: 1, fontWeight: '600' },

  // ── Sound grid ─────────────────────────────────────────────────────────────
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.xl },
  soundCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.border,
    ...shadow.card,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: colors.card,
    borderRadius: 8, padding: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  lockedWrapper: { opacity: 0.5 },
  layerBadge: {
    position: 'absolute', top: -5, right: -5,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  layerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800', lineHeight: 14 },
  infoBtn: { position: 'absolute', top: 8, right: 8 },
  soundLabel: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  soundDesc: { ...typography.caption },

  // ── Sleep timer ────────────────────────────────────────────────────────────
  sectionTitle: { ...typography.h3, marginBottom: 2 },
  sectionSub: { ...typography.caption, marginBottom: spacing.md },
  timerRow: { flexDirection: 'row', gap: spacing.sm },
  timerPill: {
    flex: 1, paddingVertical: 10, borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  timerPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timerLabel: { ...typography.caption, fontWeight: '600', color: colors.subtext },
  timerLabelActive: { color: colors.white },
});
