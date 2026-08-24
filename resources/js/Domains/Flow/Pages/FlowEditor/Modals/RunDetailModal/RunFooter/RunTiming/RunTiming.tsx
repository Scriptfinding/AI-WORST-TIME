import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowRun } from '@/Domains/Flow/types';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import * as S from './styled';

interface RunTimingProps {
    run: FlowRun;
    elapsed: number | null;
    timeLeft: number | null;
}

function formatSeconds(seconds: number) {
    return seconds >= 60
        ? `${Math.floor(seconds / 60)}m ${seconds % 60}s`
        : `${seconds}s`;
}

export default function RunTiming({ run, elapsed, timeLeft }: RunTimingProps) {
    return (
        <>
            <S.TimingItem>{formatDateTime(run.created_at)}</S.TimingItem>
            {run.duration_ms != null && (
                <S.TimingItem>
                    <Icon icon="lucide:timer" width={12} height={12} />
                    {(run.duration_ms / 1000).toFixed(1)}s
                </S.TimingItem>
            )}
            {elapsed != null && (
                <S.TimingItem>
                    <Icon icon="lucide:timer" width={12} height={12} />
                    {formatSeconds(elapsed)}
                </S.TimingItem>
            )}
            {timeLeft != null && timeLeft > 0 && (
                <S.TimingItem $urgent={timeLeft <= 30}>
                    <Icon icon="lucide:hourglass" width={12} height={12} />
                    {formatSeconds(timeLeft)} left
                </S.TimingItem>
            )}
        </>
    );
}
