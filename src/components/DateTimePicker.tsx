import React, { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateTimePickerProps {
    value?: Date;
    onChange: (date?: Date) => void;
    placeholder?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, placeholder = "Select date & time" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'date' | 'time'>('date');
    const [viewDate, setViewDate] = useState(value || new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateClick = (date: Date) => {
        const newDate = new Date(viewDate);
        newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

        // Preserve time if it was already set, otherwise default to current time or 12:00 PM?
        // Actually, let's keep the existing time from viewDate (which defaults to now or value)

        onChange(newDate);
        setViewDate(newDate);
        setView('time'); // Auto-switch to time after date pick
    };

    const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', val: number | string) => {
        let current = value || new Date();
        let hours = getHours(current);
        let minutes = getMinutes(current);

        if (type === 'hour') {
            let newHour = val as number; // 1-12
            const isPM = hours >= 12;
            if (isPM && newHour < 12) newHour += 12;
            if (!isPM && newHour === 12) newHour = 0;
            // Handle edge case if user was at 12 PM (12) and switches to 12 AM (0) logic is handled by ampm toggle mostly
            // Simplified: if we change hour in 12h format, we try to keep AM/PM
            if (hours >= 12) { // PM
                if (val === 12) hours = 12;
                else hours = (val as number) + 12;
            } else { // AM
                if (val === 12) hours = 0;
                else hours = val as number;
            }
        } else if (type === 'minute') {
            minutes = val as number;
        } else if (type === 'ampm') {
            if (val === 'AM' && hours >= 12) hours -= 12;
            if (val === 'PM' && hours < 12) hours += 12;
        }

        const newDate = setMinutes(setHours(current, hours), minutes);
        onChange(newDate);
        setViewDate(newDate);
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    // Calendar Generation
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Time Values
    const currentHours = value ? getHours(new Date(value)) : getHours(new Date());
    const currentMinutes = value ? getMinutes(new Date(value)) : getMinutes(new Date());
    const isPM = currentHours >= 12;
    const hour12 = currentHours % 12 || 12;

    return (
        <div className="datetime-picker-container" ref={containerRef}>
            <div className="picker-input-wrapper" onClick={toggleOpen}>
                <CalendarIcon size={16} className="picker-icon" />
                <span className={`picker-display ${!value ? 'placeholder' : ''}`}>
                    {value ? format(value, 'MMM d, yyyy h:mm a') : placeholder}
                </span>
                {value && (
                    <button
                        className="clear-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(undefined);
                        }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="picker-dropdown card">
                    <div className="picker-tabs">
                        <button
                            className={`tab-btn ${view === 'date' ? 'active' : ''}`}
                            onClick={() => setView('date')}
                        >
                            Date
                        </button>
                        <button
                            className={`tab-btn ${view === 'time' ? 'active' : ''}`}
                            onClick={() => setView('time')}
                        >
                            Time
                        </button>
                    </div>

                    <div className="picker-content">
                        {view === 'date' && (
                            <div className="calendar-view">
                                <div className="calendar-header">
                                    <button onClick={() => setViewDate(subMonths(viewDate, 1))}><ChevronLeft size={16} /></button>
                                    <span>{format(viewDate, 'MMMM yyyy')}</span>
                                    <button onClick={() => setViewDate(addMonths(viewDate, 1))}><ChevronRight size={16} /></button>
                                </div>
                                <div className="calendar-grid">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="calendar-day-header">{d}</div>)}
                                    {calendarDays.map(day => (
                                        <button
                                            key={day.toISOString()}
                                            className={`calendar-day 
                                                ${!isSameMonth(day, monthStart) ? 'outside' : ''} 
                                                ${value && isSameDay(day, value) ? 'selected' : ''}
                                                ${isSameDay(day, new Date()) ? 'today' : ''}
                                            `}
                                            onClick={() => handleDateClick(day)}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {view === 'time' && (
                            <div className="time-view">
                                <div className="time-display-large">
                                    {hour12}:{currentMinutes.toString().padStart(2, '0')} <span className="ampms">{isPM ? 'PM' : 'AM'}</span>
                                </div>
                                <div className="time-controls">
                                    <div className="control-group">
                                        <label>Hour</label>
                                        <div className="scroll-options">
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                                <button
                                                    key={h}
                                                    className={`time-opt ${h === hour12 ? 'active' : ''}`}
                                                    onClick={() => handleTimeChange('hour', h)}
                                                >
                                                    {h}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="control-group">
                                        <label>Minute</label>
                                        <div className="scroll-options minutes-grid">
                                            {Array.from({ length: 60 }, (_, i) => i).map(m => (
                                                <button
                                                    key={m}
                                                    className={`time-opt ${currentMinutes === m ? 'active' : ''}`}
                                                    onClick={() => handleTimeChange('minute', m)}
                                                >
                                                    {m.toString().padStart(2, '0')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="control-group toggles">
                                        <button className={`ampm-btn ${!isPM ? 'active' : ''}`} onClick={() => handleTimeChange('ampm', 'AM')}>AM</button>
                                        <button className={`ampm-btn ${isPM ? 'active' : ''}`} onClick={() => handleTimeChange('ampm', 'PM')}>PM</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .datetime-picker-container {
                    position: relative;
                }
                .picker-input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background-color: var(--color-bg-secondary);
                    border: 1px solid transparent;
                    border-radius: var(--radius-md);
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .picker-input-wrapper:hover {
                    background-color: var(--color-bg-card);
                    border-color: var(--color-border);
                }
                .picker-icon { color: var(--color-text-secondary); }
                .picker-display { flex: 1; font-size: 0.9rem; color: var(--color-text-primary); }
                .picker-display.placeholder { color: var(--color-text-secondary); }
                .clear-btn { background: none; border: none; padding: 0; color: var(--color-text-secondary); cursor: pointer; }
                .clear-btn:hover { color: var(--color-danger); }

                .picker-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    right: 0;
                    z-index: 100;
                    width: 300px; /* Fixed width for calendar */
                    padding: 0;
                    overflow: hidden;
                    animation: slideDownFade 0.2s ease-out;
                }

                .picker-tabs {
                    display: flex;
                    background-color: var(--color-bg-secondary);
                    border-bottom: 1px solid var(--color-border);
                }
                .tab-btn {
                    flex: 1;
                    padding: 0.75rem;
                    background: transparent;
                    border: none;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                }
                .tab-btn.active {
                    color: var(--color-primary);
                    border-bottom-color: var(--color-primary);
                    background-color: var(--color-bg-card);
                }

                .picker-content {
                    padding: 1rem;
                    max-height: 300px; /* Prevent overgrowth */
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    font-weight: bold;
                }
                .calendar-header button { background: transparent; border: none; padding: 0.25rem; border-radius: 4px; color: var(--color-text-secondary); cursor: pointer; }
                .calendar-header button:hover { background-color: var(--color-bg-secondary); color: var(--color-text-primary); }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                    text-align: center;
                }
                .calendar-day-header {
                    font-size: 0.7rem;
                    color: var(--color-text-secondary);
                    padding-bottom: 0.25rem;
                }
                .calendar-day {
                    aspect-ratio: 1;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    font-size: 0.8rem;
                    color: var(--color-text-primary);
                    cursor: pointer;
                }
                .calendar-day:hover { background-color: var(--color-bg-secondary); }
                .calendar-day.outside { opacity: 0.3; }
                .calendar-day.selected { background-color: var(--color-primary); color: white; }
                .calendar-day.today { border: 1px solid var(--color-primary); }

                .time-view {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .time-display-large {
                    text-align: center;
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--color-text-primary);
                    font-variant-numeric: tabular-nums;
                }
                .ampms { font-size: 1rem; color: var(--color-text-secondary); margin-left: 0.25rem; }

                .time-controls {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .control-group label {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--color-text-secondary);
                    margin-bottom: 0.25rem;
                    text-transform: uppercase;
                    font-weight: 700;
                }
                
                .scroll-options {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.25rem;
                    height: 150px; /* Increased height for easier scrolling */
                    overflow-y: auto;
                    padding-right: 2px;
                }
                
                .scroll-options.minutes-grid {
                    grid-template-columns: repeat(5, 1fr); /* 5 columns for minutes (0-4, 5-9 etc) */
                }

                .scroll-options::-webkit-scrollbar { width: 4px; }
                .time-opt {
                    background: var(--color-bg-secondary);
                    border: none;
                    border-radius: 4px;
                    padding: 0.25rem;
                    font-size: 0.8rem;
                    cursor: pointer;
                    color: var(--color-text-primary);
                }
                .time-opt.active { background-color: var(--color-primary); color: white; }
                .time-opt:hover:not(.active) { background-color: var(--color-bg-tertiary); }
                
                .toggles {
                   grid-column: span 2;
                   display: flex;
                   gap: 0.5rem;
                }
                .ampm-btn {
                    flex: 1;
                    padding: 0.5rem;
                    border-radius: 99px;
                    border: 1px solid var(--color-border);
                    background: transparent;
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                }
                .ampm-btn.active {
                    background-color: var(--color-bg-secondary);
                    color: var(--color-primary);
                    border-color: var(--color-primary);
                }
             `}</style>
        </div>
    );
};
