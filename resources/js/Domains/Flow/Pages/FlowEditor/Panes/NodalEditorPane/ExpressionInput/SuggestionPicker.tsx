import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { IntegrationProvider } from '@/Domains/Integration/types';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { getVisibilityMeta } from '@/Shared/Utils/visibility';
import type { ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { useAnchoredDropdownPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import type { WatcherSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import type { ChannelSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import { dropdownStyle } from './utils';
import * as Shared from './shared.styled';

interface SuggestionPickerProps {
    type: 'channel' | 'mailbox-watcher';
    value: string;
    placeholder?: string;
    readOnly?: boolean;
    loading?: boolean;
    channels: ChannelSuggestion[];
    watchers: WatcherSuggestion[];
    onRefresh?: () => void | Promise<void>;
    refreshing?: boolean;
    dropdownMinWidth?: number;
    onChange: (value: ScalarNodeParameterValue) => void;
}

function ResourceDetail({
    scope,
    teamName,
    detail,
}: {
    scope: string;
    teamName: string | null;
    detail: string;
}) {
    const visibility = getVisibilityMeta(scope, teamName);

    return (
        <Shared.OptionDetail>
            {visibility && <Icon icon={visibility.icon} width={11} height={11} />}
            {visibility ? `${visibility.label} · ${detail}` : detail}
        </Shared.OptionDetail>
    );
}

export default function SuggestionPicker({
    type,
    value,
    placeholder,
    readOnly,
    loading,
    channels,
    watchers,
    onRefresh,
    refreshing,
    dropdownMinWidth,
    onChange,
}: SuggestionPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const creatingRef = useRef(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const quickRequirementCreation = useQuickRequirementCreation();
    const { dropdownRect, updateDropdownPosition } = useAnchoredDropdownPosition(
        triggerRef,
        open,
        { maxHeight: 260, minWidth: dropdownMinWidth, viewportPadding: 12 },
    );
    const isMailboxWatcher = type === 'mailbox-watcher';
    const selectedChannel = channels.find(channel => String(channel.id) === value);
    const selectedWatcher = watchers.find(watcher => String(watcher.id) === value);
    const selectedProvider = selectedChannel
        ? getProviderConfig(selectedChannel.provider as IntegrationProvider)
        : undefined;
    const mailboxProvider = getProviderConfig('mailbox' as IntegrationProvider);
    const selectedIconProvider = isMailboxWatcher && selectedWatcher
        ? mailboxProvider
        : selectedProvider;
    const displayValue = selectedChannel?.name ?? selectedWatcher?.name ?? value;
    const filteredChannels = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return channels;

        return channels.filter(channel => (
            channel.name.toLowerCase().includes(normalizedQuery)
            || channel.provider.toLowerCase().includes(normalizedQuery)
            || channel.scope.toLowerCase().includes(normalizedQuery)
        ));
    }, [channels, query]);
    const filteredWatchers = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return watchers;

        return watchers.filter(watcher => (
            watcher.name.toLowerCase().includes(normalizedQuery)
            || watcher.address.toLowerCase().includes(normalizedQuery)
        ));
    }, [query, watchers]);

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    const openDropdown = () => {
        setQuery('');
        updateDropdownPosition();
        setOpen(true);
    };

    const handleCreate = async () => {
        if (creatingRef.current) return;

        creatingRef.current = true;
        setCreating(true);
        try {
            const created = type === 'channel'
                ? await quickRequirementCreation.create('channel')
                : await quickRequirementCreation.create('mailbox-watcher');
            if (created) {
                await onRefresh?.();
                onChange({ mode: 'fixed', value: String(created.id) });
                close();
                return;
            }

            window.requestAnimationFrame(() => searchInputRef.current?.focus());
        } finally {
            creatingRef.current = false;
            setCreating(false);
        }
    };

    return (
        <Shared.Picker
            onBlurCapture={event => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                if (creatingRef.current) return;
                setOpen(false);
            }}
        >
            <Shared.PickerTrigger
                ref={triggerRef}
                type="button"
                $open={open}
                $hasValue={Boolean(selectedChannel || selectedWatcher || value)}
                $loading={loading}
                aria-busy={loading}
                disabled={readOnly}
                onClick={() => {
                    if (!loading) openDropdown();
                }}
            >
                <Shared.PickerValue>
                    {loading ? (
                        <Shared.PickerLoadingIcon>
                            <Icon icon="lucide:loader-circle" width={15} height={15} />
                        </Shared.PickerLoadingIcon>
                    ) : selectedIconProvider?.icon && (
                        <Shared.PickerProviderIcon style={{ color: selectedIconProvider.color }}>
                            <Icon icon={selectedIconProvider.icon} width={15} height={15} />
                        </Shared.PickerProviderIcon>
                    )}
                    <span>
                        {loading
                            ? 'Loading...'
                            : displayValue
                                || placeholder
                                || (isMailboxWatcher ? 'Select a mailbox watcher...' : 'Select a channel...')}
                    </span>
                </Shared.PickerValue>
                <Icon icon="lucide:chevron-down" width={14} height={14} />
            </Shared.PickerTrigger>
            {open && !readOnly && !loading && !creating && dropdownRect && (
                <Shared.Dropdown
                    data-node-field-dropdown="true"
                    style={dropdownStyle(dropdownRect)}
                >
                    <Shared.DropdownHeader>
                        <Shared.SearchInput
                            ref={searchInputRef}
                            autoFocus
                            value={query}
                            placeholder={isMailboxWatcher ? 'Search mailbox watcher...' : 'Search channel...'}
                            onChange={event => setQuery(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    setOpen(false);
                                }
                            }}
                        />
                        {onRefresh && (
                            <Shared.DropdownHeaderButton
                                type="button"
                                title="Refresh suggestions"
                                aria-label="Refresh suggestions"
                                disabled={refreshing}
                                $loading={refreshing}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => void onRefresh()}
                            >
                                <Icon icon="lucide:refresh-cw" width={13} height={13} />
                            </Shared.DropdownHeaderButton>
                        )}
                    </Shared.DropdownHeader>
                    <Shared.DropdownActionRow>
                        <Shared.DropdownAction
                            type="button"
                            disabled={creating}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => void handleCreate()}
                        >
                            {creating && <Icon icon="lucide:loader-circle" width={13} height={13} />}
                            {isMailboxWatcher ? '+ Add mailbox watcher' : '+ Add channel'}
                        </Shared.DropdownAction>
                        {value && (
                            <Shared.DropdownClearButton
                                type="button"
                                title="Clear selection"
                                aria-label="Clear selection"
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => {
                                    onChange({ mode: 'fixed', value: '' });
                                    close();
                                }}
                            >
                                <Icon icon="lucide:trash-2" width={13} height={13} />
                            </Shared.DropdownClearButton>
                        )}
                    </Shared.DropdownActionRow>
                    {refreshing ? (
                        <Shared.Loading>
                            <Icon icon="lucide:loader-circle" width={16} height={16} />
                        </Shared.Loading>
                    ) : isMailboxWatcher ? (
                        filteredWatchers.length > 0 ? (
                            filteredWatchers.map(watcher => (
                                <Shared.Option
                                    key={watcher.id}
                                    type="button"
                                    $selected={String(watcher.id) === value}
                                    onMouseDown={event => event.preventDefault()}
                                    onClick={() => {
                                        onChange({ mode: 'fixed', value: String(watcher.id) });
                                        close();
                                    }}
                                >
                                    <Shared.OptionMain>
                                        {mailboxProvider?.icon && (
                                            <Icon
                                                icon={mailboxProvider.icon}
                                                width={15}
                                                height={15}
                                                style={{ color: mailboxProvider.color }}
                                            />
                                        )}
                                        <strong>{watcher.name}</strong>
                                    </Shared.OptionMain>
                                    <ResourceDetail
                                        scope={watcher.scope}
                                        teamName={watcher.team_name}
                                        detail={watcher.address}
                                    />
                                </Shared.Option>
                            ))
                        ) : (
                            <Shared.Empty>No mailbox watcher found.</Shared.Empty>
                        )
                    ) : filteredChannels.length > 0 ? (
                        filteredChannels.map(channel => {
                            const provider = getProviderConfig(channel.provider as IntegrationProvider);

                            return (
                                <Shared.Option
                                    key={channel.id}
                                    type="button"
                                    $selected={String(channel.id) === value}
                                    onMouseDown={event => event.preventDefault()}
                                    onClick={() => {
                                        onChange({ mode: 'fixed', value: String(channel.id) });
                                        close();
                                    }}
                                >
                                    <Shared.OptionMain>
                                        {provider?.icon && (
                                            <Icon
                                                icon={provider.icon}
                                                width={15}
                                                height={15}
                                                style={{ color: provider.color }}
                                            />
                                        )}
                                        <strong>{channel.name}</strong>
                                    </Shared.OptionMain>
                                    <ResourceDetail
                                        scope={channel.scope}
                                        teamName={channel.team_name}
                                        detail={channel.destination || 'No destination'}
                                    />
                                </Shared.Option>
                            );
                        })
                    ) : (
                        <Shared.Empty>No channel found.</Shared.Empty>
                    )}
                </Shared.Dropdown>
            )}
        </Shared.Picker>
    );
}
