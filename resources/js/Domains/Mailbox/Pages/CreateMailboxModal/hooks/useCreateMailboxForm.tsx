import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useResetOnOpen } from '@/Shared/Hooks/useResetOnOpen';
import type { CreatedMailbox, MailboxDomain } from '@/Domains/Mailbox/types';
import type { PageProps } from '@/App/types';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { normalizeLaravelValidationErrors } from '@/Shared/Utils/laravelValidation';

export interface UseCreateMailboxFormOptions {
    isOpen: boolean;
    onClose: () => void;
    domains: Pick<MailboxDomain, 'id' | 'name'>[];
    onCreated?: (mailbox: CreatedMailbox) => void;
}

// Owns CreateMailboxModal fields, reset behavior, and submission lifecycle.
export default function useCreateMailboxForm({
    isOpen,
    onClose,
    domains,
    onCreated,
}: UseCreateMailboxFormOptions) {
    const { auth } = usePage<InertiaPageProps & PageProps>().props;
    const { confirm, ConfirmModal } = useConfirm();
    const [slug, setSlug] = useState('');
    const [group, setGroup] = useState('');
    const [domainId, setDomainId] = useState(domains[0]?.id.toString() ?? '');
    const [description, setDescription] = useState('');
    const [scope, setScope] = useState('owner');
    const [teamId, setTeamId] = useState<Id | null>(null);
    const [ownerId, setOwnerId] = useState<Id | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useResetOnOpen(isOpen, () => {
        setSlug('');
        setGroup('');
        setDomainId(domains[0]?.id.toString() ?? '');
        setDescription('');
        setScope('owner');
        setTeamId(null);
        setOwnerId(null);
        setSubmitting(false);
        setError('');
    });

    const selectedDomain = domains.find(domain => String(domain.id) === domainId);

    const changeSlug = (value: string) => {
        setSlug(value.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
        setError('');
    };

    const changeScope = (nextScope: string, nextTeamId: Id | null) => {
        setScope(nextScope);
        setTeamId(nextScope === 'team' ? nextTeamId : null);
    };

    const submit = async () => {
        if (!slug.trim() || !domainId) return;

        if (ownerId && ownerId !== auth.user?.id && scope === 'owner') {
            const accepted = await confirm({
                title: 'Transfer ownership',
                message: 'This mailbox has personal visibility. By assigning it to another user, you will not have access to it.',
                confirmLabel: 'Transfer anyway',
                variant: 'danger',
            });
            if (!accepted) return;
        }

        setSubmitting(true);
        setError('');
        const payload = {
            slug: slug.trim().toLowerCase(),
            domain_id: domainId,
            group: group.trim() || undefined,
            description: description.trim() || undefined,
            scope,
            team_id: scope === 'team' ? teamId : null,
            ...(ownerId ? { user_id: ownerId } : {}),
        };

        if (onCreated) {
            try {
                const response = await fetch('/mailboxes', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...csrfHeaders(),
                    },
                    body: JSON.stringify(payload),
                });
                const data = await response.json().catch(() => ({})) as {
                    mailbox?: CreatedMailbox;
                    message?: string;
                    errors?: unknown;
                };
                if (!response.ok || !data.mailbox) {
                    const errors = normalizeLaravelValidationErrors(data.errors);
                    setError(errors.slug || errors.domain_id || data.message || 'Failed to create.');
                    return;
                }
                onCreated(data.mailbox);
            } catch {
                setError('Failed to create.');
            } finally {
                setSubmitting(false);
            }
            return;
        }

        router.post('/mailboxes', payload, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
                setSubmitting(false);
            },
            onError: errors => {
                setError(errors.slug || errors.domain_id || 'Failed to create.');
                setSubmitting(false);
            },
        });
    };

    return {
        slug,
        group,
        domainId,
        description,
        scope,
        teamId,
        ownerId: ownerId,
        submitting,
        error,
        selectedDomain,
        setGroup,
        setDomainId,
        setDescription,
        setOwnerId: setOwnerId,
        changeSlug,
        changeScope,
        submit,
        ConfirmModal,
    };
}
