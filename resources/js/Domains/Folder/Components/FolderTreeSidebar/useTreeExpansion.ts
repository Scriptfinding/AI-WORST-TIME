import { useCallback, useState } from 'react';
import type { Breadcrumb, TeamTree, UserTree } from '@/Domains/Folder/types';

const FOLDERS_STORAGE_KEY = 'sidebar_expanded_folders';
const SECTIONS_STORAGE_KEY = 'sidebar_expanded_sections';

function loadExpandedFolders(breadcrumbs: Breadcrumb[]): Set<Id> {
    try {
        const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
        if (raw) {
            const ids: Id[] = JSON.parse(raw);
            const expanded = new Set(ids.filter(id => typeof id === 'string' || typeof id === 'number'));
            breadcrumbs.forEach((breadcrumb) => {
                if (breadcrumb.id) expanded.add(breadcrumb.id);
            });
            return expanded;
        }
    } catch {}

    return new Set(
        breadcrumbs
            .map((breadcrumb) => breadcrumb.id)
            .filter((id): id is Id => id !== null),
    );
}

function loadSectionState(key: string, fallback: boolean): boolean {
    try {
        const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
        if (raw) {
            const state = JSON.parse(raw);
            if (key in state) return state[key];
        }
    } catch {}
    return fallback;
}

function saveSectionState(key: string, value: boolean) {
    try {
        const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : {};
        state[key] = value;
        localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(state));
    } catch {}
}

// Persists expansion state for folder nodes and personal, workspace, and team sections.
export function useTreeExpansion(
    breadcrumbs: Breadcrumb[],
    currentView: string | null,
    currentOwnerId: Id | null,
    teamTrees: TeamTree[],
    userTrees: UserTree[],
) {
    const usersViewActive = currentView === 'users' || currentOwnerId !== null;
    const [expandedFolders, setExpandedFolders] = useState<Set<Id>>(
        () => loadExpandedFolders(breadcrumbs),
    );
    const [personalExpanded, setPersonalExpanded] = useState(
        () => loadSectionState('personal', true),
    );
    const [workspaceExpanded, setWorkspaceExpanded] = useState(
        () => loadSectionState('workspace', currentView === 'workspace'),
    );
    const [usersExpanded, setUsersExpanded] = useState(
        () => loadSectionState('users', false) || usersViewActive,
    );
    const [userSectionsExpanded, setUserSectionsExpanded] = useState<Record<string, boolean>>(() => {
        const state: Record<string, boolean> = {};
        userTrees.forEach((user) => {
            state[user.id] = loadSectionState(`user_${user.id}`, false) || user.id === currentOwnerId;
        });
        return state;
    });
    const [teamSectionsExpanded, setTeamSectionsExpanded] = useState<Record<string, boolean>>(() => {
        const state: Record<string, boolean> = {};
        teamTrees.forEach((team) => {
            state[team.id] = loadSectionState(`team_${team.id}`, false);
        });
        return state;
    });

    const toggleFolder = useCallback((folderId: Id) => {
        setExpandedFolders((previous) => {
            const next = new Set(previous);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            try {
                localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify([...next]));
            } catch {}
            return next;
        });
    }, []);

    const togglePersonal = useCallback(() => {
        setPersonalExpanded((previous) => {
            const next = !previous;
            saveSectionState('personal', next);
            return next;
        });
    }, []);

    const toggleWorkspace = useCallback(() => {
        setWorkspaceExpanded((previous) => {
            const next = !previous;
            saveSectionState('workspace', next);
            return next;
        });
    }, []);

    const toggleUsers = useCallback(() => {
        setUsersExpanded((previous) => {
            const next = !previous;
            saveSectionState('users', next);
            return next;
        });
    }, []);

    const toggleUser = useCallback((userId: Id) => {
        setUserSectionsExpanded((previous) => {
            const next = !(previous[userId] ?? false);
            saveSectionState(`user_${userId}`, next);
            return { ...previous, [userId]: next };
        });
    }, []);

    const toggleTeam = useCallback((teamId: Id) => {
        setTeamSectionsExpanded((previous) => {
            const next = !(previous[teamId] ?? false);
            saveSectionState(`team_${teamId}`, next);
            return { ...previous, [teamId]: next };
        });
    }, []);

    return {
        expandedFolders,
        personalExpanded,
        usersExpanded,
        userSectionsExpanded,
        workspaceExpanded,
        teamSectionsExpanded,
        toggleFolder,
        togglePersonal,
        toggleUsers,
        toggleUser,
        toggleWorkspace,
        toggleTeam,
    };
}
