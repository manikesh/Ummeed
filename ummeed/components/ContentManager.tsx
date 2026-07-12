import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { MediaUploader } from './MediaUploader';
import { SuccessMessage } from './SuccessMessage';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { ContentItem } from '../lib/types';
import { colors, font, spacing } from '../theme';

interface Props {
  allowedCategories: ContentItem['category'][];
  canModerateAll?: boolean;
}

const NON_ADMIN_UPLOAD_SUCCESS = 'Your content is successfully uploaded, it will be published in 3hrs.';

export function ContentManager({ allowedCategories, canModerateAll = false }: Props) {
  const { profile } = useAuth();
  const [list, setList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ContentItem['category']>(allowedCategories[0] || 'helpline');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [phone, setPhone] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [hasSubmitError, setHasSubmitError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('content_items').select('*');
    
    // Non-admin content creators can view all published content + any unpublished content they created themselves
    if (!canModerateAll && profile) {
      query = query.or(`is_published.eq.true,created_by.eq.${profile.id}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }
    setList((data as ContentItem[]) ?? []);
  }, [canModerateAll, profile]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!profile) return;
    setSuccess(null);
    setErrors({});
    setHasSubmitError(false);

    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const errs: { title?: string; body?: string } = {};

    if (!cleanTitle) {
      errs.title = 'Title is required.';
    } else if (cleanTitle.length < 10) {
      errs.title = 'Title must be at least 10 characters.';
    }

    if (!cleanBody) {
      errs.body = 'Body is required.';
    } else if (cleanBody.length < 20) {
      errs.body = 'Body must be at least 20 characters.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setHasSubmitError(true);
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('content_items').insert({
      category,
      title: cleanTitle,
      body: cleanBody || null,
      phone: phone || null,
      url: url || null,
      is_published: canModerateAll, // Non-admins require admin approval
      created_by: profile.id,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Save error', error.message);
      return;
    }
    setTitle('');
    setBody('');
    setPhone('');
    setUrl('');
    setSuccess(
      canModerateAll
        ? 'The content data was saved successfully.'
        : NON_ADMIN_UPLOAD_SUCCESS
    );
    load();
  };

  const togglePublish = async (c: ContentItem) => {
    setSuccess(null);
    const { error } = await supabase
      .from('content_items')
      .update({ is_published: !c.is_published })
      .eq('id', c.id);
    if (error) {
      Alert.alert('Update error', error.message);
      return;
    }
    setSuccess(`Content ${c.is_published ? 'unpublished' : 'published'} successfully.`);
    load();
  };

  const remove = async (c: ContentItem) => {
    const { error } = await supabase.from('content_items').delete().eq('id', c.id);
    if (error) {
      Alert.alert('Delete error', error.message);
      return;
    }
    load();
  };

  const handleUploadSuccess = (mediaUrl: string) => {
    setUrl(mediaUrl);
    setSuccess('Media uploaded and link attached successfully.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.section}>Add new content</Text>
      <View style={styles.tabs}>
        {allowedCategories.map((c) => (
          <Button
            key={c}
            title={c.replace('_', ' ')}
            fullWidth={false}
            variant={category === c ? 'primary' : 'ghost'}
            style={{ marginRight: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md }}
            onPress={() => setCategory(c)}
            testID={`cnt-cat-${c}`}
          />
        ))}
      </View>
      {hasSubmitError && (
        <Text style={styles.banner}>⚠️ Please fix the errors before proceeding.</Text>
      )}
      <Input
        label="Title"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setErrors((prev) => ({ ...prev, title: undefined }));
        }}
        placeholder="Title (min 10 characters)"
        error={errors.title}
        testID="cnt-title"
      />
      <Input
        label="Body"
        value={body}
        onChangeText={(value) => {
          setBody(value);
          setErrors((prev) => ({ ...prev, body: undefined }));
        }}
        placeholder="Content details/instructions (min 20 characters)..."
        multiline
        numberOfLines={4}
        error={errors.body}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        testID="cnt-body"
      />
      {category === 'helpline' && (
        <Input label="Phone (for helplines)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="cnt-phone" />
      )}
      
      {/* Media Uploader Component */}
      <MediaUploader
        onUploadSuccess={handleUploadSuccess}
        onUploadStart={() => setIsUploading(true)}
        onUploadEnd={() => setIsUploading(false)}
        label="Attach Media (Image / Video / Document)"
      />

      <Input
        label="URL (auto-filled by upload or YouTube link)"
        value={url}
        onChangeText={setUrl}
        placeholder="https://..."
        autoCapitalize="none"
        testID="cnt-url"
      />

      <SuccessMessage message={success} />
      <Button
        title="Add content"
        onPress={add}
        loading={saving || isUploading}
        variant="secondary"
        testID="cnt-add"
      />

      <View style={{ height: spacing.lg }} />
      <Text style={styles.section}>{loading ? 'Loading…' : `Content list (${list.length})`}</Text>
      {list.length === 0 && !loading && (
        <Text style={styles.empty}>No content items match your view filters.</Text>
      )}
      
      {list.map((c) => {
        const isOwner = Boolean(profile && c.created_by === profile.id);
        const canDelete = canModerateAll || isOwner;
        
        return (
          <Card
            key={c.id}
            title={c.title}
            subtitle={`${c.category.replace('_', ' ')}${c.is_published ? '' : '  •  unpublished'}`}
            testID={`cnt-item-${c.id}`}
          >
            {c.body ? <Text style={styles.body}>{c.body}</Text> : null}
            {c.phone ? <Text style={styles.body}>📞 {c.phone}</Text> : null}
            {c.url ? <Text style={styles.body}>🔗 {c.url}</Text> : null}
            
            {canDelete && (
              <View style={styles.row}>
                {canModerateAll ? (
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Button
                      title={c.is_published ? 'Unpublish' : 'Publish'}
                      variant="ghost"
                      onPress={() => togglePublish(c)}
                      testID={`cnt-pub-${c.id}`}
                    />
                  </View>
                ) : null}
                {canDelete ? (
                  <View style={{ flex: 1, marginLeft: canModerateAll ? spacing.sm : 0 }}>
                    <Button
                      title="Delete"
                      variant="danger"
                      onPress={() => remove(c)}
                      testID={`cnt-del-${c.id}`}
                    />
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    color: colors.danger,
    fontSize: font.body,
    fontWeight: font.weightSemi,
    marginBottom: spacing.md,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: spacing.md,
  },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginBottom: spacing.sm },
  row: { flexDirection: 'row', marginTop: spacing.sm },
  body: { color: colors.text, fontSize: font.body, marginBottom: 2, lineHeight: 24 },
  empty: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic', marginVertical: spacing.md },
});
