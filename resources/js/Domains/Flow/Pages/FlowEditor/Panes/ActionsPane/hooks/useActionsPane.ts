import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { useAuth } from '@/App/Hooks/usePageProps';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { ADMIN_TRANSFER_WARNING, canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import type { FlowAction, WebhookHeader } from '@/Domains/Flow/types';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { PageProps } from '@/App/types';
import { collectGroups, createDuplicateLabel } from '@/Domains/Flow/Pages/FlowEditor/Panes/resourceUtils';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { ActionFormData } from '@/Domains/Flow/Pages/FlowEditor/Panes/ActionsPane/types';

const EMPTY_FORM: ActionFormData = {
    label: '',
    url: '',
    secret: '',
    fire_on_error: false,
    export_artifacts_screenshots: null,
    export_artifacts_downloads: null,
    export_artifacts_recording: null,
};

interface UseActionsPaneOptions {
    flowId: Id;
    actions: FlowAction[];
    groups: string[];
}

// Supplies ActionsPane with grouped actions and modal, reorder, and deletion controls.
export default function useActionsPane({ flowId, actions, groups }: UseActionsPaneOptions) {
    const { settings } = usePage<PageProps>().props;
    const [showModal, setShowModal] = useState(false);
    const {
        selectedItem: editing,
        openModal: openEditing,
        closeModal: closeEditing,
    } = useUrlSyncedModal(actions, 'edit-action');
    const initializedEditingId = useRef<Id | null>(null);
    const [headers, setHeaders] = useState<WebhookHeader[]>([]);
    const [scope, setScope] = useState<IntegrationScope>('owner');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [ownerId, setOwnerId] = useState<Id | null>(null);
    const [targetUserRole, setTargetUserRole] = useState<string | undefined>(undefined);
    const [group, setGroup] = useState('');
    const { confirm, ConfirmModal } = useConfirm();
    const { user } = useAuth();
    const form = useForm<ActionFormData>(EMPTY_FORM);

    const recordingEnabled = settings.recording_enabled ?? false;
    const allGroups = useMemo(() => collectGroups(groups, actions), [groups, actions]);
    const currentUserId = user?.id ?? '';
    const currentUserWorkspaceRole = (
        user as typeof user & { workspace_role?: 'admin' | 'manager' | 'member' }
    )?.workspace_role ?? 'member';
    const ownershipDisabled = editing ? !canEditOwnership({
        currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: editing.user_id,
        ownerWorkspaceRole: editing.owner_workspace_role,
    }) : false;

    const openCreate = () => {
        closeEditing();
        initializedEditingId.current = null;
        form.setData(EMPTY_FORM);
        setHeaders([]);
        setScope('owner');
        setTeamId(null);
        setOwnerId(null);
        setTargetUserRole(undefined);
        setGroup('');
        form.clearErrors();
        setShowModal(true);
    };

    const hydrateEditForm = (action: FlowAction) => {
        initializedEditingId.current = action.id;
        const config = action.config || {};
        form.setData({
            label: action.label,
            url: config.url || '',
            secret: config.secret || '',
            fire_on_error: action.fire_on_error,
            export_artifacts_screenshots: action.export_artifacts_screenshots,
            export_artifacts_downloads: action.export_artifacts_downloads,
            export_artifacts_recording: action.export_artifacts_recording,
        });
        setHeaders(config.headers || []);
        setScope(action.scope || 'owner');
        setTeamId(action.team_id);
        setOwnerId(action.user_id);
        setTargetUserRole(action.owner_workspace_role);
        setGroup(action.group || '');
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (action: FlowAction) => {
        openEditing(action);
        hydrateEditForm(action);
    };

    const closeModal = () => {
        setShowModal(false);
        initializedEditingId.current = null;
        closeEditing();
    };

    useEffect(() => {
        if (editing && initializedEditingId.current !== editing.id) {
            hydrateEditForm(editing);
        }
    }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const payload: Record<string, unknown> = {
            type: 'webhook' as const,
            label: form.data.label,
            group: group || null,
            config: {
                url: form.data.url,
                secret: form.data.secret || null,
                headers: headers.filter(header => header.key),
            },
            fire_on_error: form.data.fire_on_error,
            scope,
            team_id: scope === 'team' ? teamId : null,
            export_artifacts_screenshots: form.data.export_artifacts_screenshots,
            export_artifacts_downloads: form.data.export_artifacts_downloads,
            export_artifacts_recording: form.data.export_artifacts_recording,
        };

        if (editing && ownerId && ownerId !== editing.user_id) {
            payload.user_id = ownerId;
        }

        if (editing && ownerId && ownerId !== editing.user_id && ownerId !== user?.id) {
            let adminTransferWarned = false;
            if (currentUserWorkspaceRole === 'manager' && targetUserRole === 'admin') {
                const confirmed = await confirm({
                    title: 'Transfer ownership',
                    message: ADMIN_TRANSFER_WARNING,
                    confirmLabel: 'Transfer anyway',
                    variant: 'danger',
                });
                if (!confirmed) return;
                adminTransferWarned = true;
            }
            if (!adminTransferWarned && scope === 'owner') {
                const confirmed = await confirm({
                    title: 'Transfer ownership',
                    message: 'This action has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                    confirmLabel: 'Transfer anyway',
                    variant: 'danger',
                });
                if (!confirmed) return;
            }
        }

        if (editing) {
            router.put(`/actions/${editing.id}`, payload as Parameters<typeof router.put>[1], {
                preserveState: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            router.post(`/flows/${flowId}/actions`, payload as Parameters<typeof router.post>[1], {
                preserveState: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const handleToggleActive = (action: FlowAction) => {
        router.put(`/actions/${action.id}`, { is_active: !action.is_active }, {
            preserveState: true,
        });
    };

    const handleDelete = async (action: FlowAction) => {
        const confirmed = await confirm({
            title: 'Delete Action',
            message: `Are you sure you want to delete "${action.label}"? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;
        router.delete(`/actions/${action.id}`, { preserveState: true });
    };

    const handleDuplicate = (action: FlowAction) => {
        router.post(`/flows/${flowId}/actions`, {
            type: 'webhook',
            label: createDuplicateLabel(action.label, actions),
            group: action.group,
            config: action.config || {},
            fire_on_error: action.fire_on_error,
            is_active: action.is_active,
            scope: action.scope,
            team_id: action.team_id,
            export_artifacts_screenshots: action.export_artifacts_screenshots,
            export_artifacts_downloads: action.export_artifacts_downloads,
            export_artifacts_recording: action.export_artifacts_recording,
        } as Parameters<typeof router.post>[1], {
            preserveState: true,
        });
    };

    const handleScopeChange = (newScope: IntegrationScope, newTeamId: Id | null) => {
        setScope(newScope);
        setTeamId(newTeamId);
    };

    return {
        allGroups,
        editing,
        form,
        group,
        handleDelete,
        handleDuplicate,
        handleScopeChange,
        handleSubmit,
        handleToggleActive,
        headers,
        openCreate,
        openEdit,
        ownerId: ownerId,
        ownershipDisabled,
        recordingEnabled,
        scope,
        setGroup,
        setHeaders,
        setOwnerId: setOwnerId,
        closeModal,
        setTargetUserRole,
        showModal,
        teamId,
        confirm,
        ConfirmModal,
    };
}
