import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { Header } from './Header';

interface Props {
  title: string;
  subtitle?: string;
  rightAction?: { label: string; onPress: () => void };
  children: React.ReactNode;
  scroll?: boolean;
  hideBack?: boolean;
  testID?: string;
}

export function Screen({ title, subtitle, rightAction, children, scroll = true, hideBack, testID }: Props) {
  const Body: any = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: styles.body, keyboardShouldPersistTaps: 'handled' as const }
    : { style: styles.body };
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']} testID={testID}>
      <Header title={title} subtitle={subtitle} rightAction={rightAction} hideBack={hideBack} />
      <Body {...bodyProps}>{children}</Body>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, paddingTop: spacing.sm },
});
