import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import * as RunStyles from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';
import type { FlowRun } from '@/Domains/Flow/types';
import JsonViewer from '@/Domains/Flow/Pages/FlowEditor/components/JsonViewer/JsonViewer';
import { formatJson } from '@/Domains/Flow/Pages/FlowEditor/utils/runDisplay';
import { DataPanelLoader } from '../shared.styled';
import * as S from './styled';

interface DataTabProps {
    run: FlowRun;
    userDataOnly: boolean;
    onToggleUserDataOnly: (value: boolean) => void;
    copyToClipboard: (text: string) => void;
}

export default function DataTab({
    run,
    userDataOnly,
    onToggleUserDataOnly,
    copyToClipboard,
}: DataTabProps) {
    const secretsPending = run.secrets_redacted === undefined
        && (!!run.input || !!run.output || !!run.error_message);

    return (
        <>
            <RunStyles.RunDetailPanel>
                <RunStyles.RunDetailPanelHeader>
                    <RunStyles.RunDetailPanelTitle>
                        <Icon icon="lucide:arrow-down-left" width={11} height={11} />
                        Input
                    </RunStyles.RunDetailPanelTitle>
                    <S.OutputHeaderActions>
                        {!secretsPending && (
                            <RunStyles.RunDetailCopyButton onClick={() => copyToClipboard(run.input ? formatJson(run.input) : '')}>
                                Copy
                            </RunStyles.RunDetailCopyButton>
                        )}
                    </S.OutputHeaderActions>
                </RunStyles.RunDetailPanelHeader>
                {secretsPending ? (
                    <DataPanelLoader><Icon icon="lucide:loader-2" width={18} height={18} /></DataPanelLoader>
                ) : run.input ? (
                    <JsonViewer value={formatJson(run.input)} fill />
                ) : (
                    <Layout.RunListEmpty><Layout.EmptyText>No input provided.</Layout.EmptyText></Layout.RunListEmpty>
                )}
            </RunStyles.RunDetailPanel>
            <RunStyles.RunDetailPanel>
                <RunStyles.RunDetailPanelHeader>
                    <RunStyles.RunDetailPanelTitle>
                        <Icon icon="lucide:arrow-up-right" width={11} height={11} />
                        Output
                    </RunStyles.RunDetailPanelTitle>
                    <S.OutputHeaderActions>
                        {!secretsPending && run.output && Object.keys(run.output).some(k => k.startsWith('$')) && (
                            <S.OutputFilterToggle
                                $active={userDataOnly}
                                onClick={() => onToggleUserDataOnly(!userDataOnly)}
                                title={userDataOnly ? 'Show full output' : 'Show user data only'}
                            >
                                <Icon icon="lucide:filter" width={11} height={11} />
                                {userDataOnly ? 'Full output' : 'User data'}
                            </S.OutputFilterToggle>
                        )}
                        {!secretsPending && run.output && (
                            <RunStyles.RunDetailCopyButton onClick={() => {
                                const data = userDataOnly
                                    ? Object.fromEntries(Object.entries(run.output!).filter(([k]) => !k.startsWith('$')))
                                    : run.output;
                                copyToClipboard(formatJson(data));
                            }}>
                                Copy
                            </RunStyles.RunDetailCopyButton>
                        )}
                        {!secretsPending && !run.output && run.error_message && (
                            <RunStyles.RunDetailCopyButton onClick={() => copyToClipboard(run.error_message!)}>
                                Copy
                            </RunStyles.RunDetailCopyButton>
                        )}
                    </S.OutputHeaderActions>
                </RunStyles.RunDetailPanelHeader>
                {secretsPending ? (
                    <DataPanelLoader><Icon icon="lucide:loader-2" width={18} height={18} /></DataPanelLoader>
                ) : (<>
                    {run.output ? (() => {
                        const hiddenKeys = userDataOnly
                            ? Object.keys(run.output!).filter(k => k.startsWith('$'))
                            : [];
                        const displayed = hiddenKeys.length > 0
                            ? Object.fromEntries(Object.entries(run.output!).filter(([k]) => !k.startsWith('$')))
                            : run.output;
                        return (
                            <>
                                <JsonViewer value={formatJson(displayed)} fill />
                                {hiddenKeys.length > 0 && (
                                    <S.HiddenKeysHint onClick={() => onToggleUserDataOnly(false)}>
                                        <Icon icon="lucide:eye-off" width={11} height={11} />
                                        {hiddenKeys.length} hidden {hiddenKeys.length === 1 ? 'field' : 'fields'}: {hiddenKeys.join(', ')}
                                    </S.HiddenKeysHint>
                                )}
                                {run.error_message && (
                                    <S.ErrorBanner>
                                        <Icon icon="lucide:alert-circle" width={14} height={14} />
                                        {run.error_message}
                                    </S.ErrorBanner>
                                )}
                            </>
                        );
                    })() : (run.status === 'pending' || run.status === 'running') ? (
                        <S.RunningStateContainer>
                            <S.RunningSpinner $variant={run.status === 'pending' ? 'warning' : 'info'}>
                                <Icon icon="lucide:loader-2" width={28} height={28} />
                            </S.RunningSpinner>
                            <S.RunningText>
                                {run.status === 'pending' ? 'Waiting to start...' : 'Running...'}
                            </S.RunningText>
                            <S.RunningHint>
                                The result will appear here once the run is complete.
                            </S.RunningHint>
                        </S.RunningStateContainer>
                    ) : run.error_message ? (
                        <S.ErrorBanner>
                            <Icon icon="lucide:alert-circle" width={14} height={14} />
                            {run.error_message}
                        </S.ErrorBanner>
                    ) : (
                        <Layout.RunListEmpty><Layout.EmptyText>No output.</Layout.EmptyText></Layout.RunListEmpty>
                    )}
                </>)}
            </RunStyles.RunDetailPanel>
        </>
    );
}
