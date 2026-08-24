import React from 'react';
import { usePageProps } from '@/App/Hooks/usePageProps';
import { usePageTitle } from '@/App/Utils/documentTitle';
import * as S from './styled';

interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
    const { branding } = usePageProps();
    usePageTitle(title);

    return (
        <S.Container>
            <S.Card>
                <S.Brand>
                    <S.BrandIcon src={branding.logo_url} alt={branding.name} />
                    <S.BrandName>{branding.name}</S.BrandName>
                </S.Brand>
                <S.Title>{title}</S.Title>
                {subtitle && <S.Subtitle>{subtitle}</S.Subtitle>}
                {children}
                {footer && <S.Footer>{footer}</S.Footer>}
            </S.Card>
        </S.Container>
    );
}
