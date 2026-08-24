import styled from 'styled-components';

export const FilterBar = styled.div`
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    min-height: 42px;
    box-sizing: border-box;
`;

export const FilterResetBanner = styled.button`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: calc(100% - 20px);
    margin: 8px 10px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}33;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}10;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
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

export const QuickSearch = styled.input`
    flex: 1;
    min-width: 0;
    padding: 5px 8px;
    font-size: 11px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const InactiveToggleButton = styled.button<{ $active?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid ${({ theme, $active }) => $active ? `${theme.colors.accent.primary}66` : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $active }) => $active ? `${theme.colors.accent.primary}12` : theme.colors.bg.secondary};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary}66;
        color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const ScopeDropdownWrapper = styled.div`
    position: relative;
`;

export const ScopeDropdownTrigger = styled.button<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: ${({ $open }) => $open ? '100%' : 'auto'};
    padding: ${({ $open }) => $open ? '5px 8px' : '5px 6px'};
    font-size: 11px;
    text-align: left;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.border.focus};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const ScopeDropdownPanel = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 4px;
    min-width: 180px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    overflow: hidden;
`;

export const ScopeDropdownSearch = styled.input`
    width: 100%;
    padding: 6px 8px;
    font-size: 11px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const ScopeDropdownList = styled.div`
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
`;

export const ScopeDropdownItem = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 5px 8px;
    font-size: 12px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.primary + '14' : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.primary};
    font-weight: ${({ $active }) => $active ? 600 : 400};
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const ScopeDropdownSeparator = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.colors.border.default};
    margin: 4px 0;
`;

export const ScopeDropdownSectionLabel = styled.div`
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 3px 8px 1px;
`;

export const ScopeDropdownEmpty = styled.div`
    padding: 10px 8px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
