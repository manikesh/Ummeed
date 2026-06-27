import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { NavProvider, useNav, type Nav } from '../contexts/NavContext';
import { colors, font, spacing } from '../theme';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';
import { RoleSelectScreen } from '../screens/auth/RoleSelectScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

import { BurnIncidentScreen } from '../screens/patient/BurnIncidentScreen';
import { EmergencyScreen } from '../screens/patient/EmergencyScreen';
import { HospitalSearchScreen } from '../screens/patient/HospitalSearchScreen';
import { MedicalRecordsScreen } from '../screens/patient/MedicalRecordsScreen';
import { NgoSearchScreen } from '../screens/patient/NgoSearchScreen';
import { PatientHomeScreen } from '../screens/patient/PatientHomeScreen';
import { PatientProfileScreen } from '../screens/patient/PatientProfileScreen';

import { DoctorHomeScreen } from '../screens/doctor/DoctorHomeScreen';
import { ProviderPatientsScreen } from '../screens/doctor/ProviderPatientsScreen';
import { ProviderProfileScreen } from '../screens/doctor/ProviderProfileScreen';

import { NgoHomeScreen } from '../screens/ngo/NgoHomeScreen';

import { AdminApprovalsScreen } from '../screens/admin/AdminApprovalsScreen';
import { AdminContentScreen } from '../screens/admin/AdminContentScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminHospitalsScreen } from '../screens/admin/AdminHospitalsScreen';

function Loader({ label }: { label?: string }) {
  return (
    <SafeAreaView style={styles.loadingSafe}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.loadingText}>{label}</Text> : null}
    </SafeAreaView>
  );
}

function renderScreen(current: Nav) {
  switch (current.name) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'role-select':
      return <RoleSelectScreen />;
    case 'login':
      return <LoginScreen intendedRole={current.intendedRole} />;
    case 'otp':
      return <OtpScreen email={current.email} intendedRole={current.intendedRole} />;
    case 'pending-approval':
      return <PendingApprovalScreen />;
    case 'patient-home':
      return <PatientHomeScreen />;
    case 'patient-profile':
      return <PatientProfileScreen />;
    case 'burn-incident':
      return <BurnIncidentScreen />;
    case 'medical-records':
      return <MedicalRecordsScreen />;
    case 'hospital-search':
      return <HospitalSearchScreen />;
    case 'ngo-search':
      return <NgoSearchScreen />;
    case 'emergency':
      return <EmergencyScreen />;
    case 'doctor-home':
      return <DoctorHomeScreen />;
    case 'doctor-profile':
      return <ProviderProfileScreen variant="doctor" />;
    case 'doctor-patients':
      return <ProviderPatientsScreen />;
    case 'ngo-home':
      return <NgoHomeScreen />;
    case 'ngo-profile':
      return <ProviderProfileScreen variant="ngo" />;
    case 'ngo-patients':
      return <ProviderPatientsScreen />;
    case 'admin-home':
      return <AdminHomeScreen />;
    case 'admin-approvals':
      return <AdminApprovalsScreen />;
    case 'admin-hospitals':
      return <AdminHospitalsScreen />;
    case 'admin-content':
      return <AdminContentScreen />;
    default:
      return <WelcomeScreen />;
  }
}

function InnerSwitcher() {
  const { current } = useNav();
  return <View style={{ flex: 1, backgroundColor: colors.bg }}>{renderScreen(current)}</View>;
}

export function RootNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) return <Loader label="Starting Ummeed…" />;

  if (!session) {
    return (
      <NavProvider initial={{ name: 'welcome' }}>
        <InnerSwitcher />
      </NavProvider>
    );
  }

  if (!profile) return <Loader label="Loading profile…" />;

  // Decide initial route by role + verification status
  let initial: Nav;
  if (profile.role === 'admin') {
    initial = { name: 'admin-home' };
  } else if (profile.role === 'patient') {
    initial = { name: 'patient-home' };
  } else if (profile.verification_status !== 'approved') {
    initial = { name: 'pending-approval' };
  } else if (profile.role === 'doctor') {
    initial = { name: 'doctor-home' };
  } else {
    initial = { name: 'ngo-home' };
  }

  // Key forces remount when the role/status changes so the stack resets cleanly.
  const key = `${profile.role}-${profile.verification_status}`;
  return (
    <NavProvider key={key} initial={initial}>
      <InnerSwitcher />
    </NavProvider>
  );
}

const styles = StyleSheet.create({
  loadingSafe: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.text, fontSize: font.body, marginTop: spacing.md },
});
