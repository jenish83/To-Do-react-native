import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Priority } from '../types';
import { colors, radius } from '../theme';

const OPTIONS: Priority[] = ['low', 'medium', 'high'];

interface Props {
  value: Priority;
  onChange: (p: Priority) => void;
}

// Three buttons: Low / Medium / High
export default function PriorityPicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {OPTIONS.map((p) => {
          const selected = p === value;
          return (
            <TouchableOpacity
              key={p}
              style={[
                styles.option,
                selected && { backgroundColor: colors.priority[p], borderColor: colors.priority[p] },
              ]}
              onPress={() => onChange(p)}>
              <Text style={[styles.optionText, selected && { color: '#fff' }]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  optionText: { fontSize: 14, fontWeight: '600', color: colors.text },
});
