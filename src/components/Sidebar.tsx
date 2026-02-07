import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Flame,
  Timer,
  Settings,
  X,
  Moon,
  Sun,
  LogOut,
  ListTodo
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ theme, toggleTheme, isOpen, onClose }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/tasks', icon: CheckSquare, label: 'C_works' },
    { to: '/habits', icon: Flame, label: 'Habits' },
    { to: '/notes', icon: ListTodo, label: 'To-Do List' },
    { to: '/timer', icon: Timer, label: 'Focus Timer' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/logo.svg" alt="Logo" className="logo-img" />
            <span className="logo-text">BeFocused</span>
          </div>
          <button className="mobile-close" onClick={onClose} aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? (
              <><Moon size={20} /> Dark Mode</>
            ) : (
              <><Sun size={20} /> Light Mode</>
            )}
          </button>

          <button className="logout-btn" onClick={handleLogout} aria-label="Log out">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: 260px;
          background-color: var(--color-bg-card);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 2100;
          transition: transform 0.3s ease;
        }

        .sidebar-header {
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mobile-close {
          display: none;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-img {
          width: 32px;
          height: 32px;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .nav-links {
          flex: 1;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow-y: auto;
          scrollbar-width: none; /* Hide for Firefox */
          -ms-overflow-style: none; /* Hide for IE/Edge */
        }

        .nav-links::-webkit-scrollbar {
          display: none; /* Hide for Chrome/Safari */
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          color: var(--color-text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background-color: var(--color-bg-secondary);
          color: var(--color-primary);
        }

        .nav-link.active {
          background-color: var(--color-bg-secondary);
          color: var(--color-primary);
        }

        .sidebar-footer {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-top: 1px solid var(--color-border);
          margin-top: auto;
        }

        .theme-toggle, .logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.875rem 1rem;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          cursor: pointer;
          border-radius: var(--radius-md);
          font-weight: 600;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .theme-toggle:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background-color: var(--color-bg-card);
        }

        .logout-btn {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
          background-color: rgba(239, 68, 68, 0.05);
        }

        .logout-btn:hover {
          background-color: #ef4444;
          color: white !important;
          border-color: #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .dash-logout {
          display: none;
        }

        @media (max-width: 480px) {
          .dash-logout {
            display: flex;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100%;
            height: -webkit-fill-available;
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-close {
            display: block;
          }
        }
      `}</style>
    </>
  );
};
