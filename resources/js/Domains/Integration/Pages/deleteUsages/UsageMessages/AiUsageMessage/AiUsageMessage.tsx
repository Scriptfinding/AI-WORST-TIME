import { FlowUsageList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/FlowUsageList/FlowUsageList';
import { ItemUsageList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/ItemUsageList/ItemUsageList';
import type { FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';

interface AiUsageMessageProps {
    models: { id: string; name: string }[];
    flows: FlowUsage[];
}

export function AiUsageMessage({ models, flows }: AiUsageMessageProps) {
    return (
        <>
            {models.length > 0 && (
                <>
                    {'\n\n'}{models.length} AI model(s) will be deleted:
                    <ItemUsageList
                        items={models.map(model => ({
                            key: model.id,
                            label: model.name,
                            icon: 'lucide:bot',
                        }))}
                    />
                </>
            )}
            {flows.length > 0 && (
                <>
                    {'\n\n'}Used in {flows.length} flow(s):
                    <FlowUsageList flows={flows} />
                </>
            )}
        </>
    );
}
