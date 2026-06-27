import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useNav } from '../../contexts/NavContext';
import type { AppRole } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

interface RoleOption {
  role: AppRole;
  title: string;
  subtitle: string;
}

const OPTIONS: RoleOption[] = [
  { role: 'patient', title: 'I am a survivor / patient', subtitle: 'Get care, support and resources.' },
  { role: 'doctor', title: 'I am a doctor', subtitle: 'Treat patients and share burn-care knowledge.' },
  { role: 'ngo', title: 'I am an NGO / caregiver / volunteer', subtitle: 'Offer aid, awareness and rehabilitation.' },
  { role: 'counselor', title: 'I am a counselor', subtitle: 'Provide mental-health support.' },
  { role: 'legal_aid', title: 'I am a legal aid provider', subtitle: 'Help with FIRs, compensation and rights.' },
];

export function RoleSelectScreen() {
  const { push } = useNav();
  return (
    <Screen title="Who are you?" subtitle="Choose how you will use Ummeed.">
      <Text style={styles.help}>
        Doctors, NGOs, counselors and legal-aid providers will be reviewed by an admin before going live.
      </Text>
      <View style={{ height: spacing.md }} />
      {OPTIONS.map((o) => (
        <Card
          key={o.role}
          title={o.title}
          subtitle={o.subtitle}
          tone={o.role === 'patient' ? 'accent' : 'default'}
          onPress={() => push({ name: 'login', intendedRole: o.role })}
          testID={`role-${o.role}`}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: { color: colors.textMuted, fontSize: font.body, lineHeight: 24 },
});
