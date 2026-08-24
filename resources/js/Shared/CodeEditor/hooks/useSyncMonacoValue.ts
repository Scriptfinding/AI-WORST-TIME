import { useEffect, type RefObject } from 'react';

interface MonacoValueTarget {
    getValue: () => string;
    setValue: (value: string) => void;
}

interface UseSyncMonacoValueOptions {
    isInternalChange?: RefObject<boolean>;
    isProgrammaticChange?: RefObject<boolean>;
}

// Synchronizes an external value into Monaco without echoing editor-originated changes.
export function useSyncMonacoValue<T extends MonacoValueTarget>(
    targetRef: RefObject<T | null>,
    value: string,
    {
        isInternalChange,
        isProgrammaticChange,
    }: UseSyncMonacoValueOptions = {},
) {
    useEffect(() => {
        if (isInternalChange?.current) {
            isInternalChange.current = false;
            return;
        }

        const target = targetRef.current;
        if (target && target.getValue() !== value) {
            if (isProgrammaticChange) isProgrammaticChange.current = true;
            target.setValue(value);
            if (isProgrammaticChange) isProgrammaticChange.current = false;
        }
    }, [isInternalChange, isProgrammaticChange, targetRef, value]);
}
