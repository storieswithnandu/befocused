import { Task, Habit, TimetableEntry, Grade } from '../types';

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers,
        },
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `API Error (${response.status})` }));
        throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
};

export const api = {
    // TASKS
    tasks: {
        list: () => fetchWithAuth('/api/tasks'),
        create: (task: Partial<Task>) => fetchWithAuth('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(task),
        }),
        update: (id: number, updates: Partial<Task>) => fetchWithAuth('/api/tasks', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        }),
        delete: (id: number) => fetchWithAuth(`/api/tasks?id=${id}`, {
            method: 'DELETE',
        }),
    },

    // HABITS
    habits: {
        list: () => fetchWithAuth('/api/habits'),
        create: (habit: Partial<Habit>) => fetchWithAuth('/api/habits', {
            method: 'POST',
            body: JSON.stringify(habit),
        }),
        update: (id: number, updates: Partial<Habit>) => fetchWithAuth('/api/habits', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        }),
        delete: (id: number) => fetchWithAuth(`/api/habits?id=${id}`, {
            method: 'DELETE',
        }),
    },

    // TIMETABLE
    timetable: {
        list: () => fetchWithAuth('/api/timetable'),
        create: (entry: Partial<TimetableEntry>) => fetchWithAuth('/api/timetable', {
            method: 'POST',
            body: JSON.stringify(entry),
        }),
        update: (id: number, updates: Partial<TimetableEntry>) => fetchWithAuth('/api/timetable', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        }),
        delete: (id: number) => fetchWithAuth(`/api/timetable?id=${id}`, {
            method: 'DELETE',
        }),
    },

    // GRADES / ACHIEVEMENTS
    grades: {
        list: () => fetchWithAuth('/api/grades'),
        create: (grade: Partial<Grade>) => fetchWithAuth('/api/grades', {
            method: 'POST',
            body: JSON.stringify(grade),
        }),
        update: (id: number, updates: Partial<Grade>) => fetchWithAuth('/api/grades', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        }),
        delete: (id: number) => fetchWithAuth(`/api/grades?id=${id}`, {
            method: 'DELETE',
        }),
    },

    // UTILS
    migrate: () => fetch('/api/migrate').then(res => res.json()),

    // TODOS
    todos: {
        list: () => fetchWithAuth('/api/todos'),
        create: (todo: { title: string; completed?: boolean }) => fetchWithAuth('/api/todos', {
            method: 'POST',
            body: JSON.stringify(todo),
        }),
        update: (id: number, updates: { title?: string; completed?: boolean }) => fetchWithAuth('/api/todos', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        }),
        delete: (id: number) => fetchWithAuth(`/api/todos?id=${id}`, {
            method: 'DELETE',
        }),
    },
};
