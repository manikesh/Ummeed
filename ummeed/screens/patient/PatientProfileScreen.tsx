import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CityStateAutocomplete } from '../../components/CityStateAutocomplete';
import { Screen } from '../../components/Screen';
import { SuccessMessage } from '../../components/SuccessMessage';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const updateAge = (value: string) => {
    setAge(value.replace(/\D/g, ''));
    setFieldErrors((prev) => ({ ...prev, age: '' }));
  };

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
    setSuccess(null);
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Name is required.';
    if (!phone.trim()) errors.phone = 'Phone is required.';
    if (!age.trim()) errors.age = 'Age is required.';
    if (!city.trim()) errors.city = 'City is required.';
    if (!gender.trim()) errors.gender = 'Gender is required.';
    if (ecName.trim() && !ecPhone.trim()) errors.ecPhone = 'Emergency contact phone is required when name is added.';
    if (ecPhone.trim() && !ecName.trim()) errors.ecName = 'Emergency contact name is required when phone is added.';
    const ageNum = age.trim() ? Number(age) : null;
    if (ageNum !== null && (!Number.isFinite(ageNum) || ageNum <= 0)) errors.age = 'Enter a valid age.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
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
    setSuccess('Your profile data was saved successfully.');
  };

  return (
    <Screen title="My profile" subtitle="Keep this updated for the best care.">
      <Text style={styles.section}>Personal</Text>
      <Input
        label="Full name"
        value={fullName}
        onChangeText={(value) => {
          setFullName(value);
          setFieldErrors((prev) => ({ ...prev, fullName: '' }));
        }}
        error={fieldErrors.fullName}
        testID="pp-name"
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          setFieldErrors((prev) => ({ ...prev, phone: '' }));
        }}
        keyboardType="phone-pad"
        error={fieldErrors.phone}
        testID="pp-phone"
      />
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Input
            label="Age"
            value={age}
            onChangeText={updateAge}
            keyboardType="number-pad"
            inputMode="numeric"
            error={fieldErrors.age}
            testID="pp-age"
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Input
            label="Gender"
            value={gender}
            onChangeText={(value) => {
              setGender(value);
              setFieldErrors((prev) => ({ ...prev, gender: '' }));
            }}
            placeholder="F / M / Other"
            error={fieldErrors.gender}
            testID="pp-gender"
          />
        </View>
      </View>

      <Text style={styles.section}>Address</Text>
      <CityStateAutocomplete
        city={city}
        setCity={(value) => {
          setCity(value);
          setFieldErrors((prev) => ({ ...prev, city: '' }));
        }}
        state={state}
        setState={setState}
        cityTestID="pp-city"
        stateTestID="pp-state"
        cityError={fieldErrors.city}
      />

      <Text style={styles.section}>Emergency contact</Text>
      <Input
        label="Contact name"
        value={ecName}
        onChangeText={(value) => {
          setEcName(value);
          setFieldErrors((prev) => ({ ...prev, ecName: '', ecPhone: value.trim() && !ecPhone.trim() ? prev.ecPhone : '' }));
        }}
        error={fieldErrors.ecName}
        testID="pp-ec-name"
      />
      <Input
        label="Contact phone"
        value={ecPhone}
        onChangeText={(value) => {
          setEcPhone(value);
          setFieldErrors((prev) => ({ ...prev, ecPhone: '', ecName: value.trim() && !ecName.trim() ? prev.ecName : '' }));
        }}
        keyboardType="phone-pad"
        error={fieldErrors.ecPhone}
        testID="pp-ec-phone"
      />

      {err ? <Text style={styles.err}>{err}</Text> : null}
      <SuccessMessage message={success} />
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
