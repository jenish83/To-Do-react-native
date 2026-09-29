import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, radius } from '../theme';
import { formatDateTime } from '../utils/date';

interface Props {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

// Shows the chosen date-time. Tapping opens the Android date picker,
// and after a date is picked, the time picker opens.
export default function DateTimeField({ label, value, onChange }: Props) {
  const openPicker = () => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onChange: (event, pickedDate) => {
        if (event.type !== 'set' || !pickedDate) return; // user cancelled
        // The date dialog has to close before Android will show the time dialog.
        setTimeout(() => {
          DateTimePickerAndroid.open({
            value: pickedDate,
            mode: 'time',
            onChange: (timeEvent, pickedTime) => {
              if (timeEvent.type !== 'set' || !pickedTime) return;
              const merged = new Date(pickedDate);
              merged.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
              onChange(merged);
            },
          });
        }, 200);
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} onPress={openPicker} activeOpacity={0.7}>
        <Text style={styles.value}>{formatDateTime(value)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  field: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  value: { fontSize: 15, color: colors.text },
});
