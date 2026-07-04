import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  testID?: string;
}

const toDate = (value: string) => {
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DateInput({ label, value, onChange, maximumDate, testID }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        {React.createElement('input', {
          type: 'date',
          value,
          max: maximumDate ? formatDate(maximumDate) : undefined,
          onChange: (event: any) => onChange(event.target.value),
          'data-testid': testID,
          style: webInputStyle,
        })}
      </View>
    );
  }

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'set' && selected) onChange(formatDate(selected));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setShowPicker(true)} testID={testID} accessibilityRole="button">
        <Text style={value ? styles.value : styles.placeholder}>{value || 'Select date'}</Text>
        <Text style={styles.calendar}>📅</Text>
      </Pressable>
      {showPicker ? (
        <DateTimePicker value={toDate(value)} mode="date" display="default" maximumDate={maximumDate} onChange={handleChange} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: spacing.md },
  label: { color: colors.text, fontSize: font.body, fontWeight: font.weightSemi, marginBottom: spacing.xs + 2 },
  input: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { color: colors.text, fontSize: font.body },
  placeholder: { color: colors.textMuted, fontSize: font.body },
  calendar: { fontSize: 22 },
});

const webInputStyle: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 56,
  padding: 16,
  border: `2px solid ${colors.border}`,
  borderRadius: radius.md,
  backgroundColor: colors.surface,
  color: colors.text,
  fontSize: font.body,
  fontFamily: 'inherit',
};
