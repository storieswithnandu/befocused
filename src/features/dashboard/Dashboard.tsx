import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { QuoteCard } from '../quotes/QuoteCard';
import { CheckCircle2, Flame, AlertTriangle, ArrowRight, LogOut } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const today = new Date();

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const handleLogout = () => {
    logout();
  };

  // ... rest of queries ...
  const tasksDueToday = useLiveQuery(async () => {
    const all = await db.tasks.toArray();
    return all.filter(t => t.deadline && isSameDay(new Date(t.deadline), today) && t.status !== 'done');
  });

  const habits = useLiveQuery(async () => {
    return await db.habits.where('streak').above(0).toArray();
  });

  const todaysClasses = useLiveQuery(async () => {
    const hour = new Date().getHours();
    const targetDate = hour >= 17 ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
    const dayName = format(targetDate, 'EEEE');
    return await db.timetable.where('day').equals(dayName).toArray();
  }, [today]);

  const priorityTasks = useLiveQuery(async () => {
    const all = await db.tasks.toArray();
    return all.filter(t => t.priority === 'high' && t.status !== 'done').slice(0, 3);
  });

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="welcome-title">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {firstName}</h1>
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
            <h2>{new Date().getHours() >= 17 ? "Tomorrow's Schedule" : "Today's Schedule"}</h2>
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
            {todaysClasses?.length === 0 && <div className="empty-dash">No classes {new Date().getHours() >= 17 ? 'tomorrow' : 'today'}. Enjoy your free time!</div>}
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
                <div className="stat-num">{habits?.length || 0}</div>
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

        .dash-project-card {
            background-color: var(--color-bg-card);
            padding: 1rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
        }
        .project-preview-title { font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; display: block; }
        .mini-progress { height: 4px; background: var(--color-bg-secondary); border-radius: 2px; overflow: hidden; }
        .mini-bar { height: 100%; background: var(--color-primary); }

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
