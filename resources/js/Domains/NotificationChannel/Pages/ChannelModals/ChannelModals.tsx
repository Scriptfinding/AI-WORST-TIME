import type { ReactNode } from 'react';
import Modal from '@/Shared/UI/Modal/Modal';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import type { Flow } from '@/Domains/Flow/types';
import type { Integration } from '@/Domains/Integration/types';
import type { NotificationChannel } from '@/Domains/NotificationChannel/types';
import ChannelFormModal from '@/Domains/NotificationChannel/Pages/ChannelFormModal/ChannelFormModal';
import type { ChannelUsage } from '@/Domains/NotificationChannel/Pages/useChannelsPage';
import * as S from './styled';

interface Props {
    groups: string[];
    messengerIntegrations: Pick<Integration, 'id' | 'name' | 'provider'>[];
    teams: { id: Id; name: string }[];
    isAdmin: boolean;
    showCreate: boolean;
    onCloseCreate: () => void;
    editChannel: NotificationChannel | null;
    onCloseEdit: () => void;
    inspectChannel: NotificationChannel | null;
    inspectUsages: ChannelUsage[];
    inspectLoading: boolean;
    onCloseInspect: () => void;
    confirm: (opts: { title?: string; message: ReactNode; confirmLabel?: string; cancelLabel?: string; variant?: 'danger' | 'primary' }) => Promise<boolean>;
}

export default function ChannelModals({ groups, messengerIntegrations, teams, isAdmin, showCreate, onCloseCreate, editChannel, onCloseEdit, inspectChannel, inspectUsages, inspectLoading, onCloseInspect }: Props) {
    return (
        <>
            {showCreate && (
                <ChannelFormModal
                    mode="create"
                    messengerIntegrations={messengerIntegrations}
                    groups={groups}
                    teams={teams}
                    isAdmin={isAdmin}
                    onClose={onCloseCreate}
                />
            )}

            {editChannel && (
                <ChannelFormModal
                    mode="edit"
                    channel={editChannel}
                    messengerIntegrations={messengerIntegrations}
                    groups={groups}
                    teams={teams}
                    isAdmin={isAdmin}
                    onClose={onCloseEdit}
                />
            )}

            <Modal
                isOpen={!!inspectChannel}
                onClose={onCloseInspect}
                title={`Usages - ${inspectChannel?.name ?? ''}`}
                width="480px"
            >
                {inspectChannel && (
                    <S.InspectContent>
                        {inspectLoading ? (
                            <S.InspectLoading>
                                <Icon icon="lucide:loader-2" width={16} />
                                Loading usages...
                            </S.InspectLoading>
                        ) : inspectUsages.length === 0 ? (
                            <S.InspectEmpty>
                                <Icon icon="lucide:check-circle" width={16} />
                                This channel is not used in any flow.
                            </S.InspectEmpty>
                        ) : (
                            <>
                                <S.InspectCount>
                                    Used in {inspectUsages.length} flow{inspectUsages.length > 1 ? 's' : ''}
                                </S.InspectCount>
                                <S.InspectList>
                                    {inspectUsages.map(u => (
                                        <S.InspectItem key={u.flow_id} href={`/flows/${u.flow_id}`} target="_blank" rel="noopener noreferrer">
                                            <S.InspectItemLabel>
                                                <FlowIcon flow={{ name: u.flow_name, icon_type: (u.icon_type as Flow['icon_type']) || 'emoji', icon_value: u.icon_value ?? null, icon_color: u.icon_color ?? null, icon_url: u.icon_url ?? null }} size={16} />
                                                <S.InspectItemName>{u.flow_name}</S.InspectItemName>
                                            </S.InspectItemLabel>
                                            <S.InspectItemEnd><Icon icon="lucide:external-link" width={13} /></S.InspectItemEnd>
                                        </S.InspectItem>
                                    ))}
                                </S.InspectList>
                            </>
                        )}
                    </S.InspectContent>
                )}
            </Modal>
        </>
    );
}
