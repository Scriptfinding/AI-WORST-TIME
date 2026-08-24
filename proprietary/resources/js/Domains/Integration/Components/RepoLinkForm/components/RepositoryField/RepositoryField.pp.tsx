import { useCallback, useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { RemoteRepo } from '@proprietary/Domains/Integration/Components/RepoLinkForm/types.pp';
import SelectionStatus from '@proprietary/Domains/Integration/Components/RepoLinkForm/components/SelectionStatus/SelectionStatus.pp';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';
import { useFocusWhen } from '@/Shared/Hooks/useFocusWhen';
import * as S from './styled.pp';

interface Props {
    repos: RemoteRepo[];
    loading: boolean;
    selectedRepo?: RemoteRepo;
    repoFullName: string;
    onSelect: (repo: RemoteRepo) => void;
}

export default function RepositoryField({ repos, loading, selectedRepo, repoFullName, onSelect }: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        setSearch('');
    }, []);

    useClickOutside({ refs: [wrapperRef], onOutside: close });
    useFocusWhen({ ref: searchRef, when: open });

    const filteredRepos = useMemo(() => {
        if (!search) return repos;
        const query = search.toLowerCase();
        return repos.filter(repo =>
            repo.full_name.toLowerCase().includes(query) || repo.name.toLowerCase().includes(query),
        );
    }, [repos, search]);

    const handleSelect = (repo: RemoteRepo) => {
        onSelect(repo);
        close();
    };

    return (
        <S.FieldGroup>
            <S.FieldLabelRow>
                <S.FieldLabel>Repository</S.FieldLabel>
                {selectedRepo && (
                    <S.SubtleLink href={selectedRepo.url} target="_blank" rel="noopener noreferrer">
                        <Icon icon="lucide:external-link" width={11} />
                        <span>Go to Repository</span>
                    </S.SubtleLink>
                )}
            </S.FieldLabelRow>
            <S.SelectWrapper ref={wrapperRef}>
                <S.SelectTrigger $hasValue={!!repoFullName} onClick={() => setOpen(value => !value)} type="button">
                    <S.TriggerText>{repoFullName || 'Select a repository...'}</S.TriggerText>
                    <Icon icon="lucide:chevron-down" width={14} />
                </S.SelectTrigger>
                {open && (
                    <S.SelectDropdown>
                        <S.DropdownSearch>
                            <Icon icon="lucide:search" width={12} />
                            <S.DropdownSearchInput
                                ref={searchRef}
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                placeholder="Search repositories..."
                            />
                            {loading && <Icon icon="lucide:loader-2" width={12} className="spin" />}
                        </S.DropdownSearch>
                        <S.DropdownList>
                            <SelectionStatus
                                loading={loading}
                                hasSourceOptions={repos.length > 0}
                                hasOptions={filteredRepos.length > 0}
                                hasSearch={!!search}
                                loadingLabel="Loading repositories..."
                                emptyLabel="No repositories accessible"
                                noMatchLabel="No matching repositories"
                            />
                            {filteredRepos.map(repo => (
                                <S.SelectItem
                                    key={repo.id}
                                    $active={repo.full_name === repoFullName}
                                    onClick={() => handleSelect(repo)}
                                    type="button"
                                >
                                    <Icon icon="lucide:git-branch" width={12} style={{ flexShrink: 0 }} />
                                    {repo.full_name}
                                    {repo.private && (
                                        <Icon icon="lucide:lock" width={10} style={{ flexShrink: 0, opacity: 0.4 }} />
                                    )}
                                    <S.SelectItemMeta>{repo.default_branch}</S.SelectItemMeta>
                                </S.SelectItem>
                            ))}
                        </S.DropdownList>
                    </S.SelectDropdown>
                )}
            </S.SelectWrapper>
        </S.FieldGroup>
    );
}
