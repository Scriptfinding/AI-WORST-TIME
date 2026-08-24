import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import type { IntegrationScope } from '@/Domains/Integration/types';
import { OWNERSHIP_DISABLED_HINT } from '@/Shared/Utils/ownershipPermissions';
import * as S from './styled';

interface ScopeOwnershipFieldsProps {
    editing: boolean;
    scope: IntegrationScope;
    teamId: Id | null;
    ownerId: Id | null;
    teams: { id: Id; name: string }[];
    disabled: boolean;
    onScopeChange: (scope: IntegrationScope, teamId: Id | null) => void;
    onOwnerChange: (ownerId: Id | null) => void;
    onOwnerRoleChange: (role?: string) => void;
}

export default function ScopeOwnershipFields({
    editing,
    scope,
    teamId,
    ownerId,
    teams,
    disabled,
    onScopeChange,
    onOwnerChange,
    onOwnerRoleChange,
}: ScopeOwnershipFieldsProps) {
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
                disabledHint={OWNERSHIP_DISABLED_HINT}
            />
            {editing && (
                <UserPicker
                    label="Owner"
                    value={ownerId}
                    onChange={onOwnerChange}
                    onSelect={selectedUser => onOwnerRoleChange(selectedUser?.workspace_role ?? undefined)}
                    placeholder="Myself (default)"
                    disabled={disabled}
                />
            )}
        </S.Fields>
    );
}
