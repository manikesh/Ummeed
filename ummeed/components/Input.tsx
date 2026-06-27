import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
}

export function Input({ label, error, hint, style, testID, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} accessibilityRole="text">
        {label}
      </Text>
      <TextInput
        {...rest}
        testID={testID}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          error ? styles.inputError : null,
          style as any,
        ]}
      />
      {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: spacing.md },
  label: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: font.weightSemi,
    marginBottom: spacing.xs + 2,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    color: colors.text,
    minHeight: 56,
  },
  inputError: { borderColor: colors.danger },
  hint: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.xs },
  error: { color: colors.danger, fontSize: font.small, marginTop: spacing.xs, fontWeight: font.weightSemi },
});
