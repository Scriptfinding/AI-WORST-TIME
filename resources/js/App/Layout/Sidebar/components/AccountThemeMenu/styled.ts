import styled, { css } from 'styled-components';

export const Footer = styled.div<{ $collapsed?: boolean }>`
    padding: 12px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    display: flex;
    flex-direction: column;
    gap: 8px;

    ${({ $collapsed }) =>
        $collapsed &&
        css`
            align-items: center;
            padding: 8px;
        `}
`;

export const Row = styled.div<{ $collapsed?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;

    ${({ $collapsed }) =>
        $collapsed &&
        css`
            flex-direction: column;
            justify-content: center;
        `}
`;

export const ProfileSummary = styled.a<{ $collapsed?: boolean }>`
    min-width: 0;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 4px;
    color: ${({ theme }) => theme.colors.text.primary};
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    text-decoration: none;
    transition: opacity ${({ theme }) => theme.transition.fast};

    &:hover {
        opacity: 0.78;
    }

    ${({ $collapsed }) =>
        $collapsed &&
        css`
            width: 28px;
            height: 28px;
            flex: none;
            justify-content: center;
            padding: 0;
            border-radius: 50%;
        `}
`;

export const UserDetails = styled.div`
    flex: 1;
    min-width: 0;
`;

export const UserName = styled.div`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const UserRole = styled.div`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-transform: capitalize;
`;

export const CogButton = styled.button<{ $active?: boolean }>`
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.tertiary)};
    background: ${({ $active, theme }) => ($active ? theme.colors.bg.hover : 'transparent')};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    svg {
        width: 16px;
        height: 16px;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Menu = styled.div<{ $collapsed?: boolean }>`
    position: absolute;
    right: ${({ $collapsed }) => ($collapsed ? 'auto' : '0')};
    left: ${({ $collapsed }) => ($collapsed ? '0' : 'auto')};
    bottom: calc(100% + 8px);
    z-index: 100;
    width: 200px;
    padding: 5px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
    width: 100%;
    min-height: 34px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 7px 9px;
    color: ${({ $danger, theme }) => ($danger ? theme.colors.accent.error : theme.colors.text.secondary)};
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 12px;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    > svg {
        width: 15px;
        height: 15px;
        flex-shrink: 0;
    }

    &:hover {
        color: ${({ $danger, theme }) => ($danger ? theme.colors.accent.error : theme.colors.text.primary)};
        background: ${({ $danger, theme }) =>
            $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
    }
`;

export const Divider = styled.div`
    height: 1px;
    margin: 5px 4px;
    background: ${({ theme }) => theme.colors.border.default};
`;

export const Check = styled.span`
    display: flex;
    align-items: center;
    margin-left: auto;
    color: ${({ theme }) => theme.colors.accent.primary};

    svg {
        width: 14px;
        height: 14px;
    }
`;
