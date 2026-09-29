import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InputField from './InputField';
import DateTimeField from './DateTimeField';
import PriorityPicker from './PriorityPicker';
import AppButton from './AppButton';
import { NewTask, Priority } from '../types';
import { colors } from '../theme';
import { getErrorMessage, isSessionExpired } from '../utils/errors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: NewTask) => Promise<void>;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

// Popup form for creating a new task
export default function TaskFormModal({ visible, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [deadline, setDeadline] = useState(new Date(Date.now() + ONE_DAY));
  const [priority, setPriority] = useState<Priority>('medium');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Put the form back to its starting values
  const reset = () => {
    setTitle('');
    setDescription('');
    setDateTime(new Date());
    setDeadline(new Date(Date.now() + ONE_DAY));
    setPriority('medium');
    setTitleError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setTitleError('Title is required');
      return;
    }
    if (deadline < dateTime) {
      Alert.alert('Invalid dates', 'Deadline cannot be before the task date-time.');
      return;
    }

    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        dateTime: dateTime.toISOString(),
        deadline: deadline.toISOString(),
        priority,
      });
      handleClose();
    } catch (err) {
      if (!isSessionExpired(err)) Alert.alert('Could not save task', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <StatusBar barStyle="dark-content" />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>New Task</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <InputField
            label="Title *"
            placeholder="e.g. Finish assignment"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setTitleError(null);
            }}
            error={titleError}
            maxLength={100}
          />
          <InputField
            label="Description"
            placeholder="Optional details"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.multiline}
            maxLength={500}
          />
          <DateTimeField label="Date & time" value={dateTime} onChange={setDateTime} />
          <DateTimeField label="Deadline" value={deadline} onChange={setDeadline} />
          <PriorityPicker value={priority} onChange={setPriority} />

          <AppButton title="Save Task" onPress={handleSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.card,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  close: { fontSize: 22, color: colors.muted },
  form: { padding: 20 },
  multiline: { height: 80, textAlignVertical: 'top' },
});
