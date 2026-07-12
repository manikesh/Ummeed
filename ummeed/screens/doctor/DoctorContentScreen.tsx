import React from 'react';
import { ContentManager } from '../../components/ContentManager';
import { Screen } from '../../components/Screen';
import type { ContentItem } from '../../lib/types';

const DOCTOR_CATEGORIES: ContentItem['category'][] = [
  'first_aid',
  'remedy',
  'news',
  'video',
];

export function DoctorContentScreen() {
  return (
    <Screen title="Manage Content" subtitle="Publish medical first-aid, remedies, news and videos.">
      <ContentManager allowedCategories={DOCTOR_CATEGORIES} canModerateAll={false} />
    </Screen>
  );
}
