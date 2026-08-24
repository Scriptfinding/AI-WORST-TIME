import styled from 'styled-components';

export const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Pagination = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const PageButton = styled.button<{ $active?: boolean }>`
    padding: 6px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $active }) =>
        $active ? `${theme.colors.accent.primary}14` : 'transparent'};
    color: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    font-size: 12px;
    font-weight: ${({ $active }) => $active ? 600 : 400};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.3;
        cursor: default;
    }
`;
