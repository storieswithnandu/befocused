import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuoteCard } from '../quotes/QuoteCard';
import { CheckCircle2, Flame, AlertTriangle, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Task, Habit, TimetableEntry } from '../../types';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const today = new Date();
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tasksData, habitsData, timetableData] = await Promise.all([
          api.tasks.list(),
          api.habits.list(),
          api.timetable.list()
        ]);
        setTasks(tasksData);
        setHabits(habitsData);
        setTimetable(timetableData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  // Derived stats
  const tasksDueToday = tasks.filter(t => t.deadline && isSameDay(new Date(t.deadline), today) && t.status !== 'done');
  const activeHabits = habits.filter(h => h.streak > 0);
  const priorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').slice(0, 3);

  const hour = today.getHours();
  const targetDateForSchedule = hour >= 17 ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  const dayName = format(targetDateForSchedule, 'EEEE');
  const todaysClasses = timetable.filter(e => e.day === dayName);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={40} className="animate-spin" />
        <p>Establishing neural link...</p>
        <style>{`
                    .dashboard-loading { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--color-primary); }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="welcome-title">Good {hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening'}, {firstName}</h1>
            <p className="welcome-subtitle">Here is your focus for {format(today, 'EEEE, MMMM do')}.</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary dash-logout"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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
          <div className="stat-grid">
            <div className="stat-box warning">
              <div className="stat-icon"><CheckCircle2 size={20} /></div>
              <div className="stat-info">
                <div className="stat-num">{tasksDueToday?.length || 0}</div>
                <div className="stat-label">Tasks Due Today</div>
              </div>
            </div>
            <div className="stat-box danger">
              <div className="stat-icon"><AlertTriangle size={20} /></div>
              <div className="stat-info">
                <div className="stat-num">{priorityTasks?.length || 0}</div>
                <div className="stat-label">High Priority</div>
              </div>
            </div>
            <div className="stat-box success">
              <div className="stat-icon"><Flame size={20} /></div>
              <div className="stat-info">
                <div className="stat-num">{activeHabits?.length || 0}</div>
                <div className="stat-label">Active Habits</div>
              </div>
            </div>
          </div>

          <div className="section-header">
            <h2>Priority Tasks</h2>
            <Link to="/tasks" className="view-all">View All <ArrowRight size={14} /></Link>
          </div>
          <div className="tasks-preview card-list">
            {priorityTasks && priorityTasks.length > 0 ? (
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
              <div className="empty-dash">No high priority tasks. Good job!</div>
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

        .welcome-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--color-text-primary);
        }

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

        .stat-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .stat-box {
          background-color: var(--color-bg-card);
          padding: 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-secondary);
        }

        .stat-box.warning .stat-icon { color: var(--color-warning); background-color: rgba(245, 158, 11, 0.1); }
        .stat-box.danger .stat-icon { color: var(--color-danger, #ef4444); background-color: rgba(239, 68, 68, 0.1); }
        .stat-box.success .stat-icon { color: var(--color-success); background-color: rgba(34, 197, 94, 0.1); }

        .stat-num { font-size: 1.5rem; font-weight: 700; line-height: 1; }
        .stat-label { font-size: 0.875rem; color: var(--color-text-secondary); }

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

        .priority-card {
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

        .priority-card:hover {
          transform: translateX(4px);
        }

        .priority-indicator {
          width: 4px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
        }

        .priority-indicator.high { background-color: var(--color-danger, #ef4444); }

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
          color: var(--color-danger, #ef4444);
          opacity: 0.8;
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
          .stat-num {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};
