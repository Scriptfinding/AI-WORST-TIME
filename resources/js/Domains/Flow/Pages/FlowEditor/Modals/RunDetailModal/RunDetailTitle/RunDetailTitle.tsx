import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import type { Flow, FlowRun } from '@/Domains/Flow/types';
import * as S from './styled';

type FlowIconData = Pick<Flow, 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url'> & {
    name?: string;
};

interface RunDetailTitleProps {
    run: FlowRun;
    flowName?: string;
    flowIcon?: FlowIconData;
}

export default function RunDetailTitle({ run, flowName, flowIcon }: RunDetailTitleProps) {
    return (
        <S.ModalTitle>
            {flowIcon && <FlowIcon flow={flowIcon} size={20} />}
            <span>{flowName ? `${flowName} · ` : ''}Run #{run.id}</span>
            {run.legend && (
                <>
                    <S.TitleSeparator aria-hidden>|</S.TitleSeparator>
                    <S.TitleLegend title={run.legend}>{run.legend}</S.TitleLegend>
                </>
            )}
        </S.ModalTitle>
    );
}
