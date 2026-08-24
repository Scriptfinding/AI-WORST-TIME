import Input from '@/Shared/UI/Input/Input';
import ScopePicker, { type ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import GroupCombobox from '@/Domains/Variable/Pages/VariableFormModal/GroupCombobox';
import * as S from './styled';

interface ImportOptionsProps {
    prefix: string;
    group: string;
    scope: string;
    teamId: Id | null;
    ownerId: Id | null;
    groups: string[];
    teams: ScopeTeam[];
    onPrefixChange: (prefix: string) => void;
    onGroupChange: (group: string) => void;
    onScopeChange: (scope: string, teamId: Id | null) => void;
    onOwnerChange: (ownerId: Id | null) => void;
    onOwnerRoleChange: (role?: string) => void;
}

export default function ImportOptions({
    prefix,
    group,
    scope,
    teamId,
    ownerId,
    groups,
    teams,
    onPrefixChange,
    onGroupChange,
    onScopeChange,
    onOwnerChange,
    onOwnerRoleChange,
}: ImportOptionsProps) {
    return (
        <>
            <S.Fields>
                <Input
                    label="Prefix"
                    value={prefix}
                    onChange={event => onPrefixChange(event.target.value)}
                    placeholder="APP_"
                />
                <GroupCombobox value={group} onChange={onGroupChange} groups={groups} />
            </S.Fields>

            <S.Fields>
                <ScopePicker
                    label="Visibility"
                    value={{ scope, team_id: teamId }}
                    onChange={value => onScopeChange(value.scope, value.team_id)}
                    teams={teams}
                    ownerLabel="Owner"
                    ownerScope="user"
                />
                <UserPicker
                    label="Owner"
                    value={ownerId}
                    onChange={onOwnerChange}
                    onSelect={user => onOwnerRoleChange(user?.workspace_role)}
                    placeholder="Myself (default)"
                />
            </S.Fields>
        </>
    );
}
