import { useCallback, useMemo, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Input from '@/Shared/UI/Input/Input';
import SelectionStatus from '@proprietary/Domains/Integration/Components/RepoLinkForm/components/SelectionStatus/SelectionStatus.pp';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';
import { useFocusWhen } from '@/Shared/Hooks/useFocusWhen';
import * as S from './styled.pp';

interface Props {
    branches: string[];
    loading: boolean;
    branch: string;
    defaultBranch?: string;
    filePath: string;
    onBranchChange: (branch: string) => void;
    onFilePathChange: (filePath: string) => void;
}

export default function BranchPathFields({
    branches,
    loading,
    branch,
    defaultBranch,
    filePath,
    onBranchChange,
    onFilePathChange,
}: Props) {
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

    const filteredBranches = useMemo(() => {
        if (!search) return branches;
        const query = search.toLowerCase();
        return branches.filter(option => option.toLowerCase().includes(query));
    }, [branches, search]);

    const handleBranchChange = (option: string) => {
        onBranchChange(option);
        close();
    };

    return (
        <>
            <S.FieldGroup>
                <S.FieldLabel>Branch</S.FieldLabel>
                <S.SelectWrapper ref={wrapperRef}>
                    <S.SelectTrigger $hasValue={!!branch} onClick={() => setOpen(value => !value)} type="button">
                        <span>{branch || 'Select a branch...'}</span>
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
                                    placeholder="Search branches..."
                                />
                                {loading && <Icon icon="lucide:loader-2" width={12} className="spin" />}
                            </S.DropdownSearch>
                            <S.DropdownList>
                                <SelectionStatus
                                    loading={loading}
                                    hasSourceOptions={branches.length > 0}
                                    hasOptions={filteredBranches.length > 0}
                                    hasSearch={!!search}
                                    loadingLabel="Loading branches..."
                                    emptyLabel="No branches found"
                                    noMatchLabel="No matching branches"
                                />
                                {filteredBranches.map(option => (
                                    <S.SelectItem
                                        key={option}
                                        $active={option === branch}
                                        onClick={() => handleBranchChange(option)}
                                        type="button"
                                    >
                                        {option}
                                        {option === defaultBranch && <S.SelectItemMeta>default</S.SelectItemMeta>}
                                    </S.SelectItem>
                                ))}
                            </S.DropdownList>
                        </S.SelectDropdown>
                    )}
                </S.SelectWrapper>
            </S.FieldGroup>
            <S.FieldGroup>
                <S.FieldLabel>File Path</S.FieldLabel>
                <Input
                    value={filePath}
                    onChange={event => onFilePathChange(event.target.value)}
                    placeholder="nodeBody.js"
                />
                <S.FieldHint>Path to the flow JavaScript file in the repository.</S.FieldHint>
            </S.FieldGroup>
        </>
    );
}
