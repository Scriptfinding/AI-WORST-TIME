import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import { UsageList } from '@/Shared/UI/UsageList/UsageList';
import type { Flow } from '@/Domains/Flow/types';

export interface SnippetUsage {
    type: 'flow' | 'snippet';
    flow_id?: Id;
    flow_name?: string;
    icon_type?: string;
    icon_value?: string | null;
    icon_color?: string | null;
    icon_url?: string | null;
    id?: string;
    label?: string;
}

interface Props {
    label: string;
    id: Id;
    usages: SnippetUsage[];
}

export default function SnippetDeleteConfirmation({ label, id, usages }: Props) {
    const flowUsages = usages.filter(usage => usage.type === 'flow');
    const snippetUsages = usages.filter(usage => usage.type === 'snippet');

    return (
        <>
            "{label}" ($${id}) cannot be deleted while it is still in use.
            {flowUsages.length > 0 && (
                <>
                    {'\n\n'}Used in {flowUsages.length} flow{flowUsages.length > 1 ? 's' : ''}:
                    <UsageList
                        items={flowUsages}
                        getKey={usage => usage.flow_id!}
                        getHref={usage => `/flows/${usage.flow_id}`}
                        renderIcon={usage => (
                            <FlowIcon
                                flow={{
                                    name: usage.flow_name,
                                    icon_type: (usage.icon_type || 'emoji') as Flow['icon_type'],
                                    icon_value: usage.icon_value ?? null,
                                    icon_color: usage.icon_color ?? null,
                                    icon_url: usage.icon_url ?? null,
                                }}
                                size={16}
                            />
                        )}
                        renderLabel={usage => usage.flow_name}
                        renderTrailing={() => <Icon icon="lucide:external-link" width={12} />}
                    />
                </>
            )}
            {snippetUsages.length > 0 && (
                <>
                    {'\n'}Also used in {snippetUsages.length} other snippet{snippetUsages.length > 1 ? 's' : ''}:{'\n'}
                    <UsageList
                        items={snippetUsages}
                        getKey={usage => usage.id!}
                        renderIcon={() => <>•</>}
                        renderLabel={usage => `${usage.label} ($$${usage.id})`}
                        variant="inline"
                    />
                </>
            )}
            {'\n\n'}Remove these references before deleting the snippet.
        </>
    );
}
