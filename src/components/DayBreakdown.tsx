import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Clock, Sparkles, Activity, X } from 'lucide-react';
import { StudySession, Habit } from '../types';
import './DayBreakdown.css';

interface DayBreakdownProps {
    selectedDate: Date | null;
    onClose: () => void;
    sessions: StudySession[] | undefined;
    habits: Habit[] | undefined;
}

export const DayBreakdown: React.FC<DayBreakdownProps> = ({
    selectedDate,
    onClose,
    sessions,
    habits
}) => {
    if (!selectedDate) return null;

    const daySessions = sessions ? sessions.filter(s => isSameDay(new Date(s.timestamp), selectedDate)) : [];
    const completedHabits = habits ? habits.filter(h => h.completedDates.includes(format(selectedDate, 'yyyy-MM-dd'))) : [];

    return (
        <div className="day-breakdown premium-breakdown animate-slide-up">
            <div className="day-breakdown-header">
                <div className="header-info">
                    <Activity size={16} className="header-icon animate-pulse" />
                    <h3>{format(selectedDate, 'EEEE, MMM d')} Breakdown</h3>
                </div>
                <button className="close-btn" onClick={onClose} title="Close Details">
                    <X size={16} />
                </button>
            </div>

            <div className="breakdown-grid">
                <div className="breakdown-section">
                    <h4><Clock size={14} /> Study Sessions</h4>
                    <div className="breakdown-cards">
                        {daySessions.length > 0 ? (
                            daySessions.map((s, index) => (
                                <div
                                    key={s.id || index}
                                    className="breakdown-card animate-fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="card-indicator study"></div>
                                    <div className="card-content">
                                        <span className="breakdown-title">{s.tag || 'Focus Session'}</span>
                                        <span className="breakdown-meta">
                                            {Math.floor(s.duration / 60)} minutes • {format(new Date(s.timestamp), 'h:mm a')}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-breakdown-mini">No study sessions logged.</div>
                        )}
                    </div>
                </div>

                <div className="breakdown-section">
                    <h4><Sparkles size={14} /> Habits Completed</h4>
                    <div className="breakdown-cards">
                        {completedHabits.length > 0 ? (
                            completedHabits.map((h, index) => (
                                <div
                                    key={h.id || index}
                                    className="breakdown-card animate-fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="card-indicator habit" style={{ backgroundColor: h.color || 'var(--color-primary)' }}></div>
                                    <div className="card-content">
                                        <span className="breakdown-title">{h.title}</span>
                                        <span className="breakdown-meta">{h.frequency} goal achieved</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-breakdown-mini">No habits recorded.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
