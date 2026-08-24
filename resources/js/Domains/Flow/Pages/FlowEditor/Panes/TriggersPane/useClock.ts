import { useEffect, useState } from 'react';

function formatTime(date: Date, timezone: string): string {
    return date.toLocaleString(undefined, {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Produces a live clock string in the timezone shown by TriggersPane.
export function useClock(timezone: string): string {
    const [time, setTime] = useState(() => formatTime(new Date(), timezone));

    useEffect(() => {
        setTime(formatTime(new Date(), timezone));
        const intervalId = setInterval(() => setTime(formatTime(new Date(), timezone)), 30_000);
        return () => clearInterval(intervalId);
    }, [timezone]);

    return time;
}
