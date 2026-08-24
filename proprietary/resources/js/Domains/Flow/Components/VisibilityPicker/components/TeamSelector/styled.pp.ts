import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Trigger = styled.button<{ $open: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 9px 12px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid
        ${({ theme, $open }) =>
            $open
                ? theme.colors.accent.success
                : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    text-align: left;

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.success};
    }

    ${({ $open, theme }) =>
        $open &&
        css`
            box-shadow: 0 0 0 1px ${theme.colors.accent.success};
        `}
`;

export const Panel = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 60;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    overflow: hidden;
    animation: teamDropFade 100ms ease;

    @keyframes teamDropFade {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

export const Search = styled.input`
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 180px;
    overflow-y: auto;
    padding: 6px;
`;

export const Item = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme, $active }) =>
        $active ? `${theme.colors.accent.success}12` : 'transparent'};
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Empty = styled.div`
    padding: 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
