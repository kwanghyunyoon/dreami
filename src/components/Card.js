import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '../theme';

export default function Card({ children, style, variant = 'default' }) {
  return (
    <View style={[styles.card, variant === 'tinted' && styles.tinted, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow.card,
  },
  tinted: {
    backgroundColor: colors.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
});
