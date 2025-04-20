import React, { useState, useEffect, useCallback } from 'react';
import './CountdownTimer.css'
interface CountdownTimerProps {
    startTime?: string; // Format: "MM:SS" or "HH:MM:SS"
    onComplete: () => void;
    onStart: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
                                                           startTime = "59:59",
                                                           onComplete, onStart
                                                       }) => {
    // Parse the initial time
    const parseTime = useCallback((timeString: string): number => {
        const parts = timeString.split(':');
        let totalSeconds = 0;

        if (parts.length === 3) {
            // Format: HH:MM:SS
            totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        } else if (parts.length === 2) {
            // Format: MM:SS
            totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }

        return totalSeconds;
    }, []);

    const [timeLeft, setTimeLeft] = useState<number>(parseTime(startTime));
    const [isRunning, setIsRunning] = useState<boolean>(false);

    // Format seconds to MM:SS or HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let timer: number | null = null;

        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        setIsRunning(false);
                        if (onComplete) {
                            onComplete();
                        }
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [isRunning, timeLeft, onComplete]);

    const handleStart = () => {
        if (timeLeft === 0) {
            // Reset timer if it reached zero
            setTimeLeft(parseTime(startTime));
        }
        setIsRunning(true);
        onStart()
    };

    return (
        <div className="countdown-timer">
            <div className="timer-display">
                {formatTime(timeLeft)}
            </div>
            <div className="timer-controls">
                {!isRunning && (
                    <button onClick={handleStart} className="control-button start-button">
                        Start
                    </button>
                ) }
            </div>
        </div>
    );
};

export default CountdownTimer;