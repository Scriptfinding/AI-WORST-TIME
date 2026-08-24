import styled, { css } from 'styled-components';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const variantStyles = {
    default: css`
        background: ${({ theme }) => theme.colors.bg.elevated};
        color: ${({ theme }) => theme.colors.text.secondary};
    `,
    success: css`
        background: ${({ theme }) => theme.colors.accent.successBg};
        color: ${({ theme }) => theme.colors.accent.success};
    `,
    warning: css`
        background: ${({ theme }) => theme.colors.accent.warningBg};
        color: ${({ theme }) => theme.colors.accent.warning};
    `,
    error: css`
        background: ${({ theme }) => theme.colors.accent.errorBg};
        color: ${({ theme }) => theme.colors.accent.error};
    `,
    info: css`
        background: ${({ theme }) => theme.colors.accent.infoBg};
        color: ${({ theme }) => theme.colors.accent.info};
    `,
};

export const StyledBadge = styled.span<{ $variant: BadgeVariant }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 9999px;
    white-space: nowrap;
    border: 1px solid ${({ theme, $variant }) => $variant === 'default' ? theme.colors.border.default : 'transparent'};
    ${({ $variant }) => variantStyles[$variant]}
`;

export const Dot = styled.span<{ $variant: BadgeVariant }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
`;

export const BadgeSpinner = styled.span`
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 1.5px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: badge-spin 0.6s linear infinite;
    flex-shrink: 0;

    @keyframes badge-spin {
        to { transform: rotate(360deg); }
    }
`;
