import type { TabKey } from '@/Domains/Flow/Pages/FlowEditor/types';
import { VALID_TABS } from '@/Domains/Flow/Pages/FlowEditor/types';

export function getTabFromHash(): TabKey {
    const hash = window.location.hash.replace('#', '') as TabKey;
    if (VALID_TABS.includes(hash)) return hash;
    const stored = localStorage.getItem('flow-editor-tab') as TabKey | null;
    return stored && VALID_TABS.includes(stored) ? stored : 'code';
}
