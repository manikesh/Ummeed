import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
import { colors, font, spacing } from '../theme';

interface Props {
  onUploadSuccess: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  bucketName?: string;
  label?: string;
}

export function MediaUploader({
  onUploadSuccess,
  onUploadStart,
  onUploadEnd,
  bucketName = 'content_media',
  label = 'Upload Media Content',
}: Props) {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const uploadAsset = async (uri: string, name: string, mime: string) => {
    try {
      setBusy(true);
      if (onUploadStart) onUploadStart();
      setFileName(name);

      const path = `uploads/${Date.now()}-${name}`;
      const resp = await fetch(uri);
      const blob = await resp.blob();

      const { error: upErr } = await supabase.storage
        .from(bucketName)
        .upload(path, blob, { contentType: mime, upsert: false });

      if (upErr) {
        Alert.alert('Upload error', upErr.message);
        if (onUploadEnd) onUploadEnd();
        setBusy(false);
        setFileName(null);
        return;
      }

      const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
      if (!data?.publicUrl) {
        Alert.alert('URL error', 'Failed to retrieve public URL for uploaded file.');
        if (onUploadEnd) onUploadEnd();
        setBusy(false);
        setFileName(null);
        return;
      }

      onUploadSuccess(data.publicUrl);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message || 'An unknown error occurred.');
    } finally {
      if (onUploadEnd) onUploadEnd();
      setBusy(false);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    await uploadAsset(a.uri, a.fileName ?? `media-${Date.now()}.jpg`, a.mimeType ?? 'image/jpeg');
  };

  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled) return;
    const a = res.assets[0];
    await uploadAsset(a.uri, a.name, a.mimeType ?? 'application/octet-stream');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {fileName && (
        <Text style={styles.fileName} numberOfLines={1}>
          Selected: {fileName} {busy ? '(Uploading...)' : '(Uploaded)'}
        </Text>
      )}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <Button
            title="📷 Photo / Video"
            onPress={pickImage}
            loading={busy}
            variant="secondary"
            testID="mu-photo"
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Button
            title="📄 File"
            onPress={pickDoc}
            loading={busy}
            variant="secondary"
            testID="mu-file"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: font.weightSemi,
    marginBottom: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
  },
  fileName: {
    color: colors.textMuted,
    fontSize: font.small,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
});
