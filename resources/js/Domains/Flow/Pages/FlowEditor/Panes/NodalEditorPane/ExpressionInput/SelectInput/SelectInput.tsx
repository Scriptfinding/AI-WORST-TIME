import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NodalSelectOption } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { ScalarNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { useAnchoredDropdownPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import { dropdownStyle } from '../utils';
import * as S from './styled';

interface SelectInputProps {
    options: NodalSelectOption[];
    searchThreshold: number;
    value: string;
    placeholder?: string;
    allowCustomValue?: boolean;
    readOnly?: boolean;
    onChange: (value: ScalarNodeParameterValue) => void;
}

export default function SelectInput({
    options,
    searchThreshold,
    value,
    placeholder,
    allowCustomValue = false,
    readOnly,
    onChange,
}: SelectInputProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const { dropdownRect, updateDropdownPosition } = useAnchoredDropdownPosition(
        triggerRef,
        open,
        { maxHeight: 190 },
    );
    const selectedOption = options.find(option => option.value === value);
    const showSearch = allowCustomValue || options.length >= searchThreshold;
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return options;

        return options.filter(option => (
            option.label.toLowerCase().includes(normalizedQuery)
            || option.value.toLowerCase().includes(normalizedQuery)
        ));
    }, [options, query]);
    const selectableOptions = useMemo(() => {
        const customValue = query.trim();
        const customOption = allowCustomValue
            && customValue
            && !options.some(option => option.value === customValue)
            ? {
                value: customValue,
                label: `Use "${customValue}"`,
                detail: 'Custom tab name',
            }
            : null;

        return customOption ? [customOption, ...filteredOptions] : filteredOptions;
    }, [allowCustomValue, filteredOptions, options, query]);

    useEffect(() => {
        if (!open) return;

        const customValueIsFirst = allowCustomValue
            && Boolean(query.trim())
            && selectableOptions[0]?.value === query.trim();
        if (customValueIsFirst) {
            setActiveIndex(0);
            return;
        }
        const selectedIndex = selectableOptions.findIndex(option => option.value === value);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }, [allowCustomValue, open, query, selectableOptions, value]);

    useEffect(() => {
        if (open) {
            optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex, open]);

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    const selectOption = (option: NodalSelectOption) => {
        onChange({ mode: 'fixed', value: option.value });
        close();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (readOnly) return;

        if (!open) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
                event.preventDefault();
                setQuery('');
                updateDropdownPosition();
                setOpen(true);
            }
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }

        if (selectableOptions.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(current => Math.min(current + 1, selectableOptions.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(current => Math.max(current - 1, 0));
        } else if (event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            setActiveIndex(selectableOptions.length - 1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            selectOption(selectableOptions[activeIndex] ?? selectableOptions[0]);
        }
    };

    return (
        <S.SelectPicker
            onKeyDown={handleKeyDown}
            onBlurCapture={event => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                close();
            }}
        >
            <S.SelectTrigger
                type="button"
                ref={triggerRef}
                disabled={readOnly}
                onClick={() => {
                    setQuery('');
                    updateDropdownPosition();
                    setOpen(current => !current);
                }}
            >
                <span>{(selectedOption?.label ?? value) || placeholder || 'Select a value...'}</span>
                <Icon icon="lucide:chevron-down" width={14} height={14} />
            </S.SelectTrigger>
            {open && !readOnly && dropdownRect && (
                <S.SelectDropdown
                    data-node-field-dropdown="true"
                    style={dropdownStyle(dropdownRect)}
                >
                    {showSearch && (
                        <S.SelectSearchInput
                            autoFocus
                            value={query}
                            placeholder={allowCustomValue ? 'Search or enter a tab name...' : 'Search option...'}
                            onChange={event => {
                                setQuery(event.target.value);
                                setActiveIndex(0);
                            }}
                            onKeyDown={event => {
                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    close();
                                }
                            }}
                        />
                    )}
                    {selectableOptions.length > 0 ? (
                        selectableOptions.map((option, optionIndex) => (
                            <S.SelectOption
                                key={option.value}
                                ref={element => {
                                    optionRefs.current[optionIndex] = element;
                                }}
                                type="button"
                                $active={selectableOptions[activeIndex]?.value === option.value}
                                $selected={option.value === value}
                                aria-selected={option.value === value}
                                onMouseDown={event => event.preventDefault()}
                                onMouseEnter={() => setActiveIndex(optionIndex)}
                                onClick={() => selectOption(option)}
                            >
                                <strong>{option.label}</strong>
                                {option.detail && <span>{option.detail}</span>}
                                {option.value === value && (
                                    <span data-select-check>
                                        <Icon icon="lucide:check" width={13} height={13} />
                                    </span>
                                )}
                            </S.SelectOption>
                        ))
                    ) : (
                        <S.SelectEmpty>No option found.</S.SelectEmpty>
                    )}
                </S.SelectDropdown>
            )}
        </S.SelectPicker>
    );
}
