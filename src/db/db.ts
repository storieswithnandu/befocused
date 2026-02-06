import Dexie, { Table } from 'dexie';
import { Task, Habit, TimetableEntry, StudySession, Grade, Note, Project, UserProfile } from '../types';
import { LearnedPattern } from '../services/aiLearning';

export class ProductivityDB extends Dexie {
    tasks!: Table<Task, number>;
    habits!: Table<Habit, number>;
    timetable!: Table<TimetableEntry, number>;
    studySessions!: Table<StudySession, number>;
    learnedPatterns!: Table<LearnedPattern, number>;
    grades!: Table<Grade, number>;
    notes!: Table<Note, number>;
    projects!: Table<Project, number>;
    userProfile!: Table<UserProfile, number>;

    constructor(userId: string = 'default') {
        super(`ProductivityDB_${userId}`);

        this.version(6).stores({
            tasks: '++id, status, priority, deadline, subject',
            habits: '++id, title, streak, frequency, category',
            timetable: '++id, day, startTime',
            studySessions: '++id, timestamp, subject',
            learnedPatterns: '++id, phrasing, intent',
            grades: '++id, subject, type, date',
            notes: '++id, title, subject, updatedAt',
            projects: '++id, title, status, createdAt',
            userProfile: '++id, name'
        });

        this.tasks = this.table('tasks');
        this.habits = this.table('habits');
        this.timetable = this.table('timetable');
        this.studySessions = this.table('studySessions');
        this.learnedPatterns = this.table('learnedPatterns');
        this.grades = this.table('grades');
        this.notes = this.table('notes');
        this.projects = this.table('projects');
        this.userProfile = this.table('userProfile');
    }

    async populateTimetable() {
        const count = await this.timetable.count();
        if (count > 0) return; // Don't overwrite if data exists

        // Only populate timetable for Nandu's accounts
        // Other users will start with an empty timetable they can customize
        const userJson = localStorage.getItem('auth_user');
        let shouldPopulate = false;

        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                const email = user.email?.toLowerCase();
                // Only populate for Nandu's specific accounts
                if (email === 'storieswithnandu@gmail.com' || email === 'nandujm86@gmail.com') {
                    shouldPopulate = true;
                }
            } catch (e) {
                console.error('Error checking user for timetable population:', e);
            }
        }

        if (!shouldPopulate) {
            console.log('Timetable not populated - user will create their own schedule');
            return;
        }

        await this.timetable.bulkAdd([
            // Monday
            { day: 'Monday', startTime: '08:00', endTime: '09:50', subject: 'Statistical Mechanics', location: 'Classroom' },
            { day: 'Monday', startTime: '10:00', endTime: '10:50', subject: 'Electronics & Instrumentation', location: 'Classroom' },
            { day: 'Monday', startTime: '11:00', endTime: '11:50', subject: 'Atomic & Molecular Physics', location: 'Classroom' },
            { day: 'Monday', startTime: '12:05', endTime: '12:55', subject: 'Humanities', location: 'Course' },
            { day: 'Monday', startTime: '14:00', endTime: '16:45', subject: 'Lab', location: 'Laboratory' },

            // Tuesday
            { day: 'Tuesday', startTime: '08:00', endTime: '09:50', subject: 'Quantum Mechanics II', location: 'Classroom' },

            // Wednesday
            { day: 'Wednesday', startTime: '08:00', endTime: '09:50', subject: 'Quantum Mechanics II', location: 'Classroom' },
            { day: 'Wednesday', startTime: '10:00', endTime: '11:50', subject: 'Statistical Mechanics', location: 'Classroom' },
            { day: 'Wednesday', startTime: '12:05', endTime: '12:55', subject: 'Humanities', location: 'Course' },

            // Thursday
            { day: 'Thursday', startTime: '09:00', endTime: '11:45', subject: 'Electronics Lab', location: 'Laboratory' },

            // Friday
            { day: 'Friday', startTime: '09:00', endTime: '10:50', subject: 'Atomic & Molecular Physics', location: 'Classroom' },
            { day: 'Friday', startTime: '11:00', endTime: '11:50', subject: 'Electronics & Instrumentation', location: 'Classroom' },
            { day: 'Friday', startTime: '12:05', endTime: '12:55', subject: 'Humanities', location: 'Course' }
        ]);
        console.log('Timetable populated for Nandu\'s account!');
    }
}

// Helper to get DB instance based on current user
const getDB = () => {
    const userJson = localStorage.getItem('auth_user');
    let userId = 'guest_session';
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            // Use ID if available, otherwise use a sanitized version of the email
            const identifier = user.id || user.email?.replace(/[^a-zA-Z0-9]/g, '_');
            userId = identifier || 'guest_session';

            // Legacy data migration support for Nandu accounts
            if (user.email === 'nandujm86@gmail.com' || user.email === 'storieswithnandu@gmail.com') {
                userId = 'default';
            }
        } catch (e) {
            console.error('Error parsing user for DB initialization:', e);
        }
    }
    return new ProductivityDB(userId);
};

export const db = getDB();
