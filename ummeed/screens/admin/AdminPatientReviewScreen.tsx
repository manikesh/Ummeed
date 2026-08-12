import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useNav } from '../../contexts/NavContext';
import { supabase } from '../../lib/supabase';
import type { BurnIncident, MedicalRecord, Profile } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

interface Props {
  patientId: string;
}

export function AdminPatientReviewScreen({ patientId }: Props) {
  const { back, replace } = useNav();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [incidents, setIncidents] = useState<BurnIncident[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [profileRes, incidentsRes, recordsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', patientId).maybeSingle(),
      supabase.from('burn_incidents').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
    ]);
    setLoading(false);

    const error = profileRes.error || incidentsRes.error || recordsRes.error;
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }

    setProfile((profileRes.data as Profile) ?? null);
    setIncidents((incidentsRes.data as BurnIncident[]) ?? []);
    setRecords((recordsRes.data as MedicalRecord[]) ?? []);
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (status: 'approved' | 'rejected') => {
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ verification_status: status }).eq('id', patientId);
    setBusy(false);
    if (error) {
      Alert.alert('Update error', error.message);
      return;
    }
    Alert.alert('Updated', `Patient ${status} successfully.`);
    replace({ name: 'admin-approvals' });
  };

  const openRecord = async (record: MedicalRecord) => {
    if (!record.file_path) return;
    const { data, error } = await supabase.storage
      .from('medical_records')
      .createSignedUrl(record.file_path, 60 * 5);
    if (error || !data?.signedUrl) {
      Alert.alert('Open file error', error?.message || 'Could not create a secure file link.');
      return;
    }
    await Linking.openURL(data.signedUrl);
  };

  return (
    <Screen
      title="Patient review"
      subtitle={loading ? 'Loading patient details...' : profile?.full_name || 'Patient details'}
      rightAction={{ label: 'Back', onPress: back }}
    >
      <Card title="Patient profile" subtitle={`Status: ${profile?.verification_status ?? 'unknown'}`}>
        <Detail label="Name" value={profile?.full_name} />
        <Detail label="Phone" value={profile?.phone} />
        <Detail label="Age" value={profile?.age ? String(profile.age) : null} />
        <Detail label="Gender" value={profile?.gender} />
        <Detail label="City" value={profile?.city} />
        <Detail label="State" value={profile?.state} />
        <Detail label="Emergency contact" value={profile?.emergency_contact_name} />
        <Detail label="Emergency phone" value={profile?.emergency_contact_phone} />
        <Detail label="Registered on" value={profile?.created_at ? new Date(profile.created_at).toLocaleString() : null} />
      </Card>

      <Text style={styles.section}>Burn details ({incidents.length})</Text>
      {incidents.length === 0 ? <Text style={styles.empty}>No burn incident details found.</Text> : null}
      {incidents.map((incident) => (
        <Card
          key={incident.id}
          title={`${incident.burn_type ?? 'Burn'} - ${incident.severity ?? 'Severity not set'}`}
          subtitle={incident.incident_date ? `Incident date: ${incident.incident_date}` : undefined}
          testID={`admin-patient-incident-${incident.id}`}
        >
          <Detail label="Body part" value={incident.body_part} />
          <Detail label="Location" value={incident.location} />
          <Detail label="Description" value={incident.description} />
          <Detail label="Submitted on" value={new Date(incident.created_at).toLocaleString()} />
        </Card>
      ))}

      <Text style={styles.section}>Medical records ({records.length})</Text>
      {records.length === 0 ? <Text style={styles.empty}>No medical records uploaded.</Text> : null}
      {records.map((record) => (
        <Card
          key={record.id}
          title={record.title}
          subtitle={`${record.mime_type ?? 'file'} - ${new Date(record.created_at).toLocaleDateString()}`}
          testID={`admin-patient-record-${record.id}`}
        >
          <Detail label="Notes" value={record.notes} />
          <Detail label="File path" value={record.file_path} />
          {record.file_path ? (
            <Button
              title="Open uploaded file"
              variant="ghost"
              fullWidth={false}
              onPress={() => openRecord(record)}
              testID={`admin-patient-record-open-${record.id}`}
            />
          ) : null}
        </Card>
      ))}

      <View style={styles.actions}>
        {profile?.verification_status !== 'approved' ? (
          <View style={styles.actionButton}>
            <Button title="Approve patient" onPress={() => decide('approved')} loading={busy} testID="admin-patient-approve" />
          </View>
        ) : null}
        {profile?.verification_status !== 'rejected' ? (
          <View style={styles.actionButton}>
            <Button title="Reject patient" variant="danger" onPress={() => decide('rejected')} loading={busy} testID="admin-patient-reject" />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value?.trim() || 'Not provided'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginTop: spacing.md, marginBottom: spacing.sm },
  detail: { marginBottom: spacing.sm },
  label: { color: colors.textMuted, fontSize: font.small, fontWeight: font.weightSemi },
  value: { color: colors.text, fontSize: font.body, marginTop: 2 },
  empty: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic', marginBottom: spacing.md },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  actionButton: { flex: 1, marginRight: spacing.sm },
});
