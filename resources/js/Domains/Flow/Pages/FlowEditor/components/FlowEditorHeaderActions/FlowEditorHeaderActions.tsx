import type React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { FlowEditorProps } from '@/Domains/Flow/Pages/FlowEditor/types';
import GitHubStarsWidget from '../GitHubStarsWidget/GitHubStarsWidget';
import * as S from './styled';
import { getVisibilityIcon, getVisibilityLabel } from './utils';

interface FlowEditorHeaderActionsProps {
    flow: FlowEditorProps['flow'];
    canEdit: boolean;
    running: boolean;
    showOverflow: boolean;
    overflowRef: React.Ref<HTMLDivElement>;
    visibilityColor: string;
    onRun: () => void;
    onOpenVisibility: () => void;
    onToggleOverflow: () => void;
    onCloseOverflow: () => void;
}

export default function FlowEditorHeaderActions({
    flow,
    canEdit,
    running,
    showOverflow,
    overflowRef,
    visibilityColor,
    onRun,
    onOpenVisibility,
    onToggleOverflow,
    onCloseOverflow,
}: FlowEditorHeaderActionsProps) {
    return (
        <S.HeaderActions>
            {canEdit && (
                <S.ShareToggle
                    $color={visibilityColor}
                    onClick={onOpenVisibility}
                    title="Change visibility"
                >
                    <Icon icon={getVisibilityIcon(flow.visibility)} width={13} height={13} />
                    {getVisibilityLabel(flow.visibility)}
                </S.ShareToggle>
            )}
            <S.DesktopRunBtn>
                <Button size="sm" onClick={onRun} loading={running}>
                    <Icon icon="lucide:play" />
                    <S.BtnLabel>{running ? 'Running...' : 'Run Flow'}</S.BtnLabel>
                </Button>
            </S.DesktopRunBtn>
            <GitHubStarsWidget />
            <S.OverflowWrap ref={overflowRef}>
                <S.OverflowBtn onClick={onToggleOverflow}>
                    <Icon icon="lucide:more-vertical" />
                </S.OverflowBtn>
                {showOverflow && (
                    <S.OverflowMenu>
                        <S.OverflowMenuItem onClick={() => { onCloseOverflow(); onRun(); }}>
                            <Icon icon="lucide:play" />
                            {running ? 'Running...' : 'Run Flow'}
                        </S.OverflowMenuItem>
                        {canEdit && (
                            <S.OverflowMenuItem
                                $color={visibilityColor}
                                onClick={() => { onCloseOverflow(); onOpenVisibility(); }}
                            >
                                <Icon icon={getVisibilityIcon(flow.visibility)} />
                                {getVisibilityLabel(flow.visibility)}
                            </S.OverflowMenuItem>
                        )}
                    </S.OverflowMenu>
                )}
            </S.OverflowWrap>
        </S.HeaderActions>
    );
}
