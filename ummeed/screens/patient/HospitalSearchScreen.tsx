import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { supabase } from '../../lib/supabase';
import type { Hospital } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

export function HospitalSearchScreen() {
  const [query, setQuery] = useState('');
  const [onlyBurnUnit, setOnlyBurnUnit] = useState(true);
  const [list, setList] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('hospitals').select('*').eq('is_active', true);
    if (onlyBurnUnit) q = q.eq('has_burn_unit', true);
    if (query.trim()) q = q.or(`name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`);
    const { data, error } = await q.order('name');
    setLoading(false);
    if (error) {
      Alert.alert('Search error', error.message);
      return;
    }
    setList((data as Hospital[]) ?? []);
  }, [query, onlyBurnUnit]);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <Screen title="Find a hospital" subtitle="Search by name, city or state.">
      <Input
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. Delhi, Safdarjung, burn"
        autoCapitalize="words"
        returnKeyType="search"
        onSubmitEditing={search}
        testID="hs-query"
      />
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Button
            title={onlyBurnUnit ? '✓ Burn unit only' : 'Burn unit only'}
            variant={onlyBurnUnit ? 'primary' : 'ghost'}
            onPress={() => setOnlyBurnUnit((v) => !v)}
            testID="hs-burn-toggle"
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Button title="Search" variant="secondary" onPress={search} loading={loading} testID="hs-search" />
        </View>
      </View>

      <View style={{ height: spacing.lg }} />
      <Text style={styles.section}>{loading ? 'Searching…' : `${list.length} hospitals`}</Text>
      {list.map((h) => (
        <Card
          key={h.id}
          title={h.name}
          subtitle={`${h.city ?? ''}${h.state ? ', ' + h.state : ''}${h.has_burn_unit ? '  •  Burn unit ✓' : ''}`}
          testID={`hs-item-${h.id}`}
        >
          {h.address ? <Text style={styles.body}>{h.address}</Text> : null}
          {h.phone ? (
            <Button
              title={`📞 Call ${h.phone}`}
              variant="secondary"
              onPress={() => Linking.openURL(`tel:${h.phone}`)}
              testID={`hs-call-${h.id}`}
            />
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginBottom: spacing.sm },
  body: { color: colors.text, fontSize: font.body, marginBottom: spacing.sm, lineHeight: 24 },
});
