import styled, { css } from 'styled-components';

export const MobilePills = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        gap: 4px;
        margin-bottom: 16px;
        padding: 3px;
        background: ${({ theme }) => theme.colors.bg.secondary};
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        border-radius: ${({ theme }) => theme.radius.md};
    }
`;

export const MobilePill = styled.a<{ $active?: boolean }>`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 12px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary + '15' : 'transparent'};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.tertiary};

    &:hover {
        background: ${({ theme, $active }) => $active ? theme.colors.accent.primary + '22' : theme.colors.bg.hover};
        color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    }

    svg {
        width: 14px;
        height: 14px;
    }
`;

export const Breadcrumbs = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 16px;
    font-size: 13px;
`;

export const BreadcrumbItem = styled.a<{ $active?: boolean; $dragOver?: boolean }>`
    color: ${({ theme, $active }) =>
        $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    cursor: pointer;
    font-weight: ${({ $active }) => $active ? '500' : '400'};
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    ${({ $dragOver, theme }) =>
        $dragOver &&
        css`
            background: ${theme.colors.accent.primary}20;
            color: ${theme.colors.accent.primary};
            outline: 2px solid ${theme.colors.accent.primary};
            outline-offset: -1px;
        `}
`;

export const BreadcrumbSep = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;
