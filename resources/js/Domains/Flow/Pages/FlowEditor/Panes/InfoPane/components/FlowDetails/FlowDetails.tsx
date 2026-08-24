import { Icon } from '@/Shared/UI/Icon/Icon';
import { SectionTitle } from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import type { Flow } from '@/Domains/Flow/types';
import { formatDate, formatDateTime } from '@/Shared/Utils/formatDate';
import * as S from './styled';

interface FlowDetailsProps {
    flow: Flow;
}

export default function FlowDetails({ flow }: FlowDetailsProps) {
    return (
        <>
            <SectionTitle>Flow Details</SectionTitle>
            <S.InfoGrid>
                <S.InfoLabel>ID</S.InfoLabel>
                <S.InfoValue>{flow.id}</S.InfoValue>
                <S.InfoLabel>Owner</S.InfoLabel>
                <S.InfoValue>{flow.owner?.name}</S.InfoValue>
                <S.InfoLabel>Folder</S.InfoLabel>
                <S.InfoValue>
                    {(flow.visibility === 'owner' ? flow.folder?.name : flow.workspace_folder?.name) || 'Root'}
                </S.InfoValue>
                <S.InfoLabel>Created</S.InfoLabel>
                <S.InfoDateCapsule title={formatDateTime(flow.created_at)}>
                    <Icon icon="lucide:plus" />
                    {formatDate(flow.created_at)}
                </S.InfoDateCapsule>
                <S.InfoLabel>Updated</S.InfoLabel>
                <S.InfoDateCapsule title={formatDateTime(flow.updated_at)}>
                    <Icon icon="lucide:pencil" />
                    {formatDate(flow.updated_at)}
                </S.InfoDateCapsule>
            </S.InfoGrid>
        </>
    );
}
