import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { ContentItem } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

const CATEGORIES: ContentItem['category'][] = ['first_aid', 'remedy', 'news', 'scheme', 'helpline', 'video'];

export function AdminContentScreen() {
  const { profile } = useAuth();
  const [list, setList] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ContentItem['category']>('helpline');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [phone, setPhone] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('content_items').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert('Load error', error.message);
      return;
    }
    setList((data as ContentItem[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!profile) return;
    if (!title.trim()) {
      Alert.alert('Missing title');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('content_items').insert({
      category,
      title,
      body: body || null,
      phone: phone || null,
      url: url || null,
      is_published: true,
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
    load();
  };

  const togglePublish = async (c: ContentItem) => {
    const { error } = await supabase.from('content_items').update({ is_published: !c.is_published }).eq('id', c.id);
    if (error) {
      Alert.alert('Update error', error.message);
      return;
    }
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

  return (
    <Screen title="Content" subtitle="First aid, helplines, schemes, news.">
      <Text style={styles.section}>Add new</Text>
      <View style={styles.tabs}>
        {CATEGORIES.map((c) => (
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
      <Input label="Title" value={title} onChangeText={setTitle} testID="cnt-title" />
      <Input
        label="Body"
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
        testID="cnt-body"
      />
      <Input label="Phone (for helplines)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="cnt-phone" />
      <Input label="URL (for news / videos / schemes)" value={url} onChangeText={setUrl} autoCapitalize="none" testID="cnt-url" />
      <Button title="Add content" onPress={add} loading={saving} variant="secondary" testID="cnt-add" />

      <View style={{ height: spacing.lg }} />
      <Text style={styles.section}>{loading ? 'Loading…' : `All items (${list.length})`}</Text>
      {list.map((c) => (
        <Card
          key={c.id}
          title={c.title}
          subtitle={`${c.category}${c.is_published ? '' : '  •  unpublished'}`}
          testID={`cnt-item-${c.id}`}
        >
          {c.body ? <Text style={styles.body}>{c.body}</Text> : null}
          {c.phone ? <Text style={styles.body}>📞 {c.phone}</Text> : null}
          {c.url ? <Text style={styles.body}>🔗 {c.url}</Text> : null}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Button title={c.is_published ? 'Unpublish' : 'Publish'} variant="ghost" onPress={() => togglePublish(c)} testID={`cnt-pub-${c.id}`} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Button title="Delete" variant="danger" onPress={() => remove(c)} testID={`cnt-del-${c.id}`} />
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  section: { color: colors.primary, fontSize: font.h3, fontWeight: font.weightBold, marginBottom: spacing.sm },
  row: { flexDirection: 'row', marginTop: spacing.sm },
  body: { color: colors.text, fontSize: font.body, marginBottom: 2, lineHeight: 24 },
});
