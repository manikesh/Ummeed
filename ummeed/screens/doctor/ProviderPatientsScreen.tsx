import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { SuccessMessage } from '../../components/SuccessMessage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Connection, Profile } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

interface Row extends Connection {
  patient?: Profile | null;
}

export function ProviderPatientsScreen() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'accepted' | 'declined'>('pending');
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('connections')
      .select('*, patient:profiles!connections_patient_id_fkey(*)')
      .eq('provider_id', profile.id)
      .eq('status', filter)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }
    setRows((data as Row[]) ?? []);
  }, [profile, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (row: Row, status: 'accepted' | 'declined') => {
    setSuccess(null);
    const { error } = await supabase.from('connections').update({ status }).eq('id', row.id);
    if (error) {
      Alert.alert('Update error', error.message);
      return;
    }
    setSuccess(`Patient request ${status} successfully.`);
    load();
  };

  return (
    <Screen title="My patient requests">
      <View style={styles.tabs}>
        {(['pending', 'accepted', 'declined'] as const).map((s) => (
          <Button
            key={s}
            title={s}
            fullWidth={false}
            variant={filter === s ? 'primary' : 'ghost'}
            style={{ marginRight: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md }}
            onPress={() => setFilter(s)}
            testID={`pat-tab-${s}`}
          />
        ))}
      </View>

      <Text style={styles.section}>
        {loading ? 'Loading…' : `${rows.length} ${filter} request${rows.length === 1 ? '' : 's'}`}
      </Text>
      <SuccessMessage message={success} />

      {rows.map((r) => (
        <Card
          key={r.id}
          title={r.patient?.full_name ?? 'Patient'}
          subtitle={[r.patient?.city, r.patient?.state].filter(Boolean).join(', ') || undefined}
          testID={`pat-item-${r.id}`}
        >
          {r.message ? <Text style={styles.body}>"{r.message}"</Text> : null}
          {filter === 'pending' ? (
            <View style={styles.actions}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Button title="Accept" onPress={() => decide(r, 'accepted')} testID={`pat-accept-${r.id}`} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Button title="Decline" variant="danger" onPress={() => decide(r, 'declined')} testID={`pat-decline-${r.id}`} />
              </View>
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap' },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginVertical: spacing.sm },
  body: { color: colors.text, fontSize: font.body, marginBottom: spacing.sm, fontStyle: 'italic' },
  actions: { flexDirection: 'row', marginTop: spacing.sm },
});
