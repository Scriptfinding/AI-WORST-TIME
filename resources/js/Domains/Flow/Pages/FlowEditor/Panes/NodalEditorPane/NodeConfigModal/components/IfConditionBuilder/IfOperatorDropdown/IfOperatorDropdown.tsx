import {
    useMemo,
    useRef,
    useState,
    type KeyboardEvent,
} from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useActiveOptionScroll } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useActiveOptionScroll';
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
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const operatorGroups = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        let optionIndex = 0;

        return IF_CATEGORIES.flatMap(itemCategory => {
            const categoryMatches = IF_CATEGORY_LABELS[itemCategory].toLowerCase().includes(normalizedQuery);
            const operators = normalizedQuery && !categoryMatches
                ? IF_OPERATORS[itemCategory].filter(item => (
                    `${item.label} ${item.value}`.toLowerCase().includes(normalizedQuery)
                ))
                : IF_OPERATORS[itemCategory];

            return operators.length > 0 ? [{
                category: itemCategory,
                operators: operators.map(item => ({ ...item, optionIndex: optionIndex++ })),
            }] : [];
        });
    }, [query]);
    const flattenedOperators = operatorGroups.flatMap(group => (
        group.operators.map(item => ({ category: group.category, operator: item }))
    ));
    useActiveOptionScroll({
        open,
        queryDependency: query,
        activeIndex,
        setActiveIndex,
        optionRefs,
    });
    const close = () => {
        setOpen(false);
        setQuery('');
    };
    const openDropdown = () => {
        setOpen(true);
        setActiveIndex(Math.max(0, flattenedOperators.findIndex(item => (
            item.category === category && item.operator.value === operator.value
        ))));
        window.requestAnimationFrame(() => searchInputRef.current?.focus());
    };
    const selectActiveOperator = () => {
        const activeOperator = flattenedOperators[activeIndex];
        if (!activeOperator) return;

        onChange(activeOperator.category, activeOperator.operator.value);
        close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            if (!open) {
                openDropdown();
                return;
            }
            setActiveIndex(current => Math.min(current + 1, flattenedOperators.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            if (!open) {
                openDropdown();
                return;
            }
            setActiveIndex(current => Math.max(current - 1, 0));
        } else if (open && event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
        } else if (open && event.key === 'End') {
            event.preventDefault();
            setActiveIndex(Math.max(0, flattenedOperators.length - 1));
        } else if (open && event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            selectActiveOperator();
        }
    };

    return (
        <S.OperatorDropdown
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) close();
            }}
        >
            <S.OperatorButton
                type="button"
                disabled={readOnly}
                aria-expanded={open}
                onKeyDown={handleKeyDown}
                onClick={() => {
                    if (open) {
                        close();
                        return;
                    }

                    openDropdown();
                }}
            >
                <Icon icon={IF_CATEGORY_ICONS[category]} width={14} height={14} />
                <span>{operator.label}</span>
                <small>{IF_CATEGORY_LABELS[category]}</small>
                <Icon icon="lucide:chevron-down" width={14} height={14} />
            </S.OperatorButton>
            {open && (
                <S.OperatorMenu data-node-field-dropdown="true">
                    <S.OperatorSearch>
                        <Icon icon="lucide:search" width={13} height={13} />
                        <input
                            ref={searchInputRef}
                            value={query}
                            placeholder="Search operators..."
                            aria-label="Search operators"
                            onChange={event => setQuery(event.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </S.OperatorSearch>
                    <S.OperatorGroups>
                        {operatorGroups.map(group => (
                            <S.OperatorGroup key={group.category}>
                                <S.OperatorGroupLabel>
                                    <Icon icon={IF_CATEGORY_ICONS[group.category]} width={13} height={13} />
                                    {IF_CATEGORY_LABELS[group.category]}
                                </S.OperatorGroupLabel>
                                {group.operators.map(item => (
                                    <S.OperatorOption
                                        key={`${group.category}-${item.value}`}
                                        ref={element => {
                                            optionRefs.current[item.optionIndex] = element;
                                        }}
                                        type="button"
                                        data-active={item.optionIndex === activeIndex}
                                        data-selected={group.category === category && item.value === operator.value}
                                        onMouseEnter={() => setActiveIndex(item.optionIndex)}
                                        onClick={() => {
                                            onChange(group.category, item.value);
                                            close();
                                        }}
                                    >
                                        <Icon icon={IF_CATEGORY_ICONS[group.category]} width={13} height={13} />
                                        <span>{item.label}</span>
                                    </S.OperatorOption>
                                ))}
                            </S.OperatorGroup>
                        ))}
                        {operatorGroups.length === 0 && (
                            <S.OperatorEmpty>No operator found.</S.OperatorEmpty>
                        )}
                    </S.OperatorGroups>
                </S.OperatorMenu>
            )}
        </S.OperatorDropdown>
    );
}
