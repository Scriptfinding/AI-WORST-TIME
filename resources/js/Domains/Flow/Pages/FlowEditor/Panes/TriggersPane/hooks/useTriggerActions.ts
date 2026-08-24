import { useMemo } from 'react';
import { router } from '@inertiajs/react';
import type { FlowTrigger } from '@/Domains/Flow/types';
import type { useToast } from '@/App/Hooks/useToast';
import type { useConfirm } from '@/Shared/Hooks/useConfirm';
import { collectGroups, createDuplicateLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/resourceUtils';

type Confirm = ReturnType<typeof useConfirm>['confirm'];
type Toast = ReturnType<typeof useToast>['toast'];

interface UseTriggerActionsOptions {
    flowId: Id;
    triggers: FlowTrigger[];
    groups: string[];
    confirm: Confirm;
    toast: Toast;
}

// Handles trigger activation, deletion, and endpoint-copy actions.
export function useTriggerActions({
    flowId,
    triggers,
    groups,
    confirm,
    toast,
}: UseTriggerActionsOptions) {
    const allGroups = useMemo(() => collectGroups(groups, triggers), [groups, triggers]);

    const handleToggleActive = (trigger: FlowTrigger) => {
        router.put(`/triggers/${trigger.id}`, { is_active: !trigger.is_active }, {
            preserveState: true,
        });
    };

    const handleDelete = async (trigger: FlowTrigger) => {
        const confirmed = await confirm({
            title: 'Delete Trigger',
            message: `Are you sure you want to delete "${trigger.label}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;
        router.delete(`/triggers/${trigger.id}`, { preserveState: true });
    };

    const handleDuplicate = (trigger: FlowTrigger) => {
        router.post(`/flows/${flowId}/triggers`, {
            type: trigger.type,
            label: createDuplicateLabel(trigger.label, triggers),
            group: trigger.group,
            config: trigger.config || {},
            input_template: trigger.input_template,
            is_active: trigger.is_active,
            scope: trigger.scope,
            team_id: trigger.team_id,
        } as Parameters<typeof router.post>[1], {
            preserveState: true,
        });
    };

    const copyEndpoint = (trigger: FlowTrigger) => {
        if (!trigger.endpoint_url) return;

        navigator.clipboard.writeText(trigger.endpoint_url)
            .then(() => toast('Copied to clipboard'))
            .catch(() => toast('Unable to copy endpoint', 'error'));
    };

    return {
        allGroups,
        copyEndpoint,
        handleDelete,
        handleDuplicate,
        handleToggleActive,
    };
}
