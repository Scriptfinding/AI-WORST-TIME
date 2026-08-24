import styled, { css } from 'styled-components';

export const Divider = styled.div`
    height: 1px;
    margin: 6px 12px;
    background: ${({ theme }) => theme.colors.border.light};
`;

export const Row = styled.a<{ $active: boolean; $disabled: boolean }>`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px 5px 8px;
    cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
    font-size: 13px;
    color: ${({ theme, $disabled }) =>
        $disabled ? theme.colors.text.tertiary : theme.colors.text.secondary};
    opacity: ${({ $disabled }) => $disabled ? 0.55 : 1};
    text-decoration: none;
    user-select: none;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover:not([aria-disabled='true']) {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    ${({ $active, theme }) => $active && css`
        background: ${theme.mode === 'light' ? theme.colors.bg.tertiary : theme.colors.bg.active};
        color: ${theme.colors.text.primary};
        font-weight: 500;

        &:hover {
            background: ${theme.mode === 'light' ? theme.colors.bg.tertiary : theme.colors.bg.active};
        }
    `}
`;

export const Chevron = styled.span<{ $visible: boolean; $expanded: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border-radius: 3px;
    visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    svg {
        width: 12px;
        height: 12px;
        transition: transform 0.15s ease;
        transform: ${({ $expanded }) => ($expanded ? 'rotate(90deg)' : 'rotate(0deg)')};
    }
`;

export const IconSlot = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 15px;
    height: 15px;
    color: ${({ theme }) => theme.colors.accent.info};

    svg {
        width: 15px;
        height: 15px;
    }
`;

export const Label = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
`;
