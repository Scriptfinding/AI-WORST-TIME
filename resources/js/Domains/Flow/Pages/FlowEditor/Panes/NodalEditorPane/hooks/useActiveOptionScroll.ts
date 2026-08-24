import {
    useEffect,
    type Dispatch,
    type RefObject,
    type SetStateAction,
} from 'react';

interface UseActiveOptionScrollOptions<T extends HTMLElement> {
    open: boolean;
    itemsDependency?: unknown;
    queryDependency?: unknown;
    activeIndex: number;
    setActiveIndex: Dispatch<SetStateAction<number>>;
    optionRefs: RefObject<Array<T | null>>;
}

// Resets keyboard option focus and keeps the active option visible in menus.
export function useActiveOptionScroll<T extends HTMLElement>({
    open,
    itemsDependency,
    queryDependency,
    activeIndex,
    setActiveIndex,
    optionRefs,
}: UseActiveOptionScrollOptions<T>) {
    useEffect(() => {
        setActiveIndex(0);
        optionRefs.current = [];
    }, [itemsDependency, optionRefs, queryDependency, setActiveIndex]);

    useEffect(() => {
        if (!open) return;

        optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, open, optionRefs]);
}
