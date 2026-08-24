import { useCallback, useState } from 'react';
import type { VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { useToast } from '@/App/Hooks/useToast';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { DuplicateFlowErrors } from '@/Domains/Flow/Pages/FlowEditor/components/DuplicateFlowModal/DuplicateFlowModal';

interface UseDuplicateFlowOptions {
    flow: FlowEditorProps['flow'];
    teamTrees: NonNullable<FlowEditorProps['teamTrees']>;
    toast: ReturnType<typeof useToast>['toast'];
}

const getInitialDuplicateVisibility = (flow: FlowEditorProps['flow']): VisibilityPickerValue => ({
    visibility: flow.visibility,
    personalFolderId: flow.visibility === 'owner' ? flow.folder_id : null,
    wsFolderId: flow.visibility === 'workspace' ? flow.workspace_folder_id : null,
    teamId: flow.visibility === 'team' ? flow.team_id : null,
    teamFolderId: flow.visibility === 'team' ? flow.workspace_folder_id : null,
});

// Duplicates the current flow into a chosen workspace folder.
export function useDuplicateFlow({ flow, teamTrees, toast }: UseDuplicateFlowOptions) {
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicatingFlow, setDuplicatingFlow] = useState(false);
    const [duplicateErrors, setDuplicateErrors] = useState<DuplicateFlowErrors>({});
    const [duplicateForm, setDuplicateForm] = useState({
        name: `${flow.name} (copy)`,
        description: flow.description || '',
    });
    const [duplicateVisibility, setDuplicateVisibility] = useState<VisibilityPickerValue>(() => getInitialDuplicateVisibility(flow));

    const openDuplicateModal = useCallback(() => {
        setDuplicateForm({
            name: `${flow.name} (copy)`,
            description: flow.description || '',
        });
        setDuplicateVisibility(getInitialDuplicateVisibility(flow));
        setDuplicateErrors({});
        setShowDuplicateModal(true);
    }, [flow]);

    const closeDuplicateModal = useCallback(() => {
        if (!duplicatingFlow) {
            setShowDuplicateModal(false);
        }
    }, [duplicatingFlow]);

    const submitDuplicateFlow = useCallback(async () => {
        const selectedTeam = teamTrees.find(team => team.id === duplicateVisibility.teamId);
        const payload: Record<string, unknown> = {
            name: duplicateForm.name.trim(),
            description: duplicateForm.description,
            visibility: duplicateVisibility.visibility,
        };

        if (duplicateVisibility.visibility === 'owner') {
            payload.folder_id = duplicateVisibility.personalFolderId;
        } else if (duplicateVisibility.visibility === 'workspace') {
            payload.workspace_folder_id = duplicateVisibility.wsFolderId;
        } else {
            payload.team_id = duplicateVisibility.teamId;
            payload.workspace_folder_id = duplicateVisibility.teamFolderId ?? selectedTeam?.root_folder_id ?? null;
        }

        if (!payload.name) {
            setDuplicateErrors({ name: 'Name is required.' });
            return;
        }

        const newWindow = window.open('about:blank', '_blank');
        setDuplicatingFlow(true);
        setDuplicateErrors({});

        try {
            const response = await fetch(`/flows/${flow.id}/duplicate`, {
                method: 'POST',
                headers: {
                    ...csrfHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!response.ok) {
                newWindow?.close();
                if (data?.errors) setDuplicateErrors(data.errors as DuplicateFlowErrors);
                toast(data?.message || 'Error duplicating flow', 'error');
                return;
            }

            if (newWindow) {
                newWindow.location.href = data.url;
            } else if (data.url) {
                window.open(data.url, '_blank');
            }

            toast('Flow duplicated');
            setShowDuplicateModal(false);
        } catch {
            newWindow?.close();
            toast('Error duplicating flow', 'error');
        } finally {
            setDuplicatingFlow(false);
        }
    }, [duplicateForm.description, duplicateForm.name, duplicateVisibility, flow.id, teamTrees, toast]);

    return {
        showDuplicateModal,
        duplicatingFlow,
        duplicateErrors,
        duplicateForm,
        duplicateVisibility,
        openDuplicateModal,
        closeDuplicateModal,
        submitDuplicateFlow,
        setDuplicateForm,
        setDuplicateVisibility,
    };
}
