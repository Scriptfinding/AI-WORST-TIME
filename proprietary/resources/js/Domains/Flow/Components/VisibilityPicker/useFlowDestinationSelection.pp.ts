import { useEffect, useState } from 'react';
import type { Visibility, VisibilityPickerValue } from './types.pp';

interface UseFlowDestinationSelectionOptions {
    isOpen: boolean;
    currentScope: Visibility;
    currentFolderId: Id | null;
    currentTeamId?: Id | null;
    defaultScope?: Visibility;
    defaultFolderId?: Id | null;
}

function buildSelection({
    currentScope,
    currentFolderId,
    currentTeamId = null,
    defaultScope = currentScope,
    defaultFolderId = currentFolderId,
}: Omit<UseFlowDestinationSelectionOptions, 'isOpen'>): VisibilityPickerValue {
    return {
        visibility: defaultScope,
        personalFolderId: defaultScope === 'owner' ? defaultFolderId : null,
        wsFolderId: defaultScope === 'workspace' ? defaultFolderId : null,
        teamId: defaultScope === 'team' ? currentTeamId : null,
        teamFolderId: defaultScope === 'team' ? defaultFolderId : null,
    };
}

// Maintains a destination selection initialized from the flow's current visibility and folder.
export function useFlowDestinationSelection({
    isOpen,
    currentScope,
    currentFolderId,
    currentTeamId = null,
    defaultScope = currentScope,
    defaultFolderId = currentFolderId,
}: UseFlowDestinationSelectionOptions) {
    const [value, setValue] = useState<VisibilityPickerValue>(() => buildSelection({
        currentScope,
        currentFolderId,
        currentTeamId,
        defaultScope,
        defaultFolderId,
    }));

    useEffect(() => {
        setValue(buildSelection({
            currentScope,
            currentFolderId,
            currentTeamId,
            defaultScope,
            defaultFolderId,
        }));
    }, [isOpen, currentScope, currentFolderId, currentTeamId, defaultScope, defaultFolderId]);

    return [value, setValue] as const;
}
