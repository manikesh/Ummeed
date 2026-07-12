import React from 'react';
import { ContentManager } from '../../components/ContentManager';
import { Screen } from '../../components/Screen';
import type { ContentItem } from '../../lib/types';

const ALL_CATEGORIES: ContentItem['category'][] = [
  'first_aid',
  'remedy',
  'news',
  'scheme',
  'helpline',
  'video',
];

export function AdminContentScreen() {
  return (
    <Screen title="Content" subtitle="Manage first-aid, helplines, schemes, news.">
      <ContentManager allowedCategories={ALL_CATEGORIES} canModerateAll={true} />
    </Screen>
  );
}
