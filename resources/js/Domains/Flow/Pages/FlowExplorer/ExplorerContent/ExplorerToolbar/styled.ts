import styled from 'styled-components';

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    gap: 12px;

    @media (max-width: 1110px) {
        align-items: stretch;
        flex-direction: column;
    }
`;

export const ToolbarLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
`;

export const SearchForm = styled.form`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    width: 100%;

    @media (max-width: 1110px) {
        flex-wrap: wrap;
    }
`;

export const SearchScopeSwitch = styled.button<{ $active?: boolean }>`
    display: inline-grid;
    grid-template-columns: 1fr 30px 1fr;
    align-items: center;
    gap: 4px;
    min-width: 210px;
    height: 36px;
    padding: 4px;
    border: 1px solid ${({ theme, $active }) => $active ? theme.colors.border.light : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.tertiary : theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    @media (max-width: 1110px) {
        flex: 1 1 180px;
        min-width: 0;
    }
`;

export const SearchScopeOption = styled.span<{ $active?: boolean }>`
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    color: ${({ theme, $active }) => $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.primary : 'transparent'};
    box-shadow: ${({ theme, $active }) => $active ? theme.shadow.sm : 'none'};
    transition: all ${({ theme }) => theme.transition.fast};
`;

export const SearchScopeKnob = styled.div`
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const SearchInput = styled.input`
    width: 100%;
    padding: 8px 12px 8px 36px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

export const SearchWrapper = styled.div`
    position: relative;
    flex: 1 1 180px;
    min-width: 0;

    svg {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const FilterResetBanner = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 12px;
    margin: -8px 0 20px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}33;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}10;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}18;
        border-color: ${({ theme }) => theme.colors.accent.primary}66;
    }

    svg {
        flex-shrink: 0;
    }
`;

export const ToolbarRight = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const SelectionButtonLabel = styled.span`
    @media (max-width: 640px) {
        display: none;
    }
`;

export const ViewToggle = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid ${({ theme, $active }) =>
        $active
            ? theme.mode === 'light' ? theme.colors.brand : theme.colors.text.tertiary
            : theme.colors.border.default};
    background: ${({ theme, $active }) =>
        $active
            ? theme.mode === 'light' ? `${theme.colors.brand}18` : theme.colors.bg.active
            : theme.colors.bg.secondary};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme, $active }) =>
        $active && theme.mode === 'light' ? theme.colors.brand : $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        border-color: ${({ theme }) => theme.colors.border.light};
    }

    svg {
        width: 16px;
        height: 16px;
    }
`;
