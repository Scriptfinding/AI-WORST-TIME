import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Input from '@/Shared/UI/Input/Input';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from './styled';

interface Props {
    slug: string;
    domainName?: string;
    description: string;
    group: string;
    groups: string[];
    error: string;
    onSlugChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onGroupChange: (value: string) => void;
}

export default function MailboxIdentityOptions({
    slug,
    domainName,
    description,
    group,
    groups,
    error,
    onSlugChange,
    onDescriptionChange,
    onGroupChange,
}: Props) {
    const [groupOpen, setGroupOpen] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const filteredGroups = groups.filter(item => !groupSearch || item.toLowerCase().includes(groupSearch.toLowerCase()));
    const hasExactMatch = groups.some(item => item.toLowerCase() === groupSearch.trim().toLowerCase());

    useSearchablePopover({
        open: groupOpen,
        onDismiss: () => setGroupOpen(false),
        reset: () => setGroupSearch(''),
        focusRef: searchRef,
        containerRefs: [dropdownRef],
    });

    const selectGroup = (value: string) => {
        onGroupChange(value);
        setGroupOpen(false);
        setGroupSearch('');
    };

    return (
        <S.OptionsSection>
            <S.InputWrap>
                <S.InputLabel>Mailbox address</S.InputLabel>
                <S.InputGroup>
                    <S.InputLeft>
                        <Input
                            value={slug}
                            onChange={event => onSlugChange(event.target.value)}
                            placeholder="contact"
                            error={error || undefined}
                        />
                    </S.InputLeft>
                    <S.InputSuffix>@{domainName || 'domain.com'}</S.InputSuffix>
                </S.InputGroup>
                <S.HelperText>Lowercase letters, numbers, dots, hyphens allowed.</S.HelperText>
            </S.InputWrap>

            <Input
                label="Description (Optional)"
                value={description}
                onChange={event => onDescriptionChange(event.target.value)}
                placeholder="Customer support mailbox"
            />

            <S.ComboboxWrapper ref={dropdownRef}>
                <S.ComboboxLabel>Group (Optional)</S.ComboboxLabel>
                <S.ComboboxTrigger
                    type="button"
                    $open={groupOpen}
                    $hasValue={!!group}
                    onClick={() => {
                        setGroupOpen(current => !current);
                        setGroupSearch('');
                    }}
                >
                    <Icon icon="lucide:folder" width={14} />
                    {group || 'Group name'}
                    {group ? (
                        <S.ComboboxClear
                            onClick={event => {
                                event.stopPropagation();
                                onGroupChange('');
                                setGroupOpen(false);
                            }}
                        >
                            <Icon icon="lucide:x" width={14} />
                        </S.ComboboxClear>
                    ) : (
                        <Icon icon="lucide:chevron-down" width={14} />
                    )}
                </S.ComboboxTrigger>
                {groupOpen && (
                    <S.ComboboxPanel>
                        <S.DropdownSearchWrapper>
                            <S.DropdownSearchInput
                                ref={searchRef}
                                value={groupSearch}
                                onChange={event => setGroupSearch(event.target.value)}
                                placeholder="Search or create group..."
                                onKeyDown={event => {
                                    if (event.key === 'Enter' && groupSearch.trim()) {
                                        event.preventDefault();
                                        selectGroup(groupSearch.trim());
                                    }
                                }}
                            />
                        </S.DropdownSearchWrapper>
                        <S.GroupDropdownList>
                            {filteredGroups.map(item => (
                                <S.GroupDropdownItem
                                    key={item}
                                    type="button"
                                    $active={group === item}
                                    onClick={() => selectGroup(item)}
                                >
                                    <Icon icon="lucide:folder" width={14} />
                                    {item}
                                </S.GroupDropdownItem>
                            ))}
                            {groupSearch.trim() && !hasExactMatch && (
                                <S.ComboboxCreate type="button" onClick={() => selectGroup(groupSearch.trim())}>
                                    <Icon icon="lucide:plus" width={14} />
                                    Create "{groupSearch.trim()}"
                                </S.ComboboxCreate>
                            )}
                            {!groupSearch && groups.length === 0 && (
                                <S.GroupDropdownEmpty>Type to create a group</S.GroupDropdownEmpty>
                            )}
                        </S.GroupDropdownList>
                    </S.ComboboxPanel>
                )}
            </S.ComboboxWrapper>
        </S.OptionsSection>
    );
}
