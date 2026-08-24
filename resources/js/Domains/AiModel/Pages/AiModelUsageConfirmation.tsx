import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Flow } from '@/Domains/Flow/types';
import type { AiModelUsage } from '@/Domains/AiModel/types';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { UsageList, UsageMessage } from '@/Shared/UI/UsageList/UsageList';

interface Props {
    usages: AiModelUsage[];
}

const renderFlowIcon = (usage: AiModelUsage) => (
    <FlowIcon
        flow={{
            name: usage.flow_name,
            icon_type: (usage.icon_type as Flow['icon_type']) || 'emoji',
            icon_value: usage.icon_value ?? null,
            icon_color: usage.icon_color ?? null,
            icon_url: usage.icon_url ?? null,
        }}
        size={16}
    />
);

const usageList = (usages: AiModelUsage[]) => (
    <UsageList
        items={usages}
        getKey={usage => usage.flow_id}
        getHref={usage => `/flows/${usage.flow_id}`}
        renderIcon={renderFlowIcon}
        renderLabel={usage => usage.flow_name}
        renderTrailing={() => <Icon icon="lucide:external-link" width={12} />}
    />
);

interface DeleteProps extends Props {
    modelName: string;
}

export function AiModelDeleteConfirmation({ modelName, usages }: DeleteProps) {
    if (usages.length === 0) {
        return <>Are you sure you want to delete "{modelName}"? This cannot be undone.</>;
    }

    return (
        <UsageMessage prompt="These flows may lose access to one or more AI models after deletion.">
            Are you sure you want to delete "{modelName}"? It is used in {usages.length} flow(s):
            {usageList(usages)}
        </UsageMessage>
    );
}
