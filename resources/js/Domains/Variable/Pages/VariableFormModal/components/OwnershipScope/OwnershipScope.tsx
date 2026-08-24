import ScopePicker, { type ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import { OWNERSHIP_DISABLED_HINT } from '@/Shared/Utils/ownershipPermissions';
import * as S from './styled';

interface OwnershipScopeProps {
    scope: string;
    teamId: Id | null;
    teams: ScopeTeam[];
    ownerId: Id | null;
    disabled: boolean;
    onScopeChange: (scope: string, teamId: Id | null) => void;
    onOwnerChange: (ownerId: Id | null) => void;
    onOwnerRoleChange: (role?: string) => void;
}

export default function OwnershipScope({
    scope,
    teamId,
    teams,
    ownerId,
    disabled,
    onScopeChange,
    onOwnerChange,
    onOwnerRoleChange,
}: OwnershipScopeProps) {
    return (
        <S.Fields>
            <ScopePicker
                label="Visibility"
                value={{ scope, team_id: teamId }}
                onChange={value => onScopeChange(value.scope, value.team_id)}
                teams={teams}
                ownerLabel="Owner"
                ownerScope="user"
                disabled={disabled}
                disabledHint={OWNERSHIP_DISABLED_HINT}
            />
            <UserPicker
                label="Owner"
                value={ownerId}
                onChange={onOwnerChange}
                onSelect={user => onOwnerRoleChange(user?.workspace_role)}
                placeholder="Myself (default)"
                disabled={disabled}
            />
        </S.Fields>
    );
}
