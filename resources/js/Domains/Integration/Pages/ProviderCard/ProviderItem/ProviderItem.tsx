import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { Integration } from '@/Domains/Integration/types';
import * as S from './styled';

interface ProviderItemProps {
    integration: Integration;
    currentUserId: Id;
    isAdmin: boolean;
    deletingId: Id | null;
    onManage: (integration: Integration) => void;
    onDelete: (integration: Integration) => void;
}

export default function ProviderItem({
    integration,
    currentUserId,
    isAdmin,
    deletingId,
    onManage,
    onDelete,
}: ProviderItemProps) {
    const isOwner = integration.user_id === currentUserId;
    const canManage = isOwner || isAdmin;

    return (
        <S.ItemWrapper>
            <S.Item>
                <S.ItemLeft>
                    <S.ItemName>{integration.name}</S.ItemName>
                    <S.ScopeBadge
                        $scope={integration.scope}
                        title={integration.scope === 'workspace' ? 'Workspace' : integration.scope === 'team' ? `Team: ${integration.team?.name ?? 'Team'}` : 'Owner'}
                    >
                        <Icon icon={integration.scope === 'workspace' ? 'lucide:building-2' : integration.scope === 'team' ? 'lucide:users-round' : 'lucide:user'} width={11} />
                        {integration.scope === 'team' && integration.team?.name && (
                            <span>{integration.team.name}</span>
                        )}
                    </S.ScopeBadge>
                    {integration.user?.name && (
                        <S.MemberOwner>{integration.user.name}</S.MemberOwner>
                    )}
                    {integration.is_readonly && (
                        <S.ReadonlyBadge title="Managed by the instance">
                            <Icon icon="lucide:lock" width={10} />
                            Read-only
                        </S.ReadonlyBadge>
                    )}
                </S.ItemLeft>
                <S.ItemActions>
                    {canManage && !integration.is_readonly && integration.provider_status === 'pending' && integration.provider_external_url && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.location.href = integration.provider_external_url!}
                            title="Authorize"
                        >
                            <Icon icon="lucide:external-link" width={14} />
                            Authorize
                        </Button>
                    )}
                    {canManage && (
                        <S.IconButton onClick={() => onManage(integration)} title={integration.is_readonly ? 'View' : 'Manage'}>
                            <Icon icon="lucide:settings" width={14} />
                        </S.IconButton>
                    )}
                    {canManage && !integration.is_readonly && (
                        <S.IconButton
                            $variant="danger"
                            onClick={() => onDelete(integration)}
                            title="Delete"
                            disabled={deletingId === integration.id}
                        >
                            {deletingId === integration.id
                                ? <Icon icon="lucide:loader-2" width={14} className="spin" />
                                : <Icon icon="lucide:trash-2" width={14} />
                            }
                        </S.IconButton>
                    )}
                </S.ItemActions>
            </S.Item>
        </S.ItemWrapper>
    );
}
