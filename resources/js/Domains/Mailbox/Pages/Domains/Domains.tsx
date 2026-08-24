import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { Subtitle, AddForm, AddInput, DomainList, DomainRow, DomainName, DomainMeta, DeleteBtn, EmptyState, ErrorText } from './Domains.styled';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import type { Integration } from '@/Domains/Integration/types';
import type { MailboxDomain } from '@/Domains/Mailbox/types';
import * as SharedStyles from './shared.styled';

const S = {
    ...SharedStyles,
    AddForm,
    AddInput,
    DeleteBtn,
    DomainList,
    DomainMeta,
    DomainName,
    DomainRow,
    EmptyState,
    ErrorText,
    Subtitle,
};

interface Props {
    integration: Pick<Integration, 'id' | 'name' | 'provider'>;
    domains: (MailboxDomain & { mailboxes_count: number })[];
}

export default function Domains({ integration, domains }: Props) {
    const [name, setName] = useState('');
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState('');
    const { confirm, ConfirmModal } = useConfirm();

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setAdding(true);
        setError('');
        router.post(`/integrations/${integration.id}/mailbox/domains`, { name: name.trim() }, {
            preserveScroll: true,
            onSuccess: () => { setName(''); setAdding(false); },
            onError: (errs) => { setError(errs.name || 'Failed to add domain.'); setAdding(false); },
        });
    };

    const handleDelete = async (domain: MailboxDomain) => {
        const ok = await confirm({
            title: 'Delete Domain',
            message: `Delete "${domain.name}" and all associated mailboxes? This cannot be undone.`,
            confirmLabel: 'Delete',
            variant: 'danger',
        });
        if (!ok) return;
        router.delete(`/integrations/${integration.id}/mailbox/domains/${domain.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout title={`${integration.name} - Domains`}>
            <S.Page>
                <S.Header>
                    <S.HeaderLeft>
                        <S.BackLink href="/integrations" onClick={e => { e.preventDefault(); router.visit('/integrations'); }}>
                            <Icon icon="lucide:arrow-left" width={14} />
                            Back to Integrations
                        </S.BackLink>
                        <S.Title>Domains</S.Title>
                        <S.Subtitle>Configure email domains for your Mailbox integration.</S.Subtitle>
                    </S.HeaderLeft>
                </S.Header>

                <S.AddForm onSubmit={handleAdd}>
                    <S.AddInput
                        value={name}
                        onChange={e => { setName(e.target.value); setError(''); }}
                        placeholder="example.com"
                        disabled={adding}
                    />
                    <Button type="submit" size="sm" loading={adding} disabled={!name.trim()}>
                        <Icon icon="lucide:plus" width={14} />
                        Add Domain
                    </Button>
                </S.AddForm>
                {error && <S.ErrorText>{error}</S.ErrorText>}

                {domains.length === 0 ? (
                    <S.EmptyState>No domains yet. Add a domain above to get started.</S.EmptyState>
                ) : (
                    <S.DomainList>
                        {domains.map(domain => (
                            <S.DomainRow key={domain.id}>
                                <S.DomainName
                                    href={`/integrations/${integration.id}/mailbox/domains/${domain.id}`}
                                    onClick={e => { e.preventDefault(); router.visit(`/integrations/${integration.id}/mailbox/domains/${domain.id}`); }}
                                >
                                    {domain.name}
                                </S.DomainName>
                                <S.StatusBadge $variant={domain.is_verified ? 'success' : 'warning'}>
                                    {domain.is_verified ? 'Verified' : 'Pending'}
                                </S.StatusBadge>
                                <S.DomainMeta>{domain.mailboxes_count} mailbox{domain.mailboxes_count !== 1 ? 'es' : ''}</S.DomainMeta>
                                <S.DeleteBtn onClick={() => handleDelete(domain)} title="Delete domain">
                                    <Icon icon="lucide:trash-2" width={14} />
                                </S.DeleteBtn>
                            </S.DomainRow>
                        ))}
                    </S.DomainList>
                )}

                <ConfirmModal />
            </S.Page>
        </AppLayout>
    );
}
