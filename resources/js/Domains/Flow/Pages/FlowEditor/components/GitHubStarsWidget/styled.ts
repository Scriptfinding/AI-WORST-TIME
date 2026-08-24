import styled from 'styled-components';

export const DesktopWidget = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;

    @media (max-width: 768px) {
        display: none;
    }
`;

export const Divider = styled.span`
    width: 1px;
    height: 24px;
    background: ${({ theme }) => theme.colors.border.default};
`;

export const Widget = styled.div`
    position: relative;
    display: flex;
    height: 30px;

    &:hover button,
    &:focus-within button {
        opacity: 1;
        pointer-events: auto;
        transform: scale(1);
    }
`;

const Link = styled.a`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    transition:
        color ${({ theme }) => theme.transition.fast},
        background ${({ theme }) => theme.transition.fast},
        border-color ${({ theme }) => theme.transition.fast};

    &:focus-visible {
        position: relative;
        z-index: 1;
        outline: 2px solid ${({ theme }) => theme.colors.border.focus};
        outline-offset: 1px;
    }
`;

export const StarLink = styled(Link)`
    gap: 6px;
    padding: 0 10px;
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const CountLink = styled(Link)`
    min-width: 54px;
    padding: 0 9px;
    margin-left: -1px;
    border-radius: 0 ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0;
    font-variant-numeric: tabular-nums;

    &[hidden] {
        display: none;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const DismissButton = styled.button`
    position: absolute;
    top: -7px;
    right: -7px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transform: scale(0.8);
    transition:
        opacity ${({ theme }) => theme.transition.fast},
        color ${({ theme }) => theme.transition.fast},
        transform ${({ theme }) => theme.transition.fast};

    &:hover,
    &:focus-visible {
        color: ${({ theme }) => theme.colors.accent.error};
        outline: none;
    }
`;
