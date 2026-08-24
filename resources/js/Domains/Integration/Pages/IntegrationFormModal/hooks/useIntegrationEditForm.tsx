import { useEffect, useState, type FormEvent } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Integration, IntegrationScope } from '@/Domains/Integration/types';
import type { PageProps } from '@/App/types';
import { ADMIN_TRANSFER_WARNING, canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import type { ConnectionResult } from '@/Domains/Integration/Pages/IntegrationFormModal/components/ConnectionValidation/ConnectionValidation';

interface Params {
    integration: Integration;
    onClose: () => void;
}

type UpdatePayload = {
    name?: string;
    scope?: IntegrationScope;
    team_id?: Id | null;
    user_id?: Id;
    config?: Record<string, string>;
};

// Drives integration editing, connection validation, and ownership changes.
export function useIntegrationEditForm({ integration, onClose }: Params) {
    const { auth } = usePage<InertiaPageProps & PageProps>().props;
    const currentUserId = auth.user?.id ?? '';
    const currentUserWorkspaceRole = auth.user?.workspace_role ?? 'member';
    const { confirm, ConfirmModal } = useConfirm();

    const [name, setName] = useState(integration.name);
    const [scope, setScope] = useState<IntegrationScope>(integration.scope ?? 'owner');
    const [teamId, setTeamId] = useState<Id | null>(integration.team_id ?? null);
    const [ownerId, setOwnerId] = useState<Id | null>(integration.user_id);
    const [targetUserRole, setTargetUserRole] = useState<string | undefined>(integration.owner_workspace_role);
    const [config, setConfig] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validResult, setValidResult] = useState<ConnectionResult>(null);
    const [guideOpen, setGuideOpen] = useState(false);

    const ownershipDisabled = integration.is_readonly || !canEditOwnership({
        currentUserId,
        currentUserWorkspaceRole,
        resourceOwnerId: integration.user_id,
        ownerWorkspaceRole: integration.owner_workspace_role,
    });

    useEffect(() => {
        setName(integration.name);
        setScope(integration.scope ?? 'owner');
        setTeamId(integration.team_id ?? null);
        setOwnerId(integration.user_id);
        setTargetUserRole(integration.owner_workspace_role);
        setConfig({});
        setErrors({});
        setValidResult(null);
        setGuideOpen(false);
    }, [integration.id, integration.name, integration.scope, integration.team_id, integration.user_id, integration.owner_workspace_role]);

    const setField = (key: string, value: string) => {
        setConfig(previous => ({ ...previous, [key]: value }));
        setErrors(previous => ({ ...previous, [key]: '' }));
        setValidResult(null);
    };

    const handleNameChange = (value: string) => {
        setName(value);
        setErrors(previous => ({ ...previous, name: '' }));
    };

    const handleScopeChange = (nextScope: IntegrationScope, nextTeamId: Id | null) => {
        setScope(nextScope);
        setTeamId(nextTeamId);
    };

    const handleTestConnection = async () => {
        setValidating(true);
        setValidResult(null);
        try {
            const response = await fetch(`/integrations/${integration.category}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...csrfHeaders(),
                },
                body: JSON.stringify({
                    integration_id: integration.id,
                    config,
                }),
            });
            setValidResult(await response.json());
        } catch {
            setValidResult({ valid: false, error: 'Connection failed.' });
        } finally {
            setValidating(false);
        }
    };

    const buildPayload = (): UpdatePayload => {
        const payload: UpdatePayload = {};
        if (name.trim() && name !== integration.name) payload.name = name.trim();
        if (scope !== (integration.scope ?? 'owner')) {
            payload.scope = scope;
            payload.team_id = scope === 'team' ? teamId : null;
        } else if (scope === 'team' && teamId !== (integration.team_id ?? null)) {
            payload.scope = scope;
            payload.team_id = teamId;
        }
        if (ownerId && ownerId !== integration.user_id) payload.user_id = ownerId;
        if (Object.keys(config).length > 0) payload.config = config;
        return payload;
    };

    const confirmOwnershipTransfer = async () => {
        if (!ownerId || ownerId === integration.user_id || ownerId === auth.user?.id) return true;
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
                message: 'This integration has personal visibility. By transferring it to another user, you will permanently lose access to it.',
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
        }
        return true;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (integration.is_readonly) return;
        const payload = buildPayload();
        if (Object.keys(payload).length === 0) {
            onClose();
            return;
        }
        if (!await confirmOwnershipTransfer()) return;

        setSubmitting(true);
        router.put(`/integrations/${integration.id}`, payload as Parameters<typeof router.put>[1], {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setSubmitting(false),
        });
    };

    return {
        name,
        scope,
        teamId,
        ownerId: ownerId,
        config,
        errors,
        submitting,
        validating,
        validResult,
        guideOpen,
        ownershipDisabled,
        ConfirmModal,
        handleNameChange,
        handleScopeChange,
        handleTestConnection,
        handleSubmit,
        setField,
        setOwnerId: setOwnerId,
        setTargetUserRole,
        setGuideOpen,
    };
}
