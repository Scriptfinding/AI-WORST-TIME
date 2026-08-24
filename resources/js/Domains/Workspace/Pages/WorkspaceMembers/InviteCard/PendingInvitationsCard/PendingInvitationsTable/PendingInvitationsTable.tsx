import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import {
    BoolCell,
    Table,
    TableDateBadge,
    TableEmailLink,
    TableWrapper,
} from '@/Domains/Workspace/Pages/WorkspaceMembers/shared.styled';
import type { PendingInvitation } from '@/Domains/Workspace/Pages/WorkspaceMembers/types';
import { formatInvitedAt } from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/utils';
import { ucfirst } from '@/Shared/Utils/string';
import InvitationActionsMenu from '@/Domains/Workspace/Pages/WorkspaceMembers/InviteCard/PendingInvitationsCard/InvitationActionsMenu/InvitationActionsMenu';

interface Props {
    invitations: PendingInvitation[];
    workspaceSharingEnabled: boolean;
    onResend: (invitation: PendingInvitation) => void;
    onValidate: (invitation: PendingInvitation) => void;
    onRevoke: (invitation: PendingInvitation) => void;
}

export default function PendingInvitationsTable({
    invitations,
    workspaceSharingEnabled,
    onResend,
    onValidate,
    onRevoke,
}: Props) {
    return (
        <TableWrapper>
            <Table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Team</th>
                        {workspaceSharingEnabled && <th>Role</th>}
                        <th>Status</th>
                        <th>Workspaces</th>
                        <th>Invited</th>
                        <th aria-label="Actions" />
                    </tr>
                </thead>
                <tbody>
                    {invitations.map(invitation => (
                        <tr key={invitation.id}>
                            <td>
                                <TableCellContent>
                                    <TableEmailLink href={`mailto:${invitation.email}`} title={invitation.email}>
                                        <Icon icon="lucide:mail" width={12} height={12} />
                                        {invitation.email}
                                    </TableEmailLink>
                                </TableCellContent>
                            </td>
                            <td><TableCellContent>{invitation.team?.name ?? '-'}</TableCellContent></td>
                            {workspaceSharingEnabled && (
                                <td>
                                    <TableCellContent>
                                        <Badge variant={invitation.role === 'admin' ? 'info' : invitation.role === 'manager' ? 'warning' : 'success'}>
                                            {ucfirst(invitation.role)}
                                        </Badge>
                                    </TableCellContent>
                                </td>
                            )}
                            <td>
                                <TableCellContent>
                                    <Badge variant={invitation.registration_submitted_at ? 'warning' : 'info'}>
                                        {invitation.registration_submitted_at ? 'Awaiting approval' : 'Invited'}
                                    </Badge>
                                </TableCellContent>
                            </td>
                            <td>
                                <TableCellContent>
                                    <BoolCell $yes={invitation.can_create_workspace}>
                                        <Icon
                                            icon={invitation.can_create_workspace ? 'lucide:circle-check' : 'lucide:circle-minus'}
                                            width={13}
                                            height={13}
                                        />
                                        {invitation.can_create_workspace ? 'Can create' : 'No'}
                                    </BoolCell>
                                </TableCellContent>
                            </td>
                            <td>
                                <TableCellContent>
                                    <TableDateBadge>
                                        <Icon icon="lucide:clock" width={11} height={11} />
                                        {formatInvitedAt(invitation.created_at)}
                                    </TableDateBadge>
                                </TableCellContent>
                            </td>
                            <td>
                                <TableCellContent $align="end">
                                    <InvitationActionsMenu
                                        invitation={invitation}
                                        onResend={onResend}
                                        onValidate={onValidate}
                                        onRevoke={onRevoke}
                                    />
                                </TableCellContent>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </TableWrapper>
    );
}
