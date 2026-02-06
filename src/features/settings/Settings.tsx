import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Save, Shield, Clock, Mail, Eye, EyeOff, Trash2, AlertTriangle, Database } from 'lucide-react';

export const Settings: React.FC = () => {
    const { user, updateUser, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // DB Init
    const [initializing, setInitializing] = useState(false);

    // Password change modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Delete account modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const handleInitializeDB = async () => {
        setInitializing(true);
        try {
            const response = await fetch('/api/migrate');
            const data = await response.json();
            if (response.ok) {
                alert('Database initialized successfully! ' + (data.message || ''));
            } else {
                alert('Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err: any) {
            alert('Error connecting to server: ' + err.message);
        } finally {
            setInitializing(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // In a real app, we would make an API call here
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (user) {
                await updateUser({ ...user, name });
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Failed to update profile', error);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setPasswordSuccess(true);
            setTimeout(() => {
                setPasswordSuccess(false);
                setShowPasswordModal(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }, 2000);
        } catch (error) {
            setPasswordError('Failed to change password');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation.toLowerCase() !== 'delete') {
            return;
        }

        try {
            // Mock API call for deletion
            await new Promise(resolve => setTimeout(resolve, 1000));
            logout();
        } catch (error) {
            console.error('Failed to delete account', error);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account and preferences</p>
            </div>

            <div className="settings-grid">
                <div className="settings-card main-settings">
                    <div className="card-header">
                        <User size={20} />
                        <h3>Profile Information</h3>
                    </div>
                    <form onSubmit={handleSave} className="settings-form">
                        <div className="input-field">
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="input-field disabled">
                            <label>Email Address</label>
                            <div className="readonly-val">
                                <Mail size={16} />
                                {user?.email}
                            </div>
                            <span className="input-hint">Email cannot be changed via settings</span>
                        </div>
                        <button type="submit" className="save-btn" disabled={saving}>
                            {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                        {success && <div className="save-success">Success! Name updated.</div>}
                    </form>
                </div>

                <div className="settings-card">
                    <div className="card-header">
                        <Database size={20} />
                        <h3>Cloud Database</h3>
                    </div>
                    <div className="setting-item">
                        <div className="setting-info">
                            <span className="setting-title">Initialize Tables</span>
                            <span className="setting-desc">Run this once to setup cloud storage</span>
                        </div>
                        <button
                            className="btn-icon"
                            onClick={handleInitializeDB}
                            disabled={initializing}
                            style={{ backgroundColor: '#8b5cf6' }}
                        >
                            {initializing ? 'Running...' : 'Run Setup'}
                        </button>
                    </div>
                </div>

                <div className="settings-card security-card">
                    <div className="card-header">
                        <Shield size={20} />
                        <h3>Security</h3>
                    </div>
                    <div className="settings-list">
                        <div className="setting-item">
                            <div className="setting-info">
                                <span className="setting-title">Password</span>
                                <span className="setting-desc">Keep your account secure</span>
                            </div>
                            <button
                                className="btn-icon"
                                onClick={() => setShowPasswordModal(true)}
                                title="Update Password"
                            >
                                Update
                            </button>
                        </div>
                        <div className="setting-item danger-item">
                            <div className="setting-info">
                                <span className="setting-title">Delete Account</span>
                                <span className="setting-desc">Permanently remove your account and data</span>
                            </div>
                            <button
                                className="btn-icon btn-danger"
                                onClick={() => setShowDeleteModal(true)}
                                title="Delete Account"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>

                <div className="settings-card info-card">
                    <div className="card-header">
                        <Clock size={20} />
                        <h3>Session Info</h3>
                    </div>
                    <div className="session-details">
                        <div className="detail-row">
                            <span>User ID</span>
                            <code>{user?.id}</code>
                        </div>
                        <div className="detail-row">
                            <span>Logged in as</span>
                            <strong className="truncate">{user?.name}</strong>
                        </div>
                        <div className="detail-row">
                            <span>Platform</span>
                            <span>BeFocused v1.0.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Change Password</h3>
                            <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="modal-form">
                            <div className="input-group">
                                <label>Current Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>New Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {passwordError && <div className="modal-error">{passwordError}</div>}
                            {passwordSuccess && <div className="modal-success">Password updated successfully!</div>}
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content danger-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <AlertTriangle size={24} color="var(--color-danger)" />
                            <h3>Delete Account</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="danger-warning">
                                This action is <strong>permanent</strong> and cannot be undone. All your data, tasks, habits, and settings will be permanently deleted.
                            </p>
                            <div className="input-group">
                                <label>Type "DELETE" to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder="DELETE"
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-danger"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmation.toLowerCase() !== 'delete'}
                            >
                                <Trash2 size={16} /> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .settings-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .settings-header h1 {
                    font-size: 2rem;
                    font-weight: 800;
                    margin-bottom: 0.5rem;
                }

                .settings-header p {
                    color: var(--color-text-secondary);
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                }

                .settings-card {
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .info-card {
                    grid-column: 2;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--color-primary);
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 1rem;
                }

                .card-header h3 {
                    margin: 0;
                    color: var(--color-text-primary);
                    font-size: 1.1rem;
                }

                .settings-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .input-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .input-field label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                }

                .input-field input {
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: 0.75rem 1rem;
                    color: var(--color-text-primary);
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .input-field input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.1);
                }

                .readonly-val {
                    background: rgba(0, 0, 0, 0.05);
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--color-text-secondary);
                    word-break: break-all;
                }

                [data-theme="dark"] .readonly-val {
                    background: rgba(255, 255, 255, 0.05);
                }

                .input-hint {
                    font-size: 0.75rem;
                    color: var(--color-text-secondary);
                    opacity: 0.8;
                }

                .save-btn {
                    background: var(--color-primary);
                    color: var(--color-primary-fg);
                    border: none;
                    border-radius: var(--radius-md);
                    padding: 0.875rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 0.5rem;
                }

                .save-btn:hover:not(:disabled) {
                    filter: brightness(1.1);
                    transform: translateY(-1px);
                }

                .save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .save-success {
                    color: var(--color-success);
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-align: center;
                }

                .settings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .setting-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: var(--color-bg-secondary);
                    border-radius: var(--radius-md);
                    gap: 1rem;
                }

                @media (max-width: 480px) {
                    .setting-item {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .btn-icon {
                        width: 100%;
                    }
                }

                .setting-info {
                    display: flex;
                    flex-direction: column;
                }

                .setting-title {
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: var(--color-text-primary);
                }

                .setting-desc {
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                }

                .session-details {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    gap: 1rem;
                }

                .truncate {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 150px;
                }

                .detail-row span:first-child {
                    color: var(--color-text-secondary);
                }

                code {
                    background: var(--color-bg-secondary);
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    word-break: break-all;
                }

                @media (max-width: 900px) {
                    .settings-grid {
                        grid-template-columns: 1fr;
                    }
                    .info-card {
                        grid-column: 1;
                    }
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }

                .modal-content {
                    background: var(--color-bg-card);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--color-border);
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    flex: 1;
                }

                .modal-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    cursor: pointer;
                    color: var(--color-text-secondary);
                    line-height: 1;
                    padding: 0;
                    width: 2rem;
                    height: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-close:hover {
                    color: var(--color-text-primary);
                }

                .modal-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .modal-form .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .modal-form label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                }

                .modal-form input {
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: 0.75rem 1rem;
                    color: var(--color-text-primary);
                    font-size: 1rem;
                }

                .modal-form input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.1);
                }

                .password-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .password-wrapper input {
                    width: 100%;
                    padding-right: 3rem;
                }

                .password-toggle {
                    position: absolute;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    transition: color 0.2s;
                }

                .password-toggle:hover {
                    color: var(--color-primary);
                }

                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .modal-actions button {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .btn-primary {
                    background: var(--color-primary);
                    color: var(--color-primary-fg);
                    border: none;
                }

                .btn-primary:hover {
                    filter: brightness(1.1);
                }

                .btn-secondary {
                    background: var(--color-bg-secondary);
                    color: var(--color-text-primary);
                    border: 1px solid var(--color-border);
                }

                .btn-secondary:hover {
                    background: var(--color-bg-tertiary);
                }

                .btn-danger {
                    background: var(--color-danger);
                    color: white;
                    border: none;
                }

                .btn-danger:hover:not(:disabled) {
                    filter: brightness(1.1);
                }

                .btn-danger:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .modal-error {
                    background: rgba(239, 68, 68, 0.1);
                    border-left: 4px solid var(--color-danger);
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    color: var(--color-danger);
                    font-size: 0.85rem;
                }

                .modal-success {
                    background: rgba(34, 197, 94, 0.1);
                    border-left: 4px solid var(--color-success);
                    padding: 0.75rem;
                    border-radius: 0.5rem;
                    color: var(--color-success);
                    font-size: 0.85rem;
                }

                .danger-modal {
                    border: 2px solid var(--color-danger);
                }

                .modal-body {
                    margin-bottom: 1.5rem;
                }

                .danger-warning {
                    background: rgba(239, 68, 68, 0.1);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    color: var(--color-danger);
                    margin-bottom: 1.5rem;
                }

                .danger-item {
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .btn-icon {
                    background: var(--color-primary);
                    color: var(--color-primary-fg);
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .btn-icon:hover {
                    filter: brightness(1.1);
                }

                .btn-icon.btn-danger {
                    background: var(--color-danger);
                }
            `}</style>
        </div>
    );
};
