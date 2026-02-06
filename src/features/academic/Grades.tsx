import React, { useState, useEffect, useCallback } from 'react';
import { Grade } from '../../types';
import { Plus, TrendingUp, Award, Trash2, Loader2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { format } from 'date-fns';
import { api } from '../../services/api';

export const Grades: React.FC = () => {
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Grade>>({
        subject: '',
        score: 0,
        maxScore: 100,
        type: 'Exam',
        date: new Date()
    });

    const fetchGrades = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.grades.list();
            setGrades(data);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]);

    const calculateGPA = () => {
        if (!grades || grades.length === 0) return 0;
        const total = grades.reduce((acc, curr) => acc + (curr.score / curr.maxScore), 0);
        return ((total / grades.length) * 10).toFixed(2); // Assuming 10-point scale for demo
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.grades.create({
                ...formData,
                date: new Date(formData.date || new Date())
            });
            setIsModalOpen(false);
            setFormData({ subject: '', score: 0, maxScore: 100, type: 'Exam', date: new Date() });
            fetchGrades();
        } catch (error) {
            console.error('Failed to save grade:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this result?')) return;
        try {
            await api.grades.delete(id);
            setGrades(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.error('Failed to delete grade:', error);
        }
    };

    if (loading && grades.length === 0) {
        return (
            <div className="grades-loading">
                <Loader2 size={40} className="animate-spin" />
                <p>Downloading academic records...</p>
                <style>{`
                    .grades-loading { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--color-primary); }
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

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
                            <button className="delete-btn" onClick={() => grade.id && handleDelete(grade.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
                {grades.length === 0 && <div className="empty-dash" style={{ gridColumn: '1/-1' }}>No results recorded. Time to ace some tests!</div>}
            </div>

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
            `}</style>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Achievement">
                <form onSubmit={handleSubmit} className="grade-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Subject</label>
                        <input required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g. Physics II" style={{ padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                    </div>
                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Score</label>
                            <input type="number" required value={formData.score} onChange={e => setFormData({ ...formData, score: Number(e.target.value) })} style={{ padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                        </div>
                        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Max Score</label>
                            <input type="number" required value={formData.maxScore} onChange={e => setFormData({ ...formData, maxScore: Number(e.target.value) })} style={{ padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }} />
                        </div>
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Type</label>
                        <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} style={{ padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
                            <option value="Exam">Exam</option>
                            <option value="Assignment">Assignment</option>
                            <option value="Quiz">Quiz</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Save Result</button>
                </form>
            </Modal>
        </div>
    );
};
