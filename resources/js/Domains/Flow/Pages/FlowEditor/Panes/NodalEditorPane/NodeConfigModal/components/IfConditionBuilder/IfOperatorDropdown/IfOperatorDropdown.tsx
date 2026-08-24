import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { IfConditionCategory } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    IF_CATEGORIES,
    IF_CATEGORY_ICONS,
    IF_CATEGORY_LABELS,
    IF_OPERATORS,
    type IfOperatorDef,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/utils/ifConditions';
import * as S from './styled';

interface IfOperatorDropdownProps {
    category: IfConditionCategory;
    operator: IfOperatorDef;
    readOnly?: boolean;
    onChange: (category: IfConditionCategory, operator: string) => void;
}

export default function IfOperatorDropdown({
    category,
    operator,
    readOnly,
    onChange,
}: IfOperatorDropdownProps) {
    const [open, setOpen] = useState(false);

    return (
        <S.OperatorDropdown
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
            }}
        >
            <S.OperatorButton
                type="button"
                disabled={readOnly}
                onClick={() => setOpen(current => !current)}
            >
                <Icon icon={IF_CATEGORY_ICONS[category]} width={14} height={14} />
                <span>{operator.label}</span>
                <small>{IF_CATEGORY_LABELS[category]}</small>
                <Icon icon="lucide:chevron-down" width={14} height={14} />
            </S.OperatorButton>
            {open && (
                <S.OperatorMenu>
                    {IF_CATEGORIES.map(itemCategory => (
                        <S.OperatorGroup key={itemCategory}>
                            <S.OperatorGroupLabel>
                                <Icon icon={IF_CATEGORY_ICONS[itemCategory]} width={13} height={13} />
                                {IF_CATEGORY_LABELS[itemCategory]}
                            </S.OperatorGroupLabel>
                            {IF_OPERATORS[itemCategory].map(item => (
                                <S.OperatorOption
                                    key={`${itemCategory}-${item.value}`}
                                    type="button"
                                    data-active={itemCategory === category && item.value === operator.value}
                                    onClick={() => {
                                        onChange(itemCategory, item.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Icon icon={IF_CATEGORY_ICONS[itemCategory]} width={13} height={13} />
                                    <span>{item.label}</span>
                                </S.OperatorOption>
                            ))}
                        </S.OperatorGroup>
                    ))}
                </S.OperatorMenu>
            )}
        </S.OperatorDropdown>
    );
}
