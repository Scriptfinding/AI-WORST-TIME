import { FlowUsageList } from './FlowUsageList/FlowUsageList';
import type { FlowUsage } from './types';

export function renderFlowList(flows: FlowUsage[]) {
    return <FlowUsageList flows={flows} />;
}
