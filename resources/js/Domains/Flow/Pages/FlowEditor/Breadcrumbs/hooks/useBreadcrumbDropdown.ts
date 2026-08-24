import { useCallback, useEffect, useRef, useState } from 'react';

// Manages breadcrumb dropdown visibility and closes it after outside interactions.
export default function useBreadcrumbDropdown() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const anchorRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const close = useCallback(() => setOpen(false), []);
    const toggle = useCallback(() => setOpen(current => !current), []);

    useEffect(() => {
        if (!open) {
            setSearch('');
            return;
        }

        const rect = anchorRef.current?.getBoundingClientRect();
        if (rect) {
            setPosition({ top: rect.bottom + 4, left: rect.left });
        }

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (anchorRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
                return;
            }

            close();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [close, open]);

    return {
        anchorRef,
        close,
        dropdownRef,
        open,
        position,
        search,
        setSearch,
        toggle,
    };
}
