import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { SuccessMessage } from '../../components/SuccessMessage';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

export function AdminApprovalsScreen() {
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', filter)
      .in('role', ['doctor', 'ngo', 'counselor', 'legal_aid', 'volunteer'])
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }
    setList((data as Profile[]) ?? []);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (p: Profile, status: 'approved' | 'rejected') => {
    setSuccess(null);
    const { error } = await supabase.from('profiles').update({ verification_status: status }).eq('id', p.id);
    if (error) {
      Alert.alert('Update error', error.message);
      return;
    }
    setSuccess(`User ${status} successfully.`);
    load();
  };

  const remove = async (p: Profile) => {
    const { error } = await supabase.from('profiles').delete().eq('id', p.id);
    if (error) {
      Alert.alert('Delete error', error.message);
      return;
    }
    load();
  };

  return (
    <Screen title="User approvals">
      <View style={styles.tabs}>
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <Button
            key={s}
            title={s}
            fullWidth={false}
            variant={filter === s ? 'primary' : 'ghost'}
            style={{ marginRight: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md }}
            onPress={() => setFilter(s)}
            testID={`appr-tab-${s}`}
          />
        ))}
      </View>

      <Text style={styles.section}>
        {loading ? 'Loading…' : `${list.length} ${filter}`}
      </Text>
      <SuccessMessage message={success} />

      {list.map((p) => (
        <Card
          key={p.id}
          title={p.organization_name || p.full_name || 'Provider'}
          subtitle={`${p.role}  •  ${[p.city, p.state].filter(Boolean).join(', ')}`}
          testID={`appr-item-${p.id}`}
        >
          {p.license_number ? <Text style={styles.body}>License: {p.license_number}</Text> : null}
          {p.registration_number ? <Text style={styles.body}>Reg. No: {p.registration_number}</Text> : null}
          {p.specialization ? <Text style={styles.body}>Specialization: {p.specialization}</Text> : null}
          {p.phone ? <Text style={styles.body}>Phone: {p.phone}</Text> : null}

          <View style={styles.row}>
            {filter !== 'approved' ? (
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Button title="Approve" onPress={() => decide(p, 'approved')} testID={`appr-yes-${p.id}`} />
              </View>
            ) : null}
            {filter !== 'rejected' ? (
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Button title="Reject" variant="danger" onPress={() => decide(p, 'rejected')} testID={`appr-no-${p.id}`} />
              </View>
            ) : null}
          </View>
          <View style={{ height: spacing.sm }} />
          <Button title="Delete profile" variant="ghost" fullWidth={false} onPress={() => remove(p)} testID={`appr-del-${p.id}`} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap' },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginVertical: spacing.sm },
  body: { color: colors.text, fontSize: font.body, marginBottom: 2 },
  row: { flexDirection: 'row', marginTop: spacing.sm },
});
