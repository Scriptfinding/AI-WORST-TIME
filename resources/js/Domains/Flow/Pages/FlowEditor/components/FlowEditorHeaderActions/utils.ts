import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';

type FlowVisibility = FlowEditorProps['flow']['visibility'];

export function getVisibilityIcon(visibility: FlowVisibility): string {
    if (visibility === 'owner') return 'lucide:user';
    if (visibility === 'team') return 'lucide:users';
    return 'lucide:building-2';
}

export function getVisibilityLabel(visibility: FlowVisibility): string {
    if (visibility === 'owner') return 'Owner';
    if (visibility === 'team') return 'Team';
    return 'Workspace';
}
