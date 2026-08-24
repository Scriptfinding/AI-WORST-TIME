import { useEffect } from 'react';

interface BodyScrollSnapshot {
    body: HTMLElement;
    overflow: string;
    position: string;
    top: string;
    width: string;
    scrollY: number;
}

const activeLocks = new Set<symbol>();
let snapshot: BodyScrollSnapshot | null = null;

function lockBodyScroll(lockId: symbol) {
    if (activeLocks.has(lockId)) return;

    if (activeLocks.size === 0) {
        const body = document.body;
        snapshot = {
            body,
            overflow: body.style.overflow,
            position: body.style.position,
            top: body.style.top,
            width: body.style.width,
            scrollY: window.scrollY,
        };

        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${snapshot.scrollY}px`;
        body.style.width = '100%';
    }

    activeLocks.add(lockId);
}

function unlockBodyScroll(lockId: symbol) {
    if (!activeLocks.delete(lockId) || activeLocks.size > 0 || !snapshot) return;

    const { body, overflow, position, top, width, scrollY } = snapshot;
    snapshot = null;

    body.style.overflow = overflow;
    body.style.position = position;
    body.style.top = top;
    body.style.width = width;
    window.scrollTo(0, scrollY);
}

// Prevents background scrolling while preserving nested locks and the original scroll position.
export function useBodyScrollLock(isLocked: boolean) {
    useEffect(() => {
        if (!isLocked || typeof document === 'undefined' || typeof window === 'undefined') return;

        const lockId = Symbol('body-scroll-lock');
        lockBodyScroll(lockId);

        return () => {
            unlockBodyScroll(lockId);
        };
    }, [isLocked]);
}
