import { Icon } from '@/Shared/UI/Icon/Icon';
import { UsageList } from '@/Shared/UI/UsageList/UsageList';
import type { ItemUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';

interface ItemUsageListProps {
    items: ItemUsage[];
}

export function ItemUsageList({ items }: ItemUsageListProps) {
    return (
        <UsageList
            items={items}
            getKey={item => item.key}
            renderIcon={item => <Icon icon={item.icon} width={14} />}
            renderLabel={item => item.label}
        />
    );
}
