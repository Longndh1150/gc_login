import { useEffect, useRef } from 'react';

export default function useIdleTimer(timeoutMs, onIdle) {
    const timeoutRef = useRef(null);

    const resetTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(onIdle, timeoutMs);
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        resetTimer();

        const handleEvent = () => resetTimer();

        events.forEach(event => {
            window.addEventListener(event, handleEvent);
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleEvent);
            });
        };
    }, [timeoutMs, onIdle]);
}