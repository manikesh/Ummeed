import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { supabase } from '../../lib/supabase';
import type { Hospital } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

export function AdminHospitalsScreen() {
  const [list, setList] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [burn, setBurn] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('hospitals').select('*').order('name');
    setLoading(false);
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }
    setList((data as Hospital[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Hospital name is required.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('hospitals').insert({
      name,
      city,
      state,
      phone,
      address,
      has_burn_unit: burn,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    setName('');
    setCity('');
    setState('');
    setPhone('');
    setAddress('');
    load();
  };

  const toggleActive = async (h: Hospital) => {
    const { error } = await supabase.from('hospitals').update({ is_active: !h.is_active }).eq('id', h.id);
    if (error) {
      Alert.alert('Update error', error.message);
      return;
    }
    load();
  };

  const remove = async (h: Hospital) => {
    const { error } = await supabase.from('hospitals').delete().eq('id', h.id);
    if (error) {
      Alert.alert('Delete error', error.message);
      return;
    }
    load();
  };

  return (
    <Screen title="Hospitals" subtitle="Add and manage burn-unit hospitals.">
      <Text style={styles.section}>Add new</Text>
      <Input label="Name" value={name} onChangeText={setName} testID="hosp-name" />
      <Input label="Address" value={address} onChangeText={setAddress} testID="hosp-addr" />
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Input label="City" value={city} onChangeText={setCity} testID="hosp-city" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Input label="State" value={state} onChangeText={setState} testID="hosp-state" />
        </View>
      </View>
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="hosp-phone" />
      <Button
        title={burn ? '✓ Has burn unit' : 'Has burn unit'}
        variant={burn ? 'primary' : 'ghost'}
        onPress={() => setBurn((v) => !v)}
        testID="hosp-burn-toggle"
      />
      <View style={{ height: spacing.sm }} />
      <Button title="Add hospital" onPress={add} loading={saving} variant="secondary" testID="hosp-add" />

      <View style={{ height: spacing.lg }} />
      <Text style={styles.section}>{loading ? 'Loading…' : `All hospitals (${list.length})`}</Text>
      {list.map((h) => (
        <Card
          key={h.id}
          title={h.name}
          subtitle={`${[h.city, h.state].filter(Boolean).join(', ')}${h.has_burn_unit ? '  •  Burn unit ✓' : ''}${h.is_active ? '' : '  •  inactive'}`}
          testID={`hosp-item-${h.id}`}
        >
          {h.address ? <Text style={styles.body}>{h.address}</Text> : null}
          {h.phone ? <Text style={styles.body}>{h.phone}</Text> : null}
          <View style={styles.row2}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Button title={h.is_active ? 'Deactivate' : 'Activate'} variant="ghost" onPress={() => toggleActive(h)} testID={`hosp-toggle-${h.id}`} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Button title="Delete" variant="danger" onPress={() => remove(h)} testID={`hosp-del-${h.id}`} />
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginBottom: spacing.sm },
  row: { flexDirection: 'row' },
  row2: { flexDirection: 'row', marginTop: spacing.sm },
  body: { color: colors.text, fontSize: font.body, marginBottom: 2 },
});
