import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';

interface Countdown {
    countdown: number;
    setCountdown: Dispatch<SetStateAction<number>>;
    resetCountdown: () => void;
}

// Runs a one-second countdown while exposing controls to update or restart it.
export function useCountdown(initialSeconds: number | (() => number)): Countdown {
    const [countdown, setCountdown] = useState(initialSeconds);
    const initialCountdown = useRef(countdown);

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = window.setTimeout(() => {
            setCountdown(seconds => Math.max(0, seconds - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [countdown]);

    const resetCountdown = useCallback(() => {
        setCountdown(initialCountdown.current);
    }, []);

    return { countdown, setCountdown, resetCountdown };
}
