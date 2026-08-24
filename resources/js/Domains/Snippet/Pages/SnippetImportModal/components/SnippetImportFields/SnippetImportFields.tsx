import React from 'react';
import Input from '@/Shared/UI/Input/Input';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { IntegrationScope } from '@/Domains/Integration/types';
import GroupCombobox from '@/Domains/Snippet/Pages/SnippetImportModal/components/GroupCombobox/GroupCombobox';
import * as S from './styled';

interface Props {
    label: string;
    args: string;
    group: string;
    description: string;
    scope: IntegrationScope;
    teamId: Id | null;
    groups: string[];
    teams: { id: Id; name: string }[];
    onLabelChange: (value: string) => void;
    onArgsChange: (value: string) => void;
    onGroupChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onScopeChange: (scope: IntegrationScope, teamId: Id | null) => void;
}

export default function SnippetImportFields({
    label,
    args,
    group,
    description,
    scope,
    teamId,
    groups,
    teams,
    onLabelChange,
    onArgsChange,
    onGroupChange,
    onDescriptionChange,
    onScopeChange,
}: Props) {
    return (
        <>
            <Input
                label="Label"
                value={label}
                onChange={event => onLabelChange(event.target.value)}
                placeholder="Imported Snippet"
            />

            <S.TwoColumn>
                <Input
                    label="Arguments"
                    value={args}
                    onChange={event => onArgsChange(event.target.value)}
                    placeholder="e.g. name, value, options"
                />
                <GroupCombobox value={group} onChange={onGroupChange} groups={groups} />
            </S.TwoColumn>

            <Input
                label="Description (Optional)"
                value={description}
                onChange={event => onDescriptionChange(event.target.value)}
                placeholder="Description"
            />

            <ScopePicker
                label="Visibility"
                value={{ scope, team_id: teamId }}
                teams={teams}
                ownerLabel="Personal"
                ownerScope="owner"
                onChange={value => onScopeChange(value.scope as IntegrationScope, value.team_id)}
            />
        </>
    );
}
