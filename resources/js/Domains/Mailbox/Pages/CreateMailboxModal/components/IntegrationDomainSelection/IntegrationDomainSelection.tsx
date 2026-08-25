import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import { useIntegrationCreation } from '@/Domains/Integration/Contexts/IntegrationCreationContext';
import Button from '@/Shared/UI/Button/Button';
import type { MailboxDomain } from '@/Domains/Mailbox/types';
import * as S from './styled';

interface Props {
    domains: Pick<MailboxDomain, 'id' | 'name'>[];
    value: string;
    onChange: (domainId: string) => void;
}

export default function IntegrationDomainSelection({ domains, value, onChange }: Props) {
    const integrationCreation = useIntegrationCreation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const selectedDomain = domains.find(domain => String(domain.id) === value);
    const filteredDomains = domains.filter(domain => domain.name.toLowerCase().includes(search.toLowerCase()));

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [dropdownRef],
    });

    const selectDomain = (domainId: number) => {
        onChange(String(domainId));
        setOpen(false);
        setSearch('');
    };

    const createDomain = async () => {
        setCreating(true);
        try {
            const result = await integrationCreation.create({ provider: 'mailbox' });
            if (!result) return;

            await integrationCreation.refresh('mailboxes');
            if (result.domain) onChange(String(result.domain.id));
        } finally {
            setCreating(false);
        }
    };

    if (domains.length === 0) {
        return (
            <S.NoDomainHint>
                <span>No verified domains available. Set up a Mailbox integration and verify a domain first.</span>
                {integrationCreation.available && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        loading={creating}
                        onClick={() => void createDomain()}
                    >
                        + Set up domain
                    </Button>
                )}
            </S.NoDomainHint>
        );
    }

    return (
        <S.SelectWrap ref={dropdownRef}>
            <S.SelectLabel>Domain</S.SelectLabel>
            <S.DropdownTrigger type="button" $open={open} onClick={() => setOpen(current => !current)}>
                <span>{selectedDomain?.name || 'Select a domain'}</span>
                <Icon icon={open ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={16} />
            </S.DropdownTrigger>
            {open && (
                <S.DropdownPanel>
                    <S.DropdownSearch
                        ref={searchRef}
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder="Search domain…"
                    />
                    <S.DropdownList>
                        {filteredDomains.length === 0 ? (
                            <S.DropdownEmpty>No domain found</S.DropdownEmpty>
                        ) : filteredDomains.map(domain => (
                            <S.DropdownItem
                                key={domain.id}
                                $active={String(domain.id) === value}
                                onClick={() => selectDomain(domain.id)}
                            >
                                {domain.name}
                            </S.DropdownItem>
                        ))}
                    </S.DropdownList>
                </S.DropdownPanel>
            )}
        </S.SelectWrap>
    );
}
