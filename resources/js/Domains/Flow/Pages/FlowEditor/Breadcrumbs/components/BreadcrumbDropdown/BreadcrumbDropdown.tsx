import type { ChangeEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface BreadcrumbDropdownProps {
    children: ReactNode;
    dropdownRef: RefObject<HTMLDivElement | null>;
    open: boolean;
    position: { top: number; left: number };
    search: string;
    searchPlaceholder: string;
    onSearchChange: (value: string) => void;
}

export default function BreadcrumbDropdown({
    children,
    dropdownRef,
    open,
    position,
    search,
    searchPlaceholder,
    onSearchChange,
}: BreadcrumbDropdownProps) {
    if (!open) return null;

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        onSearchChange(event.target.value);
    };

    return createPortal(
        <S.Dropdown ref={dropdownRef} style={{ top: position.top, left: position.left }}>
            <S.SearchWrapper>
                <Icon icon="lucide:search" width={13} height={13} />
                <S.SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                    autoFocus
                />
            </S.SearchWrapper>
            {children}
        </S.Dropdown>,
        document.body,
    );
}
