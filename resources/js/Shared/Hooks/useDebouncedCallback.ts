import { useCallback, useEffect, useMemo, useRef } from 'react';

type DebouncedCallback<Args extends unknown[]> = ((...args: Args) => void) & {
    cancel: () => void;
};

// Returns a cancellable callback that postpones execution until calls have settled.
export function useDebouncedCallback<Args extends unknown[]>(
    callback: (...args: Args) => void,
    delay: number
): DebouncedCallback<Args> {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    callbackRef.current = callback;

    const cancel = useCallback(() => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
    }, []);

    const debouncedCallback = useCallback((...args: Args) => {
        cancel();
        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = undefined;
            callbackRef.current(...args);
        }, delay);
    }, [cancel, delay]);

    useEffect(() => cancel, [cancel]);

    return useMemo(
        () => Object.assign(debouncedCallback, { cancel }),
        [cancel, debouncedCallback]
    );
}
