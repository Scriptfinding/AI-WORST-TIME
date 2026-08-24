import styled, { css } from 'styled-components';

export const Page = styled.div`
    max-width: 900px;
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
`;

export const HeaderLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const BackLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-decoration: none;
    cursor: pointer;
    transition: color ${({ theme }) => theme.transition.fast};
    &:hover { color: ${({ theme }) => theme.colors.text.secondary}; }
`;

export const Title = styled.h1`
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
`;

export const StatusBadge = styled.span<{ $variant: 'success' | 'warning' | 'default' }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.radius.full};

    ${({ $variant, theme }) => {
        if ($variant === 'success') return css`
            background: ${theme.colors.accent.successBg};
            color: ${theme.colors.accent.success};
        `;
        if ($variant === 'warning') return css`
            background: ${theme.colors.accent.warningBg};
            color: ${theme.colors.accent.warning};
        `;
        return css`
            background: ${theme.colors.accent.defaultBg};
            color: ${theme.colors.accent.default};
        `;
    }}
`;
