export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  dateTime: string; // ISO date string
  deadline: string; // ISO date string
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

// Data the form sends when creating a task
export interface NewTask {
  title: string;
  description: string;
  dateTime: string;
  deadline: string;
  priority: Priority;
}

export interface AuthResponse {
  token: string;
  user: User;
}
