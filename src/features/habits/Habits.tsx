import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Habit } from '../../types';
import { Plus, Check, Trash2, X, Flame } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { format, endOfWeek, eachDayOfInterval, subDays, addDays, addWeeks, addMonths, startOfMonth, startOfWeek, endOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Habits: React.FC = () => {
    const habits = useLiveQuery(() => db.habits.toArray());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [referenceDate, setReferenceDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const [viewDate, setViewDate] = useState(new Date());

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
            await db.habits.add({
                ...formData,
                streak: 0,
                completedDates: [],
                createdAt: new Date()
            } as Habit);
            setIsModalOpen(false);
            setFormData({ title: '', frequency: 'daily', category: 'General', goal: 1 });
        } catch (error) {
            console.error('Failed to add habit:', error);
        }
    };

    const calculateStreak = (dates: string[]) => {
        const sortedDates = [...dates].sort().reverse();
        if (sortedDates.length === 0) return 0;

        const today = format(new Date(), 'yyyy-MM-dd');
        const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

        // If the most recent completion isn't today or yesterday, streak is broken
        // UNLESS we are potentially backfilling, but standard streak definition usually relates to "current" continuity.
        // However, for a simple robust system:
        // We will just count consecutive days backwards from the latest completion, 
        // IF the latest completion is today or yesterday.

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
            newCompletedDates.sort(); // Keep sorted
        }

        const newStreak = calculateStreak(newCompletedDates);

        await db.habits.update(habit.id, {
            completedDates: newCompletedDates,
            streak: newStreak
        });
    };

    const deleteHabit = async (id: number) => {
        await db.habits.delete(id);
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
                                <button className="delete-btn" onClick={() => deleteHabit(habit.id!)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
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
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={getChartData()}
                                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
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
                                    onClick={(data: any) => {
                                        if (data?.payload?.date) {
                                            setSelectedDate(data.payload.date);
                                        }
                                    }}
                                    activeDot={{
                                        r: 8,
                                        fill: 'var(--color-primary)',
                                        stroke: 'white',
                                        strokeWidth: 2,
                                        cursor: 'pointer',
                                        onClick: (_e: any, props: any) => {
                                            if (props?.payload?.date) {
                                                setSelectedDate(props.payload.date);
                                            }
                                        }
                                    }}
                                    dot={{
                                        fill: 'var(--color-bg-card)',
                                        stroke: 'var(--color-primary)',
                                        strokeWidth: 2,
                                        r: 6,
                                        cursor: 'pointer',
                                        onClick: (_e: any, props: any) => {
                                            if (props?.payload?.date) {
                                                setSelectedDate(props.payload.date);
                                            }
                                        }
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {selectedDate && (
                        <div className="day-breakdown card animate-in">
                            <div className="breakdown-header">
                                <h3>Breakdown: {format(selectedDate, 'MMMM d, yyyy')}</h3>
                                <button className="close-btn" onClick={() => setSelectedDate(null)}><X size={16} /></button>
                            </div>
                            <div className="breakdown-list">
                                {habits?.map(habit => {
                                    const isDone = habit.completedDates.includes(format(selectedDate, 'yyyy-MM-dd'));
                                    return (
                                        <div key={habit.id} className="breakdown-item">
                                            <span>{habit.title}</span>
                                            {isDone ? <Check size={16} color="var(--color-primary)" /> : <X size={16} color="var(--color-text-secondary)" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
                .day-breakdown { padding: 1.5rem; background: var(--color-bg-card); border: 2px solid var(--color-primary); border-radius: var(--radius-lg); margin-top: 1rem; }
                .breakdown-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .breakdown-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .breakdown-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--color-border); }
                .habit-form { display: flex; flex-direction: column; gap: 1rem; }
                .animate-in { animation: slideUp 0.3s ease-out; }
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};
