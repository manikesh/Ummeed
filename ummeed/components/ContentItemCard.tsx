import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Card } from './Card';
import { getContentUrlKind, getEmbeddableVideoUrl, getOpenLabel, openContentUrl } from '../lib/contentMedia';
import type { ContentItem } from '../lib/types';
import { colors, font, spacing } from '../theme';

interface Props {
  item: ContentItem;
  subtitle?: string;
  children?: React.ReactNode;
  testID?: string;
}

export function ContentItemCard({ item, subtitle, children, testID }: Props) {
  return (
    <Card
      title={item.title}
      subtitle={subtitle ?? item.category.replace('_', ' ')}
      testID={testID}
    >
      {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
      {item.phone ? (
        <Button
          title={`Call ${item.phone}`}
          variant="secondary"
          onPress={() => openContentUrl(`tel:${item.phone}`)}
          testID={testID ? `${testID}-call` : undefined}
        />
      ) : null}
      {item.url ? <ContentMedia url={item.url} testID={testID} /> : null}
      {!item.url && item.category === 'video' ? (
        <Text style={styles.missingMedia}>No video link or uploaded video file is attached.</Text>
      ) : null}
      {children}
    </Card>
  );
}

function ContentMedia({ url, testID }: { url: string; testID?: string }) {
  const kind = getContentUrlKind(url);
  const embedUrl = kind === 'video' ? getEmbeddableVideoUrl(url) : null;

  return (
    <View style={styles.mediaWrap}>
      {kind === 'image' ? (
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="cover"
          testID={testID ? `${testID}-image` : undefined}
        />
      ) : null}
      {kind === 'video' && Platform.OS === 'web' ? (
        embedUrl
          ? React.createElement('iframe', {
              src: embedUrl,
              title: 'Video player',
              allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
              allowFullScreen: true,
              style: styles.webVideo,
              'data-testid': testID ? `${testID}-video` : undefined,
            })
          : React.createElement('video', {
              src: url,
              controls: true,
              style: styles.webVideo,
              'data-testid': testID ? `${testID}-video` : undefined,
            })
      ) : null}
      {kind !== 'image' && !(kind === 'video' && Platform.OS === 'web') ? (
        <Pressable onPress={() => openContentUrl(url)} testID={testID ? `${testID}-attachment` : undefined}>
          <Text style={styles.attachment}>
          {kind === 'video' ? 'Video attached' : kind === 'document' ? 'File attached' : 'External link'}
          </Text>
        </Pressable>
      ) : null}
      <Pressable onPress={() => openContentUrl(url)} testID={testID ? `${testID}-url-text` : undefined}>
        <Text style={styles.url} numberOfLines={2}>{url}</Text>
      </Pressable>
      <Button
        title={getOpenLabel(url)}
        variant="ghost"
        onPress={() => openContentUrl(url)}
        testID={testID ? `${testID}-url` : undefined}
        style={styles.openButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.text, fontSize: font.body, lineHeight: 26, marginBottom: spacing.sm },
  mediaWrap: { marginTop: spacing.sm },
  image: { width: '100%', height: 220, borderRadius: 8, backgroundColor: colors.surfaceAlt, marginBottom: spacing.sm },
  webVideo: { width: '100%', maxHeight: 280, borderRadius: 8, marginBottom: spacing.sm },
  attachment: { color: colors.text, fontSize: font.body, fontWeight: font.weightSemi, marginBottom: spacing.xs },
  url: { color: colors.textMuted, fontSize: font.small, marginBottom: spacing.sm },
  missingMedia: { color: colors.warning, fontSize: font.small, fontWeight: font.weightSemi, marginBottom: spacing.sm },
  openButton: { marginTop: spacing.xs },
});
