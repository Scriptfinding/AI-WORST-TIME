import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { InspectContent, InspectLoading, InspectEmpty, InspectCount, InspectList, InspectItem, InspectItemLabel, InspectItemEnd } from './VariableUsageModal.styled';
import type { Flow } from '@/Domains/Flow/types';
import type { UserVariable } from '@/Domains/Variable/types';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import Modal from '@/Shared/UI/Modal/Modal';
import { UsageBadge, UsageBadgeHint } from '@/Shared/UI/UsageList/UsageList';
import { InspectItemName } from './shared.styled';
import { getVariableUsageTypeLabel, type VariableUsage } from './types';

interface Props {
    variable: UserVariable | null;
    usages: VariableUsage[];
    loading: boolean;
    onClose: () => void;
}

export default function VariableUsageModal({ variable, usages, loading, onClose }: Props) {
    return (
        <Modal
            isOpen={!!variable}
            onClose={onClose}
            title={`Usages - ${variable?.key ?? ''}`}
            width="480px"
        >
            {variable && (
                <InspectContent>
                    {loading ? (
                        <InspectLoading>
                            <Icon icon="lucide:loader-2" width={16} />
                            Loading usages...
                        </InspectLoading>
                    ) : usages.length === 0 ? (
                        <InspectEmpty>
                            <Icon icon="lucide:check-circle" width={16} />
                            This variable is not used anywhere.
                        </InspectEmpty>
                    ) : (
                        <>
                            <InspectCount>
                                {usages.length} usage{usages.length > 1 ? 's' : ''} found
                            </InspectCount>
                            <InspectList>
                                {usages.map((usage, index) => (
                                    <InspectItem
                                        key={index}
                                        {...(usage.flow_id
                                            ? {
                                                href: `/flows/${usage.flow_id}`,
                                                target: '_blank',
                                                rel: 'noopener noreferrer',
                                            }
                                            : { as: 'div' })}
                                    >
                                        <InspectItemLabel>
                                            {usage.type === 'variable' ? (
                                                <Icon icon="lucide:variable" width={14} />
                                            ) : (
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
                                            )}
                                            <InspectItemName>
                                                {usage.type === 'variable' ? usage.label : usage.flow_name}
                                            </InspectItemName>
                                        </InspectItemLabel>
                                        {usage.types && usage.types.length > 0 && (
                                            <UsageBadgeHint>
                                                {usage.types.map(type => (
                                                    <UsageBadge key={type}>
                                                        {getVariableUsageTypeLabel(type)}
                                                    </UsageBadge>
                                                ))}
                                            </UsageBadgeHint>
                                        )}
                                        {usage.flow_id && (
                                            <InspectItemEnd>
                                                <Icon icon="lucide:external-link" width={13} />
                                            </InspectItemEnd>
                                        )}
                                    </InspectItem>
                                ))}
                            </InspectList>
                        </>
                    )}
                </InspectContent>
            )}
        </Modal>
    );
}
