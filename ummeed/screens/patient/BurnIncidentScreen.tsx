import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { CityStateAutocomplete } from '../../components/CityStateAutocomplete';
import { DateInput } from '../../components/DateInput';
import { SuccessMessage } from '../../components/SuccessMessage';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { getPatientOnboardingStatus } from '../../lib/patientOnboarding';
import { supabase } from '../../lib/supabase';
import type { BurnIncident } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

const BURN_TYPES = ['acid', 'flame', 'electrical', 'scald', 'other'];
const SEVERITIES = ['1st_degree', '2nd_degree', '3rd_degree'];

export function BurnIncidentScreen() {
  const { profile } = useAuth();
  const { reset } = useNav();
  const [list, setList] = useState<BurnIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [burnType, setBurnType] = useState('acid');
  const [severity, setSeverity] = useState('2nd_degree');
  const [bodyPart, setBodyPart] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [locationState, setLocationState] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('burn_incidents')
      .select('*')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }
    setList((data as BurnIncident[]) ?? []);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!profile) return;
    setSuccess(null);
    const errors: Record<string, string> = {};
    if (!incidentDate.trim()) errors.incidentDate = 'Date of incident is required.';
    if (!location.trim()) errors.location = 'City is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    const values = {
      patient_id: profile.id,
      burn_type: burnType,
      severity,
      body_part: bodyPart || null,
      location: location || null,
      description: description || null,
      incident_date: incidentDate || null,
    };
    const query = editingId
      ? supabase.from('burn_incidents').update(values).eq('id', editingId)
      : supabase.from('burn_incidents').insert(values);
    const { error } = await query;
    setSaving(false);
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    setBodyPart('');
    setBurnType('acid');
    setSeverity('2nd_degree');
    setLocation('');
    setLocationState('');
    setDescription('');
    setIncidentDate('');
    setEditingId(null);
    setSuccess(editingId ? 'Burn incident updated successfully.' : 'Burn incident saved successfully.');
    if (profile.verification_status === 'pending') {
      const onboarding = await getPatientOnboardingStatus(profile);
      if (onboarding.isComplete) {
        reset({ name: 'pending-approval' });
        return;
      }
    }
    load();
  };

  const edit = (incident: BurnIncident) => {
    setEditingId(incident.id);
    setBurnType(incident.burn_type ?? 'acid');
    setSeverity(incident.severity ?? '2nd_degree');
    setBodyPart(incident.body_part ?? '');
    setIncidentDate(incident.incident_date ?? '');
    setLocation(incident.location ?? '');
    setLocationState('');
    setDescription(incident.description ?? '');
    setSuccess(null);
    setFieldErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBodyPart('');
    setBurnType('acid');
    setSeverity('2nd_degree');
    setIncidentDate('');
    setLocation('');
    setLocationState('');
    setDescription('');
    setFieldErrors({});
  };

  const del = async (id: string) => {
    const { error } = await supabase.from('burn_incidents').delete().eq('id', id);
    if (error) {
      Alert.alert('Delete error', error.message);
      return;
    }
    load();
  };

  return (
    <Screen title="Burn incident" subtitle="Add the details of your injury.">
      <Text style={styles.section}>Type of burn</Text>
      <View style={styles.chipRow}>
        {BURN_TYPES.map((t) => (
          <Chip key={t} active={burnType === t} label={t} onPress={() => setBurnType(t)} testID={`bi-type-${t}`} />
        ))}
      </View>

      <Text style={styles.section}>Severity</Text>
      <View style={styles.chipRow}>
        {SEVERITIES.map((s) => (
          <Chip
            key={s}
            active={severity === s}
            label={s.replace('_', ' ')}
            onPress={() => setSeverity(s)}
            testID={`bi-sev-${s}`}
          />
        ))}
      </View>

      <Input label="Body part affected" value={bodyPart} onChangeText={setBodyPart} placeholder="e.g. face, left arm" testID="bi-part" />
      <DateInput
        label="Date of incident"
        value={incidentDate}
        onChange={(value) => {
          setIncidentDate(value);
          setFieldErrors((prev) => ({ ...prev, incidentDate: '' }));
        }}
        maximumDate={new Date()}
        error={fieldErrors.incidentDate}
        testID="bi-date"
      />
      <CityStateAutocomplete
        city={location}
        setCity={(value) => {
          setLocation(value);
          setFieldErrors((prev) => ({ ...prev, location: '' }));
        }}
        state={locationState}
        setState={setLocationState}
        showState={false}
        cityTestID="bi-location"
        cityError={fieldErrors.location}
      />
      <Input
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        placeholder="Anything you'd like to share"
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        testID="bi-desc"
      />
      <SuccessMessage message={success} />
      <Button title={editingId ? 'Save changes' : 'Add incident'} onPress={save} loading={saving} testID="bi-save" />
      {editingId ? (
        <View style={{ marginTop: spacing.sm }}>
          <Button title="Cancel editing" variant="ghost" onPress={cancelEdit} testID="bi-cancel-edit" />
        </View>
      ) : null}

      <View style={{ height: spacing.lg }} />
      <Text style={styles.section}>My incidents {loading ? '…' : `(${list.length})`}</Text>
      {list.length === 0 && !loading ? (
        <Text style={styles.empty}>No incidents added yet.</Text>
      ) : null}
      {list.map((it) => (
        <Card
          key={it.id}
          title={`${it.burn_type ?? 'burn'} — ${it.severity ?? ''}`}
          subtitle={`${it.body_part ?? '—'}${it.incident_date ? '  •  ' + it.incident_date : ''}`}
          testID={`bi-item-${it.id}`}
        >
          {it.description ? <Text style={styles.cardBody}>{it.description}</Text> : null}
          <View style={{ height: spacing.sm }} />
          <View style={styles.actions}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Button title="Review / Edit" variant="ghost" onPress={() => edit(it)} testID={`bi-edit-${it.id}`} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Button title="Delete" variant="danger" onPress={() => del(it.id)} testID={`bi-del-${it.id}`} />
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <View>
      <Button
        title={label}
        onPress={onPress}
        variant={active ? 'primary' : 'ghost'}
        fullWidth={false}
        style={{ marginRight: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md }}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row' },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginTop: spacing.md, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cardBody: { color: colors.text, fontSize: font.body, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic' },
});
