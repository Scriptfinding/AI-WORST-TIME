import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import RecordingPlayer from '@proprietary/Domains/Flow/Components/RecordingPlayer/RecordingPlayer.pp';
import { getRunMeta, renderInlineMarkdown } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import * as S from './styled.pp';

interface Props {
    flow: Flow;
    run: FlowRun;
    recordingUrl: string | null;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees: TeamTree[];
}

export default function RecordingPlayerPage({
    flow,
    run,
    recordingUrl,
    personalTree,
    workspaceTree,
    teamTrees,
}: Props) {
    const meta = getRunMeta(run);
    const hasMeta = !!run.legend || !!meta;

    return (
        <S.PageContainer>
            <S.TopBar>
                <S.BackLink href={`/flows/${flow.id}?run=${run.id}#runs`}>
                    <Icon icon="lucide:arrow-left" width={15} height={15} />
                </S.BackLink>
                <S.Separator />
                <S.FlowName>{flow.name}</S.FlowName>
                <S.RunId>#{run.id}</S.RunId>
                <S.Spacer />
                <S.RecBadge>
                    <Icon icon="lucide:video" width={11} height={11} />
                    Rec
                </S.RecBadge>
            </S.TopBar>
            {hasMeta && (
                <S.MetaBar>
                    {run.legend && (
                        <S.LegendTag>
                            <Icon icon="lucide:bookmark" width={11} height={11} />
                            {run.legend}
                        </S.LegendTag>
                    )}
                    {meta && Object.entries(meta).map(([k, v]) => (
                        <S.MetaChip key={k}>
                            <S.MetaChipKey>{k}:</S.MetaChipKey>
                            {typeof v === 'object' ? JSON.stringify(v) : renderInlineMarkdown(String(v))}
                        </S.MetaChip>
                    ))}
                </S.MetaBar>
            )}
            <S.PlayerWrapper>
                <S.PlayerInner>
                    {recordingUrl ? (
                        <RecordingPlayer
                            src={recordingUrl}
                            actionLogs={run.action_logs ?? null}
                            flowId={flow.id}
                            flowName={flow.name}
                            personalTree={personalTree}
                            workspaceTree={workspaceTree}
                            teamTrees={teamTrees}
                        />
                    ) : (
                        <S.NoRecording>
                            <S.NoRecordingIcon $success={run.status === 'success'}>
                                <Icon icon={run.status === 'success' ? 'lucide:check-circle' : 'lucide:video-off'} width={26} height={26} />
                            </S.NoRecordingIcon>
                            <S.NoRecordingTitle>No recording available</S.NoRecordingTitle>
                            <S.NoRecordingDesc>
                                {run.error_message
                                    ? 'The run failed before the browser could capture any content.'
                                    : 'The script completed successfully without producing any visual output.'}
                            </S.NoRecordingDesc>
                            {run.error_message && (
                                <S.NoRecordingError>{run.error_message}</S.NoRecordingError>
                            )}
                        </S.NoRecording>
                    )}
                </S.PlayerInner>
            </S.PlayerWrapper>
        </S.PageContainer>
    );
}
