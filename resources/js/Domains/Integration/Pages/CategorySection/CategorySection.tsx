import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    label: string;
    icon: string;
    description: string;
    children: React.ReactNode;
}

export default function CategorySection({ label, icon, description, children }: Props) {
    return (
        <S.Section>
            <S.Header>
                <S.IconWrapper>
                    <Icon icon={icon} width={16} height={16} />
                </S.IconWrapper>
                <S.Title>{label}</S.Title>
            </S.Header>
            <S.Description>{description}</S.Description>
            <S.Grid>{children}</S.Grid>
        </S.Section>
    );
}
