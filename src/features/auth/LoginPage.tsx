import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Key, ArrowRight, Mail, Lock, User, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot-password';
type ForgotStep = 'email' | 'code' | 'reset';

export const LoginPage: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const { login, signup, requestResetCode, resetPassword } = useAuth();

    React.useEffect(() => {
        const savedEmail = localStorage.getItem('remembered_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }
        } catch (err: any) {
            if (err.message === 'Account not found') {
                setError('No account found with this email. Would you like to create one?');
            } else {
                setError(err.message || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signup(email, password, name);
            if (rememberMe) {
                localStorage.setItem('remembered_email', email);
            } else {
                localStorage.removeItem('remembered_email');
            }
        } catch (err: any) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const data = await requestResetCode(email);
            setForgotStep('code');

            if (data.debug_code) {
                setSuccess(`Security code: ${data.debug_code} (Displaying because email sending might be limited in dev)`);
            } else {
                setSuccess('A security code has been sent to your email.');
            }
        } catch (err: any) {
            // Check if there's a debug code even on error (we added this to our API)
            // Error objects from AuthContext currently only have a message string.
            // We might need to handle this differently if we want to show the code on failure.
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        // In simulation, any 6 digit code works or we check for a specific one
        if (code.length === 6) {
            setForgotStep('reset');
            setError(null);
        } else {
            setError('Invalid security code');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await resetPassword(email, code, newPassword);
            setSuccess('Password updated successfully! You can now log in.');
            setMode('login');
            setForgotStep('email');
            setPassword('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-glass-card animate-entrance">
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="/logo.svg" alt="BeFocused Logo" className="logo-img" style={{ width: '48px', height: '48px' }} />
                    </div>
                    <h1>{mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join FocusCore' : 'Reset Password'}</h1>
                    <p className="auth-subtitle">
                        {mode === 'login' ? 'Access your productivity lab' : mode === 'signup' ? 'Start your high-performance journey' : 'Secure your account'}
                    </p>
                </div>

                {error && (
                    <div className="auth-error animate-shake">
                        <div className="error-content">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                        {error.includes('create one') && (
                            <button
                                type="button"
                                className="error-suggestion-btn"
                                onClick={() => {
                                    setMode('signup');
                                    setError(null);
                                }}
                            >
                                Create Account
                            </button>
                        )}
                    </div>
                )}

                {success && (
                    <div className="auth-success">
                        <CheckCircle size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="input-group">
                            <label><Mail size={16} /> Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label><Lock size={16} /> Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div className="remember-me-group">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Remember Me</span>
                            </label>
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <div className="spinner-small"></div> : 'Sign In'} <ArrowRight size={18} />
                        </button>
                        <div className="auth-footer-links">
                            <button type="button" onClick={() => setMode('forgot-password')}>Forgot Password?</button>
                            <button type="button" onClick={() => setMode('signup')}>Create Account</button>
                        </div>
                    </form>
                )}

                {mode === 'signup' && (
                    <form onSubmit={handleSignup} className="auth-form">
                        <div className="input-group">
                            <label><User size={16} /> Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label><Mail size={16} /> Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label><Lock size={16} /> Password</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? <div className="spinner-small"></div> : 'Create Account'} <ArrowRight size={18} />
                        </button>
                        <div className="auth-footer-links">
                            <button type="button" onClick={() => setMode('login')}>Back to Login</button>
                        </div>
                    </form>
                )}

                {mode === 'forgot-password' && (
                    <div className="auth-form">
                        {forgotStep === 'email' && (
                            <form onSubmit={handleRequestCode}>
                                <div className="input-group">
                                    <label><Mail size={16} /> Recover Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                                <button type="submit" className="auth-submit-btn" disabled={loading}>
                                    {loading ? <div className="spinner-small"></div> : 'Send Security Code'} <Key size={18} />
                                </button>
                            </form>
                        )}

                        {forgotStep === 'code' && (
                            <form onSubmit={handleVerifyCode}>
                                <div className="input-group">
                                    <label><Key size={16} /> Enter 6-Digit Code</label>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <button type="submit" className="auth-submit-btn">
                                    Verify Code <CheckCircle size={18} />
                                </button>
                            </form>
                        )}

                        {forgotStep === 'reset' && (
                            <form onSubmit={handleResetPassword}>
                                <div className="input-group">
                                    <label><Lock size={16} /> New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <button type="submit" className="auth-submit-btn" disabled={loading}>
                                    {loading ? <div className="spinner-small"></div> : 'Update Password'} <ArrowRight size={18} />
                                </button>
                            </form>
                        )}

                        <div className="auth-footer-links">
                            <button type="button" onClick={() => setMode('login')} className="back-link">
                                <ArrowLeft size={16} /> Back to Login
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-primary);
          background-image: 
            radial-gradient(circle at 20% 20%, rgba(0, 240, 255, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(123, 44, 191, 0.05) 0%, transparent 40%);
          padding: 1.5rem;
        }

        .auth-glass-card {
          width: 100%;
          max-width: 440px;
          background: var(--color-bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--color-border);
          border-radius: 2rem;
          padding: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          width: 64px;
          height: 64px;
          background: var(--color-primary);
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: var(--color-primary-fg);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
        }

        .auth-header h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }

        .auth-subtitle {
          color: var(--color-text-secondary);
          font-size: 0.95rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .input-group input {
          background: rgba(var(--color-text-primary-rgb, 0, 0, 0), 0.03);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 0.8rem 1rem;
          color: var(--color-text-primary);
          font-size: 1rem;
          transition: all 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--color-primary);
          background: rgba(var(--color-text-primary-rgb, 0, 0, 0), 0.05);
          box-shadow: 0 0 0 4px rgba(0, 240, 255, 0.1);
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

        .remember-me-group {
          margin-top: -0.5rem;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          user-select: none;
        }

        .checkbox-container input {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

        .auth-submit-btn {
          background: var(--color-primary);
          color: var(--color-primary-fg);
          border: none;
          border-radius: 0.75rem;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 15px -3px rgba(0, 240, 255, 0.2);
        }

        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 240, 255, 0.3);
          filter: brightness(1.1);
        }

        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          border-left: 4px solid var(--color-danger);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: var(--color-danger);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .error-suggestion-btn {
          background: var(--color-danger);
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 0.4rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          align-self: flex-start;
          transition: filter 0.2s;
        }

        .error-suggestion-btn:hover {
          filter: brightness(1.2);
        }

        .auth-success {
          background: rgba(16, 185, 129, 0.1);
          border-left: 4px solid var(--color-success);
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: var(--color-success);
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .auth-footer-links {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
        }

        .auth-footer-links button {
          background: none;
          border: none;
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }

        .auth-footer-links button:hover {
          color: var(--color-primary);
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
};
