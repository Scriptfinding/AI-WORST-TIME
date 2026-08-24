import type { FormEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import ScopePicker, { type ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { IntegrationScope } from '@/Domains/Integration/types';
import * as S from './styled';

interface Props {
    integrationName: string;
    domainName: string;
    scope: IntegrationScope;
    teamId: Id | null;
    teams: ScopeTeam[];
    error: string;
    submitting: boolean;
    onIntegrationNameChange: (value: string) => void;
    onDomainNameChange: (value: string) => void;
    onScopeChange: (scope: IntegrationScope, teamId: Id | null) => void;
    onSubmit: (event: FormEvent) => void;
    onCancel: () => void;
}

export default function IntegrationForm({
    integrationName,
    domainName,
    scope,
    teamId,
    teams,
    error,
    submitting,
    onIntegrationNameChange,
    onDomainNameChange,
    onScopeChange,
    onSubmit,
    onCancel,
}: Props) {
    return (
        <S.Form onSubmit={onSubmit}>
            <Input
                label="Integration name"
                value={integrationName}
                onChange={event => onIntegrationNameChange(event.target.value)}
                placeholder="my-mailbox"
                autoFocus
            />
            <Input
                label="Domain name"
                value={domainName}
                onChange={event => onDomainNameChange(event.target.value.toLowerCase())}
                placeholder="mail.example.com"
            />
            <S.Hint>Enter the domain you want to receive emails on. You can add more domains later.</S.Hint>
            <ScopePicker
                label="Visibility"
                value={{ scope, team_id: teamId }}
                onChange={value => onScopeChange(value.scope as IntegrationScope, value.team_id)}
                teams={teams}
                ownerLabel="Owner"
                ownerScope="owner"
            />
            {error && <S.ErrorMessage>{error}</S.ErrorMessage>}
            <S.Actions>
                <Button type="button" variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
                <Button
                    type="submit"
                    size="sm"
                    loading={submitting}
                    disabled={!integrationName.trim() || !domainName.trim()}
                >
                    <Icon icon="lucide:plus" width={14} />
                    Create
                </Button>
            </S.Actions>
        </S.Form>
    );
}
