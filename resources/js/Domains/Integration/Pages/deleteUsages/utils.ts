import React from 'react';
import type { Integration } from '@/Domains/Integration/types';
import { AiUsageMessage } from './UsageMessages/AiUsageMessage/AiUsageMessage';
import { MailboxUsageMessage } from './UsageMessages/MailboxUsageMessage/MailboxUsageMessage';
import { MessengerUsageMessage } from './UsageMessages/MessengerUsageMessage/MessengerUsageMessage';
import { VaultUsageMessage } from './UsageMessages/VaultUsageMessage/VaultUsageMessage';
import type { FlowUsage } from './UsageLists/types';

interface VaultUsagesResponse {
    variables: { id: string; key: string }[];
    flows: FlowUsage[];
}

interface AiUsagesResponse {
    models: { id: string; name: string }[];
    flows: FlowUsage[];
}

interface MessengerUsagesResponse {
    channels: { id: string; name: string; provider: string; scope: string }[];
    flows: FlowUsage[];
}

interface MailboxUsagesResponse {
    flows: (FlowUsage & { watchers: string[] })[];
    watchers_count: number;
}

type UsageFetcher = (integration: Integration) => Promise<React.ReactNode | null>;

async function fetchAiUsages(integration: Integration): Promise<React.ReactNode | null> {
    const response = await fetch(`/integrations/${integration.id}/ai-usages`);
    const { models, flows }: AiUsagesResponse = await response.json();

    if (models.length === 0 && flows.length === 0) return null;

    return React.createElement(AiUsageMessage, { models, flows });
}

async function fetchVaultUsages(integration: Integration): Promise<React.ReactNode | null> {
    const response = await fetch(`/integrations/${integration.id}/vault-usages`);
    const { variables, flows }: VaultUsagesResponse = await response.json();

    if (variables.length === 0 && flows.length === 0) return null;

    return React.createElement(VaultUsageMessage, { variables, flows });
}

async function fetchMessengerUsages(integration: Integration): Promise<React.ReactNode | null> {
    const response = await fetch(`/integrations/${integration.id}/messenger-usages`);
    const { channels, flows }: MessengerUsagesResponse = await response.json();

    if (channels.length === 0 && flows.length === 0) return null;

    return React.createElement(MessengerUsageMessage, { channels, flows });
}

async function fetchMailboxUsages(integration: Integration): Promise<React.ReactNode | null> {
    const response = await fetch(`/integrations/${integration.id}/mailbox-usages`);
    const { flows, watchers_count }: MailboxUsagesResponse = await response.json();

    if (flows.length === 0) return null;

    return React.createElement(MailboxUsageMessage, {
        flows,
        watchersCount: watchers_count,
    });
}

const usageFetchers: Partial<Record<Integration['category'], UsageFetcher>> = {
    ai: fetchAiUsages,
    vault: fetchVaultUsages,
    messenger: fetchMessengerUsages,
    other: fetchMailboxUsages,
};

export async function fetchDeleteUsages(integration: Integration): Promise<React.ReactNode | null> {
    const fetcher = usageFetchers[integration.category];
    if (!fetcher) return null;

    try {
        return await fetcher(integration);
    } catch {
        return null;
    }
}
