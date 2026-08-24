import React, { createElement, useCallback, useEffect, useState } from 'react';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { MailboxDomain } from '@/Domains/Mailbox/types';
import type { FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';
import type { DomainWithCount } from './types';
import DomainDeleteConfirmation from './DomainDeleteConfirmation';
import { fetchJson, firstError } from './utils';

type Confirm = ReturnType<typeof useConfirm>['confirm'];

interface DomainOptions {
    integrationId: Id | null;
    isReadonly: boolean;
    initiallyLoading: boolean;
    loadEnabled: boolean;
    confirm: Confirm;
    onOpenDomain: (domain: MailboxDomain) => void;
}

// Loads and mutates mailbox domains shown by the integration domain modal.
export default function useMailboxDomains({
    integrationId,
    isReadonly,
    initiallyLoading,
    loadEnabled,
    confirm,
    onOpenDomain,
}: DomainOptions) {
    const [domains, setDomains] = useState<DomainWithCount[]>([]);
    const [loadingDomains, setLoadingDomains] = useState(initiallyLoading);
    const [addDomainName, setAddDomainName] = useState('');
    const [addingDomain, setAddingDomain] = useState(false);
    const [addDomainError, setAddDomainError] = useState('');

    const loadDomains = useCallback(async (id: Id, signal?: AbortSignal) => {
        setLoadingDomains(true);
        try {
            const response = await fetchJson(`/integrations/${id}/mailbox/domains`, { signal });
            const data = await response.json();
            if (data.domains) setDomains(data.domains);
        } catch {}
        if (!signal?.aborted) setLoadingDomains(false);
    }, []);

    useEffect(() => {
        if (!integrationId || !loadEnabled) return;
        const controller = new AbortController();
        void loadDomains(integrationId, controller.signal);
        return () => controller.abort();
    }, [integrationId, loadDomains, loadEnabled]);

    const handleAddDomain = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isReadonly || !addDomainName.trim() || !integrationId) return;
        setAddingDomain(true);
        setAddDomainError('');
        try {
            const response = await fetchJson(`/integrations/${integrationId}/mailbox/domains`, {
                method: 'POST',
                body: JSON.stringify({ name: addDomainName.trim().toLowerCase() }),
            });
            if (response.ok) {
                const data = await response.json();
                setAddDomainName('');
                if (data.domain) onOpenDomain(data.domain);
            } else {
                const data = await response.json().catch(() => ({}));
                setAddDomainError(firstError(data.errors?.name) || 'Failed to add domain.');
            }
        } catch {
            setAddDomainError('An error occurred.');
        }
        setAddingDomain(false);
    };

    const handleDeleteDomain = async (domain: MailboxDomain) => {
        if (isReadonly || !integrationId) return;
        let usage: {
            flows: (FlowUsage & { watchers: string[] })[];
            watchersCount: number;
        } | null = null;
        try {
            const response = await fetchJson(
                `/integrations/${integrationId}/mailbox/domains/${domain.id}/usages`
            );
            const data: {
                flows: (FlowUsage & { watchers: string[] })[];
                watchers_count: number;
            } = await response.json();
            if (data.flows.length > 0) {
                usage = {
                    flows: data.flows,
                    watchersCount: data.watchers_count,
                };
            }
        } catch {}

        const confirmed = await confirm({
            title: 'Delete Domain',
            message: usage
                ? createElement(DomainDeleteConfirmation, {
                    domainName: domain.name,
                    flows: usage.flows,
                    watchersCount: usage.watchersCount,
                })
                : `Delete "${domain.name}" and all associated mailboxes? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!confirmed) return;
        await fetchJson(`/integrations/${integrationId}/mailbox/domains/${domain.id}`, {
            method: 'DELETE',
        });
        await loadDomains(integrationId);
    };

    return {
        domains,
        loadingDomains,
        addDomainName,
        addingDomain,
        addDomainError,
        handleAddDomain,
        handleDeleteDomain,
        setAddDomainName,
        setAddDomainError,
    };
}
