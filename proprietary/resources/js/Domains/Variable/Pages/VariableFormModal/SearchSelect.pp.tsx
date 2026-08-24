import React, { useState, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useSearchablePopover } from '@/Shared/Hooks/useSearchablePopover';
import * as S from '@/Domains/Variable/Pages/VariableFormModal/shared.styled';

interface SearchSelectOption<T extends Id> { value: T; label: string }

interface SearchSelectProps<T extends Id> {
    label: string;
    value: T;
    onChange: (value: T) => void;
    options: SearchSelectOption<T>[];
    loading?: boolean;
    loadingLabel?: string;
    placeholder?: string;
}

export default function SearchSelect<T extends Id>({ label, value, onChange, options, loading, loadingLabel, placeholder }: SearchSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useSearchablePopover({
        open,
        onDismiss: () => setOpen(false),
        reset: () => setSearch(''),
        focusRef: searchRef,
        containerRefs: [wrapperRef],
        eventType: 'mousedown',
    });

    const selectedLabel = options.find(o => o.value === value)?.label;
    const filtered = options.filter(o => !search || o.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <S.ComboboxWrapper ref={wrapperRef}>
            <S.ComboboxLabel>{label}</S.ComboboxLabel>
            <S.ComboboxTrigger
                type="button"
                $open={open}
                $hasValue={!!value}
                onClick={() => { setOpen(o => !o); setSearch(''); }}
            >
                {loading ? (loadingLabel || 'Loading...') : (selectedLabel || placeholder || `Select ${label.toLowerCase()}`)}
                <Icon icon="lucide:chevron-down" width={14} />
            </S.ComboboxTrigger>
            {open && (
                <S.ComboboxPanel>
                    <S.DropdownSearchWrapper>
                        <S.DropdownSearchInput
                            ref={searchRef}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${label.toLowerCase()}...`}
                        />
                    </S.DropdownSearchWrapper>
                    <S.DropdownList>
                        {loading ? (
                            <S.DropdownEmpty>{loadingLabel || 'Loading...'}</S.DropdownEmpty>
                        ) : filtered.length === 0 ? (
                            <S.DropdownEmpty>No results found</S.DropdownEmpty>
                        ) : filtered.map(o => (
                            <S.DropdownItem
                                key={o.value}
                                type="button"
                                $active={value === o.value}
                                onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                            >
                                {o.label}
                            </S.DropdownItem>
                        ))}
                    </S.DropdownList>
                </S.ComboboxPanel>
            )}
        </S.ComboboxWrapper>
    );
}
