import { useEffect, useState } from 'react';
import { fetchAiModelSuggestions } from '@/Domains/AiModel/aiModelSuggestions';
import type { IntegrationProvider } from '@/Domains/Integration/types';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { DATA_TYPE_ICONS } from '@/Shared/Utils/dataTypeIcons';
import { fetchChannelSuggestions } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { fetchDataTableSuggestions } from '@/Domains/Flow/Pages/FlowEditor/utils/dataTableSuggestions';
import { fetchMailboxWatcherSuggestions } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import {
    fetchVariableSuggestions,
    getVariableSuggestionIcon,
} from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';

export interface ReferenceDisplay {
    label: string;
    icon: string;
    iconColor?: string;
    editUrl?: string;
    referenceId?: string;
    referenceLabel?: string;
}

const REFERENCE_PATTERN = /^\$\{(vars|channels|mailboxWatchers|aiModels|dataTables)\.([^.}]+)(?:\.([^}]+))?\}$/;
const REFERENCE_FALLBACK_ICONS: Record<string, string> = {
    vars: DATA_TYPE_ICONS.variable,
    channels: DATA_TYPE_ICONS.channel,
    mailboxWatchers: DATA_TYPE_ICONS['mailbox-watcher'],
    aiModels: DATA_TYPE_ICONS['ai-model'],
    dataTables: DATA_TYPE_ICONS.datatable,
};

export function resolveReferenceDisplay(
    value: unknown,
    references: ReadonlyMap<string, ReferenceDisplay>,
): ReferenceDisplay | null {
    const match = typeof value === 'string' ? value.match(REFERENCE_PATTERN) : null;
    if (!match) return null;

    const reference = value as string;
    const resolved = references.get(`${match[1]}.${match[2]}`);
    return {
        label: resolved
            ? resolved.label + (match[3] ? `.${match[3]}` : '')
            : reference,
        icon: resolved?.icon ?? REFERENCE_FALLBACK_ICONS[match[1]],
        iconColor: resolved?.iconColor,
        editUrl: resolved?.editUrl,
        referenceId: match[2],
        referenceLabel: resolved?.label,
    };
}

export function useReferenceDisplays(flowId?: Id) {
    const [references, setReferences] = useState<Map<string, ReferenceDisplay>>(() => new Map());

    useEffect(() => {
        let cancelled = false;
        void Promise.allSettled([
            fetchVariableSuggestions(),
            fetchChannelSuggestions(),
            fetchAiModelSuggestions(),
            flowId ? fetchMailboxWatcherSuggestions(flowId) : Promise.resolve([]),
            flowId ? fetchDataTableSuggestions(flowId) : Promise.resolve([]),
        ] as const).then(([variables, channels, aiModels, watchers, dataTables]) => {
            if (cancelled) return;
            const next = new Map<string, ReferenceDisplay>();
            if (variables.status === 'fulfilled') {
                for (const variable of variables.value) {
                    const variableIcon = getVariableSuggestionIcon(variable);
                    next.set(`vars.${variable.id}`, {
                        label: variable.key,
                        icon: variableIcon.icon,
                        editUrl: `/variables?edit=${encodeURIComponent(String(variable.id))}`,
                        ...('color' in variableIcon && variableIcon.color ? { iconColor: variableIcon.color } : {}),
                    });
                }
            }
            if (channels.status === 'fulfilled') {
                for (const channel of channels.value) {
                    const provider = getProviderConfig(channel.provider as IntegrationProvider);
                    next.set(`channels.${channel.id}`, {
                        label: channel.name,
                        icon: provider?.icon ?? DATA_TYPE_ICONS.channel,
                        editUrl: `/channels?edit=${encodeURIComponent(String(channel.id))}`,
                        ...(provider?.color ? { iconColor: provider.color } : {}),
                    });
                }
            }
            if (aiModels.status === 'fulfilled') {
                for (const model of aiModels.value) {
                    const provider = getProviderConfig(model.ai_integration.provider as IntegrationProvider);
                    next.set(`aiModels.${model.id}`, {
                        label: model.name,
                        icon: provider?.icon ?? DATA_TYPE_ICONS['ai-model'],
                        editUrl: `/ai-models?edit=${encodeURIComponent(String(model.id))}`,
                        ...(provider?.color ? { iconColor: provider.color } : {}),
                    });
                }
            }
            if (watchers.status === 'fulfilled') {
                const provider = getProviderConfig('mailbox' as IntegrationProvider);
                for (const watcher of watchers.value) {
                    next.set(`mailboxWatchers.${watcher.id}`, {
                        label: watcher.name,
                        icon: provider?.icon ?? DATA_TYPE_ICONS['mailbox-watcher'],
                        editUrl: `/flows/${encodeURIComponent(String(flowId))}?edit-watcher=${encodeURIComponent(String(watcher.id))}#mailboxes`,
                        ...(provider?.color ? { iconColor: provider.color } : {}),
                    });
                }
            }
            if (dataTables.status === 'fulfilled') {
                for (const table of dataTables.value) {
                    next.set(`dataTables.${table.id}`, {
                        label: table.name,
                        icon: DATA_TYPE_ICONS.datatable,
                    });
                }
            }
            setReferences(next);
        });

        return () => {
            cancelled = true;
        };
    }, [flowId]);

    return references;
}
