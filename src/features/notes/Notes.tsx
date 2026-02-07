import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Note } from '../../types';
import { Plus, Search, Book, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

export const Notes: React.FC = () => {
    const notes = useLiveQuery(() => db.notes.toArray());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState({ title: '', content: '', subject: '' });

    const filteredNotes = notes?.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async () => {
        if (!editContent.title) return;
        const noteData = {
            ...editContent,
            updatedAt: new Date(),
            createdAt: selectedNote ? selectedNote.createdAt : new Date()
        };

        if (selectedNote?.id) {
            await db.notes.update(selectedNote.id, noteData);
        } else {
            const id = await db.notes.add(noteData as Note);
            setSelectedNote({ ...noteData, id } as Note);
        }
        setIsEditing(false);
    };

    const startNewNote = () => {
        setSelectedNote(null);
        setEditContent({ title: '', content: '', subject: '' });
        setIsEditing(true);
    };

    const deleteNote = async (id: number) => {
        if (confirm('Delete this note?')) {
            await db.notes.delete(id);
            if (selectedNote?.id === id) setSelectedNote(null);
        }
    };

    return (
        <div className="notes-container">
            <div className="notes-sidebar">
                <div className="sidebar-header">
                    <button className="btn btn-primary w-full" onClick={startNewNote}>
                        <Plus size={18} /> New List Item
                    </button>
                    <div className="search-box">
                        <Search size={16} />
                        <input placeholder="Search to-do items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="notes-list">
                    {filteredNotes?.map(note => (
                        <div
                            key={note.id}
                            className={`note-preview-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                            onClick={() => { setSelectedNote(note); setEditContent(note); setIsEditing(false); }}
                        >
                            <span className="note-item-subject">{note.subject}</span>
                            <span className="note-item-title">{note.title}</span>
                            <span className="note-item-date">{format(new Date(note.updatedAt), 'MMM d')}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="note-content-area">
                {isEditing ? (
                    <div className="note-editor">
                        <div className="editor-header">
                            <input
                                className="title-input"
                                placeholder="To-Do Title"
                                value={editContent.title}
                                onChange={e => setEditContent({ ...editContent, title: e.target.value })}
                            />
                            <input
                                className="subject-input"
                                placeholder="Subject (e.g. Physics)"
                                value={editContent.subject}
                                onChange={e => setEditContent({ ...editContent, subject: e.target.value })}
                            />
                            <div className="editor-actions">
                                <button className="btn btn-primary" onClick={handleSave}>Save</button>
                                <button className="btn-icon" onClick={() => setIsEditing(false)} title="Cancel">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <textarea
                            className="content-textarea"
                            placeholder="Add details or sub-tasks..."
                            value={editContent.content}
                            onChange={e => setEditContent({ ...editContent, content: e.target.value })}
                        />
                    </div>
                ) : selectedNote ? (
                    <div className="note-viewer">
                        <div className="viewer-header">
                            <div className="viewer-info">
                                <span className="view-subject">{selectedNote.subject}</span>
                                <h1 className="view-title">{selectedNote.title}</h1>
                                <span className="view-date">Last updated {format(new Date(selectedNote.updatedAt), 'MMMM d, yyyy')}</span>
                            </div>
                            <div className="viewer-actions">
                                <button className="btn-icon" onClick={() => setIsEditing(true)} title="Edit Note">
                                    <Edit size={20} />
                                </button>
                                <button className="btn-icon danger" onClick={() => deleteNote(selectedNote.id!)} title="Delete Note">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="note-body">
                            {selectedNote.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Book size={48} />
                        <p>Select an item to view or create a new one.</p>
                    </div>
                )}
            </div>

            <style>{`
                .notes-container { 
                    display: flex; 
                    height: calc(100vh - 100px); 
                    background: var(--color-bg-card); 
                    border-radius: var(--radius-lg); 
                    border: 1px solid var(--color-border); 
                    overflow: hidden; 
                    position: relative;
                }
                
                @media (max-width: 768px) {
                    .notes-container {
                        flex-direction: column;
                        height: auto;
                        min-height: calc(100vh - 120px);
                    }
                }

                .notes-sidebar { 
                    width: 300px; 
                    border-right: 1px solid var(--color-border); 
                    display: flex; 
                    flex-direction: column; 
                    background: rgba(0,0,0,0.02); 
                    flex-shrink: 0;
                }

                @media (max-width: 768px) {
                    .notes-sidebar {
                        width: 100%;
                        max-height: 40vh;
                        border-right: none;
                        border-bottom: 1px solid var(--color-border);
                    }
                    /* If a note is selected on mobile, maybe hide the sidebar to focus on content? 
                       Or let them both show with scrolling. Let's stack them.
                    */
                }

                .sidebar-header { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; border-bottom: 1px solid var(--color-border); }
                .search-box { display: flex; align-items: center; gap: 0.5rem; background: var(--color-bg-primary); padding: 0.5rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); }
                .search-box input { background: transparent; border: none; outline: none; color: var(--color-text-primary); width: 100%; font-size: 0.875rem; }
                .notes-list { flex: 1; overflow-y: auto; }
                .note-preview-item { padding: 1rem; cursor: pointer; border-bottom: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 0.25rem; transition: all 0.2s; }
                .note-preview-item:hover { background: var(--color-bg-secondary); }
                .note-preview-item.active { background: var(--color-bg-secondary); border-left: 4px solid var(--color-primary); }
                .note-item-subject { font-size: 0.7rem; color: var(--color-primary); font-weight: 700; text-transform: uppercase; }
                .note-item-title { font-weight: 600; color: var(--color-text-primary); }
                .note-item-date { font-size: 0.75rem; color: var(--color-text-secondary); }
                .note-content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
                .note-viewer { padding: 2rem; overflow-y: auto; }
                .viewer-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1rem; gap: 1rem; }
                
                @media (max-width: 480px) {
                    .viewer-header {
                        flex-direction: column;
                    }
                    .note-viewer {
                        padding: 1rem;
                    }
                    .view-title {
                        font-size: 1.5rem !important;
                    }
                }

                .view-subject { color: var(--color-primary); font-weight: 700; text-transform: uppercase; font-size: 0.8rem; }
                .view-title { margin: 0.5rem 0; font-size: 2rem; }
                .view-date { font-size: 0.8rem; color: var(--color-text-secondary); }
                .viewer-info { flex: 1; }
                .viewer-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
                
                .note-body { line-height: 1.6; color: var(--color-text-primary); font-size: 1.1rem; }
                .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-secondary); gap: 1rem; padding: 2rem; text-align: center; }
                .note-editor { display: flex; flex-direction: column; height: 100%; padding: 1.5rem; gap: 1rem; }
                
                .editor-header { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
                .editor-actions { display: flex; gap: 0.5rem; margin-left: auto; }

                @media (max-width: 480px) {
                    .note-editor { padding: 1rem; }
                    .subject-input { width: 100% !important; }
                    .editor-actions { width: 100%; justify-content: flex-end; }
                }

                .title-input { flex: 1; min-width: 200px; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); padding: 0.5rem 0; outline: none; }
                .subject-input { width: 200px; background: transparent; border: none; border-bottom: 2px solid var(--color-border); font-size: 0.9rem; color: var(--color-primary); padding: 0.5rem 0; outline: none; }
                .content-textarea { flex: 1; background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.5rem; font-family: inherit; font-size: 1.1rem; vertical-align: top; resize: none; color: var(--color-text-primary); outline: none; min-height: 300px; }
                .content-textarea:focus { border-color: var(--color-primary); }
            `}</style>
        </div>
    );
};
