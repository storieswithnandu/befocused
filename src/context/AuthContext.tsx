import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    requestResetCode: (email: string) => Promise<any>;
    resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        // Check for stored token/user on mount
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');

        if (storedUser && storedToken) {
            try {
                setState(prev => ({
                    ...prev,
                    user: JSON.parse(storedUser),
                    isAuthenticated: true,
                    isLoading: false,
                }));
            } catch (e) {
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_token');
                setState(prev => ({ ...prev, isLoading: false }));
            }
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const forceReload = (target: string) => {
        // Force a full page reload to re-initialize the DB singleton
        const hash = target.startsWith('/') ? '#' + target : '#/' + target;
        window.location.href = window.location.origin + window.location.pathname + hash;
        window.location.reload();
    };

    const login = async (email: string, password: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Login failed');
            }

            const { user, token } = await response.json();

            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));

            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            forceReload('/');
        } catch (err: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err.name === 'TypeError' ? 'Connection failed. Please ensure the server is running.' : (err.message || 'An error occurred during login'),
            }));
            throw err;
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Signup failed');
            }

            const { user, token } = await response.json();

            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));

            setState({
                user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });

            forceReload('/');
        } catch (err: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: err.message || 'An error occurred during signup',
            }));
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
        forceReload('/login');
    };

    const requestResetCode = async (email: string) => {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'Operation failed');
        }

        return data; // Return data so debug_code can be used
    };

    const resetPassword = async (email: string, code: string, newPassword: string) => {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPassword }),
        });

        if (!response.ok) {
            let message = 'Operation failed';
            try {
                const data = await response.json();
                message = data.message || message;
            } catch (e) {
                message = await response.text() || message;
            }
            throw new Error(message);
        }
    };

    const updateUser = (updatedUser: User) => {
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        setState(prev => ({ ...prev, user: updatedUser }));
    };

    return (
        <AuthContext.Provider value={{ ...state, login, signup, logout, requestResetCode, resetPassword, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
