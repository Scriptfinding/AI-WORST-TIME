import React from 'react';
import * as S from './styled';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <S.Container>
            {icon && <S.Icon>{icon}</S.Icon>}
            <S.Title>{title}</S.Title>
            {description && <S.Description>{description}</S.Description>}
            {action}
        </S.Container>
    );
}
