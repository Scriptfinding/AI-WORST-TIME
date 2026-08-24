import RunListItem from '@/Domains/Flow/Components/Run/RunListItem';
import type { FlowRun } from '@/Domains/Flow/types';
import * as S from './styled';

interface Props {
    runningRuns: FlowRun[];
    recentRuns: FlowRun[];
    waitingHumanIds: Set<number>;
    onKill: (run: FlowRun) => void;
    onOpen: (run: FlowRun) => void;
}

export default function DashboardRuns({
    runningRuns,
    recentRuns,
    waitingHumanIds,
    onKill,
    onOpen,
}: Props) {
    return (
        <>
            {runningRuns.length > 0 && (
                <S.Section>
                    <S.SectionTitle>Running Runs</S.SectionTitle>
                    <S.RunList>
                        {runningRuns.map(run => (
                            <RunListItem
                                key={run.id}
                                run={run}
                                waitingHuman={waitingHumanIds.has(run.id)}
                                showDuration={false}
                                showArtifacts={false}
                                showMeta={false}
                                onKill={onKill}
                                onOpen={onOpen}
                            />
                        ))}
                    </S.RunList>
                </S.Section>
            )}

            <S.Section>
                <S.SectionTitle>Recent Runs</S.SectionTitle>
                <S.RunList>
                    {recentRuns.length === 0 && (
                        <S.EmptyRunItem>
                            <S.EmptyText>No runs yet</S.EmptyText>
                        </S.EmptyRunItem>
                    )}
                    {recentRuns.map(run => (
                        <RunListItem
                            key={run.id}
                            run={run}
                            waitingHuman={waitingHumanIds.has(run.id)}
                            showStop={false}
                            onOpen={onOpen}
                        />
                    ))}
                </S.RunList>
            </S.Section>
        </>
    );
}
