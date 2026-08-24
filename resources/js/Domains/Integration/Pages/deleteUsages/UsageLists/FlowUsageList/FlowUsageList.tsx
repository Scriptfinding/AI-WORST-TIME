import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { UsageList } from '@/Shared/UI/UsageList/UsageList';
import type { Flow } from '@/Domains/Flow/types';
import type { FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';

interface FlowUsageListProps {
    flows: FlowUsage[];
}

export function FlowUsageList({ flows }: FlowUsageListProps) {
    return (
        <UsageList
            items={flows}
            getKey={flow => flow.flow_id}
            getHref={flow => `/flows/${flow.flow_id}`}
            renderIcon={flow => (
                <FlowIcon
                    flow={{
                        name: flow.flow_name,
                        icon_type: (flow.icon_type as Flow['icon_type']) || 'emoji',
                        icon_value: flow.icon_value ?? null,
                        icon_color: flow.icon_color ?? null,
                        icon_url: flow.icon_url ?? null,
                    }}
                    size={16}
                />
            )}
            renderLabel={flow => flow.flow_name}
            renderTrailing={() => <Icon icon="lucide:external-link" width={12} />}
        />
    );
}
