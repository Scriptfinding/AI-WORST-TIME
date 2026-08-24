import React from 'react';
import ScopePicker, { type ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker, { type PickerUser } from '@/Shared/UI/UserPicker/UserPicker';
import type { IntegrationScope } from '@/Domains/Integration/types';
import { OWNERSHIP_DISABLED_HINT } from '@/Shared/Utils/ownershipPermissions';
import * as S from './styled';

interface Props {
    scope: IntegrationScope;
    teamId: Id | null;
    ownerId?: Id | null;
    teams: ScopeTeam[];
    disabled?: boolean;
    disabledHint?: string;
    onScopeChange: (scope: IntegrationScope, teamId: Id | null) => void;
    onOwnerChange?: (ownerId: Id | null) => void;
    onOwnerSelect?: (user: PickerUser | null) => void;
}

export default function OwnershipScopeFields({
    scope,
    teamId,
    ownerId,
    teams,
    disabled = false,
    disabledHint = OWNERSHIP_DISABLED_HINT,
    onScopeChange,
    onOwnerChange,
    onOwnerSelect,
}: Props) {
    const showOwner = ownerId !== undefined && onOwnerChange && onOwnerSelect;

    return (
        <S.Fields>
            <ScopePicker
                label="Visibility"
                value={{ scope, team_id: teamId }}
                onChange={value => onScopeChange(value.scope as IntegrationScope, value.team_id)}
                teams={teams}
                ownerLabel="Owner"
                ownerScope="owner"
                disabled={disabled}
                disabledHint={disabledHint}
            />
            {showOwner && (
                <UserPicker
                    label="Owner"
                    value={ownerId}
                    onChange={onOwnerChange}
                    onSelect={onOwnerSelect}
                    placeholder="Myself (default)"
                    disabled={disabled}
                />
            )}
        </S.Fields>
    );
}
