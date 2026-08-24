import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import * as S from './styled';

interface Props {
    scope: string;
    teamId: Id | null;
    ownerId: Id | null;
    teams: ScopeTeam[];
    onScopeChange: (scope: string, teamId: Id | null) => void;
    onOwnerChange: (ownerId: Id | null) => void;
}

export default function ScopeOwnership({
    scope,
    teamId,
    ownerId,
    teams,
    onScopeChange,
    onOwnerChange,
}: Props) {
    return (
        <S.Section>
            <ScopePicker
                label="Visibility"
                value={{ scope, team_id: teamId }}
                onChange={value => onScopeChange(value.scope, value.team_id)}
                teams={teams}
                ownerLabel="Owner"
                ownerScope="owner"
            />
            <UserPicker
                label="Owner"
                value={ownerId}
                onChange={onOwnerChange}
                placeholder="Myself (default)"
            />
        </S.Section>
    );
}
