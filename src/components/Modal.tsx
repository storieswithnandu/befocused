import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6); /* Slightly darker overlay */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(8px); /* Deeper blur for premium feel */
          animation: overlay-in 0.3s ease-out;
        }

        .modal-container {
          background-color: var(--color-bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          width: 95%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
          animation: modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          position: sticky;
          top: 0;
          background-color: var(--color-bg-card);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--color-text-secondary);
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .close-btn:hover {
          background-color: var(--color-bg-secondary);
          color: var(--color-text-primary);
        }

        .modal-content {
          padding: 1.5rem;
          flex: 1;
        }

        @media (max-width: 480px) {
            .modal-container {
                width: 100%;
                height: 100%;
                max-height: 100vh;
                border-radius: 0;
                border: none;
            }
            .modal-header {
                padding: 1rem 1.25rem;
            }
            .modal-content {
                padding: 1.25rem;
            }
        }

        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
