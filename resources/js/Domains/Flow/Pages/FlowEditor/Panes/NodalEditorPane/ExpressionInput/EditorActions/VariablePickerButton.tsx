import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';
import QuickCreateVariableModal from '@/Domains/Variable/Pages/VariableFormModal/QuickCreateVariableModal';
import {
    fetchVariableSuggestions,
    invalidateVariableCache,
    type VariableSuggestion,
} from '@/Domains/Flow/Pages/FlowEditor/utils/variableSuggestions';
import { useAnchoredDropdownPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import {
    useNodeValidationResourceRevision,
    useRefreshNodeValidationResources,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/NodeValidationContext';
import { dropdownStyle } from '../utils';
import * as S from './styled';

interface VariablePickerButtonProps {
    disabled?: boolean;
    onBeforeOpen: () => void;
    onSelect: (key: string) => void;
}

export default function VariablePickerButton({
    disabled,
    onBeforeOpen,
    onSelect,
}: VariablePickerButtonProps) {
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [open, setOpen] = useState(false);
    const [quickCreateOpen, setQuickCreateOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<VariableSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadFailed, setLoadFailed] = useState(false);
    const resourceRevision = useNodeValidationResourceRevision();
    const refreshResources = useRefreshNodeValidationResources();
    const { dropdownRect } = useAnchoredDropdownPosition(triggerRef, open, {
        maxHeight: 260,
        minHeight: 180,
        clampLeft: true,
    });
    const filteredSuggestions = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return suggestions;
        return suggestions.filter(variable => (
            variable.key.toLowerCase().includes(normalized)
            || variable.type.toLowerCase().includes(normalized)
            || variable.scope?.toLowerCase().includes(normalized)
        ));
    }, [query, suggestions]);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoading(true);
        setLoadFailed(false);
        fetchVariableSuggestions(resourceRevision > 0)
            .then(variables => {
                if (!cancelled) setSuggestions(variables);
            })
            .catch(() => {
                if (!cancelled) setLoadFailed(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, resourceRevision]);

    useEffect(() => {
        if (!open || quickCreateOpen) return;
        requestAnimationFrame(() => searchRef.current?.focus());
    }, [open, quickCreateOpen]);

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    useClickOutside({
        refs: [triggerRef, panelRef],
        onOutside: close,
        enabled: open && !quickCreateOpen,
        eventType: 'pointerdown',
        capture: true,
    });

    const selectVariable = (id: string) => {
        close();
        onSelect(id);
    };

    const closeQuickCreate = () => {
        setQuickCreateOpen(false);
        requestAnimationFrame(() => searchRef.current?.focus());
    };

    const handleCreated = (variable: VariableSuggestion) => {
        invalidateVariableCache();
        void fetchVariableSuggestions(true).then(variables => {
            setSuggestions(variables);
            refreshResources();
            setQuickCreateOpen(false);
            selectVariable(String(variable.id));
        });
    };

    const refresh = () => {
        setLoading(true);
        setLoadFailed(false);
        void fetchVariableSuggestions(true)
            .then(variables => {
                setSuggestions(variables);
                refreshResources();
            })
            .catch(() => setLoadFailed(true))
            .finally(() => {
                setLoading(false);
                requestAnimationFrame(() => searchRef.current?.focus());
            });
    };

    const panelStyle = dropdownRect
        ? {
            ...dropdownStyle(dropdownRect),
            left: Math.min(dropdownRect.left, Math.max(8, window.innerWidth - 288)),
            width: 280,
        }
        : undefined;

    return (
        <>
            <S.ExpressionExpandButton
                ref={triggerRef}
                type="button"
                title="Insert variable"
                disabled={disabled}
                aria-expanded={open}
                onMouseDown={event => {
                    event.preventDefault();
                    if (!open) onBeforeOpen();
                }}
                onClick={() => {
                    if (open) {
                        close();
                        return;
                    }
                    setQuery('');
                    setOpen(true);
                }}
            >
                <Icon icon="lucide:braces" width={12} height={12} />
            </S.ExpressionExpandButton>
            {open && dropdownRect && panelStyle && createPortal(
                <S.VariableDropdown
                    ref={panelRef}
                    data-node-field-dropdown="true"
                    style={panelStyle}
                    onKeyDown={event => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            event.stopPropagation();
                            close();
                            triggerRef.current?.focus();
                        }
                    }}
                >
                    <S.VariableSearchRow>
                        <S.VariableSearch
                            ref={searchRef}
                            value={query}
                            placeholder="Search variables..."
                            onChange={event => setQuery(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Enter' && filteredSuggestions[0]) {
                                    event.preventDefault();
                                    selectVariable(String(filteredSuggestions[0].id));
                                }
                            }}
                        />
                        <S.VariableRefreshButton
                            type="button"
                            title="Refresh variables"
                            aria-label="Refresh variables"
                            disabled={loading}
                            onMouseDown={event => event.preventDefault()}
                            onClick={refresh}
                        >
                            <Icon icon="lucide:refresh-cw" width={13} height={13} />
                        </S.VariableRefreshButton>
                    </S.VariableSearchRow>
                    <S.VariableCreateButton
                        type="button"
                        onClick={() => setQuickCreateOpen(true)}
                    >
                        <Icon icon="lucide:plus" width={13} height={13} />
                        Add variable
                    </S.VariableCreateButton>
                    <S.VariableList>
                        {loading ? (
                            <S.VariableStatus>Loading variables...</S.VariableStatus>
                        ) : loadFailed ? (
                            <S.VariableStatus>Unable to load variables.</S.VariableStatus>
                        ) : filteredSuggestions.length === 0 ? (
                            <S.VariableStatus>No variable found.</S.VariableStatus>
                        ) : filteredSuggestions.map(variable => (
                            <S.VariableItem
                                key={variable.id}
                                type="button"
                                onClick={() => selectVariable(String(variable.id))}
                            >
                                <strong>{variable.key}</strong>
                                <span>{variable.type}</span>
                            </S.VariableItem>
                        ))}
                    </S.VariableList>
                </S.VariableDropdown>,
                document.body,
            )}
            <QuickCreateVariableModal
                isOpen={quickCreateOpen}
                onClose={closeQuickCreate}
                onCreated={handleCreated}
            />
        </>
    );
}
