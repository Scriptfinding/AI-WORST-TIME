import Badge from '@/Shared/UI/Badge/Badge';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import Modal from '@/Shared/UI/Modal/Modal';
import { ucfirst } from '@/Shared/Utils/string';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import * as Shared from '@/Domains/Admin/Pages/Workspaces/WorkspaceModals/shared.styled';
import * as S from './styled';

interface Props {
    workspace: WorkspaceWithRelations | null;
    onClose: () => void;
}

export default function WorkspaceMembersModal({ workspace, onClose }: Props) {
    return (
        <Modal
            isOpen={workspace !== null}
            onClose={onClose}
            title={`Members - ${workspace?.name ?? ''}`}
        >
            <Shared.ModalList>
                {workspace?.users.map(user => (
                    <S.DetailItem key={user.id}>
                        <Shared.ModalItemLabel>
                            <FlowIcon
                                flow={{
                                    icon_type: user.icon_type,
                                    icon_value: user.icon_value,
                                    icon_color: user.icon_color,
                                    icon_url: user.icon_url,
                                    name: user.name,
                                }}
                                size={18}
                                radius="full"
                            />
                            <Shared.ModalItemName>{user.name}</Shared.ModalItemName>
                        </Shared.ModalItemLabel>
                        <Badge variant={user.pivot.role === 'admin' ? 'info' : user.pivot.role === 'manager' ? 'warning' : 'success'}>
                            {ucfirst(user.pivot.role)}
                        </Badge>
                    </S.DetailItem>
                ))}
                {workspace?.users.length === 0 && (
                    <Shared.ModalEmptyState>No members</Shared.ModalEmptyState>
                )}
            </Shared.ModalList>
        </Modal>
    );
}
