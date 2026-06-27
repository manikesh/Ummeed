import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors, font, spacing } from '../../theme';

export function PatientProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [gender, setGender] = useState(profile?.gender ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [state, setState] = useState(profile?.state ?? '');
  const [ecName, setEcName] = useState(profile?.emergency_contact_name ?? '');
  const [ecPhone, setEcPhone] = useState(profile?.emergency_contact_phone ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setAge(profile.age ? String(profile.age) : '');
    setGender(profile.gender ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setEcName(profile.emergency_contact_name ?? '');
    setEcPhone(profile.emergency_contact_phone ?? '');
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setErr(null);
    setSaving(true);
    const ageNum = age.trim() ? Number(age) : null;
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        age: Number.isFinite(ageNum) ? ageNum : null,
        gender,
        city,
        state,
        emergency_contact_name: ecName,
        emergency_contact_phone: ecPhone,
      })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    await refreshProfile();
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  return (
    <Screen title="My profile" subtitle="Keep this updated for the best care.">
      <Text style={styles.section}>Personal</Text>
      <Input label="Full name" value={fullName} onChangeText={setFullName} testID="pp-name" />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="pp-phone" />
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Input label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" testID="pp-age" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Input label="Gender" value={gender} onChangeText={setGender} placeholder="F / M / Other" testID="pp-gender" />
        </View>
      </View>

      <Text style={styles.section}>Address</Text>
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Input label="City" value={city} onChangeText={setCity} testID="pp-city" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Input label="State" value={state} onChangeText={setState} testID="pp-state" />
        </View>
      </View>

      <Text style={styles.section}>Emergency contact</Text>
      <Input label="Contact name" value={ecName} onChangeText={setEcName} testID="pp-ec-name" />
      <Input label="Contact phone" value={ecPhone} onChangeText={setEcPhone} keyboardType="phone-pad" testID="pp-ec-phone" />

      {err ? <Text style={styles.err}>{err}</Text> : null}
      <View style={{ height: spacing.sm }} />
      <Button title="Save profile" onPress={save} loading={saving} testID="pp-save" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginTop: spacing.md, marginBottom: spacing.sm },
  err: { color: colors.danger, fontSize: font.body, fontWeight: font.weightSemi },
});
