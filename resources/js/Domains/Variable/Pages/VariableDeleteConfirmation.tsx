import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Flow } from '@/Domains/Flow/types';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import {
    ConfirmFlowItem,
    ConfirmFlowList,
    ConfirmationFlowItemLabel,
} from '@/Shared/Hooks/useConfirm';
import { UsageBadge, UsageBadgeHint } from '@/Shared/UI/UsageList/UsageList';
import { InspectItemName } from './shared.styled';
import { getVariableUsageTypeLabel, type VariableUsage } from './types';

interface Props {
    variableKey: string;
    usages: VariableUsage[];
}

export default function VariableDeleteConfirmation({ variableKey, usages }: Props) {
    const flowUsages = usages.filter(usage => usage.type !== 'variable');
    const variableUsages = usages.filter(usage => usage.type === 'variable');

    return (
        <>
            Are you sure you want to delete "{variableKey}"?
            {flowUsages.length > 0 && (
                <>
                    {'\n\n'}Used in {flowUsages.length} flow(s):
                    <ConfirmFlowList>
                        {flowUsages.map(usage => (
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
                                            icon_type: (usage.icon_type as Flow['icon_type']) || 'emoji',
                                            icon_value: usage.icon_value ?? null,
                                            icon_color: usage.icon_color ?? null,
                                            icon_url: usage.icon_url ?? null,
                                        }}
                                        size={16}
                                    />
                                    <InspectItemName>{usage.flow_name}</InspectItemName>
                                </ConfirmationFlowItemLabel>
                                {usage.types && usage.types.length > 0 && (
                                    <UsageBadgeHint>
                                        {usage.types.map(type => (
                                            <UsageBadge key={type}>
                                                {getVariableUsageTypeLabel(type)}
                                            </UsageBadge>
                                        ))}
                                    </UsageBadgeHint>
                                )}
                                <Icon icon="lucide:external-link" width={12} />
                            </ConfirmFlowItem>
                        ))}
                    </ConfirmFlowList>
                </>
            )}
            {variableUsages.length > 0 && (
                <>
                    {'\n'}Referenced by {variableUsages.length} variable(s):{'\n'}
                    {variableUsages.map(usage => `• ${usage.label}`).join('\n')}
                </>
            )}
            {'\n\n'}These references will break after deletion.
        </>
    );
}
