import React, { useState } from 'react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Integration, IntegrationScope } from '@/Domains/Integration/types';
import type { MailboxDomain } from '@/Domains/Mailbox/types';
import type { PageProps } from '@/App/types';
import { ADMIN_TRANSFER_WARNING, canEditOwnership } from '@/Shared/Utils/ownershipPermissions';
import type { MailboxDomainModalProps } from './types';
import { fetchJson, firstError } from './utils';

type Confirm = ReturnType<typeof useConfirm>['confirm'];

interface IntegrationFormOptions {
    props: MailboxDomainModalProps;
    isReadonly: boolean;
    confirm: Confirm;
    handleClose: () => void;
    onCreated: (domain: MailboxDomain, integration: Integration) => void;
    setCreatedIntegrationId: (integrationId: Id) => void;
}

// Manages mailbox integration fields, ownership rules, and form submission.
export default function useMailboxIntegrationForm({
    props,
    isReadonly,
    confirm,
    handleClose,
    onCreated,
    setCreatedIntegrationId,
}: IntegrationFormOptions) {
    const editProps = props.mode === 'edit' ? props : null;
    const { auth } = usePage<InertiaPageProps & PageProps>().props;
    const currentUserId = auth.user?.id ?? '';
    const currentUserWorkspaceRole = auth.user?.workspace_role ?? 'member';
    const ownershipDisabled = editProps
        ? isReadonly || !canEditOwnership({
            currentUserId,
            currentUserWorkspaceRole,
            resourceOwnerId: editProps.integration.user_id,
            ownerWorkspaceRole: editProps.integration.owner_workspace_role,
        })
        : false;

    const [integrationName, setIntegrationName] = useState('');
    const [domainName, setDomainName] = useState('');
    const [createScope, setCreateScope] = useState<IntegrationScope>('owner');
    const [createTeamId, setCreateTeamId] = useState<Id | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [editName, setEditName] = useState(editProps?.integration.name ?? '');
    const [editScope, setEditScope] = useState<IntegrationScope>(
        editProps?.integration.scope ?? 'owner'
    );
    const [editTeamId, setEditTeamId] = useState<Id | null>(
        editProps?.integration.team_id ?? null
    );
    const [editOwnerId, setEditOwnerId] = useState<Id | null>(
        editProps?.integration.user_id ?? null
    );
    const [targetUserRole, setTargetUserRole] = useState<string | undefined>(
        editProps?.integration.owner_workspace_role
    );
    const [savingName, setSavingName] = useState(false);

    const handleSaveName = async () => {
        if (isReadonly || !editProps || !editName.trim()) return;
        const { integration } = editProps;
        const payload: Record<string, string | number | null> = {};
        if (editName.trim() !== integration.name) payload.name = editName.trim();
        if (editScope !== (integration.scope ?? 'owner')) {
            payload.scope = editScope;
            payload.team_id = editScope === 'team' ? editTeamId : null;
        } else if (editScope === 'team' && editTeamId !== (integration.team_id ?? null)) {
            payload.scope = editScope;
            payload.team_id = editTeamId;
        }
        if (editOwnerId && editOwnerId !== integration.user_id) payload.user_id = editOwnerId;
        if (Object.keys(payload).length === 0) return;

        if (
            currentUserWorkspaceRole === 'manager'
            && targetUserRole === 'admin'
            && editOwnerId
            && editOwnerId !== integration.user_id
            && editOwnerId !== auth.user?.id
        ) {
            const confirmed = await confirm({
                title: 'Transfer ownership',
                message: ADMIN_TRANSFER_WARNING,
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
            if (!confirmed) return;
        }

        setSavingName(true);
        try {
            await fetchJson(`/integrations/${integration.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
        } catch {}
        setSavingName(false);
        handleClose();
    };

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!integrationName.trim() || !domainName.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            const response = await fetchJson('/integrations/mailbox', {
                method: 'POST',
                body: JSON.stringify({
                    name: integrationName.trim(),
                    domain: domainName.trim().toLowerCase(),
                    scope: createScope,
                    team_id: createScope === 'team' ? createTeamId : null,
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setError(
                    firstError(data.errors?.domain)
                    || firstError(data.errors?.name)
                    || data.message
                    || 'Failed to create mailbox integration.'
                );
                setSubmitting(false);
                return;
            }

            const data = await response.json();
            const newIntegration = data.integration as Integration | undefined;
            if (!newIntegration?.id) {
                setError('Integration created but could not retrieve ID.');
                setSubmitting(false);
                return;
            }
            setCreatedIntegrationId(newIntegration.id);
            if (data.domain) onCreated(data.domain, newIntegration);
        } catch {
            setError('An unexpected error occurred.');
        }
        setSubmitting(false);
    };

    const canSave = !!editProps && !!editName.trim() && !(
        editName.trim() === editProps.integration.name
        && editScope === (editProps.integration.scope ?? 'owner')
        && editTeamId === (editProps.integration.team_id ?? null)
        && editOwnerId === editProps.integration.user_id
    );

    return {
        integrationName, domainName, createScope, createTeamId, submitting, error,
        editName, editScope, editTeamId, editOwnerId, savingName,
        isReadonly, ownershipDisabled, canSave,
        handleSaveName, handleCreate,
        setIntegrationName, setDomainName, setError, setCreateScope, setCreateTeamId,
        setEditName, setEditScope, setEditTeamId, setEditOwnerId, setTargetUserRole,
    };
}
