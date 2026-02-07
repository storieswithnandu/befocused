import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuoteCard } from '../quotes/QuoteCard';
import { AlertTriangle, ArrowRight, LogOut, ListTodo, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Task, TimetableEntry, Note } from '../../types';

import { Loading } from '../../components/Loading';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const today = new Date();
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [todos, setTodos] = useState<Note[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Use allSettled to prevent one failing API from blocking the whole dashboard
      const results = await Promise.allSettled([
        api.tasks.list(),
        api.timetable.list(),
        api.todos.list()
      ]);

      if (results[0].status === 'fulfilled') setTasks(results[0].value);
      if (results[1].status === 'fulfilled') setTimetable(results[1].value);
      if (results[2].status === 'fulfilled') {
        setTodos(results[2].value);
      } else {
        console.error('Todo fetch failed:', results[2].reason);
        // We can set a flag or keep todos empty
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  // Filter for high priority C_works (tasks)
  const priorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').slice(0, 5);

  // Get recent Incomplete To-Dos
  const activeTodos = todos.filter(t => !t.completed).slice(0, 5);

  const hour = today.getHours();
  const targetDateForSchedule = hour >= 17 ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  const dayName = format(targetDateForSchedule, 'EEEE');
  const todaysClasses = timetable.filter(e => e.day === dayName);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <div className="welcome-header">
          <div>
            <h1 className="welcome-title">Good {hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'}, {firstName}</h1>
            <p className="welcome-subtitle">Here is your focus for {format(today, 'EEEE, MMMM do')}.</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary dash-logout"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="main-col">
          <QuoteCard />

          <div className="section-header">
            <h2>{hour >= 17 ? "Tomorrow's Schedule" : "Today's Schedule"}</h2>
            <span className="badge">{todaysClasses?.length || 0} classes</span>
          </div>
          <div className="schedule-list card-list">
            {todaysClasses?.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(evt => (
              <div key={evt.id} className="dash-card-item">
                <div className="time-col">
                  <div className="time-start">{evt.startTime}</div>
                  <div className="time-end">{evt.endTime}</div>
                </div>
                <div className="info-col">
                  <div className="item-title">{evt.subject}</div>
                  <div className="item-sub">{evt.location}</div>
                </div>
              </div>
            ))}
            {todaysClasses?.length === 0 && <div className="empty-dash">No classes {hour >= 17 ? 'tomorrow' : 'today'}. Enjoy your free time!</div>}
          </div>
        </div>

        <div className="side-col">
          {/* TO-DO LIST PREVIEW */}
          <div className="section-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ListTodo size={20} /> To-Do List
            </h2>
            <Link to="/notes" className="view-all">Manage <ArrowRight size={14} /></Link>
          </div>
          <div className="todo-preview card-list">
            {activeTodos.length > 0 ? (
              activeTodos.map(todo => (
                <div key={todo.id} className="mini-todo-card">
                  <Circle size={16} className="todo-dot" />
                  <span className="todo-text">{todo.title}</span>
                </div>
              ))
            ) : (
              <div className="empty-dash">No active to-dos. You're all caught up!</div>
            )}
          </div>

          {/* HIGH PRIORITY C_WORKS */}
          <div className="section-header" style={{ marginTop: '1rem' }}>
            <h2>High Priority C_works</h2>
            <Link to="/tasks" className="view-all">View All <ArrowRight size={14} /></Link>
          </div>
          <div className="tasks-preview card-list">
            {priorityTasks.length > 0 ? (
              priorityTasks.map(task => (
                <div key={task.id} className="priority-card">
                  <div className="priority-indicator high"></div>
                  <div className="priority-info">
                    <div className="priority-title">{task.title}</div>
                    <div className="priority-meta">
                      {task.deadline ? format(new Date(task.deadline), 'MMM d, h:mm a') : 'No deadline'}
                    </div>
                  </div>
                  <AlertTriangle size={16} className="priority-icon" />
                </div>
              ))
            ) : (
              <div className="empty-dash">No high priority C_works. Good job!</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .welcome-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .dash-logout {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            white-space: nowrap;
        }

        .welcome-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-text-primary);
          line-height: 1.2;
        }
// ... (rest of styles)

        .welcome-subtitle {
          color: var(--color-text-secondary);
          font-size: 1.125rem;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .main-col, .side-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .section-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .badge {
          background-color: var(--color-bg-secondary);
          padding: 0.25rem 0.5rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .card-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .dash-card-item {
          background-color: var(--color-bg-card);
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .time-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 60px;
          font-weight: 600;
          color: var(--color-primary);
          border-right: 1px solid var(--color-border);
          padding-right: 1rem;
        }
        
        .time-start { font-size: 1rem; }
        .time-end { font-size: 0.75rem; opacity: 0.8; }

        .info-col {
          flex: 1;
        }

        .item-title { font-weight: 600; }
        .item-sub { font-size: 0.875rem; color: var(--color-text-secondary); }

        .empty-dash {
          color: var(--color-text-secondary);
          font-style: italic;
          padding: 1rem;
          text-align: center;
          background-color: var(--color-bg-card);
          border-radius: var(--radius-md);
        }

        .view-all {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-primary);
          text-decoration: none;
        }

        .priority-card, .mini-todo-card {
          background-color: var(--color-bg-card);
          padding: 0.875rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease;
        }

        .priority-card:hover, .mini-todo-card:hover {
          transform: translateX(4px);
          border-color: var(--color-primary);
        }

        .priority-indicator {
          width: 4px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
        }

        .priority-indicator.high { background-color: var(--color-danger); }

        .priority-info {
          flex: 1;
        }

        .priority-title {
          font-weight: 600;
          font-size: 0.9375rem;
          margin-bottom: 0.125rem;
        }

        .priority-meta {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
        }

        .priority-icon {
          color: var(--color-danger);
          opacity: 0.8;
        }

        .todo-dot {
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .todo-text {
          font-size: 0.9375rem;
          color: var(--color-text-primary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
             grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .dash-card-item {
            flex-direction: column;
            align-items: flex-start;
          }
          .time-col {
            border-right: none;
            border-bottom: 1px solid var(--color-border);
            padding-right: 0;
            padding-bottom: 0.5rem;
            width: 100%;
            flex-direction: row;
            justify-content: flex-start;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};
