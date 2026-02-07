import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { TimerProvider } from './context/TimerContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Dashboard } from './features/dashboard/Dashboard';
import { Timetable } from './features/timetable/Timetable';
import { Tasks } from './features/tasks/Tasks';
import { Habits } from './features/habits/Habits';
import { Timer } from './features/timer/Timer';
import { Notes } from './features/notes/Notes';
import { LoginPage } from './features/auth/LoginPage';
import { Settings } from './features/settings/Settings';

function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <TimerProvider>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/timetable" element={<Timetable />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/habits" element={<Habits />} />
                            <Route path="/notes" element={<Notes />} />
                            <Route path="/settings" element={<Settings />} />

                            <Route path="/timer" element={<Timer />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </TimerProvider>
            </AuthProvider>
        </HashRouter>
    );
}

export default App;
