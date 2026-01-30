
import { ExecutiveTask } from '../types';

const STORAGE_KEY = 'jb3_executive_tasks';

export const taskService = {
  getTasks: (): ExecutiveTask[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  addTask: (task: ExecutiveTask) => {
    const tasks = taskService.getTasks();
    tasks.unshift(task);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  resolveTask: (id: string) => {
    const tasks = taskService.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index].isResolved = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  },

  deleteTask: (id: string) => {
    const tasks = taskService.getTasks().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
