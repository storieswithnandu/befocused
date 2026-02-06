import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Grade } from '../../types';
import { Plus, GraduationCap, TrendingUp, Award, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { format } from 'date-fns';

export const Grades: React.FC = () => {
    const grades = useLiveQuery(() => db.grades.toArray());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Grade>>({
        subject: '',
        score: 0,
        maxScore: 100,
        type: 'Exam',
        date: new Date()
    });

    const calculateGPA = () => {
        if (!grades || grades.length === 0) return 0;
        const total = grades.reduce((acc, curr) => acc + (curr.score / curr.maxScore), 0);
        return ((total / grades.length) * 10).toFixed(2); // Assuming 10-point scale for demo
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.grades.add({
            ...formData,
            date: new Date(formData.date || new Date())
        } as Grade);
        setIsModalOpen(false);
    };

    return (
        <div className="grades-container">
            <div className="grades-header">
                <h1>Academic Achievements</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} /> Add Grade
                </button>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <TrendingUp className="stat-icon" />
                    <div className="stat-content">
                        <span className="stat-label">Average Score</span>
                        <span className="stat-value">{calculateGPA()}/10.0</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Award className="stat-icon" />
                    <div className="stat-content">
                        <span className="stat-label">Total Exams</span>
                        <span className="stat-value">{grades?.length || 0}</span>
                    </div>
                </div>
            </div>

            <div className="grades-grid">
                {grades?.map(grade => (
                    <div key={grade.id} className="grade-item card">
                        <div className="grade-main">
                            <h3>{grade.subject}</h3>
                            <span className="grade-type">{grade.type}</span>
                        </div>
                        <div className="grade-score">
                            <span className="score-val">{grade.score}</span>
                            <span className="score-max">/ {grade.maxScore}</span>
                        </div>
                        <div className="grade-footer">
                            <span className="grade-date">{format(new Date(grade.date), 'MMM d, yyyy')}</span>
                            <button className="delete-btn" onClick={() => db.grades.delete(grade.id!)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Achievement">
                <form onSubmit={handleSubmit} className="grade-form">
                    <div className="form-group">
                        <label>Subject</label>
                        <input required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g. Physics II" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Score</label>
                            <input type="number" required value={formData.score} onChange={e => setFormData({ ...formData, score: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                            <label>Max Score</label>
                            <input type="number" required value={formData.maxScore} onChange={e => setFormData({ ...formData, maxScore: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Type</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                            <option value="Exam">Exam</option>
                            <option value="Assignment">Assignment</option>
                            <option value="Quiz">Quiz</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Save Result</button>
                </form>
            </Modal>

            <style>{`
                .grades-container { display: flex; flex-direction: column; gap: 2rem; }
                .grades-header { display: flex; justify-content: space-between; align-items: center; }
                .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
                .stat-card { background: var(--color-bg-card); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border); display: flex; align-items: center; gap: 1rem; }
                .stat-icon { color: var(--color-primary); width: 32px; height: 32px; }
                .stat-label { color: var(--color-text-secondary); font-size: 0.875rem; display: block; }
                .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); }
                .grades-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
                .grade-item { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; border: 1px solid var(--color-border); }
                .grade-main h3 { margin: 0; font-size: 1.125rem; }
                .grade-type { font-size: 0.75rem; color: var(--color-primary); background: rgba(0, 240, 255, 0.1); padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
                .grade-score { display: flex; align-items: baseline; gap: 0.25rem; }
                .score-val { font-size: 2rem; font-weight: 800; color: var(--color-primary); }
                .score-max { color: var(--color-text-secondary); font-weight: 600; }
                .grade-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); pt: 0.75rem; margin-top: auto; }
                .grade-date { font-size: 0.8rem; color: var(--color-text-secondary); }
                .delete-btn { background: transparent; border: none; color: var(--color-text-secondary); cursor: pointer; }
                .delete-btn:hover { color: var(--color-danger); }
                .grade-form { display: flex; flex-direction: column; gap: 1rem; }
                .form-row { display: flex; gap: 1rem; }
                @media (max-width: 480px) {
                    .form-row { flex-direction: column; }
                }
            `}</style>
        </div>
    );
};
