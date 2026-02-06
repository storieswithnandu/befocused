export interface User {
    id: string;
    email: string;
    name?: string;
    role?: 'admin' | 'user';
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface AuthResponse {
    user: User;
    token: string;
}
