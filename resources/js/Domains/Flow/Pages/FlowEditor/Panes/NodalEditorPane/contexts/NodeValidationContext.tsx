import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { fetchAiModelSuggestions } from '@/Domains/AiModel/aiModelSuggestions';
import { fetchChannelSuggestions } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { fetchMailboxWatcherSuggestions } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import type { NodeValidationResources } from '../utils/validation';

interface Props {
    flowId: Id;
    children: ReactNode;
}

const loadingResources: NodeValidationResources = {
    dataTables: { status: 'loading', items: [] },
    aiSetup: {
        status: 'loading',
        hasAiIntegration: false,
        hasAiModel: false,
    },
    messengerSetup: {
        status: 'loading',
        hasMessengerIntegration: false,
    },
    mailboxSetup: {
        status: 'loading',
        hasMailboxIntegration: false,
        hasMailbox: false,
    },
    aiModels: { status: 'loading', items: [] },
    channels: { status: 'loading', names: new Set() },
    mailboxWatchers: { status: 'loading', names: new Set() },
};

interface NodeValidationContextValue {
    resources: NodeValidationResources;
    refresh: () => Promise<void>;
    revision: number;
}

const NodeValidationContext = createContext<NodeValidationContextValue>({
    resources: loadingResources,
    refresh: () => Promise.resolve(),
    revision: 0,
});

async function fetchJson<T>(url: string, revision: number): Promise<T> {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}_resource_revision=${revision}`, {
        cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Unable to load ${url}.`);
    return response.json() as Promise<T>;
}

export function NodeValidationProvider({ flowId, children }: Props) {
    const [resources, setResources] = useState<NodeValidationResources>(loadingResources);
    const [revision, setRevision] = useState(0);
    const refreshResolversRef = useRef<Array<() => void>>([]);
    const refresh = useCallback(() => new Promise<void>(resolve => {
        refreshResolversRef.current.push(resolve);
        setRevision(current => current + 1);
    }), []);

    useEffect(() => {
        let active = true;
        if (revision === 0) setResources(loadingResources);

        const loadAiModels = fetchAiModelSuggestions(revision > 0)
            .then(items => ({ status: 'loaded' as const, items: Array.isArray(items) ? items : [] }))
            .catch(() => ({ status: 'error' as const, items: [] }));
        const loadAiSetup = fetchJson<{
            has_ai_integration: boolean;
            has_ai_model: boolean;
        }>('/ai-models/setup-status', revision)
            .then(status => ({
                status: 'loaded' as const,
                hasAiIntegration: status.has_ai_integration,
                hasAiModel: status.has_ai_model,
            }))
            .catch(() => ({
                status: 'error' as const,
                hasAiIntegration: false,
                hasAiModel: false,
            }));
        const loadMessengerSetup = fetchJson<{
            has_messenger_integration: boolean;
        }>('/channels/setup-status', revision)
            .then(status => ({
                status: 'loaded' as const,
                hasMessengerIntegration: status.has_messenger_integration,
            }))
            .catch(() => ({
                status: 'error' as const,
                hasMessengerIntegration: false,
            }));
        const loadMailboxSetup = fetchJson<{
            has_mailbox_integration: boolean;
            has_mailbox: boolean;
        }>(`/flows/${flowId}/mailbox-watchers/setup-status`, revision)
            .then(status => ({
                status: 'loaded' as const,
                hasMailboxIntegration: status.has_mailbox_integration,
                hasMailbox: status.has_mailbox,
            }))
            .catch(() => ({
                status: 'error' as const,
                hasMailboxIntegration: false,
                hasMailbox: false,
            }));
        const loadChannels = fetchChannelSuggestions(revision > 0)
            .then(items => ({
                status: 'loaded' as const,
                names: new Set((Array.isArray(items) ? items : []).map(item => item.id)),
            }))
            .catch(() => ({ status: 'error' as const, names: new Set<string>() }));
        const loadMailboxWatchers = fetchMailboxWatcherSuggestions(flowId, revision > 0)
            .then(items => ({
                status: 'loaded' as const,
                names: new Set((Array.isArray(items) ? items : []).map(item => item.id)),
            }))
            .catch(() => ({ status: 'error' as const, names: new Set<string>() }));
        const loadDataTables = fetchJson<NonNullable<NodeValidationResources['dataTables']>['items']>(
            `/flows/${flowId}/data-table-resources`,
            revision,
        )
            .then(items => ({ status: 'loaded' as const, items: Array.isArray(items) ? items : [] }))
            .catch(() => ({ status: 'error' as const, items: [] }));

        Promise.all([
            loadAiSetup,
            loadMessengerSetup,
            loadMailboxSetup,
            loadAiModels,
            loadChannels,
            loadMailboxWatchers,
            loadDataTables,
        ]).then(([
            aiSetup,
            messengerSetup,
            mailboxSetup,
            aiModels,
            channels,
            mailboxWatchers,
            dataTables,
        ]) => {
            if (active) {
                setResources({
                    aiSetup,
                    messengerSetup,
                    mailboxSetup,
                    aiModels,
                    channels,
                    mailboxWatchers,
                    dataTables,
                });
                refreshResolversRef.current.splice(0).forEach(resolve => resolve());
            }
        });

        return () => {
            active = false;
        };
    }, [flowId, revision]);

    useEffect(() => () => {
        refreshResolversRef.current.splice(0).forEach(resolve => resolve());
    }, []);

    const value = useMemo(
        () => ({ resources, refresh, revision }),
        [refresh, resources, revision],
    );

    return (
        <NodeValidationContext.Provider value={value}>
            {children}
        </NodeValidationContext.Provider>
    );
}

export function useNodeValidationResources() {
    return useContext(NodeValidationContext).resources;
}

export function useRefreshNodeValidationResources() {
    return useContext(NodeValidationContext).refresh;
}

export function useNodeValidationResourceRevision() {
    return useContext(NodeValidationContext).revision;
}
