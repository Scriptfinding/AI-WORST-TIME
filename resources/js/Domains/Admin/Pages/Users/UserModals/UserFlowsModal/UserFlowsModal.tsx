import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import Modal from '@/Shared/UI/Modal/Modal';
import type { Flow } from '@/Domains/Flow/types';
import type { UserWithRelations } from '@/Domains/Admin/Pages/Users/Users';
import * as Shared from '@/Domains/Admin/Pages/Users/UserModals/shared.styled';
import * as S from './styled';

interface Props {
    user: UserWithRelations | null;
    onClose: () => void;
}

export default function UserFlowsModal({ user, onClose }: Props) {
    return (
        <Modal isOpen={!!user} onClose={onClose} title={`Flows - ${user?.name ?? ''}`}>
            <Shared.ModalList>
                {user?.owned_flows.map(flow => (
                    <S.Item key={flow.id} href={`/flows/${flow.id}`} target="_blank" rel="noopener noreferrer">
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
                        <S.ItemEnd><Icon icon="lucide:external-link" width={13} /></S.ItemEnd>
                    </S.Item>
                ))}
                {user?.owned_flows.length === 0 && <Shared.ModalEmptyState>No flows</Shared.ModalEmptyState>}
            </Shared.ModalList>
        </Modal>
    );
}
