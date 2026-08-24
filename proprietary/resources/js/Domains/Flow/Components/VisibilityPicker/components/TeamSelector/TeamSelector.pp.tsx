import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useTheme } from 'styled-components';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import type { TeamTree } from '@/Domains/Folder/types';
import * as S from './styled.pp';

interface Props {
    teams: TeamTree[];
    selectedTeamId: Id | null;
    onChange: (teamId: Id) => void;
}

export default function TeamSelector({
    teams,
    selectedTeamId,
    onChange,
}: Props) {
    const theme = useTheme();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => undefined,
        focusRef: searchRef,
        containerRefs: [wrapperRef],
        eventType: 'mousedown',
    });

    const selectedTeam = teams.find((team) => team.id === selectedTeamId);
    const normalizedSearch = search.toLowerCase();
    const filteredTeams = search
        ? teams.filter((team) =>
              team.name.toLowerCase().includes(normalizedSearch),
          )
        : teams;

    const handleSelect = (teamId: Id) => {
        onChange(teamId);
        setOpen(false);
        setSearch('');
    };

    return (
        <S.Wrapper ref={wrapperRef}>
            <S.Trigger
                type="button"
                $open={open}
                onClick={() => {
                    setOpen((current) => !current);
                    setSearch('');
                }}
            >
                <Icon
                    icon="lucide:users"
                    width={14}
                    style={{ color: theme.colors.accent.success }}
                />
                {selectedTeam ? selectedTeam.name : 'Select a team...'}
                <Icon
                    icon={
                        open
                            ? 'lucide:chevron-up'
                            : 'lucide:chevron-down'
                    }
                    width={12}
                    style={{ marginLeft: 'auto', opacity: 0.5 }}
                />
            </S.Trigger>

            {open && (
                <S.Panel>
                    <S.Search
                        ref={searchRef}
                        placeholder="Search teams..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        autoFocus
                    />
                    <S.List>
                        {filteredTeams.map((team) => (
                            <S.Item
                                key={team.id}
                                type="button"
                                $active={selectedTeamId === team.id}
                                onClick={() => handleSelect(team.id)}
                            >
                                <Icon
                                    icon="lucide:users"
                                    width={14}
                                    style={{
                                        color: theme.colors.accent.success,
                                    }}
                                />
                                {team.name}
                                {selectedTeamId === team.id && (
                                    <Icon
                                        icon="lucide:check"
                                        width={14}
                                        style={{
                                            marginLeft: 'auto',
                                            color:
                                                theme.colors.accent.success,
                                        }}
                                    />
                                )}
                            </S.Item>
                        ))}
                        {filteredTeams.length === 0 && (
                            <S.Empty>
                                {teams.length === 0
                                    ? 'You are not a member of any team.'
                                    : 'No team found.'}
                            </S.Empty>
                        )}
                    </S.List>
                </S.Panel>
            )}
        </S.Wrapper>
    );
}
