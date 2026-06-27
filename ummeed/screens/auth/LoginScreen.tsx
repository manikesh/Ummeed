import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { isValidPhone, normalizePhone, useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import type { AppRole } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

const ROLE_LABEL: Record<AppRole, string> = {
  patient: 'Patient / Survivor',
  doctor: 'Doctor',
  ngo: 'NGO / Caregiver / Volunteer',
  counselor: 'Counselor',
  legal_aid: 'Legal Aid',
  volunteer: 'Volunteer',
  admin: 'Admin',
};

export function LoginScreen({ intendedRole }: { intendedRole: AppRole }) {
  const { sendOtp } = useAuth();
  const { push } = useNav();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSend = async () => {
    setErr(null);
    if (!fullName.trim()) {
      setErr('Please enter your full name.');
      return;
    }
    if (!isValidPhone(phone)) {
      setErr('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    const normalized = normalizePhone(phone);
    setLoading(true);
    try {
      await sendOtp(normalized, intendedRole, fullName);
      Alert.alert('Dev mode', 'OTP delivery is bypassed. Use code 123456 on the next screen to sign in.');
      push({ name: 'otp', phone: normalized, intendedRole });
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Sign in" subtitle={`Signing in as: ${ROLE_LABEL[intendedRole]}`}>
      <Text style={styles.help}>
        We will send a 6-digit code to your mobile number. No password needed.
      </Text>
      <View style={{ height: spacing.md }} />

      <Input
        label="Full name"
        placeholder="e.g. Ankita Sharma"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        testID="login-name"
      />
      <Input
        label="Mobile number"
        placeholder="10-digit mobile (e.g. 9876543210)"
        value={phone}
        onChangeText={(t) => setPhone(t.replace(/[^\d]/g, '').slice(0, 10))}
        keyboardType="number-pad"
        autoComplete="tel"
        maxLength={10}
        hint="We only support Indian (+91) numbers for now."
        testID="login-phone"
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <View style={{ height: spacing.sm }} />
      <Button title="Send code" onPress={onSend} loading={loading} testID="login-send" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  help: { color: colors.textMuted, fontSize: font.body, lineHeight: 24 },
  err: { color: colors.danger, fontSize: font.body, marginBottom: spacing.sm, fontWeight: font.weightSemi },
});
