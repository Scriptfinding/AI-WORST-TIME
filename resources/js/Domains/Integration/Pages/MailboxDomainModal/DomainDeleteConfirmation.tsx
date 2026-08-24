import { renderFlowList } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/renderFlowList';
import type { FlowUsage } from '@/Domains/Integration/Pages/deleteUsages/UsageLists/types';

interface Props {
    domainName: string;
    flows: (FlowUsage & { watchers: string[] })[];
    watchersCount: number;
}

export default function DomainDeleteConfirmation({ domainName, flows, watchersCount }: Props) {
    return (
        <>
            Delete "{domainName}" and all associated mailboxes?
            {'\n\n'}{watchersCount} watcher(s) in {flows.length} flow(s) will be affected:
            {renderFlowList(flows)}
        </>
    );
}
