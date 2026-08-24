import { useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    OverflowButton,
    OverflowMenu,
    OverflowMenuItem,
    OverflowWrapper,
    TableActions,
} from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import type { PendingInvitation } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import { useActionMenuDismiss } from '@/Shared/Hooks/useActionMenuDismiss';
import { menuPositionFromEvent } from '@/Domains/Workspace/Pages/WorkspaceMembers/utils';

interface Props {
    invitation: PendingInvitation;
    onResend: (invitation: PendingInvitation) => void;
    onValidate: (invitation: PendingInvitation) => void;
    onRevoke: (invitation: PendingInvitation) => void;
}

export default function InvitationActionsMenu({ invitation, onResend, onValidate, onRevoke }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<React.CSSProperties>({});
    const [copied, setCopied] = useState(false);
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

    const runAction = (action: (value: PendingInvitation) => void) => {
        setIsOpen(false);
        action(invitation);
    };

    const copyLink = () => {
        const url = `${window.location.origin}/register?invitation=${invitation.token}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
        setIsOpen(false);
    };

    return (
        <TableActions>
            <OverflowWrapper ref={menuRef}>
                <OverflowButton
                    onClick={event => {
                        setPosition(menuPositionFromEvent(event));
                        setIsOpen(open => !open);
                    }}
                >
                    <Icon icon="lucide:more-horizontal" width={16} height={16} />
                </OverflowButton>
                {isOpen && (
                    <OverflowMenu style={position}>
                        <OverflowMenuItem onClick={copyLink}>
                            <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width={13} height={13} />
                            {copied ? 'Copied!' : 'Copy invitation link'}
                        </OverflowMenuItem>
                        <OverflowMenuItem onClick={() => runAction(onResend)}>
                            <Icon icon="lucide:send" width={13} height={13} />
                            Resend invite
                        </OverflowMenuItem>
                        <OverflowMenuItem
                            onClick={() => runAction(onValidate)}
                            disabled={!invitation.registration_submitted_at}
                        >
                            <Icon icon="lucide:user-check" width={13} height={13} />
                            {invitation.registration_submitted_at
                                ? 'Approve registration'
                                : 'Awaiting registration'}
                        </OverflowMenuItem>
                        <OverflowMenuItem $danger onClick={() => runAction(onRevoke)}>
                            <Icon icon="lucide:trash-2" width={13} height={13} />
                            Revoke
                        </OverflowMenuItem>
                    </OverflowMenu>
                )}
            </OverflowWrapper>
        </TableActions>
    );
}
