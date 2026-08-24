import {
    Fragment,
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { PageProps } from '@/App/types';
import type {
    Integration,
    IntegrationCategory,
    IntegrationProvider,
} from '@/Domains/Integration/types';
import { PROVIDERS, type ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import IntegrationFormModal from '@/Domains/Integration/Pages/IntegrationFormModal/IntegrationFormModal';
import MailboxDomainModal from '@/Domains/Integration/Pages/MailboxDomainModal/MailboxDomainModal';
import AiModelFormModal from '@/Domains/AiModel/Pages/AiModelFormModal';
import type { AiIntegration, CreatedAiModel } from '@/Domains/AiModel/types';
import ChannelFormModal from '@/Domains/NotificationChannel/Pages/ChannelFormModal/ChannelFormModal';
import type { CreatedNotificationChannel } from '@/Domains/NotificationChannel/types';
import CreateMailboxModal from '@/Domains/Mailbox/Pages/CreateMailboxModal/CreateMailboxModal';
import type { CreatedMailbox, MailboxWatcher } from '@/Domains/Mailbox/types';
import WatcherFormModal from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/WatcherFormModal/WatcherFormModal';
import type { MailboxOption } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import Modal from '@/Shared/UI/Modal/Modal';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useRefreshNodeValidationResources } from './NodeValidationContext';
import * as S from './QuickRequirementCreationContext.styled';

export type QuickRequirementCreationKind =
    | 'integration'
    | 'ai-model'
    | 'channel'
    | 'mailbox'
    | 'mailbox-watcher';

export type AiRequiredCapability = 'text' | 'vision';

export interface IntegrationCreationOptions {
    provider?: IntegrationProvider;
    category?: IntegrationCategory;
}

export interface AiModelCreationOptions {
    requiredCapability: AiRequiredCapability;
}

export interface QuickRequirementCreationOptions {
    integration: IntegrationCreationOptions;
    'ai-model': AiModelCreationOptions;
    channel: undefined;
    mailbox: undefined;
    'mailbox-watcher': undefined;
}

export interface QuickRequirementCreationResult {
    integration: Integration;
    'ai-model': CreatedAiModel;
    channel: CreatedNotificationChannel;
    mailbox: CreatedMailbox;
    'mailbox-watcher': MailboxWatcher;
}

export interface QuickRequirementCreate {
    (kind: 'integration', options?: IntegrationCreationOptions): Promise<Integration | null>;
    (kind: 'ai-model', options: AiModelCreationOptions): Promise<CreatedAiModel | null>;
    (kind: 'channel'): Promise<CreatedNotificationChannel | null>;
    (kind: 'mailbox'): Promise<CreatedMailbox | null>;
    (kind: 'mailbox-watcher'): Promise<MailboxWatcher | null>;
}

interface QuickRequirementCreationContextValue {
    create: QuickRequirementCreate;
    refresh: (kind: 'integrations' | 'mailboxes') => Promise<void>;
    available: boolean;
}

type Stage =
    | 'provider'
    | 'integration'
    | 'mailbox-domain'
    | 'ai-model'
    | 'channel'
    | 'mailbox'
    | 'watcher';

interface QuickCreationSession {
    id: number;
    kind: QuickRequirementCreationKind;
    options: IntegrationCreationOptions | AiModelCreationOptions | undefined;
    stage: Stage;
    providerConfig?: ProviderConfig;
    resolve: PendingResolver;
    returnFocus: HTMLElement | null;
    returnFocusOverlay: HTMLElement | null;
}

interface QuickRequirementCreationProviderProps {
    flowId: Id;
    isNodalFlow: boolean;
    children: ReactNode;
}

type AnyCreationResult = QuickRequirementCreationResult[QuickRequirementCreationKind];
type PendingResolver = (result: AnyCreationResult | null) => void;

const noopCreate = (() => Promise.resolve(null)) as QuickRequirementCreate;
const QuickRequirementCreationContext = createContext<QuickRequirementCreationContextValue>({
    create: noopCreate,
    refresh: () => Promise.resolve(),
    available: false,
});

const isAvailableProvider = (provider: ProviderConfig) => (
    !provider.comingSoon
);

const PARENT_FOCUS_SELECTOR = [
    'input:not([disabled]):not([type="hidden"])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[role="combobox"]:not([aria-disabled="true"])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function QuickRequirementCreationProvider({
    flowId,
    isNodalFlow,
    children,
}: QuickRequirementCreationProviderProps) {
    const page = usePage<InertiaPageProps & PageProps & FlowEditorProps>().props;
    const refreshValidation = useRefreshNodeValidationResources();
    const { confirm, ConfirmModal } = useConfirm();
    const [activeStack, setActiveStack] = useState<QuickCreationSession[]>([]);
    const [aiIntegrations, setAiIntegrations] = useState<AiIntegration[]>(() => page.aiIntegrations ?? []);
    const [messengerIntegrations, setMessengerIntegrations] = useState(() => page.messengerIntegrations ?? []);
    const [mailboxIntegrations, setMailboxIntegrations] = useState<Integration[]>(() => page.mailboxIntegrations ?? []);
    const [mailboxDomains, setMailboxDomains] = useState(() => page.mailboxDomains ?? []);
    const [mailboxes, setMailboxes] = useState<MailboxOption[]>(() => page.mailboxes ?? []);
    const sessionsRef = useRef<QuickCreationSession[]>([]);
    const nextSessionIdRef = useRef(1);
    const teams = page.teams ?? [];
    const isAdmin = page.auth.user?.workspace_role === 'admin';

    useEffect(() => () => {
        sessionsRef.current.forEach(session => session.resolve(null));
        sessionsRef.current = [];
    }, []);

    useEffect(() => setAiIntegrations(page.aiIntegrations ?? []), [page.aiIntegrations]);
    useEffect(
        () => setMessengerIntegrations(page.messengerIntegrations ?? []),
        [page.messengerIntegrations],
    );
    useEffect(
        () => setMailboxIntegrations(page.mailboxIntegrations ?? []),
        [page.mailboxIntegrations],
    );
    useEffect(() => setMailboxDomains(page.mailboxDomains ?? []), [page.mailboxDomains]);
    useEffect(() => setMailboxes(page.mailboxes ?? []), [page.mailboxes]);

    const refresh = (kind: 'integrations' | 'mailboxes') => new Promise<void>(resolve => {
        router.reload({
            only: kind === 'integrations'
                ? ['aiIntegrations', 'messengerIntegrations', 'mailboxIntegrations', 'repositoryIntegrations']
                : ['mailboxIntegrations', 'mailboxDomains', 'mailboxes'],
            onFinish: () => resolve(),
        });
    });

    const replaceSessions = (sessions: QuickCreationSession[]) => {
        sessionsRef.current = sessions;
        setActiveStack(sessions);
    };

    const updateSession = (
        sessionId: number,
        update: (session: QuickCreationSession) => QuickCreationSession,
    ) => {
        replaceSessions(sessionsRef.current.map(session => (
            session.id === sessionId ? update(session) : session
        )));
    };

    const settle = (sessionId: number, result: AnyCreationResult | null) => {
        const sessionIndex = sessionsRef.current.findIndex(session => session.id === sessionId);
        if (sessionIndex < 0) return;

        const session = sessionsRef.current[sessionIndex];
        const wasTopSession = sessionIndex === sessionsRef.current.length - 1;
        replaceSessions(sessionsRef.current.filter(item => item.id !== sessionId));
        session.resolve(result);

        if (wasTopSession) {
            window.requestAnimationFrame(() => {
                if (session.returnFocus?.isConnected) {
                    session.returnFocus.focus();
                    return;
                }
                session.returnFocusOverlay
                    ?.querySelector<HTMLElement>(PARENT_FOCUS_SELECTOR)
                    ?.focus();
            });
        }
    };

    const complete = (sessionId: number, result: AnyCreationResult) => {
        refreshValidation();
        settle(sessionId, result);
    };

    const create = ((kind: QuickRequirementCreationKind, options?: IntegrationCreationOptions | AiModelCreationOptions) => {
        return new Promise<AnyCreationResult | null>(resolve => {
            const returnFocus = document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
            const session: QuickCreationSession = {
                id: nextSessionIdRef.current++,
                kind,
                options,
                stage: 'provider',
                resolve,
                returnFocus,
                returnFocusOverlay: returnFocus?.closest<HTMLElement>('[data-modal-overlay]') ?? null,
            };

            if (kind === 'integration') {
                const integrationOptions = options as IntegrationCreationOptions | undefined;
                const providerConfig = integrationOptions?.provider
                    ? PROVIDERS.find(provider => (
                        provider.provider === integrationOptions.provider
                        && (!integrationOptions.category || provider.category === integrationOptions.category)
                        && isAvailableProvider(provider)
                    ))
                    : undefined;

                if (providerConfig?.mailboxFlow) {
                    Object.assign(session, {
                        stage: 'mailbox-domain',
                        providerConfig,
                    });
                } else if (providerConfig) {
                    Object.assign(session, {
                        stage: 'integration',
                        providerConfig,
                    });
                }
                replaceSessions([...sessionsRef.current, session]);
                return;
            }

            if (kind === 'ai-model') {
                session.stage = aiIntegrations.length > 0 ? 'ai-model' : 'provider';
                replaceSessions([...sessionsRef.current, session]);
                return;
            }

            if (kind === 'channel') {
                session.stage = messengerIntegrations.length > 0 ? 'channel' : 'provider';
                replaceSessions([...sessionsRef.current, session]);
                return;
            }

            if (mailboxIntegrations.length === 0) {
                session.stage = 'mailbox-domain';
            } else if (mailboxes.length === 0) {
                session.stage = mailboxDomains.length > 0 ? 'mailbox' : 'mailbox-domain';
            } else {
                session.stage = kind === 'mailbox' ? 'mailbox' : 'watcher';
            }
            replaceSessions([...sessionsRef.current, session]);
        });
    }) as QuickRequirementCreate;

    const getProviderOptions = (session: QuickCreationSession) => {
        if (session.kind === 'ai-model') {
            return PROVIDERS.filter(provider => provider.category === 'ai' && isAvailableProvider(provider));
        }
        if (session.kind === 'channel') {
            return PROVIDERS.filter(provider => provider.category === 'messenger' && isAvailableProvider(provider));
        }

        const options = session.options as IntegrationCreationOptions | undefined;
        return PROVIDERS.filter(provider => (
            isAvailableProvider(provider)
            && (!options?.provider || provider.provider === options.provider)
            && (!options?.category || provider.category === options.category)
        ));
    };

    const chooseProvider = (sessionId: number, providerConfig: ProviderConfig) => {
        updateSession(sessionId, session => ({
            ...session,
            stage: providerConfig.mailboxFlow ? 'mailbox-domain' : 'integration',
            providerConfig,
        }));
    };

    const handleIntegrationCreated = (sessionId: number, integration: Integration) => {
        const session = sessionsRef.current.find(item => item.id === sessionId);
        if (!session) return;
        refreshValidation();

        if (integration.category === 'ai') {
            setAiIntegrations(current => [
                ...current.filter(item => item.id !== integration.id),
                { id: integration.id, name: integration.name, provider: integration.provider },
            ]);
        }
        if (integration.category === 'messenger') {
            setMessengerIntegrations(current => [
                ...current.filter(item => item.id !== integration.id),
                { id: integration.id, name: integration.name, provider: integration.provider },
            ]);
        }

        if (session.kind === 'integration') {
            complete(sessionId, integration);
            return;
        }
        if (session.kind === 'ai-model') {
            setAiIntegrations(current => [
                ...current.filter(item => item.id !== integration.id),
                { id: integration.id, name: integration.name, provider: integration.provider },
            ]);
            updateSession(sessionId, current => ({
                ...current,
                stage: 'ai-model',
                providerConfig: undefined,
            }));
            return;
        }
        if (session.kind === 'channel') {
            setMessengerIntegrations(current => [
                ...current.filter(item => item.id !== integration.id),
                { id: integration.id, name: integration.name, provider: integration.provider },
            ]);
            updateSession(sessionId, current => ({
                ...current,
                stage: 'channel',
                providerConfig: undefined,
            }));
        }
    };

    const handleAiModelCreated = (sessionId: number, model: CreatedAiModel) => complete(sessionId, model);
    const handleChannelCreated = (sessionId: number, channel: CreatedNotificationChannel) => {
        complete(sessionId, channel);
    };

    const handleDomainVerified = (sessionId: number, { integration, domain }: {
        integration: Integration;
        domain: { id: number; name: string };
    }) => {
        const session = sessionsRef.current.find(item => item.id === sessionId);
        if (!session) return;
        refreshValidation();
        setMailboxIntegrations(current => [
            ...current.filter(item => item.id !== integration.id),
            integration,
        ]);
        setMailboxDomains(current => [
            ...current.filter(item => item.id !== domain.id),
            { id: domain.id, name: domain.name },
        ]);

        if (session.kind === 'integration') {
            complete(sessionId, integration);
            return;
        }
        updateSession(sessionId, current => ({ ...current, stage: 'mailbox' }));
    };

    const handleMailboxCreated = (sessionId: number, mailbox: CreatedMailbox) => {
        const session = sessionsRef.current.find(item => item.id === sessionId);
        if (!session) return;
        refreshValidation();
        setMailboxes(current => [
            ...current.filter(item => item.id !== mailbox.id),
            { id: mailbox.id, slug: mailbox.slug, domain: mailbox.domain },
        ]);

        if (session.kind === 'mailbox') {
            complete(sessionId, mailbox);
            return;
        }
        updateSession(sessionId, current => ({ ...current, stage: 'watcher' }));
    };

    const handleWatcherCreated = (sessionId: number, watcher: MailboxWatcher) => {
        complete(sessionId, watcher);
    };

    const mailboxIntegration = mailboxIntegrations[0];

    return (
        <QuickRequirementCreationContext.Provider value={{ create, refresh, available: true }}>
            {children}
            {activeStack.map((modal, modalIndex) => (
                <Fragment key={modal.id}>
            {modal.stage === 'provider' && (
                <Modal
                    isOpen
                    onClose={() => settle(modal.id, null)}
                    title={modal.kind === 'ai-model'
                        ? 'Connect an AI integration'
                        : modal.kind === 'channel'
                            ? 'Connect a messenger'
                            : 'Connect an integration'}
                    width="520px"
                    zIndex={1050 + modalIndex * 20}
                    modalKind="requirement-provider-picker"
                >
                    <S.ProviderGrid>
                        {getProviderOptions(modal).map(provider => (
                            <S.ProviderButton
                                key={provider.provider}
                                type="button"
                                onClick={() => chooseProvider(modal.id, provider)}
                            >
                                <Icon
                                    icon={provider.icon}
                                    width={22}
                                    height={22}
                                    style={{ color: provider.color }}
                                />
                                <span>
                                    <strong>{provider.label}</strong>
                                    <small>{provider.typeLabel}</small>
                                </span>
                                <Icon icon="lucide:chevron-right" width={16} height={16} />
                            </S.ProviderButton>
                        ))}
                    </S.ProviderGrid>
                </Modal>
            )}
            {modal.stage === 'integration' && modal.providerConfig && (
                <IntegrationFormModal
                    mode="create"
                    providerConfig={modal.providerConfig}
                    teams={teams}
                    onClose={() => settle(modal.id, null)}
                    onCreated={integration => handleIntegrationCreated(modal.id, integration)}
                    zIndex={1050 + modalIndex * 20}
                    quickMode
                />
            )}
            {modal.stage === 'ai-model' && (
                <AiModelFormModal
                    aiIntegrations={aiIntegrations}
                    groups={page.aiModelGroups ?? []}
                    teams={teams}
                    onClose={() => settle(modal.id, null)}
                    onCreated={model => handleAiModelCreated(modal.id, model)}
                    requiredCapability={(modal.options as AiModelCreationOptions).requiredCapability}
                    zIndex={1050 + modalIndex * 20}
                    quickMode
                />
            )}
            {modal.stage === 'channel' && (
                <ChannelFormModal
                    mode="create"
                    messengerIntegrations={messengerIntegrations}
                    groups={page.channelGroups ?? []}
                    teams={teams}
                    isAdmin={isAdmin}
                    onClose={() => settle(modal.id, null)}
                    onCreated={channel => handleChannelCreated(modal.id, channel)}
                    zIndex={1050 + modalIndex * 20}
                    quickMode
                />
            )}
            {modal.stage === 'mailbox-domain' && !mailboxIntegration && (
                <MailboxDomainModal
                    mode="create"
                    teams={teams}
                    onClose={() => settle(modal.id, null)}
                    onVerified={result => handleDomainVerified(modal.id, result)}
                    zIndex={1050 + modalIndex * 20}
                    quickMode
                />
            )}
            {modal.stage === 'mailbox-domain' && mailboxIntegration && (
                <MailboxDomainModal
                    mode="edit"
                    integration={mailboxIntegration}
                    teams={teams}
                    onClose={() => settle(modal.id, null)}
                    onVerified={result => handleDomainVerified(modal.id, result)}
                    onDelete={() => {}}
                    isAdmin={isAdmin}
                    zIndex={1050 + modalIndex * 20}
                    quickMode
                />
            )}
            {modal.stage === 'mailbox' && (
                <CreateMailboxModal
                    isOpen
                    onClose={() => settle(modal.id, null)}
                    domains={mailboxDomains}
                    teams={teams}
                    groups={page.mailboxGroups ?? []}
                    onCreated={mailbox => handleMailboxCreated(modal.id, mailbox)}
                    zIndex={1050 + modalIndex * 20}
                    quickMode
                />
            )}
            {modal.stage === 'watcher' && (
                <WatcherFormModal
                    isOpen
                    editing={null}
                    flowId={flowId}
                    isNodalFlow={isNodalFlow}
                    groups={page.watcherGroups ?? []}
                    mailboxes={mailboxes}
                    teams={teams}
                    confirm={confirm}
                    onClose={() => settle(modal.id, null)}
                    onCreated={watcher => handleWatcherCreated(modal.id, watcher)}
                    onUpdated={() => {}}
                    zIndex={1050 + modalIndex * 20}
                    quickMode
                />
            )}
                </Fragment>
            ))}
            <ConfirmModal />
        </QuickRequirementCreationContext.Provider>
    );
}
export function useQuickRequirementCreation() {
    return useContext(QuickRequirementCreationContext);
}
