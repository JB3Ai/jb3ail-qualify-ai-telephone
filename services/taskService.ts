import { ExecutiveTask } from '../types';

const STORAGE_KEY = 'jb3_executive_tasks';

const safeStorageGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Task storage read failed for ${key}:`, error);
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Task storage write failed for ${key}:`, error);
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Task storage remove failed for ${key}:`, error);
  }
};

const safeParseTasks = (raw: string | null): ExecutiveTask[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Stored task data was invalid JSON. Resetting to an empty list.', error);
    return [];
  }
};

export const taskService = {
  getTasks: (): ExecutiveTask[] => {
    if (typeof window === 'undefined') return [];
    return safeParseTasks(safeStorageGet(STORAGE_KEY));
  },

  addTask: (task: ExecutiveTask) => {
    const tasks = taskService.getTasks();
    tasks.unshift(task);
    safeStorageSet(STORAGE_KEY, JSON.stringify(tasks));
  },

  resolveTask: (id: string) => {
    const tasks = taskService.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index].isResolved = true;
      safeStorageSet(STORAGE_KEY, JSON.stringify(tasks));
    }
  },

  deleteTask: (id: string) => {
    const tasks = taskService.getTasks().filter(t => t.id !== id);
    safeStorageSet(STORAGE_KEY, JSON.stringify(tasks));
  },

  clear: () => {
    safeStorageRemove(STORAGE_KEY);
  }
};
