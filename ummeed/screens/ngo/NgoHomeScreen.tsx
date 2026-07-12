import React from 'react';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';

export function NgoHomeScreen() {
  const { profile, signOut } = useAuth();
  const { push } = useNav();
  const label = profile?.role === 'counselor' ? 'Counselor' : profile?.role === 'legal_aid' ? 'Legal aid' : 'NGO';
  return (
    <Screen
      title={profile?.organization_name || profile?.full_name || label}
      subtitle={`${label} dashboard`}
      hideBack
      rightAction={{ label: 'Sign out', onPress: signOut }}
    >
      <Card title="My profile" subtitle="Organisation info & verification." onPress={() => push({ name: 'ngo-profile' })} testID="nh-profile" />
      <Card title="Patient requests" subtitle="Accept connection requests from patients." onPress={() => push({ name: 'ngo-patients' })} testID="nh-patients" />
      <Card title="Share informational content" subtitle="Add content for review and publication." onPress={() => push({ name: 'ngo-content' })} testID="nh-content" />
      <Card title="Emergency content" subtitle="First-aid, helplines and schemes." onPress={() => push({ name: 'emergency' })} testID="nh-emergency" />
    </Screen>
  );
}
