import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { usePage } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import BrowserPane from '@/Domains/Flow/Components/BrowserPane/BrowserPane';
import type { FlowRun } from '@/Domains/Flow/types';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import * as S from './styled';

interface BrowserTabProps {
    run: FlowRun;
    flowId: Id;
    isWaitingHuman: boolean;
    validationMessage: string | null;
    continuing: boolean;
    onContinue: () => void;
    active: boolean;
}

export default function BrowserTab({ run, flowId, isWaitingHuman, validationMessage, continuing, onContinue, active }: BrowserTabProps) {
    const pageProps = usePage<Partial<FlowEditorProps>>().props;
    return (
        <>
            {isWaitingHuman && run.status === 'running' && (
                <S.WaitingHumanBanner>
                    <S.WaitingHumanText>
                        <Icon icon="lucide:hand" width={16} height={16} />
                        <S.WaitingHumanCopy>
                            <S.WaitingHumanTitle>Waiting for human validation</S.WaitingHumanTitle>
                            <S.WaitingHumanMessage>
                                {validationMessage || 'Interact with the browser below, then continue.'}
                            </S.WaitingHumanMessage>
                        </S.WaitingHumanCopy>
                    </S.WaitingHumanText>
                    <Button
                        size="sm"
                        variant="info"
                        disabled={continuing}
                        loading={continuing}
                        onClick={onContinue}
                    >
                        <Icon icon="lucide:play" width={14} height={14} style={{ marginRight: 4 }} />
                        Continue run
                    </Button>
                </S.WaitingHumanBanner>
            )}
            <BrowserPane
                runId={run.id}
                flowId={flowId}
                active={active}
                isRunning={run.status === 'running' || run.status === 'pending'}
                recordingUrl={
                    run.has_recording
                        ? `/flows/${flowId}/runs/${run.id}/recording`
                        : null
                }
                actionLogs={run.action_logs}
                flowName={run.flow?.name ?? pageProps.flow?.name}
                personalTree={pageProps.personalTree ?? []}
                workspaceTree={pageProps.workspaceTree ?? []}
                teamTrees={pageProps.teamTrees ?? []}
            />
        </>
    );
}
