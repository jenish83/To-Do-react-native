import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Task } from '../types';
import { colors, radius } from '../theme';
import { formatDateTime, isOverdue } from '../utils/date';

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

// One card in the list
export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const overdue = !task.completed && isOverdue(task.deadline);

  // Ask before deleting
  const confirmDelete = () => {
    Alert.alert('Delete task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task._id) },
    ]);
  };

  return (
    <View style={[styles.card, task.completed && styles.cardDone]}>
      {/* Round checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, task.completed && styles.checkboxDone]}
        onPress={() => onToggle(task)}>
        {task.completed ? <Text style={styles.tick}>✓</Text> : null}
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, task.completed && styles.titleDone]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.priority[task.priority] }]}>
            <Text style={styles.badgeText}>{task.priority.toUpperCase()}</Text>
          </View>
        </View>

        {task.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        <Text style={styles.meta}>Planned: {formatDateTime(task.dateTime)}</Text>
        <Text style={[styles.meta, overdue && styles.overdue]}>
          Deadline: {formatDateTime(task.deadline)}
          {overdue ? '  (Overdue)' : ''}
        </Text>
        <Text style={[styles.status, { color: task.completed ? colors.success : colors.muted }]}>
          {task.completed ? 'Completed' : 'Pending'}
        </Text>
      </View>

      <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={styles.delete}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    marginBottom: 12,
    elevation: 2, // Android shadow
  },
  cardDone: { opacity: 0.65 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },
  tick: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, marginRight: 8 },
  titleDone: { textDecorationLine: 'line-through', color: colors.muted },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  description: { fontSize: 13, color: colors.muted, marginTop: 4 },
  meta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  overdue: { color: colors.danger, fontWeight: '600' },
  status: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  delete: { fontSize: 20, marginLeft: 8 },
});
