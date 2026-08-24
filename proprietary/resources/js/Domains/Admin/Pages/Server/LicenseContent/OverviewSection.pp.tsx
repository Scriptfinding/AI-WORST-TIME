import { Icon } from '@/Shared/UI/Icon/Icon';
import { StatusGroup, StatusBadge, LicensePingButton } from './OverviewSection.styled.pp';
import type { LicenseInfo } from '@/Domains/Admin/Pages/Server/types';
import * as SharedStyles from '@/Domains/Admin/Pages/Server/shared.styled';

const S = {
    ...SharedStyles,
    LicensePingButton,
    StatusBadge,
    StatusGroup,
};

interface Props {
    license: LicenseInfo;
    pinging: boolean;
    onPing: () => void;
}

export default function OverviewSection({ license, pinging, onPing }: Props) {
    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:circle-gauge" width={15} height={15} />
                Overview
            </S.CardTitle>
            <S.AboutRow>
                <S.AboutLabel>Status</S.AboutLabel>
                <S.StatusGroup>
                    {license.file_configured && (
                        <S.LicensePingButton
                            type="button"
                            onClick={onPing}
                            disabled={pinging}
                            title="Force a ping to the license server to refresh entitlements"
                        >
                            <Icon icon="lucide:refresh-cw" width={12} height={12} />
                            {pinging ? 'Refreshing...' : 'Refresh License'}
                        </S.LicensePingButton>
                    )}
                    <S.StatusBadge $active={license.active}>{license.status}</S.StatusBadge>
                </S.StatusGroup>
            </S.AboutRow>
            <S.AboutRow>
                <S.AboutLabel>Plan</S.AboutLabel>
                <S.AboutValue>
                    {license.plan ? license.plan.charAt(0).toUpperCase() + license.plan.slice(1) : '-'}
                </S.AboutValue>
            </S.AboutRow>
            {!license.managed_license && license.file?.reference && (
                <S.AboutRow>
                    <S.AboutLabel>License ID</S.AboutLabel>
                    <S.AboutValue>{license.file.reference}</S.AboutValue>
                </S.AboutRow>
            )}
        </S.Card>
    );
}
