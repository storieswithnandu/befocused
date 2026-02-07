import React, { useState, useEffect, useCallback } from 'react';
import { Habit } from '../../types';
import { Plus, Check, Trash2, Flame } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Loading } from '../../components/Loading';
import { format, endOfWeek, eachDayOfInterval, subDays, addDays, addWeeks, addMonths, startOfMonth, startOfWeek, endOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../services/api';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { DayBreakdown } from '../../components/DayBreakdown';

export const Habits: React.FC = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [referenceDate, setReferenceDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewDate, setViewDate] = useState(new Date());

    const sessions = useLiveQuery(() => db.studySessions.toArray());

    const fetchHabits = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.habits.list();
            setHabits(data);
        } catch (error) {
            console.error('Failed to fetch habits:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHabits();
    }, [fetchHabits]);

    // Form State
    const [formData, setFormData] = useState<Partial<Habit>>({
        title: '',
        frequency: 'daily',
        category: 'General',
        goal: 1
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;

        try {
            await api.habits.create({
                ...formData,
                streak: 0,
                completedDates: [],
                createdAt: new Date()
            });
            setIsModalOpen(false);
            setFormData({ title: '', frequency: 'daily', category: 'General', goal: 1 });
            fetchHabits();
        } catch (error) {
            console.error('Failed to add habit:', error);
        }
    };

    const calculateStreak = (dates: string[]) => {
        const sortedDates = [...dates].sort().reverse();
        if (sortedDates.length === 0) return 0;

        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

        let latest = sortedDates[0];
        if (latest !== today && latest !== yesterday) {
            return 0;
        }

        let streak = 1;
        let current = new Date(latest);

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i]);
            const expectedPrev = subDays(current, 1);

            if (format(prevDate, 'yyyy-MM-dd') === format(expectedPrev, 'yyyy-MM-dd')) {
                streak++;
                current = prevDate;
            } else {
                break;
            }
        }
        return streak;
    };

    const toggleHabit = async (habit: Habit) => {
        if (!habit.id) return;
        const targetDateStr = format(viewDate, 'yyyy-MM-dd');
        const isCompletedOnDate = habit.completedDates.includes(targetDateStr);

        let newCompletedDates = [...habit.completedDates];

        if (isCompletedOnDate) {
            newCompletedDates = newCompletedDates.filter(d => d !== targetDateStr);
        } else {
            newCompletedDates.push(targetDateStr);
            newCompletedDates.sort();
        }

        const newStreak = calculateStreak(newCompletedDates);

        try {
            // Optimistic update
            setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, completedDates: newCompletedDates, streak: newStreak } : h));
            await api.habits.update(habit.id, {
                completedDates: newCompletedDates,
                streak: newStreak
            });
        } catch (error) {
            console.error('Failed to toggle habit:', error);
            fetchHabits(); // Rollback
        }
    };

    const deleteHabit = async (id: number) => {
        if (!confirm('Are you sure you want to delete this habit?')) return;
        try {
            await api.habits.delete(id);
            setHabits(prev => prev.filter(h => h.id !== id));
        } catch (error) {
            console.error('Failed to delete habit:', error);
        }
    };

    const getChartData = () => {
        if (!habits) return [];
        if (viewMode === 'daily') {
            const days = Array.from({ length: 7 }, (_, i) => subDays(referenceDate, 6 - i));
            return days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = habits.reduce((acc, h) => acc + (h.completedDates.includes(dateStr) ? 1 : 0), 0);
                return { name: format(day, 'MMM d'), completed: count, date: day };
            });
        }
        else if (viewMode === 'weekly') {
            const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
            const end = endOfWeek(start, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start, end });
            return days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = habits.reduce((acc, h) => acc + (h.completedDates.includes(dateStr) ? 1 : 0), 0);
                return { name: format(day, 'EEE'), completed: count, date: day };
            });
        }
        else if (viewMode === 'monthly') {
            const start = startOfMonth(referenceDate);
            const end = endOfMonth(referenceDate);
            const days = eachDayOfInterval({ start, end });
            return days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = habits.reduce((acc, h) => acc + (h.completedDates.includes(dateStr) ? 1 : 0), 0);
                return { name: format(day, 'd'), completed: count, date: day };
            });
        }
        return [];
    };

    const shiftReferenceDate = (direction: number) => {
        if (viewMode === 'daily') setReferenceDate(prev => addDays(prev, direction * 7));
        else if (viewMode === 'weekly') setReferenceDate(prev => addWeeks(prev, direction));
        else if (viewMode === 'monthly') setReferenceDate(prev => addMonths(prev, direction));
    };



    if (loading && habits.length === 0) {
        return <Loading />;
    }

    return (
        <div className="habits-container">
            <div className="habits-main">
                <div className="section-header">
                    <div>
                        <h1>Habit Protocols</h1>
                        <p className="subtitle">Systematic improvement through incremental progress.</p>

                        <div className="date-navigation" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="nav-btn" onClick={() => setViewDate(subDays(viewDate, 1))}>&lt;</button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {format(viewDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                    ? 'Today'
                                    : format(viewDate, 'MMMM d, yyyy')}
                            </span>
                            <button
                                className="nav-btn"
                                onClick={() => setViewDate(addDays(viewDate, 1))}
                                disabled={format(viewDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd')}
                                style={{ opacity: format(viewDate, 'yyyy-MM-dd') >= format(new Date(), 'yyyy-MM-dd') ? 0.5 : 1 }}
                            >&gt;</button>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> New Habit
                    </button>
                </div>

                <div className="habits-grid">
                    {habits?.map(habit => (
                        <div key={habit.id} className="habit-card card">
                            <div className="habit-info">
                                <h3>{habit.title}</h3>
                                <div className="streak-badge">
                                    <Flame size={14} />
                                    <span>{habit.streak} day streak</span>
                                </div>
                            </div>
                            <div className="habit-actions">
                                <button
                                    className={`check-btn ${habit.completedDates.includes(format(viewDate, 'yyyy-MM-dd')) ? 'active' : ''}`}
                                    onClick={() => toggleHabit(habit)}
                                >
                                    <Check size={20} />
                                </button>
                                <button className="delete-btn" onClick={() => habit.id && deleteHabit(habit.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {habits.length === 0 && <div className="empty-dash" style={{ gridColumn: '1/-1' }}>No active protocols. Initialize one to begin.</div>}
                </div>

                <div className="analytics-section">
                    <div className="section-header">
                        <h2>Analytics Data</h2>
                        <div className="analytics-controls">
                            <div className="view-toggles">
                                <button className={viewMode === 'daily' ? 'active' : ''} onClick={() => setViewMode('daily')}>Daily</button>
                                <button className={viewMode === 'weekly' ? 'active' : ''} onClick={() => setViewMode('weekly')}>Weekly</button>
                                <button className={viewMode === 'monthly' ? 'active' : ''} onClick={() => setViewMode('monthly')}>Monthly</button>
                            </div>
                            <div className="date-selector">
                                {viewMode === 'daily' && (
                                    <input
                                        type="date"
                                        value={format(referenceDate, 'yyyy-MM-dd')}
                                        onChange={(e) => setReferenceDate(new Date(e.target.value))}
                                        className="date-input"
                                    />
                                )}
                                {viewMode === 'weekly' && (
                                    <input
                                        type="week"
                                        value={`${format(referenceDate, 'yyyy')}-W${format(referenceDate, 'II').padStart(2, '0')}`}
                                        onChange={(e) => {
                                            const [year, week] = e.target.value.split('-W');
                                            const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
                                            setReferenceDate(date);
                                        }}
                                        className="date-input"
                                    />
                                )}
                                {viewMode === 'monthly' && (
                                    <input
                                        type="month"
                                        value={format(referenceDate, 'yyyy-MM')}
                                        onChange={(e) => setReferenceDate(new Date(e.target.value + '-01'))}
                                        className="date-input"
                                    />
                                )}
                            </div>
                            <div className="nav-controls">
                                <button onClick={() => shiftReferenceDate(-1)}>Prev</button>
                                <button onClick={() => setReferenceDate(new Date())}>Today</button>
                                <button onClick={() => shiftReferenceDate(1)}>Next</button>
                            </div>
                        </div>
                    </div>

                    <div className="chart-container card">
                        <div className="chart-cue">Click a dot for day details</div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={getChartData()}
                                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                                onClick={(data: any) => {
                                    if (data && data.activePayload) {
                                        setSelectedDate(data.activePayload[0].payload.date);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-primary)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--color-primary)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="completed"
                                    stroke="var(--color-primary)"
                                    strokeWidth={3}
                                    activeDot={{
                                        r: 8,
                                        onClick: (props: any) => {
                                            if (props && props.payload) {
                                                setSelectedDate(props.payload.date);
                                            }
                                        }
                                    }}
                                    dot={{
                                        r: 6,
                                        cursor: 'pointer',
                                        onClick: (props: any) => {
                                            if (props && props.payload) {
                                                setSelectedDate(props.payload.date);
                                            }
                                        }
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <DayBreakdown
                        selectedDate={selectedDate}
                        onClose={() => setSelectedDate(null)}
                        sessions={sessions}
                        habits={habits}
                    />

                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Habit Protocol">
                <form onSubmit={handleSubmit} className="habit-form">
                    <div className="form-group">
                        <label>Habit Title</label>
                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Deep Work Session" />
                    </div>
                    <div className="form-group">
                        <label>Target Frequency</label>
                        <select value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value as any })}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Initialize Protocol</button>
                </form>
            </Modal>

            <style>{`
                .habits-container { display: flex; flex-direction: column; gap: 2rem; }
                .habits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
                .habit-card { padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--color-border); }
                .habit-info h3 { margin: 0; font-size: 1.125rem; }
                .streak-badge { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--color-warning); margin-top: 0.25rem; }
                .habit-actions { display: flex; gap: 0.5rem; }
                .check-btn { width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--color-border); background: transparent; color: var(--color-border); cursor: pointer; transition: all 0.2s; }
                .check-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: white; box-shadow: 0 0 15px rgba(0, 240, 255, 0.3); }
                .delete-btn { background: transparent; border: none; color: var(--color-text-secondary); cursor: pointer; }
                .delete-btn:hover { color: var(--color-danger); }
                .analytics-section { display: flex; flex-direction: column; gap: 1.5rem; }
                .analytics-controls { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
                .date-selector { display: flex; }
                .date-input { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 99px; padding: 0.4rem 1rem; color: var(--color-text-primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; }
                .date-input::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
                .view-toggles, .nav-controls { display: flex; background: var(--color-bg-secondary); padding: 0.25rem; border-radius: 99px; }
                .nav-btn { background: var(--color-bg-secondary); border: 1px solid var(--color-border); color: var(--color-text-primary); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .nav-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
                .nav-btn:disabled { cursor: not-allowed; opacity: 0.5; }
                .view-toggles button, .nav-controls button { padding: 0.4rem 1rem; border: none; background: transparent; color: var(--color-text-secondary); cursor: pointer; border-radius: 99px; font-weight: 600; font-size: 0.8rem; }
                .view-toggles button.active { background: var(--color-bg-card); color: var(--color-primary); box-shadow: var(--shadow-sm); }
                .nav-controls button:hover { color: var(--color-text-primary); }
                .habit-form { display: flex; flex-direction: column; gap: 1rem; }
                .animate-in { animation: slideUp 0.3s ease-out; }
                .chart-container { position: relative; }
                .chart-cue {
                    position: absolute;
                    top: 10px;
                    right: 20px;
                    font-size: 10px;
                    color: var(--color-text-secondary);
                    opacity: 0.7;
                    font-style: italic;
                    z-index: 10;
                }

                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};
