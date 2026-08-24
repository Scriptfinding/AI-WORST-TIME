import { Icon } from '@/Shared/UI/Icon/Icon';
import type { StorageInfo } from '@/Domains/Admin/Pages/Server/types';
import { formatBytes, progressBarWidth } from '@/Domains/Admin/Pages/Server/utils';
import * as S from '../shared.styled';

interface Props {
    storage: StorageInfo;
}

export default function StorageCard({ storage }: Props) {
    const percentage = storage.total_bytes > 0 ? storage.percentage : null;
    const barWidth = progressBarWidth(percentage);

    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:database" width={15} height={15} />
                Data storage
            </S.CardTitle>
            <S.StorageUsageHeader>
                <S.StorageUsageTitle>Data directory</S.StorageUsageTitle>
                <S.StorageUsageValue>
                    {formatBytes(storage.used_bytes)} / {formatBytes(storage.total_bytes)}
                </S.StorageUsageValue>
            </S.StorageUsageHeader>
            <S.StorageUsageTrack>
                <S.StorageUsageFill $width={barWidth} />
            </S.StorageUsageTrack>
            <S.StorageUsageMeta>
                <span>{percentage == null ? 'Data disk unavailable' : `${percentage.toFixed(2)}% of data disk`}</span>
                <span>{formatBytes(storage.free_bytes)} available for data</span>
            </S.StorageUsageMeta>
        </S.Card>
    );
}
