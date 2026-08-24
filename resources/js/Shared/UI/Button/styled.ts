import styled, { css } from 'styled-components';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'info';
type Size = 'sm' | 'md' | 'lg';

const variantStyles = {
    primary: css`
        background: ${({ theme }) => theme.colors.brand};
        color: white;
        &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.brandHover}; }
    `,
    secondary: css`
        background: ${({ theme }) => theme.colors.bg.elevated};
        color: ${({ theme }) => theme.colors.text.primary};
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.bg.hover}; }
    `,
    ghost: css`
        background: transparent;
        color: ${({ theme }) => theme.colors.text.secondary};
        &:hover:not(:disabled) {
            background: ${({ theme }) => theme.colors.bg.hover};
            color: ${({ theme }) => theme.colors.text.primary};
        }
    `,
    danger: css`
        background: ${({ theme }) => theme.colors.accent.error};
        color: white;
        &:hover:not(:disabled) { opacity: 0.9; }
    `,
    warning: css`
        background: ${({ theme }) => theme.colors.accent.warning};
        color: white;
        &:hover:not(:disabled) { opacity: 0.9; }
    `,
    info: css`
        background: ${({ theme }) => theme.colors.accent.info};
        color: white;
        &:hover:not(:disabled) { opacity: 0.9; }
    `,
};

const sizeStyles = {
    sm: css`padding: 6px 12px; font-size: 12px;`,
    md: css`padding: 8px 16px; font-size: 13px;`,
    lg: css`padding: 10px 20px; font-size: 14px;`,
};

export const StyledButton = styled.button<{ $variant: Variant; $size: Size; $fullWidth?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.md};
    font-weight: 500;
    transition: all ${({ theme }) => theme.transition.fast};
    white-space: nowrap;

    ${({ $variant }) => variantStyles[$variant]}
    ${({ $size }) => sizeStyles[$size]}
    ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const StyledLink = styled.a<{ $variant: Variant; $size: Size; $fullWidth?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.md};
    font-weight: 500;
    transition: all ${({ theme }) => theme.transition.fast};
    white-space: nowrap;

    ${({ $variant }) => variantStyles[$variant]}
    ${({ $size }) => sizeStyles[$size]}
    ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}

    svg {
        width: 16px;
        height: 16px;
    }
`;

export const Spinner = styled.span<{ $variant: Variant }>`
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid ${({ $variant }) => $variant === 'primary' ? 'white' : 'currentColor'};
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    flex-shrink: 0;

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
