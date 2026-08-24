import { Icon } from '@/Shared/UI/Icon/Icon';
import { CycleUsageContainer } from './CycleUsageSection.styled.pp';
import type { LicenseInfo } from '@/Domains/Admin/Pages/Server/types';
import { progressBarWidth } from '@/Domains/Admin/Pages/Server/utils';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import * as SharedStyles from '@/Domains/Admin/Pages/Server/shared.styled';

const S = {
    ...SharedStyles,
    CycleUsageSection: CycleUsageContainer,
};

interface Props {
    cycle: LicenseInfo['cycle'];
}

export default function CycleUsageSection({ cycle }: Props) {
    if (!cycle) return null;

    const percentage = cycle.limit == null ? null : Math.min(100, (cycle.used / cycle.limit) * 100);

    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:activity" width={15} height={15} />
                Cycle usage
            </S.CardTitle>
            <S.CycleUsageSection>
                <S.StorageUsageHeader>
                    <S.StorageUsageTitle>Cycle runs</S.StorageUsageTitle>
                    <S.StorageUsageValue>
                        {cycle.used} / {cycle.limit == null ? 'Unlimited' : cycle.limit} runs
                    </S.StorageUsageValue>
                </S.StorageUsageHeader>
                <S.StorageUsageTrack>
                    <S.StorageUsageFill
                        $width={progressBarWidth(percentage)}
                        $danger={cycle.exceeded}
                        $brand
                    />
                </S.StorageUsageTrack>
                <S.StorageUsageMeta>
                    <span>
                        {cycle.limit == null
                            ? 'Unlimited cycle runs'
                            : cycle.exceeded
                            ? 'Run quota reached, production runs are paused'
                            : `${percentage?.toFixed(0)}% of cycle quota`}
                    </span>
                    <span>Resets {formatDateTime(cycle.ends_at)}</span>
                </S.StorageUsageMeta>
            </S.CycleUsageSection>
        </S.Card>
    );
}
