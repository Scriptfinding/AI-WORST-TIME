import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    position: relative;
`;

export const Label = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Trigger = styled.div<{ $open?: boolean; $disabled?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 38px;
    padding: 0 11px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    text-align: left;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme, $disabled }) => $disabled ? theme.colors.border.default : theme.colors.border.light};
    }

    ${({ $disabled, theme }) => $disabled && `
        color: ${theme.colors.text.secondary};
        background: ${theme.colors.bg.tertiary};
    `}

    > svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        transition: transform ${({ theme }) => theme.transition.fast};
        transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
    }
`;

export const TriggerButton = styled.button`
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
    align-self: stretch;
    padding: 0;
    font: inherit;
    text-align: left;
    color: inherit;
    background: none;
    border: none;
    cursor: inherit;

    &:focus { outline: none; }
`;

export const TriggerContent = styled.span`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Placeholder = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Dropdown = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    min-width: 100%;
    width: max-content;
    max-width: calc(100vw - 24px);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 5px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    overflow: hidden;
`;

export const DropdownHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
`;

export const Search = styled.input`
    min-width: 220px;
    flex: 1;
    width: 100%;
    padding: 8px 9px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
`;

export const RefreshButton = styled.button<{ $loading?: boolean }>`
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    svg {
        animation: ${({ $loading }) => ($loading ? spin : 'none')} 0.8s linear infinite;
    }

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: default;
        opacity: 0.65;
    }
`;

export const List = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 200px;
    overflow-y: auto;
`;

export const Item = styled.li<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.tertiary : 'transparent'};
    &:hover { background: ${({ theme }) => theme.colors.bg.tertiary}; }
`;

export const ItemEmail = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-left: auto;
    flex-shrink: 0;
`;

export const Empty = styled.li`
    padding: 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;

export const Loader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;

    svg {
        color: ${({ theme }) => theme.colors.text.tertiary};
        animation: ${spin} 0.8s linear infinite;
    }
`;

export const ClearBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background: none;
    border: none;
    border-radius: ${({ theme }) => theme.radius.xs};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    flex-shrink: 0;
    transition: color ${({ theme }) => theme.transition.fast};
    &:hover { color: ${({ theme }) => theme.colors.accent.error}; }
    &:disabled { cursor: not-allowed; }
`;
