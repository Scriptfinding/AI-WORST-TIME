import styled from 'styled-components';

export const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    @media (max-width: 768px) {
        gap: 6px;
    }

    button {
        display: flex;
        align-items: center;
        gap: 6px;

        > svg {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
        }
    }

    > span {
        align-self: stretch;
    }
`;

export const BtnLabel = styled.span`
    @media (max-width: 768px) {
        display: none;
    }
`;

export const ShareToggle = styled.button<{ $color?: string }>`
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    color: ${({ $color, theme }) => $color || theme.colors.text.tertiary};
    background: ${({ $color }) => $color ? $color + '14' : 'transparent'};
    border: 1px solid ${({ $color, theme }) => $color ? $color + '40' : theme.colors.border.default};

    svg {
        flex-shrink: 0;
    }

    &:hover {
        background: ${({ $color }) => $color ? $color + '22' : 'transparent'};
        border-color: ${({ $color, theme }) => $color ? $color + '60' : theme.colors.border.focus};
    }

    @media (max-width: 768px) {
        display: none !important;
    }
`;

export const DesktopRunBtn = styled.div`
    @media (max-width: 768px) {
        display: none;
    }
`;

export const OverflowWrap = styled.div`
    display: none;
    position: relative;

    @media (max-width: 768px) {
        display: flex;
    }
`;

export const OverflowBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.focus};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const OverflowMenu = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 200;
    min-width: 160px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    padding: 4px;
`;

export const OverflowMenuItem = styled.button<{ $color?: string }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    color: ${({ $color, theme }) => $color || theme.colors.text.primary};
    background: transparent;
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
    }
`;
