import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
  tone?: 'default' | 'accent' | 'danger';
  testID?: string;
}

export function Card({ children, title, subtitle, onPress, style, tone = 'default', testID }: Props) {
  const palette =
    tone === 'accent'
      ? { bg: colors.surfaceAlt, border: colors.accent }
      : tone === 'danger'
      ? { bg: '#FCE9E7', border: colors.danger }
      : { bg: colors.surface, border: colors.border };

  const Container: any = onPress ? Pressable : View;
  return (
    <Container
      testID={testID}
      onPress={onPress}
      style={({ pressed }: any) => [
        styles.card,
        { backgroundColor: palette.bg, borderColor: palette.border },
        onPress && pressed ? { opacity: 0.85 } : null,
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: { fontSize: font.h3, fontWeight: font.weightBold, color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: font.body, color: colors.textMuted, marginBottom: spacing.sm },
});
