import { useState, useEffect } from 'react';

export default function useCountdown(initialSeconds = 60) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (seconds <= 0) return;

        const timer = setInterval(() => {
            setSeconds((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds]);

    const startCountdown = () => setSeconds(initialSeconds);

    return { seconds, startCountdown };
}