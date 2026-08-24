import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import * as Layout from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import type { FlowRun } from '@/Domains/Flow/types';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import { ucfirst } from '@/Shared/Utils/string';
import * as S from './styled';

interface TriggerTabProps {
    run: FlowRun;
}

export default function TriggerTab({ run }: TriggerTabProps) {
    return (
        <>
            <S.ArtifactSection>
                <S.ArtifactSectionHeader>
                    <Icon icon="lucide:zap" width={12} height={12} />
                    Trigger
                </S.ArtifactSectionHeader>
                {run.trigger ? (
                    <S.MetaDetailGrid>
                        <S.MetaDetailRow>
                            <S.MetaDetailKey>Type</S.MetaDetailKey>
                            <S.MetaDetailValue>{ucfirst(run.trigger.type)}</S.MetaDetailValue>
                        </S.MetaDetailRow>
                        <S.MetaDetailRow>
                            <S.MetaDetailKey>Label</S.MetaDetailKey>
                            <S.MetaDetailValue>{run.trigger.label}</S.MetaDetailValue>
                        </S.MetaDetailRow>
                    </S.MetaDetailGrid>
                ) : (
                    <S.MetaDetailGrid>
                        <S.MetaDetailRow>
                            <S.MetaDetailKey>Type</S.MetaDetailKey>
                            <S.MetaDetailValue>{ucfirst(run.trigger_type)}</S.MetaDetailValue>
                        </S.MetaDetailRow>
                    </S.MetaDetailGrid>
                )}
            </S.ArtifactSection>
            <S.ArtifactSection>
                <S.ArtifactSectionHeader>
                    <Icon icon="lucide:send" width={12} height={12} />
                    Actions {run.action_results && run.action_results.length > 0 && `(${run.action_results.length})`}
                </S.ArtifactSectionHeader>
                {run.action_results && run.action_results.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {run.action_results.map((ar, i) => (
                            <S.MetaDetailGrid key={i}>
                                <S.MetaDetailRow>
                                    <S.MetaDetailKey>Action</S.MetaDetailKey>
                                    <S.MetaDetailValue>{ar.label} ({ar.type})</S.MetaDetailValue>
                                </S.MetaDetailRow>
                                <S.MetaDetailRow>
                                    <S.MetaDetailKey>Status</S.MetaDetailKey>
                                    <S.MetaDetailValue>
                                        <Badge variant={ar.success ? 'success' : 'error'}>
                                            {ar.success ? 'Success' : 'Failed'}
                                            {ar.status ? ` (${ar.status})` : ''}
                                        </Badge>
                                    </S.MetaDetailValue>
                                </S.MetaDetailRow>
                                {ar.url && (
                                    <S.MetaDetailRow>
                                        <S.MetaDetailKey>URL</S.MetaDetailKey>
                                        <S.MetaDetailValue>{ar.url}</S.MetaDetailValue>
                                    </S.MetaDetailRow>
                                )}
                                {ar.error && (
                                    <S.MetaDetailRow>
                                        <S.MetaDetailKey>Error</S.MetaDetailKey>
                                        <S.MetaDetailValue style={{ color: 'var(--accent-error, #ef4444)' }}>
                                            {ar.error}
                                        </S.MetaDetailValue>
                                    </S.MetaDetailRow>
                                )}
                                {ar.sent_at && (
                                    <S.MetaDetailRow>
                                        <S.MetaDetailKey>Sent</S.MetaDetailKey>
                                        <S.MetaDetailValue>{formatDateTime(ar.sent_at)}</S.MetaDetailValue>
                                    </S.MetaDetailRow>
                                )}
                            </S.MetaDetailGrid>
                        ))}
                    </div>
                ) : (
                    <Layout.RunListEmpty><Layout.EmptyText>No actions were dispatched for this run.</Layout.EmptyText></Layout.RunListEmpty>
                )}
            </S.ArtifactSection>
        </>
    );
}
