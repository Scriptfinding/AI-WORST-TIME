import { useEffect, useRef, useState, type FormEvent } from 'react';
import { router, useForm } from '@inertiajs/react';
import type { FlowTrigger } from '@/Domains/Flow/types';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { useConfirm } from '@/Shared/Hooks/useConfirm';
import { ADMIN_TRANSFER_WARNING, canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import { useAuth } from '@/App/Hooks/usePageProps';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import type { TriggerFormData, TriggerType } from '../types';
import { CRON_PRESETS, hasInputTemplateData } from '../utils';

type Confirm = ReturnType<typeof useConfirm>['confirm'];

interface UseTriggerFormModalOptions {
    flowId: Id;
    triggers: FlowTrigger[];
    currentUserId: Id;
    currentUserWorkspaceRole: 'admin' | 'manager' | 'member';
    confirm: Confirm;
}

const DEFAULT_CRON_EXPRESSION = '0 0 * * *';

// Manages trigger form state, validation, and create-or-update submission.
export function useTriggerFormModal({
    flowId,
    triggers,
    currentUserId,
    currentUserWorkspaceRole,
    confirm,
}: UseTriggerFormModalOptions) {
    const [showModal, setShowModal] = useState(false);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const {
        selectedItem: editing,
        openModal: openEditing,
        closeModal: closeEditing,
    } = useUrlSyncedModal(triggers, 'edit-trigger');
    const initializedEditingId = useRef<Id | null>(null);
    const [showInputTemplate, setShowInputTemplate] = useState(false);
    const [scope, setScope] = useState<IntegrationScope>('owner');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [ownerId, setOwnerId] = useState<Id | null>(null);
    const [targetUserRole, setTargetUserRole] = useState<string>();
    const [group, setGroup] = useState('');
    const { user } = useAuth();
    const form = useForm<TriggerFormData>({
        type: 'webhook',
        label: '',
        input_template: '{}',
        merge_post_data: true,
        cron_expression: DEFAULT_CRON_EXPRESSION,
        cron_preset: DEFAULT_CRON_EXPRESSION,
    });
    const ownershipDisabled = editing ? !canEditOwnership({
        currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: editing.user_id,
        ownerWorkspaceRole: editing.owner_workspace_role,
    }) : false;

    const resetOwnership = () => {
        setScope('owner');
        setTeamId(null);
        setOwnerId(null);
        setTargetUserRole(undefined);
        setGroup('');
    };

    const openCreateWithType = (type: TriggerType) => {
        setShowTypePicker(false);
        closeEditing();
        initializedEditingId.current = null;
        setShowInputTemplate(false);
        resetOwnership();
        form.setData({
            type,
            label: '',
            input_template: '{}',
            merge_post_data: type === 'webhook',
            cron_expression: DEFAULT_CRON_EXPRESSION,
            cron_preset: DEFAULT_CRON_EXPRESSION,
        });
        form.clearErrors();
        setShowModal(true);
    };

    const hydrateEditForm = (trigger: FlowTrigger) => {
        initializedEditingId.current = trigger.id;
        const config = trigger.config as {
            cron_expression?: string;
            merge_post_data?: boolean;
        } | null;
        const cronExpression = config?.cron_expression || DEFAULT_CRON_EXPRESSION;
        const hasInputTemplate = hasInputTemplateData(trigger.input_template);

        setShowInputTemplate(hasInputTemplate);
        setScope(trigger.scope || 'owner');
        setTeamId(trigger.team_id);
        setOwnerId(trigger.user_id);
        setTargetUserRole(trigger.owner_workspace_role);
        setGroup(trigger.group || '');
        form.setData({
            type: trigger.type,
            label: trigger.label,
            input_template: hasInputTemplate ? JSON.stringify(trigger.input_template, null, 2) : '{}',
            merge_post_data: !!config?.merge_post_data,
            cron_expression: cronExpression,
            cron_preset: CRON_PRESETS.some(preset => preset.value === cronExpression)
                ? cronExpression
                : 'custom',
        });
        form.clearErrors();
        setShowModal(true);
    };

    const openEdit = (trigger: FlowTrigger) => {
        openEditing(trigger);
        hydrateEditForm(trigger);
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

    const confirmOwnershipTransfer = async () => {
        if (!editing || !ownerId || ownerId === editing.user_id || ownerId === user?.id) return true;
        if (currentUserWorkspaceRole === 'manager' && targetUserRole === 'admin') {
            return confirm({
                title: 'Transfer ownership',
                message: ADMIN_TRANSFER_WARNING,
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }
        if (scope === 'owner') {
            return confirm({
                title: 'Transfer ownership',
                message: 'This trigger has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }
        return true;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        let inputTemplate: Record<string, unknown> | null = null;
        if (showInputTemplate) {
            try {
                const parsed = JSON.parse(form.data.input_template);
                inputTemplate = typeof parsed === 'object' && parsed !== null ? parsed : null;
            } catch {
                return;
            }
        }
        const config: Record<string, unknown> = form.data.type === 'webhook'
            ? { merge_post_data: form.data.merge_post_data }
            : { cron_expression: form.data.cron_expression };
        const payload: Record<string, unknown> = {
            type: form.data.type,
            label: form.data.label,
            group: group || null,
            input_template: inputTemplate,
            config,
            scope,
            team_id: scope === 'team' ? teamId : null,
        };
        if (editing && ownerId && ownerId !== editing.user_id) payload.user_id = ownerId;
        if (!await confirmOwnershipTransfer()) return;

        const options = {
            preserveState: true,
            onSuccess: () => {
                closeModal();
            },
        };
        if (editing) {
            router.put(`/triggers/${editing.id}`, payload as Parameters<typeof router.put>[1], options);
        } else {
            router.post(`/flows/${flowId}/triggers`, payload as Parameters<typeof router.post>[1], options);
        }
    };

    const handlePresetChange = (preset: string) => {
        form.setData(previous => ({
            ...previous,
            cron_preset: preset,
            cron_expression: preset === 'custom' ? previous.cron_expression : preset,
        }));
    };

    return {
        editing, form, group, handlePresetChange, handleSubmit, openCreateWithType, openEdit,
        ownerId: ownerId, ownershipDisabled, scope, setGroup, setOwnerId: setOwnerId, setScope, setShowInputTemplate,
        closeModal, setShowTypePicker, setTargetUserRole, setTeamId, showInputTemplate,
        showModal, showTypePicker, teamId,
    };
}
