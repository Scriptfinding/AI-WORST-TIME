import { Icon } from '@/Shared/UI/Icon/Icon';
import { formatDate, formatDateTime } from '@/Shared/Utils/formatDate';
import type { Flow } from '@/Domains/Flow/types';
import type { FlowCardVariant } from '@/Domains/Flow/Components/Flow/FlowCard/types';
import FlowCardSelectableIcon from '@/Domains/Flow/Components/Flow/FlowCard/components/FlowCardSelectableIcon/FlowCardSelectableIcon';
import * as S from './styled';

interface Props {
    flow: Flow;
    variant: FlowCardVariant;
    selectable: boolean;
    selected: boolean;
    onToggleSelect?: (flow: Flow) => void;
}

export default function FlowCardMetadata({
    flow,
    variant,
    selectable,
    selected,
    onToggleSelect,
}: Props) {
    const hasTriggers = (flow.triggers_count ?? 0) > 0;
    const hasActions = (flow.actions_count ?? 0) > 0;

    return (
        <S.Meta $variant={variant}>
            {flow.owner && (
                <S.Item>
                    <Icon icon="lucide:user" />
                    {flow.owner.name}
                </S.Item>
            )}
            <S.Indicators>
                <S.LeftIndicators>
                    {flow.last_run_at && (
                        <S.Item title={formatDateTime(flow.last_run_at)}>
                            <Icon icon="lucide:play" />
                            {formatDate(flow.last_run_at)}
                        </S.Item>
                    )}
                </S.LeftIndicators>
                <S.RightIndicators>
                    <S.Webhooks>
                        <S.WebhookArrow $active={hasTriggers} $direction="in" title={hasTriggers ? `${flow.triggers_count} trigger(s)` : 'No triggers'}>
                            <Icon icon="lucide:arrow-up" />
                        </S.WebhookArrow>
                        <S.WebhookArrow $active={hasActions} $direction="out" title={hasActions ? `${flow.actions_count} action(s)` : 'No actions'}>
                            <Icon icon="lucide:arrow-down" />
                        </S.WebhookArrow>
                    </S.Webhooks>
                    {variant === 'grid' && (
                        <FlowCardSelectableIcon
                            flow={flow}
                            size={16}
                            selectable={selectable}
                            selected={selected}
                            onToggleSelect={onToggleSelect}
                        />
                    )}
                </S.RightIndicators>
            </S.Indicators>
        </S.Meta>
    );
}
