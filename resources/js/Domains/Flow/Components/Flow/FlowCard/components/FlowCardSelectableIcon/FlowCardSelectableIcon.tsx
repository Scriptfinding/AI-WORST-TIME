import { Icon } from '@/Shared/UI/Icon/Icon';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import type { Flow } from '@/Domains/Flow/types';
import * as S from './styled';

interface Props {
    flow: Flow;
    size: number;
    selectable: boolean;
    selected: boolean;
    onToggleSelect?: (flow: Flow) => void;
}

export default function FlowCardSelectableIcon({
    flow,
    size,
    selectable,
    selected,
    onToggleSelect,
}: Props) {
    if (!selectable) {
        return <FlowIcon flow={flow} size={size} radius={size <= 16 ? 'xs' : 'sm'} />;
    }

    return (
        <S.Wrapper $size={size}>
            <S.IconWrapper data-select-icon $selected={selected}>
                <FlowIcon flow={flow} size={size} radius={size <= 16 ? 'xs' : 'sm'} />
            </S.IconWrapper>
            <S.Checkbox
                type="button"
                data-select-checkbox
                $selected={selected}
                aria-pressed={selected}
                aria-label={selected ? `Unselect ${flow.name}` : `Select ${flow.name}`}
                onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleSelect?.(flow);
                }}
            >
                {selected && <Icon icon="lucide:check" width={13} height={13} />}
            </S.Checkbox>
        </S.Wrapper>
    );
}
