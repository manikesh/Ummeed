import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth = true,
  style,
  testID,
}: Props) {
  const palette = paletteOf(variant);
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={[styles.text, { color: palette.text } as TextStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

function paletteOf(v: NonNullable<Props['variant']>) {
  switch (v) {
    case 'primary':
      return { bg: colors.primary, border: colors.primary, text: colors.textInverse };
    case 'secondary':
      return { bg: colors.accent, border: colors.accent, text: colors.textInverse };
    case 'ghost':
      return { bg: 'transparent', border: colors.primary, text: colors.primary };
    case 'danger':
      return { bg: colors.danger, border: colors.danger, text: colors.textInverse };
  }
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // big tap target for accessibility
  },
  text: {
    fontSize: font.body,
    fontWeight: font.weightBold,
    letterSpacing: 0.3,
  },
});
