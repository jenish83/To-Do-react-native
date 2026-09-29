import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { NewTask, Task } from '../types';
import {
  createTaskRequest,
  deleteTaskRequest,
  fetchTasksRequest,
  updateTaskRequest,
} from '../api/taskApi';
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

  // Clear the list when the user changes (logout / another account logs in)
  useEffect(() => {
    requestGen.current += 1;
    setTasks([]);
    setLoading(false);
  }, [user?.id]);

  // Errors are thrown so the screen can show a message (Alert) to the user.
  const fetchTasks = async () => {
    const gen = ++requestGen.current;
    const owner = userIdRef.current;
    setLoading(true);
    try {
      const data = await fetchTasksRequest();
      if (gen !== requestGen.current || userIdRef.current !== owner) return;
      setTasks(data);
    } finally {
      if (gen === requestGen.current) setLoading(false);
    }
  };

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
