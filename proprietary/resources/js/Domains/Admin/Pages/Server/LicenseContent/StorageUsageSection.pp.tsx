import { Icon } from '@/Shared/UI/Icon/Icon';
import type { LicenseInfo } from '@/Domains/Admin/Pages/Server/types';
import { formatBytes, progressBarWidth } from '@/Domains/Admin/Pages/Server/utils';
import * as S from '@/Domains/Admin/Pages/Server/shared.styled';

interface Props {
    storage: LicenseInfo['storage'];
}

export default function StorageUsageSection({ storage }: Props) {
    if (!storage) return null;

    const percentage = storage.limit_bytes == null
        ? null
        : Math.min(100, (storage.used_bytes / storage.limit_bytes) * 100);
    const exceeded = storage.limit_bytes != null && storage.used_bytes >= storage.limit_bytes;

    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:database" width={15} height={15} />
                Storage usage
            </S.CardTitle>
            <S.StorageUsageHeader>
                <S.StorageUsageTitle>Instance storage</S.StorageUsageTitle>
                <S.StorageUsageValue>
                    {formatBytes(storage.used_bytes)} / {storage.limit_bytes == null
                        ? 'Unlimited'
                        : formatBytes(storage.limit_bytes)}
                </S.StorageUsageValue>
            </S.StorageUsageHeader>
            <S.StorageUsageTrack>
                <S.StorageUsageFill
                    $width={progressBarWidth(percentage)}
                    $danger={exceeded}
                    $brand
                />
            </S.StorageUsageTrack>
            {percentage != null && (
                <S.StorageUsageMeta>
                    <span>{percentage.toFixed(0)}% of storage quota</span>
                </S.StorageUsageMeta>
            )}
        </S.Card>
    );
}
