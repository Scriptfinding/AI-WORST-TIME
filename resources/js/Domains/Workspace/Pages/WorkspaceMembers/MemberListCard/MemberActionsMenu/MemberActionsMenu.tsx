import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { WorkspaceUser } from '@/Domains/Workspace/types';
import * as Shared from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { menuPositionFromEvent } from '@/Domains/Workspace/Pages/WorkspaceMembers/utils';

interface Props {
    user: WorkspaceUser;
    teamsEnabled: boolean;
    isLastAdmin: boolean;
    onEdit: (user: WorkspaceUser) => void;
    onManageTeams: (user: WorkspaceUser) => void;
    onRemove: (user: WorkspaceUser) => void;
}

export default function MemberActionsMenu({
    user,
    teamsEnabled,
    isLastAdmin,
    onEdit,
    onManageTeams,
    onRemove,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<React.CSSProperties>({});
    const menuRef = useRef<HTMLDivElement>(null);

    useActionMenuDismiss({
        open: isOpen,
        refs: [menuRef],
        onDismiss: () => setIsOpen(false),
        closeOnScroll: true,
        eventType: 'mousedown',
        eventCapture: false,
        scrollCapture: true,
    });

    const runAction = (action: (member: WorkspaceUser) => void) => {
        setIsOpen(false);
        action(user);
    };

    return (
        <Shared.TableActions>
            <Shared.OverflowWrapper ref={menuRef}>
                <Shared.OverflowButton
                    onClick={event => {
                        setPosition(menuPositionFromEvent(event));
                        setIsOpen(open => !open);
                    }}
                >
                    <Icon icon="lucide:more-horizontal" width={16} height={16} />
                </Shared.OverflowButton>
                {isOpen && (
                    <Shared.OverflowMenu style={position}>
                        <Shared.OverflowMenuItem onClick={() => runAction(onEdit)}>
                            <Icon icon="lucide:pencil" width={13} height={13} />
                            Edit
                        </Shared.OverflowMenuItem>
                        {teamsEnabled && (
                            <Shared.OverflowMenuItem onClick={() => runAction(onManageTeams)}>
                                <Icon icon="lucide:users-round" width={13} height={13} />
                                Manage Teams
                            </Shared.OverflowMenuItem>
                        )}
                        <Shared.OverflowMenuItem
                            $danger
                            disabled={isLastAdmin}
                            title={isLastAdmin ? 'Cannot remove the last admin' : undefined}
                            onClick={() => runAction(onRemove)}
                        >
                            <Icon icon="lucide:trash-2" width={13} height={13} />
                            Delete
                        </Shared.OverflowMenuItem>
                    </Shared.OverflowMenu>
                )}
            </Shared.OverflowWrapper>
        </Shared.TableActions>
    );
}
