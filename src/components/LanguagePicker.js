import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../LanguageContext';
import { colors, shadow, spacing, radius } from '../theme';

export default function LanguagePicker({ visible, onClose }) {
  const { lang, t, setLanguage, languages } = useLanguage();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSelect = async (code) => {
    await setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dark overlay */}
      <Pressable style={styles.overlay} onPress={onClose} />

      {/* Slide-up panel */}
      <Animated.View
        style={[
          styles.panel,
          shadow.card,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>{t.settings.language}</Text>
            <Text style={styles.subtitle}>{t.settings.languageSub}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeButton}
            accessibilityLabel="Close language picker"
          >
            <Ionicons name="close" size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        {/* Language rows */}
        <View style={styles.listContainer}>
          {languages.map((item) => {
            const isSelected = item.code === lang;
            return (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.row,
                  isSelected && styles.rowSelected,
                ]}
                onPress={() => handleSelect(item.code)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={item.name}
              >
                {/* Flag */}
                <Text style={styles.flag}>{item.flag}</Text>

                {/* Names */}
                <View style={styles.namesBlock}>
                  <Text style={[styles.nativeName, isSelected && styles.nativeNameSelected]}>
                    {item.nativeName}
                  </Text>
                  <Text style={styles.englishName}>{item.name}</Text>
                </View>

                {/* Checkmark */}
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={colors.primary}
                    style={styles.checkmark}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.subtext,
  },
  closeButton: {
    marginTop: 2,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  listContainer: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  rowSelected: {
    backgroundColor: colors.primaryLight,
  },
  flag: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  namesBlock: {
    flex: 1,
  },
  nativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  nativeNameSelected: {
    color: colors.primary,
  },
  englishName: {
    fontSize: 13,
    color: colors.subtext,
  },
  checkmark: {
    marginLeft: spacing.sm,
  },
});
