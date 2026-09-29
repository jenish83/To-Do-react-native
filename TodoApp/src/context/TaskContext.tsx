import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { NewTask, Task } from '../types';
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchTasksRequest,
  updateTaskRequest,
} from '../api/taskApi';
import { getErrorMessage, isSessionExpired } from '../utils/errors';
import { useAuth } from './AuthContext';

interface TaskContextValue {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: NewTask) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  // Drops responses that finish after logout or after a newer request started.
  const requestGen = useRef(0);
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;
  const toggling = useRef(new Set<string>());

  // Errors are thrown so the screen can show a message (Alert) to the user.
  const fetchTasks = async () => {
    const gen = ++requestGen.current;
    const owner = userIdRef.current;
    if (!owner) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchTasksRequest();
      if (gen !== requestGen.current || userIdRef.current !== owner) return;
      setTasks(data);
    } catch (err) {
      if (gen !== requestGen.current || userIdRef.current !== owner) return;
      throw err;
    } finally {
      if (gen === requestGen.current) setLoading(false);
    }
  };

  // Load this user's tasks after login. Fetching here, after the user id is
  // set, keeps the response. A fetch started from the screen was cancelled
  // by the logout/login reset, so the list stayed empty until a manual refresh.
  useEffect(() => {
    if (!user?.id) {
      requestGen.current += 1;
      setTasks([]);
      setLoading(false);
      return;
    }
    fetchTasks().catch((err) => {
      if (isSessionExpired(err)) return;
      Alert.alert('Could not load tasks', getErrorMessage(err));
    });
    // fetchTasks is recreated each render and only uses refs plus setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addTask = async (task: NewTask) => {
    const owner = userIdRef.current;
    const created = await createTaskRequest(task);
    if (userIdRef.current !== owner) return;
    setTasks((prev) => [created, ...prev]); // add to the top of the list
  };

  // Flip completed <-> not completed. Ignore a second tap while the first is saving.
  const toggleTask = async (task: Task) => {
    if (toggling.current.has(task._id)) return;
    toggling.current.add(task._id);
    const owner = userIdRef.current;
    try {
      const updated = await updateTaskRequest(task._id, { completed: !task.completed });
      if (userIdRef.current !== owner) return;
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } finally {
      toggling.current.delete(task._id);
    }
  };

  const removeTask = async (id: string) => {
    const owner = userIdRef.current;
    await deleteTaskRequest(id);
    if (userIdRef.current !== owner) return;
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, fetchTasks, addTask, toggleTask, removeTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used inside TaskProvider');
  return ctx;
}
