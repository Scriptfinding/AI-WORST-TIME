import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import Modal from '@/Shared/UI/Modal/Modal';
import type { Flow } from '@/Domains/Flow/types';
import type { WorkspaceWithRelations } from '@/Domains/Admin/Pages/Workspaces/Workspaces';
import * as Shared from '@/Domains/Admin/Pages/Workspaces/WorkspaceModals/shared.styled';
import * as S from './styled';

interface Props {
    workspace: WorkspaceWithRelations | null;
    onClose: () => void;
}

export default function WorkspaceFlowsModal({ workspace, onClose }: Props) {
    return (
        <Modal
            isOpen={workspace !== null}
            onClose={onClose}
            title={`Flows - ${workspace?.name ?? ''}`}
        >
            <Shared.ModalList>
                {workspace?.flows.map(flow => (
                    <S.DetailItem
                        key={flow.id}
                        href={`/flows/${flow.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Shared.ModalItemLabel>
                            <FlowIcon
                                flow={{
                                    name: flow.name,
                                    icon_type: flow.icon_type as Flow['icon_type'],
                                    icon_value: flow.icon_value,
                                    icon_color: flow.icon_color,
                                    icon_url: flow.icon_url,
                                }}
                                size={18}
                            />
                            <Shared.ModalItemName>{flow.name}</Shared.ModalItemName>
                        </Shared.ModalItemLabel>
                        <S.DetailItemEnd>
                            <Icon icon="lucide:external-link" width={13} />
                        </S.DetailItemEnd>
                    </S.DetailItem>
                ))}
                {workspace?.flows.length === 0 && (
                    <Shared.ModalEmptyState>No flows</Shared.ModalEmptyState>
                )}
            </Shared.ModalList>
        </Modal>
    );
}
