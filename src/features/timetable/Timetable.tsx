import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { TimetableEntry, DayOfWeek } from '../../types';
import { Modal } from '../../components/Modal';
import { Plus, Trash2, LayoutGrid, List } from 'lucide-react';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const Timetable: React.FC = () => {
  const entries = useLiveQuery(() => db.timetable.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('horizontal');

  // Form State
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.startTime || !formData.endTime || !formData.day) return;

    try {
      if (editingEntry?.id) {
        await db.timetable.update(editingEntry.id, formData as TimetableEntry);
      } else {
        await db.timetable.add(formData as TimetableEntry);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this class?')) {
      await db.timetable.delete(id);
    }
  };

  const resetForm = () => {
    setFormData({
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      subject: '',
      location: ''
    });
    setEditingEntry(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsModalOpen(true);
  };

  // Helper to sort entries by time
  const getEntriesForDay = (day: DayOfWeek) => {
    return entries
      ?.filter(e => e.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)) || [];
  };

  const getUrgencyInfo = (subject: string): { isUrgent: boolean, message: string, style?: React.CSSProperties } => {
    if (!tasks || !subject) return { isUrgent: false, message: subject };

    const normalizedSubject = subject.trim().toLowerCase();

    // Find all pending tasks for this subject
    const subjectTasks = tasks.filter(t =>
      t.subject?.trim().toLowerCase() === normalizedSubject &&
      t.status !== 'done' &&
      t.deadline
    );

    if (subjectTasks.length === 0) return { isUrgent: false, message: subject };

    // Find the most urgent deadline
    const now = new Date();
    let minDiffDays = Number.MAX_SAFE_INTEGER;
    let urgentTaskTitle = '';

    subjectTasks.forEach(task => {
      if (task.deadline) {
        const due = new Date(task.deadline);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < minDiffDays) {
          minDiffDays = diffDays;
          urgentTaskTitle = task.title;
        }
      }
    });

    if (minDiffDays === Number.MAX_SAFE_INTEGER) return { isUrgent: false, message: subject };

    if (minDiffDays <= 2) { // Red
      return {
        isUrgent: true,
        message: `Urgent: ${urgentTaskTitle} (Due in ${minDiffDays} days)`,
        style: {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          borderLeftColor: 'rgba(239, 68, 68, 1)'
        }
      };
    } else if (minDiffDays <= 5) { // Orange
      return {
        isUrgent: true,
        message: `Urgent: ${urgentTaskTitle} (Due in ${minDiffDays} days)`,
        style: {
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderColor: 'rgba(249, 115, 22, 0.3)',
          borderLeftColor: 'rgba(249, 115, 22, 1)'
        }
      };
    } else if (minDiffDays >= 6 && minDiffDays <= 14) { // Green
      return {
        isUrgent: true,
        message: `Upcoming: ${urgentTaskTitle} (Due in ${minDiffDays} days)`,
        style: {
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          borderLeftColor: 'rgba(34, 197, 94, 1)'
        }
      };
    }

    return { isUrgent: false, message: `${subject} (Task: ${urgentTaskTitle})` };
  };

  const getCardStyle = (subject: string) => {
    // Check urgency first
    const urgencyInfo = getUrgencyInfo(subject);
    if (urgencyInfo.style) return urgencyInfo.style;

    const lower = subject.toLowerCase();
    if (lower.includes('lab')) {
      return {
        backgroundColor: 'rgba(147, 51, 234, 0.1)', // Purple tint
        borderColor: 'rgba(147, 51, 234, 0.3)',
        borderLeftColor: 'rgba(147, 51, 234, 1)'
      };
    }
    if (lower.includes('humanities')) {
      return {
        backgroundColor: 'rgba(13, 148, 136, 0.1)', // Teal tint
        borderColor: 'rgba(13, 148, 136, 0.3)',
        borderLeftColor: 'rgba(13, 148, 136, 1)'
      };
    }
    return {};
  };

  return (
    <div className="timetable-container">
      <div className="header-actions">
        <h1>Weekly Timetable</h1>
        <div className="actions-wrapper mobile-stack">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'vertical' ? 'active' : ''}`}
              onClick={() => setViewMode('vertical')}
              title="Vertical View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`toggle-btn ${viewMode === 'horizontal' ? 'active' : ''}`}
              onClick={() => setViewMode('horizontal')}
              title="Horizontal View"
            >
              <List size={18} />
            </button>
          </div>
          <button className="btn btn-primary w-full-mobile" onClick={openAddModal}>
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Add Class
          </button>
        </div>
      </div>

      <div className={`timetable-wrapper ${viewMode}`}>
        {DAYS.map(day => (
          <div key={day} className="day-column">
            <h3 className="day-header">{day}</h3>
            <div className="day-schedule">
              {getEntriesForDay(day).map(entry => (
                <div
                  key={entry.id}
                  className="schedule-card"
                  onClick={() => openEditModal(entry)}
                  style={getCardStyle(entry.subject)}
                  title={getUrgencyInfo(entry.subject).message}
                >
                  <div className="time-badge">
                    {entry.startTime} - {entry.endTime}
                  </div>
                  <div className="subject-name">{entry.subject}</div>
                  {entry.location && <div className="location">{entry.location}</div>}
                  <button
                    className="btn-icon danger delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id!);
                    }}
                    title="Delete Class"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {getEntriesForDay(day).length === 0 && (
                <div className="empty-slot">No classes</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? "Edit Class" : "Add Class"}
      >
        <form onSubmit={handleSubmit} className="timetable-form">
          <div className="form-group">
            <label>Subject</label>
            <input
              required
              value={formData.subject}
              onChange={e => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Mathematics"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Day</label>
              <select
                value={formData.day}
                onChange={e => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Room 101"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      <style>{`
        .timetable-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }

        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .actions-wrapper {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .view-toggle {
            display: flex;
            background: var(--color-bg-secondary);
            padding: 2px;
            border-radius: var(--radius-sm);
            gap: 2px;
        }

        .toggle-btn {
            background: transparent;
            border: none;
            padding: 6px;
            border-radius: var(--radius-sm);
            color: var(--color-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .toggle-btn.active {
            background: var(--color-bg-card);
            color: var(--color-primary);
            box-shadow: var(--shadow-sm);
        }

        .header-actions h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        /* Vertical View (Grid) */
        .timetable-wrapper.vertical {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          overflow-x: auto;
          padding-bottom: 1rem;
        }

        .timetable-wrapper.vertical .day-column {
          background-color: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          min-width: 200px;
        }

        .timetable-wrapper.vertical .day-header {
           padding: 1rem;
           text-align: center;
           background-color: var(--color-bg-secondary);
           border-bottom: 1px solid var(--color-border);
           font-weight: 600;
           border-radius: var(--radius-md) var(--radius-md) 0 0;
           margin: 0;
        }

         .timetable-wrapper.vertical .day-schedule {
            padding: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            min-height: 200px;
         }

         /* Horizontal View (List) */
         .timetable-wrapper.horizontal {
            display: flex;
            flex-direction: column;
            gap: 1rem;
         }

         .timetable-wrapper.horizontal .day-column {
            background-color: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            display: flex;
            flex-direction: row;
            overflow: hidden;
         }

         .timetable-wrapper.horizontal .day-header {
            width: 150px;
            flex-shrink: 0;
            background-color: var(--color-bg-secondary);
            border-right: 1px solid var(--color-border);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin: 0;
            padding: 1rem;
         }

         .timetable-wrapper.horizontal .day-schedule {
            flex: 1;
            display: flex;
            flex-direction: row;
            gap: 1rem;
            padding: 1rem;
            overflow-x: auto;
            align-items: flex-start;
         }
         
         .timetable-wrapper.horizontal .schedule-card {
            min-width: 200px;
         }
         
         .timetable-wrapper.horizontal .empty-slot {
            padding: 0;
            display: flex;
            align-items: center;
         }

        .schedule-card {
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-left: 3px solid var(--color-primary);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
        }

        .schedule-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        
        .schedule-card:hover .delete-btn {
          opacity: 1;
        }

        .time-badge {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.25rem;
          display: block;
        }
        
        /* Adjust for horizontal to ensure text contrast on colored cards might need it, but using 0.1 opacity should be safe for dark text. 
           If dark mode, these colors might need adjustment. 
        */

        .subject-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .location {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          margin-top: 0.25rem;
        }

        .delete-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
          padding: 4px;
        }

        .task-count-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: var(--color-text-primary);
            color: var(--color-bg-primary);
            border-radius: 12px;
            padding: 0.1rem 0.4rem;
            font-size: 0.7rem;
            font-weight: 700;
            margin-left: 0.5rem;
            vertical-align: middle;
            line-height: 1;
        }

        .empty-slot {
          text-align: center;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          padding: 1rem 0;
          font-style: italic;
        }

        /* Form Styles */
        .timetable-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        @media (max-width: 480px) {
            .form-row {
                flex-direction: column;
                gap: 1rem;
            }
        }
        
        .form-row .form-group {
          flex: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .form-group input, .form-group select {
          padding: 0.625rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
          font-family: inherit;
        }
        
        .form-group input:focus, .form-group select:focus {
          outline: 2px solid var(--color-primary);
          border-color: transparent;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        
        @media (max-width: 768px) {
            .timetable-wrapper.horizontal .day-column {
                flex-direction: column;
            }
             .timetable-wrapper.horizontal .day-header {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid var(--color-border);
            }
        }
      `}</style>
    </div>
  );
};
