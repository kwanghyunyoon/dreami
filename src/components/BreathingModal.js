import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';
import { useLanguage } from '../LanguageContext';

// ─── Phase definitions ────────────────────────────────────────────────────────
const PHASES = [
  { key: 'inhale',  duration: 4, toScale: 1.0,  color: '#7C74FF' },
  { key: 'hold',    duration: 7, toScale: 1.0,  color: '#4CAF82' },
  { key: 'exhale',  duration: 8, toScale: 0.42, color: '#3ABEFF' },
];
const TOTAL_ROUNDS = 4;
const CIRCLE_SIZE  = 240;

// ─── Localised strings ────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    title:  '4-7-8 Breathing',
    inhale: 'INHALE',   hold: 'HOLD',   exhale: 'EXHALE',
    instrInhale: 'Breathe in slowly through your nose',
    instrHold:   'Hold your breath gently',
    instrExhale: 'Exhale fully through your mouth',
    ready:   'Ready',
    readySub:'Inhale 4s · Hold 7s · Exhale 8s',
    start:   'Start',   pause: 'Pause',
    done:    'Great work 🌙',   again: 'Again',
    round:   (n, t) => `Round ${n} of ${t}`,
  },
  ko: {
    title:  '4-7-8 호흡법',
    inhale: '들이쉬기',  hold: '참 기',   exhale: '내쉬기',
    instrInhale: '코로 천천히 들이쉬세요',
    instrHold:   '숨을 편안하게 참으세요',
    instrExhale: '입으로 천천히 내쉬세요',
    ready:   '시작 준비',
    readySub:'4초 들이쉬고 · 7초 참기 · 8초 내쉬기',
    start:   '시작',    pause: '일시정지',
    done:    '잘 하셨어요 🌙',   again: '다시 하기',
    round:   (n, t) => `${n} / ${t} 라운드`,
  },
  es: {
    title:  'Respiración 4-7-8',
    inhale: 'INHALAR',   hold: 'RETENER',   exhale: 'EXHALAR',
    instrInhale: 'Inhala lentamente por la nariz',
    instrHold:   'Retén el aire suavemente',
    instrExhale: 'Exhala completamente por la boca',
    ready:   'Listo',
    readySub:'Inhala 4s · Retén 7s · Exhala 8s',
    start:   'Comenzar',   pause: 'Pausar',
    done:    'Muy bien 🌙',   again: 'Repetir',
    round:   (n, t) => `Ronda ${n} de ${t}`,
  },
  hi: {
    title:  '4-7-8 श्वास',
    inhale: 'साँस लें',   hold: 'रोकें',   exhale: 'छोड़ें',
    instrInhale: 'नाक से धीरे-धीरे साँस लें',
    instrHold:   'साँस को आराम से रोकें',
    instrExhale: 'मुँह से पूरी तरह साँस छोड़ें',
    ready:   'तैयार',
    readySub:'4s साँस लें · 7s रोकें · 8s छोड़ें',
    start:   'शुरू करें',   pause: 'रुकें',
    done:    'शाबाश 🌙',   again: 'दोबारा',
    round:   (n, t) => `राउंड ${n} / ${t}`,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function BreathingModal({ visible, onClose }) {
  const { lang } = useLanguage();
  const s = STRINGS[lang] ?? STRINGS.en;

  const [active,   setActive]   = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick,     setTick]     = useState(PHASES[0].duration);
  const [round,    setRound]    = useState(1);
  const [done,     setDone]     = useState(false);

  // Refs so animation effect can always read latest tick without stale closures
  const tickRef     = useRef(PHASES[0].duration);
  const animRef     = useRef(null);
  const scaleAnim   = useRef(new Animated.Value(0.42)).current;
  const opacityAnim = useRef(new Animated.Value(0.15)).current;

  // ── Keep tickRef in sync ──────────────────────────────────────────────────
  useEffect(() => { tickRef.current = tick; }, [tick]);

  // ── Reset when modal closes ───────────────────────────────────────────────
  useEffect(() => {
    if (!visible) resetAll();
  }, [visible]);

  function resetAll() {
    if (animRef.current) animRef.current.stop();
    scaleAnim.setValue(0.42);
    opacityAnim.setValue(0.15);
    setActive(false);
    setPhaseIdx(0);
    setTick(PHASES[0].duration);
    tickRef.current = PHASES[0].duration;
    setRound(1);
    setDone(false);
  }

  // ── Animate circle whenever phase changes or session starts/resumes ────────
  useEffect(() => {
    if (!active || done) return;
    const phase = PHASES[phaseIdx];
    const remainingMs = tickRef.current * 1000;

    if (animRef.current) animRef.current.stop();
    animRef.current = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue:  phase.toScale,
        duration: remainingMs,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue:  phase.key === 'exhale' ? 0.15 : 0.55,
        duration: remainingMs,
        useNativeDriver: false,
      }),
    ]);
    animRef.current.start();
  }, [active, phaseIdx, done]);

  // ── Countdown interval ────────────────────────────────────────────────────
  useEffect(() => {
    if (!active || done) return;

    // Local mutable state to avoid stale closures inside the interval
    const local = { phaseIdx, tick: tickRef.current, round };

    const interval = setInterval(() => {
      local.tick--;
      setTick(local.tick);

      if (local.tick <= 0) {
        const nextPhase   = (local.phaseIdx + 1) % PHASES.length;
        const isNewRound  = nextPhase === 0;
        const nextRound   = isNewRound ? local.round + 1 : local.round;

        // Session finished
        if (isNewRound && local.round >= TOTAL_ROUNDS) {
          clearInterval(interval);
          if (animRef.current) animRef.current.stop();
          setDone(true);
          setActive(false);
          return;
        }

        local.phaseIdx = nextPhase;
        local.tick     = PHASES[nextPhase].duration;
        local.round    = nextRound;

        setPhaseIdx(nextPhase);
        setTick(PHASES[nextPhase].duration);
        setRound(nextRound);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [active]); // only re-run when session starts/stops — phase tracked in local

  // ── Derived display values ────────────────────────────────────────────────
  const phase       = PHASES[phaseIdx];
  const phaseLabel  = s[phase.key];
  const phaseInstr  = s[`instr${phase.key.charAt(0).toUpperCase() + phase.key.slice(1)}`];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-down" size={26} color={colors.subtext} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{s.title}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>

        {/* ── Round dots ───────────────────────────────────────────────────── */}
        <View style={styles.roundRow}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.roundDot,
                i < round - 1 && styles.roundDotDone,
                i === round - 1 && active && styles.roundDotActive,
                done && styles.roundDotDone,
              ]}
            />
          ))}
        </View>
        <Text style={styles.roundLabel}>
          {active || done ? s.round(round > TOTAL_ROUNDS ? TOTAL_ROUNDS : round, TOTAL_ROUNDS) : ' '}
        </Text>

        {/* ── Animated circle ──────────────────────────────────────────────── */}
        <View style={styles.circleArea}>
          {/* Glow halo */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                borderColor: phase.color,
                opacity: opacityAnim,
                transform: [{ scale: Animated.add(scaleAnim, new Animated.Value(0.18)) }],
              },
            ]}
          />
          {/* Main circle */}
          <Animated.View
            style={[
              styles.circle,
              {
                borderColor: phase.color,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.circleFill,
                { backgroundColor: phase.color, opacity: opacityAnim },
              ]}
            />

            {done ? (
              <Ionicons name="checkmark-circle" size={72} color={colors.success} style={{ zIndex: 1 }} />
            ) : (
              <>
                <Text style={[styles.tickNumber, { color: phase.color }]}>
                  {active ? tick : ''}
                </Text>
                <Text style={[styles.phaseLabel, { color: phase.color }]}>
                  {active ? phaseLabel : s.ready}
                </Text>
              </>
            )}
          </Animated.View>
        </View>

        {/* ── Instruction text ─────────────────────────────────────────────── */}
        <Text style={styles.instruction}>
          {done
            ? s.done
            : active
              ? phaseInstr
              : s.readySub}
        </Text>

        {/* ── Control button ───────────────────────────────────────────────── */}
        <View style={styles.btnArea}>
          {done ? (
            <TouchableOpacity style={[styles.btn, styles.btnAgain]} onPress={resetAll} activeOpacity={0.8}>
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.btnText}>{s.again}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btn, active && styles.btnPause]}
              onPress={() => setActive(a => !a)}
              activeOpacity={0.8}
            >
              <Ionicons name={active ? 'pause' : 'play'} size={20} color={colors.white} />
              <Text style={styles.btnText}>{active ? s.pause : s.start}</Text>
            </TouchableOpacity>
          )}
        </View>

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
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    width: '100%',
  },
  closeBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.h3 },

  // Round progress
  roundRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
    marginBottom: 6,
  },
  roundDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.border,
  },
  roundDotActive: { backgroundColor: colors.primary },
  roundDotDone:   { backgroundColor: colors.success },
  roundLabel: {
    ...typography.caption,
    color: colors.subtext,
    marginBottom: spacing.md,
  },

  // Circle
  circleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  glowRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 60,
    height: CIRCLE_SIZE + 60,
    borderRadius: (CIRCLE_SIZE + 60) / 2,
    borderWidth: 2,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CIRCLE_SIZE / 2,
  },
  tickNumber: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: -2,
    zIndex: 1,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: -4,
    zIndex: 1,
  },

  // Instruction
  instruction: {
    ...typography.body,
    color: colors.subtext,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  // Button
  btnArea: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    width: '100%',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
  },
  btnPause: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  btnAgain: { backgroundColor: colors.success },
  btnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
