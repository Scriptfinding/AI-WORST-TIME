import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Trigger = styled.div<{ $error?: boolean }>`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-height: 38px;
    padding: 6px 10px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme, $error }) => $error ? '#dc2626' : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover { border-color: ${({ theme, $error }) => $error ? '#dc2626' : theme.colors.border.light}; }
`;

export const Placeholder = styled.span`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Tag = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px 2px 8px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.elevated};
    color: ${({ theme }) => theme.colors.text.secondary};
    white-space: nowrap;

    button {
        display: flex;
        align-items: center;
        padding: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        transition: color ${({ theme }) => theme.transition.fast};
        &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
    }
`;

export const Dropdown = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.md};
    z-index: 20;
    overflow: hidden;
`;

export const Search = styled.input`
    width: 100%;
    padding: 8px 10px;
    font-size: 12px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
`;

export const List = styled.div`
    max-height: 180px;
    overflow-y: auto;
`;

export const Option = styled.label<{ $checked?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    font-size: 13px;
    cursor: pointer;
    color: ${({ theme, $checked }) => $checked ? theme.colors.text.primary : theme.colors.text.secondary};
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover { background: ${({ theme }) => theme.colors.bg.hover}; }

    input[type="checkbox"] {
        appearance: none;
        display: inline-grid;
        place-content: center;
        width: 14px;
        height: 14px;
        margin: 0;
        flex-shrink: 0;
        border: 1px solid ${({ theme }) => theme.colors.border.light};
        border-radius: ${({ theme }) => theme.radius.xs};
        background: ${({ theme }) => theme.colors.bg.primary};
        cursor: pointer;
        transition:
            background ${({ theme }) => theme.transition.fast},
            border-color ${({ theme }) => theme.transition.fast};

        &::before {
            content: '';
            width: 3px;
            height: 7px;
            margin-top: -1px;
            border: solid ${({ theme }) => theme.colors.white};
            border-width: 0 2px 2px 0;
            transform: rotate(45deg) scale(0);
            transition: transform ${({ theme }) => theme.transition.fast};
        }

        &:checked {
            background: ${({ theme }) => theme.colors.accent.primary};
            border-color: ${({ theme }) => theme.colors.accent.primary};
        }

        &:checked::before {
            transform: rotate(45deg) scale(1);
        }

        &:focus-visible {
            outline: 2px solid ${({ theme }) => theme.colors.border.focus};
            outline-offset: 2px;
        }
    }
`;

export const Empty = styled.div`
    padding: 16px 10px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
