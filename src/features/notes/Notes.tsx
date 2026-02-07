import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Note } from '../../types';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

export const Notes: React.FC = () => {
    const items = useLiveQuery(() => db.notes.toArray());
    const [newItemTitle, setNewItemTitle] = useState('');

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;

        const newItem: Note = {
            title: newItemTitle.trim(),
            content: '', // No longer used for detailed notes
            completed: false,
            subject: 'To-Do',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.notes.add(newItem);
        setNewItemTitle('');
    };

    const toggleComplete = async (item: Note) => {
        if (!item.id) return;
        await db.notes.update(item.id, {
            completed: !item.completed,
            updatedAt: new Date()
        });
    };

    const deleteItem = async (id: number) => {
        await db.notes.delete(id);
    };

    // Sort items: incomplete first, then by date
    const sortedItems = items?.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return (
        <div className="todo-list-container">
            <header className="todo-header">
                <h1>To-Do List</h1>
                <form onSubmit={addItem} className="add-item-form">
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="add-input"
                    />
                    <button type="submit" className="add-btn">
                        <Plus size={20} />
                    </button>
                </form>
            </header>

            <div className="todo-items">
                {sortedItems?.map((item) => (
                    <div key={item.id} className={`todo-item ${item.completed ? 'completed' : ''}`}>
                        <button
                            className="toggle-btn"
                            onClick={() => toggleComplete(item)}
                            title={item.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                            {item.completed ? (
                                <CheckCircle2 className="check-icon" size={24} />
                            ) : (
                                <Circle className="uncheck-icon" size={24} />
                            )}
                        </button>
                        <span className="todo-title">{item.title}</span>
                        <button
                            className="delete-btn"
                            onClick={() => item.id && deleteItem(item.id)}
                            title="Delete task"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {items?.length === 0 && (
                    <div className="empty-state">
                        <p>No tasks yet. Add one above!</p>
                    </div>
                )}
            </div>

            <style>{`
                .todo-list-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    min-height: calc(100vh - 100px);
                }

                .todo-header {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .todo-header h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--color-text-primary);
                }

                .add-item-form {
                    display: flex;
                    gap: 0.5rem;
                    background: var(--color-bg-card);
                    padding: 0.5rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                    box-shadow: var(--shadow-sm);
                }

                .add-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: var(--color-text-primary);
                    padding: 0.5rem 1rem;
                    font-size: 1rem;
                }

                .add-btn {
                    background: var(--color-primary);
                    color: var(--color-primary-fg);
                    border: none;
                    border-radius: var(--radius-sm);
                    padding: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .add-btn:hover {
                    background: var(--color-primary-hover);
                    transform: scale(1.05);
                }

                .todo-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .todo-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: var(--color-bg-card);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                    transition: all 0.2s ease;
                }

                .todo-item:hover {
                    border-color: var(--color-primary);
                    transform: translateX(4px);
                }

                .todo-item.completed {
                    opacity: 0.7;
                    background: rgba(148, 163, 184, 0.05);
                }

                .todo-item.completed .todo-title {
                    text-decoration: line-through;
                    color: var(--color-text-secondary);
                }

                .toggle-btn {
                    background: none;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    color: var(--color-text-secondary);
                    transition: color 0.2s;
                }

                .toggle-btn:hover {
                    color: var(--color-primary);
                }

                .check-icon {
                    color: var(--color-success);
                }

                .todo-title {
                    flex: 1;
                    font-size: 1.1rem;
                    color: var(--color-text-primary);
                    font-weight: 500;
                }

                .delete-btn {
                    background: none;
                    border: none;
                    padding: 0.5rem;
                    cursor: pointer;
                    color: var(--color-text-secondary);
                    opacity: 0;
                    transition: all 0.2s;
                    border-radius: var(--radius-sm);
                }

                .todo-item:hover .delete-btn {
                    opacity: 1;
                }

                .delete-btn:hover {
                    color: var(--color-danger);
                    background: rgba(239, 68, 68, 0.1);
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: var(--color-text-secondary);
                    background: var(--color-bg-card);
                    border-radius: var(--radius-lg);
                    border: 2px dashed var(--color-border);
                }

                @media (max-width: 640px) {
                    .todo-list-container {
                        padding: 1rem;
                    }
                    
                    .todo-header h1 {
                        font-size: 1.5rem;
                    }

                    .delete-btn {
                        opacity: 1; /* Always show on mobile */
                    }
                }
            `}</style>
        </div>
    );
};
