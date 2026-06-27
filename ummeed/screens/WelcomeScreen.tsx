import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useNav } from '../contexts/NavContext';
import { colors, font, spacing } from '../theme';

export function WelcomeScreen() {
  const { push, reset } = useNav();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <Logo size={140} />
        <Text style={styles.brand} testID="brand-title">
          Ummeed
        </Text>
        <Text style={styles.tagline}>
          Hope, healing and a hand to hold for burn survivors.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={() => push({ name: 'role-select' })}
          testID="welcome-get-started"
        />
        <View style={{ height: spacing.md }} />
        <Button
          title="Browse without signing in"
          variant="ghost"
          onPress={() => reset({ name: 'emergency' })}
          testID="welcome-browse"
        />
      </View>

      <Text style={styles.footer} testID="welcome-footer">
        If this is a medical emergency, call 1075 (India National Burn Helpline) immediately.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg, justifyContent: 'space-between' },
  hero: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.md },
  brand: { fontSize: 48, color: colors.primary, fontWeight: font.weightBold, letterSpacing: 1.5 },
  tagline: {
    fontSize: font.h3,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: spacing.md,
  },
  actions: { paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  footer: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
