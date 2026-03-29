"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const STORAGE_KEY = 'jb3_executive_tasks';
const safeStorageGet = (key) => {
    try {
        return localStorage.getItem(key);
    }
    catch (error) {
        console.warn(`Task storage read failed for ${key}:`, error);
        return null;
    }
};
const safeStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, value);
    }
    catch (error) {
        console.warn(`Task storage write failed for ${key}:`, error);
    }
};
const safeStorageRemove = (key) => {
    try {
        localStorage.removeItem(key);
    }
    catch (error) {
        console.warn(`Task storage remove failed for ${key}:`, error);
    }
};
const safeParseTasks = (raw) => {
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (error) {
        console.warn('Stored task data was invalid JSON. Resetting to an empty list.', error);
        return [];
    }
};
exports.taskService = {
    getTasks: () => {
        if (typeof window === 'undefined')
            return [];
        return safeParseTasks(safeStorageGet(STORAGE_KEY));
    },
    addTask: (task) => {
        const tasks = exports.taskService.getTasks();
        tasks.unshift(task);
        safeStorageSet(STORAGE_KEY, JSON.stringify(tasks));
    },
    resolveTask: (id) => {
        const tasks = exports.taskService.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index].isResolved = true;
            safeStorageSet(STORAGE_KEY, JSON.stringify(tasks));
        }
    },
    deleteTask: (id) => {
        const tasks = exports.taskService.getTasks().filter(t => t.id !== id);
        safeStorageSet(STORAGE_KEY, JSON.stringify(tasks));
    },
    clear: () => {
        safeStorageRemove(STORAGE_KEY);
    }
};
