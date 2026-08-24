import { useEffect, useMemo, useRef, useState } from 'react';
import Input from '@/Shared/UI/Input/Input';
import Switch from '@/Shared/UI/Switch/Switch';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import GroupCombobox from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/GroupCombobox/GroupCombobox';
import MailboxSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/MailboxSelect/MailboxSelect';
import type { MailboxOption } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';
import * as S from './styled';

interface IdentityMailboxFieldsProps {
    isOpen: boolean;
    editingId?: Id;
    editingGroup?: string | null;
    groups: string[];
    mailboxes: MailboxOption[];
    name: string;
    group: string;
    mailboxId: Id;
    isActive: boolean;
    onNameChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onMailboxChange: (value: Id) => void;
    onActiveChange: (value: boolean) => void;
}

export default function IdentityMailboxFields({
    isOpen,
    editingId,
    editingGroup,
    groups,
    mailboxes,
    name,
    group,
    mailboxId,
    isActive,
    onNameChange,
    onGroupChange,
    onMailboxChange,
    onActiveChange,
}: IdentityMailboxFieldsProps) {
    const [mailboxDropdownOpen, setMailboxDropdownOpen] = useState(false);
    const [mailboxCreating, setMailboxCreating] = useState(false);
    const [mailboxSearch, setMailboxSearch] = useState('');
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');
    const mailboxDropdownRef = useRef<HTMLDivElement>(null);
    const mailboxSearchRef = useRef<HTMLInputElement>(null);
    const groupDropdownRef = useRef<HTMLDivElement>(null);
    const groupSearchRef = useRef<HTMLInputElement>(null);

    useSearchablePopover({
        open: mailboxDropdownOpen && !mailboxCreating,
        onDismiss: () => setMailboxDropdownOpen(false),
        reset: () => setMailboxSearch(''),
        focusRef: mailboxSearchRef,
        containerRefs: [mailboxDropdownRef],
    });

    useSearchablePopover({
        open: groupDropdownOpen,
        onDismiss: () => setGroupDropdownOpen(false),
        reset: () => setGroupSearch(''),
        focusRef: groupSearchRef,
        containerRefs: [groupDropdownRef],
    });

    useEffect(() => {
        if (!isOpen) return;
        setMailboxDropdownOpen(false);
        setMailboxSearch('');
        setGroupDropdownOpen(false);
        setGroupSearch('');
    }, [editingId, isOpen]);

    const allGroups = useMemo(() => {
        const values = new Set(groups);
        if (editingGroup) values.add(editingGroup);
        return [...values].sort();
    }, [editingGroup, groups]);
    const filteredGroups = allGroups.filter(value => (
        !groupSearch || value.toLowerCase().includes(groupSearch.toLowerCase())
    ));
    const groupExactMatch = allGroups.some(value => (
        value.toLowerCase() === groupSearch.trim().toLowerCase()
    ));
    const selectedMailbox = mailboxes.find(mailbox => mailbox.id === mailboxId);
    const filteredMailboxes = mailboxes.filter(mailbox => {
        if (!mailboxSearch.trim()) return true;
        const query = mailboxSearch.toLowerCase();
        const address = `${mailbox.slug}@${mailbox.domain.name}`.toLowerCase();
        return address.includes(query)
            || mailbox.slug.toLowerCase().includes(query)
            || mailbox.domain.name.toLowerCase().includes(query);
    });

    return (
        <>
            <S.TopRow>
                <S.TopRowField>
                    <Input
                        label="Label"
                        value={name}
                        onChange={event => onNameChange(event.target.value)}
                        placeholder="e.g. Verification code"
                        autoFocus
                    />
                </S.TopRowField>
                <S.TopRowSwitch>
                    <Switch id="watcher-active" checked={isActive} onChange={onActiveChange} label="Active" />
                </S.TopRowSwitch>
            </S.TopRow>
            <GroupCombobox
                value={group}
                search={groupSearch}
                open={groupDropdownOpen}
                groups={filteredGroups}
                exactMatch={groupExactMatch}
                wrapperRef={groupDropdownRef}
                searchRef={groupSearchRef}
                onValueChange={onGroupChange}
                onSearchChange={setGroupSearch}
                onOpenChange={setGroupDropdownOpen}
            />
            <MailboxSelect
                value={mailboxId}
                open={mailboxDropdownOpen}
                search={mailboxSearch}
                mailboxes={filteredMailboxes}
                selectedMailbox={selectedMailbox}
                wrapperRef={mailboxDropdownRef}
                searchRef={mailboxSearchRef}
                onValueChange={onMailboxChange}
                onOpenChange={setMailboxDropdownOpen}
                onSearchChange={setMailboxSearch}
                onCreatingChange={setMailboxCreating}
            />
        </>
    );
}
