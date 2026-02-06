import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../db/db';

type TimerMode = 'focus' | 'short' | 'long';

interface TimerContextType {
    timeLeft: number;
    isActive: boolean;
    mode: TimerMode;
    customFocusMin: number;
    toggleTimer: () => void;
    resetTimer: () => void;
    setModeDuration: (mode: TimerMode, customDuration?: number) => void;
    setCustomFocusMin: (min: number) => void;
    saveCustomTime: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<TimerMode>('focus');
    const [customFocusMin, setCustomFocusMinState] = useState(25);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('customFocusMin');
        if (stored) setCustomFocusMinState(parseInt(stored));
    }, []);

    const setCustomFocusMin = (min: number) => {
        setCustomFocusMinState(min);
        localStorage.setItem('customFocusMin', min.toString());
        if (mode === 'focus') {
            setTimeLeft(min * 60);
            setIsActive(false);
        }
    };

    const handleTimerComplete = async () => {
        if (mode === 'focus') {
            try {
                await db.studySessions.add({
                    duration: customFocusMin * 60,
                    timestamp: new Date(),
                    tag: 'Focus Session'
                });
            } catch (e) {
                console.error("Failed to save session", e);
            }
        }
        playAlarm();
    };

    const playAlarm = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.connect(audioContext.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 1000);
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            if (isActive) {
                setIsActive(false);
                handleTimerComplete();
            }
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = useCallback(() => setIsActive(prev => !prev), []);

    const resetTimer = useCallback(() => {
        setIsActive(false);
        if (mode === 'focus') setTimeLeft(customFocusMin * 60);
        else if (mode === 'short') setTimeLeft(5 * 60);
        else if (mode === 'long') setTimeLeft(15 * 60);
    }, [mode, customFocusMin]);

    const setModeDuration = useCallback((m: TimerMode, customDuration?: number) => {
        setMode(m);
        setIsActive(false);
        if (customDuration) {
            setTimeLeft(customDuration * 60);
            return;
        }
        switch (m) {
            case 'focus': setTimeLeft(customFocusMin * 60); break;
            case 'short': setTimeLeft(5 * 60); break;
            case 'long': setTimeLeft(15 * 60); break;
        }
    }, [customFocusMin]);

    const saveCustomTime = useCallback(() => {
        if (mode === 'focus') {
            setTimeLeft(customFocusMin * 60);
        }
    }, [mode, customFocusMin]);

    return (
        <TimerContext.Provider value={{
            timeLeft,
            isActive,
            mode,
            customFocusMin,
            toggleTimer,
            resetTimer,
            setModeDuration,
            setCustomFocusMin,
            saveCustomTime
        }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) throw new Error('useTimer must be used within a TimerProvider');
    return context;
};
