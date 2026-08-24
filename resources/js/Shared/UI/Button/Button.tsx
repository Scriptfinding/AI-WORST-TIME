import React from 'react';
import * as S from './styled';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'info';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'info';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    children,
    disabled,
    type = 'button',
    ...props
}: ButtonProps) {
    return (
        <S.StyledButton
            $variant={variant}
            $size={size}
            $fullWidth={fullWidth}
            type={type}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <S.Spinner $variant={variant} />}
            {children}
        </S.StyledButton>
    );
}

export function ButtonLink({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    children,
    ...props
}: ButtonLinkProps) {
    return (
        <S.StyledLink
            $variant={variant}
            $size={size}
            $fullWidth={fullWidth}
            {...props}
        >
            {children}
        </S.StyledLink>
    );
}
