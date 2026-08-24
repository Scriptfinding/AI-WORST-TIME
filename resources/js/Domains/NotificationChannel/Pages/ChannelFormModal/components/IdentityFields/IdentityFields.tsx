import type { ReactNode } from 'react';
import Input from '@/Shared/UI/Input/Input';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import type { ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import { OWNERSHIP_DISABLED_HINT } from '@/Shared/Utils/ownershipPermissions';

interface Props {
    channelName: string;
    nameError: string;
    scope: string;
    teamId: Id | null;
    ownerId: Id | null;
    teams: ScopeTeam[];
    ownershipDisabled: boolean;
    groupSelector: ReactNode;
    onChannelNameChange: (name: string) => void;
    onNameErrorClear: () => void;
    onScopeChange: (scope: string, teamId: Id | null) => void;
    onOwnerChange: (id: Id | null) => void;
    onOwnerRoleChange: (role: string | undefined) => void;
}

export default function IdentityFields({
    channelName,
    nameError,
    scope,
    teamId,
    ownerId,
    teams,
    ownershipDisabled,
    groupSelector,
    onChannelNameChange,
    onNameErrorClear,
    onScopeChange,
    onOwnerChange,
    onOwnerRoleChange,
}: Props) {
    return (
        <>
            <Input
                label="Label"
                value={channelName}
                onChange={event => {
                    onChannelNameChange(event.target.value);
                    onNameErrorClear();
                }}
                error={nameError}
                placeholder="Support alerts"
                autoFocus
            />

            {groupSelector}

            <ScopePicker
                label="Visibility"
                value={{ scope, team_id: teamId }}
                onChange={value => onScopeChange(value.scope, value.team_id)}
                teams={teams}
                ownerLabel="Owner"
                ownerScope="user"
                disabled={ownershipDisabled}
                disabledHint={OWNERSHIP_DISABLED_HINT}
            />
            <UserPicker
                label="Owner"
                value={ownerId}
                onChange={onOwnerChange}
                onSelect={user => onOwnerRoleChange(user?.workspace_role ?? undefined)}
                placeholder="Myself (default)"
                disabled={ownershipDisabled}
            />
        </>
    );
}
