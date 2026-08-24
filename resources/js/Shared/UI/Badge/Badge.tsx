import React from 'react';
import * as S from './styled';

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
    dot?: boolean;
    spinner?: boolean;
    children: React.ReactNode;
}

export default function Badge({ variant = 'default', dot = false, spinner = false, children }: BadgeProps) {
    return (
        <S.StyledBadge $variant={variant}>
            {spinner && <S.BadgeSpinner />}
            {dot && !spinner && <S.Dot $variant={variant} />}
            {children}
        </S.StyledBadge>
    );
}
