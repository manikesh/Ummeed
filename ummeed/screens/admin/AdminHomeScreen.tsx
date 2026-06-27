import React from 'react';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';

export function AdminHomeScreen() {
  const { signOut } = useAuth();
  const { push } = useNav();
  return (
    <Screen
      title="Admin"
      subtitle="Manage providers, hospitals and content."
      hideBack
      rightAction={{ label: 'Sign out', onPress: signOut }}
    >
      <Card title="User approvals" subtitle="Approve or reject doctors, NGOs, counselors and legal aid." onPress={() => push({ name: 'admin-approvals' })} testID="ah-approvals" />
      <Card title="Hospitals" subtitle="Add, edit and remove hospitals." onPress={() => push({ name: 'admin-hospitals' })} testID="ah-hospitals" />
      <Card title="Content (first-aid, helplines, schemes)" subtitle="Manage published content." onPress={() => push({ name: 'admin-content' })} testID="ah-content" />
    </Screen>
  );
}
