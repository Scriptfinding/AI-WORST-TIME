import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import { WaitingHumanIcon } from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';
import type { FlowRun } from '@/Domains/Flow/types';
import { STATUS_VARIANT } from '@/Domains/Flow/Pages/FlowEditor/types';

interface RunStatusProps {
    run: FlowRun;
    isWaitingHuman: boolean;
}

export default function RunStatus({ run, isWaitingHuman }: RunStatusProps) {
    const statusIcon = run.status === 'success' ? 'lucide:check'
        : run.status === 'error' ? 'lucide:x'
            : run.status === 'cancelled' ? 'lucide:ban'
                : run.status === 'running' ? 'lucide:loader-2'
                    : 'lucide:clock';

    return (
        <Badge variant={STATUS_VARIANT[run.status]}>
            <Icon
                icon={statusIcon}
                width={12}
                height={12}
                style={run.status === 'running' ? { animation: 'spin 1s linear infinite' } : undefined}
            />
            {run.status}
            {isWaitingHuman && (
                <WaitingHumanIcon title="Waiting for human validation">
                    <Icon icon="lucide:hand" width={12} height={12} />
                </WaitingHumanIcon>
            )}
        </Badge>
    );
}
