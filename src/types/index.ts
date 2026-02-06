export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'done';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Task {
    id?: number;
    title: string;
    description?: string;
    deadline?: Date;
    subject?: string; // Optional subject association
    priority: Priority;
    status: TaskStatus;
    createdAt: Date;
}

export interface Habit {
    id?: number;
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly';
    category?: string;
    goal?: number; // Target completions per frequency
    streak: number;
    completedDates: string[]; // ISO date strings YYYY-MM-DD
    color?: string;
    createdAt: Date;
}

export interface TimetableEntry {
    id?: number;
    day: DayOfWeek;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    subject: string;
    location?: string;
    color?: string;
}

export interface StudySession {
    id?: number;
    duration: number; // in seconds
    timestamp: Date;
    tag?: string; // e.g., 'Math', 'Coding'
}

export interface Quote {
    text: string;
    author: string;
    category?: string;
}

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}
export interface Grade {
    id?: number;
    subject: string;
    score: number;
    maxScore: number;
    date: Date;
    type: 'Exam' | 'Assignment' | 'Quiz' | 'Other';
    weight?: number; // e.g., 0.2 for 20%
}

export interface Note {
    id?: number;
    title: string;
    content: string; // Markdown content
    subject: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Project {
    id?: number;
    title: string;
    description?: string;
    status: 'backlog' | 'active' | 'completed';
    progress: number; // 0-100
    createdAt: Date;
    deadline?: Date;
}

export interface UserProfile {
    id?: number;
    name: string;
    xp: number;
    level: number;
    streak: number;
    lastActive: Date;
    settings: {
        theme: 'light' | 'dark' | 'glass';
        voiceEnabled: boolean;
        assistantName: string;
    };
}
