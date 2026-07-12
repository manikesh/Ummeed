import React from 'react';
import { ContentManager } from '../../components/ContentManager';
import { Screen } from '../../components/Screen';
import type { ContentItem } from '../../lib/types';

const INFORMATION_CATEGORIES: ContentItem['category'][] = [
  'first_aid',
  'remedy',
  'news',
  'scheme',
  'helpline',
  'video',
];

export function DoctorContentScreen() {
  return (
    <Screen title="Manage content" subtitle="Add informational content for survivors and care teams.">
      <ContentManager allowedCategories={INFORMATION_CATEGORIES} canModerateAll={false} />
    </Screen>
  );
}
