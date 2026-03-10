"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const STORAGE_KEY = 'jb3_executive_tasks';
exports.taskService = {
    getTasks: () => {
        if (typeof window === 'undefined')
            return [];
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    addTask: (task) => {
        const tasks = exports.taskService.getTasks();
        tasks.unshift(task);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    },
    resolveTask: (id) => {
        const tasks = exports.taskService.getTasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            tasks[index].isResolved = true;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        }
    },
    deleteTask: (id) => {
        const tasks = exports.taskService.getTasks().filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    },
    clear: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
