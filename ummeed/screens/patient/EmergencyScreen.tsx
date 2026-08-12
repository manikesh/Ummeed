import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ContentItemCard } from '../../components/ContentItemCard';
import { Screen } from '../../components/Screen';
import { openContentUrl } from '../../lib/contentMedia';
import { supabase } from '../../lib/supabase';
import type { ContentItem } from '../../lib/types';
import { colors, font, spacing } from '../../theme';

const TABS = [
  { key: 'helpline', label: 'Helplines' },
  { key: 'first_aid', label: 'First aid' },
  { key: 'remedy', label: 'Home care' },
  { key: 'scheme', label: 'Govt schemes' },
  { key: 'news', label: 'News' },
  { key: 'video', label: 'Videos' },
] as const;

type Tab = (typeof TABS)[number]['key'];

export function EmergencyScreen() {
  const [tab, setTab] = useState<Tab>('helpline');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('category', tab)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      setLoading(false);
      if (error) {
        Alert.alert('Load error', error.message);
        return;
      }
      setItems((data as ContentItem[]) ?? []);
    };
    load();
  }, [tab]);

  return (
    <Screen title="Emergency & support" subtitle="If life is in danger, call 1075 right now.">
      <Card
        tone="danger"
        title="🚨 Burn helpline: 1075"
        subtitle="24x7 National Burn Helpline (India)"
        onPress={() => openContentUrl('tel:1075')}
        testID="em-call-1075"
      />

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            title={t.label}
            variant={tab === t.key ? 'primary' : 'ghost'}
            fullWidth={false}
            style={{ marginRight: spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.md }}
            onPress={() => setTab(t.key)}
            testID={`em-tab-${t.key}`}
          />
        ))}
      </View>

      {loading ? <Text style={styles.muted}>Loading…</Text> : null}
      {!loading && items.length === 0 ? (
        <Text style={styles.muted}>Nothing here yet.</Text>
      ) : null}

      {items.map((it) => (
        <ContentItemCard key={it.id} item={it} testID={`em-item-${it.id}`} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, marginBottom: spacing.sm },
  muted: { color: colors.textMuted, fontSize: font.body, fontStyle: 'italic' },
});
