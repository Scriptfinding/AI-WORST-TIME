import { Icon } from '@/Shared/UI/Icon/Icon';
import { UsageName } from './ChannelDeleteConfirmation.styled';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import {
    ConfirmFlowItem,
    ConfirmFlowList,
    ConfirmationFlowItemLabel,
} from '@/Shared/Hooks/useConfirm';
import type { Flow } from '@/Domains/Flow/types';

export interface ChannelUsage {
    flow_id: Id;
    flow_name: string;
    icon_type?: string;
    icon_value?: string | null;
    icon_color?: string | null;
    icon_url?: string | null;
}

interface Props {
    channelName: string;
    usages: ChannelUsage[];
}

export default function ChannelDeleteConfirmation({ channelName, usages }: Props) {
    if (usages.length === 0) {
        return <>Are you sure you want to delete "{channelName}"? This cannot be undone.</>;
    }

    return (
        <>
            Are you sure you want to delete "{channelName}"?
            {'\n\n'}This channel is used in {usages.length} flow(s):
            <ConfirmFlowList>
                {usages.map(usage => (
                    <ConfirmFlowItem
                        key={usage.flow_id}
                        href={`/flows/${usage.flow_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ConfirmationFlowItemLabel>
                            <FlowIcon
                                flow={{
                                    name: usage.flow_name,
                                    icon_type: (usage.icon_type as Flow['icon_type'] | undefined) || 'emoji',
                                    icon_value: usage.icon_value ?? null,
                                    icon_color: usage.icon_color ?? null,
                                    icon_url: usage.icon_url ?? null,
                                }}
                                size={16}
                            />
                            <UsageName>{usage.flow_name}</UsageName>
                        </ConfirmationFlowItemLabel>
                        <Icon icon="lucide:external-link" width={12} />
                    </ConfirmFlowItem>
                ))}
            </ConfirmFlowList>
            These flows will fail after deletion.
        </>
    );
}
