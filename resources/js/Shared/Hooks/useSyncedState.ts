import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

// Provides editable local state that resets whenever its source value changes.
export function useSyncedState<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => value);

    useEffect(() => {
        setState(() => value);
    }, [value]);

    return [state, setState];
}
