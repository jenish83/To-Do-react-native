import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import TaskItem from '../components/TaskItem';
import TaskFormModal from '../components/TaskFormModal';
import FilterChips from '../components/FilterChips';
import { Task } from '../types';
import { FilterMode, SortMode, filterTasks, sortTasks } from '../utils/sortTasks';
import { getErrorMessage, isSessionExpired } from '../utils/errors';
import { colors } from '../theme';

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

const SORTS: { value: SortMode; label: string }[] = [
  { value: 'smart', label: 'Smart' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
  { value: 'newest', label: 'Newest' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { tasks, loading, fetchTasks, addTask, toggleTask, removeTask } = useTasks();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('smart');
  const [modalVisible, setModalVisible] = useState(false);

  // Small helper: load tasks and show an alert if it fails
  const loadTasks = async () => {
    try {
      await fetchTasks();
    } catch (err) {
      if (isSessionExpired(err)) return;
      Alert.alert('Could not load tasks', getErrorMessage(err));
    }
  };

  // Load tasks once when the screen opens
  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filter + sort. useMemo avoids recalculating on every render.
  const visibleTasks = useMemo(() => sortTasks(filterTasks(tasks, filter), sort), [tasks, filter, sort]);

  const pendingCount = tasks.filter((t) => !t.completed).length;

  const handleToggle = async (task: Task) => {
    try {
      await toggleTask(task);
    } catch (err) {
      if (isSessionExpired(err)) return;
      Alert.alert('Could not update task', getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeTask(id);
    } catch (err) {
      if (isSessionExpired(err)) return;
      Alert.alert('Could not delete task', getErrorMessage(err));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={modalVisible ? 'dark-content' : 'light-content'} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>My Tasks</Text>
          <Text style={styles.sub} numberOfLines={1}>
            {user?.email} · {pendingCount} pending
          </Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Filter and sort chips */}
      <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />
      <Text style={styles.sortLabel}>Sort by</Text>
      <FilterChips options={SORTS} selected={sort} onSelect={setSort} />

      {/* Task list */}
      {loading && tasks.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={visibleTasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TaskItem task={item} onToggle={handleToggle} onDelete={handleDelete} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + insets.bottom }]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTasks} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>
                {tasks.length === 0 ? 'No tasks yet. Tap + to add one!' : 'No tasks match this filter.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating add button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <TaskFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={addTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 12,
  },
  heading: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: '#D9D9FF', marginTop: 2 },
  logout: { color: '#fff', fontWeight: '700', marginLeft: 12 },
  sortLabel: { fontSize: 12, color: colors.muted, marginLeft: 16, marginTop: 8, marginBottom: 2 },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: colors.muted, marginTop: 8, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 32, marginTop: -2 },
});
