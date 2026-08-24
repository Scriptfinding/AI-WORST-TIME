/*
 * Portions of this file implement paid Puppetflow features (teams and
 * workspace sharing) and are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { usePageProps } from '@/App/Hooks/usePageProps';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from './styled.pp';

export interface ScopeTeam {
    id: Id;
    name: string;
}

export interface ScopeValue {
    scope: string;
    team_id: Id | null;
}

interface Props {
    label?: string;
    value: ScopeValue;
    onChange: (value: ScopeValue) => void;
    teams: ScopeTeam[];
    ownerLabel?: string;
    ownerScope?: string;
    disabled?: boolean;
    disabledHint?: string;
}

const SCOPE_ICONS: Record<string, string> = {
    user: 'lucide:user',
    owner: 'lucide:user',
    workspace: 'lucide:building-2',
    team: 'lucide:users-round',
};

export default function ScopePicker({ label, value, onChange, teams: teamsProp, ownerLabel = 'Owner', ownerScope = 'user', disabled, disabledHint }: Props) {
    const { settings } = usePageProps();
    const workspaceSharingEnabled = settings?.workspace_sharing_enabled ?? false;
    const teamsEnabled = settings?.teams_enabled ?? false;
    const showDisabledFeatures = settings?.promote_disabled_features ?? false;
    const [availableTeams, setAvailableTeams] = useState(teamsProp);
    const [refreshing, setRefreshing] = useState(false);
    const teams = useMemo(() => teamsEnabled ? availableTeams : [], [availableTeams, teamsEnabled]);
    const effectiveValue = (
        (value.scope === 'workspace' && !workspaceSharingEnabled)
        || (value.scope === 'team' && !teamsEnabled)
    )
        ? { scope: ownerScope, team_id: null }
        : value;
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: inputRef,
        containerRefs: [containerRef],
        eventType: 'mousedown',
    });

    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

    useEffect(() => {
        setAvailableTeams(teamsProp);
    }, [teamsProp]);

    const refreshTeams = useCallback(async () => {
        setRefreshing(true);
        try {
            const response = await fetch('/workspace/teams-search', {
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) return;

            const refreshedTeams: ScopeTeam[] = await response.json();
            setAvailableTeams(refreshedTeams);
        } catch {
            // Keep the existing options when the refresh fails.
        } finally {
            setRefreshing(false);
        }
    }, []);

    const selectedTeam = effectiveValue.scope === 'team' ? teams.find(t => t.id === effectiveValue.team_id) : null;

    const displayLabel = effectiveValue.scope === 'team' && selectedTeam
        ? `Team - ${selectedTeam.name}`
        : effectiveValue.scope === 'workspace'
            ? 'Workspace (all members)'
            : ownerLabel;

    const displayIcon = effectiveValue.scope === 'team' ? SCOPE_ICONS.team : SCOPE_ICONS[effectiveValue.scope] || SCOPE_ICONS.user;

    const filteredTeams = useMemo(() => {
        if (!search.trim()) return teams;
        const q = search.toLowerCase();
        return teams.filter(t => t.name.toLowerCase().includes(q));
    }, [teams, search]);

    const matchesOwner = !search.trim() || ownerLabel.toLowerCase().includes(search.toLowerCase());
    const matchesWorkspace = (workspaceSharingEnabled || showDisabledFeatures)
        && (!search.trim() || 'workspace'.includes(search.toLowerCase()) || 'all members'.includes(search.toLowerCase()));
    const matchesUnavailableTeam = !teamsEnabled
        && showDisabledFeatures
        && (!search.trim() || 'team'.includes(search.toLowerCase()));

    return (
        <S.Wrapper ref={containerRef}>
            {label && <S.Label>{label}</S.Label>}
            <S.Trigger type="button" disabled={disabled} $open={open} $disabled={disabled} onClick={() => setOpen(o => !o)}>
                <Icon icon={displayIcon} width={14} />
                <S.TriggerLabel>{displayLabel}</S.TriggerLabel>
                <S.TriggerArrow $open={open}>
                    <Icon icon="lucide:chevron-down" width={14} />
                </S.TriggerArrow>
            </S.Trigger>
            {disabled && disabledHint && <S.DisabledHint>{disabledHint}</S.DisabledHint>}
            {open && !disabled && (
                <S.Panel>
                    <S.SearchWrapper>
                        <S.SearchInput
                            ref={inputRef}
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                            placeholder="Search scope..."
                        />
                        {teamsEnabled && (
                            <S.RefreshButton
                                type="button"
                                title="Refresh teams"
                                aria-label="Refresh teams"
                                disabled={refreshing}
                                $loading={refreshing}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => void refreshTeams()}
                            >
                                <Icon icon="lucide:refresh-cw" width={13} height={13} />
                            </S.RefreshButton>
                        )}
                    </S.SearchWrapper>
                    {refreshing ? (
                        <S.Loading>
                            <Icon icon="lucide:loader-circle" width={16} height={16} />
                        </S.Loading>
                    ) : <S.List>
                        {matchesOwner && (
                            <S.Option
                                type="button"
                                $selected={effectiveValue.scope === ownerScope}
                                onClick={() => { onChange({ scope: ownerScope, team_id: null }); setOpen(false); }}
                            >
                                <Icon icon={SCOPE_ICONS[ownerScope] || SCOPE_ICONS.user} width={14} />
                                <S.OptionLabel>{ownerLabel}</S.OptionLabel>
                                {effectiveValue.scope === ownerScope && <Icon icon="lucide:check" width={14} />}
                            </S.Option>
                        )}
                        {matchesWorkspace && (
                            <S.Option
                                type="button"
                                $selected={effectiveValue.scope === 'workspace'}
                                $disabled={!workspaceSharingEnabled}
                                disabled={!workspaceSharingEnabled}
                                onClick={() => { onChange({ scope: 'workspace', team_id: null }); setOpen(false); }}
                            >
                                <Icon icon="lucide:building-2" width={14} />
                                <S.OptionLabel>Workspace (all members)</S.OptionLabel>
                                {effectiveValue.scope === 'workspace' && <Icon icon="lucide:check" width={14} />}
                            </S.Option>
                        )}
                        {matchesUnavailableTeam && (
                            <S.Option
                                type="button"
                                $selected={false}
                                $disabled
                                disabled
                            >
                                <Icon icon="lucide:users-round" width={14} />
                                <S.OptionLabel>Team</S.OptionLabel>
                            </S.Option>
                        )}
                        {filteredTeams.length > 0 && (
                            <>
                                <S.Separator />
                                <S.SectionLabel>Teams</S.SectionLabel>
                                <S.TeamList>
                                {filteredTeams.map(t => (
                                    <S.Option
                                        key={t.id}
                                        type="button"
                                        $selected={effectiveValue.scope === 'team' && effectiveValue.team_id === t.id}
                                        onClick={() => { onChange({ scope: 'team', team_id: t.id }); setOpen(false); }}
                                    >
                                        <Icon icon="lucide:users-round" width={14} />
                                        <S.OptionLabel>{t.name}</S.OptionLabel>
                                        {effectiveValue.scope === 'team' && effectiveValue.team_id === t.id && <Icon icon="lucide:check" width={14} />}
                                    </S.Option>
                                ))}
                                </S.TeamList>
                            </>
                        )}
                        {!matchesOwner && !matchesWorkspace && !matchesUnavailableTeam && filteredTeams.length === 0 && (
                            <S.Empty>No results</S.Empty>
                        )}
                    </S.List>}
                </S.Panel>
            )}
        </S.Wrapper>
    );
}
