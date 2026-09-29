import { Task } from '../types';

export type SortMode = 'smart' | 'deadline' | 'priority' | 'newest';
export type FilterMode = 'all' | 'pending' | 'completed';

const PRIORITY_WEIGHT = { low: 1, medium: 2, high: 3 };

// "Smart" score: mixes priority and how close the deadline is.
// Higher score = should be done sooner.
function urgencyScore(task: Task): number {
  const hoursLeft = (new Date(task.deadline).getTime() - Date.now()) / 36e5;
  let urgency = 0;
  if (hoursLeft < 0) urgency = 30; // overdue
  else if (hoursLeft <= 24) urgency = 20; // due within a day
  else if (hoursLeft <= 72) urgency = 10; // due within 3 days
  return PRIORITY_WEIGHT[task.priority] * 10 + urgency;
}

export function filterTasks(tasks: Task[], filter: FilterMode): Task[] {
  if (filter === 'pending') return tasks.filter((t) => !t.completed);
  if (filter === 'completed') return tasks.filter((t) => t.completed);
  return tasks;
}

// Returns a NEW sorted array (we never change the original state directly).
export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const list = [...tasks];
  const byDeadline = (a: Task, b: Task) =>
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime();

  switch (mode) {
    case 'deadline':
      return list.sort(byDeadline);
    case 'priority':
      return list.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
    case 'newest':
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    default: // 'smart': unfinished first, then highest score, then earliest deadline
      return list.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const diff = urgencyScore(b) - urgencyScore(a);
        return diff !== 0 ? diff : byDeadline(a, b);
      });
  }
}
