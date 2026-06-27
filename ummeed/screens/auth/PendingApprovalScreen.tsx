import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { colors, font, spacing } from '../../theme';

export function PendingApprovalScreen() {
  const { profile, signOut } = useAuth();
  return (
    <Screen title="Awaiting approval" hideBack>
      <View style={styles.box}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.title}>
          Thanks for signing up, {profile?.full_name ?? 'friend'}.
        </Text>
        <Text style={styles.body}>
          Your {profile?.role.replace('_', ' ')} account is being reviewed by the Ummeed admin team. You will be able to access patient features as soon as your profile is approved.
        </Text>
        <Text style={[styles.body, { marginTop: spacing.md }]}>
          You can still browse first-aid info, helplines and government schemes in the meantime.
        </Text>
      </View>
      <View style={{ height: spacing.lg }} />
      <Button title="Sign out" variant="ghost" onPress={signOut} testID="pending-signout" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: font.h2, fontWeight: font.weightBold, textAlign: 'center', marginBottom: spacing.sm },
  body: { color: colors.text, fontSize: font.body, lineHeight: 26, textAlign: 'center' },
});
