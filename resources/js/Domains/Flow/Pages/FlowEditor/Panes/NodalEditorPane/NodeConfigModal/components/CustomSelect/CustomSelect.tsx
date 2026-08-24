import {
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type FocusEvent,
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useActiveOptionScroll } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useActiveOptionScroll';
import { useAnchoredDropdownPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import * as S from './styled';

export interface CustomSelectOption<T extends Id = string> {
    value: T;
    label: string;
    detail?: string;
    detailIcon?: string;
    icon?: string;
    iconColor?: string;
}

export interface CustomSelectAction<T extends Id = string> {
    label: ReactNode;
    onAction: () => Promise<T | null>;
}

interface CustomSelectProps<T extends Id> {
    value: T;
    options: CustomSelectOption<T>[];
    placeholder?: string;
    ariaLabel?: string;
    disabled?: boolean;
    compact?: boolean;
    compactHeight?: number;
    invalid?: boolean;
    showOptionValue?: boolean;
    searchThreshold?: number;
    headerSlot?: ReactNode;
    actionSlot?: CustomSelectAction<T>;
    onRefresh?: () => void | Promise<void>;
    loading?: boolean;
    refreshing?: boolean;
    dropdownMinWidth?: number;
    onClear?: () => void;
    onChange: (value: T) => void;
}

const SELECT_DROPDOWN_MAX_HEIGHT = 260;
const SELECT_DROPDOWN_MIN_WIDTH = 240;
const SELECT_DROPDOWN_GAP = 5;

export default function CustomSelect<T extends Id>({
    value,
    options,
    placeholder = 'Select a value...',
    ariaLabel,
    disabled,
    compact,
    compactHeight,
    invalid,
    showOptionValue = true,
    searchThreshold = 8,
    headerSlot,
    actionSlot,
    onRefresh,
    loading,
    refreshing,
    dropdownMinWidth,
    onClear,
    onChange,
}: CustomSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const actionRunningRef = useRef(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const { dropdownRect, updateDropdownPosition } = useAnchoredDropdownPosition(
        triggerRef,
        open,
        {
            maxHeight: SELECT_DROPDOWN_MAX_HEIGHT,
            gap: SELECT_DROPDOWN_GAP,
            clampLeft: true,
            minWidth: dropdownMinWidth ?? SELECT_DROPDOWN_MIN_WIDTH,
            viewportPadding: 12,
        },
    );
    const selectedOption = options.find(option => option.value === value);
    const showSearch = options.length >= searchThreshold;
    const refreshInActionRow = Boolean(actionSlot && onRefresh && !showSearch && !headerSlot);
    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return options;

        return options.filter(option => `${option.label} ${option.value} ${option.detail ?? ''}`.toLowerCase().includes(normalizedQuery));
    }, [options, query]);
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

    const openSelect = () => {
        if (disabled || loading) return;

        updateDropdownPosition();
        setOpen(true);
        setActiveIndex(Math.max(0, filteredOptions.findIndex(option => option.value === value)));
        if (showSearch) {
            window.requestAnimationFrame(() => searchInputRef.current?.focus());
        }
    };

    const selectOption = (option: CustomSelectOption<T> | undefined) => {
        if (!option) return;
        onChange(option.value);
        close();
    };

    const restoreDropdownFocus = () => {
        window.requestAnimationFrame(() => {
            if (showSearch) {
                searchInputRef.current?.focus();
            } else {
                triggerRef.current?.focus();
            }
        });
    };

    const handleAction = async () => {
        if (!actionSlot || actionRunningRef.current) return;

        actionRunningRef.current = true;
        setActionLoading(true);
        try {
            const createdValue = await actionSlot.onAction();
            if (createdValue) {
                onChange(createdValue);
                close();
                return;
            }

            restoreDropdownFocus();
        } finally {
            actionRunningRef.current = false;
            setActionLoading(false);
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (disabled || loading) return;

        if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            openSelect();
            return;
        }

        if (!open) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(current => Math.min(current + 1, filteredOptions.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(current => Math.max(current - 1, 0));
        } else if (event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            setActiveIndex(Math.max(0, filteredOptions.length - 1));
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectOption(filteredOptions[activeIndex] ?? filteredOptions[0]);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    };

    return (
        <S.SelectRoot
            $compact={compact}
            onBlurCapture={(event: FocusEvent<HTMLDivElement>) => {
                if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                if (actionRunningRef.current) return;
                close();
            }}
        >
            <S.SelectTrigger
                type="button"
                ref={triggerRef}
                $open={open}
                $compact={compact}
                $compactHeight={compactHeight}
                $hasValue={Boolean(selectedOption)}
                $invalid={invalid}
                aria-label={ariaLabel}
                aria-invalid={invalid}
                aria-busy={loading}
                disabled={disabled}
                onKeyDown={handleKeyDown}
                onClick={() => {
                    if (disabled || loading) return;
                    setOpen(current => {
                        const nextOpen = !current;
                        if (nextOpen) updateDropdownPosition();
                        if (nextOpen && showSearch) {
                            window.requestAnimationFrame(() => searchInputRef.current?.focus());
                        }
                        if (!nextOpen) setQuery('');
                        return nextOpen;
                    });
                }}
            >
                <S.SelectValue>
                    {loading ? (
                        <>
                            <S.SelectLoadingIcon>
                                <Icon icon="lucide:loader-circle" width={15} height={15} />
                            </S.SelectLoadingIcon>
                            <S.SelectValueLabel>Loading...</S.SelectValueLabel>
                        </>
                    ) : selectedOption?.icon ? (
                        <S.SelectIconSlot>
                            <Icon icon={selectedOption.icon} width={15} height={15} style={{ color: selectedOption.iconColor }} />
                        </S.SelectIconSlot>
                    ) : null}
                    {!loading && (
                        <S.SelectValueLabel>{selectedOption?.label ?? placeholder}</S.SelectValueLabel>
                    )}
                </S.SelectValue>
                <Icon icon="lucide:chevron-down" width={compact ? 12 : 14} height={compact ? 12 : 14} />
            </S.SelectTrigger>
            {open && !disabled && !actionLoading && dropdownRect && (
                <S.SelectDropdown
                    $compact={compact}
                    style={{
                        top: dropdownRect.top,
                        left: dropdownRect.left,
                        right: 'auto',
                        width: dropdownRect.width,
                        maxHeight: dropdownRect.maxHeight,
                        transform: dropdownRect.placement === 'above' ? 'translateY(-100%)' : undefined,
                    }}
                >
                    {(showSearch || headerSlot || (onRefresh && !refreshInActionRow)) && (
                        <S.SelectDropdownHeader>
                            {showSearch && (
                                <S.SelectSearchInput
                                    ref={searchInputRef}
                                    value={query}
                                    placeholder="Search option..."
                                    onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            )}
                            {headerSlot}
                            {onRefresh && (
                                <S.SelectHeaderButton
                                    type="button"
                                    title="Refresh options"
                                    aria-label="Refresh options"
                                    disabled={refreshing}
                                    $loading={refreshing}
                                    onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
                                    onClick={() => void onRefresh()}
                                >
                                    <Icon icon="lucide:refresh-cw" width={13} height={13} />
                                </S.SelectHeaderButton>
                            )}
                        </S.SelectDropdownHeader>
                    )}
                    {(actionSlot || (onClear && value)) && (
                        <S.SelectActionRow>
                            {actionSlot && (
                                <S.SelectAction
                                    type="button"
                                    disabled={actionLoading}
                                    onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
                                    onClick={() => void handleAction()}
                                >
                                    {actionLoading && <Icon icon="lucide:loader-circle" width={13} height={13} />}
                                    {actionSlot.label}
                                </S.SelectAction>
                            )}
                            {refreshInActionRow && (
                                <S.SelectHeaderButton
                                    type="button"
                                    title="Refresh options"
                                    aria-label="Refresh options"
                                    disabled={refreshing}
                                    $loading={refreshing}
                                    onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
                                    onClick={() => void onRefresh?.()}
                                >
                                    <Icon icon="lucide:refresh-cw" width={13} height={13} />
                                </S.SelectHeaderButton>
                            )}
                            {onClear && value && (
                                <S.SelectClearButton
                                    type="button"
                                    title="Clear selection"
                                    aria-label="Clear selection"
                                    onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
                                    onClick={() => {
                                        onClear();
                                        close();
                                    }}
                                >
                                    <Icon icon="lucide:trash-2" width={13} height={13} />
                                </S.SelectClearButton>
                            )}
                        </S.SelectActionRow>
                    )}
                    <S.SelectOptions>
                        {refreshing ? (
                            <S.SelectLoading>
                                <Icon icon="lucide:loader-circle" width={16} height={16} />
                            </S.SelectLoading>
                        ) : filteredOptions.length > 0 ? filteredOptions.map((option, optionIndex) => (
                            <S.SelectOption
                                key={option.value}
                                ref={(element: HTMLButtonElement | null) => {
                                    optionRefs.current[optionIndex] = element;
                                }}
                                type="button"
                                $active={optionIndex === activeIndex}
                                $selected={option.value === value}
                                aria-selected={option.value === value}
                                onMouseDown={(event: MouseEvent<HTMLButtonElement>) => event.preventDefault()}
                                onMouseEnter={() => setActiveIndex(optionIndex)}
                                onClick={() => {
                                    selectOption(option);
                                }}
                            >
                                <S.SelectOptionMain>
                                    {option.icon && (
                                        <S.SelectIconSlot>
                                            <Icon icon={option.icon} width={15} height={15} style={{ color: option.iconColor }} />
                                        </S.SelectIconSlot>
                                    )}
                                    <strong>{option.label}</strong>
                                </S.SelectOptionMain>
                                {option.detail
                                    ? (
                                        <S.SelectOptionDetail>
                                            {option.detailIcon && (
                                                <Icon icon={option.detailIcon} width={11} height={11} />
                                            )}
                                            {option.detail}
                                        </S.SelectOptionDetail>
                                    )
                                    : showOptionValue && option.value !== option.label && <span>{option.value}</span>}
                                {option.value === value && (
                                    <S.SelectCheck>
                                        <Icon icon="lucide:check" width={13} height={13} />
                                    </S.SelectCheck>
                                )}
                            </S.SelectOption>
                        )) : (
                            <S.SelectEmpty>No option found.</S.SelectEmpty>
                        )}
                    </S.SelectOptions>
                </S.SelectDropdown>
            )}
        </S.SelectRoot>
    );
}
