import {
    createContext,
    useContext,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { router } from '@inertiajs/react';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import IntegrationFormModal from '@/Domains/Integration/Pages/IntegrationFormModal/IntegrationFormModal';
import MailboxDomainModal from '@/Domains/Integration/Pages/MailboxDomainModal/MailboxDomainModal';
import { PROVIDERS, type ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import type {
    Integration,
    IntegrationCategory,
    IntegrationProvider,
} from '@/Domains/Integration/types';
import * as S from './IntegrationCreationContext.styled';

export interface IntegrationCreationOptions {
    provider?: IntegrationProvider;
    category?: IntegrationCategory;
}

export interface IntegrationCreationResult {
    integration: Integration;
    domain?: { id: number; name: string };
}

export interface IntegrationCreationContextValue {
    create: (options?: IntegrationCreationOptions) => Promise<IntegrationCreationResult | null>;
    refresh: (kind: 'integrations' | 'mailboxes') => Promise<void>;
    available: boolean;
}

interface IntegrationCreationProviderProps {
    children: ReactNode;
    teams: ScopeTeam[];
    enabled?: boolean;
    integrationReloadKeys?: string[];
    mailboxReloadKeys?: string[];
}

interface IntegrationCreationBridgeProps {
    children: ReactNode;
    value: IntegrationCreationContextValue;
}

interface ActiveCreation {
    options: IntegrationCreationOptions;
    providerConfig?: ProviderConfig;
    stage: 'provider' | 'integration' | 'mailbox-domain';
    resolve: (result: IntegrationCreationResult | null) => void;
    returnFocus: HTMLElement | null;
}

const unavailableValue: IntegrationCreationContextValue = {
    create: () => Promise.resolve(null),
    refresh: () => Promise.resolve(),
    available: false,
};

const IntegrationCreationContext = createContext<IntegrationCreationContextValue>(unavailableValue);

const isAvailableProvider = (provider: ProviderConfig) => !provider.comingSoon;

export function IntegrationCreationBridge({
    children,
    value,
}: IntegrationCreationBridgeProps) {
    return (
        <IntegrationCreationContext.Provider value={value}>
            {children}
        </IntegrationCreationContext.Provider>
    );
}

export function IntegrationCreationProvider({
    children,
    teams,
    enabled = true,
    integrationReloadKeys = ['aiIntegrations', 'messengerIntegrations'],
    mailboxReloadKeys = ['domains', 'integrations'],
}: IntegrationCreationProviderProps) {
    const [active, setActive] = useState<ActiveCreation | null>(null);
    const activeRef = useRef<ActiveCreation | null>(null);

    const replaceActive = (creation: ActiveCreation | null) => {
        activeRef.current = creation;
        setActive(creation);
    };

    const settle = (result: IntegrationCreationResult | null) => {
        const creation = activeRef.current;
        if (!creation) return;

        replaceActive(null);
        creation.resolve(result);
        window.requestAnimationFrame(() => {
            if (creation.returnFocus?.isConnected) creation.returnFocus.focus();
        });
    };

    const create = (options: IntegrationCreationOptions = {}) => {
        if (!enabled || activeRef.current) return Promise.resolve(null);

        return new Promise<IntegrationCreationResult | null>(resolve => {
            const providerConfig = options.provider
                ? PROVIDERS.find(provider => (
                    provider.provider === options.provider
                    && (!options.category || provider.category === options.category)
                    && isAvailableProvider(provider)
                ))
                : undefined;
            const creation: ActiveCreation = {
                options,
                providerConfig,
                stage: providerConfig
                    ? (providerConfig.mailboxFlow ? 'mailbox-domain' : 'integration')
                    : 'provider',
                resolve,
                returnFocus: document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : null,
            };
            replaceActive(creation);
        });
    };

    const refresh = (kind: 'integrations' | 'mailboxes') => new Promise<void>(resolve => {
        router.reload({
            only: kind === 'integrations' ? integrationReloadKeys : mailboxReloadKeys,
            onFinish: () => resolve(),
        });
    });

    const providerOptions = PROVIDERS.filter(provider => (
        isAvailableProvider(provider)
        && (!active?.options.provider || provider.provider === active.options.provider)
        && (!active?.options.category || provider.category === active.options.category)
    ));
    const value: IntegrationCreationContextValue = enabled
        ? { create, refresh, available: true }
        : unavailableValue;

    return (
        <IntegrationCreationContext.Provider value={value}>
            {children}
            {active?.stage === 'provider' && (
                <Modal
                    isOpen
                    onClose={() => settle(null)}
                    title={active.options.category === 'ai'
                        ? 'Connect an AI integration'
                        : active.options.category === 'messenger'
                            ? 'Connect a messenger'
                            : 'Connect an integration'}
                    width="520px"
                    zIndex={1050}
                    modalKind="requirement-provider-picker"
                >
                    <S.ProviderGrid>
                        {providerOptions.map(provider => (
                            <S.ProviderButton
                                key={`${provider.category}:${provider.provider}`}
                                type="button"
                                onClick={() => replaceActive({
                                    ...active,
                                    providerConfig: provider,
                                    stage: provider.mailboxFlow ? 'mailbox-domain' : 'integration',
                                })}
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
            {active?.stage === 'integration' && active.providerConfig && (
                <IntegrationFormModal
                    mode="create"
                    providerConfig={active.providerConfig}
                    teams={teams}
                    onClose={() => settle(null)}
                    onCreated={integration => settle({ integration })}
                    zIndex={1050}
                    quickMode
                />
            )}
            {active?.stage === 'mailbox-domain' && (
                <MailboxDomainModal
                    mode="create"
                    teams={teams}
                    onClose={() => settle(null)}
                    onVerified={({ integration, domain }) => settle({ integration, domain })}
                    zIndex={1050}
                    quickMode
                />
            )}
        </IntegrationCreationContext.Provider>
    );
}

export function useIntegrationCreation() {
    return useContext(IntegrationCreationContext);
}
