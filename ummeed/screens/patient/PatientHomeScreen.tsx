import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { getPatientOnboardingStatus } from '../../lib/patientOnboarding';
import { colors, font, spacing } from '../../theme';

export function PatientHomeScreen() {
  const { profile, signOut } = useAuth();
  const { push, reset } = useNav();
  const greeting = profile?.full_name ? `Namaste, ${profile.full_name.split(' ')[0]}` : 'Namaste';
  const isApproved = profile?.verification_status === 'approved';

  React.useEffect(() => {
    let mounted = true;
    async function routeIfSubmitted() {
      if (!profile || profile.role !== 'patient' || profile.verification_status !== 'pending') return;
      const onboarding = await getPatientOnboardingStatus(profile);
      if (mounted && onboarding.isComplete) {
        reset({ name: 'pending-approval' });
      }
    }
    routeIfSubmitted().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [profile, reset]);

  return (
    <Screen
      title={greeting}
      subtitle="What would you like to do today?"
      hideBack
      rightAction={{ label: 'Sign out', onPress: signOut }}
    >
      <Card
        title="🚨 Emergency & first aid"
        subtitle="Helplines, first-aid steps, and government schemes."
        tone="danger"
        onPress={() => push({ name: 'emergency' })}
        testID="home-emergency"
      />
      <Card
        title="My profile"
        subtitle="Personal info, address, emergency contact."
        onPress={() => push({ name: 'patient-profile' })}
        testID="home-profile"
      />
      <Card
        title="Burn incident details"
        subtitle="Log how and where the injury happened."
        onPress={() => push({ name: 'burn-incident' })}
        testID="home-incident"
      />
      <Card
        title="Medical records"
        subtitle="Upload prescriptions, reports and photos."
        onPress={() => push({ name: 'medical-records' })}
        testID="home-records"
      />
      {isApproved ? (
        <>
          <Card
            title="Find a hospital"
            subtitle="Search hospitals with a burn unit."
            onPress={() => push({ name: 'hospital-search' })}
            testID="home-hospitals"
          />
          <Card
            title="Find an NGO / support"
            subtitle="Connect with NGOs, counselors and legal aid."
            onPress={() => push({ name: 'ngo-search' })}
            testID="home-ngos"
          />
        </>
      ) : null}

      <View style={{ height: spacing.lg }} />
      <Text style={styles.footer}>
        You are not alone. Help is always one tap away.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { color: colors.textMuted, fontSize: font.small, textAlign: 'center' },
});
