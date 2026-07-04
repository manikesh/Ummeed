import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { MedicalRecord } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

export function MedicalRecordsScreen() {
  const { profile } = useAuth();
  const [list, setList] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }
    setList((data as MedicalRecord[]) ?? []);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const addTextOnly = async () => {
    if (!profile) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please give the record a title.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('medical_records').insert({
      patient_id: profile.id,
      created_by: profile.id,
      title,
      notes: notes || null,
    });
    setBusy(false);
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    setTitle('');
    setNotes('');
    Alert.alert('Saved successfully', 'Your medical record data was saved successfully.');
    load();
  };

  const uploadAsset = async (uri: string, name: string, mime: string) => {
    if (!profile) return;
    const path = `${profile.id}/${Date.now()}-${name}`;
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const { error: upErr } = await supabase.storage
      .from('medical_records')
      .upload(path, blob, { contentType: mime, upsert: false });
    if (upErr) {
      Alert.alert('Upload error', upErr.message);
      return;
    }
    const { error } = await supabase.from('medical_records').insert({
      patient_id: profile.id,
      created_by: profile.id,
      title: title || name,
      notes: notes || null,
      file_path: path,
      mime_type: mime,
    });
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    setTitle('');
    setNotes('');
    Alert.alert('Saved successfully', 'Your medical record data was saved successfully.');
    load();
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setBusy(true);
    await uploadAsset(a.uri, a.fileName ?? `photo-${Date.now()}.jpg`, a.mimeType ?? 'image/jpeg');
    setBusy(false);
  };

  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled) return;
    const a = res.assets[0];
    setBusy(true);
    await uploadAsset(a.uri, a.name, a.mimeType ?? 'application/octet-stream');
    setBusy(false);
  };

  const del = async (rec: MedicalRecord) => {
    if (rec.file_path) {
      await supabase.storage.from('medical_records').remove([rec.file_path]);
    }
    const { error } = await supabase.from('medical_records').delete().eq('id', rec.id);
    if (error) {
      Alert.alert('Delete error', error.message);
      return;
    }
    load();
  };

  return (
    <Screen title="Medical records" subtitle="Upload reports, prescriptions or photos.">
      <Input label="Record title" value={title} onChangeText={setTitle} placeholder="e.g. Discharge summary" testID="mr-title" />
      <Input
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Doctor's name, hospital…"
        multiline
        numberOfLines={3}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
        testID="mr-notes"
      />
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Button title="Add note only" onPress={addTextOnly} loading={busy} variant="ghost" testID="mr-add-note" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Button title="📷 Photo" onPress={pickImage} loading={busy} variant="secondary" testID="mr-photo" />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Button title="📄 File" onPress={pickDoc} loading={busy} variant="secondary" testID="mr-file" />
        </View>
      </View>

      <View style={{ height: spacing.lg }} />
      <Text style={styles.section}>My records {loading ? '…' : `(${list.length})`}</Text>
      {list.length === 0 && !loading ? (
        <Text style={styles.empty}>No records yet. Start by adding one above.</Text>
      ) : null}
      {list.map((r) => (
        <Card
          key={r.id}
          title={r.title}
          subtitle={`${r.mime_type ?? 'note'}  •  ${new Date(r.created_at).toLocaleDateString()}`}
          testID={`mr-item-${r.id}`}
        >
          {r.notes ? <Text style={styles.body}>{r.notes}</Text> : null}
          {r.file_path ? <Text style={styles.path} numberOfLines={1}>{r.file_path}</Text> : null}
          <View style={{ height: spacing.sm }} />
          <Button title="Delete" variant="danger" fullWidth={false} onPress={() => del(r)} testID={`mr-del-${r.id}`} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.sm },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic' },
  body: { color: colors.text, fontSize: font.body, marginBottom: spacing.sm },
  path: { color: colors.textMuted, fontSize: font.small },
});
