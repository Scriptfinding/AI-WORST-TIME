import { FlowUsageList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/FlowUsageList/FlowUsageList';
import { type FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';

interface MailboxUsageMessageProps {
    flows: FlowUsage[];
    watchersCount: number;
}

export function MailboxUsageMessage({ flows, watchersCount }: MailboxUsageMessageProps) {
    return (
        <>
            {'\n\n'}{watchersCount} watcher(s) in {flows.length} flow(s) will be affected:
            <FlowUsageList flows={flows} />
        </>
    );
}
