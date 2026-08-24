import styled from 'styled-components';

export const Panel = styled.div<{
    $top: number;
    $left: number;
    $width: number;
    $maxHeight: number;
    $placement: 'above' | 'below';
}>`
    position: fixed;
    top: ${({ $top }) => $top}px;
    left: ${({ $left }) => $left}px;
    width: ${({ $width }) => $width}px;
    max-height: ${({ $maxHeight }) => $maxHeight}px;
    transform: ${({ $placement }) => $placement === 'above' ? 'translateY(-100%)' : 'none'};
    z-index: 10001;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const Header = styled.div`
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 10px 8px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.tertiary};
`;

export const Breadcrumbs = styled.nav`
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    padding-top: 6px;
    padding-bottom: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-gutter: stable;
    scrollbar-width: thin;

    > span {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    button {
        flex: 0 0 auto;
        padding: 3px 5px;
        border: 0;
        border-radius: ${({ theme }) => theme.radius.sm};
        color: ${({ theme }) => theme.colors.text.tertiary};
        background: transparent;
        font-size: 12px;
        font-weight: 550;
        white-space: nowrap;
        cursor: pointer;

        &:hover {
            color: ${({ theme }) => theme.colors.text.primary};
            background: ${({ theme }) => theme.colors.bg.hover};
        }

        &[aria-current='page'] {
            color: ${({ theme }) => theme.colors.text.primary};
            font-weight: 700;
        }
    }

    svg {
        flex: 0 0 auto;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const Type = styled.span`
    flex: 0 0 auto;
    padding: 2px 5px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.primary};
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
`;

export const Body = styled.div`
    min-height: 0;
    overflow: auto;
    padding: 12px;
`;

export const CloseButton = styled.button`
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
