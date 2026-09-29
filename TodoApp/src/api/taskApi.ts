import client from './client';
import { NewTask, Task } from '../types';

export async function fetchTasksRequest(): Promise<Task[]> {
  const res = await client.get('/tasks');
  return res.data.tasks;
}

export async function createTaskRequest(task: NewTask): Promise<Task> {
  const res = await client.post('/tasks', task);
  return res.data.task;
}

// Sends only the fields we want to change, e.g. { completed: true }
export async function updateTaskRequest(id: string, changes: Partial<Task>): Promise<Task> {
  const res = await client.put(`/tasks/${id}`, changes);
  return res.data.task;
}

export async function deleteTaskRequest(id: string): Promise<void> {
  await client.delete(`/tasks/${id}`);
}
