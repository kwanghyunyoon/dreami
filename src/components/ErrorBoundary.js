import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.emoji}>🌙</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          Dreami ran into an unexpected error. Your sleep data is safe.
        </Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => this.setState({ hasError: false, error: null })}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji:  { fontSize: 48, marginBottom: spacing.lg },
  title:  { ...typography.h2, textAlign: 'center', marginBottom: spacing.sm },
  body:   { ...typography.body, color: colors.subtext, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  btnText: { ...typography.body, fontWeight: '700', color: colors.white },
});
