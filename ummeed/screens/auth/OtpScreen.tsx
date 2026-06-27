import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import type { AppRole } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

export function OtpScreen({ phone, intendedRole }: { phone: string; intendedRole: AppRole }) {
  const { verifyOtp, sendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const display = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;

  const onVerify = async () => {
    setErr(null);
    setInfo(null);
    if (code.length < 6) {
      setErr('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(phone, code);
      // RootNavigator switches screens after session is set.
    } catch (e: any) {
      setErr(e?.message ?? 'Invalid or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setErr(null);
    setInfo(null);
    setResending(true);
    try {
      await sendOtp(phone, intendedRole);
      setInfo('Dev mode: the code is 123456.');
    } catch (e: any) {
      setErr(e?.message ?? 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen title="Enter your code" subtitle={`Dev mode: enter 123456 to sign in as ${display}`}>
      <Input
        label="6-digit code"
        placeholder="123456"
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        testID="otp-input"
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}
      <View style={{ height: spacing.sm }} />
      <Button title="Verify and continue" onPress={onVerify} loading={loading} testID="otp-verify" />
      <View style={{ height: spacing.md }} />
      <Button title="Resend code" variant="ghost" onPress={onResend} loading={resending} testID="otp-resend" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  err: { color: colors.danger, fontSize: font.body, marginBottom: spacing.sm, fontWeight: font.weightSemi },
  info: { color: colors.success, fontSize: font.body, marginBottom: spacing.sm, fontWeight: font.weightSemi },
});
