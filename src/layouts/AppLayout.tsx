import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Menu } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const AppLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      <header className="mobile-header">
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </header>

      {isSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="main-content">
        <Outlet />
      </main>

      <style>{`
            /* Mobile Navigation */
            .mobile-header {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 4rem;
                background: var(--color-bg-card);
                border-bottom: 1px solid var(--color-border);
                align-items: center;
                padding: 0 1.25rem;
                z-index: 1000;
                backdrop-filter: blur(8px);
            }

            .mobile-app-title {
                display: none;
                font-weight: 700;
                font-size: 1.1rem;
                margin-left: 1rem;
                color: var(--color-text-primary);
                background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .mobile-menu-toggle {
                display: none;
                background: var(--color-bg-secondary);
                border: 1px solid var(--color-border);
                color: var(--color-text-primary);
                padding: 0.5rem;
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.2s;
            }

            .mobile-menu-toggle:hover {
                background: var(--color-bg-card);
                border-color: var(--color-primary);
                color: var(--color-primary);
            }

            .sidebar-backdrop {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 2050;
                animation: fadeInOverlay 0.3s ease-out;
            }

            @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            /* Mobile Header Styles */
            @media (max-width: 768px) {
                .layout-container {
                    flex-direction: column;
                }
                .mobile-header {
                    display: flex;
                }
                .mobile-menu-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .sidebar-backdrop {
                    display: block;
                }
                .main-content {
                    padding: 1rem;
                    padding-top: 5rem;
                    padding-bottom: 80px;
                }
            }
      `}</style>
    </div>
  );
};
