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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../LanguageContext';
import { LANGUAGES } from '../i18n';
import { colors, spacing, shadow, typography, radius } from '../theme';
import * as storage from '../utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 4;

// ─── Background star positions (stable, derived once) ────────────────────────
const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: (7 + i * 53) % 92,   // pseudo-random but deterministic spread
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

// ─── Step 2 — Privacy ─────────────────────────────────────────────────────────
function StepPrivacy({ t }) {
  return (
    <View style={styles.stepContent}>
      <Ionicons
        name="shield-checkmark"
        size={64}
        color={colors.success}
        style={{ marginBottom: spacing.lg }}
      />
      <Text style={styles.stepTitle}>{t.onboarding.step3Title}</Text>
      <Text style={[styles.stepBody, { marginBottom: spacing.lg }]}>
        {t.onboarding.step3Body}
      </Text>
      <View style={styles.bulletList}>
        {t.onboarding.step3Points.map((point, i) => (
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

// ─── Step 3 — Get Started ─────────────────────────────────────────────────────
function StepGetStarted({ t }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.finalIllustration}>🌙✨⭐️</Text>
      <Text style={styles.stepTitle}>{t.onboarding.step4Title}</Text>
      <Text style={styles.stepBody}>{t.onboarding.step4Body}</Text>
    </View>
  );
}

// ─── Main OnboardingScreen ────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }) {
  const insets = useSafeAreaInsets();
  const { t, lang, setLanguage } = useLanguage();
  const [step, setStep] = useState(0);

  // Slide / fade animation between steps
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const animateToStep = (nextStep) => {
    // Fade + slight slide out, then snap to new step, then fade in
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
    if (step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateToStep(step - 1);
    }
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
      case 2: return <StepPrivacy t={t} />;
      case 3: return <StepGetStarted t={t} />;
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

      {/* Back button (steps 1-3) */}
      <View style={styles.topBar}>
        {step > 0 ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backText}>← {/* back arrow text only */}Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

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

  // Stars
  star: {
    position: 'absolute',
    backgroundColor: colors.primary,
  },

  // Top bar
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backText: {
    ...typography.body,
    color: colors.subtext,
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

  // Step 2 — Privacy
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

  // Step 3 — Get Started
  finalIllustration: {
    fontSize: 64,
    letterSpacing: 8,
    marginBottom: spacing.xl,
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
