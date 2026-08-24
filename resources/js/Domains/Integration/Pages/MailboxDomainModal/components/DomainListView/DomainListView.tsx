import type { FormEvent, MouseEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import ScopePicker, { type ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import type { IntegrationScope } from '@/Domains/Integration/types';
import type { MailboxDomain } from '@/Domains/Mailbox/types';
import { OWNERSHIP_DISABLED_HINT } from '@/Shared/Utils/ownershipPermissions';
import * as S from './styled';

type Domain = MailboxDomain & { mailboxes_count?: number };

interface Props {
    mode: 'create' | 'edit';
    teams: ScopeTeam[];
    isReadonly: boolean;
    ownershipDisabled: boolean;
    editName: string;
    editScope: IntegrationScope;
    editTeamId: Id | null;
    editOwnerId: Id | null;
    savingName: boolean;
    canSave: boolean;
    domains: Domain[];
    loadingDomains: boolean;
    addDomainName: string;
    addingDomain: boolean;
    addDomainError: string;
    isAdmin: boolean;
    deletingIntegration: boolean;
    onEditNameChange: (value: string) => void;
    onEditScopeChange: (scope: IntegrationScope, teamId: Id | null) => void;
    onEditOwnerChange: (userId: Id | null) => void;
    onOwnerRoleChange: (role?: string) => void;
    onSave: () => void;
    onAddDomainNameChange: (value: string) => void;
    onAddDomain: (event: FormEvent) => void;
    onOpenDomain: (domain: MailboxDomain) => void;
    onDeleteDomain: (domain: MailboxDomain) => void;
    onDeleteIntegration: () => void;
    onClose: () => void;
}

export default function DomainListView({
    mode,
    teams,
    isReadonly,
    ownershipDisabled,
    editName,
    editScope,
    editTeamId,
    editOwnerId,
    savingName,
    canSave,
    domains,
    loadingDomains,
    addDomainName,
    addingDomain,
    addDomainError,
    isAdmin,
    deletingIntegration,
    onEditNameChange,
    onEditScopeChange,
    onEditOwnerChange,
    onOwnerRoleChange,
    onSave,
    onAddDomainNameChange,
    onAddDomain,
    onOpenDomain,
    onDeleteDomain,
    onDeleteIntegration,
    onClose,
}: Props) {
    return (
        <>
            {isReadonly && (
                <S.Hint>This mailbox integration is managed by the instance. You can view its domains, but changes are disabled.</S.Hint>
            )}
            {mode === 'edit' && (
                <S.NameRow>
                    <Input
                        label="Integration name"
                        value={editName}
                        onChange={event => onEditNameChange(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                onSave();
                            }
                        }}
                        disabled={savingName || isReadonly}
                    />
                    <ScopePicker
                        label="Visibility"
                        value={{ scope: editScope, team_id: editTeamId }}
                        onChange={value => onEditScopeChange(value.scope as IntegrationScope, value.team_id)}
                        teams={teams}
                        ownerLabel="Owner"
                        ownerScope="owner"
                        disabled={ownershipDisabled}
                        disabledHint={OWNERSHIP_DISABLED_HINT}
                    />
                    <UserPicker
                        label="Owner"
                        value={editOwnerId}
                        onChange={onEditOwnerChange}
                        onSelect={user => onOwnerRoleChange(user?.workspace_role ?? undefined)}
                        placeholder="Myself (default)"
                        disabled={ownershipDisabled}
                    />
                </S.NameRow>
            )}

            {!isReadonly && (
                <S.Form onSubmit={onAddDomain}>
                    <S.DomainAddRow>
                        <Input
                            value={addDomainName}
                            onChange={event => onAddDomainNameChange(event.target.value.toLowerCase())}
                            placeholder="example.com"
                            disabled={addingDomain}
                        />
                        <Button type="submit" size="sm" loading={addingDomain} disabled={!addDomainName.trim()}>
                            <Icon icon="lucide:plus" width={14} />
                            Add
                        </Button>
                    </S.DomainAddRow>
                    {addDomainError && <S.ErrorMessage>{addDomainError}</S.ErrorMessage>}
                </S.Form>
            )}

            <S.DomainList>
                {loadingDomains ? (
                    <S.LoaderPane><S.Spinner /></S.LoaderPane>
                ) : domains.length === 0 ? (
                    <S.EmptyHint>No domains yet. Add one above to get started.</S.EmptyHint>
                ) : (
                    domains.map(domain => (
                        <S.DomainRow key={domain.id} onClick={() => onOpenDomain(domain)}>
                            <S.DomainRowIcon>
                                <Icon icon="lucide:building-2" width={16} />
                            </S.DomainRowIcon>
                            <S.DomainRowInfo>
                                <S.DomainRowName>{domain.name}</S.DomainRowName>
                                <S.DomainRowMeta>
                                    {domain.mailboxes_count ?? 0} mailbox{(domain.mailboxes_count ?? 0) !== 1 ? 'es' : ''}
                                </S.DomainRowMeta>
                            </S.DomainRowInfo>
                            <S.Badge $variant={domain.is_verified ? 'success' : 'warning'}>
                                {domain.is_verified ? 'Verified' : 'Pending'}
                            </S.Badge>
                            {!isReadonly && (
                                <S.DomainRowDelete onClick={(event: MouseEvent) => {
                                    event.stopPropagation();
                                    onDeleteDomain(domain);
                                }}>
                                    <Icon icon="lucide:trash-2" width={13} />
                                </S.DomainRowDelete>
                            )}
                            <S.DomainRowChevron>
                                <Icon icon="lucide:chevron-right" width={14} />
                            </S.DomainRowChevron>
                        </S.DomainRow>
                    ))
                )}
            </S.DomainList>

            {mode === 'edit' && (
                <S.Footer>
                    {isAdmin && !isReadonly && (
                        <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={onDeleteIntegration}
                            loading={deletingIntegration}
                        >
                            <Icon icon="lucide:trash-2" width={13} />
                            Delete
                        </Button>
                    )}
                    {isReadonly ? (
                        <Button type="button" size="sm" onClick={onClose}>Close</Button>
                    ) : (
                        <Button type="button" size="sm" onClick={onSave} loading={savingName} disabled={!canSave}>
                            Save
                        </Button>
                    )}
                </S.Footer>
            )}
        </>
    );
}
