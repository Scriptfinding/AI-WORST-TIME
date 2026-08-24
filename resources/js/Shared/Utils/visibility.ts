export interface VisibilityMeta {
    label: string;
    icon: string;
}

export function formatVisibility(scope: string | undefined): string {
    if (!scope) return '';
    return scope.charAt(0).toUpperCase() + scope.slice(1);
}

export function getVisibilityMeta(
    scope: string | undefined,
    teamName?: string | null,
): VisibilityMeta | null {
    if (scope === 'workspace') {
        return { label: 'Workspace', icon: 'lucide:building-2' };
    }
    if (scope === 'team') {
        return { label: teamName || 'Team', icon: 'lucide:users-round' };
    }
    return null;
}
