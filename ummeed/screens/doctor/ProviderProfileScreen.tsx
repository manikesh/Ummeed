import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { CityStateAutocomplete } from '../../components/CityStateAutocomplete';
import { Screen } from '../../components/Screen';
import { SuccessMessage } from '../../components/SuccessMessage';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { getProviderProfileMissingFields } from '../../lib/providerProfile';
import { supabase } from '../../lib/supabase';
import { colors, font, spacing } from '../../theme';

interface Props {
  variant: 'doctor' | 'ngo' | 'counselor' | 'legal_aid';
  onboarding?: boolean;
}

const COPY: Record<Props['variant'], { title: string; orgLabel: string; idLabel: string }> = {
  doctor: { title: 'Doctor profile', orgLabel: 'Hospital / Clinic name', idLabel: 'Medical license number' },
  ngo: { title: 'NGO profile', orgLabel: 'NGO name', idLabel: 'NGO registration number' },
  counselor: { title: 'Counselor profile', orgLabel: 'Clinic name', idLabel: 'License / Certification number' },
  legal_aid: { title: 'Legal aid profile', orgLabel: 'Firm / Office name', idLabel: 'Bar council enrollment no.' },
};

const MIN_LEN = 10;

interface FieldErrors {
  fullName?: string;
  phone?: string;
  org?: string;
  licenseOrReg?: string;
  specialization?: string;
  address?: string;
  city?: string;
}

function fieldError(value: string): string | undefined {
  if (!value.trim()) return 'This field is required.';
  if (value.trim().length < MIN_LEN) return `Must be at least ${MIN_LEN} characters.`;
  return undefined;
}

export function ProviderProfileScreen({ variant, onboarding = false }: Props) {
  const { profile, refreshProfile, signOut } = useAuth();
  const { reset } = useNav();
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [hasSubmitError, setHasSubmitError] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setSuccess(null);
    setErrors({});
    setHasSubmitError(false);
    setFullName(profile.full_name ?? '');
    setPhone(profile.phone ?? '');
    setOrg(profile.organization_name ?? '');
    setSpecialization(profile.specialization ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setAddress(profile.address ?? '');
    setLicenseOrReg(variant === 'doctor' ? profile.license_number ?? '' : profile.registration_number ?? '');
  }, [profile, variant]);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    e.fullName = fieldError(fullName);
    e.phone = fieldError(phone);
    e.org = fieldError(org);
    e.licenseOrReg = fieldError(licenseOrReg);
    e.address = fieldError(address);
    e.city = city.trim() ? undefined : 'Please select a city.';
    if (variant === 'doctor' || variant === 'counselor') {
      e.specialization = fieldError(specialization);
    }
    // Remove undefined entries so Object.values check works cleanly
    return Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined)) as FieldErrors;
  };

  const save = async () => {
    if (!profile) return;
    setSuccess(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setHasSubmitError(true);
      return;
    }

    setErrors({});
    setHasSubmitError(false);

    const candidate = {
      ...profile,
      full_name: fullName.trim(),
      phone: phone.trim(),
      organization_name: org.trim(),
      specialization: specialization.trim() || null,
      city: city.trim(),
      state: state.trim(),
      address: address.trim(),
      license_number: variant === 'doctor' ? licenseOrReg.trim() : profile.license_number,
      registration_number: variant === 'doctor' ? profile.registration_number : licenseOrReg.trim(),
    };
    if (onboarding) {
      const missing = getProviderProfileMissingFields(candidate);
      if (missing.length) {
        setHasSubmitError(true);
        return;
      }
    }
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
    if (onboarding) updates.verification_status = 'pending';
    if (variant === 'doctor') updates.license_number = licenseOrReg;
    else updates.registration_number = licenseOrReg;
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
    setSaving(false);
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    await refreshProfile();
    if (onboarding) {
      reset({ name: 'pending-approval' });
      return;
    }
    setSuccess('Your profile data was saved successfully.');
  };

  return (
    <Screen
      title={onboarding ? 'Complete your profile' : copy.title}
      subtitle={onboarding ? 'Add your professional details before requesting approval.' : `Status: ${profile?.verification_status ?? '—'}`}
      hideBack={onboarding}
      rightAction={onboarding ? { label: 'Sign out', onPress: signOut } : undefined}
    >
      {onboarding ? <Text style={styles.intro}>Admin will review these details before approving your account. All fields are required.</Text> : null}

      {hasSubmitError ? (
        <Text style={styles.banner}>⚠️ Please fix the errors before proceeding.</Text>
      ) : null}

      <Input label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} testID="pp-name" />
      <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} testID="pp-phone" />
      <Input label={copy.orgLabel} value={org} onChangeText={setOrg} error={errors.org} testID="pp-org" />
      <Input label={copy.idLabel} value={licenseOrReg} onChangeText={setLicenseOrReg} error={errors.licenseOrReg} testID="pp-id" />
      {variant === 'doctor' || variant === 'counselor' ? (
        <Input
          label="Specialization"
          value={specialization}
          onChangeText={setSpecialization}
          placeholder={variant === 'doctor' ? 'e.g. Plastic & burn surgery' : 'e.g. PTSD, trauma'}
          error={errors.specialization}
          testID="pp-spec"
        />
      ) : null}
      <Input label="Address" value={address} onChangeText={setAddress} error={errors.address} testID="pp-address" />
      <CityStateAutocomplete
        city={city}
        setCity={setCity}
        state={state}
        setState={setState}
        cityTestID="pp-city"
        stateTestID="pp-state"
        cityError={errors.city}
      />

      <SuccessMessage message={success} />
      <Button title={onboarding ? 'Submit for approval' : 'Save profile'} onPress={save} loading={saving} testID="pp-save" />

      {!onboarding ? <Text style={styles.note}>
        After updating, changes will be visible in 3 hrs..
      </Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.text, fontSize: font.body, lineHeight: 24, marginBottom: spacing.md },
  banner: { color: colors.danger, fontSize: font.body, fontWeight: font.weightSemi, marginBottom: spacing.md, backgroundColor: '#FFF0F0', borderRadius: 8, padding: spacing.md },
  note: { color: colors.textMuted, fontSize: font.small, marginTop: spacing.md, textAlign: 'center' },
});
