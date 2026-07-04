import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { SuccessMessage } from '../../components/SuccessMessage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { AppRole, Profile } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

const ROLE_TABS: { key: AppRole; label: string }[] = [
  { key: 'ngo', label: 'NGOs' },
  { key: 'counselor', label: 'Counselors' },
  { key: 'legal_aid', label: 'Legal aid' },
  { key: 'doctor', label: 'Doctors' },
];

export function NgoSearchScreen() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<AppRole>('ngo');
  const [query, setQuery] = useState('');
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('profiles')
      .select('*')
      .eq('role', tab)
      .eq('verification_status', 'approved');
    if (query.trim()) {
      q = q.or(
        `full_name.ilike.%${query}%,organization_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`,
      );
    }
    const { data, error } = await q.limit(50);
    setLoading(false);
    if (error) {
      Alert.alert('Search error', error.message);
      return;
    }
    setList((data as Profile[]) ?? []);
  }, [tab, query]);

  useEffect(() => {
    search();
  }, [search]);

  const connect = async (target: Profile) => {
    setSuccess(null);
    if (!profile) return;
    if (profile.role !== 'patient') {
      Alert.alert('Only patients', 'Only patients can send connection requests.');
      return;
    }
    const { error } = await supabase.from('connections').insert({
      patient_id: profile.id,
      provider_id: target.id,
      message: 'Requesting support via Ummeed.',
    });
    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already requested', 'You have already sent a request to this provider.');
      } else {
        Alert.alert('Could not connect', error.message);
      }
      return;
    }
    setSuccess('Connection request sent successfully. The provider will respond shortly.');
  };

  return (
    <Screen title="Find support" subtitle="NGOs, counselors, legal aid and doctors.">
      <SuccessMessage message={success} />
      <View style={styles.tabs}>
        {ROLE_TABS.map((t) => (
          <Button
            key={t.key}
            title={t.label}
            variant={tab === t.key ? 'primary' : 'ghost'}
            fullWidth={false}
            style={{ marginRight: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md }}
            onPress={() => setTab(t.key)}
            testID={`ns-tab-${t.key}`}
          />
        ))}
      </View>

      <Input
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Name, organisation, city…"
        returnKeyType="search"
        onSubmitEditing={search}
        testID="ns-query"
      />
      <Button title="Search" onPress={search} loading={loading} variant="secondary" testID="ns-search" />

      <View style={{ height: spacing.lg }} />
      <Text style={styles.section}>{loading ? 'Searching…' : `${list.length} results`}</Text>
      {list.length === 0 && !loading ? (
        <Text style={styles.empty}>
          No approved providers yet for this category. Check back soon.
        </Text>
      ) : null}
      {list.map((p) => (
        <Card
          key={p.id}
          title={p.organization_name || p.full_name || 'Provider'}
          subtitle={[p.city, p.state].filter(Boolean).join(', ')}
          testID={`ns-item-${p.id}`}
        >
          {p.specialization ? <Text style={styles.body}>Specialization: {p.specialization}</Text> : null}
          {p.address ? <Text style={styles.body}>{p.address}</Text> : null}
          <View style={styles.actions}>
            {p.phone ? (
              <Button
                title={`📞 Call`}
                variant="secondary"
                fullWidth={false}
                style={{ marginRight: spacing.sm, paddingHorizontal: spacing.md }}
                onPress={() => Linking.openURL(`tel:${p.phone}`)}
                testID={`ns-call-${p.id}`}
              />
            ) : null}
            <Button
              title="Send request"
              fullWidth={false}
              style={{ paddingHorizontal: spacing.md }}
              onPress={() => connect(p)}
              testID={`ns-connect-${p.id}`}
            />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic' },
  body: { color: colors.text, fontSize: font.body, marginBottom: 4 },
  actions: { flexDirection: 'row', marginTop: spacing.sm, flexWrap: 'wrap' },
});
