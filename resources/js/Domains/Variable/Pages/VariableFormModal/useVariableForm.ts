import { useEffect, useRef, useState, type FormEvent } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { Integration } from '@/Domains/Integration/types';
import type { PageProps } from '@/App/types';
import type { UserVariable } from '@/Domains/Variable/types';
import { ADMIN_TRANSFER_WARNING, canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { VariableSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import type { ConfirmVariableAction, VariableFormData, VariableType, VaultFormPatch } from './types';

const EMPTY_FORM: VariableFormData = {
    key: '',
    value: '',
    type: 'text',
    scope: 'user',
    group: '',
    vault_provider: '',
    vault_integration_id: '',
    vault_vault_id: '',
    vault_vault_name: '',
    vault_item_id: '',
    vault_item_name: '',
    vault_field_label: '',
    vault_field_type: '',
};

function dataForVariable(variable: UserVariable): VariableFormData {
    let type: VariableType = variable.type;
    if (type === 'json') {
        try {
            type = Array.isArray(JSON.parse(variable.value)) ? 'array' : 'object';
        } catch {
            type = 'object';
        }
    }

    return {
        key: variable.key,
        value: variable.value,
        type,
        scope: variable.scope,
        group: variable.group || '',
        vault_provider: variable.vault_provider || '',
        vault_integration_id: variable.vault_integration?.id || '',
        vault_vault_id: variable.vault_vault_id || '',
        vault_vault_name: variable.vault_vault_name || '',
        vault_item_id: variable.vault_item_id || '',
        vault_item_name: variable.vault_item_name || '',
        vault_field_label: variable.vault_field_label || '',
        vault_field_type: variable.vault_field_type || '',
    };
}

interface UseVariableFormOptions {
    editing: UserVariable | null;
    isOpen: boolean;
    onClose: () => void;
    confirm: ConfirmVariableAction;
    onCreated?: (variable: VariableSuggestion) => void;
}

// Hydrates and submits variable fields for both create and edit modes.
export function useVariableForm({ editing, isOpen, onClose, confirm, onCreated }: UseVariableFormOptions) {
    const pageProps = usePage<InertiaPageProps & PageProps & { vaultIntegrations: Integration[] }>().props;
    const { vaultIntegrations = [] } = pageProps;
    const currentUserId = pageProps.auth.user?.id ?? '';
    const currentUserWorkspaceRole = pageProps.auth.user?.workspace_role ?? 'member';
    const [ownerId, setOwnerId] = useState<Id | null>(null);
    const [targetUserRole, setTargetUserRole] = useState<string>();
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [jsonSubmitting, setJsonSubmitting] = useState(false);
    const form = useForm<VariableFormData>(EMPTY_FORM);
    const formRef = useRef(form);
    formRef.current = form;

    useEffect(() => {
        if (!isOpen) return;
        const currentForm = formRef.current;

        if (editing) {
            setOwnerId(editing.user_id);
            setTargetUserRole(editing.owner_workspace_role);
            setTeamId(editing.team_id ?? null);
            currentForm.setData(dataForVariable(editing));
        } else {
            setOwnerId(null);
            setTargetUserRole(undefined);
            setTeamId(null);
            currentForm.setData(EMPTY_FORM);
        }
        currentForm.clearErrors();
        setJsonSubmitting(false);
    }, [editing, isOpen]);

    const ownershipDisabled = editing ? !canEditOwnership({
        currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: editing.user_id,
        ownerWorkspaceRole: editing.owner_workspace_role,
    }) : false;

    const handleTypeChange = (rawValue: string) => {
        if (rawValue.startsWith('vault:')) {
            const provider = rawValue.split(':')[1];
            form.setData(previous => ({
                ...previous,
                type: 'vault',
                vault_provider: provider,
                vault_integration_id: '',
                vault_vault_id: '',
                vault_vault_name: '',
                vault_item_id: '',
                vault_item_name: '',
                vault_field_label: '',
                vault_field_type: '',
                value: '',
            }));
            return;
        }

        form.setData(previous => ({
            ...previous,
            type: rawValue as Exclude<VariableType, 'vault'>,
            ...(
                rawValue === 'object' && previous.type !== 'object'
                    ? { value: '{}' }
                    : rawValue === 'array' && previous.type !== 'array'
                        ? { value: '[]' }
                        : {}
            ),
            vault_provider: '',
            vault_integration_id: '',
            vault_vault_id: '',
            vault_vault_name: '',
            vault_item_id: '',
            vault_item_name: '',
            vault_field_label: '',
            vault_field_type: '',
        }));
    };

    const handleVaultChange = (patch: VaultFormPatch) => {
        form.setData(previous => ({
            ...previous,
            ...(patch.integrationId !== undefined && { vault_integration_id: patch.integrationId }),
            ...(patch.vaultId !== undefined && { vault_vault_id: patch.vaultId }),
            ...(patch.vaultName !== undefined && { vault_vault_name: patch.vaultName }),
            ...(patch.itemId !== undefined && { vault_item_id: patch.itemId }),
            ...(patch.itemName !== undefined && { vault_item_name: patch.itemName }),
            ...(patch.fieldLabel !== undefined && { vault_field_label: patch.fieldLabel }),
            ...(patch.fieldType !== undefined && { vault_field_type: patch.fieldType }),
        }));
    };

    const requestData = () => ({
        ...form.data,
        team_id: form.data.scope === 'team' ? teamId : null,
        ...(ownerId ? { user_id: ownerId } : {}),
    });

    const handleErrors = (errors: Record<string, string>) => {
        Object.entries(errors).forEach(([key, value]) => form.setError(key as keyof VariableFormData, value));
    };

    const submitCreateJson = async () => {
        setJsonSubmitting(true);
        form.clearErrors();

        try {
            const response = await fetch('/variables', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify(requestData()),
            });
            const payload = await response.json().catch(() => ({})) as {
                variable?: VariableSuggestion;
                message?: string;
                errors?: Record<string, string | string[]>;
            };

            if (!response.ok || !payload.variable) {
                Object.entries(payload.errors ?? {}).forEach(([key, error]) => {
                    const message = Array.isArray(error) ? error[0] : error;
                    if (message) form.setError(key as keyof VariableFormData, message);
                });
                if (!payload.errors && payload.message) form.setError('key', payload.message);
                return;
            }

            onCreated?.(payload.variable);
        } catch {
            form.setError('key', 'Unable to create the variable.');
        } finally {
            setJsonSubmitting(false);
        }
    };

    const submitUpdate = () => {
        if (!editing) return;
        router.put(`/variables/${editing.id}`, requestData(), {
            preserveState: true,
            onSuccess: onClose,
            onError: handleErrors,
        });
    };

    const confirmOwnershipTransfer = async () => {
        const originalOwnerId = editing?.user_id ?? null;
        const ownerChanged = ownerId && ownerId !== originalOwnerId && ownerId !== pageProps.auth.user?.id;

        if (currentUserWorkspaceRole === 'manager' && targetUserRole === 'admin' && ownerChanged) {
            return confirm({
                title: 'Transfer ownership',
                message: ADMIN_TRANSFER_WARNING,
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }

        if (ownerChanged && form.data.scope === 'user') {
            return confirm({
                title: 'Transfer ownership',
                message: 'This variable has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }

        return true;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (form.data.type === 'object' || form.data.type === 'array') {
            try {
                const parsed = JSON.parse(form.data.value);
                const valid = form.data.type === 'array'
                    ? Array.isArray(parsed)
                    : parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
                if (!valid) throw new Error('Invalid structured value');
            } catch {
                form.setError('value', `Value must be a valid ${form.data.type}.`);
                return;
            }
        }

        if (!await confirmOwnershipTransfer()) return;

        if (editing) {
            submitUpdate();
            return;
        }

        if (onCreated) {
            await submitCreateJson();
            return;
        }

        router.post('/variables', requestData(), {
            preserveState: true,
            onSuccess: onClose,
            onError: handleErrors,
        });
    };

    return {
        form,
        handleSubmit,
        handleTypeChange,
        handleVaultChange,
        ownerId: ownerId,
        setOwnerId: setOwnerId,
        setTargetUserRole,
        teamId,
        setTeamId,
        ownershipDisabled,
        submitting: form.processing || jsonSubmitting,
        vaultIntegrations,
    };
}
