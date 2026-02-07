import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Play, Pause, RotateCcw, Clock, Pencil, Save, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, isSameDay, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, addDays, addWeeks, addMonths } from 'date-fns';
import { useTimer } from '../../context/TimerContext';
import { DateTimePicker } from '../../components/DateTimePicker';
import { Modal } from '../../components/Modal';
import { DayBreakdown } from '../../components/DayBreakdown';
import { api } from '../../services/api';
import { Habit } from '../../types';


export const Timer: React.FC = () => {
    const {
        timeLeft,
        isActive,
        mode,
        toggleTimer,
        resetTimer,
        setModeDuration,
        customFocusMin,
        setCustomFocusMin,
        saveCustomTime
    } = useTimer();

    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [referenceDate, setReferenceDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualDuration, setManualDuration] = useState(25);
    const [manualTag, setManualTag] = useState('Study Session');
    const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [manualTime, setManualTime] = useState(format(new Date(), 'HH:mm'));

    const sessions = useLiveQuery(() => db.studySessions.orderBy('timestamp').reverse().toArray());
    const [habits, setHabits] = useState<Habit[]>([]);

    useEffect(() => {
        const fetchHabits = async () => {
            try {
                const data = await api.habits.list();
                setHabits(data);
            } catch (error) {
                console.error('Failed to fetch habits in timer:', error);
            }
        };
        fetchHabits();
    }, []);

    const handleSaveCustomTime = () => {
        setIsEditing(false);
        saveCustomTime();
    };

    const handleSaveManualEntry = async () => {
        try {
            const dateTime = new Date(`${manualDate}T${manualTime} `);
            await db.studySessions.add({
                duration: manualDuration * 60,
                timestamp: dateTime,
                tag: manualTag || 'Study Session'
            });
            // Reset form
            setManualDuration(25);
            setManualTag('Study Session');
            setManualDate(format(new Date(), 'yyyy-MM-dd'));
            setManualTime(format(new Date(), 'HH:mm'));
            setShowManualEntry(false);
        } catch (e) {
            console.error('Failed to save manual entry', e);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
    };

    const totalFocusTime = useMemo(() => {
        if (!sessions) return 0;
        return sessions.reduce((acc, curr) => acc + curr.duration, 0);
    }, [sessions]);

    // Chart Data Preparation
    const chartData = useMemo(() => {
        if (!sessions) return [];

        let days: { date: Date, label: string, minutes: number }[] = [];

        if (viewMode === 'daily') {
            const startOfLast7 = subDays(referenceDate, 6);
            days = Array.from({ length: 7 }, (_, i) => {
                const d = addDays(startOfLast7, i);
                return { date: d, label: format(d, 'MMM d'), minutes: 0 };
            });
        } else if (viewMode === 'weekly') {
            const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
            const end = endOfWeek(start, { weekStartsOn: 1 });
            days = eachDayOfInterval({ start, end }).map(d => ({
                date: d,
                label: format(d, 'EEE'),
                minutes: 0
            }));
        } else if (viewMode === 'monthly') {
            const start = startOfMonth(referenceDate);
            const end = endOfMonth(referenceDate);
            days = eachDayOfInterval({ start, end }).map(d => ({
                date: d,
                label: format(d, 'd'),
                minutes: 0
            }));
        }

        sessions.forEach(session => {
            const sessionDate = new Date(session.timestamp);
            const dayEntry = days.find(d => isSameDay(d.date, sessionDate));
            if (dayEntry) {
                dayEntry.minutes += Math.floor(session.duration / 60);
            }
        });

        return days;
    }, [sessions, viewMode, referenceDate]);

    const shiftReferenceDate = (amount: number) => {
        if (viewMode === 'daily') setReferenceDate(prev => addDays(prev, amount));
        else if (viewMode === 'weekly') setReferenceDate(prev => addWeeks(prev, amount));
        else if (viewMode === 'monthly') setReferenceDate(prev => addMonths(prev, amount));
    };

    return (
        <div className="timer-container">
            <div className="timer-main">
                <div className="mode-toggles">
                    <button className={`mode-btn ${mode === 'focus' ? 'active' : ''} `} onClick={() => setModeDuration('focus')}>Focus</button>
                    <button className={`mode-btn ${mode === 'short' ? 'active' : ''} `} onClick={() => setModeDuration('short')}>Short Break</button>
                    <button className={`mode-btn ${mode === 'long' ? 'active' : ''} `} onClick={() => setModeDuration('long')}>Long Break</button>
                </div>

                <div className="timer-display-wrapper">
                    {isEditing ? (
                        <div className="edit-time-box">
                            <input
                                type="number"
                                value={customFocusMin}
                                onChange={(e) => setCustomFocusMin(Math.max(1, parseInt(e.target.value) || 0))}
                                className="time-input"
                            />
                            <span className="min-label">min</span>
                            <button className="save-btn" onClick={handleSaveCustomTime}><Save size={24} /></button>
                        </div>
                    ) : (
                        <div className="timer-display">
                            {formatTime(timeLeft)}
                            {mode === 'focus' && !isActive && (
                                <button className="edit-btn" onClick={() => setIsEditing(true)} title="Edit Duration">
                                    <Pencil size={20} />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="timer-controls">
                    <button className="control-btn primary" onClick={toggleTimer}>
                        {isActive ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: 4 }} />}
                    </button>
                    <button className="control-btn secondary" onClick={resetTimer}>
                        <RotateCcw size={24} />
                    </button>
                </div>
            </div>

            <div className="stats-panel">
                <div className="manual-entry-section">
                    <button
                        className="manual-entry-toggle"
                        onClick={() => setShowManualEntry(true)}
                        title="Add Manual Study Session"
                    >
                        <Plus size={20} />
                        <span>Log Past Session</span>
                    </button>

                    <Modal
                        isOpen={showManualEntry}
                        onClose={() => setShowManualEntry(false)}
                        title="Log Past Session"
                    >
                        <div className="manual-entry-form-standard">
                            <div className="form-group">
                                <label>Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={manualDuration}
                                    onChange={(e) => setManualDuration(Math.max(1, parseInt(e.target.value) || 0))}
                                    placeholder="25"
                                    min="1"
                                />
                            </div>
                            <div className="form-group">
                                <label>Tag / Subject</label>
                                <input
                                    type="text"
                                    value={manualTag}
                                    onChange={(e) => setManualTag(e.target.value)}
                                    placeholder="e.g. Mathematics, Physics"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date & Time</label>
                                <DateTimePicker
                                    value={new Date(`${manualDate}T${manualTime} `)}
                                    onChange={(date) => {
                                        if (date) {
                                            setManualDate(format(date, 'yyyy-MM-dd'));
                                            setManualTime(format(date, 'HH:mm'));
                                        }
                                    }}
                                    placeholder="Select date & time"
                                />
                            </div>
                            <div className="form-actions">
                                <button className="btn btn-secondary" onClick={() => setShowManualEntry(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSaveManualEntry}>
                                    <Save size={18} />
                                    Save Session
                                </button>
                            </div>
                        </div>
                    </Modal>
                </div>

                <div className="chart-container">
                    <div className="analytics-header">
                        <h3>Session History</h3>
                        <div className="view-toggle">
                            <button className={viewMode === 'daily' ? 'active' : ''} onClick={() => { setViewMode('daily'); setReferenceDate(new Date()); }}>Daily</button>
                            <button className={viewMode === 'weekly' ? 'active' : ''} onClick={() => { setViewMode('weekly'); setReferenceDate(new Date()); }}>Weekly</button>
                            <button className={viewMode === 'monthly' ? 'active' : ''} onClick={() => { setViewMode('monthly'); setReferenceDate(new Date()); }}>Monthly</button>
                        </div>
                    </div>

                    <div className="date-selection-container">
                        <button className="nav-btn" onClick={() => shiftReferenceDate(-1)}>&lt;</button>
                        {viewMode === 'monthly' ? (
                            <input
                                type="month"
                                value={format(referenceDate, 'yyyy-MM')}
                                onChange={(e) => setReferenceDate(startOfMonth(new Date(e.target.value)))}
                                className="picker-input"
                            />
                        ) : (
                            <input
                                type="date"
                                value={format(referenceDate, 'yyyy-MM-dd')}
                                onChange={(e) => setReferenceDate(startOfDay(new Date(e.target.value)))}
                                className="picker-input"
                            />
                        )}
                        <button className="nav-btn" onClick={() => shiftReferenceDate(1)}>&gt;</button>
                    </div>

                    <h4>Focus Minutes</h4>
                    <div className="chart-wrapper">
                        <div className="chart-cue">Click a dot for day details</div>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart
                                data={chartData}
                                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                                <XAxis
                                    dataKey="label"
                                    stroke="var(--color-text-secondary)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="var(--color-text-secondary)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-card)',
                                        borderColor: 'var(--color-border)',
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-lg)',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: 'var(--color-text-primary)' }}
                                    cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="minutes"
                                    stroke="var(--color-primary)"
                                    strokeWidth={4}
                                    onClick={(data: any) => {
                                        if (data && data.payload) {
                                            setSelectedDate(data.payload.date);
                                        }
                                    }}
                                    activeDot={{
                                        r: 8,
                                        fill: 'var(--color-primary)',
                                        stroke: 'white',
                                        strokeWidth: 2,
                                        cursor: 'pointer',
                                        onClick: (props: any) => {
                                            if (props && props.payload) {
                                                setSelectedDate(props.payload.date);
                                            }
                                        }
                                    }}
                                    dot={{
                                        fill: 'var(--color-bg-card)',
                                        stroke: 'var(--color-primary)',
                                        strokeWidth: 2,
                                        r: 5,
                                        cursor: 'pointer',
                                        onClick: (props: any) => {
                                            if (props && props.payload) {
                                                setSelectedDate(props.payload.date);
                                            }
                                        }
                                    }}
                                    animationDuration={1000}
                                    animationEasing="ease-in-out"
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        <DayBreakdown
                            selectedDate={selectedDate}
                            onClose={() => setSelectedDate(null)}
                            sessions={sessions}
                            habits={habits}
                        />

                    </div>
                </div>

                <div className="stats-summary">
                    <div className="stat-card">
                        <Clock size={20} className="text-primary" />
                        <div>
                            <div className="stat-value">{Math.floor((totalFocusTime || 0) / 60)}</div>
                            <div className="stat-label">Total Minutes Focused</div>
                        </div>
                    </div>
                </div>

                <div className="history-list">
                    {sessions?.slice(0, 5).map(session => (
                        <div key={session.id} className="history-item">
                            <span className="history-tag">{session.tag}</span>
                            <span className="history-time">{new Date(session.timestamp).toLocaleString()}</span>
                            <span className="history-duration">{(session.duration / 60).toFixed(0)}m</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
            .timer-container {
                display: grid;
                grid-template-columns: 1fr 400px;
                gap: 2rem;
                height: 100%;
            }

            .timer-main {
                background-color: var(--color-bg-card);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                gap: 2.5rem;
                position: relative;
            }

            .timer-display-wrapper {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 350px;
                height: 350px;
                border-radius: 50%;
                background: var(--color-bg-secondary);
                border: 8px solid var(--color-primary-transparent, rgba(0, 240, 255, 0.1));
                box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.05);
                transition: all 0.3s ease;
            }

            .timer-display {
                font-size: 6rem;
                font-weight: 800;
                font-variant-numeric: tabular-nums;
                color: var(--color-text-primary);
                line-height: 1;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
            }

            .edit-btn {
                opacity: 0.6;
                background: var(--color-bg-card);
                border: 1px solid var(--color-border);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: var(--color-text-secondary);
                transition: all 0.2s;
                position: absolute;
                bottom: 60px;
                left: 50%;
                transform: translateX(-50%);
            }

            .timer-display-wrapper:hover .edit-btn {
                opacity: 1;
                background: var(--color-primary);
                color: white;
                border-color: var(--color-primary);
            }

            .edit-time-box {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                width: 100%;
            }

            .time-input {
                font-size: 4rem;
                width: 150px;
                background: transparent;
                border: none;
                border-bottom: 2px solid var(--color-primary);
                color: var(--color-text-primary);
                text-align: center;
                font-weight: 700;
            }
            
            .time-input:focus { outline: none; }

            .min-label { font-size: 1.5rem; color: var(--color-text-secondary); margin-top: 1rem; }

            .save-btn {
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: var(--shadow-md);
            }

            .mode-toggles {
                display: flex;
                background-color: var(--color-bg-secondary);
                padding: 0.25rem;
                border-radius: 99px;
            }

            .mode-btn {
                padding: 0.5rem 1.5rem;
                border-radius: 99px;
                border: 1px solid transparent;
                background: transparent;
                color: var(--color-text-secondary);
                font-weight: 500;
                transition: all 0.2s;
            }

            .mode-btn.active {
                background-color: var(--color-bg-card);
                color: var(--color-primary);
                border-color: var(--color-primary);
                box-shadow: var(--shadow-sm);
            }

            .timer-controls {
                display: flex;
                align-items: center;
                gap: 1.5rem;
            }

            .control-btn {
                border: none;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.1s;
            }

            .control-btn:active {
                transform: scale(0.95);
            }

            .control-btn.primary {
                width: 80px;
                height: 80px;
                background-color: var(--color-primary);
                color: white;
                box-shadow: var(--shadow-md);
            }
            
            .control-btn.primary:hover {
                background-color: var(--color-primary-hover);
            }

            .control-btn.secondary {
                width: 50px;
                height: 50px;
                background-color: var(--color-bg-secondary);
                color: var(--color-text-secondary);
            }
             .control-btn.secondary:hover {
                color: var(--color-text-primary);
            }

            .stats-panel {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .manual-entry-section {
                display: flex;
                justify-content: center;
                margin-bottom: 0.5rem;
            }

            .manual-entry-toggle {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                background: var(--color-bg-secondary);
                border: 1px solid var(--color-border);
                color: var(--color-text-primary);
                padding: 0.75rem 1.5rem;
                border-radius: var(--radius-md);
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            .manual-entry-toggle:hover {
                border-color: var(--color-primary);
                color: var(--color-primary);
                box-shadow: var(--shadow-sm);
                transform: translateY(-1px);
            }

            .manual-entry-form-standard {
                display: flex;
                flex-direction: column;
                gap: 1.25rem;
            }

            .manual-entry-form-standard .form-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .manual-entry-form-standard label {
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--color-text-secondary);
            }

            .manual-entry-form-standard input {
                background: var(--color-bg-secondary);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-md);
                padding: 0.75rem 1rem;
                color: var(--color-text-primary);
                font-size: 1rem;
                transition: all 0.2s;
                outline: none;
            }

            .manual-entry-form-standard input:focus {
                border-color: var(--color-primary);
                box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.1);
            }

            .manual-entry-form-standard .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                margin-top: 0.5rem;
            }

            .stats-panel h3, .stats-panel h4 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--color-text-primary);
                margin: 0;
            }
            
            .stats-panel h4 { font-size: 1rem; margin-bottom: 0.5rem; color: var(--color-text-secondary); }

            .chart-container {
                background-color: var(--color-bg-card);
                padding: 1rem;
                border-radius: var(--radius-md);
                border: 1px solid var(--color-border);
                display: flex;
                flex-direction: column;
                gap: 1rem;
                user-select: none;
                -webkit-user-select: none;
            }

            .chart-wrapper {
                position: relative;
                user-select: none;
                -webkit-user-select: none;
                -webkit-tap-highlight-color: transparent;
            }

            .chart-cue {
                position: absolute;
                top: -10px;
                right: 10px;
                font-size: 10px;
                color: var(--color-text-secondary);
                opacity: 0.7;
                font-style: italic;
            }

            .recharts-responsive-container, 
            .recharts-wrapper, 
            .recharts-surface {
                outline: none!important;
                -webkit-tap-highlight-color: transparent;
            }

            .analytics-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .view-toggle {
                display: flex;
                gap: 0.25rem;
                background: var(--color-bg-secondary);
                padding: 0.2rem;
                border-radius: 99px;
            }

            .view-toggle button {
                background: transparent;
                border: none;
                color: var(--color-text-secondary);
                padding: 0.2rem 0.6rem;
                font-size: 0.75rem;
                border-radius: 99px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .view-toggle button.active {
                background: var(--color-bg-card);
                color: var(--color-primary);
                box-shadow: var(--shadow-sm);
            }



            .history-tag {
                font-weight: 600;
                color: var(--color-primary);
            }
            
            .history-time {
                color: var(--color-text-secondary);
            }

            .history-duration {
                font-weight: 600;
            }
            
            .empty-history {
                color: var(--color-text-secondary);
                font-style: italic;
            }

            @media(max-width: 1024px) {
                .timer-container {
                    grid-template-columns: 1fr;
                }
                .timer-display-wrapper {
                    width: 280px;
                    height: 280px;
                }
                .timer-display {
                    font-size: 4.5rem;
                }
                .timer-main {
                    padding: 2rem 1rem;
                }
            }

            .day-breakdown.premium-breakdown {
                margin-top: 2rem;
                padding: 1.5rem;
                background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-card) 100%);
                border-radius: var(--radius-lg);
                border: 1px solid var(--color-border);
                box-shadow: var(--shadow-md);
                animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes slideUpFade {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .day-breakdown-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }

            .header-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .header-icon {
                color: var(--color-primary);
            }

            .day-breakdown-header h3 {
                font-size: 1.1rem;
                font-weight: 700;
                margin: 0;
                letter-spacing: -0.01em;
            }

            .breakdown-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
            }
            `}</style>
        </div>
    );
};
