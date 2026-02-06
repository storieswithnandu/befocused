import React from 'react';
import { format } from 'date-fns';
import { Task } from '../../types';
import { Calendar, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (task: Task, newStatus: Task['status']) => void;
}

const priorityColors: Record<string, string> = {
  high: 'var(--color-danger)',
  medium: 'var(--color-warning)',
  low: 'var(--color-success)',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

  const getDeadlineInfo = (deadline?: Date, status?: Task['status']) => {
    if (!deadline || status === 'done') return { colorClass: '', daysText: '' };

    const now = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let colorClass = '';
    if (diffDays <= 2) colorClass = 'urgent-red';
    else if (diffDays <= 5) colorClass = 'urgent-orange';
    else if (diffDays >= 6) colorClass = 'safe-green';

    return { colorClass, diffDays };
  };

  const { colorClass } = getDeadlineInfo(task.deadline, task.status);

  return (
    <div className={`task-card ${colorClass}`}>
      <div className="task-header">
        <span className="priority-dot" style={{ backgroundColor: priorityColors[task.priority] }} />
        <span className="task-title">{task.title}</span>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        {task.deadline && (
          <div className={`task-deadline ${isOverdue ? 'overdue' : ''}`}>
            <Calendar size={12} />
            <span>{format(new Date(task.deadline), 'MMM d, h:mm a')}</span>
            {isOverdue && <AlertCircle size={12} className="alert-icon" />}
          </div>
        )}
      </div>

      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value as Task['status'])}
          className="status-select"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <div className="btn-group">
          <button onClick={() => onEdit(task)} className="action-btn">Edit</button>
          <button onClick={() => task.id && onDelete(task.id)} className="action-btn delete">Del</button>
        </div>
      </div>

      <style>{`
        .task-card {
          background-color: var(--color-bg-primary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: var(--shadow-sm);
        }

        .task-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .priority-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .task-title {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .task-desc {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
        }

        .task-deadline {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--color-text-secondary);
          background-color: var(--color-bg-secondary);
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-sm);
        }

        .task-deadline.overdue {
          color: var(--color-danger);
          background-color: rgba(239, 68, 68, 0.1);
          font-weight: 600;
        }

        .task-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          border-top: 1px solid var(--color-border);
          padding-top: 0.5rem;
        }

        .status-select {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          border: 1px solid var(--color-border);
          background-color: var(--color-bg-secondary);
          color: var(--color-text-primary);
        }

        .btn-group {
          display: flex;
          gap: 0.25rem;
        }

        .action-btn {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          border: none;
          background-color: var(--color-bg-secondary);
          color: var(--color-text-secondary);
          transition: all 0.2s;
        }

        .action-btn:hover {
          background-color: var(--color-border);
          color: var(--color-text-primary);
        }

        .action-btn.delete:hover {
          background-color: var(--color-danger);
          color: white;
        }

        /* Urgency Colors */
        .task-card.safe-green {
            background-color: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
        }
        .task-card.urgent-orange {
            background-color: rgba(249, 115, 22, 0.1);
            border-color: rgba(249, 115, 22, 0.3);
        }
        .task-card.urgent-red {
            background-color: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </div>
  );
};
