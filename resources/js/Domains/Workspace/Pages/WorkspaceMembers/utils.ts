import type { CSSProperties, MouseEvent } from 'react';
import { formatDate as formatUserDate } from '@/Shared/Utils/formatDate';
import type { MembersTab } from './types';

/**
 * Anchors a position:fixed overflow menu to its trigger button so it is not
 * clipped by the scrollable table wrapper.
 */
export function menuPositionFromEvent(e: MouseEvent<HTMLElement>): CSSProperties {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
    };
}

export function formatDate(value: string | null | undefined) {
    if (!value) return null;
    try {
        return formatUserDate(value, { dateStyle: 'medium' });
    } catch {
        return value;
    }
}

export function getInitialMembersTab(search: string): MembersTab {
    const tab = new URLSearchParams(search).get('tab');
    return tab === 'teams' ? 'teams' : 'users';
}
