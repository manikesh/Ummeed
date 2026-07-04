import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CityStateAutocomplete } from '../../components/CityStateAutocomplete';
import { Screen } from '../../components/Screen';
import { SuccessMessage } from '../../components/SuccessMessage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { colors, font, spacing } from '../../theme';

interface Props {
  variant: 'doctor' | 'ngo' | 'counselor' | 'legal_aid';
}

const COPY: Record<Props['variant'], { title: string; orgLabel: string; idLabel: string }> = {
  doctor: { title: 'Doctor profile', orgLabel: 'Hospital / Clinic name', idLabel: 'Medical license number' },
  ngo: { title: 'NGO profile', orgLabel: 'NGO name', idLabel: 'NGO registration number' },
  counselor: { title: 'Counselor profile', orgLabel: 'Clinic name', idLabel: 'License / Certification number' },
  legal_aid: { title: 'Legal aid profile', orgLabel: 'Firm / Office name', idLabel: 'Bar council enrollment no.' },
};

export function ProviderProfileScreen({ variant }: Props) {
  const { profile, refreshProfile } = useAuth();
  const copy = COPY[variant];
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [org, setOrg] = useState(profile?.organization_name ?? '');
  const [licenseOrReg, setLicenseOrReg] = useState(
    variant === 'doctor' ? profile?.license_number ?? '' : profile?.registration_number ?? '',
  );
  const [specialization, setSpecialization] = useState(profile?.specialization ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [state, setState] = useState(profile?.state ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setSuccess(null);
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setOrg(profile.organization_name ?? '');
    setSpecialization(profile.specialization ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setAddress(profile.address ?? '');
    setLicenseOrReg(variant === 'doctor' ? profile.license_number ?? '' : profile.registration_number ?? '');
  }, [profile, variant]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const updates: Record<string, any> = {
      full_name: fullName,
      phone,
      organization_name: org,
      specialization: specialization || null,
      city,
      state,
      address,
    };
    if (variant === 'doctor') updates.license_number = licenseOrReg;
    else updates.registration_number = licenseOrReg;
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
    setSaving(false);
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    await refreshProfile();
    setSuccess('Your profile data was saved successfully. Admin will re-review it if needed.');
  };

  return (
    <Screen title={copy.title} subtitle={`Status: ${profile?.verification_status ?? '—'}`}>
      <Input label="Full name" value={fullName} onChangeText={setFullName} testID="pp-name" />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="pp-phone" />
      <Input label={copy.orgLabel} value={org} onChangeText={setOrg} testID="pp-org" />
      <Input label={copy.idLabel} value={licenseOrReg} onChangeText={setLicenseOrReg} testID="pp-id" />
      {variant === 'doctor' || variant === 'counselor' ? (
        <Input
          label="Specialization"
          value={specialization}
          onChangeText={setSpecialization}
          placeholder={variant === 'doctor' ? 'e.g. Plastic & burn surgery' : 'e.g. PTSD, trauma'}
          testID="pp-spec"
        />
      ) : null}
      <Input label="Address" value={address} onChangeText={setAddress} testID="pp-address" />
      <CityStateAutocomplete
        city={city}
        setCity={setCity}
        state={state}
        setState={setState}
        cityTestID="pp-city"
        stateTestID="pp-state"
      />
      <SuccessMessage message={success} />
      <Button title="Save profile" onPress={save} loading={saving} testID="pp-save" />

      <Text style={styles.note}>
        After updating, your account may be re-verified by the admin team.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.md, textAlign: 'center' },
});
