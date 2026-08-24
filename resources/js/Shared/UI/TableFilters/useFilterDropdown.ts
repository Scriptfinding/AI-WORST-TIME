import { useEffect, useRef, useState } from 'react';

// Controls a searchable filter dropdown, including focus and outside-click cleanup.
export function useFilterDropdown() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    useEffect(() => {
        if (open) searchInputRef.current?.focus();
    }, [open]);

    const close = () => {
        setOpen(false);
        setSearch('');
    };

    return {
        close,
        dropdownRef,
        open,
        search,
        searchInputRef,
        setOpen,
        setSearch,
    };
}
