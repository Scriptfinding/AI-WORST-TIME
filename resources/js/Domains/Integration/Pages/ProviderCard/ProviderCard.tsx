import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useThemeMode } from '@/App/Hooks/useThemeMode';
import MessageContent from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/MessageContent/MessageContent';
import type { Integration } from '@/Domains/Integration/types';
import type { ProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import ProviderItem from './ProviderItem/ProviderItem';
import * as S from './styled';

interface Props {
    providerConfig: ProviderConfig;
    integrations: Integration[];
    currentUserId: Id;
    isAdmin: boolean;
    onConnect: (providerConfig: ProviderConfig) => void;
    onManage: (integration: Integration) => void;
    onDelete: (integration: Integration) => void;
    deletingId: Id | null;
    disabled?: boolean;
    disabledMessage?: string;
}

export default function ProviderCard({
    providerConfig,
    integrations,
    currentUserId,
    isAdmin,
    onConnect,
    onManage,
    onDelete,
    deletingId,
    disabled = false,
    disabledMessage,
}: Props) {
    const { resolved } = useThemeMode();
    const logoColor = resolved === 'dark' && providerConfig.darkColor ? providerConfig.darkColor : providerConfig.color;

    const scopeOrder = (s: string) => s === 'owner' ? 0 : s === 'workspace' ? 1 : 2;
    const allIntegrations = [...integrations]
        .sort((a, b) => scopeOrder(a.scope) - scopeOrder(b.scope) || a.name.localeCompare(b.name));
    const hasConnections = allIntegrations.length > 0;

    return (
        <S.Card
            $connected={hasConnections}
            $disabled={disabled}
        >
            <S.Header>
                <S.Info>
                    <S.Logo $color={logoColor}>
                        <Icon icon={providerConfig.icon} width={22} height={22} />
                    </S.Logo>
                    <div>
                        <S.Name>{providerConfig.label}</S.Name>
                        <S.Type>{providerConfig.typeLabel}</S.Type>
                    </div>
                </S.Info>
                <S.Actions>
                    {providerConfig.comingSoon ? (
                        <S.SoonBadge>Soon</S.SoonBadge>
                    ) : !hasConnections ? (
                        <Button size="sm" variant="secondary" disabled={disabled} onClick={() => onConnect(providerConfig)}>
                            <Icon icon="mdi:plus" width={14} />
                            Connect
                        </Button>
                    ) : (
                        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onConnect(providerConfig)}>
                            <Icon icon="lucide:plus" width={14} />
                            Add another
                        </Button>
                    )}
                </S.Actions>
            </S.Header>

            {disabled && disabledMessage && (
                <S.DisabledNotice>
                    <Icon icon="lucide:lock" width={14} />
                    <span><MessageContent message={disabledMessage} /></span>
                </S.DisabledNotice>
            )}

            {hasConnections && (
                <>
                    <S.Separator />
                    <S.List>
                        {allIntegrations.map(integration => (
                            <ProviderItem
                                key={integration.id}
                                integration={integration}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                deletingId={deletingId}
                                onManage={onManage}
                                onDelete={onDelete}
                            />
                        ))}
                    </S.List>
                </>
            )}
        </S.Card>
    );
}
