import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowRun } from '@/Domains/Flow/types';
import { ucfirst } from '@/Shared/Utils/string';
import RunActions from './RunActions/RunActions';
import RunStatus from './RunStatus/RunStatus';
import RunTiming from './RunTiming/RunTiming';
import * as S from './styled';

interface RunFooterProps {
    run: FlowRun;
    isActive: boolean;
    isFinished: boolean;
    isWaitingHuman: boolean;
    timeLeft: number | null;
    elapsed: number | null;
    onKill?: (run: FlowRun) => void;
    onRerun?: (run: FlowRun) => void;
    onDelete: () => void;
    onOlder?: () => void;
    onNewer?: () => void;
    footerExtra?: React.ReactNode;
}

export default function RunFooter({ run, isActive, isFinished, isWaitingHuman, timeLeft, elapsed, onKill, onRerun, onDelete, onOlder, onNewer, footerExtra }: RunFooterProps) {
    return (
        <S.RunDetailFooter>
            <S.RunDetailMeta>
                <S.RunNavigation>
                    <S.RunNavigationButton
                        type="button"
                        aria-label="Newer run"
                        title="Newer run"
                        disabled={!onNewer}
                        onClick={onNewer}
                    >
                        <Icon icon="lucide:chevron-left" width={14} height={14} />
                    </S.RunNavigationButton>
                    <S.RunNavigationButton
                        type="button"
                        aria-label="Older run"
                        title="Older run"
                        disabled={!onOlder}
                        onClick={onOlder}
                    >
                        <Icon icon="lucide:chevron-right" width={14} height={14} />
                    </S.RunNavigationButton>
                </S.RunNavigation>
                <RunStatus run={run} isWaitingHuman={isWaitingHuman} />
                <RunTiming run={run} elapsed={elapsed} timeLeft={timeLeft} />
                {run.screenshots_count > 0 && (
                    <S.RunDetailMetaItem>
                        <Icon icon="lucide:camera" width={12} height={12} />
                        {run.screenshots_count}
                    </S.RunDetailMetaItem>
                )}
                {run.downloads_count > 0 && (
                    <S.RunDetailMetaItem>
                        <Icon icon="lucide:download" width={12} height={12} />
                        {run.downloads_count}
                    </S.RunDetailMetaItem>
                )}
                {run.has_recording && (
                    <S.RunDetailMetaItem>
                        <Icon icon="lucide:video" width={12} height={12} />
                        Rec
                    </S.RunDetailMetaItem>
                )}
                <S.RunDetailMetaItem>
                    <Icon icon="lucide:user" width={12} height={12} />
                    {run.triggered_by_user
                        ? `${run.trigger_type === 'api' ? 'Api · ' : ''}by ${ucfirst(run.triggered_by_user.name)}`
                        : ucfirst(run.trigger_type)}
                </S.RunDetailMetaItem>
            </S.RunDetailMeta>
            <RunActions
                run={run}
                isActive={isActive}
                isFinished={isFinished}
                onKill={onKill}
                onRerun={onRerun}
                onDelete={onDelete}
                footerExtra={footerExtra}
            />
        </S.RunDetailFooter>
    );
}
