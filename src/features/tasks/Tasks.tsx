import React, { useState, useEffect, useCallback } from 'react';
import { Task, Priority, TaskStatus, TimetableEntry } from '../../types';
import { Modal } from '../../components/Modal';
import { DateTimePicker } from '../../components/DateTimePicker';
import { TaskCard } from './TaskCard';
import { Plus, LayoutList, Kanban as KanbanIcon, RefreshCw, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tasksData, timetableData] = await Promise.all([
                api.tasks.list(),
                api.timetable.list()
            ]);
            setTasks(tasksData);
            setTimetableEntries(timetableData);
        } catch (err: any) {
            console.error('Failed to fetch data:', err);
            setError(err.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const uniqueSubjects = React.useMemo(() => {
        const subjects = new Set(timetableEntries?.map(t => t.subject));
        // Also check tasks for any existing subjects
        tasks?.forEach(t => {
            if (t.subject) subjects.add(t.subject);
        });
        return Array.from(subjects).sort();
    }, [timetableEntries, tasks]);

    const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        deadline: undefined
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) return;

        try {
            // Optimistic update (optional, but let's just wait for now for simplicity)
            // or just reload after
            if (editingTask?.id) {
                await api.tasks.update(editingTask.id, formData);
            } else {
                await api.tasks.create(formData);
            }

            await fetchData(); // Refresh list
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save task:', error);
            alert('Failed to save task.');
        }
    };

    const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
        if (!task.id) return;

        // Optimistic UI update
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            await api.tasks.update(task.id, { status: newStatus });
            // No need to full refetch if we trust the optimistic update, 
            // but fetching in bg is safer.
        } catch (error) {
            console.error('Failed to update status:', error);
            setTasks(previousTasks); // Revert
            alert('Failed to update status');
        }
    };

    const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

    const handleDeleteClick = (id: number) => {
        setTaskToDelete(id);
    };

    const confirmDelete = async () => {
        if (taskToDelete) {
            try {
                await api.tasks.delete(taskToDelete);
                setTasks(prev => prev.filter(t => t.id !== taskToDelete)); // Optimistic remove
                setTaskToDelete(null);
            } catch (error) {
                console.error('Failed to delete task:', error);
                alert('Failed to delete task');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            priority: 'medium',
            status: 'pending',
            deadline: undefined
        });
        setEditingTask(null);
    };

    const openAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setFormData(task);
        setIsModalOpen(true);
    };

    // View Components
    const KanbanView = () => {
        const columns: TaskStatus[] = ['pending', 'in-progress', 'done'];

        const normalizeStatus = (s?: string): TaskStatus => {
            if (!s) return 'pending';
            const lower = s.toLowerCase();
            if (lower === 'done') return 'done';
            if (lower === 'in-progress' || lower.includes('progress')) return 'in-progress';
            return 'pending';
        };

        return (
            <div className="kanban-board">
                {columns.map(status => (
                    <div key={status} className="kanban-column">
                        <h3 className="column-header">
                            {status.replace('-', ' ').toUpperCase()}
                            <span className="count">
                                {tasks?.filter(t => normalizeStatus(t.status) === status).length || 0}
                            </span>
                        </h3>
                        <div className="column-content">
                            {tasks?.filter(t => normalizeStatus(t.status) === status).map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteClick}
                                    onStatusChange={handleStatusChange}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const ListView = () => (
        <div className="task-list">
            {tasks?.sort((a, b) => (new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime())).map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteClick}
                    onStatusChange={handleStatusChange}
                />
            ))}
        </div>
    );

    if (loading && tasks.length === 0) {
        return (
            <div className="loading-state">
                <Loader2 className="animate-spin" size={32} />
                <p>Loading tasks...</p>
                <style>{`
                    .loading-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: var(--color-text-secondary);
                        gap: 1rem;
                    }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    // Check if error is due to auth (simple check)
    // Actually fetchWithAuth handles redirect, so here we just show retry
    if (error) {
        return (
            <div className="error-state">
                <p>⚠️ {error}</p>
                <button className="btn" onClick={fetchData}><RefreshCw size={16} /> Retry</button>
                <style>{`
                    .error-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        color: var(--color-danger);
                        gap: 1rem;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="tasks-container">
            <div className="tasks-header">
                <h1>Tasks & Deadlines</h1>
                <div className="actions">
                    <button className="btn-icon-only" onClick={fetchData} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                    <div className="view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <LayoutList size={18} />
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
                            onClick={() => setViewMode('board')}
                        >
                            <KanbanIcon size={18} />
                        </button>
                    </div>
                    <button className="btn btn-primary" onClick={openAddModal}>
                        <Plus size={18} style={{ marginRight: '0.5rem' }} />
                        New Task
                    </button>
                </div>
            </div>

            {viewMode === 'board' ? <KanbanView /> : <ListView />}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTask ? "Edit Task" : "New Task"}
            >
                <form onSubmit={handleSubmit} className="task-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="What needs to be done?"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Details..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Subject (Optional)</label>
                        <input
                            value={formData.subject || ''}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="e.g. Physics"
                            list="subject-list"
                        />
                        <datalist id="subject-list">
                            {uniqueSubjects.map(subject => (
                                <option key={subject} value={subject} />
                            ))}
                        </datalist>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Deadline</label>
                            <DateTimePicker
                                value={formData.deadline}
                                onChange={(date) => setFormData({ ...formData, deadline: date })}
                                placeholder="Set deadline..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Task</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!taskToDelete}
                onClose={() => setTaskToDelete(null)}
                title="Delete Task"
            >
                <div className="delete-confirmation">
                    <p>Are you sure you want to delete this task?</p>
                    <div className="form-actions">
                        <button className="btn" onClick={() => setTaskToDelete(null)}>Cancel</button>
                        <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                    </div>
                </div>
            </Modal>

            <style>{`
        .delete-confirmation {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .btn-danger {
            background-color: var(--color-danger);
            color: white;
            border: none;
        }
        
        .btn-danger:hover {
            opacity: 0.9;
        }

        .tasks-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }

        .tasks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .tasks-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        .btn-icon-only {
            background: none;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            padding: 0.5rem;
            display: flex;
            align-items: center;
            border-radius: 99px;
            transition: all 0.2s;
        }
        .btn-icon-only:hover {
            background-color: var(--color-bg-secondary);
            color: var(--color-primary);
        }

        .view-toggle {
          display: flex;
          background-color: var(--color-bg-card);
          border: 1px solid var(--color-border);
          border-radius: 99px;
          padding: 0.25rem;
        }

        .toggle-btn {
          padding: 0.5rem;
          border-radius: 99px;
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toggle-btn.active {
          background-color: var(--color-bg-secondary);
          color: var(--color-primary);
        }

        /* Kanban Board - Vertical Stacking */
        .kanban-board {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 2rem;
        }

        .kanban-column {
          width: 100%;
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          border: 1px solid var(--color-border);
        }

        .column-header {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--color-border);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .column-header .count {
          background-color: var(--color-bg-card);
          padding: 0.2rem 0.6rem;
          border-radius: 99px;
          font-size: 0.8rem;
          border: 1px solid var(--color-border);
        }

        .column-content {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
          min-height: 50px;
        }

        /* List View - Single Vertical Column */
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Form */
        .task-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-group label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
            color: var(--color-text-secondary);
            margin-left: 0.25rem;
        }
        
        input, textarea, select {
          padding: 0.75rem 1rem;
          background-color: var(--color-bg-secondary);
          border: 1px solid transparent;
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-family: inherit;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          background-color: var(--color-bg-card);
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-transparent);
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--color-border);
        }
      `}</style>
        </div >
    );
};
