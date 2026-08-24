import { FlowUsageList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/FlowUsageList/FlowUsageList';
import { ItemUsageList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/ItemUsageList/ItemUsageList';
import { type FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';

interface VaultUsageMessageProps {
    variables: { id: string; key: string }[];
    flows: FlowUsage[];
}

export function VaultUsageMessage({ variables, flows }: VaultUsageMessageProps) {
    return (
        <>
            {variables.length > 0 && (
                <>
                    {'\n\n'}{variables.length} variable(s) will be deleted:
                    <ItemUsageList
                        items={variables.map(variable => ({
                            key: variable.id,
                            label: variable.key,
                            icon: 'lucide:key-round',
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
