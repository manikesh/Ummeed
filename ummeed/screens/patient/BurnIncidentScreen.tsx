import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { BurnIncident } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

const BURN_TYPES = ['acid', 'flame', 'electrical', 'scald', 'other'];
const SEVERITIES = ['1st_degree', '2nd_degree', '3rd_degree'];

export function BurnIncidentScreen() {
  const { profile } = useAuth();
  const [list, setList] = useState<BurnIncident[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [burnType, setBurnType] = useState('acid');
  const [severity, setSeverity] = useState('2nd_degree');
  const [bodyPart, setBodyPart] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

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
    setSaving(true);
    const { error } = await supabase.from('burn_incidents').insert({
      patient_id: profile.id,
      burn_type: burnType,
      severity,
      body_part: bodyPart || null,
      location: location || null,
      description: description || null,
      incident_date: incidentDate || null,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    setBodyPart('');
    setLocation('');
    setDescription('');
    setIncidentDate('');
    Alert.alert('Saved successfully', 'Your burn incident data was saved successfully.');
    load();
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
      <Input label="Date of incident" value={incidentDate} onChangeText={setIncidentDate} placeholder="YYYY-MM-DD" testID="bi-date" />
      <Input label="Where did it happen" value={location} onChangeText={setLocation} placeholder="City / place" testID="bi-location" />
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
      <Button title="Add incident" onPress={save} loading={saving} testID="bi-save" />

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
          <Button title="Delete" variant="danger" onPress={() => del(it.id)} fullWidth={false} testID={`bi-del-${it.id}`} />
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
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginTop: spacing.md, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cardBody: { color: colors.text, fontSize: font.body, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic' },
});
