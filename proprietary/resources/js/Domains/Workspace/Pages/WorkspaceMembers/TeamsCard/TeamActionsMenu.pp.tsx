import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Team } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import * as S from './TeamActionsMenu.styled.pp';

interface Props {
    team: Team;
    isOpen: boolean;
    menuPosition: React.CSSProperties;
    menuRef: React.Ref<HTMLDivElement>;
    onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onClose: () => void;
    onRename: (team: Team) => void;
    onManageMembers: (team: Team) => void;
    onDelete: (team: Team) => void;
}

export default function TeamActionsMenu({
    team,
    isOpen,
    menuPosition,
    menuRef,
    onToggle,
    onClose,
    onRename,
    onManageMembers,
    onDelete,
}: Props) {
    const runAction = (action: (team: Team) => void) => {
        onClose();
        action(team);
    };

    return (
        <S.TableActions>
            <S.OverflowWrapper ref={isOpen ? menuRef : undefined}>
                <S.OverflowButton onClick={onToggle}>
                    <Icon icon="lucide:more-horizontal" width={16} height={16} />
                </S.OverflowButton>
                {isOpen && (
                    <S.OverflowMenu style={menuPosition}>
                        {team.can_update && (
                            <S.OverflowMenuItem onClick={() => runAction(onRename)}>
                                <Icon icon="lucide:pencil" width={13} height={13} />
                                Rename
                            </S.OverflowMenuItem>
                        )}
                        {team.can_manage_members && (
                            <S.OverflowMenuItem onClick={() => runAction(onManageMembers)}>
                                <Icon icon="lucide:user-cog" width={13} height={13} />
                                Manage users
                            </S.OverflowMenuItem>
                        )}
                        {team.can_delete && (
                            <S.OverflowMenuItem $danger onClick={() => runAction(onDelete)}>
                                <Icon icon="lucide:trash-2" width={13} height={13} />
                                Delete
                            </S.OverflowMenuItem>
                        )}
                    </S.OverflowMenu>
                )}
            </S.OverflowWrapper>
        </S.TableActions>
    );
}
