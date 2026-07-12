import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { colors, font, spacing } from '../../theme';

export function DoctorHomeScreen() {
  const { profile, signOut } = useAuth();
  const { push } = useNav();
  return (
    <Screen
      title={`Dr. ${profile?.full_name?.split(' ').slice(-1)[0] ?? ''}`}
      subtitle="Welcome to Ummeed."
      hideBack
      rightAction={{ label: 'Sign out', onPress: signOut }}
    >
      <Card title="My profile" subtitle="Specialization, hospital, license." onPress={() => push({ name: 'doctor-profile' })} testID="dh-profile" />
      {/*<Card title="My patient requests" subtitle="Accept / decline connection requests." onPress={() => push({ name: 'doctor-patients' })} testID="dh-patients" />*/}
      <Card title="Share educational content" subtitle="Publish first-aid guides, home remedies and video links." onPress={() => push({ name: 'doctor-content' })} testID="dh-content" />
      <Card title="Emergency content" subtitle="First-aid, helplines and schemes." onPress={() => push({ name: 'emergency' })} testID="dh-emergency" />
      <Text style={styles.note}>
        Tip: complete your profile so patients can find and trust you.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.md, textAlign: 'center' },
});
