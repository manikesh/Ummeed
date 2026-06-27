import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNav } from '../contexts/NavContext';
import { colors, font, spacing } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  rightAction?: { label: string; onPress: () => void };
  hideBack?: boolean;
}

export function Header({ title, subtitle, rightAction, hideBack }: Props) {
  const { back, canBack } = useNav();
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {!hideBack && canBack ? (
          <Pressable
            onPress={back}
            style={({ pressed }) => [styles.backBtn, pressed ? { opacity: 0.6 } : null]}
            testID="header-back"
            accessibilityLabel="Back"
            accessibilityRole="button"
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ width: 70 }} />
        )}
        {rightAction ? (
          <Pressable
            onPress={rightAction.onPress}
            style={({ pressed }) => [styles.right, pressed ? { opacity: 0.6 } : null]}
            testID="header-right"
          >
            <Text style={styles.rightLabel}>{rightAction.label}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  backArrow: { fontSize: 24, color: colors.primary, marginRight: 4, fontWeight: '700' },
  backLabel: { color: colors.primary, fontSize: font.body, fontWeight: font.weightSemi },
  right: { paddingVertical: 4 },
  rightLabel: { color: colors.accent, fontSize: font.body, fontWeight: font.weightSemi },
  title: { color: colors.text, fontSize: font.h1, fontWeight: font.weightBold, marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: font.body, marginTop: 4 },
});
