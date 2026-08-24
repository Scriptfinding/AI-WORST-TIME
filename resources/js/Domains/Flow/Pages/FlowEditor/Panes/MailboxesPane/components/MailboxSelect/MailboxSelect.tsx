import { useState, type Ref } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { SettingsSectionLabel } from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';
import { DropdownEmpty, DropdownItem, DropdownList, DropdownSearch } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/components/shared.styled';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import type { MailboxOption } from '@/Domains/Flow/Pages/FlowEditor/Panes/MailboxesPane/types';
import * as S from './styled';

interface MailboxSelectProps {
    value: Id;
    open: boolean;
    search: string;
    mailboxes: MailboxOption[];
    selectedMailbox?: MailboxOption;
    wrapperRef: Ref<HTMLDivElement>;
    searchRef: Ref<HTMLInputElement>;
    onValueChange: (value: Id) => void;
    onOpenChange: (open: boolean) => void;
    onSearchChange: (value: string) => void;
    onCreatingChange?: (creating: boolean) => void;
}

export default function MailboxSelect({
    value,
    open,
    search,
    mailboxes,
    selectedMailbox,
    wrapperRef,
    searchRef,
    onValueChange,
    onOpenChange,
    onSearchChange,
    onCreatingChange,
}: MailboxSelectProps) {
    const quickCreation = useQuickRequirementCreation();
    const [refreshing, setRefreshing] = useState(false);

    const selectMailbox = (mailboxId: Id) => {
        onValueChange(mailboxId);
        onOpenChange(false);
        onSearchChange('');
    };

    const createMailbox = async () => {
        onCreatingChange?.(true);
        try {
            const mailbox = await quickCreation.create('mailbox');
            if (mailbox) {
                await quickCreation.refresh('mailboxes');
                selectMailbox(mailbox.id);
                return;
            }
        } finally {
            onCreatingChange?.(false);
        }
        requestAnimationFrame(() => {
            if (searchRef && 'current' in searchRef) searchRef.current?.focus();
        });
    };

    const refreshMailboxes = async () => {
        setRefreshing(true);
        try {
            await quickCreation.refresh('mailboxes');
        } finally {
            setRefreshing(false);
            requestAnimationFrame(() => {
                if (searchRef && 'current' in searchRef) searchRef.current?.focus();
            });
        }
    };

    return (
        <S.SelectWrap ref={wrapperRef}>
            <SettingsSectionLabel>Mailbox</SettingsSectionLabel>
            <S.DropdownTrigger
                type="button"
                $open={open}
                onClick={() => onOpenChange(!open)}
            >
                <span>
                    {selectedMailbox
                        ? `${selectedMailbox.slug}@${selectedMailbox.domain.name}`
                        : 'Select a mailbox'}
                </span>
                <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={16} />
            </S.DropdownTrigger>
            {open && (
                <S.DropdownPanel>
                    <S.SearchRow>
                        <DropdownSearch
                            ref={searchRef}
                            value={search}
                            onChange={event => onSearchChange(event.target.value)}
                            placeholder="Search mailbox..."
                        />
                        <S.RefreshButton
                            type="button"
                            title="Refresh mailboxes"
                            aria-label="Refresh mailboxes"
                            disabled={refreshing}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => void refreshMailboxes()}
                        >
                            <Icon icon={refreshing ? 'lucide:loader-circle' : 'lucide:refresh-cw'} width={13} />
                        </S.RefreshButton>
                    </S.SearchRow>
                    {quickCreation.available && (
                        <S.CreateAction type="button" onClick={createMailbox}>
                            + Add mailbox
                        </S.CreateAction>
                    )}
                    <DropdownList>
                        {mailboxes.length === 0 ? (
                            <DropdownEmpty>No mailbox found</DropdownEmpty>
                        ) : mailboxes.map(mailbox => (
                            <DropdownItem
                                key={mailbox.id}
                                $active={mailbox.id === value}
                                onClick={() => selectMailbox(mailbox.id)}
                            >
                                {mailbox.slug}@{mailbox.domain.name}
                            </DropdownItem>
                        ))}
                    </DropdownList>
                </S.DropdownPanel>
            )}
        </S.SelectWrap>
    );
}
