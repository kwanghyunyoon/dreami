import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../i18n';
import { colors, spacing, shadow, typography, radius } from '../theme';
import * as storage from '../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 5;

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1509891896586272830/Y83xm-KCkNkC7Gnh7YCUbySQolSt8ZRlWx_5zalIO-2szm6QyRPKAk8xT6A3h7GUc1Qr';
const ISSUE_TYPES = ['Bug', 'Suggestion', 'Other'];

function FeedbackModal({ visible, onClose }) {
  const [email, setEmail] = useState('');
  const [issueType, setIssueType] = useState('Bug');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const reset = () => {
    setEmail('');
    setIssueType('Bug');
    setDescription('');
    setStatus('idle');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: 'Dreami Feedback',
            color: 0x5B57B8,
            fields: [
              { name: 'Type', value: issueType, inline: true },
              { name: 'Email', value: email.trim() || '—', inline: true },
              { name: 'Description', value: description.trim() },
            ],
          }],
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={fb.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={fb.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={fb.sheet}>
          {status === 'success' ? (
            <View style={fb.centered}>
              <Text style={fb.successIcon}>✅</Text>
              <Text style={fb.successTitle}>Thanks!</Text>
              <Text style={fb.successBody}>Your feedback has been received.</Text>
              <TouchableOpacity style={fb.submitBtn} onPress={handleClose}>
                <Text style={fb.submitBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={fb.sheetTitle}>Report an issue</Text>
              <Text style={fb.fieldLabel}>Type</Text>
              <View style={fb.typeRow}>
                {ISSUE_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[fb.typeBtn, issueType === t && fb.typeBtnActive]}
                    onPress={() => setIssueType(t)}
                    activeOpacity={0.75}
                  >
                    <Text style={[fb.typeText, issueType === t && fb.typeTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={fb.fieldLabel}>Email (optional)</Text>
              <TextInput
                style={fb.textInput}
                placeholder="your@email.com"
                placeholderTextColor={colors.subtext}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
              <Text style={fb.fieldLabel}>Description</Text>
              <TextInput
                style={[fb.textInput, fb.textInputMulti]}
                placeholder="Describe what happened..."
                placeholderTextColor={colors.subtext}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
              {status === 'error' && (
                <Text style={fb.errorText}>Something went wrong. Please try again.</Text>
              )}
              <TouchableOpacity
                style={[fb.submitBtn, (!description.trim() || status === 'sending') && fb.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!description.trim() || status === 'sending'}
                activeOpacity={0.82}
              >
                <Text style={fb.submitBtnText}>
                  {status === 'sending' ? 'Sending…' : 'Send feedback'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const fb = StyleSheet.create({
  overlay:           { flex: 1, justifyContent: 'flex-end' },
  backdrop:          { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:             { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                       padding: spacing.xl, paddingBottom: spacing.xl + 16, gap: spacing.sm },
  sheetTitle:        { ...typography.h2, marginBottom: spacing.xs },
  fieldLabel:        { ...typography.caption, color: colors.subtext, marginTop: spacing.sm },
  typeRow:           { flexDirection: 'row', gap: spacing.sm },
  typeBtn:           { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm,
                       borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  typeBtnActive:     { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeText:          { ...typography.caption, color: colors.subtext },
  typeTextActive:    { color: colors.primary, fontWeight: '700' },
  textInput:         { backgroundColor: colors.surface, borderRadius: radius.sm,
                       borderWidth: 1, borderColor: colors.border,
                       paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
                       ...typography.body, color: colors.text },
  textInputMulti:    { height: 100, textAlignVertical: 'top' },
  errorText:         { ...typography.caption, color: '#d33', textAlign: 'center' },
  submitBtn:         { backgroundColor: colors.primary, borderRadius: radius.full,
                       paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText:     { ...typography.h3, color: colors.white },
  centered:          { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  successIcon:       { fontSize: 48 },
  successTitle:      { ...typography.h2 },
  successBody:       { ...typography.body, color: colors.subtext, textAlign: 'center' },
});

// ─── Background star positions (stable, derived once) ────────────────────────
const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (7 + i * 53) % 92,
  y: (11 + i * 37) % 85,
  size: i % 3 === 0 ? 4 : i % 3 === 1 ? 3 : 2,
  delay: (i * 200) % 1800,
}));

// ─── AnimatedStar ─────────────────────────────────────────────────────────────
function AnimatedStar({ x, y, size, delay }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.9, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
        },
      ]}
    />
  );
}

// ─── ProgressDots ─────────────────────────────────────────────────────────────
function ProgressDots({ step }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === step && styles.dotActive,
            i < step && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Step 0 — Welcome ─────────────────────────────────────────────────────────
function StepWelcome({ t }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.stepContent}>
      <Animated.Text style={[styles.moonEmoji, { transform: [{ scale: pulse }] }]}>
        🌙
      </Animated.Text>
      <Text style={styles.stepTitle}>{t.onboarding.welcome}</Text>
      <Text style={styles.stepBody}>{t.onboarding.tagline}</Text>

      {/* Feature teaser pills */}
      <View style={styles.teaserRow}>
        {['🌙 Track', '🎵 Sounds', '⏰ Alarm'].map((label) => (
          <View key={label} style={styles.teaserPill}>
            <Text style={styles.teaserText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Step 1 — Choose Language ─────────────────────────────────────────────────
function StepLanguage({ t, lang, setLanguage }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t.onboarding.step2Title}</Text>
      <Text style={[styles.stepBody, { marginBottom: spacing.lg }]}>
        {t.onboarding.step2Body}
      </Text>
      <View style={styles.langGrid}>
        {LANGUAGES.map((item) => {
          const selected = lang === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.langCard, selected && styles.langCardSelected]}
              onPress={() => setLanguage(item.code)}
              activeOpacity={0.75}
            >
              <Text style={styles.langFlag}>{item.flag}</Text>
              <Text style={styles.langNative}>{item.nativeName}</Text>
              <Text style={styles.langName}>{item.name}</Text>
              {selected && (
                <View style={styles.langCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Step 2 — Feature Tour ────────────────────────────────────────────────────
function StepFeatures({ t }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t.onboarding.step3Title}</Text>
      <View style={styles.featureList}>
        {t.onboarding.step3Features.map((feature) => (
          <View key={feature.label} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={`${feature.icon}-outline`} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureLabel}>{feature.label}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Step 3 — Privacy ─────────────────────────────────────────────────────────
function StepPrivacy({ t }) {
  return (
    <View style={styles.stepContent}>
      <Ionicons
        name="shield-checkmark"
        size={64}
        color={colors.success}
        style={{ marginBottom: spacing.lg }}
      />
      <Text style={styles.stepTitle}>{t.onboarding.step4Title}</Text>
      <Text style={[styles.stepBody, { marginBottom: spacing.lg }]}>
        {t.onboarding.step4Body}
      </Text>
      <View style={styles.bulletList}>
        {t.onboarding.step4Points.map((point, i) => (
          <View key={i} style={styles.bulletRow}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
              style={{ marginRight: spacing.sm }}
            />
            <Text style={styles.bulletText}>{point}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Step 4 — Get Started ─────────────────────────────────────────────────────
function StepGetStarted({ t }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={styles.stepContent}>
      {/* Mini sleep button preview */}
      <Animated.View style={[styles.previewBtn, { transform: [{ scale: pulse }] }]}>
        <Ionicons name="moon-outline" size={36} color={colors.primary} />
      </Animated.View>
      <Text style={styles.stepTitle}>{t.onboarding.step5Title}</Text>
      <Text style={styles.stepBody}>{t.onboarding.step5Body}</Text>
      <View style={styles.firstActionCard}>
        <Text style={styles.firstActionLabel}>👆  {t.onboarding.step5Body}</Text>
      </View>
    </View>
  );
}

// ─── Main OnboardingScreen ────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const { t, lang, setLanguage } = useLanguage();
  const [step, setStep] = useState(0);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const animateToStep = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) animateToStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) animateToStep(step - 1);
  };

  const handleGetStarted = async () => {
    await storage.setItem('onboarding', 'done');
    onComplete();
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  const renderStep = () => {
    switch (step) {
      case 0: return <StepWelcome t={t} />;
      case 1: return <StepLanguage t={t} lang={lang} setLanguage={setLanguage} />;
      case 2: return <StepFeatures t={t} />;
      case 3: return <StepPrivacy t={t} />;
      case 4: return <StepGetStarted t={t} />;
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background stars */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {STARS.map((s) => (
          <AnimatedStar key={s.id} x={s.x} y={s.y} size={s.size} delay={s.delay} />
        ))}
      </View>

      {/* Top bar: back button left, report link right */}
      <View style={styles.topBar}>
        {step > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <TouchableOpacity onPress={() => setFeedbackVisible(true)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.reportLink}>{t.onboarding.reportIssue ?? 'Report an issue'}</Text>
        </TouchableOpacity>
      </View>

      <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />

      {/* Animated step content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.animatedStep,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottomArea}>
        <ProgressDots step={step} />

        <TouchableOpacity
          style={[styles.primaryBtn, shadow.soft]}
          onPress={isLastStep ? handleGetStarted : handleNext}
          activeOpacity={0.82}
        >
          <Text style={styles.primaryBtnText}>
            {isLastStep ? t.onboarding.getStarted : t.onboarding.next}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  star: {
    position: 'absolute',
    backgroundColor: colors.primary,
  },

  // Top bar
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: spacing.xs,
  },
  backText: {
    ...typography.body,
    color: colors.subtext,
  },
  reportLink: {
    ...typography.caption,
    color: colors.subtext,
    textDecorationLine: 'underline',
  },

  // Scroll area
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  animatedStep: {
    flex: 1,
  },

  // Step layout
  stepContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  // Step 0 — Welcome
  moonEmoji: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  stepTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stepBody: {
    ...typography.body,
    color: colors.subtext,
    textAlign: 'center',
    lineHeight: 24,
  },
  teaserRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  teaserPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  teaserText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // Step 1 — Language
  langGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  langCard: {
    width: (SCREEN_WIDTH - spacing.xl * 2 - spacing.sm) / 2 - 2,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  langCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langFlag: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  langNative: {
    ...typography.h3,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 2,
  },
  langName: {
    ...typography.caption,
    textAlign: 'center',
  },
  langCheck: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },

  // Step 2 — Feature Tour
  featureList: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: 3,
  },
  featureDesc: {
    ...typography.caption,
    color: colors.subtext,
    lineHeight: 18,
  },

  // Step 3 — Privacy
  bulletList: {
    width: '100%',
    gap: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  bulletText: {
    ...typography.body,
    flex: 1,
  },

  // Step 4 — Get Started
  previewBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  firstActionCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  firstActionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Bottom
  bottomArea: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dotDone: {
    backgroundColor: colors.primaryMid,
  },

  primaryBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  primaryBtnText: {
    ...typography.h3,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
