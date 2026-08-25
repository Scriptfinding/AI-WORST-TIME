import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import { useIntegrationCreation } from '@/Domains/Integration/Contexts/IntegrationCreationContext';
import type { IntegrationCategory, IntegrationProvider } from '@/Domains/Integration/types';
import type { ProviderMeta } from '@/Domains/NotificationChannel/Pages/ChannelFormModal/config';
import type { MessengerIntegration } from '@/Domains/NotificationChannel/Pages/ChannelFormModal/utils';
import * as S from './styled';

interface Props {
    integrations: MessengerIntegration[];
    value: Id | null;
    onChange: (id: Id) => void;
    providerMeta?: ProviderMeta;
    providerName: string;
    label?: string;
    getProviderMeta?: (integration: MessengerIntegration) => ProviderMeta | undefined;
    creationProvider?: IntegrationProvider;
    creationCategory?: IntegrationCategory;
}

export default function ConnectionSelect({
    integrations,
    value,
    onChange,
    providerMeta,
    providerName,
    label = 'Connection',
    getProviderMeta,
    creationProvider,
    creationCategory,
}: Props) {
    const integrationCreation = useIntegrationCreation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useSearchablePopover({
        open: open && !creating,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: inputRef,
        containerRefs: [containerRef],
        eventType: 'mousedown',
    });

    const selected = integrations.find(integration => integration.id === value);
    const selectedProviderMeta = selected && getProviderMeta ? getProviderMeta(selected) : providerMeta;
    const filtered = search
        ? integrations.filter(integration => integration.name.toLowerCase().includes(search.toLowerCase()))
        : integrations;

    const createIntegration = async () => {
        setCreating(true);
        try {
            const result = await integrationCreation.create({
                provider: creationProvider,
                category: creationCategory,
            });
            if (result) {
                await integrationCreation.refresh('integrations');
                onChange(result.integration.id);
                setOpen(false);
                setSearch('');
                return;
            }
        } finally {
            setCreating(false);
        }
        requestAnimationFrame(() => (inputRef.current ?? triggerRef.current)?.focus());
    };

    const refreshIntegrations = async () => {
        setRefreshing(true);
        try {
            await integrationCreation.refresh('integrations');
        } finally {
            setRefreshing(false);
            requestAnimationFrame(() => (inputRef.current ?? triggerRef.current)?.focus());
        }
    };

    if (integrations.length === 0) {
        return (
            <S.MissingResult>
                <Icon icon="lucide:info" width={14} />
                <S.MissingResultContent>
                    No {providerMeta?.label || providerName} connections found.
                </S.MissingResultContent>
                {integrationCreation.available && (
                    <S.RefreshButton
                        type="button"
                        title="Refresh connections"
                        aria-label="Refresh connections"
                        disabled={refreshing}
                        onClick={() => void refreshIntegrations()}
                    >
                        <Icon icon={refreshing ? 'lucide:loader-circle' : 'lucide:refresh-cw'} width={13} />
                    </S.RefreshButton>
                )}
                {integrationCreation.available && (
                    <S.CreateAction type="button" disabled={creating} onClick={createIntegration}>
                        + Add integration
                    </S.CreateAction>
                )}
            </S.MissingResult>
        );
    }

    return (
        <S.Field>
            <S.Label>{label}</S.Label>
            <S.Select>
        <S.Container ref={containerRef}>
            <S.Trigger
                ref={triggerRef}
                type="button"
                $open={open}
                $hasValue={!!value}
                onClick={() => {
                    setOpen(current => !current);
                    setSearch('');
                }}
            >
                {selected ? (
                    <S.Selected>
                        <Icon icon={selectedProviderMeta?.icon || 'lucide:bot'} width={14} />
                        {selected.name}
                    </S.Selected>
                ) : '-- Select a connection --'}
                <S.Arrow $open={open}>
                    <Icon icon="lucide:chevron-down" width={14} />
                </S.Arrow>
            </S.Trigger>
            {open && (
                <S.Dropdown>
                    <S.Header>
                        <S.Input
                            ref={inputRef}
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search connections..."
                        />
                        {integrationCreation.available && (
                            <S.RefreshButton
                                type="button"
                                title="Refresh connections"
                                aria-label="Refresh connections"
                                disabled={refreshing}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => void refreshIntegrations()}
                            >
                                <Icon icon={refreshing ? 'lucide:loader-circle' : 'lucide:refresh-cw'} width={13} />
                            </S.RefreshButton>
                        )}
                    </S.Header>
                    <S.List>
                        {integrationCreation.available && (
                            <S.CreateAction type="button" disabled={creating} onClick={createIntegration}>
                                + Add integration
                            </S.CreateAction>
                        )}
                        {filtered.map(integration => {
                            const optionProviderMeta = getProviderMeta?.(integration) ?? providerMeta;
                            return (
                                <S.Option
                                    key={integration.id}
                                    type="button"
                                    $selected={integration.id === value}
                                    onClick={() => {
                                        onChange(integration.id);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <Icon icon={optionProviderMeta?.icon || 'lucide:bot'} width={14} />
                                    {integration.name}
                                </S.Option>
                            );
                        })}
                        {filtered.length === 0 && (
                            <S.Empty>No connections match your search</S.Empty>
                        )}
                    </S.List>
                </S.Dropdown>
            )}
        </S.Container>
            </S.Select>
        </S.Field>
    );
}
