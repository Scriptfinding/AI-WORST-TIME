import { useEffect, type RefObject } from 'react';

interface UseFocusWhenOptions<T extends HTMLElement> {
    ref: RefObject<T | null>;
    when: boolean;
    select?: boolean;
}

type SelectableElement = HTMLInputElement | HTMLTextAreaElement;

// Focuses a referenced element when a condition becomes true, optionally selecting its text.
export function useFocusWhen<T extends HTMLElement>({
    ref,
    when,
    select = false,
}: UseFocusWhenOptions<T>) {
    useEffect(() => {
        if (!when || !ref.current) return;

        ref.current.focus();
        if (select && isSelectableElement(ref.current)) {
            ref.current.select();
        }
    }, [ref, select, when]);
}

function isSelectableElement(element: HTMLElement): element is SelectableElement {
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
}
